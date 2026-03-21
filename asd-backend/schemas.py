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


# ---- NEW SCHEMAS FOR HUMAN CHAT, APPOINTMENTS, NOTIFICATIONS ----

class HumanChatMessageBase(BaseModel):
    sender_role: str
    recipient_id: Optional[str] = None
    content: str
    sources: Optional[dict[str, Any]] = None

class HumanChatMessageCreate(HumanChatMessageBase):
    pass

class HumanChatMessageResponse(HumanChatMessageBase):
    id: int
    patient_id: str
    created_at: datetime

    class Config:
        orm_mode = True


class AppointmentBase(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = "admin"
    date: str
    time: str
    symptoms: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdateStatus(BaseModel):
    status: str

class AppointmentResponse(AppointmentBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class NotificationBase(BaseModel):
    user_id: str
    role: str
    title: str
    message: str

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    is_read: int
    created_at: datetime

    class Config:
        orm_mode = True
