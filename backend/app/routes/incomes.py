from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, and_

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Income, User
from app.models.schemas import IncomeCreate, IncomeResponse

router = APIRouter(prefix="/incomes", tags=["Incomes"])


@router.post("/", response_model=IncomeResponse, status_code=201)
def create_income(
    data: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    income = Income(
        amount=data.amount,
        description=data.description,
        date=data.income_date,
        user_id=current_user.id,
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.get("/", response_model=list[IncomeResponse])
def list_incomes(
    month: int | None = Query(default=None, ge=1, le=12),
    year: int | None = Query(default=None, ge=2020),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Income).filter(Income.user_id == current_user.id)
    if month is not None:
        query = query.filter(extract("month", Income.date) == month)
    if year is not None:
        query = query.filter(extract("year", Income.date) == year)
    return query.order_by(Income.date.desc()).all()


@router.delete("/{income_id}", status_code=204)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    income = db.query(Income).filter(Income.id == income_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    if income.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tenés permiso para eliminar este ingreso")
    db.delete(income)
    db.commit()
