"""
Rutas de la API — Recurring Expenses.

CRUD de gastos recurrentes + toggle de activo/pausado.
La generación automática vive en app.skills.recurring_generator y se
dispara desde el dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import RecurringExpense, User
from app.models.schemas import (
    RecurringExpenseCreate,
    RecurringExpenseUpdate,
    RecurringExpenseResponse,
)

router = APIRouter(prefix="/recurring", tags=["Recurring"])


def _get_owned(recurring_id: int, db: Session, user: User) -> RecurringExpense:
    item = db.query(RecurringExpense).filter(RecurringExpense.id == recurring_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Gasto recurrente no encontrado")
    if item.user_id != user.id:
        raise HTTPException(status_code=403, detail="No tenés permiso sobre este gasto recurrente")
    return item


@router.post("/", response_model=RecurringExpenseResponse, status_code=201)
def create_recurring(
    data: RecurringExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = RecurringExpense(
        user_id=current_user.id,
        description=data.description,
        amount=data.amount,
        category=data.category,
        day_of_month=data.day_of_month,
        active=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[RecurringExpenseResponse])
def list_recurring(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(RecurringExpense)
        .filter(RecurringExpense.user_id == current_user.id)
        .order_by(RecurringExpense.created_at.desc())
        .all()
    )


@router.put("/{recurring_id}", response_model=RecurringExpenseResponse)
def update_recurring(
    recurring_id: int,
    data: RecurringExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = _get_owned(recurring_id, db, current_user)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{recurring_id}", status_code=204)
def delete_recurring(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = _get_owned(recurring_id, db, current_user)
    db.delete(item)
    db.commit()


@router.patch("/{recurring_id}/toggle", response_model=RecurringExpenseResponse)
def toggle_recurring(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = _get_owned(recurring_id, db, current_user)
    item.active = not item.active
    db.commit()
    db.refresh(item)
    return item
