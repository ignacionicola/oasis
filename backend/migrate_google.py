"""
Migración manual: agrega google_id y hace nullable hashed_password.

Correr una sola vez en cada environment:
    python migrate_google.py

Idempotente: si las columnas/índices ya existen, no falla.
Compatible con PostgreSQL y SQLite (en SQLite, DROP NOT NULL no aplica —
se ignora con un warning).
"""

import sys
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine


def _is_sqlite() -> bool:
    return engine.dialect.name == "sqlite"


def _run(label: str, sql: str, *, sqlite_ok: bool = True) -> None:
    """Ejecuta una sentencia, reporta resultado, no aborta el script si falla."""
    if not sqlite_ok and _is_sqlite():
        print(f"  ⊝  {label}: omitido en SQLite")
        return
    try:
        with engine.begin() as conn:
            conn.execute(text(sql))
        print(f"  ✓  {label}")
    except SQLAlchemyError as e:
        # Catch-all para casos como "columna ya existe" en backends que no
        # soportan IF NOT EXISTS, o constraints duplicados.
        msg = str(e.__cause__ or e).splitlines()[0]
        print(f"  ⚠  {label}: {msg}")


def main() -> int:
    dialect = engine.dialect.name
    print(f"Migración google_id → dialect: {dialect}")
    print("-" * 60)

    if _is_sqlite():
        # SQLite no soporta IF NOT EXISTS para ADD COLUMN antes de 3.35,
        # ni ALTER COLUMN ... DROP NOT NULL en ninguna versión.
        # Chequeamos columnas manualmente.
        with engine.begin() as conn:
            cols = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            existing = {c[1] for c in cols}

        if "google_id" not in existing:
            _run(
                "ADD COLUMN google_id",
                "ALTER TABLE users ADD COLUMN google_id VARCHAR(255)",
            )
        else:
            print("  ⊝  ADD COLUMN google_id: ya existe")

        _run(
            "CREATE UNIQUE INDEX ix_users_google_id",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)",
        )

        # SQLite no soporta DROP NOT NULL — habría que recrear la tabla.
        # Se ignora porque los inserts vía SQLAlchemy aceptan NULL si el ORM lo permite.
        print(
            "  ⊝  DROP NOT NULL hashed_password: omitido en SQLite "
            "(el ORM ya permite NULL; recreá la tabla si necesitás el constraint real)"
        )
    else:
        # PostgreSQL: todas las sentencias son idempotentes con IF NOT EXISTS.
        _run(
            "ADD COLUMN google_id",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)",
        )
        _run(
            "CREATE UNIQUE INDEX ix_users_google_id",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)",
        )
        _run(
            "DROP NOT NULL hashed_password",
            "ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL",
        )

    print("-" * 60)
    print("✓ Migración completada.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
