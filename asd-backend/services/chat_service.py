from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

from config import get_settings
from models import Patient
from schemas import ChatHistoryMessage, ChatResponse, RetrievedContext
from . import patient_service
from .llm_client import GroqChatClient
from .rag_service import RAGService

settings = get_settings()


class ChatService:
    def __init__(self, rag_service: RAGService):
        self.rag = rag_service
        self.llm = GroqChatClient(api_key=settings.groq_api_key, model=settings.groq_model)

    def build_system_prompt(self) -> str:
        return (
            f"You are {settings.default_doctor_name}, an experienced pediatric neurologist. "
            "Use only the provided patient context, retrieved evidence, and screening outputs to answer. "
            "Highlight key observations, suggest follow-up actions, and avoid medical prescriptions. "
            "If information is missing, remind the user to consult a clinician."
        )

    def compose_messages(
        self,
        *,
        patient: Patient,
        user_message: str,
        context_blocks: List[dict],
        chat_history: List,
    ) -> List[dict]:
        messages = [{"role": "system", "content": self.build_system_prompt()}]

        history_sorted = sorted(chat_history, key=lambda x: x.created_at)
        for entry in history_sorted[-6:]:
            messages.append({"role": entry.role, "content": entry.content})

        patient_summary = self._summarize_patient(patient, context_blocks)
        user_content = f"Patient summary:\n{patient_summary}\n\nQuestion: {user_message}"
        messages.append({"role": "user", "content": user_content})
        return messages

    def _summarize_patient(self, patient: Patient, contexts: List[dict]) -> str:
        pieces = [
            f"Name: {patient.name}",
            f"Age: {patient.age or 'Unknown'}",
            f"Gender: {patient.gender or 'Unknown'}",
        ]
        if patient.notes:
            pieces.append(f"Notes: {patient.notes}")
        if contexts:
            top = contexts[0]
            pieces.append(f"Top retrieved context snippet: {top['text'][:280]}")
        return " | ".join(pieces)

    def answer(self, db: Session, *, patient: Patient, question: str) -> ChatResponse:
        context_blocks = self.rag.retrieve(patient_id=patient.id, query=question)
        history = patient_service.get_chat_history(db, patient.id, limit=10)
        messages = self.compose_messages(
            patient=patient,
            user_message=question,
            context_blocks=context_blocks,
            chat_history=history,
        )
        reply = self.llm.chat(messages)

        patient_service.add_chat_message(db, patient_id=patient.id, role="user", content=question, sources=None)
        patient_service.add_chat_message(
            db,
            patient_id=patient.id,
            role="assistant",
            content=reply,
            sources=context_blocks,
        )
        history = patient_service.get_chat_history(db, patient.id, limit=20)
        evidence = [RetrievedContext(**ctx) for ctx in context_blocks]
        history_payload = [
            ChatHistoryMessage(
                role=item.role,
                content=item.content,
                created_at=item.created_at,
                sources=item.sources,
            )
            for item in history
        ]
        history_payload.reverse()
        return ChatResponse(reply=reply, evidence=evidence, history=history_payload)
