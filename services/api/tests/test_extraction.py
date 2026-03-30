"""[Ver001.000]
Tests for extraction module — VLR epoch harvester and resilient client.
"""
import pytest
from datetime import date
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import aiohttp

from njz_api.extraction.vlr_resilient_client import (
    VLRResilientClient,
    CircuitBreaker,
    ValidatedResponse,
)
from njz_api.extraction.epoch_harvester import VLREpochHarvester, EPOCHS


class TestCircuitBreaker:
    """Test CircuitBreaker class."""
    
    def test_circuit_breaker_initial_state(self):
        """Test initial state is CLOSED."""
        cb = CircuitBreaker()
        assert cb.state == "CLOSED"
        assert cb.can_attempt() is True
    
    def test_circuit_breaker_record_failure(self):
        """Test recording failures."""
        cb = CircuitBreaker(failure_threshold=3)
        cb.record_failure()
        cb.record_failure()
        assert cb.state == "CLOSED"
        assert cb.failure_count == 2
        
        cb.record_failure()  # Third failure
        assert cb.state == "OPEN"
        assert cb.can_attempt() is False
    
    def test_circuit_breaker_record_success(self):
        """Test recording success resets failures."""
        cb = CircuitBreaker()
        cb.record_failure()
        cb.record_failure()
        assert cb.failure_count == 2
        
        cb.record_success()
        assert cb.failure_count == 0
        assert cb.state == "CLOSED"
    
    def test_circuit_breaker_recovery(self):
        """Test circuit breaker recovery."""
        cb = CircuitBreaker(failure_threshold=1, recovery_timeout=0)
        cb.record_failure()
        assert cb.state == "OPEN"
        
        # Should be able to attempt after recovery timeout
        assert cb.can_attempt() is True
        assert cb.state == "HALF_OPEN"


class TestVLRResilientClient:
    """Test VLRResilientClient class."""
    
    def test_client_initialization(self):
        """Test client initialization."""
        client = VLRResilientClient(rate_limit_seconds=2.0, max_concurrent=5)
        assert client.rate_limit == 2.0
        assert client.semaphore._value == 5
        assert client.circuit_breaker.state == "CLOSED"
    
    def test_compute_checksum(self):
        """Test checksum computation."""
        client = VLRResilientClient()
        checksum1 = client._compute_checksum("test data")
        checksum2 = client._compute_checksum("test data")
        checksum3 = client._compute_checksum("different data")
        
        assert checksum1 == checksum2
        assert checksum1 != checksum3
        assert len(checksum1) == 64  # SHA-256 hex
    
    def test_validate_schema(self):
        """Test schema validation."""
        client = VLRResilientClient()
        
        # Valid data with all expected fields
        valid_data = {
            "player": "test",
            "team": "team1",
            "kills": 10,
            "deaths": 5,
            "assists": 3,
        }
        result = client.validate_schema(valid_data)
        assert result["missing"]  # Some fields missing
        assert not result["extra"]
        
        # Data with extra fields
        extra_data = {"player": "test", "extra_field": "value"}
        result = client.validate_schema(extra_data)
        assert result["extra"] == ["extra_field"]
    
    def test_next_user_agent(self):
        """Test rotating user agents."""
        client = VLRResilientClient()
        ua1 = client._next_user_agent()
        ua2 = client._next_user_agent()
        
        assert "NJZiteGeisTe" in ua1 or "SATOR" in ua1
        assert ua1 != ua2  # Should rotate


class TestVLREpochHarvester:
    """Test VLREpochHarvester class."""
    
    def test_harvester_initialization(self):
        """Test harvester initialization."""
        harvester = VLREpochHarvester(mode="delta", epochs=[1, 2])
        assert harvester.mode == "delta"
        assert harvester.target_epochs == [1, 2]
        assert harvester.max_concurrent == 3
    
    def test_epochs_configuration(self):
        """Test epochs configuration."""
        assert 1 in EPOCHS
        assert 2 in EPOCHS
        assert 3 in EPOCHS
        
        # Check epoch 1 configuration
        epoch1 = EPOCHS[1]
        assert epoch1["start"] == date(2020, 12, 3)
        assert epoch1["end"] == date(2022, 12, 31)
        assert epoch1["confidence_floor"] == 50.0
        
        # Check epoch 3 has today's date
        epoch3 = EPOCHS[3]
        assert epoch3["start"] == date(2026, 1, 1)
        assert epoch3["end"] == date.today()
    
    @pytest.mark.asyncio
    async def test_is_processed_redis(self):
        """Test checking if match is processed via Redis."""
        harvester = VLREpochHarvester()
        
        # Mock Redis
        mock_redis = AsyncMock()
        mock_redis.sismember.return_value = True
        harvester._redis = mock_redis
        
        result = await harvester._is_processed("match123")
        
        assert result is True
        mock_redis.sismember.assert_called_once_with("vlr:harvester:processed", "match123")
    
    @pytest.mark.asyncio
    async def test_mark_processed(self):
        """Test marking match as processed."""
        harvester = VLREpochHarvester()
        
        # Mock Redis
        mock_redis = AsyncMock()
        harvester._redis = mock_redis
        
        await harvester._mark_processed("match123", "checksum456")
        
        mock_redis.sadd.assert_called_once_with("vlr:harvester:processed", "match123")
        mock_redis.hset.assert_called_once_with("vlr:checksums", "match123", "checksum456")
    
    @pytest.mark.asyncio
    async def test_is_processed_redis_failure(self):
        """Test Redis failure handling."""
        harvester = VLREpochHarvester()
        
        # Mock Redis to raise exception
        mock_redis = AsyncMock()
        mock_redis.sismember.side_effect = Exception("Redis error")
        harvester._redis = mock_redis
        
        # Should return False on error, not crash
        result = await harvester._is_processed("match123")
        assert result is False


class TestEpochs:
    """Test epoch configurations."""
    
    def test_epoch_date_ranges(self):
        """Test epoch date ranges are valid."""
        for epoch_num, config in EPOCHS.items():
            assert config["start"] <= config["end"], f"Epoch {epoch_num}: start must be before end"
            assert config["confidence_floor"] > 0
            assert config["confidence_floor"] <= 100
    
    def test_epoch_confidence_progression(self):
        """Test confidence floor increases with epochs."""
        confidence_values = [EPOCHS[i]["confidence_floor"] for i in [1, 2, 3]]
        assert confidence_values == sorted(confidence_values)


class TestValidatedResponse:
    """Test ValidatedResponse dataclass."""
    
    def test_response_creation(self):
        """Test creating validated response."""
        response = ValidatedResponse(
            url="https://vlr.gg/123",
            status=200,
            raw_html="<html></html>",
            checksum="abc123",
            schema_valid=True,
        )
        
        assert response.url == "https://vlr.gg/123"
        assert response.status == 200
        assert response.schema_valid is True
        assert response.from_cache is False
    
    def test_response_with_drift(self):
        """Test response with schema drift."""
        response = ValidatedResponse(
            url="https://vlr.gg/123",
            status=200,
            raw_html="<html></html>",
            checksum="abc123",
            schema_valid=False,
            schema_drift_fields={"missing": ["field1"], "extra": ["field2"]},
        )
        
        assert response.schema_valid is False
        assert "missing" in response.schema_drift_fields


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
