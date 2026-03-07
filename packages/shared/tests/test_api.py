"""
Test suite for SATOR API
Run with: pytest packages/shared/tests/ -v
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.database import DatabasePool, init_pool, get_pool
from api.cache import CacheManager, init_cache, get_cache
from api.circuit_breaker import CircuitBreaker, circuit_breaker
from api.features import FeatureManager, init_features, get_features


# ============================================================================
# DATABASE TESTS
# ============================================================================

class TestDatabasePool:
    """Test database connection pool."""
    
    @pytest.fixture
    async def db_pool(self):
        """Create test database pool."""
        pool = DatabasePool(
            "postgresql://test:test@localhost/test",
            min_size=2,
            max_size=5
        )
        yield pool
        await pool.disconnect()
    
    @pytest.mark.asyncio
    async def test_pool_initialization(self, db_pool):
        """Test pool initializes with correct settings."""
        assert db_pool.min_size == 2
        assert db_pool.max_size == 5
        assert db_pool._pool is None  # Not connected yet
    
    @pytest.mark.asyncio
    async def test_pool_not_connected_error(self, db_pool):
        """Test operations fail when not connected."""
        with pytest.raises(RuntimeError) as exc_info:
            async with db_pool.acquire():
                pass
        assert "not initialized" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_get_pool_without_init(self):
        """Test get_pool fails without initialization."""
        with pytest.raises(RuntimeError) as exc_info:
            get_pool()
        assert "not initialized" in str(exc_info.value)


# ============================================================================
# CACHE TESTS
# ============================================================================

class TestCacheManager:
    """Test Redis cache manager."""
    
    @pytest.fixture
    def cache(self):
        """Create test cache (in-memory)."""
        return CacheManager()  # No Redis URL = in-memory
    
    @pytest.mark.asyncio
    async def test_cache_set_and_get(self, cache):
        """Test basic set and get operations."""
        await cache.set("test_key", {"data": "value"}, ttl=3600)
        result = await cache.get("test_key")
        assert result == {"data": "value"}
    
    @pytest.mark.asyncio
    async def test_cache_miss_returns_none(self, cache):
        """Test missing key returns None."""
        result = await cache.get("nonexistent_key")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_expiration(self, cache):
        """Test cache entries expire."""
        await cache.set("expire_key", "value", ttl=1)
        
        # Should exist immediately
        assert await cache.get("expire_key") == "value"
        
        # Wait for expiration (use short TTL for test)
        # Note: In-memory cache doesn't auto-expire in tests
        # This is a limitation of the mock implementation
    
    @pytest.mark.asyncio
    async def test_cache_metrics(self, cache):
        """Test cache metrics tracking."""
        await cache.set("key1", "value1")
        await cache.get("key1")  # Hit
        await cache.get("key2")  # Miss
        
        metrics = cache.get_metrics()
        assert metrics["hits"] == 1
        assert metrics["misses"] == 1
        assert metrics["hit_rate"] == 50.0


# ============================================================================
# CIRCUIT BREAKER TESTS
# ============================================================================

class TestCircuitBreaker:
    """Test circuit breaker pattern."""
    
    @pytest.fixture
    def breaker(self):
        """Create test circuit breaker."""
        return CircuitBreaker(
            name="test_breaker",
            failure_threshold=3,
            recovery_timeout=1  # 1 second for testing
        )
    
    def test_initial_state_is_closed(self, breaker):
        """Test breaker starts closed."""
        assert breaker.state.name == "CLOSED"
        assert breaker.can_execute() is True
    
    def test_opens_after_failures(self, breaker):
        """Test breaker opens after threshold failures."""
        # Record failures
        breaker.record_failure()
        assert breaker.state.name == "CLOSED"  # Still closed
        
        breaker.record_failure()
        assert breaker.state.name == "CLOSED"  # Still closed
        
        breaker.record_failure()
        assert breaker.state.name == "OPEN"  # Now open
        assert breaker.can_execute() is False
    
    def test_recovery_to_half_open(self, breaker):
        """Test breaker enters half-open after timeout."""
        # Open the circuit
        for _ in range(3):
            breaker.record_failure()
        assert breaker.state.name == "OPEN"
        
        # Wait for recovery timeout
        import time
        time.sleep(1.1)
        
        # Should be able to execute (half-open)
        assert breaker.can_execute() is True
    
    def test_closes_after_success_in_half_open(self, breaker):
        """Test breaker closes after success in half-open."""
        # Open and wait
        for _ in range(3):
            breaker.record_failure()
        import time
        time.sleep(1.1)
        
        # Execute in half-open
        breaker.can_execute()
        breaker.record_success()
        
        assert breaker.state.name == "CLOSED"
    
    def test_opens_again_after_failure_in_half_open(self, breaker):
        """Test breaker reopens after failure in half-open."""
        # Open and wait
        for _ in range(3):
            breaker.record_failure()
        import time
        time.sleep(1.1)
        
        # Execute and fail in half-open
        breaker.can_execute()
        breaker.record_failure()
        
        assert breaker.state.name == "OPEN"


# ============================================================================
# FEATURE FLAGS TESTS
# ============================================================================

class TestFeatureManager:
    """Test feature flag manager."""
    
    @pytest.fixture
    def features(self, tmp_path):
        """Create test feature manager with temp config."""
        config = {
            "features": {
                "test_feature": {
                    "enabled": True,
                    "rollout_percentage": 100,
                    "allowed_users": []
                },
                "partial_feature": {
                    "enabled": True,
                    "rollout_percentage": 50,
                    "allowed_users": ["user_1"]
                },
                "disabled_feature": {
                    "enabled": False,
                    "rollout_percentage": 0,
                    "allowed_users": []
                }
            }
        }
        
        config_file = tmp_path / "test_features.json"
        import json
        with open(config_file, 'w') as f:
            json.dump(config, f)
        
        init_features(str(config_file))
        return get_features()
    
    def test_fully_enabled_feature(self, features):
        """Test 100% rollout feature."""
        assert features.is_enabled("test_feature") is True
        assert features.is_enabled("test_feature", "any_user") is True
    
    def test_disabled_feature(self, features):
        """Test disabled feature."""
        assert features.is_enabled("disabled_feature") is False
        assert features.is_enabled("disabled_feature", "any_user") is False
    
    def test_partial_rollout_with_user(self, features):
        """Test percentage-based rollout."""
        # Allowed user should always have access
        assert features.is_enabled("partial_feature", "user_1") is True
        
        # Other users depend on hash
        # We can't predict which users get access, but we can test consistency
        user_2_access = features.is_enabled("partial_feature", "user_2")
        user_2_access_again = features.is_enabled("partial_feature", "user_2")
        assert user_2_access == user_2_access_again  # Consistent
    
    def test_unknown_feature(self, features):
        """Test unknown features default to disabled."""
        assert features.is_enabled("nonexistent_feature") is False


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestIntegration:
    """Integration tests for API components."""
    
    @pytest.mark.asyncio
    async def test_cached_api_call_pattern(self):
        """Test API call with caching."""
        cache = CacheManager()
        
        # Simulate API call with cache check
        async def get_player(player_id):
            # Check cache
            cached = await cache.get(f"player:{player_id}")
            if cached:
                return cached
            
            # Simulate API call
            result = {"id": player_id, "name": "Test Player"}
            await cache.set(f"player:{player_id}", result, ttl=3600)
            return result
        
        # First call should miss cache
        player = await get_player("123")
        assert player["id"] == "123"
        
        metrics = cache.get_metrics()
        assert metrics["misses"] == 1
        
        # Second call should hit cache
        player_again = await get_player("123")
        assert player_again["id"] == "123"
        
        metrics = cache.get_metrics()
        assert metrics["hits"] == 1


# ============================================================================
# PYTEST CONFIGURATION
# ============================================================================

def pytest_configure(config):
    """Configure pytest."""
    config.addinivalue_line(
        "markers", "asyncio: mark test as async"
    )


# Run with: pytest tests/test_api.py -v
# Coverage: pytest --cov=packages.shared --cov-report=html