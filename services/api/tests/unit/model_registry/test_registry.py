"""[Ver001.000]
Tests for Model Registry implementation.
"""

import pytest
import json
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.njz_api.model_registry.registry import ModelRegistry, get_model_registry
from src.njz_api.model_registry.schemas import (
    ModelStage,
    ModelFramework,
    RegisteredModel,
    ModelVersion,
    ModelMetrics,
    StageTransitionRequest,
)


@pytest.fixture
def model_registry():
    """Create a ModelRegistry instance."""
    return ModelRegistry()


@pytest.fixture
def sample_registered_model():
    """Create a sample registered model."""
    return RegisteredModel(
        name="simrating_predictor",
        description="Predicts player SimRating",
        tags={"team": "ml"},
        owner="ml-team",
    )


@pytest.fixture
def sample_model_version():
    """Create a sample model version."""
    return ModelVersion(
        name="simrating_predictor",
        version=1,
        source_system="training_pipeline",
        run_id="run_123",
        framework=ModelFramework.PYTORCH,
        framework_version="2.0.0",
        artifact_uri="s3://models/simrating/v1",
        signature={"inputs": ["features"], "outputs": ["rating"]},
        description="Initial version",
        created_by="data-scientist",
    )


class TestModelRegistryInitialization:
    """Tests for ModelRegistry initialization."""
    
    def test_initialization(self, model_registry):
        """Test that ModelRegistry initializes correctly."""
        assert model_registry._cache == {}


class TestCreateRegisteredModel:
    """Tests for creating registered models."""
    
    @pytest.mark.asyncio
    async def test_create_new_model(self, model_registry, sample_registered_model):
        """Test creating a new registered model."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            result = await model_registry.create_registered_model(
                name="simrating_predictor",
                description="Predicts player SimRating",
                tags={"team": "ml"},
                owner="ml-team",
            )
            
            assert result.name == "simrating_predictor"
            mock_conn.execute.assert_called_once()


class TestGetRegisteredModel:
    """Tests for retrieving registered models."""
    
    @pytest.mark.asyncio
    async def test_get_from_cache(self, model_registry, sample_registered_model):
        """Test getting model from cache."""
        model_registry._cache["simrating_predictor"] = sample_registered_model
        
        result = await model_registry.get_registered_model("simrating_predictor")
        
        assert result == sample_registered_model
        
    @pytest.mark.asyncio
    async def test_get_from_database(self, model_registry):
        """Test getting model from database."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {
            "name": "simrating_predictor",
            "description": "Test model",
            "tags": json.dumps({"team": "ml"}),
            "latest_version": 5,
            "production_version": 3,
            "staging_version": 5,
            "owner": "ml-team",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            result = await model_registry.get_registered_model("simrating_predictor")
            
            assert result.name == "simrating_predictor"
            assert result.latest_version == 5
            assert "simrating_predictor" in model_registry._cache
            
    @pytest.mark.asyncio
    async def test_get_not_found(self, model_registry):
        """Test getting non-existent model."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = None
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            result = await model_registry.get_registered_model("nonexistent")
            
            assert result is None


class TestCreateModelVersion:
    """Tests for creating model versions."""
    
    @pytest.mark.asyncio
    async def test_create_first_version(self, model_registry):
        """Test creating the first version of a model."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {"next_version": 1}
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            result = await model_registry.create_model_version(
                name="simrating_predictor",
                source_system="training_pipeline",
                run_id="run_123",
                framework=ModelFramework.PYTORCH,
                framework_version="2.0.0",
                artifact_uri="s3://models/v1",
                signature={"inputs": [], "outputs": []},
            )
            
            assert result.version == 1
            assert result.name == "simrating_predictor"
            
    @pytest.mark.asyncio
    async def test_create_subsequent_version(self, model_registry):
        """Test creating subsequent versions."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {"next_version": 5}  # Versions 1-4 exist
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            result = await model_registry.create_model_version(
                name="simrating_predictor",
                source_system="training_pipeline",
                run_id="run_456",
                framework=ModelFramework.PYTORCH,
                framework_version="2.1.0",
                artifact_uri="s3://models/v5",
                signature={"inputs": [], "outputs": []},
            )
            
            assert result.version == 5


class TestGetModelVersion:
    """Tests for retrieving model versions."""
    
    @pytest.mark.asyncio
    async def test_get_specific_version(self, model_registry):
        """Test getting a specific version."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {
            "name": "simrating_predictor",
            "version": 3,
            "source_system": "training_pipeline",
            "run_id": "run_123",
            "stage": "Production",
            "stage_updated_at": datetime.utcnow(),
            "framework": ModelFramework.PYTORCH,
            "framework_version": "2.0.0",
            "artifact_uri": "s3://models/v3",
            "signature": json.dumps({"inputs": [], "outputs": []}),
            "description": "Production version",
            "tags": json.dumps({"env": "prod"}),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "ml-engineer",
        }
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            result = await model_registry.get_model_version("simrating_predictor", version=3)
            
            assert result.version == 3
            assert result.stage == ModelStage.PRODUCTION
            
    @pytest.mark.asyncio
    async def test_get_latest_version(self, model_registry):
        """Test getting the latest version."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {
            "name": "simrating_predictor",
            "version": 10,
            "source_system": "training_pipeline",
            "run_id": None,
            "stage": "None",
            "stage_updated_at": None,
            "framework": ModelFramework.SKLEARN,
            "framework_version": "1.3.0",
            "artifact_uri": "s3://models/v10",
            "signature": json.dumps({}),
            "description": None,
            "tags": json.dumps({}),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": None,
        }
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            result = await model_registry.get_model_version("simrating_predictor")
            
            assert result.version == 10


class TestTransitionStage:
    """Tests for stage transitions."""
    
    @pytest.mark.asyncio
    async def test_transition_to_production(self, model_registry):
        """Test transitioning to production."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = None  # No current production model
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        request = StageTransitionRequest(
            model_name="simrating_predictor",
            version=5,
            new_stage=ModelStage.PRODUCTION,
            requested_by="ml-engineer",
        )
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            with patch.object(model_registry, "get_model_version") as mock_get:
                mock_get.return_value = ModelVersion(
                    name="simrating_predictor",
                    version=5,
                    framework=ModelFramework.PYTORCH,
                    stage=ModelStage.PRODUCTION,
                    artifact_uri="s3://models/v5",
                    signature={},
                )
                result = await model_registry.transition_stage(request)
                
                assert result.stage == ModelStage.PRODUCTION
                
    @pytest.mark.asyncio
    async def test_transition_with_archival(self, model_registry):
        """Test transition that archives current model."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {"version": 3}  # Current production
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        request = StageTransitionRequest(
            model_name="simrating_predictor",
            version=4,
            new_stage=ModelStage.PRODUCTION,
            archive_current=True,
            requested_by="ml-engineer",
        )
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            with patch.object(model_registry, "get_model_version") as mock_get:
                mock_get.return_value = ModelVersion(
                    name="simrating_predictor",
                    version=4,
                    framework=ModelFramework.PYTORCH,
                    stage=ModelStage.PRODUCTION,
                    artifact_uri="s3://models/v4",
                    signature={},
                )
                await model_registry.transition_stage(request)
                
                # Should archive v3
                assert mock_conn.execute.call_count >= 2


class TestLogMetrics:
    """Tests for logging model metrics."""
    
    @pytest.mark.asyncio
    async def test_log_metrics(self, model_registry):
        """Test logging model metrics."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        metrics = ModelMetrics(
            model_name="simrating_predictor",
            model_version=1,
            dataset_name="vct_2024",
            dataset_version="1.0.0",
            metrics={"mae": 0.05, "rmse": 0.08, "r2": 0.92},
            training_duration_seconds=3600,
            epochs=100,
        )
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            result = await model_registry.log_metrics(metrics)
            
            assert result == metrics
            mock_conn.execute.assert_called_once()


class TestGetProductionModel:
    """Tests for getting production model."""
    
    @pytest.mark.asyncio
    async def test_get_production_model(self, model_registry):
        """Test getting the current production model."""
        with patch.object(model_registry, "get_registered_model") as mock_get_model:
            mock_get_model.return_value = RegisteredModel(
                name="simrating_predictor",
                production_version=5,
            )
            
            with patch.object(model_registry, "get_model_version") as mock_get_version:
                mock_get_version.return_value = ModelVersion(
                    name="simrating_predictor",
                    version=5,
                    framework=ModelFramework.PYTORCH,
                    stage=ModelStage.PRODUCTION,
                    artifact_uri="s3://models/v5",
                    signature={},
                )
                
                result = await model_registry.get_production_model("simrating_predictor")
                
                assert result.version == 5
                assert result.stage == ModelStage.PRODUCTION
                
    @pytest.mark.asyncio
    async def test_get_production_model_none(self, model_registry):
        """Test when no production model exists."""
        with patch.object(model_registry, "get_registered_model") as mock_get:
            mock_get.return_value = RegisteredModel(
                name="simrating_predictor",
                production_version=None,
            )
            
            result = await model_registry.get_production_model("simrating_predictor")
            
            assert result is None


class TestListModelVersions:
    """Tests for listing model versions."""
    
    @pytest.mark.asyncio
    async def test_list_all_versions(self, model_registry):
        """Test listing all versions."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = [
            {
                "name": "simrating_predictor",
                "version": 3,
                "source_system": "training",
                "run_id": None,
                "stage": "Production",
                "stage_updated_at": datetime.utcnow(),
                "framework": ModelFramework.PYTORCH,
                "framework_version": "2.0.0",
                "artifact_uri": "s3://models/v3",
                "signature": json.dumps({}),
                "description": None,
                "tags": json.dumps({}),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": None,
            },
            {
                "name": "simrating_predictor",
                "version": 2,
                "source_system": "training",
                "run_id": None,
                "stage": "Archived",
                "stage_updated_at": datetime.utcnow(),
                "framework": ModelFramework.PYTORCH,
                "framework_version": "2.0.0",
                "artifact_uri": "s3://models/v2",
                "signature": json.dumps({}),
                "description": None,
                "tags": json.dumps({}),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": None,
            },
        ]
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            results = await model_registry.list_model_versions("simrating_predictor")
            
            assert len(results) == 2
            assert results[0].version == 3  # Descending order
            assert results[1].version == 2
            
    @pytest.mark.asyncio
    async def test_list_by_stage(self, model_registry):
        """Test listing versions filtered by stage."""
        mock_pool = AsyncMock()
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = []
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        with patch("src.njz_api.model_registry.registry.get_db_pool", return_value=mock_pool):
            await model_registry.list_model_versions(
                "simrating_predictor", stage=ModelStage.PRODUCTION
            )
            
            call_args = mock_conn.fetch.call_args
            assert "Production" in str(call_args)


class TestGetModelRegistry:
    """Tests for the get_model_registry factory function."""
    
    @pytest.mark.asyncio
    async def test_singleton_pattern(self):
        """Test that get_model_registry returns a singleton."""
        registry1 = await get_model_registry()
        registry2 = await get_model_registry()
        
        assert registry1 is registry2
