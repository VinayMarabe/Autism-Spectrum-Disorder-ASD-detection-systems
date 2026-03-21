from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import List

from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent
ROOT_DIR = BASE_DIR.parent

load_dotenv(ROOT_DIR / ".env", override=False)
load_dotenv(BASE_DIR / ".env", override=False)


def _default_rag_sources() -> List[Path]:
    candidates = [
        ROOT_DIR / "asdPROJECT" / "NEW_ASD_cleaned.csv",
        ROOT_DIR / "asdPROJECT" / "mri_labels.csv",
        ROOT_DIR / "data" / "ABIDE_ASD_CONTROL_combined_sorted.csv",
        BASE_DIR / "reports_v2",
    ]
    return [p for p in candidates if p.exists()]


@dataclass
class Settings:
    groq_api_key: str | None = os.getenv("GROQ_API_KEY")
    groq_model: str = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
    database_url: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{(BASE_DIR / 'app_data.db').as_posix()}"
    )
    rag_sources: List[Path] = field(
        default_factory=lambda: _parse_sources(os.getenv("RAG_SOURCES"))
    )
    rag_max_docs: int = int(os.getenv("RAG_MAX_DOCS", "4"))
    rag_force_rebuild: bool = os.getenv("RAG_FORCE_REBUILD", "false").lower() == "true"
    frontend_origins: List[str] = field(
        default_factory=lambda: _parse_origins(os.getenv("FRONTEND_ORIGINS", "*"))
    )
    default_doctor_name: str = os.getenv("CHAT_DOCTOR_NAME", "dr.THYNK")


def _parse_sources(raw: str | None) -> List[Path]:
    if not raw:
        return _default_rag_sources()
    items = [Path(item.strip()) for item in raw.split(",") if item.strip()]
    resolved = []
    for item in items:
        resolved.append(item if item.is_absolute() else (ROOT_DIR / item))
    return [p for p in resolved if p.exists()]


def _parse_origins(raw: str) -> List[str]:
    if not raw:
        return ["*"]
    return [item.strip() for item in raw.split(",") if item.strip()]


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    if not settings.rag_sources:
        settings.rag_sources = _default_rag_sources()
    return settings
