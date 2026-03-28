"""
Module: sator.extraction.service
Purpose: Extraction job lifecycle management service
Tasks: MF-4, MF-7 - FastAPI Extraction Service + Archival Integration
Date: 2026-03-28

[Ver002.000] - Phase 2: Real ArchivalService integration (MF-7)
[Ver001.000] - Initial extraction service implementation (MF-4)
"""

import logging
import os
from pathlib import Path
from typing import Callable, Optional
from uuid import UUID, uuid4

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

# Import extraction job models
from ..extraction_job import (
    ArchiveFrame,
    ArchiveManifest,
    ExtractionJob,
    JobStatus,
)
from .models import FrameExtract
from .pipeline import ExtractionPipeline, check_ffmpeg
from .segment_classifier import SegmentClassifier

# Import ArchivalService components for Phase 2 integration
try:
    from ...njz_api.archival.schemas.archive import FrameMetadata
    from ...njz_api.archival.services.archival_service import ArchivalService
    _ARCHIVAL_AVAILABLE = True
except ImportError:
    _ARCHIVAL_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("ArchivalService not available, using mock implementation")

    # Mock FrameMetadata for Phase 1 fallback
    class FrameMetadata:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)


logger = logging.getLogger(__name__)


class ExtractionServiceError(Exception):
    """Exception raised during extraction service operations."""
    
    def __init__(self, message: str, code: str = "EXTRACTION_SERVICE_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ExtractionService:
    """
    Manages extraction job lifecycle from creation to completion.
    
    This service handles:
    1. Job creation and queuing
    2. Async background processing
    3. Frame extraction pipeline execution
    4. Segment classification
    5. Frame deduplication
    6. Archival storage upload
    7. Progress tracking and status updates
    
    Attributes:
        db_session: SQLAlchemy async session for database operations
        output_base_dir: Base directory for temporary frame storage
        archival_service: Optional ArchivalService for frame storage
    """
    
    def __init__(
        self,
        db_session: AsyncSession,
        output_base_dir: str = "/tmp/extraction_output",
        archival_service: Optional[ArchivalService] = None,
    ):
        self.db_session = db_session
        self.output_base_dir = output_base_dir
        self.archival_service = archival_service
        
        # Ensure output directory exists
        Path(self.output_base_dir).mkdir(parents=True, exist_ok=True)
        
        # Check FFmpeg availability
        self._ffmpeg_available = check_ffmpeg()
        if not self._ffmpeg_available:
            logger.warning("FFmpeg not found in PATH - extraction will fail")
    
    async def create_job(
        self,
        match_id: UUID,
        vod_path: str,
        vod_source: str = "local",
    ) -> ExtractionJob:
        """
        Create and queue a new extraction job.
        
        Args:
            match_id: Match ID to extract frames for
            vod_path: Path to VOD file
            vod_source: Source type (local, s3, http)
            
        Returns:
            Created ExtractionJob instance
            
        Raises:
            ExtractionServiceError: If job creation fails
        """
        try:
            # Verify VOD exists for local files
            if vod_source == "local" and not os.path.exists(vod_path):
                raise ExtractionServiceError(
                    f"VOD file not found: {vod_path}",
                    "VOD_NOT_FOUND"
                )
            
            # Create job record
            job = ExtractionJob(
                match_id=match_id,
                vod_source=vod_source,
                vod_path=vod_path,
                status=JobStatus.PENDING.value,
            )
            
            self.db_session.add(job)
            await self.db_session.commit()
            await self.db_session.refresh(job)
            
            logger.info(f"Created extraction job {job.job_id} for match {match_id}")
            return job
            
        except Exception as e:
            await self.db_session.rollback()
            raise ExtractionServiceError(f"Failed to create job: {e}", "CREATE_ERROR")
    
    async def process_job(
        self,
        job_id: UUID,
        progress_callback: Optional[Callable[[UUID, int], None]] = None,
    ) -> ExtractionJob:
        """
        Background task: Run extraction pipeline for a job.
        
        This method performs the full extraction workflow:
        1. Update job status to RUNNING
        2. Extract VOD metadata
        3. Extract frames using pipeline
        4. Classify segments
        5. Deduplicate frames
        6. Upload to Archival API
        7. Create ArchiveManifest
        8. Update job status to COMPLETED or FAILED
        
        Args:
            job_id: Extraction job ID to process
            progress_callback: Optional callback(job_id, progress_percent) for updates
            
        Returns:
            Updated ExtractionJob instance
        """
        # Fetch job
        result = await self.db_session.execute(
            select(ExtractionJob).where(ExtractionJob.job_id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            raise ExtractionServiceError(f"Job not found: {job_id}", "JOB_NOT_FOUND")
        
        output_dir = os.path.join(self.output_base_dir, str(job_id))
        
        try:
            # 1. Update status to RUNNING
            job.status = JobStatus.RUNNING.value
            await self.db_session.commit()
            
            if progress_callback:
                progress_callback(job_id, 5)
            
            # 2. Extract metadata
            pipeline = ExtractionPipeline(
                vod_path=job.vod_path,
                output_dir=output_dir,
                job_id=job_id,
            )
            
            metadata = await pipeline.extract_metadata()
            job.vod_duration_ms = metadata.duration_ms
            job.vod_resolution = f"{metadata.width}x{metadata.height}"
            await self.db_session.commit()
            
            if progress_callback:
                progress_callback(job_id, 10)
            
            # 3. Initialize classifier
            classifier = SegmentClassifier(
                vod_duration_ms=metadata.duration_ms,
                rounds_per_half=12,  # Standard Valorant
            )
            
            # 4. Extract frames
            frames = await pipeline.extract_frames(
                fps=1,  # 1 frame per second
                progress_callback=lambda curr, total: (
                    progress_callback(job_id, 10 + int(50 * curr / max(total, 1)))
                    if progress_callback else None
                ),
            )
            
            if progress_callback:
                progress_callback(job_id, 60)
            
            # 5. Classify and deduplicate frames
            unique_frames = await self._classify_and_deduplicate(
                frames, classifier, metadata.duration_ms
            )
            
            job.frame_count = len(unique_frames)
            await self.db_session.commit()
            
            if progress_callback:
                progress_callback(job_id, 75)
            
            # 6. Upload to Archival API (if available)
            manifest_id = await self._upload_to_archival(
                job_id=job_id,
                match_id=job.match_id,
                frames=unique_frames,
            )
            
            job.manifest_id = manifest_id
            
            if progress_callback:
                progress_callback(job_id, 95)
            
            # 7. Create ArchiveManifest record
            await self._create_manifest_record(
                job_id=job_id,
                total_frames=len(frames),
                unique_frames=len(unique_frames),
                manifest_id=manifest_id,
            )
            
            # 8. Update status to COMPLETED
            job.status = JobStatus.COMPLETED.value
            await self.db_session.commit()
            
            if progress_callback:
                progress_callback(job_id, 100)
            
            logger.info(f"Job {job_id} completed: {len(unique_frames)} frames extracted")
            
            # Cleanup temporary files
            await pipeline.cleanup()
            
            return job
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            job.status = JobStatus.FAILED.value
            job.error_message = str(e)
            await self.db_session.commit()
            
            # Cleanup on failure
            if os.path.exists(output_dir):
                import shutil
                shutil.rmtree(output_dir)
            
            raise ExtractionServiceError(f"Job processing failed: {e}", "PROCESSING_ERROR")
    
    async def _classify_and_deduplicate(
        self,
        frames: list[FrameExtract],
        classifier: SegmentClassifier,
        vod_duration_ms: int,
    ) -> list[dict]:
        """
        Classify segments and deduplicate frames.
        
        Args:
            frames: List of extracted frames
            classifier: SegmentClassifier instance
            vod_duration_ms: VOD duration in milliseconds
            
        Returns:
            List of unique frame dicts with classification
        """
        seen_hashes = set()
        unique_frames = []
        
        for frame in frames:
            # Skip duplicates
            if frame.image_hash in seen_hashes:
                continue
            seen_hashes.add(frame.image_hash)
            
            # Classify segment
            segment_type = classifier.classify_frame_sync(
                frame_path=frame.file_path,
                timestamp_ms=frame.timestamp_ms,
            )
            
            # Read JPEG data
            with open(frame.file_path, "rb") as f:
                jpeg_data = f.read()
            
            unique_frames.append({
                "frame": frame,
                "segment_type": segment_type,
                "jpeg_data": jpeg_data,
                "jpeg_size": len(jpeg_data),
            })
        
        return unique_frames
    
    async def _upload_to_archival(
        self,
        job_id: UUID,
        match_id: UUID,
        frames: list[dict],
    ) -> Optional[UUID]:
        """
        Upload frames to Archival API.
        
        Args:
            job_id: Extraction job ID
            match_id: Match ID
            frames: List of frame dicts with classification
            
        Returns:
            Manifest ID from Archival API, or None if archival not available
        """
        if not self.archival_service or not frames:
            # Create mock manifest ID for Phase 1 fallback
            manifest_id = uuid4()
            
            # Store frames locally for Phase 1
            for frame_data in frames:
                frame = frame_data["frame"]
                archive_frame = ArchiveFrame(
                    manifest_id=manifest_id,
                    content_hash=frame.image_hash,
                    frame_index=frame.frame_index,
                    segment_type=frame_data["segment_type"].value,
                    timestamp_ms=frame.timestamp_ms,
                    accuracy_tier="STANDARD",
                    storage_url=f"file://{frame.file_path}",
                    jpeg_size_bytes=frame_data["jpeg_size"],
                )
                self.db_session.add(archive_frame)
            
            await self.db_session.commit()
            logger.info(
                f"Phase 1 fallback: Stored {len(frames)} frames locally "
                f"with manifest {manifest_id}"
            )
            return manifest_id
        
        # Phase 2: Convert to FrameMetadata for real ArchivalService
        frame_metadata_list = []
        for frame_data in frames:
            frame = frame_data["frame"]
            frame_metadata_list.append(FrameMetadata(
                frame_index=frame.frame_index,
                segment_type=frame_data["segment_type"].value,
                timestamp_ms=frame.timestamp_ms,
                content_hash=frame.image_hash,
                accuracy_tier="STANDARD",
                jpeg_data=frame_data["jpeg_data"],
                jpeg_size_bytes=frame_data["jpeg_size"],
            ))
        
        try:
            # Upload via real ArchivalService
            response = await self.archival_service.upload_frames(
                frames=frame_metadata_list,
                extraction_job_id=job_id,
                match_id=match_id,
                actor="extraction_service",
            )
            
            # Handle FrameUploadResponse (Pydantic model)
            if hasattr(response, 'manifest_id'):
                manifest_id = response.manifest_id
            else:
                manifest_id = response.get("manifest_id")

            if hasattr(response, 'frame_ids'):
                stored_count = len(response.frame_ids)
            else:
                stored_count = len(response.get("frame_ids", []))

            if hasattr(response, 'duplicates_skipped'):
                duplicates = response.duplicates_skipped
            else:
                duplicates = response.get("duplicates_skipped", 0)
            
            logger.info(
                f"Phase 2 Archival: Uploaded {stored_count} frames to archival, "
                f"manifest_id={manifest_id}, duplicates_skipped={duplicates}"
            )
            
            return manifest_id
            
        except Exception as e:
            logger.error(f"Archival upload failed: {e}. Falling back to local storage.")
            # Fallback to local storage on archival failure
            manifest_id = uuid4()
            
            for frame_data in frames:
                frame = frame_data["frame"]
                archive_frame = ArchiveFrame(
                    manifest_id=manifest_id,
                    content_hash=frame.image_hash,
                    frame_index=frame.frame_index,
                    segment_type=frame_data["segment_type"].value,
                    timestamp_ms=frame.timestamp_ms,
                    accuracy_tier="STANDARD",
                    storage_url=f"file://{frame.file_path}",
                    jpeg_size_bytes=frame_data["jpeg_size"],
                )
                self.db_session.add(archive_frame)
            
            await self.db_session.commit()
            return manifest_id
    
    async def _create_manifest_record(
        self,
        job_id: UUID,
        total_frames: int,
        unique_frames: int,
        manifest_id: UUID,
    ) -> None:
        """
        Create ArchiveManifest database record.
        
        Args:
            job_id: Extraction job ID
            total_frames: Total frames extracted
            unique_frames: Unique frames after deduplication
            manifest_id: Manifest ID from Archival API
        """
        # Calculate storage size from archive_frames
        result = await self.db_session.execute(
            select(ArchiveFrame).where(ArchiveFrame.manifest_id == manifest_id)
        )
        frames = result.scalars().all()
        
        total_bytes = sum(f.jpeg_size_bytes or 0 for f in frames)
        dedup_ratio = unique_frames / total_frames if total_frames > 0 else 1.0
        
        manifest = ArchiveManifest(
            manifest_id=manifest_id,
            extraction_job_id=job_id,
            total_frames=total_frames,
            unique_frames=unique_frames,
            storage_size_bytes=total_bytes,
            dedup_ratio=dedup_ratio,
        )
        
        self.db_session.add(manifest)
        await self.db_session.commit()
    
    async def get_job(self, job_id: UUID) -> Optional[ExtractionJob]:
        """
        Get extraction job by ID.
        
        Args:
            job_id: Job UUID
            
        Returns:
            ExtractionJob if found, None otherwise
        """
        result = await self.db_session.execute(
            select(ExtractionJob).where(ExtractionJob.job_id == job_id)
        )
        return result.scalar_one_or_none()
    
    async def list_jobs(
        self,
        match_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[ExtractionJob], int]:
        """
        List extraction jobs with optional filters.
        
        Args:
            match_id: Filter by match ID
            status: Filter by job status
            limit: Maximum results to return
            offset: Pagination offset
            
        Returns:
            Tuple of (jobs list, total count)
        """
        # Build query
        query = select(ExtractionJob)
        count_query = select(func.count()).select_from(ExtractionJob)
        
        if match_id:
            query = query.where(ExtractionJob.match_id == match_id)
            count_query = count_query.where(ExtractionJob.match_id == match_id)
        
        if status:
            query = query.where(ExtractionJob.status == status)
            count_query = count_query.where(ExtractionJob.status == status)
        
        # Execute count
        count_result = await self.db_session.execute(count_query)
        total = count_result.scalar()
        
        # Execute paginated query
        query = query.order_by(desc(ExtractionJob.created_at)).offset(offset).limit(limit)
        result = await self.db_session.execute(query)
        jobs = result.scalars().all()
        
        return list(jobs), total
    
    async def get_job_progress(self, job_id: UUID) -> dict:
        """
        Get job progress information.
        
        Args:
            job_id: Job UUID
            
        Returns:
            Dictionary with progress info
        """
        job = await self.get_job(job_id)
        if not job:
            return {"error": "Job not found"}
        
        # Calculate progress based on status
        progress_map = {
            JobStatus.PENDING.value: 0,
            JobStatus.RUNNING.value: 50,  # Approximate
            JobStatus.COMPLETED.value: 100,
            JobStatus.FAILED.value: 0,
        }
        
        return {
            "job_id": str(job_id),
            "status": job.status,
            "progress_percent": progress_map.get(job.status, 0),
            "frame_count": job.frame_count,
            "manifest_id": str(job.manifest_id) if job.manifest_id else None,
            "error_message": job.error_message,
        }
    
    async def cancel_job(self, job_id: UUID) -> bool:
        """
        Cancel a pending or running job.
        
        Note: This sets the status to FAILED with a cancellation message.
        Actual cancellation of running tasks requires additional task management.
        
        Args:
            job_id: Job UUID
            
        Returns:
            True if job was cancelled, False if not found or already complete
        """
        job = await self.get_job(job_id)
        if not job or job.is_complete():
            return False
        
        job.status = JobStatus.FAILED.value
        job.error_message = "Job cancelled by user"
        await self.db_session.commit()
        
        return True
