"""
Rutas de la API — Dashboard.

Endpoints para el resumen mensual y estadísticas.
"""

from datetime import date
from calendar import monthrange
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Expense, Income, User
from app.models.schemas import MonthSummary, BudgetStatus
from app.skills.budget_alert import get_all_budget_status

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

MONTH_NAMES_ES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
}


@router.get("/summary", response_model=MonthSummary)
def get_month_summary(
    month: int = Query(default=None, ge=1, le=12),
    year: int = Query(default=None, ge=2020),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    month = month or today.month
    year = year or today.year

    income_total = db.query(func.sum(Income.amount)).filter(
        and_(
            extract("month", Income.date) == month,
            extract("year", Income.date) == year,
            Income.user_id == current_user.id,
        )
    ).scalar() or 0.0

    expenses = (
        db.query(Expense)
        .filter(
            and_(
                extract("month", Expense.date) == month,
                extract("year", Expense.date) == year,
                Expense.is_duplicate == False,
                Expense.user_id == current_user.id,
            )
        )
        .all()
    )

    total_spent = sum(e.amount for e in expenses)
    expense_count = len(expenses)

    by_category: dict[str, float] = {}
    for e in expenses:
        by_category[e.category] = by_category.get(e.category, 0) + e.amount

    days_in_month = monthrange(year, month)[1]
    if month == today.month and year == today.year:
        elapsed_days = today.day
    else:
        elapsed_days = days_in_month
    daily_average = total_spent / elapsed_days if elapsed_days > 0 else 0

    top_category = max(by_category, key=by_category.get) if by_category else "Ninguna"

    budget_status_raw = get_all_budget_status(db, year, month)
    budget_status = [BudgetStatus(**bs) for bs in budget_status_raw]

    total_income = round(float(income_total), 2)

    return MonthSummary(
        month=MONTH_NAMES_ES[month],
        month_number=month,
        year=year,
        total_spent=round(total_spent, 2),
        total_income=total_income,
        available=round(total_income - total_spent, 2),
        expense_count=expense_count,
        by_category={k: round(v, 2) for k, v in by_category.items()},
        daily_average=round(daily_average, 2),
        top_category=top_category,
        budget_status=budget_status,
    )


@router.get("/categories")
def get_categories_breakdown(
    month: int = Query(default=None, ge=1, le=12),
    year: int = Query(default=None, ge=2020),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    month = month or today.month
    year = year or today.year

    results = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        )
        .filter(
            and_(
                extract("month", Expense.date) == month,
                extract("year", Expense.date) == year,
                Expense.is_duplicate == False,
                Expense.user_id == current_user.id,
            )
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    return [
        {
            "category": r.category,
            "total": round(float(r.total), 2),
            "count": r.count,
        }
        for r in results
    ]
