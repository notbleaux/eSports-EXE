"""
Health Check Endpoint Tests

Tests the basic health, ready, and live endpoints.
These endpoints require no authentication and provide
service status information.
"""
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
import sys
import os

# Add the API directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../packages/shared/api"))

# Import after path setup
try:
    from main import app
    HAS_APP = True
except ImportError as e:
    print(f"Could not import app: {e}")
    HAS_APP = False
    app = None


@pytest.mark.skipif(not HAS_APP, reason="FastAPI app not importable")
class TestHealthEndpoints:
    """Test suite for health check endpoints."""
    
    def test_health_check_sync(self):
        """Test /health endpoint returns 200 and correct structure."""
        if not HAS_APP:
            pytest.skip("App not available")
        
        client = TestClient(app)
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "version" in data
        assert "timestamp" in data
    
    def test_live_check_sync(self):
        """Test /live endpoint returns 200."""
        if not HAS_APP:
            pytest.skip("App not available")
        
        client = TestClient(app)
        response = client.get("/live")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
    
    def test_ready_check_sync(self):
        """Test /ready endpoint returns 200 with database status."""
        if not HAS_APP:
            pytest.skip("App not available")
        
        client = TestClient(app)
        response = client.get("/ready")
        
        assert response.status_code == 200
        data = response.json()
        assert "ready" in data
        assert "checks" in data
        assert "database" in data["checks"]
    
    @pytest.mark.asyncio
    async def test_health_check_async(self):
        """Test /health endpoint asynchronously."""
        if not HAS_APP:
            pytest.skip("App not available")
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
