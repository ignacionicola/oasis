import json
import logging
import re

import google.generativeai as genai
from fastapi import HTTPException

from app.config import get_settings

logger = logging.getLogger(__name__)

_PROMPT = """Sos un experto en leer tickets de compra, facturas y comprobantes de pago (incluyendo capturas de Mercado Pago, transferencias bancarias, facturas A/B/C, y fotos de tickets físicos de supermercados, kioscos, restaurantes, etc).

Analizá la imagen y extraé:
1. El monto TOTAL pagado (el importe final, no subtotales ni items individuales). En comprobantes de Mercado Pago suele aparecer como "Pagaste", "Total", "Monto" o un número grande destacado. En tickets físicos suele estar al final como "TOTAL", "TOTAL A PAGAR", "IMPORTE".
2. El nombre del comercio, vendedor o motivo (ej: "Carrefour", "Kiosco Juan", "Transferencia a María"). Si es Mercado Pago y aparece un nombre de comercio o destinatario, usá ese.

Respondé EXCLUSIVAMENTE con un objeto JSON válido usando comillas dobles, sin markdown ni texto adicional. Formato exacto:
{"amount": 1234.56, "description": "Nombre del comercio", "confidence": 0.95}

Reglas:
- amount debe ser un número (float), sin símbolos de moneda ni separadores de miles. Usá punto como separador decimal.
- Si el monto en el ticket usa coma decimal (ej: $1.234,56), convertilo a 1234.56.
- Si no podés leer el monto con certeza, usá 0.
- description debe ser un string corto (máximo 50 caracteres). Si no podés identificar el comercio, usá "".
- confidence entre 0 y 1: qué tan seguro estás de los datos extraídos.
"""

_JSON_RE = re.compile(r"\{[^{}]*\}", re.DOTALL)

_MODEL_CANDIDATES = ("gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash-latest")


def _parse_response(raw: str) -> dict:
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    match = _JSON_RE.search(cleaned)
    if match:
        snippet = match.group(0).replace("'", '"')
        return json.loads(snippet)
    raise ValueError(f"No se pudo parsear JSON de la respuesta: {raw[:200]}")


async def scan_ticket(image_bytes: bytes, mime_type: str) -> dict:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada en el backend.")

    genai.configure(api_key=settings.gemini_api_key)
    image_part = {"mime_type": mime_type, "data": image_bytes}

    raw = ""
    last_exc: Exception | None = None
    for model_name in _MODEL_CANDIDATES:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([_PROMPT, image_part])
            raw = response.text or ""
            logger.info("Gemini (%s) raw response: %s", model_name, raw)
            last_exc = None
            break
        except Exception as exc:
            msg = str(exc)
            logger.warning("Falló %s: %s", model_name, msg[:200])
            last_exc = exc
            if "429" in msg or "quota" in msg.lower() or "rate" in msg.lower():
                continue
            break

    if last_exc is not None:
        msg = str(last_exc)
        if "429" in msg or "quota" in msg.lower():
            raise HTTPException(
                status_code=429,
                detail="Se agotó la cuota gratuita de Gemini. Esperá unos minutos y volvé a intentar.",
            )
        raise HTTPException(status_code=502, detail=f"Error consultando Gemini: {msg[:200]}")

    try:
        data = _parse_response(raw)
    except Exception as exc:
        logger.exception("Error parseando respuesta de Gemini: %s", raw)
        raise HTTPException(status_code=502, detail=f"Respuesta inválida de Gemini: {exc}") from exc

    try:
        amount = float(data.get("amount", 0) or 0)
    except (TypeError, ValueError):
        amount = 0.0
    description = str(data.get("description", "") or "").strip()[:50]
    try:
        confidence = float(data.get("confidence", 0) or 0)
    except (TypeError, ValueError):
        confidence = 0.0

    return {
        "amount": amount,
        "description": description,
        "confidence": max(0.0, min(1.0, confidence)),
    }
