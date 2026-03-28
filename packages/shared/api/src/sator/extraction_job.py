"""
Module: sator.extraction_job
Purpose: SQLAlchemy models for minimap extraction job tracking
Task: [Gate 9.9] - Extraction jobs table + model
Date: 2026-03-28

References:
- spec-minimap-feature.md § 4 (Data Model Integration)
- AGENTS.md § patterns for async services
"""

from enum import Enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


class VODSourceType(str, Enum):
    """Video source types."""
    LOCAL = "local"
    S3 = "s3"
    HTTP = "http"


class JobStatus(str, Enum):
    """Extraction job status states."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SegmentType(str, Enum):
    """Tactical frame segment classification."""
    IN_ROUND = "IN_ROUND"
    BUY_PHASE = "BUY_PHASE"
    HALFTIME = "HALFTIME"
    BETWEEN_ROUND = "BETWEEN_ROUND"
    UNKNOWN = "UNKNOWN"


class AccuracyTier(str, Enum):
    """Frame accuracy classification."""
    STANDARD = "STANDARD"
    HIGH = "HIGH"
    VERIFIED = "VERIFIED"


class ExtractionJob(Base):
    """
    Tracks minimap extraction job lifecycle.

    A job represents a complete extraction pipeline run:
    1. FFmpeg metadata parsing
    2. Minimap region detection
    3. Frame extraction at 1 fps
    4. Segment classification
    5. Deduplication
    6. Batch upload to Archival API

    Attributes:
        job_id: Unique job identifier (UUID)
        match_id: Associated match (FK → matches.id)
        vod_source: Source type (local, s3, http)
        vod_path: Path to VOD file
        status: Job state machine (pending → running → completed/failed)
        frame_count: Total unique frames extracted
        manifest_id: Reference to Archival System manifest
        error_message: Failure reason if status = failed
        vod_duration_ms: VOD duration in milliseconds
        vod_resolution: Video resolution (e.g., "1920x1080")
        created_at: Job creation timestamp
        completed_at: Completion timestamp (null if still running)

    Relationships:
        archive_manifest: Related ArchiveManifest record
    """
    __tablename__ = "extraction_jobs"

    job_id = Column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    match_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
    )
    vod_source = Column(String(50), nullable=False)
    vod_path = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default=JobStatus.PENDING.value)
    frame_count = Column(Integer, nullable=True)
    manifest_id = Column(PG_UUID(as_uuid=True), nullable=True)
    error_message = Column(Text, nullable=True)
    vod_duration_ms = Column(Integer, nullable=True)
    vod_resolution = Column(String(50), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.current_timestamp(),
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            f"status IN ('{JobStatus.PENDING.value}', '{JobStatus.RUNNING.value}', "
            f"'{JobStatus.COMPLETED.value}', '{JobStatus.FAILED.value}')",
            name="ck_extraction_jobs_status",
        ),
        CheckConstraint(
            f"vod_source IN ('{VODSourceType.LOCAL.value}', '{VODSourceType.S3.value}', "
            f"'{VODSourceType.HTTP.value}')",
            name="ck_extraction_jobs_vod_source",
        ),
        Index("idx_extraction_jobs_match_id", "match_id"),
        Index("idx_extraction_jobs_status", "status"),
        Index("idx_extraction_jobs_created_at", "created_at", postgresql_using="desc"),
    )

    def __repr__(self) -> str:
        return (
            f"<ExtractionJob(job_id={self.job_id}, match_id={self.match_id}, "
            f"status={self.status})>"
        )

    def is_complete(self) -> bool:
        """Check if job is in a terminal state."""
        return self.status in (JobStatus.COMPLETED.value, JobStatus.FAILED.value)

    def is_failed(self) -> bool:
        """Check if job failed."""
        return self.status == JobStatus.FAILED.value


class ArchiveManifest(Base):
    """
    Deduplication manifest from Archival System.

    Records the results of frame deduplication after extraction.
    Acts as a join table between ExtractionJob and individual ArchiveFrame records.

    Attributes:
        manifest_id: Unique manifest identifier
        extraction_job_id: Reference to ExtractionJob
        total_frames: Total frames extracted at 1 fps
        unique_frames: Unique frames after deduplication
        storage_size_bytes: Total bytes stored in Archival
        dedup_ratio: Unique frames / total frames (0.0-1.0)
        created_at: Manifest creation timestamp
        archived_at: Timestamp when frames archived to persistent storage

    Relationships:
        extraction_job: Related ExtractionJob
        frames: Related ArchiveFrame records
    """
    __tablename__ = "archive_manifests"

    manifest_id = Column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    extraction_job_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("extraction_jobs.job_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    total_frames = Column(Integer, nullable=False)
    unique_frames = Column(Integer, nullable=False)
    storage_size_bytes = Column(BigInteger, nullable=False)
    dedup_ratio = Column(Float, nullable=False, default=1.0)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.current_timestamp(),
    )
    archived_at = Column(DateTime(timezone=True), nullable=True)

    frames = relationship(
        "ArchiveFrame", back_populates="manifest", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_archive_manifests_extraction_job_id", "extraction_job_id"),
        Index(
            "idx_archive_manifests_created_at",
            "created_at",
            postgresql_using="desc",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<ArchiveManifest(manifest_id={self.manifest_id}, "
            f"total_frames={self.total_frames}, "
            f"unique_frames={self.unique_frames})>"
        )


class ArchiveFrame(Base):
    """
    Individual frame record from Archival System.

    Represents a single extracted and deduplicated minimap frame with:
    - Content addressable storage (SHA-256 hash)
    - Tactical segment classification
    - TeneT consensus verification status

    Attributes:
        frame_id: Unique frame identifier
        manifest_id: Reference to ArchiveManifest
        content_hash: SHA-256 hash of JPEG bytes (deduplication key)
        frame_index: Frame sequence number (0-based)
        segment_type: Tactical context (IN_ROUND, BUY_PHASE, etc.)
        timestamp_ms: VOD timestamp in milliseconds
        accuracy_tier: Confidence classification (STANDARD, HIGH, VERIFIED)
        storage_url: CDN/object storage URL
        jpeg_size_bytes: JPEG binary size
        is_pinned: True if verified by TeneT consensus
        pinned_at: Timestamp of TeneT verification
        pinned_by: User/service that pinned frame
        created_at: Record creation timestamp

    Relationships:
        manifest: Related ArchiveManifest
    """
    __tablename__ = "archive_frames"

    frame_id = Column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    manifest_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("archive_manifests.manifest_id", ondelete="CASCADE"),
        nullable=False,
    )
    content_hash = Column(String(64), nullable=False, unique=True)
    frame_index = Column(Integer, nullable=False)
    segment_type = Column(String(50), nullable=False)
    timestamp_ms = Column(Integer, nullable=False)
    accuracy_tier = Column(
        String(50),
        nullable=False,
        default=AccuracyTier.STANDARD.value,
    )
    storage_url = Column(Text, nullable=True)
    jpeg_size_bytes = Column(Integer, nullable=True)
    is_pinned = Column(Boolean, nullable=False, default=False)
    pinned_at = Column(DateTime(timezone=True), nullable=True)
    pinned_by = Column(String(50), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.current_timestamp(),
    )

    manifest = relationship("ArchiveManifest", back_populates="frames")

    __table_args__ = (
        CheckConstraint(
            f"segment_type IN ('{SegmentType.IN_ROUND.value}', "
            f"'{SegmentType.BUY_PHASE.value}', '{SegmentType.HALFTIME.value}', "
            f"'{SegmentType.BETWEEN_ROUND.value}', '{SegmentType.UNKNOWN.value}')",
            name="ck_archive_frames_segment_type",
        ),
        Index("idx_archive_frames_manifest_id", "manifest_id"),
        Index("idx_archive_frames_content_hash", "content_hash"),
        Index("idx_archive_frames_segment_type", "segment_type"),
        Index("idx_archive_frames_timestamp", "timestamp_ms"),
        Index(
            "idx_archive_frames_is_pinned",
            "is_pinned",
            postgresql_where="is_pinned = TRUE",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<ArchiveFrame(frame_id={self.frame_id}, "
            f"segment_type={self.segment_type}, "
            f"timestamp_ms={self.timestamp_ms})>"
        )
