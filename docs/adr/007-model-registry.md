# ADR-007: Model Registry Design

[Ver001.000]

## Status

**Accepted**

## Context

The NJZiteGeisTe Platform requires a system for managing ML models throughout their lifecycle:

1. **Version tracking**: Multiple versions of the same model
2. **Stage management**: Development → Staging → Production → Archived
3. **Artifact storage**: Model binaries, configurations, metrics
4. **Lineage tracking**: Training runs, datasets, hyperparameters
5. **Serving**: Production model deployment and rollback

We evaluated MLflow, Weights & Biases, and a custom solution. Given our free-tier constraints and specific esports domain requirements, we need a lightweight but capable solution.

## Decision

We will implement a **custom model registry** with MLflow-compatible concepts but simplified for our needs:

### Core Concepts

1. **RegisteredModel**: Container for model versions (like MLflow's Registered Model)
2. **ModelVersion**: Specific version with stage, metrics, artifacts
3. **Stage**: None → Staging → Production → Archived
4. **Metrics**: Performance metrics logged per version

### Storage

- **Metadata**: PostgreSQL (registered_models, model_versions, model_metrics tables)
- **Artifacts**: S3-compatible storage (MinIO for self-hosted, AWS S3 for production)

### Architecture

```
services/api/src/njz_api/model_registry/
├── registry.py     # Core registry implementation
└── schemas.py      # Pydantic models
```

### Stage Transitions

```
None → Staging → Production
  ↓       ↓          ↓
Archived ←───────────┘
```

Rules:
- Only one version per stage (except Archived)
- Transitioning to Production archives current Production version
- Archived versions are read-only

## Consequences

### Positive

1. **Simplicity**: No MLflow server infrastructure required
2. **Integration**: Native integration with our FastAPI backend
3. **Cost**: Uses existing PostgreSQL and S3 infrastructure
4. **Flexibility**: Custom fields for esports-specific metadata
5. **Compliance**: Full audit trail of stage transitions

### Negative

1. **Feature gap**: No built-in experiment tracking (use Weights & Biases)
2. **UI**: No web UI for model management (build custom)
3. **Ecosystem**: No native Spark/Horovod integration
4. **Migration**: Custom format requires migration if moving to MLflow

### Comparison with MLflow

| Feature | Our Registry | MLflow |
|---------|-------------|---------|
| Model versioning | ✅ | ✅ |
| Stage management | ✅ | ✅ |
| Artifact storage | ✅ (S3) | ✅ (multiple) |
| Experiment tracking | ❌ | ✅ |
| Web UI | ❌ | ✅ |
| Infrastructure | PostgreSQL | MLflow server + DB |
| Cost | Included | Extra server |

## Implementation Details

### RegisteredModel

```python
class RegisteredModel(BaseModel):
    name: str  # e.g., "simrating_predictor"
    description: str
    tags: Dict[str, str]
    
    # Current stages
    latest_version: int
    production_version: Optional[int]
    staging_version: Optional[int]
    
    owner: str
    created_at: datetime
    updated_at: datetime
```

### ModelVersion

```python
class ModelVersion(BaseModel):
    name: str  # Model name
    version: int
    
    # Source
    source_system: str  # "training_pipeline"
    run_id: Optional[str]  # W&B run ID
    
    # Stage
    stage: ModelStage
    stage_updated_at: Optional[datetime]
    
    # Framework
    framework: ModelFramework  # pytorch, sklearn, onnx
    framework_version: str
    
    # Artifacts
    artifact_uri: str  # s3://models/...
    signature: Dict  # Input/output schema
    
    # Metadata
    description: str
    tags: Dict[str, str]
    created_by: str
```

### Usage Example

```python
registry = await get_model_registry()

# Create registered model
model = await registry.create_registered_model(
    name="simrating_predictor",
    description="Predicts player SimRating",
    tags={"team": "ml", "priority": "high"},
    owner="ml-team",
)

# Create version
version = await registry.create_model_version(
    name="simrating_predictor",
    source_system="training_pipeline",
    run_id="wandb_run_123",
    framework=ModelFramework.PYTORCH,
    framework_version="2.0.0",
    artifact_uri="s3://models/simrating/v1/model.pt",
    signature={"inputs": ["features"], "outputs": ["rating"]},
    created_by="data-scientist",
)

# Log metrics
await registry.log_metrics(ModelMetrics(
    model_name="simrating_predictor",
    model_version=1,
    metrics={"mae": 0.05, "rmse": 0.08, "r2": 0.92},
    training_duration_seconds=3600,
))

# Transition to production
await registry.transition_stage(StageTransitionRequest(
    model_name="simrating_predictor",
    version=1,
    new_stage=ModelStage.PRODUCTION,
    requested_by="ml-engineer",
))

# Get production model
production_model = await registry.get_production_model("simrating_predictor")
```

## Deployment Strategy

### Staging → Production

1. Train new model version
2. Log metrics and validate performance
3. Create model version in registry
4. Deploy to staging environment
5. Run integration tests
6. Transition to Production stage
7. Update production deployment
8. Monitor for 24 hours
9. Rollback if issues detected

### Rollback

```python
# Quick rollback to previous production version
previous = await registry.get_model_version(
    "simrating_predictor", 
    version=previous_version
)
await registry.transition_stage(StageTransitionRequest(
    model_name="simrating_predictor",
    version=previous_version,
    new_stage=ModelStage.PRODUCTION,
    requested_by="oncall-engineer",
    approval_notes="Rollback due to accuracy degradation",
))
```

## Related Decisions

- ADR-006: Feature Store Architecture (provides features for model training)
- ADR-008: Bayesian Analytics Integration (uses models for predictions)

## Future Work

1. **A/B Testing**: Built-in support for model A/B testing
2. **Shadow Mode**: Deploy new models in shadow mode before production
3. **Auto-rollback**: Automatic rollback on error rate thresholds
4. **Model Comparison**: Statistical comparison between model versions
