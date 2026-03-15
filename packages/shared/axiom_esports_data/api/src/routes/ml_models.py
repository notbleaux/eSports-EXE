"""
ML Model Registry API — Model management, versioning, and A/B testing endpoints.

[Ver001.000] - Initial implementation
"""
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from api.src.db_manager import db

router = APIRouter(prefix="/v1/ml", tags=["ml-models"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ModelBase(BaseModel):
    """Base model schema."""
    name: str = Field(..., min_length=1, max_length=100, description="Model name")
    version: str = Field(..., min_length=1, max_length=20, description="Semantic version")
    type: str = Field(..., description="Model type: classification, regression, clustering, etc.")
    description: Optional[str] = Field(None, description="Model description")
    framework: Optional[str] = Field(None, description="ML framework: onnx, tensorflow, pytorch, sklearn")
    quantization: Optional[str] = Field("fp32", description="Quantization: fp32, fp16, int8, int16")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags for filtering")
    hyperparameters: Optional[dict] = Field(None, description="Model hyperparameters")
    training_config: Optional[dict] = Field(None, description="Training configuration")


class ModelCreate(ModelBase):
    """Schema for creating a new model."""
    artifact_url: Optional[str] = Field(None, description="URL to model artifact")
    checksum_sha256: Optional[str] = Field(None, description="SHA256 hash of model file")
    size_bytes: Optional[int] = Field(None, description="Model file size in bytes")
    input_shape: Optional[dict] = Field(None, description="Input tensor shape")
    output_shape: Optional[dict] = Field(None, description="Output tensor shape")
    accuracy: Optional[float] = Field(None, ge=0, le=1, description="Model accuracy")
    precision: Optional[float] = Field(None, ge=0, le=1)
    recall: Optional[float] = Field(None, ge=0, le=1)
    f1_score: Optional[float] = Field(None, ge=0, le=1)
    avg_latency_ms: Optional[float] = Field(None, ge=0)
    p95_latency_ms: Optional[float] = Field(None, ge=0)
    memory_usage_mb: Optional[float] = Field(None, ge=0)
    parent_model_id: Optional[UUID] = Field(None, description="Parent model for lineage")
    dataset_id: Optional[str] = Field(None, description="Training dataset reference")
    training_job_id: Optional[str] = Field(None, description="Training job reference")


class ModelUpdate(BaseModel):
    """Schema for updating a model."""
    description: Optional[str] = None
    status: Optional[str] = Field(None, description="development, staging, production, archived, deprecated")
    tags: Optional[List[str]] = None
    hyperparameters: Optional[dict] = None
    accuracy: Optional[float] = Field(None, ge=0, le=1)
    precision: Optional[float] = Field(None, ge=0, le=1)
    recall: Optional[float] = Field(None, ge=0, le=1)
    f1_score: Optional[float] = Field(None, ge=0, le=1)
    avg_latency_ms: Optional[float] = Field(None, ge=0)
    p95_latency_ms: Optional[float] = Field(None, ge=0)
    memory_usage_mb: Optional[float] = Field(None, ge=0)


class ModelResponse(ModelBase):
    """Full model response schema."""
    id: UUID
    status: str
    artifact_url: Optional[str]
    checksum_sha256: Optional[str]
    size_bytes: Optional[int]
    input_shape: Optional[dict]
    output_shape: Optional[dict]
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    avg_latency_ms: Optional[float]
    p95_latency_ms: Optional[float]
    memory_usage_mb: Optional[float]
    parent_model_id: Optional[UUID]
    dataset_id: Optional[str]
    training_job_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    trained_at: Optional[datetime]

    class Config:
        from_attributes = True


class ModelListResponse(BaseModel):
    """List of models response."""
    models: List[ModelResponse]
    total: int
    offset: int
    limit: int


class ModelMetricCreate(BaseModel):
    """Schema for recording a model metric."""
    metric_name: str = Field(..., description="accuracy, precision, recall, f1_score, latency, throughput, memory, error_rate, custom")
    metric_value: float
    metric_unit: Optional[str] = Field(None, description="percent, ms, ops/sec, MB, count")
    environment: Optional[str] = Field("production", description="development, staging, production")
    context: Optional[dict] = Field(None, description="Additional context")


class ModelMetricResponse(BaseModel):
    """Model metric response."""
    id: int
    model_id: UUID
    metric_name: str
    metric_value: float
    metric_unit: Optional[str]
    environment: str
    context: Optional[dict]
    recorded_at: datetime


class ModelMetricsHistoryResponse(BaseModel):
    """Metrics history response."""
    model_id: UUID
    metrics: List[ModelMetricResponse]


class DeploymentCreate(BaseModel):
    """Schema for creating a deployment."""
    environment: str = Field(..., description="development, staging, production, edge")
    deployment_type: Optional[str] = Field("full", description="full, canary, shadow")
    traffic_percentage: Optional[float] = Field(100.0, ge=0, le=100)
    deployed_by: Optional[str] = None
    deployment_notes: Optional[str] = None
    endpoint_url: Optional[str] = None


class DeploymentResponse(BaseModel):
    """Deployment response schema."""
    id: int
    model_id: UUID
    environment: str
    deployment_type: str
    status: str
    traffic_percentage: float
    deployed_by: Optional[str]
    deployment_notes: Optional[str]
    endpoint_url: Optional[str]
    deployed_at: datetime
    retired_at: Optional[datetime]


class ABTestCreate(BaseModel):
    """Schema for creating an A/B test."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    model_a_id: UUID
    model_b_id: UUID
    model_a_traffic_pct: Optional[float] = Field(50.0, ge=0, le=100)
    model_b_traffic_pct: Optional[float] = Field(50.0, ge=0, le=100)
    success_metric: Optional[str] = Field("accuracy")
    min_sample_size: Optional[int] = Field(1000, ge=100)
    confidence_level: Optional[float] = Field(0.95, ge=0.8, le=0.99)
    environment: Optional[str] = Field("staging")


class ABTestResponse(BaseModel):
    """A/B test response schema."""
    id: UUID
    name: str
    description: Optional[str]
    model_a_id: UUID
    model_b_id: UUID
    model_a_traffic_pct: float
    model_b_traffic_pct: float
    status: str
    success_metric: str
    min_sample_size: int
    confidence_level: float
    winner_model_id: Optional[UUID]
    winner_reason: Optional[str]
    environment: str
    created_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]


class ModelComparisonResponse(BaseModel):
    """Model comparison response."""
    model_a: ModelResponse
    model_b: ModelResponse
    accuracy_diff: Optional[float]
    latency_diff: Optional[float]
    size_diff_bytes: Optional[int]
    recommendation: str


# ============================================================================
# Helper Functions
# ============================================================================

async def get_model_by_id(model_id: UUID) -> Optional[dict]:
    """Fetch a model by ID."""
    pool = await db.get_pool()
    if not pool:
        return None
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM ml_models WHERE id = $1",
            model_id
        )
        return dict(row) if row else None


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/models", response_model=ModelListResponse)
async def list_models(
    name: Optional[str] = Query(None, description="Filter by model name"),
    type: Optional[str] = Query(None, description="Filter by model type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    framework: Optional[str] = Query(None, description="Filter by framework"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
) -> ModelListResponse:
    """
    List all ML models with optional filtering.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Build WHERE clause
    where_conditions = ["1=1"]
    params = []
    param_idx = 1
    
    if name:
        where_conditions.append(f"name ILIKE ${param_idx}")
        params.append(f"%{name}%")
        param_idx += 1
    
    if type:
        where_conditions.append(f"type = ${param_idx}")
        params.append(type)
        param_idx += 1
    
    if status:
        where_conditions.append(f"status = ${param_idx}")
        params.append(status)
        param_idx += 1
        
    if framework:
        where_conditions.append(f"framework = ${param_idx}")
        params.append(framework)
        param_idx += 1
    
    if tag:
        where_conditions.append(f"${param_idx} = ANY(tags)")
        params.append(tag)
        param_idx += 1
    
    where_sql = " AND ".join(where_conditions)
    
    async with pool.acquire() as conn:
        # Get total count
        count_sql = f"SELECT COUNT(*) FROM ml_models WHERE {where_sql}"
        total = await conn.fetchval(count_sql, *params)
        
        # Get models
        query_sql = f"""
            SELECT * FROM ml_models 
            WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        rows = await conn.fetch(query_sql, *params, limit, offset)
        
        models = [ModelResponse(**dict(row)) for row in rows]
        
        return ModelListResponse(
            models=models,
            total=total or 0,
            offset=offset,
            limit=limit
        )


@router.get("/models/{model_id}", response_model=ModelResponse)
async def get_model(model_id: UUID) -> ModelResponse:
    """
    Get detailed information about a specific model.
    """
    model = await get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return ModelResponse(**model)


@router.post("/models", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def create_model(model: ModelCreate) -> ModelResponse:
    """
    Register a new ML model in the registry.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    async with pool.acquire() as conn:
        # Check for duplicate name+version
        existing = await conn.fetchrow(
            "SELECT id FROM ml_models WHERE name = $1 AND version = $2",
            model.name, model.version
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Model with name '{model.name}' and version '{model.version}' already exists"
            )
        
        # Insert new model
        row = await conn.fetchrow(
            """
            INSERT INTO ml_models (
                name, version, type, description, framework, quantization, tags,
                artifact_url, checksum_sha256, size_bytes, input_shape, output_shape,
                accuracy, precision, recall, f1_score,
                avg_latency_ms, p95_latency_ms, memory_usage_mb,
                hyperparameters, training_config,
                parent_model_id, dataset_id, training_job_id, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING *
            """,
            model.name, model.version, model.type, model.description,
            model.framework, model.quantization, model.tags,
            model.artifact_url, model.checksum_sha256, model.size_bytes,
            model.input_shape, model.output_shape,
            model.accuracy, model.precision, model.recall, model.f1_score,
            model.avg_latency_ms, model.p95_latency_ms, model.memory_usage_mb,
            model.hyperparameters, model.training_config,
            model.parent_model_id, model.dataset_id, model.training_job_id,
            "development"
        )
        
        return ModelResponse(**dict(row))


@router.put("/models/{model_id}", response_model=ModelResponse)
async def update_model(model_id: UUID, update: ModelUpdate) -> ModelResponse:
    """
    Update model metadata and metrics.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check if model exists
    existing = await get_model_by_id(model_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Build update fields
    update_fields = []
    params = []
    param_idx = 1
    
    if update.description is not None:
        update_fields.append(f"description = ${param_idx}")
        params.append(update.description)
        param_idx += 1
    
    if update.status is not None:
        update_fields.append(f"status = ${param_idx}")
        params.append(update.status)
        param_idx += 1
    
    if update.tags is not None:
        update_fields.append(f"tags = ${param_idx}")
        params.append(update.tags)
        param_idx += 1
    
    if update.hyperparameters is not None:
        update_fields.append(f"hyperparameters = ${param_idx}")
        params.append(update.hyperparameters)
        param_idx += 1
    
    if update.accuracy is not None:
        update_fields.append(f"accuracy = ${param_idx}")
        params.append(update.accuracy)
        param_idx += 1
    
    if update.precision is not None:
        update_fields.append(f"precision = ${param_idx}")
        params.append(update.precision)
        param_idx += 1
    
    if update.recall is not None:
        update_fields.append(f"recall = ${param_idx}")
        params.append(update.recall)
        param_idx += 1
    
    if update.f1_score is not None:
        update_fields.append(f"f1_score = ${param_idx}")
        params.append(update.f1_score)
        param_idx += 1
    
    if update.avg_latency_ms is not None:
        update_fields.append(f"avg_latency_ms = ${param_idx}")
        params.append(update.avg_latency_ms)
        param_idx += 1
    
    if update.p95_latency_ms is not None:
        update_fields.append(f"p95_latency_ms = ${param_idx}")
        params.append(update.p95_latency_ms)
        param_idx += 1
    
    if update.memory_usage_mb is not None:
        update_fields.append(f"memory_usage_mb = ${param_idx}")
        params.append(update.memory_usage_mb)
        param_idx += 1
    
    if not update_fields:
        return ModelResponse(**existing)
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
            UPDATE ml_models 
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = ${param_idx}
            RETURNING *
            """,
            *params, model_id
        )
        
        return ModelResponse(**dict(row))


@router.post("/models/{model_id}/deploy", response_model=DeploymentResponse)
async def deploy_model(model_id: UUID, deployment: DeploymentCreate) -> DeploymentResponse:
    """
    Deploy a model to a specific environment.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check if model exists
    model = await get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Retire any existing active deployment in this environment
            await conn.execute(
                """
                UPDATE model_deployments 
                SET status = 'retired', retired_at = NOW()
                WHERE environment = $1 AND status = 'active'
                """,
                deployment.environment
            )
            
            # Create new deployment
            row = await conn.fetchrow(
                """
                INSERT INTO model_deployments (
                    model_id, environment, deployment_type, status,
                    traffic_percentage, deployed_by, deployment_notes, endpoint_url
                ) VALUES ($1, $2, $3, 'active', $4, $5, $6, $7)
                RETURNING *
                """,
                model_id, deployment.environment, deployment.deployment_type,
                deployment.traffic_percentage, deployment.deployed_by,
                deployment.deployment_notes, deployment.endpoint_url
            )
            
            # Update model status if deploying to production
            if deployment.environment == "production":
                await conn.execute(
                    "UPDATE ml_models SET status = 'production' WHERE id = $1",
                    model_id
                )
            
            return DeploymentResponse(**dict(row))


@router.post("/models/{model_id}/metrics", response_model=ModelMetricResponse)
async def record_metric(model_id: UUID, metric: ModelMetricCreate) -> ModelMetricResponse:
    """
    Record a performance metric for a model.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check if model exists
    model = await get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO model_metrics (
                model_id, metric_name, metric_value, metric_unit, environment, context
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            """,
            model_id, metric.metric_name, metric.metric_value,
            metric.metric_unit, metric.environment, metric.context
        )
        
        return ModelMetricResponse(**dict(row))


@router.get("/models/{model_id}/metrics", response_model=ModelMetricsHistoryResponse)
async def get_model_metrics(
    model_id: UUID,
    metric_name: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
) -> ModelMetricsHistoryResponse:
    """
    Get metrics history for a model.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check if model exists
    model = await get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Build WHERE clause
    where_conditions = ["model_id = $1"]
    params = [model_id]
    param_idx = 2
    
    if metric_name:
        where_conditions.append(f"metric_name = ${param_idx}")
        params.append(metric_name)
        param_idx += 1
    
    if environment:
        where_conditions.append(f"environment = ${param_idx}")
        params.append(environment)
        param_idx += 1
    
    where_sql = " AND ".join(where_conditions)
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT * FROM model_metrics
            WHERE {where_sql}
            ORDER BY recorded_at DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
            """,
            *params, limit, offset
        )
        
        metrics = [ModelMetricResponse(**dict(row)) for row in rows]
        
        return ModelMetricsHistoryResponse(
            model_id=model_id,
            metrics=metrics
        )


@router.post("/ab-tests", response_model=ABTestResponse, status_code=status.HTTP_201_CREATED)
async def create_ab_test(test: ABTestCreate) -> ABTestResponse:
    """
    Create a new A/B test between two models.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Validate models exist
    async with pool.acquire() as conn:
        model_a = await conn.fetchrow("SELECT id FROM ml_models WHERE id = $1", test.model_a_id)
        model_b = await conn.fetchrow("SELECT id FROM ml_models WHERE id = $1", test.model_b_id)
        
        if not model_a:
            raise HTTPException(status_code=404, detail="Model A not found")
        if not model_b:
            raise HTTPException(status_code=404, detail="Model B not found")
        
        # Validate traffic percentages sum to 100
        if test.model_a_traffic_pct + test.model_b_traffic_pct != 100:
            raise HTTPException(
                status_code=400,
                detail="Traffic percentages must sum to 100"
            )
        
        row = await conn.fetchrow(
            """
            INSERT INTO ab_tests (
                name, description, model_a_id, model_b_id,
                model_a_traffic_pct, model_b_traffic_pct,
                success_metric, min_sample_size, confidence_level, environment
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            """,
            test.name, test.description, test.model_a_id, test.model_b_id,
            test.model_a_traffic_pct, test.model_b_traffic_pct,
            test.success_metric, test.min_sample_size, test.confidence_level,
            test.environment
        )
        
        return ABTestResponse(**dict(row))


@router.get("/ab-tests", response_model=List[ABTestResponse])
async def list_ab_tests(
    status: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
) -> List[ABTestResponse]:
    """
    List A/B tests with optional filtering.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Build WHERE clause
    where_conditions = ["1=1"]
    params = []
    param_idx = 1
    
    if status:
        where_conditions.append(f"status = ${param_idx}")
        params.append(status)
        param_idx += 1
    
    if environment:
        where_conditions.append(f"environment = ${param_idx}")
        params.append(environment)
        param_idx += 1
    
    where_sql = " AND ".join(where_conditions)
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT * FROM ab_tests
            WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
            """,
            *params, limit, offset
        )
        
        return [ABTestResponse(**dict(row)) for row in rows]


@router.get("/ab-tests/{test_id}", response_model=ABTestResponse)
async def get_ab_test(test_id: UUID) -> ABTestResponse:
    """
    Get A/B test details and results.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM ab_tests WHERE id = $1",
            test_id
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="A/B test not found")
        
        return ABTestResponse(**dict(row))


@router.post("/ab-tests/{test_id}/start", response_model=ABTestResponse)
async def start_ab_test(test_id: UUID) -> ABTestResponse:
    """
    Start a running A/B test.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE ab_tests 
            SET status = 'running', started_at = NOW()
            WHERE id = $1 AND status = 'draft'
            RETURNING *
            """,
            test_id
        )
        
        if not row:
            raise HTTPException(
                status_code=400,
                detail="A/B test not found or not in draft status"
            )
        
        return ABTestResponse(**dict(row))


@router.post("/ab-tests/{test_id}/complete", response_model=ABTestResponse)
async def complete_ab_test(
    test_id: UUID,
    winner_model_id: UUID,
    reason: Optional[str] = None
) -> ABTestResponse:
    """
    Complete an A/B test with a winner.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE ab_tests 
            SET status = 'completed', ended_at = NOW(), winner_model_id = $2, winner_reason = $3
            WHERE id = $1 AND status = 'running'
            RETURNING *
            """,
            test_id, winner_model_id, reason
        )
        
        if not row:
            raise HTTPException(
                status_code=400,
                detail="A/B test not found or not in running status"
            )
        
        return ABTestResponse(**dict(row))


@router.get("/models/{model_a_id}/compare/{model_b_id}", response_model=ModelComparisonResponse)
async def compare_models(model_a_id: UUID, model_b_id: UUID) -> ModelComparisonResponse:
    """
    Compare two models side by side.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    async with pool.acquire() as conn:
        model_a_row = await conn.fetchrow("SELECT * FROM ml_models WHERE id = $1", model_a_id)
        model_b_row = await conn.fetchrow("SELECT * FROM ml_models WHERE id = $1", model_b_id)
        
        if not model_a_row:
            raise HTTPException(status_code=404, detail="Model A not found")
        if not model_b_row:
            raise HTTPException(status_code=404, detail="Model B not found")
        
        model_a = ModelResponse(**dict(model_a_row))
        model_b = ModelResponse(**dict(model_b_row))
        
        # Calculate differences
        accuracy_diff = None
        if model_a.accuracy is not None and model_b.accuracy is not None:
            accuracy_diff = model_a.accuracy - model_b.accuracy
        
        latency_diff = None
        if model_a.avg_latency_ms is not None and model_b.avg_latency_ms is not None:
            latency_diff = model_a.avg_latency_ms - model_b.avg_latency_ms
        
        size_diff = None
        if model_a.size_bytes is not None and model_b.size_bytes is not None:
            size_diff = model_a.size_bytes - model_b.size_bytes
        
        # Generate recommendation
        recommendation = "equivalent"
        if accuracy_diff is not None and accuracy_diff > 0.01:
            recommendation = "A"
        elif accuracy_diff is not None and accuracy_diff < -0.01:
            recommendation = "B"
        elif latency_diff is not None and latency_diff < -5:
            recommendation = "A"  # A is faster
        elif latency_diff is not None and latency_diff > 5:
            recommendation = "B"  # B is faster
        
        return ModelComparisonResponse(
            model_a=model_a,
            model_b=model_b,
            accuracy_diff=accuracy_diff,
            latency_diff=latency_diff,
            size_diff_bytes=size_diff,
            recommendation=recommendation
        )


@router.get("/deployments/active")
async def get_active_deployments(environment: Optional[str] = Query(None)):
    """
    Get all active deployments, optionally filtered by environment.
    """
    pool = await db.get_pool()
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    async with pool.acquire() as conn:
        if environment:
            rows = await conn.fetch(
                """
                SELECT d.*, m.name as model_name, m.version as model_version
                FROM model_deployments d
                JOIN ml_models m ON d.model_id = m.id
                WHERE d.environment = $1 AND d.status = 'active'
                ORDER BY d.deployed_at DESC
                """,
                environment
            )
        else:
            rows = await conn.fetch(
                """
                SELECT d.*, m.name as model_name, m.version as model_version
                FROM model_deployments d
                JOIN ml_models m ON d.model_id = m.id
                WHERE d.status = 'active'
                ORDER BY d.deployed_at DESC
                """
            )
        
        return [dict(row) for row in rows]
