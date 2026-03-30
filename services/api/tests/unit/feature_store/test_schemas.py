"""[Ver001.000]
Tests for Feature Store schemas.
"""

import pytest
from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from src.njz_api.feature_store.schemas import (
    FeatureType,
    FeatureStoreType,
    FeatureDefinition,
    FeatureValue,
    FeatureView,
    FeatureVector,
    FeatureStatistics,
    OnlineFeatureResponse,
    OfflineFeatureQuery,
)


class TestFeatureType:
    """Tests for FeatureType enum."""
    
    def test_feature_type_values(self):
        """Test that all feature types are defined."""
        assert FeatureType.NUMERIC.value == "numeric"
        assert FeatureType.CATEGORICAL.value == "categorical"
        assert FeatureType.BOOLEAN.value == "boolean"
        assert FeatureType.VECTOR.value == "vector"
        assert FeatureType.EMBEDDING.value == "embedding"
        assert FeatureType.TIMESTAMP.value == "timestamp"


class TestFeatureStoreType:
    """Tests for FeatureStoreType enum."""
    
    def test_store_type_values(self):
        """Test that all store types are defined."""
        assert FeatureStoreType.ONLINE.value == "online"
        assert FeatureStoreType.OFFLINE.value == "offline"
        assert FeatureStoreType.BOTH.value == "both"


class TestFeatureDefinition:
    """Tests for FeatureDefinition schema."""
    
    def test_basic_creation(self):
        """Test creating a basic feature definition."""
        definition = FeatureDefinition(
            name="player_kd_ratio",
            entity_type="player",
            feature_type=FeatureType.NUMERIC,
        )
        
        assert definition.name == "player_kd_ratio"
        assert definition.entity_type == "player"
        assert definition.feature_type == FeatureType.NUMERIC
        assert definition.version == "1.0.0"  # default
        assert definition.store_type == FeatureStoreType.BOTH  # default
        
    def test_full_creation(self):
        """Test creating a feature definition with all fields."""
        definition = FeatureDefinition(
            name="player_acs",
            version="2.0.0",
            entity_type="player",
            feature_type=FeatureType.NUMERIC,
            store_type=FeatureStoreType.ONLINE,
            ttl_seconds=3600,
            description="Average combat score",
            tags=["performance", "combat"],
            nullability=False,
            default_value=200.0,
            validation_rules={"min": 0, "max": 1000},
            owner="data-team",
        )
        
        assert definition.version == "2.0.0"
        assert definition.store_type == FeatureStoreType.ONLINE
        assert definition.ttl_seconds == 3600
        assert definition.description == "Average combat score"
        assert definition.tags == ["performance", "combat"]
        assert definition.default_value == 200.0
        assert definition.owner == "data-team"
        
    def test_validation_rules_default(self):
        """Test that validation_rules defaults to empty dict."""
        definition = FeatureDefinition(
            name="test_feature",
            entity_type="player",
            feature_type=FeatureType.NUMERIC,
        )
        
        assert definition.validation_rules == {}


class TestFeatureValue:
    """Tests for FeatureValue schema."""
    
    def test_basic_creation(self):
        """Test creating a feature value."""
        entity_id = uuid4()
        value = FeatureValue(
            feature_name="kd_ratio",
            entity_id=entity_id,
            entity_type="player",
            value=1.5,
            value_type=FeatureType.NUMERIC,
            feature_definition_version="1.0.0",
            computed_at=datetime.utcnow(),
        )
        
        assert value.feature_name == "kd_ratio"
        assert value.entity_id == entity_id
        assert value.value == 1.5
        assert value.is_valid is True  # default
        
    def test_json_encoding_decimal(self):
        """Test that Decimal values are properly encoded."""
        entity_id = uuid4()
        value = FeatureValue(
            feature_name="win_rate",
            entity_id=entity_id,
            entity_type="player",
            value=Decimal("0.750"),
            value_type=FeatureType.NUMERIC,
            feature_definition_version="1.0.0",
            computed_at=datetime.utcnow(),
        )
        
        # Should be JSON serializable
        import json
        json_str = value.json()
        parsed = json.loads(json_str)
        assert parsed["value"] == 0.75
        
    def test_json_encoding_datetime(self):
        """Test that datetime values are properly encoded."""
        entity_id = uuid4()
        now = datetime.utcnow()
        value = FeatureValue(
            feature_name="kd_ratio",
            entity_id=entity_id,
            entity_type="player",
            value=1.5,
            value_type=FeatureType.NUMERIC,
            feature_definition_version="1.0.0",
            computed_at=now,
        )
        
        import json
        json_str = value.json()
        parsed = json.loads(json_str)
        assert "computed_at" in parsed


class TestFeatureView:
    """Tests for FeatureView schema."""
    
    def test_basic_creation(self):
        """Test creating a feature view."""
        view = FeatureView(
            name="player_performance",
            entity_type="player",
            features=["kd_ratio", "acs", "headshot_pct"],
        )
        
        assert view.name == "player_performance"
        assert view.entity_type == "player"
        assert view.features == ["kd_ratio", "acs", "headshot_pct"]
        assert view.materialize_online is True  # default
        assert view.refresh_interval_minutes == 60  # default
        
    def test_custom_refresh_interval(self):
        """Test feature view with custom refresh interval."""
        view = FeatureView(
            name="team_stats",
            entity_type="team",
            features=["win_rate", "avg_round_diff"],
            refresh_interval_minutes=30,
            lookback_window_days=90,
        )
        
        assert view.refresh_interval_minutes == 30
        assert view.lookback_window_days == 90


class TestFeatureVector:
    """Tests for FeatureVector schema."""
    
    def test_basic_creation(self):
        """Test creating a feature vector."""
        entity_id = uuid4()
        vector = FeatureVector(
            entity_id=entity_id,
            entity_type="player",
            timestamp=datetime.utcnow(),
            features={"kd_ratio": 1.5, "acs": 250.0},
            feature_names=["kd_ratio", "acs"],
        )
        
        assert vector.entity_id == entity_id
        assert vector.features["kd_ratio"] == 1.5
        assert vector.missing_features == []  # default
        
    def test_with_missing_features(self):
        """Test feature vector with missing features."""
        entity_id = uuid4()
        vector = FeatureVector(
            entity_id=entity_id,
            entity_type="player",
            timestamp=datetime.utcnow(),
            features={"kd_ratio": 1.5},
            feature_names=["kd_ratio", "acs"],
            missing_features=["acs"],
            imputed_features={"acs": 200.0},
        )
        
        assert vector.missing_features == ["acs"]
        assert vector.imputed_features == {"acs": 200.0}


class TestFeatureStatistics:
    """Tests for FeatureStatistics schema."""
    
    def test_basic_creation(self):
        """Test creating feature statistics."""
        stats = FeatureStatistics(
            feature_name="kd_ratio",
            entity_type="player",
            window_start=datetime.utcnow(),
            window_end=datetime.utcnow(),
            count=1000,
            null_count=5,
            mean=1.2,
            std=0.3,
            min=0.1,
            max=3.5,
        )
        
        assert stats.count == 1000
        assert stats.null_count == 5
        assert stats.drift_score is None  # default
        assert stats.is_drifted is False  # default
        
    def test_drift_detection(self):
        """Test statistics with drift detection."""
        stats = FeatureStatistics(
            feature_name="acs",
            entity_type="player",
            window_start=datetime.utcnow(),
            window_end=datetime.utcnow(),
            count=500,
            null_count=0,
            drift_score=0.85,
            is_drifted=True,
        )
        
        assert stats.is_drifted is True
        assert stats.drift_score == 0.85


class TestOnlineFeatureResponse:
    """Tests for OnlineFeatureResponse schema."""
    
    def test_basic_response(self):
        """Test creating an online feature response."""
        entity_id = uuid4()
        response = OnlineFeatureResponse(
            entity_id=entity_id,
            entity_type="player",
            features={"kd_ratio": 1.5, "acs": 250},
            lookup_time_ms=5.2,
        )
        
        assert response.cache_hit is False  # default
        assert response.lookup_time_ms == 5.2
        assert response.missing_features == []  # default
        
    def test_cache_hit(self):
        """Test response with cache hit."""
        entity_id = uuid4()
        response = OnlineFeatureResponse(
            entity_id=entity_id,
            entity_type="player",
            features={"kd_ratio": 1.5},
            lookup_time_ms=1.0,
            cache_hit=True,
        )
        
        assert response.cache_hit is True


class TestOfflineFeatureQuery:
    """Tests for OfflineFeatureQuery schema."""
    
    def test_basic_query(self):
        """Test creating an offline feature query."""
        start = datetime.utcnow()
        end = datetime.utcnow()
        
        query = OfflineFeatureQuery(
            entity_type="player",
            feature_names=["kd_ratio", "acs"],
            start_time=start,
            end_time=end,
        )
        
        assert query.entity_type == "player"
        assert query.feature_names == ["kd_ratio", "acs"]
        assert query.entity_ids is None  # optional
        
    def test_query_with_entity_ids(self):
        """Test query with specific entity IDs."""
        entity_ids = [uuid4(), uuid4()]
        query = OfflineFeatureQuery(
            entity_type="player",
            entity_ids=entity_ids,
            feature_names=["kd_ratio"],
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow(),
            include_provenance=True,
        )
        
        assert query.entity_ids == entity_ids
        assert query.include_provenance is True
