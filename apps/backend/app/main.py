from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.ai_chat import router as ai_chat_router
from app.api.v1.auth import router as auth_router
from app.api.v1.books import router as books_router
from app.api.v1.library import router as library_router
from app.api.v1.recommend import router as recommend_router
from app.core.config import settings
from app.core.database import engine
from app.models import Base


import logging

logger = logging.getLogger("pagepulse.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database schema and seed defaults if empty
    try:
        from app.seed import seed_database
        await seed_database()
        logger.info("Successfully connected to database and verified schema & seed catalog.")
    except Exception as e:
        logger.warning(
            f"Database auto-seed check exception on startup: {e}\n"
            "FastAPI is running in standalone mode."
        )
    yield
    # Shutdown: dispose connection pool
    try:
        await engine.dispose()
    except Exception:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Next-Generation AI Book Discovery, Recommendation & Digital Reading Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(books_router, prefix=settings.API_V1_STR)
app.include_router(recommend_router, prefix=settings.API_V1_STR)
app.include_router(library_router, prefix=settings.API_V1_STR)
app.include_router(ai_chat_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    """Healthcheck endpoint for Docker, load balancers, and orchestrators."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Visit {settings.API_V1_STR}/docs for interactive API documentation."
    }
