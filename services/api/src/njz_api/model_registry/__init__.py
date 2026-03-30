"""
Model Registry Module

MLflow-style model registry for managing ML model lifecycle:
- Model versioning
- Stage transitions (staging, production, archived)
- Model artifacts storage
- Performance tracking
"""

from .registry import ModelRegistry, get_model_registry
from .schemas import (
    ModelVersion,
    ModelStage,
    ModelArtifact,
    ModelMetrics,
    RegisteredModel
)

__all__ = [
    "ModelRegistry",
    "get_model_registry",
    "ModelVersion",
    "ModelStage",
    "ModelArtifact",
    "ModelMetrics",
    "RegisteredModel",
]
