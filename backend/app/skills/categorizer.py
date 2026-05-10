"""
Skill: Categorización automática de gastos basada en reglas.

Recibe una descripción de gasto y devuelve la categoría más probable
junto con un score de confianza.
"""


def categorize_expense(description: str) -> dict:
    """
    Categoriza un gasto usando reglas locales.

    Returns:
        {"category": str, "confidence": float}
    """
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
