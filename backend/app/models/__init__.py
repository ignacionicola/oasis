from datetime import datetime, date
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    Date,
    Boolean,
    Index,
    ForeignKey,
)
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    # nullable porque los usuarios que ingresan con Google no tienen contraseña local
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False, default="Otros")
    date = Column(Date, nullable=False, default=date.today)
    source = Column(String(50), default="manual")  # manual | voice | ocr
    is_duplicate = Column(Boolean, default=False)
    confidence = Column(Float, default=1.0)  # Confianza de la categorización AI
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_expense_date", "date"),
        Index("idx_expense_category", "category"),
        Index("idx_expense_amount_date", "amount", "date"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "amount": self.amount,
            "description": self.description,
            "category": self.category,
            "date": self.date.isoformat(),
            "source": self.source,
            "is_duplicate": self.is_duplicate,
            "confidence": self.confidence,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(200), nullable=True)
    date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_income_date", "date"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "amount": self.amount,
            "description": self.description,
            "date": self.date.isoformat(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False, default="Otros")
    # día del mes (1-28) en que se genera automáticamente el gasto
    day_of_month = Column(Integer, nullable=False)
    active = Column(Boolean, default=True)
    # para no duplicar: último mes/año en que ya se generó
    last_generated_month = Column(Integer, nullable=True)
    last_generated_year = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "description": self.description,
            "amount": self.amount,
            "category": self.category,
            "day_of_month": self.day_of_month,
            "active": self.active,
            "last_generated_month": self.last_generated_month,
            "last_generated_year": self.last_generated_year,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(100), nullable=False, unique=True)
    monthly_limit = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "category": self.category,
            "monthly_limit": self.monthly_limit,
            "is_active": self.is_active,
        }
