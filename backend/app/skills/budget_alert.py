"""
Skill: Alertas de presupuesto por categoría.

Calcula cuánto se gastó en una categoría este mes
y genera alertas cuando se acerca o supera el límite.
"""

from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_

from app.models import Expense, Budget


def check_budget_alert(
    db: Session,
    category: str,
    new_amount: float = 0,
) -> dict | None:
    """
    Verifica el estado del presupuesto para una categoría.

    Returns:
        Alerta si el gasto supera umbrales, None si está todo bien.
    """
    budget = db.query(Budget).filter(Budget.category == category).first()
    if not budget or not budget.is_active:
        return None

    today = date.today()
    month_spent = _get_month_spent(db, category, today.year, today.month)
    total_with_new = month_spent + new_amount
    percentage = (total_with_new / budget.monthly_limit) * 100

    alert_level = _get_alert_level(percentage)

    if alert_level == "ok":
        return None

    return {
        "category": category,
        "monthly_limit": budget.monthly_limit,
        "spent": round(total_with_new, 2),
        "remaining": round(max(budget.monthly_limit - total_with_new, 0), 2),
        "percentage_used": round(percentage, 1),
        "alert_level": alert_level,
        "message": _build_alert_message(category, percentage, budget.monthly_limit, total_with_new),
    }


def get_all_budget_status(db: Session, year: int, month: int) -> list[dict]:
    """Devuelve el estado de TODOS los presupuestos activos."""
    budgets = db.query(Budget).filter(Budget.is_active == True).all()
    statuses = []

    for budget in budgets:
        spent = _get_month_spent(db, budget.category, year, month)
        percentage = (spent / budget.monthly_limit) * 100 if budget.monthly_limit > 0 else 0

        statuses.append({
            "category": budget.category,
            "monthly_limit": budget.monthly_limit,
            "spent": round(spent, 2),
            "remaining": round(max(budget.monthly_limit - spent, 0), 2),
            "percentage_used": round(percentage, 1),
            "alert_level": _get_alert_level(percentage),
        })

    return statuses


def _get_month_spent(db: Session, category: str, year: int, month: int) -> float:
    """Calcula el total gastado en una categoría para un mes."""
    result = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            and_(
                Expense.category == category,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
                Expense.is_duplicate == False,
            )
        )
        .scalar()
    )
    return float(result)


def _get_alert_level(percentage: float) -> str:
    if percentage >= 100:
        return "danger"
    elif percentage >= 80:
        return "warning"
    return "ok"


def _build_alert_message(
    category: str, percentage: float, limit: float, spent: float
) -> str:
    if percentage >= 100:
        over = spent - limit
        return (
            f"⚠️ Superaste el presupuesto de {category}. "
            f"Gastaste ${spent:,.0f} de ${limit:,.0f} "
            f"(${over:,.0f} por encima del límite)"
        )
    else:
        remaining = limit - spent
        return (
            f"⚡ Atención: usaste el {percentage:.0f}% del presupuesto de {category}. "
            f"Te quedan ${remaining:,.0f} para este mes."
        )
