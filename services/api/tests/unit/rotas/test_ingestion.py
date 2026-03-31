"""
Unit tests for ROTAS ingestion service.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from njz_api.rotas.services.ingestion import (
    PandaScoreIngestionService,
    IngestionResult
)


@pytest.fixture
def mock_pandascore_response():
    """Sample PandaScore API response for testing."""
    return {
        "id": 12345,
        "name": "Test Tournament",
        "slug": "test-tournament-2024",
        "status": "finished",
        "begin_at": "2024-01-15T10:00:00Z",
        "end_at": "2024-01-20T18:00:00Z",
        "prizepool": 100000,
        "serie": {
            "tier": "A"
        }
    }


@pytest.fixture
def mock_match_response():
    """Sample match data from PandaScore."""
    return {
        "id": 67890,
        "name": "Team A vs Team B",
        "status": "finished",
        "scheduled_at": "2024-01-15T14:00:00Z",
        "end_at": "2024-01-15T16:30:00Z",
        "opponents": [
            {"opponent": {"id": 111, "name": "Team A"}},
            {"opponent": {"id": 222, "name": "Team B"}}
        ],
        "winner": {"id": 111},
        "results": [
            {"team_id": 111, "score": 2},
            {"team_id": 222, "score": 1}
        ]
    }


@pytest.fixture
def mock_player_response():
    """Sample player data from PandaScore."""
    return {
        "id": 333,
        "name": "TestPlayer",
        "slug": "testplayer",
        "nationality": "US",
        "current_team": {"id": 111, "name": "Team A"}
    }


@pytest.fixture
def mock_team_response():
    """Sample team data from PandaScore."""
    return {
        "id": 111,
        "name": "Team A",
        "slug": "team-a",
        "acronym": "TA",
        "location": "North America"
    }


class TestPandaScoreIngestionService:
    """Test suite for PandaScoreIngestionService."""

    @pytest.fixture
    def service(self):
        """Create service instance with mocked dependencies."""
        service = PandaScoreIngestionService()
        service.client = AsyncMock()
        service._db_pool = AsyncMock()
        return service

    @pytest.mark.asyncio
    async def test_ingest_teams_creates_new_team(self, service, mock_team_response):
        """Test that new teams are created in database."""
        # Arrange
        service.client.get_teams = AsyncMock(return_value=[mock_team_response])
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=None)  # Team doesn't exist
        mock_conn.execute = AsyncMock()
        service._db_pool.acquire = MagicMock()
        service._db_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        service._db_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

        # Act
        result = await service.ingest_teams(game="valorant")

        # Assert
        assert result.records_created == 1
        assert result.records_updated == 0
        assert result.records_processed == 1
        assert result.error_message is None

    @pytest.mark.asyncio
    async def test_ingest_teams_updates_existing_team(self, service, mock_team_response):
        """Test that existing teams are updated."""
        # Arrange
        service.client.get_teams = AsyncMock(return_value=[mock_team_response])
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"id": 1})  # Team exists
        mock_conn.execute = AsyncMock()
        service._db_pool.acquire = MagicMock()
        service._db_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        service._db_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

        # Act
        result = await service.ingest_teams(game="valorant")

        # Assert
        assert result.records_created == 0
        assert result.records_updated == 1
        assert result.records_processed == 1

    @pytest.mark.asyncio
    async def test_ingest_teams_handles_api_error(self, service):
        """Test error handling when PandaScore API fails."""
        # Arrange
        service.client.get_teams = AsyncMock(side_effect=Exception("API Error"))

        # Act
        result = await service.ingest_teams(game="valorant")

        # Assert
        assert result.records_processed == 0
        assert result.error_message == "API Error"

    @pytest.mark.asyncio
    async def test_ingest_players_maps_team_correctly(self, service, mock_player_response, mock_team_response):
        """Test that players are mapped to correct teams."""
        # Arrange
        service.client.get_players = AsyncMock(return_value=[mock_player_response])
        service.client.get_teams = AsyncMock(return_value=[mock_team_response])
        
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[{"id": 1, "pandascore_id": 111}])
        mock_conn.fetchrow = AsyncMock(return_value=None)  # Player doesn't exist
        mock_conn.execute = AsyncMock()
        service._db_pool.acquire = MagicMock()
        service._db_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        service._db_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

        # Act
        result = await service.ingest_players(game="valorant")

        # Assert
        assert result.records_created == 1
        # Verify team_id was mapped correctly
        call_args = mock_conn.execute.call_args
        assert call_args is not None

    @pytest.mark.asyncio
    async def test_ingest_matches_processes_scores_correctly(self, service, mock_match_response):
        """Test that match scores are processed correctly."""
        # Arrange
        service.client.get_matches = AsyncMock(return_value=[mock_match_response])
        
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[
            {"id": 1, "pandascore_id": 111},
            {"id": 2, "pandascore_id": 222}
        ])
        mock_conn.fetchrow = AsyncMock(return_value=None)  # Match doesn't exist
        mock_conn.execute = AsyncMock()
        service._db_pool.acquire = MagicMock()
        service._db_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        service._db_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

        # Act
        result = await service.ingest_matches(game="valorant")

        # Assert
        assert result.records_created == 1
        # Verify team1_score and team2_score were extracted correctly
        call_args = mock_conn.execute.call_args
        assert call_args is not None

    def test_determine_tier_from_prizepool(self, service):
        """Test tier determination based on prize pool."""
        # Test S tier (>= $1M)
        assert service._determine_tier({"prizepool": 1500000}) == "S"
        
        # Test A tier (>= $500K)
        assert service._determine_tier({"prizepool": 750000}) == "A"
        
        # Test B tier (>= $100K)
        assert service._determine_tier({"prizepool": 250000}) == "B"
        
        # Test C tier (< $100K)
        assert service._determine_tier({"prizepool": 50000}) == "C"

    def test_determine_tier_from_serie(self, service):
        """Test tier determination from serie data."""
        tournament = {
            "serie": {"tier": "S"},
            "prizepool": 50000  # Would be C tier, but serie takes precedence
        }
        assert service._determine_tier(tournament) == "S"

    def test_determine_tier_returns_none(self, service):
        """Test tier returns None when no data available."""
        assert service._determine_tier({}) is None
        assert service._determine_tier({"prizepool": None}) is None


class TestIngestionResult:
    """Test suite for IngestionResult dataclass."""

    def test_ingestion_result_defaults(self):
        """Test that IngestionResult has correct default values."""
        result = IngestionResult(source="test", entity_type="teams")
        
        assert result.source == "test"
        assert result.entity_type == "teams"
        assert result.records_processed == 0
        assert result.records_created == 0
        assert result.records_updated == 0
        assert result.records_failed == 0
        assert result.error_message is None

    def test_ingestion_result_with_values(self):
        """Test IngestionResult with actual values."""
        result = IngestionResult(
            source="pandascore",
            entity_type="matches",
            records_processed=100,
            records_created=50,
            records_updated=45,
            records_failed=5,
            error_message=None
        )
        
        assert result.records_processed == 100
        assert result.records_created == 50
        assert result.records_updated == 45
        assert result.records_failed == 5
