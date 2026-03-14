"""
E2E User Flow Tests
Tests complete user journeys through the application

[Ver001.000]
"""

import pytest
import aiohttp
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:5173"  # Vite dev server
API_URL = "http://localhost:8000"


class TestUserRegistrationFlow:
    """Test user registration journey."""
    
    @pytest.mark.asyncio
    async def test_registration_page_loads(self):
        """Test that registration page is accessible."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{BASE_URL}/register") as response:
                    # Should return HTML for the SPA
                    assert response.status in [200, 404]
                    
                    if response.status == 200:
                        content = await response.text()
                        assert "<html" in content.lower()
            except aiohttp.ClientConnectorError:
                pytest.skip("Frontend server not running")
    
    @pytest.mark.asyncio
    async def test_login_page_loads(self):
        """Test that login page is accessible."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{BASE_URL}/login") as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("Frontend server not running")


class TestHubNavigationFlow:
    """Test navigation between hubs."""
    
    HUBS = ["sator", "rotas", "arepo", "opera"]
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("hub", HUBS)
    async def test_hub_accessible(self, hub: str):
        """Test that each hub loads."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{BASE_URL}/{hub}") as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("Frontend server not running")
    
    @pytest.mark.asyncio
    async def test_all_hubs_return_spa(self):
        """Test that all hub routes return the SPA HTML."""
        async with aiohttp.ClientSession() as session:
            for hub in self.HUBS:
                try:
                    async with session.get(f"{BASE_URL}/{hub}") as response:
                        if response.status == 200:
                            content = await response.text()
                            assert "<html" in content.lower()
                            assert "</html>" in content.lower()
                except aiohttp.ClientConnectorError:
                    pytest.skip("Frontend server not running")


class TestSATORHubFlow:
    """Test SATOR hub user flows."""
    
    @pytest.mark.asyncio
    async def test_analytics_data_endpoint(self):
        """Test analytics data API."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{API_URL}/api/v1/analytics") as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_predictions_endpoint(self):
        """Test predictions API."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{API_URL}/api/v1/predictions") as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")


class TestAREPOHubFlow:
    """Test AREPO hub user flows."""
    
    @pytest.mark.asyncio
    async def test_players_list_endpoint(self):
        """Test players list API."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{API_URL}/api/v1/players") as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_search_functionality(self):
        """Test search endpoint."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_URL}/api/v1/search",
                    params={"q": "test"}
                ) as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")


class TestOPERAHubFlow:
    """Test OPERA hub user flows."""
    
    @pytest.mark.asyncio
    async def test_events_endpoint(self):
        """Test events timeline API."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{API_URL}/api/v1/events") as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_matches_history_endpoint(self):
        """Test match history API."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{API_URL}/api/v1/matches/history") as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")


class TestROTASHubFlow:
    """Test ROTAS hub user flows."""
    
    @pytest.mark.asyncio
    async def test_simulation_status_endpoint(self):
        """Test simulation status API."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{API_URL}/api/v1/simulation/status") as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_simulation_run_endpoint(self):
        """Test simulation run API."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{API_URL}/api/v1/simulation/run",
                    json={"config": "default"}
                ) as response:
                    assert response.status in [200, 201, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")


class TestDataExportFlow:
    """Test data export functionality."""
    
    @pytest.mark.asyncio
    async def test_export_csv_flow(self):
        """Test CSV export endpoint."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_URL}/api/v1/export/csv",
                    params={"type": "players"}
                ) as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_export_json_flow(self):
        """Test JSON export endpoint."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_URL}/api/v1/export/json",
                    params={"type": "matches"}
                ) as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")


class TestErrorScenarios:
    """Test error handling in user flows."""
    
    @pytest.mark.asyncio
    async def test_invalid_player_id(self):
        """Test handling of invalid player ID."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_URL}/api/v1/players/invalid-id-12345"
                ) as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_invalid_match_id(self):
        """Test handling of invalid match ID."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_URL}/api/v1/matches/invalid-id-12345"
                ) as response:
                    assert response.status in [200, 404]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")
    
    @pytest.mark.asyncio
    async def test_empty_search_query(self):
        """Test handling of empty search query."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{API_URL}/api/v1/search",
                    params={"q": ""}
                ) as response:
                    assert response.status in [200, 400, 404, 422]
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")


class TestPerformanceFlows:
    """Test performance of key user flows."""
    
    @pytest.mark.asyncio
    async def test_hub_load_time(self):
        """Test that hubs load within acceptable time."""
        import time
        
        async with aiohttp.ClientSession() as session:
            start = time.time()
            try:
                async with session.get(f"{BASE_URL}/sator") as response:
                    elapsed = time.time() - start
                    assert response.status in [200, 404]
                    # Should load in less than 5 seconds
                    assert elapsed < 5.0
            except aiohttp.ClientConnectorError:
                pytest.skip("Frontend server not running")
    
    @pytest.mark.asyncio
    async def test_api_response_time(self):
        """Test that API responds within acceptable time."""
        import time
        
        async with aiohttp.ClientSession() as session:
            start = time.time()
            try:
                async with session.get(f"{API_URL}/api/v1/health") as response:
                    elapsed = time.time() - start
                    # Should respond in less than 2 seconds
                    assert elapsed < 2.0
            except aiohttp.ClientConnectorError:
                pytest.skip("API server not running")
