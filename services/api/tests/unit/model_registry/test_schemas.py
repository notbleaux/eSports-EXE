"""[Ver001.000]
Tests for Model Registry schemas.
"""

import pytest
from datetime import datetime
from uuid import uuid4

from src.njz_api.model_registry.schemas import (
    ModelStage,
    ModelFramework,
    RegisteredModel,
    ModelVersion,
    ModelArtifact,
    ModelMetrics,
    ModelInferenceLog,
    ModelComparison,
    StageTransitionRequest,
)


class TestModelStage:
    """Tests for ModelStage enum."""
    
    def test_stage_values(self):
        """Test that all stages are defined."""
        assert ModelStage.NONE.value == "None"
        assert ModelStage.STAGING.value == "Staging"
        assert ModelStage.PRODUCTION.value == "Production"
        assert ModelStage.ARCHIVED.value == "Archived"


class TestModelFramework:
    """Tests for ModelFramework enum."""
    
    def test_framework_values(self):
        """Test that all frameworks are defined."""
        assert ModelFramework.TENSORFLOW.value == "tensorflow"
        assert ModelFramework.PYTORCH.value == "pytorch"
        assert ModelFramework.SKLEARN.value == "sklearn"
        assert ModelFramework.ONNX.value == "onnx"
        assert ModelFramework.TENSORFLOW_JS.value == "tensorflow_js"


class TestRegisteredModel:
    """Tests for RegisteredModel schema."""
    
    def test_basic_creation(self):
        """Test creating a registered model."""
        model = RegisteredModel(
            name="simrating_predictor",
            description="Predicts player SimRating",
            tags={"team": "ml", "priority": "high"},
            owner="ml-team",
        )
        
        assert model.name == "simrating_predictor"
        assert model.description == "Predicts player SimRating"
        assert model.tags == {"team": "ml", "priority": "high"}
        assert model.latest_version == 0  # default
        assert model.production_version is None  # default
        
    def test_with_versions(self):
        """Test model with version info."""
        model = RegisteredModel(
            name="match_predictor",
            latest_version=5,
            production_version=3,
            staging_version=5,
            owner="data-science",
        )
        
        assert model.latest_version == 5
        assert model.production_version == 3
        assert model.staging_version == 5


class TestModelVersion:
    """Tests for ModelVersion schema."""
    
    def test_basic_creation(self):
        """Test creating a model version."""
        version = ModelVersion(
            name="simrating_predictor",
            version=1,
            framework=ModelFramework.PYTORCH,
            artifact_uri="s3://models/simrating/v1",
            signature={"inputs": ["features"], "outputs": ["rating"]},
        )
        
        assert version.name == "simrating_predictor"
        assert version.version == 1
        assert version.framework == ModelFramework.PYTORCH
        assert version.stage == ModelStage.NONE  # default
        
    def test_stage_transition(self):
        """Test version with stage info."""
        version = ModelVersion(
            name="match_predictor",
            version=3,
            framework=ModelFramework.SKLEARN,
            stage=ModelStage.PRODUCTION,
            stage_updated_at=datetime.utcnow(),
            artifact_uri="s3://models/match/v3",
            signature={},
        )
        
        assert version.stage == ModelStage.PRODUCTION
        assert version.stage_updated_at is not None


class TestModelArtifact:
    """Tests for ModelArtifact schema."""
    
    def test_basic_creation(self):
        """Test creating a model artifact."""
        artifact = ModelArtifact(
            name="model.pkl",
            artifact_type="model",
            uri="s3://models/v1/model.pkl",
            size_bytes=1024000,
            checksum="sha256:abc123",
        )
        
        assert artifact.name == "model.pkl"
        assert artifact.artifact_type == "model"
        assert artifact.size_bytes == 1024000
        assert artifact.checksum == "sha256:abc123"


class TestModelMetrics:
    """Tests for ModelMetrics schema."""
    
    def test_basic_creation(self):
        """Test creating model metrics."""
        metrics = ModelMetrics(
            model_name="simrating_predictor",
            model_version=1,
            metrics={"mae": 0.05, "rmse": 0.08, "r2": 0.92},
            training_duration_seconds=3600,
            epochs=100,
        )
        
        assert metrics.model_name == "simrating_predictor"
        assert metrics.metrics["mae"] == 0.05
        assert metrics.metrics["r2"] == 0.92
        
    def test_with_dataset_info(self):
        """Test metrics with dataset info."""
        metrics = ModelMetrics(
            model_name="match_predictor",
            model_version=2,
            dataset_name="vct_2024_matches",
            dataset_version="1.0.0",
            metrics={"accuracy": 0.85, "f1": 0.83},
        )
        
        assert metrics.dataset_name == "vct_2024_matches"
        assert metrics.dataset_version == "1.0.0"


class TestModelInferenceLog:
    """Tests for ModelInferenceLog schema."""
    
    def test_basic_creation(self):
        """Test creating inference log."""
        log = ModelInferenceLog(
            model_name="simrating_predictor",
            model_version=1,
            request_id=uuid4(),
            input_features={"kd": 1.5, "acs": 250},
            prediction=1850.5,
            inference_time_ms=12.5,
        )
        
        assert log.model_name == "simrating_predictor"
        assert log.inference_time_ms == 12.5
        assert log.prediction == 1850.5
        
    def test_with_probability(self):
        """Test log with prediction probability."""
        log = ModelInferenceLog(
            model_name="match_predictor",
            model_version=3,
            request_id=uuid4(),
            input_features={"team_a_rating": 1800, "team_b_rating": 1750},
            prediction="team_a_win",
            prediction_probability=0.75,
            inference_time_ms=8.2,
            user_id=uuid4(),
            source_ip="192.168.1.1",
        )
        
        assert log.prediction_probability == 0.75
        assert log.source_ip == "192.168.1.1"


class TestModelComparison:
    """Tests for ModelComparison schema."""
    
    def test_basic_comparison(self):
        """Test creating model comparison."""
        comparison = ModelComparison(
            baseline_name="simrating_predictor",
            baseline_version=1,
            challenger_name="simrating_predictor",
            challenger_version=2,
            metric_improvements={"mae": -0.02, "r2": 0.03},
            is_statistically_significant=True,
            p_values={"mae": 0.01, "r2": 0.02},
            recommendation="promote",
        )
        
        assert comparison.baseline_version == 1
        assert comparison.challenger_version == 2
        assert comparison.recommendation == "promote"
        assert comparison.is_statistically_significant is True


class TestStageTransitionRequest:
    """Tests for StageTransitionRequest schema."""
    
    def test_basic_request(self):
        """Test creating transition request."""
        request = StageTransitionRequest(
            model_name="simrating_predictor",
            version=2,
            new_stage=ModelStage.PRODUCTION,
            requested_by="ml-engineer",
        )
        
        assert request.model_name == "simrating_predictor"
        assert request.version == 2
        assert request.new_stage == ModelStage.PRODUCTION
        assert request.archive_current is True  # default
        
    def test_without_archival(self):
        """Test transition without archival."""
        request = StageTransitionRequest(
            model_name="match_predictor",
            version=5,
            new_stage=ModelStage.STAGING,
            archive_current=False,
            requested_by="data-scientist",
            approval_notes="Hotfix deployment",
        )
        
        assert request.archive_current is False
        assert request.approval_notes == "Hotfix deployment"
