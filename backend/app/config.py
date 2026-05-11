from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Oasis Finance API"
    environment: str = "development"
    debug: bool = True
    database_url: str = "sqlite:///./oasis.db"

    # Categorías predefinidas para gastos
    expense_categories: list[str] = [
        "Comida",
        "Transporte",
        "Salud",
        "Hogar",
        "Servicios",
        "Entretenimiento",
        "Ropa",
        "Educación",
        "Otros",
    ]

    # Presupuestos por defecto (en pesos AR)
    default_budgets: dict[str, float] = {
        "Comida": 150000,
        "Transporte": 50000,
        "Salud": 80000,
        "Hogar": 100000,
        "Servicios": 60000,
        "Entretenimiento": 40000,
        "Ropa": 30000,
        "Educación": 50000,
        "Otros": 30000,
    }

    gemini_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
