"""
Input Agent — Orquesta todas las fuentes de entrada de gastos.

Fase 1: Solo maneja input manual.
Fase 2: Agrega Voice-to-Text (Whisper) y OCR.

Este agente recibe el input crudo del usuario, lo normaliza
a través del Data Normalizer, y lo pasa al Analysis Agent.
"""

from datetime import date
from app.utils.normalizer import (
    NormalizedExpense,
    normalize_manual_input,
)


class InputAgent:
    """
    Agente que recibe input de cualquier fuente y produce
    un NormalizedExpense listo para el Analysis Agent.
    """

    async def process_manual(
        self,
        amount: float,
        description: str,
        expense_date: date | None = None,
    ) -> NormalizedExpense:
        """Procesa un gasto ingresado manualmente."""
        return normalize_manual_input(amount, description, expense_date)

    async def process_voice(self, audio_data: bytes) -> NormalizedExpense:
        """
        Fase 2: Procesa audio con Whisper y extrae gasto.

        Pipeline:
        1. Enviar audio a Whisper API → transcripción
        2. Extraer monto y descripción con Claude
        3. Normalizar con normalize_voice_input()
        """
        raise NotImplementedError(
            "Voice input estará disponible en Fase 2. "
            "Usá input manual por ahora."
        )

    async def process_ocr(self, image_data: bytes) -> NormalizedExpense:
        """
        Fase 2: Procesa foto de ticket con OCR.

        Pipeline:
        1. Enviar imagen a Google Vision → texto extraído
        2. Parsear monto total y comercio con Claude
        3. Normalizar con normalize_ocr_input()
        """
        raise NotImplementedError(
            "OCR de tickets estará disponible en Fase 2. "
            "Usá input manual por ahora."
        )
