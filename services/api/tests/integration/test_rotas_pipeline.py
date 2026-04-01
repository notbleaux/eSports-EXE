"""
Integration tests for ROTAS data pipeline.

Tests end-to-end flow: Ingestion → Database → API
"""

import pytest
import asyncio
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

# Import main app
from main import app
from njz_api.database import get_db_pool, close_db_pool
from njz_api.rotas.services.ingestion import PandaScoreIngestionService


@pytest.fixture(scope="module")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
async def db_pool():
    """Get database pool for tests."""
    pool = await get_db_pool()
    yield pool
    await close_db_pool()


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestDataPipelineIntegration:
    """Integration tests for complete data pipeline."""

    @pytest.mark.asyncio
    async def test_full_ingestion_flow(self, db_pool):
        """Test complete ingestion flow creates retrievable data."""
        # This test would run actual ingestion against test database
        # and verify data is queryable via API
        # Requires mocking PandaScore API or using test API key
        pass

    def test_api_returns_ingested_data(self, client):
        """Test that API endpoints return data from database."""
        # Test players endpoint
        response = client.get("/api/rotas/players?page=1&per_page=5")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data

    def test_api_pagination_works(self, client):
        """Test pagination returns correct page boundaries."""
        response = client.get("/api/rotas/players?page=1&per_page=10")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["per_page"] == 10

    def test_api_filtering_by_game(self, client):
        """Test game filter returns only matching records."""
        response = client.get("/api/rotas/players?game=valorant")
        assert response.status_code == 200
        data = response.json()
        for player in data["items"]:
            assert player["game"] == "valorant"

    def test_api_error_handling(self, client):
        """Test API returns proper error for invalid requests."""
        # Test invalid player ID
        response = client.get("/api/rotas/players/999999")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data

    def test_leaderboards_endpoint(self, client):
        """Test leaderboards return ranked data."""
        response = client.get("/api/rotas/leaderboards/kd?game=valorant&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "players" in data
        assert data["category"] == "K/D Ratio"


class TestDatabaseIntegration:
    """Integration tests for database operations."""

    @pytest.mark.asyncio
    async def test_database_connection(self, db_pool):
        """Test database is accessible."""
        async with db_pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            assert result == 1

    @pytest.mark.asyncio
    async def test_tables_exist(self, db_pool):
        """Test required tables exist."""
        async with db_pool.acquire() as conn:
            tables = await conn.fetch("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            table_names = [t["table_name"] for t in tables]
            assert "players" in table_names
            assert "teams" in table_names
            assert "match_details" in table_names


class TestAPIContractCompliance:
    """Tests API complies with OpenAPI specification."""

    def test_api_schema_matches_openapi(self, client):
        """Test API responses match OpenAPI spec."""
        # This would use schemathesis or similar to validate
        # For now, basic structure validation
        response = client.get("/api/rotas/players")
        data = response.json()
        
        # Verify paginated response structure
        required_fields = ["items", "total", "page", "per_page", "pages"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    def test_error_response_format(self, client):
        """Test error responses follow standard format."""
        response = client.get("/api/rotas/players/invalid-id")
        # Should return 404 with structured error
        assert response.status_code in [404, 422]
