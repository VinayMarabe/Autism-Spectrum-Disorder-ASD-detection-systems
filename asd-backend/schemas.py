from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class ScreeningSummary(BaseModel):
    predicted_class: Optional[str] = None
    prob_asd: Optional[float] = None
    severity_bucket: Optional[str] = None
    created_at: Optional[datetime] = None


class PatientBase(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class PatientResponse(PatientBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    latest_screening: Optional[ScreeningSummary] = None


class PatientUpsert(BaseModel):
    id: Optional[str] = None
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class ChatHistoryMessage(BaseModel):
    role: str
    content: str
    created_at: datetime
    sources: Optional[list[dict[str, Any]]] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    patient: Optional[PatientUpsert] = None


class ScreeningPayload(BaseModel):
    predicted_class: Optional[str] = None
    prob_asd: Optional[float] = None
    severity_bucket: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class RetrievedContext(BaseModel):
    source: str
    text: str
    patient_id: Optional[str] = None
    score: float
    metadata: Optional[dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
    evidence: List[RetrievedContext]
    history: List[ChatHistoryMessage]
