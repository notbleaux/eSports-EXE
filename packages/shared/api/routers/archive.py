"""
Module: routers.archive
Purpose: FastAPI router for archival system endpoints
Tasks: AS-5, AS-6 - Frame endpoints, GC, migration, health, metrics
Date: 2026-03-28

[Ver001.000] - Initial router implementation
"""

# Import archival components
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import List
from uuid import UUID

import structlog

# Add repo root to path before local imports
_REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from fastapi import (  # noqa: E402
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from fastapi.responses import PlainTextResponse  # noqa: E402

from cache import cache_get, cache_set  # noqa: E402
from src.auth.auth_schemas import TokenData  # noqa: E402
from src.njz_api.archival.dependencies import (  # noqa: E402
    get_archival_service,
    get_storage_backend,
    require_admin_auth,
    require_service_or_admin_auth,
)
from src.njz_api.archival.metrics import get_metrics  # noqa: E402
from src.njz_api.archival.schemas.archive import (  # noqa: E402
    ArchiveAuditLogResponse,
    ErrorResponse,
    FrameQueryResponse,
    FrameUploadRequest,
    FrameUploadResponse,
    GCRequest,
    PinRequest,
    StorageMigrateRequest,
)
from src.njz_api.archival.services.archival_service import (  # noqa: E402
    ArchivalService,
    ArchivalServiceError,
)
from src.njz_api.archival.storage.backend import LocalBackend  # noqa: E402

# Import Prometheus if available
try:
    from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/archive", tags=["archive"])


# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------

def _get_actor_from_user(user: TokenData) -> str:
    """Extract actor identifier from user token."""
    return user.username or user.user_id


async def _get_storage_stats(storage: LocalBackend) -> dict:
    """Get storage statistics from backend."""
    try:
        stats = await storage.get_stats()
        return {
            "frame_count": stats.get("total_files", 0),
            "storage_bytes": stats.get("total_bytes", 0),
            "shard_count": stats.get("shard_count", 0),
        }
    except Exception as e:
        logger.error(
            "storage_stats_failed",
            error=str(e)
        )
        return {"frame_count": 0, "storage_bytes": 0, "shard_count": 0}


# -----------------------------------------------------------------------------
# AS-5: Frame Endpoints
# -----------------------------------------------------------------------------

@router.post(
    "/frames",
    response_model=FrameUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload batch frames",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        409: {"model": ErrorResponse, "description": "Duplicate frame"},
        503: {"model": ErrorResponse, "description": "Storage unavailable"},
    },
)
async def upload_frames(
    request: Request,
    payload: FrameUploadRequest,
    service: ArchivalService = Depends(get_archival_service),
    user: TokenData = Depends(require_service_or_admin_auth),
):
    """Upload a batch of frames to archival storage.
    
    Frames are deduplicated by content_hash. Duplicate frames are
    logged but not stored again. Requires admin or service principal.
    
    - **frames**: List of frame metadata with optional JPEG data
    - **extraction_job_id**: Reference to the extraction job
    - **match_id**: Associated match ID
    - **manifest_id**: Optional existing manifest ID for continuation
    """
    start_time = time.time()
    metrics = get_metrics()
    
    try:
        actor = _get_actor_from_user(user)
        
        response = await service.upload_frames(
            frames=payload.frames,
            extraction_job_id=payload.extraction_job_id,
            match_id=payload.match_id,
            manifest_id=payload.manifest_id,
            actor=actor,
        )
        
        # Record metrics
        duration = time.time() - start_time
        metrics.observe_upload_duration(duration)
        metrics.increment_frames_uploaded(
            count=len(response.frame_ids),
            status="success",
        )
        metrics.increment_frames_deduplicated(response.duplicates_skipped)
        metrics.increment_uploads(status="success")
        
        # Record frame sizes
        for frame in payload.frames:
            if frame.jpeg_size_bytes:
                metrics.observe_frame_size(frame.jpeg_size_bytes)
        
        logger.info(
            "frame_upload_completed",
            frames_uploaded=len(response.frame_ids),
            duplicates_skipped=response.duplicates_skipped,
            actor=actor,
            duration_ms=round(duration * 1000, 2)
        )
        
        return response
        
    except ArchivalServiceError as e:
        metrics.increment_uploads(status="error")
        logger.error(
            "upload_service_error",
            error=e.message,
            error_code=e.code,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Storage error: {e.message}",
        )
    except Exception as e:
        metrics.increment_uploads(status="error")
        logger.error(
            "upload_unexpected_error",
            error=str(e),
            error_type=type(e).__name__
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during upload",
        )


@router.get(
    "/matches/{match_id}/frames",
    response_model=FrameQueryResponse,
    summary="Query frames by match",
)
async def query_match_frames(
    match_id: UUID,
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=100, description="Frames per page"),
    service: ArchivalService = Depends(get_archival_service),
):
    """Query frames for a specific match with pagination.
    
    Results are cached for 5 minutes. Returns paginated frame list
    sorted by timestamp.
    
    - **match_id**: UUID of the match
    - **page**: Page number (default: 1)
    - **limit**: Frames per page, max 100 (default: 50)
    """
    cache_key = f"archive:frames:match:{match_id}:page:{page}:limit:{limit}"
    
    # Try cache first
    cached = await cache_get(cache_key)
    if cached:
        return FrameQueryResponse(**cached)
    
    try:
        response = await service.query_frames(
            match_id=match_id,
            page=page,
            limit=limit,
        )
        
        # Cache for 5 minutes
        await cache_set(cache_key, response.model_dump(), ttl=300)
        
        return response
        
    except Exception as e:
        logger.error(
            "query_frames_error",
            match_id=str(match_id),
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error querying frames",
        )


@router.post(
    "/frames/{frame_id}/pin",
    status_code=status.HTTP_200_OK,
    summary="Pin a frame",
)
async def pin_frame(
    frame_id: UUID,
    request: Request,
    pin_request: PinRequest,
    service: ArchivalService = Depends(get_archival_service),
    user: TokenData = Depends(require_admin_auth),
):
    """Pin a frame to prevent garbage collection.
    
    Pinned frames are marked as verified and will not be deleted
    during garbage collection. Requires admin role.
    
    - **frame_id**: UUID of the frame to pin
    - **reason**: Required reason for pinning
    - **ttl_days**: Optional TTL (null = indefinite)
    """
    actor = _get_actor_from_user(user)
    
    success = await service.pin_frame(
        frame_id=frame_id,
        reason=pin_request.reason,
        actor=actor,
        ttl_days=pin_request.ttl_days,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Frame {frame_id} not found",
        )
    
    logger.info(
        "pin_frame_completed",
        frame_id=str(frame_id),
        actor=actor,
        reason=pin_request.reason
    )
    return {"success": True, "frame_id": str(frame_id), "pinned_by": actor}


@router.post(
    "/frames/{frame_id}/unpin",
    status_code=status.HTTP_200_OK,
    summary="Unpin a frame",
)
async def unpin_frame(
    frame_id: UUID,
    service: ArchivalService = Depends(get_archival_service),
    user: TokenData = Depends(require_admin_auth),
):
    """Unpin a frame, allowing it to be garbage collected.
    
    Requires admin role. Creates an audit log entry.
    
    - **frame_id**: UUID of the frame to unpin
    """
    actor = _get_actor_from_user(user)
    
    success = await service.unpin_frame(
        frame_id=frame_id,
        actor=actor,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Frame {frame_id} not found or not pinned",
        )
    
    logger.info(
        "unpin_frame_completed",
        frame_id=str(frame_id),
        actor=actor
    )
    return {"success": True, "frame_id": str(frame_id), "unpinned_by": actor}


@router.get(
    "/frames/{frame_id}/audit",
    response_model=List[ArchiveAuditLogResponse],
    summary="Get audit log for frame",
)
async def get_frame_audit_log(
    frame_id: UUID,
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    service: ArchivalService = Depends(get_archival_service),
    user: TokenData = Depends(require_admin_auth),
):
    """Get audit log entries for a specific frame.
    
    Returns immutable audit trail of all actions performed on the frame.
    Requires admin role.
    
    - **frame_id**: UUID of the frame
    - **limit**: Max entries to return (default: 50, max: 1000)
    - **offset**: Pagination offset
    """
    try:
        audit_entries = await service.get_audit_log(
            frame_id=frame_id,
            limit=limit,
            offset=offset,
        )
        return audit_entries
    except Exception as e:
        logger.error(
            "audit_log_fetch_error",
            frame_id=str(frame_id),
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching audit log",
        )


# -----------------------------------------------------------------------------
# AS-6: GC and Storage Migration Endpoints
# -----------------------------------------------------------------------------

async def _run_gc_task(
    service: ArchivalService,
    retention_days: int,
    dry_run: bool,
    batch_size: int,
    actor: str,
):
    """Background task for garbage collection."""
    metrics = get_metrics()
    start_time = time.time()
    
    try:
        result = await service.gc_unpinned_frames(
            retention_days=retention_days,
            dry_run=dry_run,
            batch_size=batch_size,
            actor=actor,
        )
        
        duration = time.time() - start_time
        metrics.observe_gc_duration(duration)
        metrics.increment_gc_runs(dry_run=dry_run)
        metrics.increment_frames_deleted(
            count=result.get("frames_deleted", 0),
            dry_run=dry_run,
        )
        
        logger.info(
            "gc_background_completed",
            frames_deleted=result.get('frames_deleted', 0),
            bytes_freed=result.get('bytes_freed', 0),
            duration_seconds=round(duration, 2),
            dry_run=dry_run
        )
        
    except Exception as e:
        logger.error(
            "gc_background_failed",
            error=str(e),
            error_type=type(e).__name__
        )


@router.post(
    "/gc",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Run garbage collection",
)
async def run_garbage_collection(
    gc_request: GCRequest,
    background_tasks: BackgroundTasks,
    service: ArchivalService = Depends(get_archival_service),
    user: TokenData = Depends(require_admin_auth),
):
    """Run garbage collection to delete old unpinned frames.
    
    Deletes unpinned frames older than retention_days. Runs as a
    background task. Creates audit log entries for deleted frames.
    
    - **retention_days**: Delete frames older than this (1-3650)
    - **dry_run**: If true, only count without deleting (default: true)
    - **batch_size**: Frames per batch (100-10000, default: 1000)
    
    Returns immediately with acceptance status. Check logs for results.
    """
    actor = _get_actor_from_user(user)
    
    # Start background task
    background_tasks.add_task(
        _run_gc_task,
        service=service,
        retention_days=gc_request.retention_days,
        dry_run=gc_request.dry_run,
        batch_size=gc_request.batch_size,
        actor=actor,
    )
    
    logger.info(
        "gc_task_scheduled",
        actor=actor,
        retention_days=gc_request.retention_days,
        dry_run=gc_request.dry_run,
        batch_size=gc_request.batch_size
    )
    
    return {
        "status": "accepted",
        "message": "Garbage collection started in background",
        "dry_run": gc_request.dry_run,
        "retention_days": gc_request.retention_days,
    }


# In-memory storage for migration jobs (placeholder)
_migration_jobs: dict = {}


@router.post(
    "/storage/migrate",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Migrate storage backends",
)
async def migrate_storage(
    migrate_request: StorageMigrateRequest,
    user: TokenData = Depends(require_admin_auth),
):
    """Migrate frames between storage backends.
    
    **PLACEHOLDER IMPLEMENTATION (Phase 1)**
    
    This endpoint accepts migration requests and returns a job ID,
    but actual migration requires secondary storage backend configuration.
    Full implementation planned for Phase 2.
    
    - **from_backend**: Source storage backend identifier
    - **to_backend**: Destination storage backend identifier
    - **dry_run**: If true, only count without migrating (default: true)
    - **batch_size**: Frames per batch (10-1000, default: 100)
    - **frame_limit**: Max frames to migrate (null = unlimited)
    
    Returns job ID for tracking progress.
    """
    job_id = str(uuid.uuid4())
    
    # Store job info (placeholder)
    _migration_jobs[job_id] = {
        "job_id": job_id,
        "status": "not_implemented",
        "from_backend": migrate_request.from_backend,
        "to_backend": migrate_request.to_backend,
        "dry_run": migrate_request.dry_run,
        "progress_percent": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "message": "Migration requires secondary storage backend configuration",
    }
    
    # Record metric
    metrics = get_metrics()
    metrics.increment_migrations()
    
    logger.info(
        "migration_job_created",
        job_id=job_id,
        from_backend=migrate_request.from_backend,
        to_backend=migrate_request.to_backend,
        dry_run=migrate_request.dry_run
    )
    
    return _migration_jobs[job_id]


@router.get(
    "/storage/migrate/{job_id}",
    summary="Get migration job status",
)
async def get_migration_status(
    job_id: str,
    user: TokenData = Depends(require_admin_auth),
):
    """Get the status of a storage migration job."""
    if job_id not in _migration_jobs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Migration job {job_id} not found",
        )
    
    return _migration_jobs[job_id]


@router.get(
    "/health",
    summary="Archival service health check",
)
async def archive_health(
    storage: LocalBackend = Depends(get_storage_backend),
    service: ArchivalService = Depends(get_archival_service),
):
    """Get archival service health status.
    
    Returns storage backend health, frame counts, and storage usage.
    """
    try:
        # Get storage health
        storage_health = await storage.health_check()
        
        # Get storage stats
        stats = await _get_storage_stats(storage)
        
        # Get service health
        service_health = await service.health_check()
        
        return {
            "status": (
                "healthy"
                if storage_health.get("healthy") and service_health.get("healthy")
                else "degraded"
            ),
            "storage_backend": storage.backend_name,
            "storage_path": str(storage.frames_path),
            "frame_count": stats["frame_count"],
            "storage_bytes": stats["storage_bytes"],
            "shard_count": stats.get("shard_count", 0),
            "storage_healthy": storage_health.get("healthy"),
            "database_healthy": service_health.get("database", {}).get("healthy"),
        }
        
    except Exception as e:
        logger.error(
            "health_check_failed",
            error=str(e),
            error_type=type(e).__name__
        )
        return {
            "status": "unhealthy",
            "error": str(e),
        }


@router.get(
    "/health/deep",
    summary="Deep health check with component status",
)
async def deep_health_check(
    service: ArchivalService = Depends(get_archival_service),
) -> dict:
    """Deep health check with detailed component status.
    
    Returns comprehensive health status for database, storage,
    and other archival system components.
    
    Response includes:
    - overall status (healthy/degraded)
    - per-component status with error details
    - timestamp of check
    """
    from datetime import datetime, timezone
    
    status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {}
    }
    
    # Check database
    try:
        await service.health_check_db()
        status["components"]["database"] = {"status": "up"}
    except Exception as e:
        status["components"]["database"] = {"status": "down", "error": str(e)}
        status["status"] = "degraded"
    
    # Check storage
    try:
        await service.health_check_storage()
        status["components"]["storage"] = {"status": "up"}
    except Exception as e:
        status["components"]["storage"] = {"status": "down", "error": str(e)}
        status["status"] = "degraded"
    
    return status


# -----------------------------------------------------------------------------
# AS-6: Prometheus Metrics Endpoint
# -----------------------------------------------------------------------------

@router.get(
    "/metrics/archive",
    response_class=PlainTextResponse,
    summary="Prometheus metrics for archive",
    include_in_schema=False,
)
async def archive_metrics():
    """Prometheus metrics endpoint for archival system.
    
    Returns metrics in Prometheus exposition format including:
    - archive_frames_total: Total frames in storage
    - archive_storage_bytes: Total bytes used
    - archive_uploads_total: Total upload operations
    - archive_gc_runs_total: Total GC runs
    """
    if not PROMETHEUS_AVAILABLE:
        return PlainTextResponse(
            content="# Prometheus client not installed\n",
            status_code=503,
        )
    
    # Update gauges with current stats before generating
    try:
        storage = get_storage_backend()
        stats = await _get_storage_stats(storage)
        
        metrics = get_metrics()
        metrics.set_frames_total(stats["frame_count"])
        metrics.set_storage_bytes(stats["storage_bytes"])
    except Exception as e:
        logger.warning(
            "metrics_gauge_update_failed",
            error=str(e)
        )
    
    return PlainTextResponse(
        content=generate_latest().decode("utf-8"),
        media_type=CONTENT_TYPE_LATEST,
    )
