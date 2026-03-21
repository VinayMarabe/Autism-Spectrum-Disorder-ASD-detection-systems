from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

from bs4 import BeautifulSoup


def strip_html(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text(separator=" ", strip=True)


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def infer_patient_from_filename(path: Path) -> Optional[str]:
    name = path.stem
    tokens = re.split(r"[_-]", name)
    for token in tokens:
        clean = token.strip()
        if not clean:
            continue
        if any(ch.isdigit() for ch in clean):
            return clean
    return tokens[0] if tokens else None
