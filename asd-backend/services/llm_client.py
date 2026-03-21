from __future__ import annotations

from typing import List

try:
    from groq import Groq
except ImportError:  # pragma: no cover
    Groq = None  # type: ignore


class GroqChatClient:
    def __init__(self, *, api_key: str | None, model: str):
        if not api_key:
            raise RuntimeError("Missing GROQ_API_KEY in environment")
        if Groq is None:
            raise RuntimeError("groq package not installed; run pip install groq")
        self.client = Groq(api_key=api_key)
        self.model = model

    def chat(self, messages: List[dict]) -> str:
        response = self.client.chat.completions.create(model=self.model, messages=messages, temperature=0.2)
        return response.choices[0].message.content or ""
