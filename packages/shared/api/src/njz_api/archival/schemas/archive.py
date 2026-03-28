"""
Module: njz_api.archival.schemas.archive
Purpose: Pydantic schemas for Archival System API
Task: AS-2 - Pydantic Schemas
Date: 2026-03-28

[Ver001.000] - Initial schema definitions
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class FrameMetadata(BaseModel):
    """Metadata for an individual frame upload."""

    frame_index: int = Field(..., ge=0, description="Frame sequence number (0-based)")
    segment_type: str = Field(
        ...,
        description="Tactical context: IN_ROUND|BUY_PHASE|HALFTIME|BETWEEN_ROUND|UNKNOWN",
    )
    timestamp_ms: int = Field(..., ge=0, description="VOD timestamp in milliseconds")
    content_hash: str = Field(
        ...,
        min_length=64,
        max_length=64,
        description="SHA-256 hash of JPEG bytes (hex encoded)",
    )
    accuracy_tier: str = Field(
        default="STANDARD",
        description="Confidence classification: STANDARD|HIGH|VERIFIED",
    )
    jpeg_data: Optional[bytes] = Field(
        default=None,
        description="JPEG binary data (base64 encoded in JSON)",
    )
    jpeg_size_bytes: Optional[int] = Field(
        default=None,
        ge=0,
        description="Size of JPEG in bytes",
    )

    @field_validator("segment_type")
    @classmethod
    def validate_segment_type(cls, v: str) -> str:
        """Validate segment type is one of allowed values."""
        allowed = {"IN_ROUND", "BUY_PHASE", "HALFTIME", "BETWEEN_ROUND", "UNKNOWN"}
        if v not in allowed:
            raise ValueError(f"segment_type must be one of: {allowed}")
        return v

    @field_validator("accuracy_tier")
    @classmethod
    def validate_accuracy_tier(cls, v: str) -> str:
        """Validate accuracy tier is one of allowed values."""
        allowed = {"STANDARD", "HIGH", "VERIFIED"}
        if v not in allowed:
            raise ValueError(f"accuracy_tier must be one of: {allowed}")
        return v

    @field_validator("content_hash")
    @classmethod
    def validate_content_hash(cls, v: str) -> str:
        """Validate content hash is valid SHA-256 hex string."""
        if len(v) != 64:
            raise ValueError("content_hash must be 64 characters (SHA-256 hex)")
        try:
            int(v, 16)
        except ValueError:
            raise ValueError("content_hash must be valid hexadecimal")
        return v.lower()


class FrameUploadRequest(BaseModel):
    """Request schema for batch frame uploads.

    Used when uploading extracted minimap frames to the archival system.
    Frames are deduplicated by content_hash before storage.
    """

    frames: List[FrameMetadata] = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Batch of frames to upload (max 1000 per request)",
    )
    extraction_job_id: UUID = Field(
        ...,
        description="Reference to the extraction job that produced these frames",
    )
    match_id: UUID = Field(
        ...,
        description="Associated match ID",
    )
    manifest_id: Optional[UUID] = Field(
        default=None,
        description="Existing manifest ID (if continuing upload)",
    )

    @field_validator("frames")
    @classmethod
    def validate_frames_not_empty(cls, v: List[FrameMetadata]) -> List[FrameMetadata]:
        """Ensure frames list is not empty."""
        if not v:
            raise ValueError("At least one frame must be provided")
        return v


class FrameUploadResponse(BaseModel):
    """Response schema for frame upload operations.

    Returns the IDs of successfully stored frames and any duplicates skipped.
    """

    success: bool = Field(..., description="Whether the upload succeeded")
    frame_ids: List[UUID] = Field(
        default_factory=list,
        description="IDs of successfully stored frames",
    )
    manifest_id: UUID = Field(
        ...,
        description="Manifest ID for this batch",
    )
    duplicates_skipped: int = Field(
        default=0,
        ge=0,
        description="Number of frames skipped due to duplicate hash",
    )
    bytes_stored: int = Field(
        default=0,
        ge=0,
        description="Total bytes stored",
    )
    processing_time_ms: float = Field(
        default=0.0,
        ge=0,
        description="Server processing time in milliseconds",
    )


class FrameInfo(BaseModel):
    """Information about a stored frame."""

    frame_id: UUID = Field(..., description="Unique frame identifier")
    content_hash: str = Field(..., description="SHA-256 hash of frame")
    segment_type: str = Field(..., description="Tactical segment classification")
    timestamp_ms: int = Field(..., description="VOD timestamp in milliseconds")
    is_pinned: bool = Field(default=False, description="Whether frame is pinned")
    pinned_at: Optional[datetime] = Field(default=None, description="When frame was pinned")
    pinned_by: Optional[str] = Field(default=None, description="Who pinned the frame")
    storage_url: Optional[str] = Field(default=None, description="Storage backend URL")
    jpeg_size_bytes: Optional[int] = Field(default=None, description="JPEG file size")
    created_at: datetime = Field(..., description="When frame was stored")


class FrameQueryResponse(BaseModel):
    """Response schema for frame query operations.

    Paginated list of frames matching query criteria.
    """

    frames: List[FrameInfo] = Field(default_factory=list, description="Matching frames")
    total_count: int = Field(..., ge=0, description="Total matching frames")
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, le=100, description="Frames per page")
    has_more: bool = Field(..., description="Whether more pages exist")


class PinRequest(BaseModel):
    """Request schema for pinning a frame.

    Pinning marks a frame as verified and prevents garbage collection.
    """

    reason: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Reason for pinning the frame",
    )
    ttl_days: Optional[int] = Field(
        default=None,
        ge=1,
        le=3650,
        description="Optional TTL in days (null = indefinite)",
    )

    @field_validator("reason")
    @classmethod
    def validate_reason_not_empty(cls, v: str) -> str:
        """Ensure reason is not just whitespace."""
        if not v.strip():
            raise ValueError("reason cannot be empty or whitespace")
        return v.strip()


class GCRequest(BaseModel):
    """Request schema for garbage collection operations.

    GC removes unpinned frames older than retention_days.
    """

    retention_days: int = Field(
        ...,
        ge=1,
        le=3650,
        description="Delete unpinned frames older than this many days",
    )
    dry_run: bool = Field(
        default=True,
        description="If true, only count what would be deleted without removing",
    )
    batch_size: int = Field(
        default=1000,
        ge=100,
        le=10000,
        description="Frames to process per batch",
    )


class StorageMigrateRequest(BaseModel):
    """Request schema for storage backend migration.

    Migrates frames from one storage backend to another.
    """

    from_backend: str = Field(
        ...,
        min_length=1,
        description="Source storage backend identifier",
    )
    to_backend: str = Field(
        ...,
        min_length=1,
        description="Destination storage backend identifier",
    )
    dry_run: bool = Field(
        default=True,
        description="If true, only count what would be migrated",
    )
    batch_size: int = Field(
        default=100,
        ge=10,
        le=1000,
        description="Frames to migrate per batch",
    )
    frame_limit: Optional[int] = Field(
        default=None,
        ge=1,
        description="Maximum frames to migrate (null = unlimited)",
    )

    @field_validator("to_backend")
    @classmethod
    def validate_backends_differ(cls, v: str, info) -> str:
        """Ensure source and destination backends are different."""
        from_backend = info.data.get("from_backend")
        if from_backend and v == from_backend:
            raise ValueError("from_backend and to_backend must be different")
        return v


class ErrorDetail(BaseModel):
    """Detailed error information."""

    field: Optional[str] = Field(default=None, description="Field that caused error")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(default=None, description="Error code")


class ErrorResponse(BaseModel):
    """Standard error response schema.

    All API errors return this structure for consistent client handling.
    """

    error: str = Field(..., description="Error type/category")
    message: str = Field(..., description="Human-readable error description")
    code: str = Field(..., description="Machine-readable error code")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    trace_id: Optional[str] = Field(default=None, description="Request trace ID for debugging")
    details: Optional[List[ErrorDetail]] = Field(
        default=None, description="Additional error details"
    )

    @field_validator("code")
    @classmethod
    def validate_code_format(cls, v: str) -> str:
        """Ensure error code is uppercase with underscores."""
        return v.upper().replace("-", "_")


class AuditMetadata(BaseModel):
    """Metadata included in audit log entries."""

    ip_address: Optional[str] = Field(default=None, description="Client IP address")
    user_agent: Optional[str] = Field(default=None, description="Client user agent")
    request_id: Optional[str] = Field(default=None, description="Request correlation ID")
    extra: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class ArchiveAuditLogResponse(BaseModel):
    """Response schema for audit log entries.

    Immutable record of actions performed on frames.
    """

    log_id: UUID = Field(..., description="Unique audit entry ID")
    frame_id: UUID = Field(..., description="Affected frame ID")
    action: str = Field(
        ...,
        description="Action type: UPLOAD|DEDUP_SKIP|PIN|UNPIN|DELETE|MIGRATE|ACCESS|GC_SCAN",
    )
    actor: str = Field(..., description="User or service that performed action")
    metadata: AuditMetadata = Field(default_factory=AuditMetadata, description="Additional context")
    created_at: datetime = Field(..., description="When action occurred")

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        """Validate action type is one of allowed values."""
        allowed = {"UPLOAD", "DEDUP_SKIP", "PIN", "UNPIN", "DELETE", "MIGRATE", "ACCESS", "GC_SCAN"}
        if v not in allowed:
            raise ValueError(f"action must be one of: {allowed}")
        return v
