"""[Ver001.000]
Tests for health check endpoints.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import asyncio

from src.njz_api.health import (
    liveness_probe,
    readiness_probe,
    database_health,
    redis_health,
    health_summary,
)


class TestLivenessProbe:
    """Tests for liveness endpoint."""
    
    @pytest.mark.asyncio
    async def test_liveness_returns_alive(self):
        """Test liveness probe returns alive status."""
        result = await liveness_probe()
        
        assert result["status"] == "alive"
        assert result["service"] == "njz-platform-api"
        assert "timestamp" in result


class TestReadinessProbe:
    """Tests for readiness endpoint."""
    
    @pytest.mark.asyncio
    async def test_readiness_all_healthy(self):
        """Test readiness when all components healthy."""
        with patch("src.njz_api.health.check_database_connection") as mock_db:
            mock_db.return_value = True
            
            with patch("src.njz_api.health.get_redis_client") as mock_redis:
                mock_client = AsyncMock()
                mock_client.ping = AsyncMock()
                mock_redis.return_value = mock_client
                
                result = await readiness_probe()
                
                assert result["status"] == "ready"
                assert result["checks"]["database"] == "healthy"
                assert result["checks"]["redis"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_readiness_database_unhealthy(self):
        """Test readiness returns 503 when database unhealthy."""
        from fastapi import HTTPException
        
        with patch("src.njz_api.health.check_database_connection") as mock_db:
            mock_db.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                await readiness_probe()
            
            assert exc_info.value.status_code == 503


class TestDatabaseHealth:
    """Tests for database health endpoint."""
    
    @pytest.mark.asyncio
    async def test_database_health_healthy(self):
        """Test database health when connection successful."""
        with patch("src.njz_api.health.check_database_connection") as mock_check:
            mock_check.return_value = True
            
            result = await database_health()
            
            assert result["component"] == "database"
            assert result["healthy"] is True
            assert "latency_ms" in result
    
    @pytest.mark.asyncio
    async def test_database_health_unhealthy(self):
        """Test database health when connection fails."""
        with patch("src.njz_api.health.check_database_connection") as mock_check:
            mock_check.side_effect = Exception("Connection refused")
            
            result = await database_health()
            
            assert result["component"] == "database"
            assert result["healthy"] is False
            assert "error" in result


class TestRedisHealth:
    """Tests for Redis health endpoint."""
    
    @pytest.mark.asyncio
    async def test_redis_health_healthy(self):
        """Test Redis health when connection successful."""
        with patch("src.njz_api.health.get_redis_client") as mock_get:
            mock_client = AsyncMock()
            mock_client.ping = AsyncMock()
            mock_client.info = AsyncMock(return_value={
                "redis_version": "7.0.0",
                "connected_clients": 10,
            })
            mock_get.return_value = mock_client
            
            result = await redis_health()
            
            assert result["component"] == "redis"
            assert result["healthy"] is True
            assert result["version"] == "7.0.0"
    
    @pytest.mark.asyncio
    async def test_redis_health_unhealthy(self):
        """Test Redis health when connection fails."""
        with patch("src.njz_api.health.get_redis_client") as mock_get:
            mock_get.side_effect = Exception("Connection refused")
            
            result = await redis_health()
            
            assert result["component"] == "redis"
            assert result["healthy"] is False


class TestHealthSummary:
    """Tests for health summary endpoint."""
    
    @pytest.mark.asyncio
    async def test_summary_all_up(self):
        """Test summary when all components up."""
        with patch("src.njz_api.health.check_database_connection") as mock_db:
            mock_db.return_value = True
            
            with patch("src.njz_api.health.get_redis_client") as mock_redis:
                mock_client = AsyncMock()
                mock_client.ping = AsyncMock()
                mock_redis.return_value = mock_client
                
                result = await health_summary()
                
                assert result["status"] == "healthy"
                assert result["components"]["database"] == "up"
                assert result["components"]["redis"] == "up"
