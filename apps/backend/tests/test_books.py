import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_books(client: AsyncClient):
    """Verify listing books returns seeded books and correct pagination schema."""
    response = await client.get("/api/v1/books")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    assert data["items"][0]["title"] == "Pride and Prejudice"


@pytest.mark.asyncio
async def test_get_book_detail_by_id(client: AsyncClient):
    """Verify retrieving book by UUID."""
    book_id = "cf20061c-ce48-4828-a78f-367566d72aa0"
    response = await client.get(f"/api/v1/books/{book_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == book_id
    assert data["author"] == "Jane Austen"
    assert data["gutenberg_id"] == 1342


@pytest.mark.asyncio
async def test_get_popular_books(client: AsyncClient):
    """Verify retrieving trending books sorted by rating."""
    response = await client.get("/api/v1/books/popular?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["avg_rating"] >= 4.0


@pytest.mark.asyncio
async def test_search_books_filter(client: AsyncClient):
    """Verify search filter accurately matches title."""
    response = await client.get("/api/v1/books?search=Austen")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert "Austen" in data["items"][0]["author"]

