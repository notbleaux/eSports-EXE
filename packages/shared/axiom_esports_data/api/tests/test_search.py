"""
Search API Tests - Unit and integration tests for search functionality

[Ver001.000]
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestSearchAPI:
    """Test suite for search API endpoints."""

    @pytest.fixture
    def mock_request(self):
        """Create a mock request object."""
        request = MagicMock()
        request.client.host = "127.0.0.1"
        request.headers = {}
        return request

    @pytest.mark.asyncio
    async def test_search_players_validation(self, mock_request):
        """Test player search input validation."""
        from api.src.routes.search import search_players_endpoint
        
        # Test with empty query (should fail validation)
        with pytest.raises(Exception):
            await search_players_endpoint(
                request=mock_request,
                q="",  # Empty query
                limit=20,
                offset=0,
                sort="relevance",
                game=None
            )

    @pytest.mark.asyncio
    async def test_search_teams_validation(self, mock_request):
        """Test team search input validation."""
        from api.src.routes.search import search_teams_endpoint
        
        # Test query too long
        with pytest.raises(Exception):
            await search_teams_endpoint(
                request=mock_request,
                q="a" * 101,  # Too long
                limit=20,
                offset=0,
                sort="relevance",
                game=None
            )

    @pytest.mark.asyncio
    async def test_search_rate_limiting(self, mock_request):
        """Test rate limiting functionality."""
        from api.src.routes.search import _check_rate_limit, _get_client_id
        
        # Get a client ID
        client_id = _get_client_id(mock_request)
        assert client_id is not None
        assert len(client_id) > 0
        
        # First request should be allowed
        assert _check_rate_limit(client_id) is True
        
        # Multiple requests should eventually be rate limited
        for _ in range(35):  # Exceed the limit
            _check_rate_limit(client_id)
        
        # Should be rate limited now
        assert _check_rate_limit(client_id) is False

    @pytest.mark.asyncio
    async def test_search_schemas(self):
        """Test search response schemas."""
        from api.src.routes.search import (
            SearchResultPlayer,
            SearchResultTeam,
            SearchResultMatch,
            SearchResponse
        )
        
        # Test player schema
        player = SearchResultPlayer(
            id="123e4567-e89b-12d3-a456-426614174000",
            name="TestPlayer",
            team="TestTeam",
            region="NA",
            relevance_score=0.95
        )
        assert player.name == "TestPlayer"
        assert player.relevance_score == 0.95
        
        # Test team schema
        team = SearchResultTeam(
            id="123e4567-e89b-12d3-a456-426614174001",
            name="TestTeam",
            game="valorant",
            relevance_score=0.88
        )
        assert team.game == "valorant"
        
        # Test match schema
        match = SearchResultMatch(
            id="123e4567-e89b-12d3-a456-426614174002",
            tournament="VCT 2026",
            game="valorant",
            player_count=10,
            relevance_score=0.75
        )
        assert match.tournament == "VCT 2026"


class TestSearchDatabaseQueries:
    """Test database query functions."""

    @pytest.fixture
    def mock_pool(self):
        """Create a mock database pool."""
        pool = AsyncMock()
        return pool

    @pytest.mark.asyncio
    async def test_search_players_no_pool(self, mock_pool):
        """Test search players when no database pool available."""
        from api.src.db import search_players
        
        with patch('api.src.db.db.get_pool', return_value=None):
            results, total = await search_players("test", limit=10)
            assert results == []
            assert total == 0

    @pytest.mark.asyncio
    async def test_search_teams_no_pool(self):
        """Test search teams when no database pool available."""
        from api.src.db import search_teams
        
        with patch('api.src.db.db.get_pool', return_value=None):
            results, total = await search_teams("test", limit=10)
            assert results == []
            assert total == 0

    @pytest.mark.asyncio
    async def test_search_matches_no_pool(self):
        """Test search matches when no database pool available."""
        from api.src.db import search_matches
        
        with patch('api.src.db.db.get_pool', return_value=None):
            results, total = await search_matches("test", limit=10)
            assert results == []
            assert total == 0


class TestSearchIntegration:
    """Integration tests for search functionality."""

    @pytest.mark.asyncio
    async def test_end_to_end_search_flow(self):
        """Test complete search flow from API to database."""
        # This would require a test database
        # For now, just verify the module structure
        from api.src.routes import search
        from api.src.db import search_players, search_teams, search_matches
        
        assert search.router is not None
        assert callable(search_players)
        assert callable(search_teams)
        assert callable(search_matches)
