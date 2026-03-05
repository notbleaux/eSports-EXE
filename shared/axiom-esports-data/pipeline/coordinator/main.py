"""FastAPI orchestrator for dual-game pipeline coordination."""

from contextlib import asynccontextmanager
from typing import Optional, List, Any, Dict
from uuid import UUID
import logging
import os

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from pipeline.coordinator.models import (
    ExtractionJob,
    JobBatch,
    Agent,
    AgentStatus,
    JobStatus,
    GameType,
    JobPriority,
    AgentCapabilities,
    QueueStats,
    SubmitJobRequest,
    SubmitBatchRequest,
    AgentRegistrationRequest,
    HealthCheckResponse,
)
from pipeline.coordinator.queue_manager import QueueManager, get_queue_manager
from pipeline.coordinator.agent_manager import AgentManager
from pipeline.coordinator.conflict_resolver import ConflictResolver

logger = logging.getLogger(__name__)

# Global instances (initialized on startup)
queue_manager: QueueManager = None
agent_manager: AgentManager = None
conflict_resolver: ConflictResolver = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize managers on startup."""
    global queue_manager, agent_manager, conflict_resolver
    
    logger.info("Starting SATOR Pipeline Coordinator...")
    
    # Initialize managers
    queue_manager = get_queue_manager()
    await queue_manager.start()
    
    agent_manager = AgentManager(queue_manager)
    conflict_resolver = ConflictResolver()
    
    logger.info("Pipeline coordinator initialized")
    
    yield
    
    # Cleanup
    logger.info("Shutting down...")
    await queue_manager.stop()


app = FastAPI(
    title="SATOR Pipeline Coordinator",
    description="Dual-game (CS/Valorant) extraction orchestration API",
    version="1.0.0",
    lifespan=lifespan,
)


# =============================================================================
# Job Endpoints
# =============================================================================

@app.post("/jobs/submit", response_model=Dict[str, Any])
async def submit_job(request: SubmitJobRequest):
    """Submit a new extraction job.
    
    Request Body:
        - game: GameType (cs/valorant)
        - priority: JobPriority (0=CRITICAL, 4=BACKGROUND)
        - config: JobConfig with match_id, source, etc.
    
    Returns:
        - job_id: UUID
        - status: JobStatus (always PENDING)
        - message: str
    """
    # Create job from request
    job = ExtractionJob(
        game=request.game,
        priority=request.priority,
        config=request.config,
    )
    
    # Check for duplicates
    duplicate_id = await conflict_resolver.check_duplicate(job)
    if duplicate_id:
        return {
            "job_id": str(duplicate_id),
            "status": "duplicate",
            "message": "Job already exists"
        }
    
    # Add to queue
    await queue_manager.enqueue(job)
    await conflict_resolver.register_job(job)
    
    logger.info(f"Submitted job {job.id} ({job.game.value}, priority={job.priority.name})")
    
    return {
        "job_id": str(job.id),
        "status": JobStatus.PENDING.value,
        "message": "Job submitted successfully"
    }


@app.post("/jobs/submit-batch", response_model=Dict[str, Any])
async def submit_batch(request: SubmitBatchRequest):
    """Submit a batch of extraction jobs.
    
    Request Body:
        - game: GameType
        - priority: JobPriority
        - configs: List[JobConfig]
        - description: Optional[str]
    
    Returns:
        - batch_id: UUID
        - job_count: int
        - status: str
    """
    # Create jobs from configs
    jobs = []
    for config in request.configs:
        job = ExtractionJob(
            game=request.game,
            priority=request.priority,
            config=config,
        )
        jobs.append(job)
    
    # Create batch
    batch = JobBatch(
        game=request.game,
        jobs=jobs,
        priority=request.priority,
        description=request.description,
    )
    
    # Add to queue
    await queue_manager.enqueue_batch(batch)
    
    # Register jobs for duplicate detection
    for job in jobs:
        await conflict_resolver.register_job(job)
    
    logger.info(f"Submitted batch {batch.id} with {len(jobs)} jobs ({request.game.value})")
    
    return {
        "batch_id": str(batch.id),
        "job_count": len(jobs),
        "status": "submitted",
        "message": f"Batch with {len(jobs)} jobs submitted successfully"
    }


@app.get("/jobs/{job_id}/status", response_model=Dict[str, Any])
async def get_job_status(job_id: str):
    """Get job status and results."""
    try:
        job_uuid = UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    # Try both game queues
    job = await queue_manager.get_job(job_uuid)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    response = {
        "job_id": str(job.id),
        "status": job.status.value,
        "game": job.game.value,
        "priority": job.priority.name,
        "retry_count": job.retry_count,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }
    
    if job.assigned_agent:
        response["assigned_agent"] = str(job.assigned_agent)
    if job.started_at:
        response["started_at"] = job.started_at.isoformat()
    if job.completed_at:
        response["completed_at"] = job.completed_at.isoformat()
    if job.result:
        response["result"] = job.result
    if job.error_message:
        response["error"] = job.error_message
        response["error_code"] = job.error_code
    
    return response


@app.post("/jobs/{job_id}/complete", response_model=Dict[str, Any])
async def complete_job(job_id: str, result: Dict[str, Any]):
    """Mark job as complete with results.
    
    Args:
        job_id: UUID of job to complete
        result: Extraction results including records_processed, data_hash, etc.
    """
    try:
        job_uuid = UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    # Extract game type and processing time from result
    game_hint = None
    if "game" in result:
        game_hint = GameType(result["game"])
    
    processing_time_ms = result.get("processing_time_ms")
    
    success = await queue_manager.complete_job(
        job_uuid,
        game=game_hint,
        result=result,
        processing_time_ms=processing_time_ms,
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Job not found or not in processing state")
    
    # Update agent status if we know which agent completed it
    agent_id = result.get("agent_id")
    if agent_id:
        await agent_manager.mark_idle(
            UUID(agent_id),
            success=True,
            processing_time_ms=processing_time_ms,
        )
    
    logger.info(f"Job {job_id} completed ({result.get('records_processed', 0)} records)")
    
    return {
        "job_id": job_id,
        "status": JobStatus.COMPLETED.value,
        "records_processed": result.get("records_processed", 0),
        "message": "Job completed successfully"
    }


@app.post("/jobs/{job_id}/fail", response_model=Dict[str, Any])
async def fail_job(job_id: str, error_data: Dict[str, str]):
    """Mark job as failed with error message.
    
    Args:
        job_id: UUID of job to fail
        error_data: Dict with "error" key containing error message
    """
    try:
        job_uuid = UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    error = error_data.get("error", "Unknown error")
    game_hint = None
    if "game" in error_data:
        game_hint = GameType(error_data["game"])
    
    success = await queue_manager.fail_job(
        job_uuid,
        game=game_hint,
        error=error,
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Job not found or not in processing state")
    
    # Get job to check if it will be retried
    job = await queue_manager.get_job(job_uuid, game_hint)
    status = JobStatus.RETRYING if job and job.is_retryable() else JobStatus.FAILED
    
    logger.warning(f"Job {job_id} failed: {error}")
    
    return {
        "job_id": job_id,
        "status": status.value,
        "error": error,
        "message": "Job failure recorded"
    }


@app.post("/jobs/{job_id}/cancel", response_model=Dict[str, Any])
async def cancel_job(job_id: str):
    """Cancel a pending job."""
    try:
        job_uuid = UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    # Try both queues
    for game in GameType:
        success = await queue_manager.cancel_job(job_uuid, game)
        if success:
            logger.info(f"Job {job_id} cancelled")
            return {
                "job_id": job_id,
                "status": JobStatus.CANCELLED.value,
                "message": "Job cancelled successfully"
            }
    
    raise HTTPException(status_code=404, detail="Job not found or not in pending state")


# =============================================================================
# Agent Endpoints
# =============================================================================

@app.post("/agents/register", response_model=Dict[str, Any])
async def register_agent(request: AgentRegistrationRequest):
    """Register a new extraction agent.
    
    Returns:
        - agent_id: UUID
        - status: AgentStatus
        - message: str
    """
    agent = await agent_manager.register_agent(
        name=request.name,
        capabilities=request.capabilities,
        host=request.host,
        port=request.port,
        version=request.version,
        heartbeat_interval_seconds=request.heartbeat_interval_seconds,
    )
    
    logger.info(f"Registered agent {agent.id} ({request.name})")
    
    return {
        "agent_id": str(agent.id),
        "status": AgentStatus.IDLE.value,
        "message": "Agent registered successfully"
    }


@app.post("/agents/{agent_id}/heartbeat", response_model=Dict[str, Any])
async def agent_heartbeat(agent_id: str, status_update: Optional[Dict[str, Any]] = None):
    """Process agent heartbeat.
    
    Agents should call this every 10-15 seconds.
    Returns work assignment if available.
    """
    try:
        agent_uuid = UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    healthy = await agent_manager.heartbeat(agent_uuid)
    if not healthy:
        raise HTTPException(status_code=400, detail="Agent unhealthy, expired, or not found")
    
    # Update status if provided
    if status_update:
        new_status = status_update.get("status")
        current_job_id = status_update.get("current_job_id")
        if new_status:
            await agent_manager.update_agent_status(
                agent_uuid,
                AgentStatus(new_status),
                UUID(current_job_id) if current_job_id else None,
            )
    
    # Check for available work
    work = await agent_manager.assign_work(agent_uuid)
    
    return {
        "healthy": True,
        "work": work.model_dump() if work else None
    }


@app.get("/agents/{agent_id}/work")
async def get_work(agent_id: str):
    """Get next work assignment for agent."""
    try:
        agent_uuid = UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    work = await agent_manager.assign_work(agent_uuid)
    
    if work:
        return work.model_dump()
    return None


@app.get("/agents/{agent_id}/status", response_model=Dict[str, Any])
async def get_agent_status(agent_id: str):
    """Get agent status."""
    try:
        agent_uuid = UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    agent = await agent_manager.get_agent_status(agent_uuid)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {
        "agent_id": str(agent.id),
        "name": agent.name,
        "status": agent.status.value,
        "games": [g.value for g in agent.capabilities.games],
        "is_healthy": agent.is_healthy(),
        "total_jobs_completed": agent.total_jobs_completed,
        "total_jobs_failed": agent.total_jobs_failed,
        "success_rate": agent.get_success_rate(),
        "last_heartbeat": agent.last_heartbeat.isoformat() if agent.last_heartbeat else None,
    }


@app.get("/agents", response_model=List[Dict[str, Any]])
async def list_agents(
    game: Optional[str] = None,
    status: Optional[str] = None,
):
    """List all agents with optional filtering."""
    game_type = GameType(game) if game else None
    status_type = AgentStatus(status) if status else None
    
    agents = await agent_manager.list_agents(
        game_type=game_type,
        status=status_type,
    )
    
    return [
        {
            "agent_id": str(a.id),
            "name": a.name,
            "status": a.status.value,
            "games": [g.value for g in a.capabilities.games],
            "is_healthy": a.is_healthy(),
            "current_job_id": str(a.current_job_id) if a.current_job_id else None,
        }
        for a in agents
    ]


# =============================================================================
# Health & Metrics Endpoints
# =============================================================================

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint for monitoring."""
    stats = await queue_manager.get_stats()
    agents = await agent_manager.list_agents()
    healthy_agents = await agent_manager.get_healthy_agents()
    
    total_pending = sum(s.pending for s in stats.values())
    total_processing = sum(s.processing for s in stats.values())
    
    # Determine overall health
    health = "healthy"
    for s in stats.values():
        if s.health == "critical":
            health = "unhealthy"
            break
        elif s.health == "warning":
            health = "degraded"
    
    return HealthCheckResponse(
        status=health,
        details={
            "queue_depth": total_pending,
            "processing_jobs": total_processing,
            "total_agents": len(agents),
            "healthy_agents": len(healthy_agents),
            "queues": {
                game.value: {
                    "pending": s.pending,
                    "processing": s.processing,
                    "health": s.health,
                }
                for game, s in stats.items()
            },
        },
    )


@app.get("/metrics", response_model=Dict[str, Any])
async def get_metrics():
    """Get pipeline metrics."""
    stats = await queue_manager.get_stats()
    agents = await agent_manager.list_agents()
    
    return {
        "queues": {
            game.value: {
                "pending": s.pending,
                "processing": s.processing,
                "completed_24h": s.completed_24h,
                "failed_24h": s.failed_24h,
                "health": s.health,
            }
            for game, s in stats.items()
        },
        "agents": {
            "total": len(agents),
            "by_game": {
                "cs": len([a for a in agents if GameType.CS in a.capabilities.games]),
                "valorant": len([a for a in agents if GameType.VALORANT in a.capabilities.games]),
            },
            "by_status": {
                status.value: len([a for a in agents if a.status == status])
                for status in AgentStatus
            },
            "healthy": len([a for a in agents if a.is_healthy()]),
        },
    }


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "SATOR Pipeline Coordinator",
        "version": "1.0.0",
        "description": "Dual-game (CS/Valorant) extraction orchestration API",
        "endpoints": {
            "jobs": "/jobs",
            "agents": "/agents",
            "health": "/health",
            "metrics": "/metrics",
        },
    }
