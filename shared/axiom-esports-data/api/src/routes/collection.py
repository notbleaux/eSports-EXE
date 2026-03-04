"""
Data Collection API — Trigger and Monitor Pipeline Runs

Endpoints for managing data extraction from external sources (VLR.gg, HLTV, etc.)
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid
import asyncio

router = APIRouter(prefix="/api/collection", tags=["collection"])


class CollectionMode(str, Enum):
    """Pipeline operation modes."""
    DELTA = "delta"       # Process only new/changed records
    FULL = "full"         # Process all records
    BACKFILL = "backfill" # Fill gaps in historical data


class CollectionSource(str, Enum):
    """Data sources for collection."""
    VLR = "vlr"           # VLR.gg (Valorant)
    HLTV = "hltv"         # HLTV.org (CS2)
    LIQUIPEDIA = "liquipedia"  # Liquipedia


class CollectionRequest(BaseModel):
    """Request to start a data collection job."""
    mode: CollectionMode = Field(
        default=CollectionMode.DELTA,
        description="Collection mode: delta, full, or backfill"
    )
    epochs: Optional[List[int]] = Field(
        default=None,
        description="List of epoch numbers to process (None = current epoch only)"
    )
    source: CollectionSource = Field(
        default=CollectionSource.VLR,
        description="Data source to collect from"
    )
    priority: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Job priority (1 = highest, 10 = lowest)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "mode": "delta",
                "epochs": [3],
                "source": "vlr",
                "priority": 5
            }
        }


class CollectionProgress(BaseModel):
    """Progress information for a collection job."""
    stage: str = Field(..., description="Current pipeline stage")
    percent: float = Field(..., ge=0, le=100, description="Progress percentage")
    records_processed: int = Field(..., description="Number of records processed")
    records_total: Optional[int] = Field(None, description="Total records to process")
    current_epoch: Optional[int] = Field(None, description="Current epoch being processed")
    eta_seconds: Optional[int] = Field(None, description="Estimated time to completion")


class CollectionStatus(BaseModel):
    """Status of a collection job."""
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="Job status: queued, running, completed, failed")
    request: CollectionRequest = Field(..., description="Original request parameters")
    progress: CollectionProgress = Field(default_factory=lambda: CollectionProgress(
        stage="pending", percent=0, records_processed=0
    ))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = Field(None)
    completed_at: Optional[datetime] = Field(None)
    logs: List[str] = Field(default_factory=list)
    error_message: Optional[str] = Field(None)


# In-memory job store (replace with Redis in production)
# Structure: {job_id: CollectionStatus}
job_store: dict = {}


@router.post("/start", response_model=CollectionStatus)
async def start_collection(
    request: CollectionRequest,
    background_tasks: BackgroundTasks
):
    """Start a new data collection job.
    
    This endpoint queues a background job to collect esports data from
    the specified source. Use the returned job_id to monitor progress.
    
    Example:
        ```bash
        curl -X POST "http://api/collection/start" \\
          -H "Content-Type: application/json" \\
          -d '{"mode": "delta", "source": "vlr"}'
        ```
    """
    job_id = f"col_{uuid.uuid4().hex[:12]}"
    
    status = CollectionStatus(
        job_id=job_id,
        status="queued",
        request=request,
        logs=[f"[{datetime.utcnow().isoformat()}] Job queued with priority {request.priority}"]
    )
    
    job_store[job_id] = status
    
    # Start background task
    background_tasks.add_task(run_collection_job, job_id, request)
    
    logger.info(f"Collection job {job_id} queued: {request.mode} from {request.source}")
    return status


@router.get("/status/{job_id}", response_model=CollectionStatus)
async def get_collection_status(job_id: str):
    """Get the current status of a collection job.
    
    Poll this endpoint to monitor job progress after starting a collection.
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    return job_store[job_id]


@router.get("/active", response_model=List[CollectionStatus])
async def list_active_collections(
    limit: int = 10,
    include_completed: bool = False
):
    """List active (running or queued) collection jobs.
    
    Args:
        limit: Maximum number of jobs to return
        include_completed: If true, also include recently completed jobs
    """
    jobs = list(job_store.values())
    
    if not include_completed:
        jobs = [j for j in jobs if j.status in ("queued", "running")]
    else:
        # Sort by created_at descending and take most recent
        jobs = sorted(jobs, key=lambda x: x.created_at, reverse=True)
    
    return jobs[:limit]


@router.post("/cancel/{job_id}")
async def cancel_collection(job_id: str):
    """Cancel a running or queued collection job.
    
    Note: Canceling a running job may leave partial data. Use with caution.
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    job = job_store[job_id]
    
    if job.status in ("completed", "failed", "cancelled"):
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot cancel job in {job.status} state"
        )
    
    job.status = "cancelled"
    job.completed_at = datetime.utcnow()
    job.logs.append(f"[{datetime.utcnow().isoformat()}] Job cancelled by user")
    
    logger.info(f"Collection job {job_id} cancelled")
    return {"job_id": job_id, "status": "cancelled"}


@router.get("/sources")
async def list_sources():
    """List available data sources and their status."""
    return {
        "sources": [
            {
                "id": "vlr",
                "name": "VLR.gg",
                "game": "Valorant",
                "status": "available",
                "rate_limit": "2 requests/second",
                "last_collection": None  # Would query from DB
            },
            {
                "id": "hltv",
                "name": "HLTV.org",
                "game": "Counter-Strike 2",
                "status": "available",
                "rate_limit": "1 request/second",
                "last_collection": None
            },
            {
                "id": "liquipedia",
                "name": "Liquipedia",
                "game": "Multiple",
                "status": "available",
                "rate_limit": "API key required",
                "last_collection": None
            }
        ]
    }


# Background job runner
async def run_collection_job(job_id: str, request: CollectionRequest):
    """Background task to execute collection job."""
    import logging
    logger = logging.getLogger(__name__)
    
    job = job_store[job_id]
    job.status = "running"
    job.started_at = datetime.utcnow()
    job.logs.append(f"[{datetime.utcnow().isoformat()}] Job started")
    
    try:
        # Import pipeline orchestrator
        from pipeline.orchestrator import run_pipeline
        
        # Determine epochs to process
        epochs = request.epochs or [3]  # Default to current epoch
        
        for epoch in epochs:
            if job.status == "cancelled":
                logger.info(f"Job {job_id} cancelled during execution")
                return
            
            job.progress.stage = f"processing_epoch_{epoch}"
            job.progress.current_epoch = epoch
            job.logs.append(f"[{datetime.utcnow().isoformat()}] Processing epoch {epoch}")
            
            # Simulate pipeline execution (replace with actual call)
            # result = await run_pipeline(
            #     mode=request.mode,
            #     epochs=[epoch],
            #     source=request.source.value
            # )
            
            # Simulation for demonstration
            await asyncio.sleep(2)  # Simulate work
            job.progress.records_processed += 100
            job.progress.percent = min(100, (epochs.index(epoch) + 1) / len(epochs) * 100)
        
        # Mark as completed
        job.status = "completed"
        job.completed_at = datetime.utcnow()
        job.progress.stage = "completed"
        job.progress.percent = 100
        job.logs.append(f"[{datetime.utcnow().isoformat()}] Job completed successfully")
        
        logger.info(f"Collection job {job_id} completed: {job.progress.records_processed} records")
        
    except Exception as e:
        job.status = "failed"
        job.completed_at = datetime.utcnow()
        job.error_message = str(e)
        job.logs.append(f"[{datetime.utcnow().isoformat()}] ERROR: {str(e)}")
        logger.error(f"Collection job {job_id} failed: {e}")


# Import logger
import logging
logger = logging.getLogger(__name__)
