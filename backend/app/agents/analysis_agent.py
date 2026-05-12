"""
Analysis Agent — Analiza gastos normalizados.

Orquesta tres skills:
1. Categorización automática (Claude API + fallback reglas)
2. Detección de duplicados
3. Alertas de presupuesto

Recibe un NormalizedExpense del Input Agent y devuelve
el gasto categorizado con metadata de análisis.
"""

from datetime import date
from sqlalchemy.orm import Session

from app.utils.normalizer import NormalizedExpense
from app.skills.categorizer import categorize_expense
from app.skills.duplicate_detector import check_duplicate
from app.skills.budget_alert import check_budget_alert
from app.models import Expense


class AnalysisAgent:
    """
    Agente que analiza cada gasto antes de guardarlo.
    Ejecuta categorización, chequeo de duplicados y alertas.
    """

    async def analyze(
        self,
        normalized: NormalizedExpense,
        db: Session,
        force_category: str | None = None,
    ) -> dict:
        """
        Analiza un gasto normalizado.

        Args:
            normalized: Gasto normalizado del Input Agent
            db: Sesión de base de datos
            force_category: Si el usuario eligió categoría manual

        Returns:
            {
                "category": str,
                "confidence": float,
                "duplicate_warning": dict | None,
                "budget_alert": dict | None,
            }
        """
        # 1. Categorización
        if force_category:
            category = force_category
            confidence = 1.0
        else:
            cat_result = categorize_expense(normalized.description)
            category = cat_result["category"]
            confidence = cat_result["confidence"]

        # 2. Detección de duplicados
        duplicate_warning = check_duplicate(
            db=db,
            amount=normalized.amount,
            expense_date=normalized.date,
            description=normalized.description,
        )

        return {
            "category": category,
            "confidence": confidence,
            "duplicate_warning": duplicate_warning,
            "budget_alert": None,
        }

    def save_expense(
        self,
        normalized: NormalizedExpense,
        analysis: dict,
        db: Session,
        is_duplicate: bool = False,
        user_id: int | None = None,
    ) -> Expense:
        """Guarda el gasto analizado en la base de datos."""
        expense = Expense(
            amount=normalized.amount,
            description=normalized.description,
            category=analysis["category"],
            date=normalized.date,
            source=normalized.source,
            is_duplicate=is_duplicate,
            confidence=analysis["confidence"],
            user_id=user_id,
        )

        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense
