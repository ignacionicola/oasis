import datetime as dt
from pydantic import BaseModel, Field


# ── Expense Schemas ──

class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Monto del gasto")
    description: str = Field(..., min_length=1, max_length=500)
    category: str | None = Field(None, description="Si es None, se auto-categoriza")
    expense_date: dt.date = Field(default_factory=dt.date.today, alias="date")
    source: str = Field(default="manual", pattern="^(manual|voice|ocr)$")
    notes: str | None = None

    model_config = {"populate_by_name": True}


class ExpenseUpdate(BaseModel):
    amount: float | None = Field(None, gt=0)
    description: str | None = Field(None, min_length=1, max_length=500)
    category: str | None = None
    expense_date: dt.date | None = Field(None, alias="date")
    notes: str | None = None

    model_config = {"populate_by_name": True}


class ExpenseResponse(BaseModel):
    id: int
    amount: float
    description: str
    category: str
    date: dt.date
    source: str
    is_duplicate: bool
    confidence: float
    notes: str | None
    created_at: dt.datetime | None

    model_config = {"from_attributes": True}


class ExpenseWithAlert(BaseModel):
    expense: ExpenseResponse
    alert: dict | None = None  # Info de alerta de presupuesto si aplica
    duplicate_warning: dict | None = None


# ── Budget Schemas ──

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float = Field(..., gt=0)


class BudgetUpdate(BaseModel):
    monthly_limit: float = Field(..., gt=0)
    is_active: bool = True


class BudgetResponse(BaseModel):
    id: int
    category: str
    monthly_limit: float
    is_active: bool

    model_config = {"from_attributes": True}


class BudgetStatus(BaseModel):
    category: str
    monthly_limit: float
    spent: float
    remaining: float
    percentage_used: float
    alert_level: str  # "ok" | "warning" | "danger"


# ── Dashboard Schemas ──

class MonthSummary(BaseModel):
    month: str
    year: int
    total_spent: float
    expense_count: int
    by_category: dict[str, float]
    daily_average: float
    top_category: str
    budget_status: list[BudgetStatus]
