"""
Oasis Finance API — Entry Point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.config import get_settings
from app.routes import expenses, budgets, dashboard, incomes, scanner, auth

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa la DB al arrancar el servidor."""
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    description="API para gestión de gastos personales con categorización AI",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — permitir requests desde el frontend Expo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringir a tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(budgets.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(incomes.router, prefix="/api/v1")
app.include_router(scanner.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
