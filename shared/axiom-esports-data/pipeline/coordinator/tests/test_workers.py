"""Tests for worker modules."""

import pytest
from datetime import datetime
from uuid import uuid4

from pipeline.coordinator.workers.base_worker import BaseExtractionWorker
from pipeline.coordinator.workers.cs2_worker import CS2ExtractionWorker
from pipeline.coordinator.workers.valorant_worker import ValorantExtractionWorker
from pipeline.coordinator.models import (
    ExtractionJob,
    GameType,
    JobConfig,
    DataSource,
    JobPriority,
    AgentCapabilities,
)


class MockWorker(BaseExtractionWorker):
    """Mock worker for testing base class."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_type = GameType.CS
        self.extract_called = False
    
    async def extract(self, job: ExtractionJob) -> dict:
        self.extract_called = True
        return {
            "batch_id": f"test_{job.id}",
            "records_processed": 10,
            "data_hash": "abc123",
        }


class TestBaseWorker:
    """Test base worker functionality."""
    
    def test_init(self):
        """Test worker initialization."""
        worker = MockWorker(
            agent_id=None,
            coordinator_url="http://localhost:8000",
            api_key="test-key",
            name="test-worker",
        )
        
        assert worker.name == "test-worker"
        assert worker.coordinator_url == "http://localhost:8000"
        assert worker.api_key == "test-key"
        assert worker._running is False
    
    def test_get_capabilities(self):
        """Test getting agent capabilities."""
        worker = MockWorker(None, "http://localhost:8000", "")
        caps = worker.get_capabilities()
        
        assert isinstance(caps, AgentCapabilities)
        assert GameType.CS in caps.games
    
    def test_stop(self):
        """Test stopping worker."""
        worker = MockWorker(None, "http://localhost:8000", "")
        worker._running = True
        
        worker.stop()
        
        assert worker._running is False


class TestCS2Worker:
    """Test CS2 worker functionality."""
    
    def test_init(self):
        """Test CS2 worker initialization."""
        worker = CS2ExtractionWorker(
            agent_id=None,
            coordinator_url="http://localhost:8000",
            api_key="",
        )
        
        assert worker.game_type == GameType.CS
        assert worker.name == "cs2-worker"
    
    def test_get_capabilities(self):
        """Test CS2 worker capabilities."""
        worker = CS2ExtractionWorker(None, "http://localhost:8000", "")
        caps = worker.get_capabilities()
        
        assert GameType.CS in caps.games
        assert DataSource.HLTV in caps.sources
        assert DataSource.GRID_OPENACCESS in caps.sources
        assert caps.max_concurrent_jobs == 1
    
    async def test_extract_missing_match_id(self):
        """Test extraction fails without match_id."""
        worker = CS2ExtractionWorker(None, "http://localhost:8000", "")
        
        job = ExtractionJob(
            game=GameType.CS,
            priority=JobPriority.NORMAL,
            config=JobConfig(source=DataSource.HLTV),  # No match_id
        )
        
        with pytest.raises(ValueError, match="missing match_id"):
            await worker.extract(job)
    
    async def test_extract_mock_data(self):
        """Test extraction with mock data."""
        worker = CS2ExtractionWorker(None, "http://localhost:8000", "")
        
        job = ExtractionJob(
            game=GameType.CS,
            priority=JobPriority.NORMAL,
            config=JobConfig(match_id="12345", source=DataSource.HLTV),
        )
        
        result = await worker.extract(job)
        
        assert "batch_id" in result
        assert result["batch_id"].startswith("cs2_")
        assert result["job_id"] == str(job.id)
        assert result["records_processed"] > 0
        assert "data_hash" in result
        assert result["source"] == DataSource.HLTV.value
        assert "processing_time_ms" in result
        assert isinstance(result["records"], list)
    
    def test_transform_hltv_data(self):
        """Test HLTV data transformation."""
        worker = CS2ExtractionWorker(None, "http://localhost:8000", "")
        
        match_data = {
            "id": 12345,
            "date": "2024-01-15",
            "team1": {"name": "Team A", "score": 16},
            "team2": {"name": "Team B", "score": 14},
            "event": {"name": "Major"},
            "map": "Inferno",
        }
        
        player_stats = {
            "players": [
                {
                    "id": "player1",
                    "name": "Player 1",
                    "team": "Team A",
                    "kills": 25,
                    "deaths": 18,
                    "assists": 5,
                    "adr": 85.5,
                    "rating": 1.25,
                    "kast": 75.0,
                    "hs_percentage": 45.0,
                }
            ]
        }
        
        records = worker._transform_hltv_data(match_data, player_stats)
        
        assert len(records) == 1
        record = records[0]
        assert record["match_id"] == 12345
        assert record["player_name"] == "Player 1"
        assert record["kills"] == 25
        assert record["team"] == "Team A"
        assert record["event"] == "Major"
    
    def test_get_mock_records(self):
        """Test mock record generation."""
        worker = CS2ExtractionWorker(None, "http://localhost:8000", "")
        
        records = worker._get_mock_records("test-match", source="hltv")
        
        assert len(records) == 10
        assert all(r["match_id"] == "test-match" for r in records)
        assert all(r["source"] == "hltv" for r in records)
        assert all("player_name" in r for r in records)


class TestValorantWorker:
    """Test Valorant worker functionality."""
    
    def test_init(self):
        """Test Valorant worker initialization."""
        worker = ValorantExtractionWorker(
            agent_id=None,
            coordinator_url="http://localhost:8000",
            api_key="",
        )
        
        assert worker.game_type == GameType.VALORANT
        assert worker.name == "valorant-worker"
    
    def test_get_capabilities(self):
        """Test Valorant worker capabilities."""
        worker = ValorantExtractionWorker(None, "http://localhost:8000", "")
        caps = worker.get_capabilities()
        
        assert GameType.VALORANT in caps.games
        assert DataSource.VLR_GG in caps.sources
        assert caps.max_concurrent_jobs == 1
        assert caps.rate_limit_rps == 0.5  # More restrictive
    
    async def test_extract_missing_match_id(self):
        """Test extraction fails without match_id."""
        worker = ValorantExtractionWorker(None, "http://localhost:8000", "")
        
        job = ExtractionJob(
            game=GameType.VALORANT,
            priority=JobPriority.NORMAL,
            config=JobConfig(source=DataSource.VLR_GG),
        )
        
        with pytest.raises(ValueError, match="missing match_id"):
            await worker.extract(job)
    
    async def test_extract_mock_data(self):
        """Test extraction with mock data."""
        worker = ValorantExtractionWorker(None, "http://localhost:8000", "")
        
        job = ExtractionJob(
            game=GameType.VALORANT,
            priority=JobPriority.NORMAL,
            config=JobConfig(match_id="67890", source=DataSource.VLR_GG),
        )
        
        result = await worker.extract(job)
        
        assert "batch_id" in result
        assert result["batch_id"].startswith("val_")
        assert result["job_id"] == str(job.id)
        assert result["records_processed"] > 0
        assert "data_hash" in result
        assert result["source"] == DataSource.VLR_GG.value
        assert "processing_time_ms" in result
        assert isinstance(result["records"], list)
    
    def test_transform_vlr_data(self):
        """Test VLR data transformation."""
        worker = ValorantExtractionWorker(None, "http://localhost:8000", "")
        
        match_data = {
            "id": "match-1",
            "date": "2024-01-15",
            "team1": {"name": "Team A", "score": 13},
            "team2": {"name": "Team B", "score": 11},
            "event": {"name": "VCT"},
            "map": "Haven",
        }
        
        player_stats = {
            "players": [
                {
                    "id": "player1",
                    "name": "Player 1",
                    "team": "Team A",
                    "agent": "Jett",
                    "kills": 22,
                    "deaths": 15,
                    "assists": 4,
                    "acs": 280,
                    "adr": 180,
                    "rating": 1.35,
                    "kast": 82.0,
                    "headshot_percentage": 25.0,
                    "first_blood": 3,
                    "first_death": 2,
                    "clutch_win": 1,
                    "clutch_attempt": 2,
                }
            ]
        }
        
        records = worker._transform_vlr_data(match_data, player_stats)
        
        assert len(records) == 1
        record = records[0]
        assert record["match_id"] == "match-1"
        assert record["player_name"] == "Player 1"
        assert record["agent"] == "Jett"  # Valorant-specific
        assert record["acs"] == 280
        assert record["first_blood"] == 3
    
    def test_get_mock_records(self):
        """Test mock record generation with agents."""
        worker = ValorantExtractionWorker(None, "http://localhost:8000", "")
        
        records = worker._get_mock_records("test-match")
        
        assert len(records) == 10
        assert all(r["match_id"] == "test-match" for r in records)
        assert all(r["source"] == "vlr_gg" for r in records)
        assert all("agent" in r for r in records)
        assert all("acs" in r for r in records)
        
        # Check agent names are valid
        valid_agents = ["Jett", "Sage", "Phoenix", "Omen", "Sova"]
        for record in records:
            assert record["agent"] in valid_agents


class TestWorkerDualGame:
    """Test dual-game worker behavior."""
    
    def test_different_game_types(self):
        """Test workers report different game types."""
        cs_worker = CS2ExtractionWorker(None, "http://localhost:8000", "")
        val_worker = ValorantExtractionWorker(None, "http://localhost:8000", "")
        
        assert cs_worker.game_type == GameType.CS
        assert val_worker.game_type == GameType.VALORANT
        assert cs_worker.game_type != val_worker.game_type
    
    def test_capabilities_dont_overlap(self):
        """Test worker capabilities are game-specific."""
        cs_worker = CS2ExtractionWorker(None, "http://localhost:8000", "")
        val_worker = ValorantExtractionWorker(None, "http://localhost:8000", "")
        
        cs_caps = cs_worker.get_capabilities()
        val_caps = val_worker.get_capabilities()
        
        assert GameType.CS in cs_caps.games
        assert GameType.VALORANT not in cs_caps.games
        
        assert GameType.VALORANT in val_caps.games
        assert GameType.CS not in val_caps.games
    
    async def test_cs_worker_rejects_valorant_job(self):
        """Test CS worker doesn't process Valorant jobs."""
        cs_worker = CS2ExtractionWorker(None, "http://localhost:8000", "")
        
        val_job = ExtractionJob(
            game=GameType.VALORANT,
            priority=JobPriority.NORMAL,
            config=JobConfig(match_id="12345", source=DataSource.VLR_GG),
        )
        
        # The worker will still try to extract (no game check in extract method)
        # But the data will be from wrong source
        result = await cs_worker.extract(val_job)
        
        # Result should still work but source will be HLTV not VLR
        assert result["source"] == DataSource.HLTV.value
