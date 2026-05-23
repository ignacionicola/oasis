"""
Rutas de la API — Savings Goals.

CRUD de metas de ahorro + aportes/retiros. El response incluye
months_remaining y monthly_required calculados al vuelo.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import SavingsGoal, User
from app.models.schemas import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalContribution,
    SavingsGoalResponse,
)

router = APIRouter(prefix="/savings", tags=["Savings"])


def _months_remaining(target_date: date) -> int:
    """Meses entre hoy y la fecha objetivo (no negativo)."""
    today = date.today()
    months = (target_date.year - today.year) * 12 + (target_date.month - today.month)
    return max(0, months)


def _build_response(goal: SavingsGoal) -> SavingsGoalResponse:
    """Arma el response agregando los campos calculados."""
    months = _months_remaining(goal.target_date)
    remaining = max(0.0, goal.target_amount - goal.current_amount)

    if months > 0:
        monthly_required = round(remaining / months, 2)
    else:
        # Sin meses por delante (vencida o este mes): hace falta el total restante.
        monthly_required = round(remaining, 2)

    return SavingsGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        color=goal.color,
        completed=goal.completed,
        created_at=goal.created_at,
        months_remaining=months,
        monthly_required=monthly_required,
    )


def _get_owned(goal_id: int, db: Session, user: User) -> SavingsGoal:
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta de ahorro no encontrada")
    if goal.user_id != user.id:
        raise HTTPException(status_code=403, detail="No tenés permiso sobre esta meta")
    return goal


def _sync_completed(goal: SavingsGoal) -> None:
    """Marca completed si se alcanzó el objetivo."""
    goal.completed = goal.current_amount >= goal.target_amount


@router.post("/", response_model=SavingsGoalResponse, status_code=201)
def create_goal(
    data: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = SavingsGoal(
        user_id=current_user.id,
        name=data.name,
        target_amount=data.target_amount,
        current_amount=0.0,
        target_date=data.target_date,
        color=data.color or "#1D9E75",
        completed=False,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _build_response(goal)


@router.get("/", response_model=list[SavingsGoalResponse])
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == current_user.id)
        # no completadas primero, luego por fecha objetivo más cercana
        .order_by(SavingsGoal.completed.asc(), SavingsGoal.target_date.asc())
        .all()
    )
    return [_build_response(g) for g in goals]


@router.get("/{goal_id}", response_model=SavingsGoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_owned(goal_id, db, current_user)
    return _build_response(goal)


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_goal(
    goal_id: int,
    data: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_owned(goal_id, db, current_user)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(goal, field, value)
    _sync_completed(goal)
    db.commit()
    db.refresh(goal)
    return _build_response(goal)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_owned(goal_id, db, current_user)
    db.delete(goal)
    db.commit()


@router.post("/{goal_id}/contribute", response_model=SavingsGoalResponse)
def contribute(
    goal_id: int,
    data: SavingsGoalContribution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_owned(goal_id, db, current_user)
    goal.current_amount = round(goal.current_amount + data.amount, 2)
    _sync_completed(goal)
    db.commit()
    db.refresh(goal)
    return _build_response(goal)


@router.post("/{goal_id}/withdraw", response_model=SavingsGoalResponse)
def withdraw(
    goal_id: int,
    data: SavingsGoalContribution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_owned(goal_id, db, current_user)
    new_amount = goal.current_amount - data.amount
    if new_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="No podés retirar más de lo ahorrado",
        )
    goal.current_amount = round(new_amount, 2)
    _sync_completed(goal)
    db.commit()
    db.refresh(goal)
    return _build_response(goal)
