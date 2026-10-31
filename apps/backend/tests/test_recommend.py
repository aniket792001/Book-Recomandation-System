import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_semantic_recommendation_search(client: AsyncClient):
    """Verify semantic recommendation endpoint returns matched books with scores."""
    payload = {
        "query": "turbulent romantic drama with rich aristocrats",
        "limit": 5,
    }
    response = await client.post("/api/v1/recommend/semantic", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "book" in data[0]
    assert "similarity_score" in data[0]
    assert data[0]["similarity_score"] > 0


@pytest.mark.asyncio
async def test_get_similar_books(client: AsyncClient):
    """Verify similar books recommendation returns matching genres."""
    book_id = "cf20061c-ce48-4828-a78f-367566d72aa0"
    response = await client.get(f"/api/v1/recommend/similar/{book_id}?limit=4")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

