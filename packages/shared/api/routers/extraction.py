"""
Module: routers.extraction
Purpose: FastAPI endpoints for Minimap Extraction Service
Tasks: MF-4, MF-7 - FastAPI Extraction Endpoints + Archival Integration
Date: 2026-03-28

[Ver002.000] - Phase 2: Real ArchivalService integration (MF-7)
[Ver001.000] - Initial extraction API endpoints (MF-4)
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

# Import extraction models and service
try:
    from src.njz_api.archival.services.archival_service import ArchivalService
    from src.sator.extraction.service import ExtractionService, ExtractionServiceError
    from src.sator.extraction_job import JobStatus
    _EXTRACTION_AVAILABLE = True
except ImportError:
    _EXTRACTION_AVAILABLE = False
    logging.warning("Extraction service not available")

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/extraction", tags=["extraction"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class CreateExtractionJobRequest(BaseModel):
    """Request to create a new extraction job."""
    match_id: UUID = Field(..., description="Match ID to extract frames for")
    vod_source: str = Field(default="local", description="Source type: local, s3, http")
    vod_path: str = Field(..., description="Path or URL to VOD file")


class ExtractionJobResponse(BaseModel):
    """Response after creating or getting an extraction job."""
    job_id: UUID
    match_id: UUID
    status: str = Field(..., description="Job state: pending, running, completed, failed")
    frame_count: Optional[int] = None
    manifest_id: Optional[UUID] = None
    error_message: Optional[str] = None
    vod_duration_ms: Optional[int] = None
    vod_resolution: Optional[str] = None
    progress_percent: int = Field(default=0, ge=0, le=100)
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class ExtractionJobListResponse(BaseModel):
    """Paginated list of extraction jobs."""
    jobs: list[ExtractionJobResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class ExtractionJobCreateResponse(BaseModel):
    """Response after starting extraction job."""
    job_id: UUID
    status: str
    message: str = "Extraction job queued for processing"


# ============================================================================
# Progress Tracking
# ============================================================================

# In-memory progress tracking (use Redis in production)
_job_progress: dict[UUID, int] = {}


def _update_progress(job_id: UUID, progress: int) -> None:
    """Update job progress in memory."""
    _job_progress[job_id] = progress
    logger.debug(f"Job {job_id} progress: {progress}%")


def _get_progress(job_id: UUID) -> int:
    """Get job progress from memory."""
    return _job_progress.get(job_id, 0)


# ============================================================================
# API Endpoints
# ============================================================================

@router.post(
    "/jobs",
    response_model=ExtractionJobCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start Extraction Job",
    description=(
        "Create and queue a new VOD extraction job. "
        "The job runs asynchronously in the background."
    ),
)
async def create_extraction_job(
    request: CreateExtractionJobRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> ExtractionJobCreateResponse:
    """
    Start a new extraction job for the specified match and VOD.
    
    The job will:
    1. Extract VOD metadata
    2. Extract minimap frames at 1 fps
    3. Classify frames by segment type
    4. Deduplicate frames
    5. Upload to archival storage
    
    Returns immediately with job ID. Use GET /jobs/{job_id} to check status.
    """
    if not _EXTRACTION_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Extraction service not available",
        )
    
    try:
        service = ExtractionService(db_session=db)
        
        # Create job
        job = await service.create_job(
            match_id=request.match_id,
            vod_path=request.vod_path,
            vod_source=request.vod_source,
        )
        
        # Get archival service for injection
        # Note: We need to pass it directly since background tasks run outside request scope
        from axiom_esports_data.api.src.db_manager import db as db_manager

        from src.njz_api.archival.storage.backend import LocalBackend
        
        # Create archival service with local backend
        storage_backend = LocalBackend()
        archival_service = ArchivalService(storage_backend, db_manager.pool)
        
        # Dispatch background task
        background_tasks.add_task(
            _process_job_background,
            job_id=job.job_id,
            db=db,
            archival_service=archival_service,
        )
        
        logger.info(f"Created extraction job {job.job_id} for match {request.match_id}")
        
        return ExtractionJobCreateResponse(
            job_id=job.job_id,
            status=job.status,
        )
        
    except ExtractionServiceError as e:
        logger.error(f"Failed to create extraction job: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": e.code, "message": e.message},
        )
    except Exception as e:
        logger.error(f"Unexpected error creating extraction job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


async def _process_job_background(
    job_id: UUID, 
    db: AsyncSession,
    archival_service: ArchivalService,
) -> None:
    """
    Background task to process extraction job.
    
    This runs independently of the HTTP request.
    """
    try:
        service = ExtractionService(
            db_session=db,
            archival_service=archival_service,
        )
        await service.process_job(
            job_id=job_id,
            progress_callback=_update_progress,
        )
    except Exception as e:
        logger.error(f"Background job processing failed for {job_id}: {e}")


@router.get(
    "/jobs/{job_id}",
    response_model=ExtractionJobResponse,
    summary="Get Job Status",
    description="Get the current status and progress of an extraction job.",
)
async def get_extraction_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ExtractionJobResponse:
    """
    Get extraction job status by ID.
    
    Returns job details including:
    - Current status (pending, running, completed, failed)
    - Frame count (if completed)
    - Progress percentage
    - Error message (if failed)
    """
    if not _EXTRACTION_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Extraction service not available",
        )
    
    try:
        service = ExtractionService(db_session=db)
        job = await service.get_job(job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Extraction job not found: {job_id}",
            )
        
        # Calculate progress
        progress = _get_progress(job_id)
        if job.status == JobStatus.COMPLETED.value:
            progress = 100
        elif job.status == JobStatus.PENDING.value:
            progress = 0
        
        return ExtractionJobResponse(
            job_id=job.job_id,
            match_id=job.match_id,
            status=job.status,
            frame_count=job.frame_count,
            manifest_id=job.manifest_id,
            error_message=job.error_message,
            vod_duration_ms=job.vod_duration_ms,
            vod_resolution=job.vod_resolution,
            progress_percent=progress,
            created_at=job.created_at.isoformat() if job.created_at else None,
            completed_at=job.completed_at.isoformat() if job.completed_at else None,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting extraction job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get(
    "/jobs",
    response_model=ExtractionJobListResponse,
    summary="List Extraction Jobs",
    description="List extraction jobs with optional filtering by match ID and status.",
)
async def list_extraction_jobs(
    match_id: Optional[UUID] = Query(None, description="Filter by match ID"),
    status: Optional[str] = Query(None, description="Filter by job status"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    page: int = Query(1, ge=1, description="Page number"),
    db: AsyncSession = Depends(get_db),
) -> ExtractionJobListResponse:
    """
    List extraction jobs with pagination and filtering.
    
    Query Parameters:
    - match_id: Filter to jobs for a specific match
    - status: Filter by status (pending, running, completed, failed)
    - limit: Results per page (default: 20, max: 100)
    - page: Page number (default: 1)
    """
    if not _EXTRACTION_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Extraction service not available",
        )
    
    try:
        service = ExtractionService(db_session=db)
        offset = (page - 1) * limit
        
        jobs, total = await service.list_jobs(
            match_id=match_id,
            status=status,
            limit=limit,
            offset=offset,
        )
        
        # Convert to response models
        job_responses = []
        for job in jobs:
            progress = _get_progress(job.job_id)
            if job.status == JobStatus.COMPLETED.value:
                progress = 100
            elif job.status == JobStatus.PENDING.value:
                progress = 0
            
            job_responses.append(ExtractionJobResponse(
                job_id=job.job_id,
                match_id=job.match_id,
                status=job.status,
                frame_count=job.frame_count,
                manifest_id=job.manifest_id,
                error_message=job.error_message,
                vod_duration_ms=job.vod_duration_ms,
                vod_resolution=job.vod_resolution,
                progress_percent=progress,
                created_at=job.created_at.isoformat() if job.created_at else None,
                completed_at=job.completed_at.isoformat() if job.completed_at else None,
            ))
        
        return ExtractionJobListResponse(
            jobs=job_responses,
            total=total,
            page=page,
            page_size=limit,
            has_more=offset + len(jobs) < total,
        )
        
    except Exception as e:
        logger.error(f"Error listing extraction jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.delete(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel Extraction Job",
    description="Cancel a pending or running extraction job.",
)
async def cancel_extraction_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Cancel an extraction job.
    
    Only jobs with status 'pending' or 'running' can be cancelled.
    Completed or failed jobs cannot be cancelled.
    """
    if not _EXTRACTION_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Extraction service not available",
        )
    
    try:
        service = ExtractionService(db_session=db)
        cancelled = await service.cancel_job(job_id)
        
        if not cancelled:
            # Check if job exists
            job = await service.get_job(job_id)
            if not job:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Extraction job not found: {job_id}",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Job cannot be cancelled (status: {job.status})",
                )
        
        logger.info(f"Cancelled extraction job {job_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling extraction job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get(
    "/health",
    summary="Extraction Service Health",
    description="Check if the extraction service is healthy and FFmpeg is available.",
)
async def extraction_health() -> dict:
    """
    Health check for extraction service.
    
    Returns:
    - healthy: True if service is operational
    - ffmpeg_available: True if FFmpeg is installed
    - extraction_available: True if extraction modules are importable
    """
    try:
        from src.sator.extraction.pipeline import check_ffmpeg
        ffmpeg_available = check_ffmpeg()
    except Exception:
        ffmpeg_available = False
    
    return {
        "healthy": _EXTRACTION_AVAILABLE and ffmpeg_available,
        "ffmpeg_available": ffmpeg_available,
        "extraction_available": _EXTRACTION_AVAILABLE,
        "service": "minimap-extraction",
    }
