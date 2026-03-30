"""
Model Registry Schemas

MLflow-inspired model registry schemas.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ModelStage(str, Enum):
    """Model lifecycle stages."""
    NONE = "None"
    STAGING = "Staging"
    PRODUCTION = "Production"
    ARCHIVED = "Archived"


class ModelFramework(str, Enum):
    """Supported ML frameworks."""
    TENSORFLOW = "tensorflow"
    PYTORCH = "pytorch"
    SKLEARN = "sklearn"
    ONNX = "onnx"
    TENSORFLOW_JS = "tensorflow_js"


class RegisteredModel(BaseModel):
    """A registered model (container for versions)."""
    name: str = Field(..., description="Unique model name")
    description: str = Field(default="")
    tags: Dict[str, str] = Field(default_factory=dict)
    
    # Current stages
    latest_version: int = Field(default=0)
    production_version: Optional[int] = None
    staging_version: Optional[int] = None
    
    # Metadata
    owner: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ModelVersion(BaseModel):
    """A specific version of a model."""
    name: str  # Model name
    version: int
    
    # Source
    source_system: str = Field(default="")  # e.g., "training_pipeline"
    run_id: Optional[str] = None  # Training run ID
    
    # Stage
    stage: ModelStage = Field(default=ModelStage.NONE)
    stage_updated_at: Optional[datetime] = None
    
    # Framework info
    framework: ModelFramework
    framework_version: str = Field(default="")
    
    # Artifacts
    artifact_uri: Optional[str] = None  # S3/MinIO path
    signature: Dict[str, Any] = Field(default_factory=dict)  # Input/output schema
    
    # Description
    description: str = Field(default="")
    tags: Dict[str, str] = Field(default_factory=dict)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(default="")


class ModelArtifact(BaseModel):
    """Model artifact (file/metadata)."""
    name: str
    artifact_type: str  # "model", "data", "config", "metrics"
    uri: str  # Storage location
    size_bytes: int
    checksum: str  # SHA-256
    
    # Metadata
    content_type: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ModelMetrics(BaseModel):
    """Performance metrics for a model version."""
    model_name: str
    model_version: int
    
    # Dataset info
    dataset_name: Optional[str] = None
    dataset_version: Optional[str] = None
    
    # Metrics
    metrics: Dict[str, float] = Field(default_factory=dict)
    # e.g., {"accuracy": 0.95, "f1": 0.93, "rmse": 0.05}
    
    # Training info
    training_duration_seconds: Optional[float] = None
    epochs: Optional[int] = None
    
    # Computed at
    computed_at: datetime = Field(default_factory=datetime.utcnow)


class ModelInferenceLog(BaseModel):
    """Log of model inference requests."""
    model_name: str
    model_version: int
    
    # Request
    request_id: UUID
    input_features: Dict[str, Any]
    
    # Response
    prediction: Any
    prediction_probability: Optional[float] = None
    
    # Latency
    inference_time_ms: float
    
    # Context
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[UUID] = None
    source_ip: Optional[str] = None


class ModelComparison(BaseModel):
    """Comparison between two model versions."""
    baseline_name: str
    baseline_version: int
    challenger_name: str
    challenger_version: int
    
    # Metrics comparison
    metric_improvements: Dict[str, float]
    # e.g., {"accuracy": 0.02, "f1": 0.015} (positive = improvement)
    
    # Statistical significance
    is_statistically_significant: bool = Field(default=False)
    p_values: Dict[str, float] = Field(default_factory=dict)
    
    # Recommendation
    recommendation: str = Field(default="")  # "promote", "reject", "investigate"
    
    compared_at: datetime = Field(default_factory=datetime.utcnow)


class StageTransitionRequest(BaseModel):
    """Request to transition a model to a new stage."""
    model_name: str
    version: int
    new_stage: ModelStage
    
    # Optional archival of current model in target stage
    archive_current: bool = Field(default=True)
    
    # Approval
    requested_by: str
    approval_notes: str = Field(default="")
