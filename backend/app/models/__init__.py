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
)
from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
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
