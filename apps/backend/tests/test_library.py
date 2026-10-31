import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthorized_reading_shelf_access(client: AsyncClient):
    """Verify unauthorized requests to private user library are rejected."""
    response = await client.get("/api/v1/library/progress")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sync_reading_progress(client: AsyncClient, auth_headers: dict):
    """Verify authenticated user can sync CFI locator and reading percentage."""
    payload = {
        "book_id": "cf20061c-ce48-4828-a78f-367566d72aa0",
        "current_cfi": "epubcfi(/6/4[chap01]!/4/2/10)",
        "percentage": 35.5,
    }
    response = await client.post("/api/v1/library/progress", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["percentage"] == 35.5
    assert data["current_cfi"] == payload["current_cfi"]

    # Verify progress appears on reading shelf
    shelf_res = await client.get("/api/v1/library/progress", headers=auth_headers)
    assert shelf_res.status_code == 200
    shelf_items = shelf_res.json()
    assert len(shelf_items) == 1
    assert shelf_items[0]["book"]["title"] == "Pride and Prejudice"

