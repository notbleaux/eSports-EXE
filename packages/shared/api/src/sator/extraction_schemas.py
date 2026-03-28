"""
Module: sator.extraction_schemas
Purpose: Pydantic models for extraction API contracts
Task: [Gate 9.9] - Extraction schemas
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ExtractionJobRequest(BaseModel):
    """Request to start a new extraction job."""
    match_id: UUID = Field(..., description="Match ID to extract frames for")
    vod_source: str = Field(..., description="Source type: local, s3, http")
    vod_path: str = Field(..., description="Path or URL to VOD file")


class ExtractionJobResponse(BaseModel):
    """Response after starting extraction job."""
    job_id: UUID
    status: str = Field(..., description="Job state: pending, running, completed, failed")


class ExtractionJobStatus(BaseModel):
    """Full status of an extraction job."""
    job_id: UUID
    match_id: UUID
    status: str
    frame_count: Optional[int] = None
    manifest_id: Optional[UUID] = None
    error_message: Optional[str] = None
    vod_duration_ms: Optional[int] = None
    vod_resolution: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class FrameData(BaseModel):
    """Individual frame data for upload."""
    frame_index: int
    segment_type: str = Field(..., description="IN_ROUND|BUY_PHASE|HALFTIME|BETWEEN_ROUND|UNKNOWN")
    timestamp_ms: int
    content_hash: str = Field(..., description="SHA-256 hash of JPEG")
    accuracy_tier: str = Field(default="STANDARD", description="STANDARD|HIGH|VERIFIED")


class FrameUploadPayload(BaseModel):
    """Payload for uploading frames to Archival API."""
    frames: List[FrameData]
    extraction_job_id: UUID
    match_id: UUID


class ArchiveFrameResponse(BaseModel):
    """Frame response from Archival API."""
    frame_id: UUID
    content_hash: str
    storage_url: Optional[str] = None
    segment_type: str
    timestamp_ms: int
    is_pinned: bool = False
    created_at: datetime


class FrameQueryResponse(BaseModel):
    """Response from Archival query endpoint."""
    frames: List[ArchiveFrameResponse]
    total_count: int
    page: int
    page_size: int
    has_more: bool
