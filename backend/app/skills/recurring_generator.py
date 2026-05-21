"""
Recurring Generator — genera gastos automáticos a partir de los
RecurringExpense activos del usuario.

Se llama de forma lazy (cada vez que el usuario abre el dashboard) en lugar
de un cron job: simple y suficiente para esta app.
"""

from datetime import date

from sqlalchemy.orm import Session

from app.models import Expense, RecurringExpense


def generate_recurring_expenses_for_user(user_id: int, db: Session) -> int:
    """Genera los gastos recurrentes pendientes del usuario para el mes actual.

    Para cada RecurringExpense activo:
      - si ya pasó (o es) el día del mes configurado
      - y todavía no se generó este mes/año
      crea un Expense normal y marca last_generated_month/year.

    Devuelve la cantidad de gastos generados.
    """
    today = date.today()
    generated = 0

    recurring = (
        db.query(RecurringExpense)
        .filter(
            RecurringExpense.user_id == user_id,
            RecurringExpense.active == True,  # noqa: E712
        )
        .all()
    )

    for r in recurring:
        # ¿ya llegó el día del mes?
        if today.day < r.day_of_month:
            continue

        # ¿ya se generó este mes/año?
        if r.last_generated_month == today.month and r.last_generated_year == today.year:
            continue

        # crear el gasto con fecha del día configurado en el mes actual
        expense_date = date(today.year, today.month, r.day_of_month)
        expense = Expense(
            user_id=user_id,
            amount=r.amount,
            description=r.description,
            category=r.category,
            date=expense_date,
            source="manual",
            is_duplicate=False,
            confidence=1.0,
        )
        db.add(expense)

        r.last_generated_month = today.month
        r.last_generated_year = today.year
        generated += 1

    if generated:
        db.commit()

    return generated
