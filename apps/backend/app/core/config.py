import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "PagePulse AI"
    API_V1_STR: str = "/api/v1"

    # Database & Redis
    DATABASE_URL: str = "sqlite+aiosqlite:///./pagepulse.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security & Tokens
    SECRET_KEY: str = "change-this-to-a-secure-random-secret-key-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # External APIs
    GEMINI_API_KEY: str = ""
    GUTENDEX_API_URL: str = "https://gutendex.com"
    OPENLIBRARY_API_URL: str = "https://openlibrary.org"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
