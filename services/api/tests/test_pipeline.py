"""[Ver001.000]
Tests for pipeline module — ETL and orchestration.
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock

from njz_api.pipeline.etl import (
    ETLPipeline,
    ETLStage,
    ETLRecord,
)
from njz_api.pipeline.orchestrator import (
    PipelineOrchestrator,
    PipelineMode,
    PipelineStage,
    PipelineResult,
)


class TestETLStage:
    """Test ETLStage enum."""
    
    def test_stage_values(self):
        """Test ETL stage enum values."""
        assert ETLStage.EXTRACT.name == "EXTRACT"
        assert ETLStage.VALIDATE.name == "VALIDATE"
        assert ETLStage.TRANSFORM.name == "TRANSFORM"
        assert ETLStage.ENRICH.name == "ENRICH"
        assert ETLStage.DEDUPLICATE.name == "DEDUPLICATE"
        assert ETLStage.PARTITION.name == "PARTITION"
        assert ETLStage.LOAD.name == "LOAD"
        assert ETLStage.INDEX.name == "INDEX"


class TestETLRecord:
    """Test ETLRecord dataclass."""
    
    def test_record_creation(self):
        """Test creating ETL record."""
        record = ETLRecord(
            record_id="match123",
            source="vlr_gg",
            raw_data={"html": "<html>"},
            checksum="abc123",
        )
        
        assert record.record_id == "match123"
        assert record.source == "vlr_gg"
        assert record.stage == ETLStage.EXTRACT
        assert record.error is None
    
    def test_record_default_values(self):
        """Test ETL record default values."""
        record = ETLRecord(record_id="test", source="test")
        
        assert record.raw_data == {}
        assert record.transformed_data == {}
        assert record.enriched_data == {}
        assert record.partition is None


class TestETLPipeline:
    """Test ETLPipeline class."""
    
    @pytest.fixture
    def pipeline(self):
        return ETLPipeline()
    
    def test_pipeline_initialization(self, pipeline):
        """Test pipeline initialization."""
        assert pipeline._redis is None
        assert pipeline._records == []
    
    @pytest.mark.asyncio
    async def test_extract(self, pipeline):
        """Test extract stage."""
        with patch('njz_api.pipeline.etl.get_db_pool') as mock_get_pool:
            mock_pool = AsyncMock()
            mock_get_pool.return_value = mock_pool
            
            mock_conn = AsyncMock()
            mock_conn.fetchrow.return_value = {
                "raw_html": "<html>test</html>",
                "checksum": "abc123",
            }
            
            # Properly mock async context manager
            mock_acquire = AsyncMock()
            mock_acquire.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_acquire.__aexit__ = AsyncMock(return_value=False)
            mock_pool.acquire = MagicMock(return_value=mock_acquire)
            
            records = await pipeline.extract("vlr_gg", ["match1"])
            
            # Records should be populated if database returns data
            assert len(records) == 1
            assert records[0].record_id == "match1"
            assert records[0].source == "vlr_gg"
    
    @pytest.mark.asyncio
    async def test_validate(self, pipeline):
        """Test validate stage."""
        records = [
            ETLRecord(record_id="1", source="test", checksum="abc123"),
            ETLRecord(record_id="2", source="test", checksum=""),  # Invalid
        ]
        
        validated = await pipeline.validate(records)
        
        # First record should be valid
        assert validated[0].stage == ETLStage.VALIDATE
        assert validated[0].error is None
        
        # Second record should be filtered out (no checksum)
        assert len(validated) == 1
    
    @pytest.mark.asyncio
    async def test_transform(self, pipeline):
        """Test transform stage."""
        records = [
            ETLRecord(
                record_id="match1",
                source="vlr_gg",
                raw_data={"html": "<html>test</html>"},
                checksum="abc123",
            ),
        ]
        
        transformed = await pipeline.transform(records)
        
        assert transformed[0].stage == ETLStage.TRANSFORM
        assert "match_id" in transformed[0].transformed_data
        assert transformed[0].transformed_data["match_id"] == "match1"
    
    @pytest.mark.asyncio
    async def test_enrich(self, pipeline):
        """Test enrich stage."""
        records = [
            ETLRecord(
                record_id="match1",
                source="vlr_gg",
                transformed_data={"match_id": "match1"},
            ),
        ]
        
        enriched = await pipeline.enrich(records)
        
        assert enriched[0].stage == ETLStage.ENRICH
        assert enriched[0].enriched_data.get("_enriched") is True
    
    @pytest.mark.asyncio
    async def test_deduplicate(self, pipeline):
        """Test deduplicate stage."""
        records = [
            ETLRecord(record_id="1", source="test", checksum="abc"),
            ETLRecord(record_id="2", source="test", checksum="def"),
            ETLRecord(record_id="3", source="test", checksum="abc"),  # Duplicate
        ]
        
        deduplicated = await pipeline.deduplicate(records)
        
        assert len(deduplicated) == 2
        assert all(r.stage == ETLStage.DEDUPLICATE for r in deduplicated)
    
    @pytest.mark.asyncio
    async def test_partition(self, pipeline):
        """Test partition stage."""
        records = [
            ETLRecord(record_id="1", source="test"),
            ETLRecord(record_id="2", source="test"),
        ]
        
        partitioned = await pipeline.partition(records)
        
        assert all(r.stage == ETLStage.PARTITION for r in partitioned)
        assert all(r.partition == "both" for r in partitioned)
    
    @pytest.mark.asyncio
    async def test_index(self, pipeline):
        """Test index stage."""
        records = [
            ETLRecord(
                record_id="match1",
                source="test",
                enriched_data={"match_id": "match1"},
            ),
        ]
        
        with patch.object(pipeline, '_get_redis', new_callable=AsyncMock) as mock_get_redis:
            mock_redis = AsyncMock()
            mock_get_redis.return_value = mock_redis
            
            indexed = await pipeline.index(records)
            
            assert indexed[0].stage == ETLStage.INDEX
            mock_redis.hset.assert_called_once()


class TestPipelineMode:
    """Test PipelineMode enum."""
    
    def test_mode_values(self):
        """Test pipeline mode enum values."""
        assert PipelineMode.DELTA.value == "delta"
        assert PipelineMode.FULL.value == "full"
        assert PipelineMode.BACKFILL.value == "backfill"


class TestPipelineStage:
    """Test PipelineStage enum."""
    
    def test_stage_values(self):
        """Test pipeline stage enum values."""
        assert PipelineStage.ALL.value == "all"
        assert PipelineStage.DISCOVER.value == "discover"
        assert PipelineStage.FETCH.value == "fetch"
        assert PipelineStage.VERIFY.value == "verify"


class TestPipelineResult:
    """Test PipelineResult dataclass."""
    
    def test_result_creation(self):
        """Test creating pipeline result."""
        result = PipelineResult(
            mode="delta",
            epochs=[1, 2, 3],
            records_discovered=100,
            records_stored=95,
            records_failed=5,
        )
        
        assert result.mode == "delta"
        assert result.epochs == [1, 2, 3]
        assert result.records_discovered == 100
        assert result.records_stored == 95
        assert result.records_failed == 5
    
    def test_result_to_dict(self):
        """Test converting result to dict."""
        result = PipelineResult(
            mode="delta",
            epochs=[1, 2],
            records_stored=50,
            duration_seconds=123.456,
        )
        
        d = result.to_dict()
        
        assert d["mode"] == "delta"
        assert d["epochs"] == [1, 2]
        assert d["records_stored"] == 50
        assert d["duration_seconds"] == 123.46  # Rounded to 2 decimals


class TestPipelineOrchestrator:
    """Test PipelineOrchestrator class."""
    
    @pytest.fixture
    def orchestrator(self):
        return PipelineOrchestrator(max_workers=5, batch_size=50)
    
    def test_orchestrator_initialization(self, orchestrator):
        """Test orchestrator initialization."""
        assert orchestrator.max_workers == 5
        assert orchestrator.batch_size == 50
        assert orchestrator._redis is None
    
    @pytest.mark.asyncio
    async def test_discover_delta_mode(self, orchestrator):
        """Test discover in delta mode."""
        with patch('njz_api.pipeline.orchestrator.get_db_pool') as mock_get_pool:
            mock_pool = AsyncMock()
            mock_get_pool.return_value = mock_pool
            
            mock_conn = AsyncMock()
            mock_conn.fetch.return_value = [
                {"entity_id": "match1"},
                {"entity_id": "match2"},
            ]
            
            # Mock async context manager
            class MockAcquire:
                async def __aenter__(self):
                    return mock_conn
                async def __aexit__(self, *args):
                    return False
            
            mock_pool.acquire = MockAcquire
            
            match_ids = await orchestrator.discover(
                PipelineMode.DELTA,
                [1, 2, 3]
            )
            
            assert len(match_ids) == 2
            assert "match1" in match_ids
            assert "match2" in match_ids
    
    @pytest.mark.asyncio
    async def test_get_status(self, orchestrator):
        """Test getting pipeline status."""
        with patch.object(orchestrator, '_get_redis', new_callable=AsyncMock) as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.hgetall.return_value = {
                "state": "running",
                "last_run": "2026-01-01T00:00:00",
                "records_processed": "100",
            }
            mock_get_redis.return_value = mock_redis
            
            status = await orchestrator.get_status()
            
            assert status["status"] == "running"
            assert status["records_processed"] == 100
    
    @pytest.mark.asyncio
    async def test_get_status_failure(self, orchestrator):
        """Test getting status when Redis fails."""
        with patch.object(orchestrator, '_get_redis', new_callable=AsyncMock) as mock_get_redis:
            mock_get_redis.side_effect = Exception("Redis error")
            
            status = await orchestrator.get_status()
            
            assert status["status"] == "unknown"
            assert "error" in status


class TestPipelineIntegration:
    """Integration tests for pipeline."""
    
    @pytest.mark.asyncio
    async def test_full_pipeline_run(self):
        """Test running full pipeline."""
        pipeline = ETLPipeline()
        
        # Mock all database and Redis calls
        with patch('njz_api.pipeline.etl.get_db_pool') as mock_get_pool, \
             patch('njz_api.pipeline.etl.get_redis_client') as mock_get_redis:
            
            mock_pool = AsyncMock()
            mock_conn = AsyncMock()
            mock_conn.fetchrow.return_value = {
                "raw_html": "<html>test</html>",
                "checksum": "abc123",
            }
            
            # Mock async context manager
            class MockAcquire:
                async def __aenter__(self):
                    return mock_conn
                async def __aexit__(self, *args):
                    return False
            
            mock_pool.acquire = MockAcquire
            mock_get_pool.return_value = mock_pool
            
            mock_redis = AsyncMock()
            mock_get_redis.return_value = mock_redis
            
            result = await pipeline.run_full_pipeline("vlr_gg", ["match1"])
            
            assert "total" in result
            assert "successful" in result
            assert "failed" in result
            assert "duration_seconds" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
