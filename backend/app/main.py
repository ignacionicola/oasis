"""
Oasis Finance API — Entry Point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import init_db
from app.config import get_settings

# Rate limiter — DEBE definirse antes de importar las rutas
# para que `from app.main import limiter` funcione (circular import).
def _get_client_key(*args):
    if not args:
        return '127.0.0.1'
    r = args[0]
    xff = r.headers.get('x-forwarded-for')
    if xff:
        return xff.split(',')[0].strip()
    return r.client.host if r.client else '127.0.0.1'

limiter = Limiter(key_func=_get_client_key)

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
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — abierto en dev, restringido a dominios conocidos en producción
allow_origins = (
    ["*"] if settings.environment == "development"
    else ["https://oasis-backend-yu55.onrender.com"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
