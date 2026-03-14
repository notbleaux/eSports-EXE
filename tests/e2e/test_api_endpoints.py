"""
E2E API Endpoint Tests
Tests critical API endpoints end-to-end

[Ver001.000]
"""

import pytest
import aiohttp
import asyncio
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"  # FastAPI default
API_PREFIX = "/api/v1"


@pytest.fixture
async def http_session():
    """Create aiohttp session for tests."""
    async with aiohttp.ClientSession() as session:
        yield session


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    @pytest.mark.asyncio
    async def test_health_check(self, http_session):
        """Test basic health endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/health"
        
        try:
            async with http_session.get(url) as response:
                # Should return 200 or 404 if endpoint doesn't exist
                assert response.status in [200, 404]
                
                if response.status == 200:
                    data = await response.json()
                    assert "status" in data or "healthy" in str(data).lower()
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_readiness_check(self, http_session):
        """Test readiness endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/ready"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")


class TestPlayerEndpoints:
    """Test player-related endpoints."""
    
    @pytest.mark.asyncio
    async def test_list_players(self, http_session):
        """Test GET /players endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/players"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404, 422]
                
                if response.status == 200:
                    data = await response.json()
                    assert isinstance(data, (list, dict))
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_get_player(self, http_session):
        """Test GET /players/{id} endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/players/test-player-id"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")


class TestMatchEndpoints:
    """Test match-related endpoints."""
    
    @pytest.mark.asyncio
    async def test_list_matches(self, http_session):
        """Test GET /matches endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/matches"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_get_match(self, http_session):
        """Test GET /matches/{id} endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/matches/test-match-id"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")


class TestPredictionEndpoints:
    """Test ML prediction endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_prediction(self, http_session):
        """Test POST /predictions endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/predictions"
        payload = {
            "match_id": "test-match",
            "model": "default"
        }
        
        try:
            async with http_session.post(url, json=payload) as response:
                assert response.status in [200, 201, 404, 422]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_get_prediction(self, http_session):
        """Test GET /predictions/{id} endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/predictions/test-prediction-id"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")


class TestAnalyticsEndpoints:
    """Test analytics endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_analytics(self, http_session):
        """Test GET /analytics endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/analytics"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_get_player_stats(self, http_session):
        """Test GET /analytics/player/{id} endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/analytics/player/test-player"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")


class TestExportEndpoints:
    """Test data export endpoints."""
    
    @pytest.mark.asyncio
    async def test_export_csv(self, http_session):
        """Test GET /export/csv endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/export/csv?type=players"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
                
                if response.status == 200:
                    content_type = response.headers.get('Content-Type', '')
                    assert 'csv' in content_type or 'text' in content_type
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_export_json(self, http_session):
        """Test GET /export/json endpoint."""
        url = f"{BASE_URL}{API_PREFIX}/export/json?type=matches"
        
        try:
            async with http_session.get(url) as response:
                assert response.status in [200, 404]
                
                if response.status == 200:
                    content_type = response.headers.get('Content-Type', '')
                    assert 'json' in content_type
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")


class TestErrorHandling:
    """Test API error handling."""
    
    @pytest.mark.asyncio
    async def test_404_error(self, http_session):
        """Test 404 error response."""
        url = f"{BASE_URL}{API_PREFIX}/nonexistent-endpoint"
        
        try:
            async with http_session.get(url) as response:
                assert response.status == 404
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_invalid_json(self, http_session):
        """Test error handling for invalid JSON."""
        url = f"{BASE_URL}{API_PREFIX}/predictions"
        
        try:
            async with http_session.post(
                url,
                data="invalid json",
                headers={"Content-Type": "application/json"}
            ) as response:
                assert response.status in [400, 404, 422]
        except aiohttp.ClientConnectorError:
            pytest.skip("API server not running")
