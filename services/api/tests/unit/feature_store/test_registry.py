"""[Ver001.000]
Tests for Feature Registry implementation.
"""

import pytest
import json
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.njz_api.feature_store.registry import FeatureRegistry, get_feature_registry
from src.njz_api.feature_store.schemas import (
    FeatureDefinition,
    FeatureView,
    FeatureType,
    FeatureStoreType,
)


@pytest.fixture
def feature_registry():
    """Create a FeatureRegistry instance."""
    return FeatureRegistry()


@pytest.fixture
def sample_feature_definition():
    """Create a sample feature definition."""
    return FeatureDefinition(
        name="player_kd_ratio",
        version="1.0.0",
        entity_type="player",
        feature_type=FeatureType.NUMERIC,
        store_type=FeatureStoreType.BOTH,
        description="Kill/death ratio",
        owner="data-team",
    )


@pytest.fixture
def sample_feature_view():
    """Create a sample feature view."""
    return FeatureView(
        name="player_performance",
        entity_type="player",
        features=["kd_ratio", "acs", "headshot_pct"],
        description="Key player performance metrics",
        owner="ml-team",
    )


class TestFeatureRegistryInitialization:
    """Tests for FeatureRegistry initialization."""
    
    def test_initialization(self, feature_registry):
        """Test that FeatureRegistry initializes correctly."""
        assert feature_registry._cache == {}
        assert feature_registry._view_cache == {}


class TestRegisterFeature:
    """Tests for feature registration."""
    
    @pytest.mark.asyncio
    async def test_register_new_feature(self, feature_registry, sample_feature_definition):
        """Test registering a new feature."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = None  # No existing feature
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            result = await feature_registry.register_feature(sample_feature_definition)
            
            assert result.name == "player_kd_ratio"
            mock_conn.execute.assert_called_once()
            assert "player_kd_ratio" in feature_registry._cache
            
    @pytest.mark.asyncio
    async def test_register_feature_skip_if_exists(
        self, feature_registry, sample_feature_definition
    ):
        """Test skip_if_exists behavior."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {"name": "player_kd_ratio", "version": "1.0.0"}
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        # Pre-populate cache
        feature_registry._cache["player_kd_ratio"] = sample_feature_definition
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            with patch.object(
                feature_registry, "get_feature_definition", return_value=sample_feature_definition
            ):
                result = await feature_registry.register_feature(
                    sample_feature_definition, skip_if_exists=True
                )
                
                # Should not execute insert
                mock_conn.execute.assert_not_called()
                assert result == sample_feature_definition


class TestGetFeatureDefinition:
    """Tests for retrieving feature definitions."""
    
    @pytest.mark.asyncio
    async def test_get_from_cache(self, feature_registry, sample_feature_definition):
        """Test getting feature from cache."""
        feature_registry._cache["player_kd_ratio"] = sample_feature_definition
        
        result = await feature_registry.get_feature_definition("player_kd_ratio")
        
        assert result == sample_feature_definition
        
    @pytest.mark.asyncio
    async def test_get_from_database(self, feature_registry):
        """Test getting feature from database."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {
            "name": "player_kd_ratio",
            "version": "1.0.0",
            "entity_type": "player",
            "feature_type": FeatureType.NUMERIC,
            "store_type": FeatureStoreType.BOTH,
            "ttl_seconds": None,
            "description": "Test feature",
            "tags": json.dumps(["test"]),
            "nullability": False,
            "default_value": None,
            "validation_rules": json.dumps({}),
            "owner": "test",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            result = await feature_registry.get_feature_definition("player_kd_ratio")
            
            assert result.name == "player_kd_ratio"
            assert "player_kd_ratio" in feature_registry._cache
            
    @pytest.mark.asyncio
    async def test_get_specific_version(self, feature_registry):
        """Test getting a specific version."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {
            "name": "player_kd_ratio",
            "version": "2.0.0",
        }
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            result = await feature_registry.get_feature_definition(
                "player_kd_ratio", version="2.0.0"
            )
            
            assert result.version == "2.0.0"
            # Should not cache specific versions
            assert "player_kd_ratio" not in feature_registry._cache
            
    @pytest.mark.asyncio
    async def test_get_not_found(self, feature_registry):
        """Test getting a non-existent feature."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = None
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            result = await feature_registry.get_feature_definition("nonexistent")
            
            assert result is None


class TestListFeatures:
    """Tests for listing features."""
    
    @pytest.mark.asyncio
    async def test_list_all_features(self, feature_registry):
        """Test listing all features."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = [
            {
                "name": "feature1",
                "version": "1.0.0",
                "entity_type": "player",
                "feature_type": FeatureType.NUMERIC,
                "store_type": FeatureStoreType.BOTH,
                "tags": json.dumps(["test"]),
                "validation_rules": json.dumps({}),
                "default_value": None,
                "owner": "test",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        ]
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            results = await feature_registry.list_features()
            
            assert len(results) == 1
            assert results[0].name == "feature1"
            
    @pytest.mark.asyncio
    async def test_list_with_entity_filter(self, feature_registry):
        """Test listing with entity type filter."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = []
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            await feature_registry.list_features(entity_type="player")
            
            call_args = mock_conn.fetch.call_args
            assert "entity_type" in str(call_args)
            
    @pytest.mark.asyncio
    async def test_list_with_tag_filter(self, feature_registry):
        """Test listing with tag filter."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = []
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            await feature_registry.list_features(tag="performance")
            
            call_args = mock_conn.fetch.call_args
            assert "tags" in str(call_args)


class TestFeatureViews:
    """Tests for feature view operations."""
    
    @pytest.mark.asyncio
    async def test_register_feature_view(self, feature_registry, sample_feature_view):
        """Test registering a feature view."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            result = await feature_registry.register_feature_view(sample_feature_view)
            
            assert result.name == "player_performance"
            assert "player_performance" in feature_registry._view_cache
            
    @pytest.mark.asyncio
    async def test_get_feature_view(self, feature_registry, sample_feature_view):
        """Test getting a feature view."""
        feature_registry._view_cache["player_performance"] = sample_feature_view
        
        result = await feature_registry.get_feature_view("player_performance")
        
        assert result == sample_feature_view
        
    @pytest.mark.asyncio
    async def test_get_feature_view_from_db(self, feature_registry):
        """Test getting a feature view from database."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {
            "name": "player_performance",
            "entity_type": "player",
            "features": json.dumps(["kd_ratio", "acs"]),
            "materialize_online": True,
            "materialize_offline": True,
            "refresh_interval_minutes": 60,
            "lookback_window_days": 30,
            "description": "Test view",
            "owner": "test",
            "created_at": datetime.utcnow(),
        }
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.feature_store.registry.get_db_pool", return_value=mock_pool):
            result = await feature_registry.get_feature_view("player_performance")
            
            assert result.name == "player_performance"
            assert result.features == ["kd_ratio", "acs"]


class TestValidateFeature:
    """Tests for feature validation."""
    
    @pytest.mark.asyncio
    async def test_validate_feature_exists(self, feature_registry):
        """Test validating an existing feature."""
        with patch.object(
            feature_registry, "get_feature_definition", return_value=MagicMock()
        ):
            result = await feature_registry.validate_feature_exists("existing_feature")
            
            assert result is True
            
    @pytest.mark.asyncio
    async def test_validate_feature_not_exists(self, feature_registry):
        """Test validating a non-existent feature."""
        with patch.object(feature_registry, "get_feature_definition", return_value=None):
            result = await feature_registry.validate_feature_exists("nonexistent")
            
            assert result is False


class TestGetFeatureRegistry:
    """Tests for the get_feature_registry factory function."""
    
    @pytest.mark.asyncio
    async def test_singleton_pattern(self):
        """Test that get_feature_registry returns a singleton."""
        registry1 = await get_feature_registry()
        registry2 = await get_feature_registry()
        
        assert registry1 is registry2
