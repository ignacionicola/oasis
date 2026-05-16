from pydantic import Field, validator
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Oasis Finance API"
    environment: str = "development"
    debug: bool = False
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

    secret_key: str = Field(..., min_length=32)
    access_token_expire_days: int = 30

    @validator('secret_key')
    def validate_secret_key(cls, v, values):
        if values.get('environment') == 'production' and v == 'changeme-in-production':
            raise ValueError('SECRET_KEY debe configurarse en producción')
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
