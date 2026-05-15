from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Expense, Income
from app.models.schemas import Token, UserCreate, UserLogin, UserResponse
from app.skills.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email})
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    token = create_access_token({"sub": user.email})
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()

    if current_user.created_at is not None:
        joined = current_user.created_at.date() if isinstance(current_user.created_at, datetime) else current_user.created_at
        days_since_joined = max(0, (today - joined).days)
    else:
        days_since_joined = 0

    expense_count_month = (
        db.query(func.count(Expense.id))
        .filter(
            Expense.user_id == current_user.id,
            extract("month", Expense.date) == today.month,
            extract("year", Expense.date) == today.year,
        )
        .scalar()
        or 0
    )

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        days_since_joined=days_since_joined,
        expense_count_month=expense_count_month,
    )


@router.delete("/data")
def delete_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina todos los gastos e ingresos del usuario. La cuenta se mantiene."""
    db.query(Expense).filter(Expense.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Income).filter(Income.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"message": "Datos eliminados correctamente"}


@router.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina la cuenta del usuario y todos sus datos."""
    db.query(Expense).filter(Expense.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Income).filter(Income.user_id == current_user.id).delete(synchronize_session=False)
    db.query(User).filter(User.id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"message": "Cuenta eliminada correctamente"}
