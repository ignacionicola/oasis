from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, and_

from app.database import get_db
from app.models import Income
from app.models.schemas import IncomeCreate, IncomeResponse

router = APIRouter(prefix="/incomes", tags=["Incomes"])


@router.post("/", response_model=IncomeResponse, status_code=201)
def create_income(data: IncomeCreate, db: Session = Depends(get_db)):
    income = Income(
        amount=data.amount,
        description=data.description,
        date=data.income_date,
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
):
    query = db.query(Income)
    if month is not None:
        query = query.filter(extract("month", Income.date) == month)
    if year is not None:
        query = query.filter(extract("year", Income.date) == year)
    return query.order_by(Income.date.desc()).all()


@router.delete("/{income_id}", status_code=204)
def delete_income(income_id: int, db: Session = Depends(get_db)):
    income = db.query(Income).filter(Income.id == income_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    db.delete(income)
    db.commit()
