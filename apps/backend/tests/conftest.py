import asyncio
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Force SQLite for test isolation
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-32-characters-minimum-for-testing-purposes"

from app.core.database import Base, get_db
from app.main import app
from app.models.book import Book
from app.models.user import User
from app.core.security import get_password_hash

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create a fresh isolated in-memory database for each test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        # Seed a test book
        test_book = Book(
            id="cf20061c-ce48-4828-a78f-367566d72aa0",
            title="Pride and Prejudice",
            author="Jane Austen",
            gutenberg_id=1342,
            format="epub",
            avg_rating=4.92,
            rating_count=52100,
            description="Pride and Prejudice follows the turbulent relationship between Elizabeth Bennet and Fitzwilliam Darcy.",
            cover_url="https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
            download_url="https://www.gutenberg.org/ebooks/1342.epub3.images",
        )
        session.add(test_book)
        await session.commit()
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """FastAPI async test client overriding the database session."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def auth_headers(client: AsyncClient, db_session: AsyncSession):
    """Register and log in a test user, returning authorization headers."""
    register_payload = {
        "email": "reader@example.com",
        "password": "Password123!",
        "full_name": "Test Reader",
    }
    res = await client.post("/api/v1/auth/register", json=register_payload)
    data = res.json()
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}

