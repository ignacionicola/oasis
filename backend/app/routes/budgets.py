"""
Rutas de la API — Budgets.

CRUD de presupuestos por categoría.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Budget, User
from app.models.schemas import BudgetCreate, BudgetUpdate, BudgetResponse
from app.config import get_settings

router = APIRouter(prefix="/budgets", tags=["Presupuestos"])
settings = get_settings()


@router.post("/", response_model=BudgetResponse, status_code=201)
def create_budget(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Budget).filter(Budget.category == budget_data.category).first()
    if existing:
        existing.monthly_limit = budget_data.monthly_limit
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return BudgetResponse.model_validate(existing)

    budget = Budget(
        category=budget_data.category,
        monthly_limit=budget_data.monthly_limit,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return BudgetResponse.model_validate(budget)


@router.get("/", response_model=list[BudgetResponse])
def list_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budgets = db.query(Budget).all()
    return [BudgetResponse.model_validate(b) for b in budgets]


@router.put("/{category}", response_model=BudgetResponse)
def update_budget(
    category: str,
    update_data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = db.query(Budget).filter(Budget.category == category).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    budget.monthly_limit = update_data.monthly_limit
    budget.is_active = update_data.is_active
    db.commit()
    db.refresh(budget)
    return BudgetResponse.model_validate(budget)


@router.post("/init-defaults", status_code=201)
def init_default_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created = []
    for category, limit in settings.default_budgets.items():
        existing = db.query(Budget).filter(Budget.category == category).first()
        if not existing:
            budget = Budget(category=category, monthly_limit=limit)
            db.add(budget)
            created.append(category)

    db.commit()
    return {"message": f"Presupuestos creados: {', '.join(created) or 'ninguno (ya existían)'}"}
