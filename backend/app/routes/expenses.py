"""
Rutas de la API — Expenses.

Endpoints para crear, listar, actualizar y eliminar gastos.
El POST /expenses ejecuta el pipeline completo:
  Input Agent → Data Normalizer → Analysis Agent → DB
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, and_

from app.database import get_db
from app.models import Expense
from app.models.schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseWithAlert,
)
from app.agents.input_agent import InputAgent
from app.agents.analysis_agent import AnalysisAgent

router = APIRouter(prefix="/expenses", tags=["Gastos"])

input_agent = InputAgent()
analysis_agent = AnalysisAgent()


@router.post("/", response_model=ExpenseWithAlert, status_code=201)
async def create_expense(
    expense_data: ExpenseCreate,
    force_save: bool = Query(False, description="Guardar aunque sea duplicado"),
    db: Session = Depends(get_db),
):
    """
    Crea un nuevo gasto ejecutando el pipeline completo:
    1. Input Agent normaliza la entrada
    2. Analysis Agent categoriza, detecta duplicados, chequea presupuesto
    3. Se guarda en la DB

    Si se detecta un posible duplicado, devuelve warning pero guarda igual
    (a menos que force_save=False y haya duplicado, en cuyo caso marca is_duplicate).
    """
    # 1. Input Agent → normalizar
    normalized = await input_agent.process_manual(
        amount=expense_data.amount,
        description=expense_data.description,
        expense_date=expense_data.expense_date,
    )

    # 2. Analysis Agent → categorizar + analizar
    analysis = await analysis_agent.analyze(
        normalized=normalized,
        db=db,
        force_category=expense_data.category,
    )

    # 3. Guardar en DB
    is_dup = bool(analysis["duplicate_warning"]) and not force_save
    expense = analysis_agent.save_expense(
        normalized=normalized,
        analysis=analysis,
        db=db,
        is_duplicate=is_dup,
    )

    return ExpenseWithAlert(
        expense=ExpenseResponse.model_validate(expense),
        alert=analysis["budget_alert"],
        duplicate_warning=analysis["duplicate_warning"],
    )


@router.get("/", response_model=list[ExpenseResponse])
def list_expenses(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020),
    category: str | None = None,
    search: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Lista gastos con filtros opcionales por mes, año, categoría y búsqueda."""
    query = db.query(Expense).filter(Expense.is_duplicate == False)

    if month:
        query = query.filter(extract("month", Expense.date) == month)
    if year:
        query = query.filter(extract("year", Expense.date) == year)
    if category:
        query = query.filter(Expense.category == category)
    if search:
        query = query.filter(Expense.description.ilike(f"%{search}%"))

    expenses = (
        query.order_by(Expense.date.desc(), Expense.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [ExpenseResponse.model_validate(e) for e in expenses]


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    """Obtiene un gasto por ID."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return ExpenseResponse.model_validate(expense)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    update_data: ExpenseUpdate,
    db: Session = Depends(get_db),
):
    """Actualiza un gasto existente."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Elimina un gasto."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    db.delete(expense)
    db.commit()
