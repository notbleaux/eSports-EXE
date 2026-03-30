"""[Ver001.000]
Chaos Engineering API Router

Provides endpoints for controlling chaos experiments and viewing their status.
All endpoints require ADMIN_SYSTEM permission for security.

Endpoints:
    POST /chaos/experiments/start - Start a chaos experiment
    POST /chaos/experiments/{name}/stop - Stop a chaos experiment
    POST /chaos/experiments/stop-all - Stop all experiments
    GET /chaos/experiments - List active experiments
    GET /chaos/dashboard - Get chaos dashboard data
    GET /chaos/metrics - Get aggregated metrics
    POST /chaos/scenarios/{name} - Run predefined chaos scenario
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, validator

from ..chaos import (
    ChaosConfig,
    ChaosEngine,
    ChaosExperiment,
    ChaosMode,
    chaos_engine,
    inject_errors,
    inject_latency,
    simulate_db_slowdown,
)
from ..middleware.rbac import Permission, require_permission

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chaos", tags=["chaos"])


# =============================================================================
# Pydantic Models
# =============================================================================

class ChaosExperimentRequest(BaseModel):
    """Request to start a chaos experiment."""
    
    name: str = Field(..., min_length=1, max_length=100, description="Unique experiment name")
    mode: str = Field(..., description="Chaos mode (latency, error, exception, etc.)")
    probability: float = Field(default=0.1, ge=0.0, le=1.0, description="Injection probability")
    duration: int = Field(default=60, ge=1, le=3600, description="Duration in seconds (max 1 hour)")
    intensity: float = Field(default=1.0, ge=0.0, le=10.0, description="Intensity multiplier")
    targets: List[str] = Field(default=["*"], description="Target endpoint patterns")
    
    @validator("mode")
    def validate_mode(cls, v):
        """Validate chaos mode."""
        valid_modes = [m.value for m in ChaosMode]
        if v not in valid_modes:
            raise ValueError(f"Invalid mode '{v}'. Must be one of: {valid_modes}")
        return v


class ChaosExperimentResponse(BaseModel):
    """Response for chaos experiment operations."""
    
    status: str
    name: str
    mode: str
    duration: int
    message: Optional[str] = None
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChaosExperimentDetails(BaseModel):
    """Details of an active chaos experiment."""
    
    name: str
    mode: str
    probability: float
    intensity: float
    targets: List[str]
    is_active: bool
    metrics: Dict[str, Any]


class ChaosExperimentsListResponse(BaseModel):
    """Response for listing experiments."""
    
    active_count: int
    experiments: List[ChaosExperimentDetails]


class ChaosDashboardResponse(BaseModel):
    """Chaos dashboard data."""
    
    active_experiments: int
    experiments: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    system_effects: Dict[str, Any]
    recommendations: List[Dict[str, Any]]


class ChaosMetricsResponse(BaseModel):
    """Aggregated chaos metrics."""
    
    total_experiments_run: int
    total_requests_affected: int
    total_errors_injected: int
    total_latency_added_ms: float
    current_experiments: int


class ChaosScenarioRequest(BaseModel):
    """Request to run a predefined chaos scenario."""
    
    duration: int = Field(default=300, ge=30, le=1800, description="Duration in seconds")
    intensity: float = Field(default=1.0, ge=0.1, le=5.0, description="Scenario intensity")
    targets: List[str] = Field(default=["/v1/*"], description="Target endpoints")


class ChaosScenarioResponse(BaseModel):
    """Response for scenario execution."""
    
    status: str
    scenario_name: str
    experiment_names: List[str]
    duration: int
    message: str


# =============================================================================
# Predefined Chaos Scenarios
# =============================================================================

PREDEFINED_SCENARIOS = {
    "api_degradation": {
        "description": "Simulate gradual API degradation with increasing latency",
        "experiments": [
            {"mode": ChaosMode.LATENCY, "probability": 0.3, "intensity": 0.5},
            {"mode": ChaosMode.ERROR, "probability": 0.1, "intensity": 0.5},
        ],
    },
    "database_crisis": {
        "description": "Simulate database performance crisis",
        "experiments": [
            {"mode": ChaosMode.DB_SLOW, "probability": 0.5, "intensity": 2.0},
            {"mode": ChaosMode.DB_DISCONNECT, "probability": 0.1, "intensity": 1.0},
        ],
    },
    "cache_failure": {
        "description": "Simulate cache layer failures",
        "experiments": [
            {"mode": ChaosMode.CACHE_MISS, "probability": 0.8, "intensity": 1.0},
            {"mode": ChaosMode.REDIS_FAIL, "probability": 0.3, "intensity": 1.0},
        ],
    },
    "resource_exhaustion": {
        "description": "Simulate resource exhaustion (CPU/Memory pressure)",
        "experiments": [
            {"mode": ChaosMode.CPU, "probability": 1.0, "intensity": 1.0},
            {"mode": ChaosMode.MEMORY, "probability": 1.0, "intensity": 1.0},
        ],
    },
    "network_chaos": {
        "description": "Simulate network instability",
        "experiments": [
            {"mode": ChaosMode.NETWORK_PARTITION, "probability": 0.2, "intensity": 1.0},
            {"mode": ChaosMode.LATENCY, "probability": 0.5, "intensity": 3.0},
        ],
    },
    "full_system_failure": {
        "description": "Simulate catastrophic system failure",
        "experiments": [
            {"mode": ChaosMode.ERROR, "probability": 0.5, "intensity": 2.0},
            {"mode": ChaosMode.EXCEPTION, "probability": 0.2, "intensity": 1.0},
            {"mode": ChaosMode.DB_SLOW, "probability": 0.4, "intensity": 2.0},
            {"mode": ChaosMode.CACHE_MISS, "probability": 0.7, "intensity": 1.0},
        ],
    },
}


# =============================================================================
# API Endpoints
# =============================================================================

@router.post(
    "/experiments/start",
    response_model=ChaosExperimentResponse,
    summary="Start a chaos experiment",
    description="""
    Start a new chaos engineering experiment.
    
    ## Chaos Modes
    - **latency**: Add random delays to responses (100ms - 2s)
    - **error**: Return HTTP 5xx errors
    - **exception**: Raise random Python exceptions
    - **memory**: Consume system memory
    - **cpu**: Spike CPU usage
    - **db_slow**: Slow down database queries
    - **db_disconnect**: Simulate database disconnections
    - **cache_miss**: Force cache misses
    - **redis_fail**: Simulate Redis failures
    - **network_partition**: Simulate network partitions
    
    ## Required Permission
    - ADMIN_SYSTEM
    
    ## Example Request
    ```json
    {
      "name": "latency_test",
      "mode": "latency",
      "probability": 0.3,
      "duration": 300,
      "intensity": 1.0,
      "targets": ["/v1/tournaments"]
    }
    ```
    """,
    responses={
        200: {"description": "Experiment started successfully"},
        400: {"description": "Invalid request parameters"},
        409: {"description": "Experiment with this name already exists"},
        403: {"description": "Insufficient permissions"},
    },
)
async def start_experiment(
    request: ChaosExperimentRequest,
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> ChaosExperimentResponse:
    """Start a chaos experiment."""
    try:
        mode = ChaosMode(request.mode)
        config = ChaosConfig(
            mode=mode,
            probability=request.probability,
            duration=request.duration,
            intensity=request.intensity,
            targets=request.targets,
        )
        
        await chaos_engine.start_experiment(request.name, config)
        
        logger.warning(
            f"Chaos experiment started by {principal.id if principal else 'system'}: "
            f"{request.name} ({request.mode})"
        )
        
        return ChaosExperimentResponse(
            status="started",
            name=request.name,
            mode=request.mode,
            duration=request.duration,
            message=f"Experiment '{request.name}' started successfully",
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.post(
    "/experiments/{name}/stop",
    response_model=ChaosExperimentResponse,
    summary="Stop a chaos experiment",
    description="""
    Stop an active chaos experiment.
    
    ## Required Permission
    - ADMIN_SYSTEM
    """,
    responses={
        200: {"description": "Experiment stopped successfully"},
        404: {"description": "Experiment not found"},
        403: {"description": "Insufficient permissions"},
    },
)
async def stop_experiment(
    name: str,
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> ChaosExperimentResponse:
    """Stop a chaos experiment."""
    success = await chaos_engine.stop_experiment(name)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{name}' not found",
        )
    
    logger.warning(
        f"Chaos experiment stopped by {principal.id if principal else 'system'}: {name}"
    )
    
    return ChaosExperimentResponse(
        status="stopped",
        name=name,
        mode="unknown",
        duration=0,
        message=f"Experiment '{name}' stopped successfully",
    )


@router.post(
    "/experiments/stop-all",
    response_model=Dict[str, Any],
    summary="Stop all chaos experiments",
    description="""
    Stop all active chaos experiments at once.
    
    ## Required Permission
    - ADMIN_SYSTEM
    """,
)
async def stop_all_experiments(
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> Dict[str, Any]:
    """Stop all chaos experiments."""
    count = await chaos_engine.stop_all_experiments()
    
    logger.warning(
        f"All chaos experiments stopped by {principal.id if principal else 'system'}: {count} total"
    )
    
    return {
        "status": "stopped_all",
        "stopped_count": count,
        "message": f"Stopped {count} active experiments",
    }


@router.get(
    "/experiments",
    response_model=ChaosExperimentsListResponse,
    summary="List active chaos experiments",
    description="""
    Get a list of all active chaos experiments with their current status.
    
    ## Required Permission
    - ADMIN_SYSTEM
    """,
)
async def list_experiments(
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> ChaosExperimentsListResponse:
    """List all active chaos experiments."""
    summary = chaos_engine.get_experiments_summary()
    
    experiments = [
        ChaosExperimentDetails(
            name=exp["name"],
            mode=exp["mode"],
            probability=exp["probability"],
            intensity=exp["intensity"],
            targets=exp["targets"],
            is_active=exp["is_active"],
            metrics=exp["metrics"],
        )
        for exp in summary["experiments"]
    ]
    
    return ChaosExperimentsListResponse(
        active_count=summary["active_count"],
        experiments=experiments,
    )


@router.get(
    "/dashboard",
    response_model=ChaosDashboardResponse,
    summary="Get chaos dashboard",
    description="""
    Get comprehensive chaos engineering dashboard data including:
    - Active experiments
    - System effects
    - Aggregated metrics
    - Recommendations
    
    ## Required Permission
    - ADMIN_SYSTEM
    """,
)
async def get_dashboard(
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> ChaosDashboardResponse:
    """Get chaos dashboard data."""
    summary = chaos_engine.get_experiments_summary()
    recommendations = chaos_engine.get_recommendations()
    
    # Calculate aggregated metrics
    total_affected = sum(
        exp.metrics.requests_affected for exp in chaos_engine.active_experiments.values()
    )
    total_errors = sum(
        exp.metrics.errors_injected for exp in chaos_engine.active_experiments.values()
    )
    total_latency = sum(
        exp.metrics.latency_added_ms for exp in chaos_engine.active_experiments.values()
    )
    
    return ChaosDashboardResponse(
        active_experiments=summary["active_count"],
        experiments=summary["experiments"],
        metrics={
            "total_requests_affected": total_affected,
            "total_errors_injected": total_errors,
            "total_latency_added_ms": round(total_latency, 2),
        },
        system_effects=summary["system_effects"],
        recommendations=recommendations,
    )


@router.get(
    "/metrics",
    response_model=ChaosMetricsResponse,
    summary="Get chaos metrics",
    description="""
    Get aggregated chaos engineering metrics.
    
    ## Required Permission
    - ADMIN_SYSTEM (or METRICS_READ for read-only)
    """,
)
async def get_metrics(
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> ChaosMetricsResponse:
    """Get aggregated chaos metrics."""
    total_affected = sum(
        exp.metrics.requests_affected for exp in chaos_engine.active_experiments.values()
    )
    total_errors = sum(
        exp.metrics.errors_injected for exp in chaos_engine.active_experiments.values()
    )
    total_latency = sum(
        exp.metrics.latency_added_ms for exp in chaos_engine.active_experiments.values()
    )
    
    return ChaosMetricsResponse(
        total_experiments_run=len(chaos_engine.active_experiments),
        total_requests_affected=total_affected,
        total_errors_injected=total_errors,
        total_latency_added_ms=round(total_latency, 2),
        current_experiments=len(chaos_engine.active_experiments),
    )


@router.post(
    "/scenarios/{scenario_name}",
    response_model=ChaosScenarioResponse,
    summary="Run a predefined chaos scenario",
    description="""
    Run a predefined chaos scenario with multiple coordinated experiments.
    
    ## Available Scenarios
    - **api_degradation**: Gradual API degradation with increasing latency
    - **database_crisis**: Database performance crisis with slow queries
    - **cache_failure**: Cache layer failures and cache misses
    - **resource_exhaustion**: CPU and memory pressure
    - **network_chaos**: Network instability and partitions
    - **full_system_failure**: Catastrophic system failure simulation
    
    ## Required Permission
    - ADMIN_SYSTEM
    """,
    responses={
        200: {"description": "Scenario started successfully"},
        404: {"description": "Scenario not found"},
        403: {"description": "Insufficient permissions"},
    },
)
async def run_scenario(
    scenario_name: str,
    request: ChaosScenarioRequest,
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> ChaosScenarioResponse:
    """Run a predefined chaos scenario."""
    if scenario_name not in PREDEFINED_SCENARIOS:
        available = list(PREDEFINED_SCENARIOS.keys())
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_name}' not found. Available: {available}",
        )
    
    scenario = PREDEFINED_SCENARIOS[scenario_name]
    experiment_names = []
    
    # Start all experiments in the scenario
    for i, exp_config in enumerate(scenario["experiments"]):
        exp_name = f"{scenario_name}_{i}_{datetime.now(timezone.utc).strftime('%H%M%S')}"
        
        config = ChaosConfig(
            mode=exp_config["mode"],
            probability=exp_config["probability"],
            duration=request.duration,
            intensity=exp_config["intensity"] * request.intensity,
            targets=request.targets,
        )
        
        try:
            await chaos_engine.start_experiment(exp_name, config)
            experiment_names.append(exp_name)
        except ValueError as e:
            # If one fails, stop others and report error
            for name in experiment_names:
                await chaos_engine.stop_experiment(name)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Failed to start experiment {i}: {str(e)}",
            )
    
    logger.warning(
        f"Chaos scenario '{scenario_name}' started by "
        f"{principal.id if principal else 'system'}: {len(experiment_names)} experiments"
    )
    
    return ChaosScenarioResponse(
        status="started",
        scenario_name=scenario_name,
        experiment_names=experiment_names,
        duration=request.duration,
        message=f"Scenario '{scenario_name}' started with {len(experiment_names)} experiments",
    )


@router.get(
    "/scenarios",
    response_model=Dict[str, Any],
    summary="List available chaos scenarios",
    description="""
    List all predefined chaos scenarios with their descriptions.
    
    ## Required Permission
    - ADMIN_SYSTEM
    """,
)
async def list_scenarios(
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> Dict[str, Any]:
    """List all predefined chaos scenarios."""
    return {
        "scenarios": [
            {
                "name": name,
                "description": config["description"],
                "experiment_count": len(config["experiments"]),
                "modes": [exp["mode"].value for exp in config["experiments"]],
            }
            for name, config in PREDEFINED_SCENARIOS.items()
        ]
    }


@router.post(
    "/quick/latency",
    response_model=ChaosExperimentResponse,
    summary="Quick start latency experiment",
    description="""
    Quickly start a latency injection experiment.
    
    ## Required Permission
    - ADMIN_SYSTEM
    """,
)
async def quick_latency(
    duration: int = Query(default=60, ge=10, le=600),
    probability: float = Query(default=0.3, ge=0.0, le=1.0),
    intensity: float = Query(default=1.0, ge=0.1, le=5.0),
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> ChaosExperimentResponse:
    """Quick start latency experiment."""
    name = f"quick_latency_{datetime.now(timezone.utc).strftime('%H%M%S')}"
    
    await inject_latency(
        name=name,
        duration=duration,
        probability=probability,
        intensity=intensity,
    )
    
    return ChaosExperimentResponse(
        status="started",
        name=name,
        mode="latency",
        duration=duration,
        message=f"Quick latency experiment '{name}' started",
    )


@router.post(
    "/quick/errors",
    response_model=ChaosExperimentResponse,
    summary="Quick start error injection experiment",
    description="""
    Quickly start an error injection experiment.
    
    ## Required Permission
    - ADMIN_SYSTEM
    """,
)
async def quick_errors(
    duration: int = Query(default=60, ge=10, le=600),
    probability: float = Query(default=0.1, ge=0.0, le=1.0),
    targets: List[str] = Query(default=["/v1/*"]),
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> ChaosExperimentResponse:
    """Quick start error injection experiment."""
    name = f"quick_errors_{datetime.now(timezone.utc).strftime('%H%M%S')}"
    
    await inject_errors(
        name=name,
        duration=duration,
        probability=probability,
        targets=targets,
    )
    
    return ChaosExperimentResponse(
        status="started",
        name=name,
        mode="error",
        duration=duration,
        message=f"Quick error experiment '{name}' started",
    )


@router.get(
    "/health",
    response_model=Dict[str, Any],
    summary="Chaos system health check",
    description="""
    Health check endpoint for the chaos engineering system.
    Returns status of the chaos engine and active experiments.
    """,
)
async def chaos_health() -> Dict[str, Any]:
    """Chaos system health check."""
    return {
        "status": "healthy",
        "active_experiments": len(chaos_engine.active_experiments),
        "system_ready": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
