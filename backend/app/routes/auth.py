from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.main import limiter
from app.models import User, Expense, Income
from app.models.schemas import (
    GoogleAuthRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.skills.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
)

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
@limiter.limit("5/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
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
@limiter.limit("10/minute")
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    token = create_access_token({"sub": user.email})
    return Token(access_token=token)


@router.post("/google", response_model=Token)
@limiter.limit("10/minute")
def google_login(
    request: Request,
    payload: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    """Login/registro vía Google ID token."""
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login con Google no está configurado en el servidor",
        )

    # 1. Verificar el token con Google
    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google inválido o expirado",
        )

    google_sub = idinfo.get("sub")
    email = idinfo.get("email")
    if not google_sub or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google no contiene los datos requeridos",
        )

    email = email.lower()

    # 2. Buscar por google_id
    user = db.query(User).filter(User.google_id == google_sub).first()

    # 3. Si no hay match por google_id, buscar por email y asociar
    if user is None:
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            user.google_id = google_sub
            db.commit()
            db.refresh(user)
        else:
            # 4. Crear usuario nuevo sin password
            user = User(
                email=email,
                google_id=google_sub,
                hashed_password=None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

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
