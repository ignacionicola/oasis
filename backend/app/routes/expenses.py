"""
Rutas de la API — Expenses.

Endpoints para crear, listar, actualizar y eliminar gastos.
El POST /expenses ejecuta el pipeline completo:
  Input Agent → Data Normalizer → Analysis Agent → DB
"""

import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, and_

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Expense, User
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    normalized = await input_agent.process_manual(
        amount=expense_data.amount,
        description=expense_data.description,
        expense_date=expense_data.expense_date,
    )

    analysis = await analysis_agent.analyze(
        normalized=normalized,
        db=db,
        force_category=expense_data.category,
    )

    expense = analysis_agent.save_expense(
        normalized=normalized,
        analysis=analysis,
        db=db,
        is_duplicate=False,
        user_id=current_user.id,
    )

    return ExpenseWithAlert(
        expense=ExpenseResponse.model_validate(expense),
        alert=analysis.get("budget_alert"),
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
    current_user: User = Depends(get_current_user),
):
    query = db.query(Expense).filter(
        Expense.is_duplicate == False,
        Expense.user_id == current_user.id,
    )

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


@router.get("/export")
def export_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exporta todos los gastos del usuario a un CSV (UTF-8 con BOM)."""
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == current_user.id)
        .order_by(Expense.date.desc(), Expense.created_at.desc())
        .all()
    )

    buffer = io.StringIO()
    # BOM para que Excel reconozca UTF-8
    buffer.write("﻿")
    writer = csv.writer(buffer)
    writer.writerow(["Fecha", "Descripción", "Categoría", "Monto"])
    for e in expenses:
        writer.writerow([
            e.date.strftime("%d/%m/%Y"),
            e.description,
            e.category,
            f"{e.amount:.2f}",
        ])

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="plata_gastos.csv"',
        },
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return ExpenseResponse.model_validate(expense)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    update_data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    if expense.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tenés permiso para modificar este gasto")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    if expense.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tenés permiso para eliminar este gasto")

    db.delete(expense)
    db.commit()
