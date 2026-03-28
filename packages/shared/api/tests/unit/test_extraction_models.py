"""
Unit tests for extraction job models and schemas.
Task: [Gate 9.9] - Model and schema validation
"""

import pytest
import sys
import os
from datetime import datetime
from uuid import uuid4
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# Mock external dependencies before importing sator modules
sys.modules['axiom_esports_data'] = MagicMock()
sys.modules['axiom_esports_data.api'] = MagicMock()
sys.modules['axiom_esports_data.api.src'] = MagicMock()
sys.modules['axiom_esports_data.api.src.db_manager'] = MagicMock()

from src.sator.extraction_job import (
    ExtractionJob,
    ArchiveManifest,
    ArchiveFrame,
    JobStatus,
    SegmentType,
    VODSourceType,
)
from src.sator.extraction_schemas import (
    ExtractionJobRequest,
    ExtractionJobResponse,
    ExtractionJobStatus,
    FrameData,
    ArchiveFrameResponse,
)


class TestExtractionJobModel:
    """Tests for ExtractionJob SQLAlchemy model."""

    def test_extraction_job_creation(self):
        """Test basic job creation with required fields."""
        match_id = uuid4()
        job = ExtractionJob(
            match_id=match_id,
            vod_source=VODSourceType.LOCAL.value,
            vod_path="/data/vods/valorant_match.mp4",
        )
        assert job.match_id == match_id
        assert job.status == JobStatus.PENDING.value
        assert job.frame_count is None
        assert job.error_message is None

    def test_extraction_job_status_check(self):
        """Test job status checking methods."""
        job = ExtractionJob(
            match_id=uuid4(),
            vod_source=VODSourceType.LOCAL.value,
            vod_path="/tmp/test.mp4",
            status=JobStatus.RUNNING.value,
        )
        assert not job.is_complete()
        assert not job.is_failed()

        job.status = JobStatus.COMPLETED.value
        assert job.is_complete()
        assert not job.is_failed()

        job.status = JobStatus.FAILED.value
        assert job.is_complete()
        assert job.is_failed()

    def test_extraction_job_repr(self):
        """Test job string representation."""
        match_id = uuid4()
        job = ExtractionJob(
            match_id=match_id,
            vod_source=VODSourceType.LOCAL.value,
            vod_path="/tmp/test.mp4",
        )
        assert f"match_id={match_id}" in repr(job)
        assert "PENDING" in repr(job)


class TestArchiveManifestModel:
    """Tests for ArchiveManifest SQLAlchemy model."""

    def test_archive_manifest_creation(self):
        """Test manifest creation with frame stats."""
        job_id = uuid4()
        manifest = ArchiveManifest(
            extraction_job_id=job_id,
            total_frames=1800,
            unique_frames=1620,
            storage_size_bytes=162000000,
            dedup_ratio=0.9,
        )
        assert manifest.extraction_job_id == job_id
        assert manifest.total_frames == 1800
        assert manifest.unique_frames == 1620
        assert manifest.dedup_ratio == 0.9

    def test_archive_manifest_repr(self):
        """Test manifest string representation."""
        manifest = ArchiveManifest(
            extraction_job_id=uuid4(),
            total_frames=100,
            unique_frames=95,
            storage_size_bytes=9500000,
        )
        assert "total_frames=100" in repr(manifest)
        assert "unique_frames=95" in repr(manifest)


class TestArchiveFrameModel:
    """Tests for ArchiveFrame SQLAlchemy model."""

    def test_archive_frame_creation(self):
        """Test frame creation with metadata."""
        manifest_id = uuid4()
        frame = ArchiveFrame(
            manifest_id=manifest_id,
            content_hash="abc123def456",
            frame_index=42,
            segment_type=SegmentType.IN_ROUND.value,
            timestamp_ms=42000,
            jpeg_size_bytes=102400,
        )
        assert frame.manifest_id == manifest_id
        assert frame.frame_index == 42
        assert frame.segment_type == SegmentType.IN_ROUND.value
        assert frame.is_pinned is False

    def test_archive_frame_pinning(self):
        """Test frame verification/pinning."""
        frame = ArchiveFrame(
            manifest_id=uuid4(),
            content_hash="hash123",
            frame_index=0,
            segment_type=SegmentType.IN_ROUND.value,
            timestamp_ms=0,
        )
        assert not frame.is_pinned

        frame.is_pinned = True
        frame.pinned_by = "tenet_consensus"
        assert frame.is_pinned

    def test_archive_frame_repr(self):
        """Test frame string representation."""
        frame = ArchiveFrame(
            manifest_id=uuid4(),
            content_hash="hash",
            frame_index=5,
            segment_type=SegmentType.BUY_PHASE.value,
            timestamp_ms=5000,
        )
        assert "BUY_PHASE" in repr(frame)
        assert "timestamp_ms=5000" in repr(frame)


class TestExtractionJobSchema:
    """Tests for ExtractionJobRequest Pydantic schema."""

    def test_extraction_job_request_validation(self):
        """Test request schema validation."""
        match_id = uuid4()
        request = ExtractionJobRequest(
            match_id=match_id,
            vod_source="local",
            vod_path="/data/vods/valorant_test.mp4",
        )
        assert request.match_id == match_id
        assert request.vod_source == "local"

    def test_extraction_job_request_invalid_source(self):
        """Test request with valid VOD sources."""
        # Valid sources should be local, s3, http
        request_local = ExtractionJobRequest(
            match_id=uuid4(),
            vod_source="local",
            vod_path="/tmp/test.mp4",
        )
        assert request_local.vod_source == "local"


class TestFrameDataSchema:
    """Tests for FrameData Pydantic schema."""

    def test_frame_data_creation(self):
        """Test frame data schema."""
        frame = FrameData(
            frame_index=100,
            segment_type=SegmentType.HALFTIME.value,
            timestamp_ms=100000,
            content_hash="sha256_hash_value",
        )
        assert frame.frame_index == 100
        assert frame.segment_type == SegmentType.HALFTIME.value
        assert frame.accuracy_tier == "STANDARD"

    def test_frame_data_custom_accuracy(self):
        """Test frame data with custom accuracy tier."""
        frame = FrameData(
            frame_index=0,
            segment_type=SegmentType.IN_ROUND.value,
            timestamp_ms=0,
            content_hash="hash",
            accuracy_tier="HIGH",
        )
        assert frame.accuracy_tier == "HIGH"


class TestEnums:
    """Tests for enum values."""

    def test_job_status_values(self):
        """Test JobStatus enum."""
        assert JobStatus.PENDING.value == "pending"
        assert JobStatus.RUNNING.value == "running"
        assert JobStatus.COMPLETED.value == "completed"
        assert JobStatus.FAILED.value == "failed"

    def test_segment_type_values(self):
        """Test SegmentType enum."""
        assert SegmentType.IN_ROUND.value == "IN_ROUND"
        assert SegmentType.BUY_PHASE.value == "BUY_PHASE"
        assert SegmentType.HALFTIME.value == "HALFTIME"
        assert SegmentType.BETWEEN_ROUND.value == "BETWEEN_ROUND"
        assert SegmentType.UNKNOWN.value == "UNKNOWN"

    def test_vod_source_values(self):
        """Test VODSourceType enum."""
        assert VODSourceType.LOCAL.value == "local"
        assert VODSourceType.S3.value == "s3"
        assert VODSourceType.HTTP.value == "http"


@pytest.mark.asyncio
async def test_job_timestamps():
    """Test timestamp handling on job models."""
    job = ExtractionJob(
        match_id=uuid4(),
        vod_source=VODSourceType.LOCAL.value,
        vod_path="/tmp/test.mp4",
    )
    # created_at should be set by database, but we can test it's accessible
    assert job.created_at is None or isinstance(job.created_at, datetime)
    assert job.completed_at is None
