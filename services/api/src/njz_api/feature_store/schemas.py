"""
Feature Store Schemas

Pydantic models for feature definitions, values, and views.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FeatureType(str, Enum):
    """Supported feature types."""
    NUMERIC = "numeric"
    CATEGORICAL = "categorical"
    BOOLEAN = "boolean"
    VECTOR = "vector"
    EMBEDDING = "embedding"
    TIMESTAMP = "timestamp"


class FeatureStoreType(str, Enum):
    """Feature storage location."""
    ONLINE = "online"      # Redis - low latency
    OFFLINE = "offline"    # PostgreSQL/TimescaleDB - historical
    BOTH = "both"          # Dual write


class FeatureDefinition(BaseModel):
    """
    Definition of a feature in the feature store.
    
    Similar to Tecton's FeatureView but simplified.
    """
    name: str = Field(..., description="Unique feature name")
    version: str = Field(default="1.0.0", description="Semantic version")
    entity_type: str = Field(..., description="Entity type: player, team, match")
    feature_type: FeatureType = Field(..., description="Data type")
    
    # Storage configuration
    store_type: FeatureStoreType = Field(default=FeatureStoreType.BOTH)
    ttl_seconds: Optional[int] = Field(default=None, description="Online store TTL")
    
    # Schema
    description: str = Field(default="")
    tags: List[str] = Field(default_factory=list)
    
    # Validation
    nullability: bool = Field(default=False)
    default_value: Optional[Any] = None
    validation_rules: Dict[str, Any] = Field(default_factory=dict)
    
    # Metadata
    owner: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FeatureValue(BaseModel):
    """
    A single feature value with full provenance.
    
    Includes point-in-time tracking for training/serving consistency.
    """
    feature_name: str
    entity_id: UUID
    entity_type: str
    
    # Value
    value: Union[float, int, str, bool, List[float], None]
    value_type: FeatureType
    
    # Provenance
    feature_definition_version: str
    computed_at: datetime
    
    # Point-in-time tracking
    event_timestamp: Optional[datetime] = None  # When event occurred
    ingestion_timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Source tracking
    source_system: str = Field(default="")  # pandascore, simulation, etc.
    source_id: Optional[str] = None
    
    # Quality
    is_valid: bool = Field(default=True)
    validation_errors: List[str] = Field(default_factory=list)
    
    model_config = ConfigDict(
        json_encoders={
            Decimal: float,
            datetime: lambda v: v.isoformat(),
        }
    )


class FeatureView(BaseModel):
    """
    A collection of features for a specific entity type.
    
    Similar to a database view but for features.
    """
    name: str
    entity_type: str
    features: List[str]  # List of feature names
    
    # Materialization config
    materialize_online: bool = Field(default=True)
    materialize_offline: bool = Field(default=True)
    refresh_interval_minutes: int = Field(default=60)
    
    # Time window for historical features
    lookback_window_days: int = Field(default=30)
    
    description: str = Field(default="")
    owner: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FeatureVector(BaseModel):
    """
    A vector of features for an entity at a point in time.
    
    Used for ML model inference.
    """
    entity_id: UUID
    entity_type: str
    timestamp: datetime
    
    features: Dict[str, Any]
    feature_names: List[str]
    
    # Metadata
    missing_features: List[str] = Field(default_factory=list)
    imputed_features: Dict[str, Any] = Field(default_factory=dict)


class FeatureStatistics(BaseModel):
    """Statistics for a feature over a time window."""
    feature_name: str
    entity_type: str
    
    # Time window
    window_start: datetime
    window_end: datetime
    
    # Statistics
    count: int
    null_count: int
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    
    # Drift detection
    drift_score: Optional[float] = None
    is_drifted: bool = Field(default=False)


class OnlineFeatureResponse(BaseModel):
    """Response from online feature store lookup."""
    entity_id: UUID
    entity_type: str
    features: Dict[str, Any]
    
    # Latency tracking
    lookup_time_ms: float
    cache_hit: bool = Field(default=False)
    
    # Missing data info
    missing_features: List[str] = Field(default_factory=list)


class OfflineFeatureQuery(BaseModel):
    """Query for offline feature store."""
    entity_type: str
    entity_ids: Optional[List[UUID]] = None
    feature_names: List[str]
    
    # Time range
    start_time: datetime
    end_time: datetime
    
    # Point-in-time join config
    point_in_time_column: Optional[str] = None
    
    # Output
    include_provenance: bool = Field(default=False)
