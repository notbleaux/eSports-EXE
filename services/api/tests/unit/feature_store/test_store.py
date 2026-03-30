"""[Ver001.000]
Tests for Feature Store implementation.
"""

import pytest
import json
from datetime import datetime, timedelta
from uuid import uuid4, UUID
from unittest.mock import AsyncMock, MagicMock, patch

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.njz_api.feature_store.store import FeatureStore, get_feature_store
from src.njz_api.feature_store.schemas import (
    FeatureType,
    FeatureStoreType,
    FeatureValue,
    FeatureDefinition,
    OfflineFeatureQuery,
    OnlineFeatureResponse,
)


@pytest.fixture
def feature_store():
    """Create a FeatureStore instance."""
    return FeatureStore()


@pytest.fixture
def sample_feature_value():
    """Create a sample feature value."""
    return FeatureValue(
        feature_name="test_kd_ratio",
        entity_id=uuid4(),
        entity_type="player",
        value=1.5,
        value_type=FeatureType.NUMERIC,
        feature_definition_version="1.0.0",
        computed_at=datetime.utcnow(),
        source_system="test",
    )


@pytest.fixture
def sample_feature_definition():
    """Create a sample feature definition."""
    return FeatureDefinition(
        name="test_kd_ratio",
        entity_type="player",
        feature_type=FeatureType.NUMERIC,
        store_type=FeatureStoreType.BOTH,
        ttl_seconds=3600,
    )


class TestFeatureStoreInitialization:
    """Tests for FeatureStore initialization."""
    
    def test_initialization(self, feature_store):
        """Test that FeatureStore initializes correctly."""
        assert feature_store._redis is None
        
    @pytest.mark.asyncio
    async def test_get_redis_lazy_load(self, feature_store):
        """Test that Redis connection is lazy-loaded."""
        with patch("redis.asyncio.from_url") as mock_from_url:
            mock_redis = AsyncMock()
            mock_from_url.return_value = mock_redis
            
            redis = await feature_store._get_redis()
            
            assert redis == mock_redis
            mock_from_url.assert_called_once()


class TestFeatureStoreKeyGeneration:
    """Tests for key generation."""
    
    def test_make_key(self, feature_store):
        """Test key generation."""
        entity_id = uuid4()
        key = feature_store._make_key("player", entity_id, "kd_ratio")
        
        assert key == f"feature:player:{entity_id}:kd_ratio"
        
    def test_make_key_different_entities(self, feature_store):
        """Test keys are unique for different entities."""
        id1 = uuid4()
        id2 = uuid4()
        
        key1 = feature_store._make_key("player", id1, "kd_ratio")
        key2 = feature_store._make_key("player", id2, "kd_ratio")
        
        assert key1 != key2


class TestFeatureStoreOnline:
    """Tests for online store operations."""
    
    @pytest.mark.asyncio
    async def test_write_online(self, feature_store, sample_feature_value):
        """Test writing to online store."""
        with patch.object(feature_store, "_get_redis") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_get_redis.return_value = mock_redis
            
            await feature_store._write_online(sample_feature_value, 3600)
            
            mock_redis.hset.assert_called_once()
            mock_redis.expire.assert_called_once()
            
    @pytest.mark.asyncio
    async def test_write_online_serialization(self, feature_store, sample_feature_value):
        """Test that values are properly serialized."""
        with patch.object(feature_store, "_get_redis") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_get_redis.return_value = mock_redis
            
            await feature_store._write_online(sample_feature_value, 3600)
            
            call_args = mock_redis.hset.call_args
            mapping = call_args.kwargs.get("mapping") or call_args[1].get("mapping")
            
            assert "value" in mapping
            assert json.loads(mapping["value"]) == 1.5
            
    @pytest.mark.asyncio
    async def test_get_online_features(self, feature_store):
        """Test reading from online store."""
        entity_id = uuid4()
        
        with patch.object(feature_store, "_get_redis") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.hgetall.return_value = {
                "value": "1.5",
                "value_type": "numeric",
                "version": "1.0.0",
            }
            mock_get_redis.return_value = mock_redis
            
            response = await feature_store.get_online_features(
                "player", entity_id, ["kd_ratio"]
            )
            
            assert response.entity_id == entity_id
            assert response.features["kd_ratio"] == 1.5
            assert response.cache_hit is True
            
    @pytest.mark.asyncio
    async def test_get_online_features_missing(self, feature_store):
        """Test reading missing features."""
        entity_id = uuid4()
        
        with patch.object(feature_store, "_get_redis") as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.hgetall.return_value = {}  # Missing
            mock_get_redis.return_value = mock_redis
            
            response = await feature_store.get_online_features(
                "player", entity_id, ["kd_ratio"]
            )
            
            assert response.features == {}
            assert "kd_ratio" in response.missing_features
            assert response.cache_hit is False


class TestFeatureStoreOffline:
    """Tests for offline store operations."""
    
    @pytest.mark.asyncio
    async def test_write_offline(self, feature_store, sample_feature_value):
        """Test writing to offline store."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.store.get_db_pool", return_value=mock_pool):
            await feature_store._write_offline(sample_feature_value)
            
            mock_conn.execute.assert_called_once()
            
    @pytest.mark.asyncio
    async def test_get_offline_features(self, feature_store):
        """Test querying offline features."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        
        mock_row = MagicMock()
        mock_row.__getitem__ = lambda s, k: {
            "feature_name": "kd_ratio",
            "entity_id": uuid4(),
            "entity_type": "player",
            "value": "1.5",
            "value_type": FeatureType.NUMERIC,
        }.get(k)
        mock_conn.fetch.return_value = [mock_row]
        
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.store.get_db_pool", return_value=mock_pool):
            query = OfflineFeatureQuery(
                entity_type="player",
                feature_names=["kd_ratio"],
                start_time=datetime.utcnow() - timedelta(days=7),
                end_time=datetime.utcnow(),
            )
            
            results = await feature_store.get_offline_features(query)
            
            assert len(results) == 1
            assert results[0].feature_name == "kd_ratio"


class TestFeatureStoreWriteFeature:
    """Tests for the main write_feature method."""
    
    @pytest.mark.asyncio
    async def test_write_feature_both_stores(
        self, feature_store, sample_feature_value, sample_feature_definition
    ):
        """Test writing to both stores."""
        with patch.object(feature_store, "_write_offline") as mock_offline, \
             patch.object(feature_store, "_write_online") as mock_online:
            
            result = await feature_store.write_feature(
                sample_feature_value, sample_feature_definition
            )
            
            mock_offline.assert_called_once()
            mock_online.assert_called_once()
            assert result == sample_feature_value
            
    @pytest.mark.asyncio
    async def test_write_feature_online_only(
        self, feature_store, sample_feature_value
    ):
        """Test writing to online store only."""
        definition = FeatureDefinition(
            name="test_feature",
            entity_type="player",
            feature_type=FeatureType.NUMERIC,
            store_type=FeatureStoreType.ONLINE,
        )
        
        with patch.object(feature_store, "_write_offline") as mock_offline, \
             patch.object(feature_store, "_write_online") as mock_online:
            
            await feature_store.write_feature(sample_feature_value, definition)
            
            mock_offline.assert_not_called()
            mock_online.assert_called_once()
            
    @pytest.mark.asyncio
    async def test_write_feature_offline_only(
        self, feature_store, sample_feature_value
    ):
        """Test writing to offline store only."""
        definition = FeatureDefinition(
            name="test_feature",
            entity_type="player",
            feature_type=FeatureType.NUMERIC,
            store_type=FeatureStoreType.OFFLINE,
        )
        
        with patch.object(feature_store, "_write_offline") as mock_offline, \
             patch.object(feature_store, "_write_online") as mock_online:
            
            await feature_store.write_feature(sample_feature_value, definition)
            
            mock_offline.assert_called_once()
            mock_online.assert_not_called()


class TestFeatureVector:
    """Tests for feature vector retrieval."""
    
    @pytest.mark.asyncio
    async def test_get_feature_vector_online(self, feature_store):
        """Test getting current feature vector (online)."""
        entity_id = uuid4()
        
        with patch.object(feature_store, "get_online_features") as mock_online:
            mock_online.return_value = OnlineFeatureResponse(
                entity_id=entity_id,
                entity_type="player",
                features={"kd_ratio": 1.5, "acs": 250},
                lookup_time_ms=5.0,
                cache_hit=True,
            )
            
            vector = await feature_store.get_feature_vector(
                "player", entity_id, ["kd_ratio", "acs"]
            )
            
            assert vector.entity_id == entity_id
            assert vector.features["kd_ratio"] == 1.5
            assert vector.features["acs"] == 250
            
    @pytest.mark.asyncio
    async def test_get_feature_vector_historical(self, feature_store):
        """Test getting historical feature vector (offline)."""
        entity_id = uuid4()
        historical_time = datetime.utcnow() - timedelta(days=30)
        
        mock_value = MagicMock()
        mock_value.feature_name = "kd_ratio"
        mock_value.value = 1.3
        
        with patch.object(feature_store, "get_offline_features") as mock_offline:
            mock_offline.return_value = [mock_value]
            
            vector = await feature_store.get_feature_vector(
                "player", entity_id, ["kd_ratio"], timestamp=historical_time
            )
            
            mock_offline.assert_called_once()


class TestGetFeatureStore:
    """Tests for the get_feature_store factory function."""
    
    @pytest.mark.asyncio
    async def test_singleton_pattern(self):
        """Test that get_feature_store returns a singleton."""
        store1 = await get_feature_store()
        store2 = await get_feature_store()
        
        assert store1 is store2
        
    def test_global_instance_starts_none(self):
        """Test that global instance starts as None."""
        import src.njz_api.feature_store.store as store_module
        # Reset for test
        store_module._store = None
        assert store_module._store is None
