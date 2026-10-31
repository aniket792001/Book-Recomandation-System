import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_user_registration(client: AsyncClient):
    """Verify new user registration issues valid access and refresh tokens."""
    payload = {
        "email": "newuser@example.com",
        "password": "SecurePassword123!",
        "full_name": "Alice Reader",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "Alice Reader"


@pytest.mark.asyncio
async def test_duplicate_user_registration(client: AsyncClient):
    """Verify system blocks registering duplicate email addresses."""
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "full_name": "Bob Reader",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_user_login_success(client: AsyncClient):
    """Verify correct credentials authenticate successfully."""
    # Register
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "MySecretPassword99!", "full_name": "Login User"},
    )

    # Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "MySecretPassword99!"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_user_login_invalid_password(client: AsyncClient):
    """Verify incorrect password returns 401 Unauthorized."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpass@example.com", "password": "CorrectPassword123!"},
    )

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "WrongPassword!"},
    )
    assert login_res.status_code == 401
    assert "incorrect" in login_res.json()["detail"].lower()

