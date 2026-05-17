import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import get_settings

settings = get_settings()

DATABASE_URL = os.getenv("DATABASE_URL", settings.database_url)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

_is_sqlite = DATABASE_URL.startswith("sqlite")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency para inyectar sesión de DB en los endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Crear todas las tablas. Se llama al iniciar la app."""
    Base.metadata.create_all(bind=engine)
    _add_user_id_columns()
    _migrate_google_columns()


def _migrate_google_columns():
    """Migración idempotente para los campos de Google login.

    Solo corre en PostgreSQL — en SQLite las sentencias ALTER son limitadas
    y el ORM ya permite NULL en hashed_password sin necesidad de DDL extra.
    """
    if "postgresql" not in DATABASE_URL:
        return

    from sqlalchemy import text

    statements = [
        ("ADD COLUMN google_id",
         "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)"),
        ("CREATE INDEX ix_users_google_id",
         "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id)"),
        ("DROP NOT NULL hashed_password",
         "ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"),
    ]

    for label, sql in statements:
        try:
            with engine.begin() as conn:
                conn.execute(text(sql))
        except Exception as e:
            # Si la columna/índice ya existe o ya es nullable, ignoramos.
            # Cada sentencia corre en su propia transacción, así que un fallo
            # no afecta a las siguientes.
            print(f"[migrate_google] {label}: {str(e).splitlines()[0]}")


def _add_user_id_columns():
    """Agrega user_id a expenses/incomes si no existe (idempotente)."""
    from sqlalchemy import text

    if _is_sqlite:
        with engine.begin() as conn:
            for table in ("expenses", "incomes"):
                cols = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                names = {c[1] for c in cols}
                if "user_id" not in names:
                    conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN user_id INTEGER REFERENCES users(id)"
                    ))
    else:
        with engine.begin() as conn:
            for table in ("expenses", "incomes"):
                conn.execute(text(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)"
                ))
                conn.execute(text(
                    f"CREATE INDEX IF NOT EXISTS ix_{table}_user_id ON {table}(user_id)"
                ))
