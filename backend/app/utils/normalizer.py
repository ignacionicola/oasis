"""
Data Normalizer — Unifica todas las fuentes de entrada en un formato común.

Fase 1: Solo normaliza input manual.
Fase 2: Agregará normalización de Whisper output y OCR output.
"""

from datetime import date
from dataclasses import dataclass
import re


@dataclass
class NormalizedExpense:
    """Formato unificado para cualquier fuente de entrada."""
    amount: float
    description: str
    date: date
    source: str  # manual | voice | ocr
    raw_input: str | None = None  # Input original sin procesar

    def to_dict(self) -> dict:
        return {
            "amount": self.amount,
            "description": self.description,
            "date": self.date.isoformat(),
            "source": self.source,
        }


def normalize_manual_input(
    amount: float,
    description: str,
    expense_date: date | None = None,
) -> NormalizedExpense:
    """Normaliza un input manual del formulario."""
    clean_description = _clean_text(description)

    return NormalizedExpense(
        amount=round(amount, 2),
        description=clean_description,
        date=expense_date or date.today(),
        source="manual",
        raw_input=description,
    )


def normalize_voice_input(transcription: str) -> NormalizedExpense:
    """
    Normaliza output de Whisper.
    Fase 2: Extraerá monto y descripción del texto transcripto.
    Ejemplo: "Gasté dos mil pesos en el super" → amount=2000, desc="super"
    """
    raise NotImplementedError("Voice normalization disponible en Fase 2")


def normalize_ocr_input(ocr_data: dict) -> NormalizedExpense:
    """
    Normaliza output de OCR (Google Vision / Tesseract).
    Fase 2: Extraerá monto total y comercio del ticket.
    """
    raise NotImplementedError("OCR normalization disponible en Fase 2")


def _clean_text(text: str) -> str:
    """Limpia y normaliza texto de descripción."""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)  # Múltiples espacios → uno
    if text:
        text = text[0].upper() + text[1:]  # Capitalize primera letra
    return text
