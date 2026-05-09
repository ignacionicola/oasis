"""
Skill: Categorización automática de gastos usando Claude API.

Recibe una descripción de gasto y devuelve la categoría más probable
junto con un score de confianza.
"""

import json
from anthropic import Anthropic
from app.config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """Sos un asistente de finanzas personales. Tu única tarea es categorizar gastos.

Categorías válidas:
- Comida: supermercado, restaurantes, delivery, almacén, verdulería, carnicería, panadería
- Transporte: nafta, colectivo, uber, taxi, estacionamiento, peaje, mecánico
- Salud: farmacia, médico, obra social, análisis, turnos
- Hogar: alquiler, expensas, arreglos, muebles, electrodomésticos, limpieza
- Servicios: luz, gas, agua, internet, teléfono, streaming, seguros
- Entretenimiento: cine, salidas, juegos, libros, hobbies, vacaciones
- Ropa: indumentaria, calzado, accesorios
- Educación: cursos, materiales, cuotas, libros de estudio
- Otros: lo que no encaje en ninguna otra

Respondé SOLAMENTE con un JSON válido, sin texto adicional:
{"category": "Categoría", "confidence": 0.95}

El campo confidence va de 0.0 a 1.0 indicando qué tan seguro estás.
"""


async def categorize_expense(description: str) -> dict:
    """
    Categoriza un gasto usando Claude API.

    Returns:
        {"category": str, "confidence": float}
    """
    # Si no hay API key, usar fallback basado en reglas
    if not settings.anthropic_api_key:
        return _rule_based_categorization(description)

    try:
        client = Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=100,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Categorizá este gasto: \"{description}\"",
                }
            ],
        )

        response_text = message.content[0].text.strip()

        # Limpiar posibles backticks de markdown
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[-1].rsplit("```", 1)[0]

        result = json.loads(response_text)

        # Validar que la categoría sea válida
        if result.get("category") not in settings.expense_categories:
            result["category"] = "Otros"
            result["confidence"] = max(result.get("confidence", 0.5) - 0.2, 0.3)

        return {
            "category": result["category"],
            "confidence": round(result.get("confidence", 0.8), 2),
        }

    except Exception:
        # Fallback silencioso a reglas locales
        return _rule_based_categorization(description)


def _rule_based_categorization(description: str) -> dict:
    """
    Categorización offline basada en keywords.
    Funciona sin API key — perfecto para desarrollo.
    """
    desc_lower = description.lower()

    rules = {
        "Comida": [
            "super", "mercado", "almacén", "almacen", "carnicería", "carniceria",
            "verdulería", "verduleria", "panadería", "panaderia", "restaurante",
            "pizza", "empanadas", "delivery", "rappi", "pedidosya", "comida",
            "café", "cafe", "helado", "kiosco", "fiambrería", "fiambreria",
            "coto", "carrefour", "disco", "jumbo", "dia", "chino",
        ],
        "Transporte": [
            "nafta", "combustible", "ypf", "shell", "uber", "cabify",
            "taxi", "remis", "colectivo", "sube", "estacionamiento",
            "peaje", "mecánico", "mecanico", "taller", "gnc",
        ],
        "Salud": [
            "farmacia", "médico", "medico", "doctor", "hospital", "clínica",
            "clinica", "análisis", "analisis", "obra social", "prepaga",
            "odontólogo", "odontologo", "dentista", "óptica", "optica",
        ],
        "Hogar": [
            "alquiler", "expensas", "arreglo", "plomero", "electricista",
            "pintura", "mueble", "electrodoméstico", "electrodomestico",
            "ferretería", "ferreteria", "limpieza",
        ],
        "Servicios": [
            "luz", "edenor", "edesur", "gas", "metrogas", "agua", "aysa",
            "internet", "fibertel", "telecentro", "personal", "claro",
            "movistar", "netflix", "spotify", "disney", "hbo", "flow",
            "seguro", "impuesto", "monotributo", "abl",
        ],
        "Entretenimiento": [
            "cine", "teatro", "salida", "bar", "boliche", "juego",
            "playstation", "steam", "libro", "hobby", "viaje", "hotel",
            "vacaciones",
        ],
        "Ropa": [
            "ropa", "zapatillas", "zapatos", "remera", "pantalón", "pantalon",
            "campera", "zara", "nike", "adidas",
        ],
        "Educación": [
            "curso", "universidad", "facultad", "colegio", "cuota",
            "material", "apunte", "udemy", "platzi",
        ],
    }

    for category, keywords in rules.items():
        for keyword in keywords:
            if keyword in desc_lower:
                return {"category": category, "confidence": 0.75}

    return {"category": "Otros", "confidence": 0.5}
