from __future__ import annotations

from pathlib import Path
from typing import Iterable, List, Optional

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from config import ROOT_DIR, get_settings
from database import SessionLocal
from models import DocumentChunk
from utils.text import infer_patient_from_filename, normalize_whitespace, strip_html

settings = get_settings()


class RAGService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words="english", max_features=4096)
        self.doc_matrix = None
        self.docs: List[dict] = []

    def warm(self, force: bool = False) -> None:
        with SessionLocal() as db:
            if force or settings.rag_force_rebuild:
                db.query(DocumentChunk).delete()
                db.commit()
                self._ingest_sources(db)
            elif db.query(DocumentChunk).count() == 0:
                self._ingest_sources(db)
            self._hydrate_docs(db)

    def _hydrate_docs(self, db: Session) -> None:
        rows = db.query(DocumentChunk).all()
        self.docs = [
            {
                "id": row.id,
                "patient_id": row.patient_id,
                "source": row.source,
                "text": row.text,
                "metadata": row.metadata_json or {},
            }
            for row in rows
        ]
        if not self.docs:
            self.doc_matrix = None
            return
        texts = [doc["text"] for doc in self.docs]
        self.doc_matrix = self.vectorizer.fit_transform(texts)

    def _ingest_sources(self, db: Session) -> None:
        for path in settings.rag_sources:
            if path.is_dir():
                self._ingest_directory(db, path)
            elif path.suffix.lower() == ".csv":
                self._ingest_csv(db, path)
            elif path.suffix.lower() in {".html", ".htm"}:
                self._ingest_html(db, path)
        db.commit()

    def _ingest_directory(self, db: Session, directory: Path) -> None:
        for file_path in directory.rglob("*"):
            if not file_path.is_file():
                continue
            suffix = file_path.suffix.lower()
            if suffix == ".csv":
                self._ingest_csv(db, file_path)
            elif suffix in {".html", ".htm"}:
                self._ingest_html(db, file_path)

    def _ingest_html(self, db: Session, path: Path) -> None:
        try:
            text = strip_html(path)
        except Exception:
            return
        text = normalize_whitespace(text)
        if not text:
            return
        patient_id = infer_patient_from_filename(path)
        source = _safe_relative(path)
        chunk = DocumentChunk(
            patient_id=patient_id,
            source=source,
            chunk_id=path.stem,
            text=text[:2000],
            metadata_json={"kind": "report"},
        )
        db.add(chunk)

    def _ingest_csv(self, db: Session, path: Path) -> None:
        try:
            df = pd.read_csv(path)
        except Exception:
            return
        if df.empty:
            return
        id_column = _detect_column(df.columns, {"id", "subject", "patient"})
        name_column = _detect_column(df.columns, {"name"})
        rows: List[DocumentChunk] = []
        for _, row in df.iterrows():
            text_parts = []
            for col, value in row.items():
                if pd.isna(value) or value == "":
                    continue
                text_parts.append(f"{col}: {value}")
            if not text_parts:
                continue
            patient_id = str(row[id_column]) if id_column and not pd.isna(row[id_column]) else None
            metadata = {
                "source": str(path.name),
                "row_index": int(_),
            }
            if name_column and not pd.isna(row[name_column]):
                metadata["patient_name"] = str(row[name_column])
            source = _safe_relative(path)
            chunk = DocumentChunk(
                patient_id=patient_id,
                source=source,
                chunk_id=f"{path.stem}_{_}",
                text=normalize_whitespace("; ".join(text_parts))[:2000],
                metadata_json=metadata,
            )
            rows.append(chunk)
            if len(rows) >= 200:
                db.bulk_save_objects(rows)
                db.commit()
                rows.clear()
        if rows:
            db.bulk_save_objects(rows)
            db.commit()

    def add_document(self, *, patient_id: Optional[str], source: str, text: str, metadata: Optional[dict] = None) -> None:
        clean = normalize_whitespace(text)
        if not clean:
            return
        with SessionLocal() as db:
            actual_source = metadata.get("source") if metadata and metadata.get("source") else source
            chunk = DocumentChunk(
                patient_id=patient_id,
                source=actual_source,
                chunk_id=None,
                text=clean[:2000],
                metadata_json=metadata or {},
            )
            db.add(chunk)
            db.commit()
        self.warm(force=False)

    def retrieve(self, *, patient_id: Optional[str], query: str, limit: int | None = None) -> List[dict]:
        if not self.doc_matrix or not self.docs:
            return []
        limit = limit or settings.rag_max_docs
        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.doc_matrix).ravel()
        ranked_indices = scores.argsort()[::-1]
        contexts: List[dict] = []
        for idx in ranked_indices:
            doc = self.docs[idx]
            score = float(scores[idx])
            if patient_id and doc.get("patient_id") == patient_id:
                score += 0.1  # mild boost for patient-specific context
            contexts.append({
                "source": doc["source"],
                "text": doc["text"],
                "patient_id": doc.get("patient_id"),
                "score": round(score, 4),
                "metadata": doc.get("metadata"),
            })
            if len(contexts) >= limit:
                break
        return contexts


def _detect_column(columns: Iterable[str], keywords: set[str]) -> Optional[str]:
    for col in columns:
        lowered = col.lower()
        if any(keyword in lowered for keyword in keywords):
            return col
    return None


def _safe_relative(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT_DIR))
    except ValueError:
        return str(path)
