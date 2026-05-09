"""
Skill: Detección de gastos duplicados.

Busca gastos similares en monto + fecha para evitar
que el usuario registre el mismo gasto dos veces.
"""

from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models import Expense


def check_duplicate(
    db: Session,
    amount: float,
    expense_date: date,
    description: str,
    tolerance_amount: float = 0.01,  # Tolerancia de centavos
    tolerance_days: int = 1,  # Buscar en rango de ±1 día
) -> dict | None:
    """
    Busca posibles duplicados basándose en monto similar y fecha cercana.

    Returns:
        None si no hay duplicados, o un dict con info del duplicado.
    """
    date_start = expense_date - timedelta(days=tolerance_days)
    date_end = expense_date + timedelta(days=tolerance_days)
    amount_min = amount * (1 - tolerance_amount)
    amount_max = amount * (1 + tolerance_amount)

    candidates = (
        db.query(Expense)
        .filter(
            and_(
                Expense.date >= date_start,
                Expense.date <= date_end,
                Expense.amount >= amount_min,
                Expense.amount <= amount_max,
                Expense.is_duplicate == False,
            )
        )
        .all()
    )

    if not candidates:
        return None

    # Buscar el más similar por descripción
    best_match = None
    best_score = 0.0

    for candidate in candidates:
        score = _similarity_score(description, candidate.description)
        if score > best_score:
            best_score = score
            best_match = candidate

    # Umbral: si la similitud es > 60%, considerarlo posible duplicado
    if best_score > 0.6 and best_match:
        return {
            "is_possible_duplicate": True,
            "existing_expense_id": best_match.id,
            "existing_description": best_match.description,
            "existing_amount": best_match.amount,
            "existing_date": best_match.date.isoformat(),
            "similarity_score": round(best_score, 2),
            "message": (
                f"Gasto similar encontrado: ${best_match.amount:.2f} "
                f"- '{best_match.description}' del {best_match.date.isoformat()}"
            ),
        }

    return None


def _similarity_score(text1: str, text2: str) -> float:
    """
    Calcula similitud simple entre dos textos.
    Usa similitud de Jaccard sobre palabras.
    """
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())

    if not words1 or not words2:
        return 0.0

    intersection = words1 & words2
    union = words1 | words2

    return len(intersection) / len(union)
