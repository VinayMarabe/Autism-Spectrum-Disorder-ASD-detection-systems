from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from models import ChatMessage, Patient, ScreeningResult


def list_patients(db: Session) -> List[Patient]:
    return db.query(Patient).all()


def get_patient(db: Session, patient_id: str) -> Optional[Patient]:
    return db.query(Patient).filter(Patient.id == patient_id).first()


def upsert_patient(db: Session, *, patient_id: Optional[str], name: str, age: Optional[int], gender: Optional[str], notes: Optional[str], metadata: Optional[dict]) -> Patient:
    if patient_id:
        patient = get_patient(db, patient_id)
    else:
        patient = None
    if patient is None:
        patient = Patient(
            id=patient_id or _generate_patient_id(),
            name=name,
            age=age,
            gender=gender,
            notes=notes,
            metadata_json=metadata or {},
        )
        db.add(patient)
    else:
        patient.name = name
        patient.age = age
        patient.gender = gender
        patient.notes = notes
        patient.metadata_json = metadata or patient.metadata_json
        patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    return patient


def record_screening(
    db: Session,
    *,
    patient_id: str,
    predicted_class: Optional[str],
    prob_asd: Optional[float],
    severity_bucket: Optional[str],
    payload: Optional[dict],
) -> ScreeningResult:
    entry = ScreeningResult(
        patient_id=patient_id,
        predicted_class=predicted_class,
        prob_asd=prob_asd,
        severity_bucket=severity_bucket,
        payload=payload,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_chat_history(db: Session, patient_id: str, limit: int = 20) -> List[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.patient_id == patient_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )


def add_chat_message(db: Session, *, patient_id: str, role: str, content: str, sources: Optional[list]) -> ChatMessage:
    message = ChatMessage(
        patient_id=patient_id,
        role=role,
        content=content,
        sources=sources or [],
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def _generate_patient_id() -> str:
    from uuid import uuid4

    return f"P-{uuid4().hex[:8]}"
