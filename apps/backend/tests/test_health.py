import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Test root and /health endpoints return 200 OK and valid status."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test the welcome root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Welcome" in data["message"]

