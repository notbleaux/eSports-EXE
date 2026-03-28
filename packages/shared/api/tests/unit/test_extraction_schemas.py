"""
Unit tests for extraction request/response schemas.
Task: [Gate 9.9] - Schema validation
"""

import pytest
import sys
import os
from uuid import uuid4

# Mock external dependencies BEFORE any imports
from unittest.mock import MagicMock
sys.modules['axiom_esports_data'] = MagicMock()
sys.modules['axiom_esports_data.api'] = MagicMock()
sys.modules['axiom_esports_data.api.src'] = MagicMock()
sys.modules['axiom_esports_data.api.src.db_manager'] = MagicMock()
sys.modules['axiom_esports_data.analytics'] = MagicMock()
sys.modules['axiom_esports_data.analytics.src'] = MagicMock()
sys.modules['axiom_esports_data.analytics.src.metrics_calculator'] = MagicMock()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.sator.extraction_schemas import (
    ExtractionJobRequest,
    ExtractionJobResponse,
    ExtractionJobStatus,
    FrameData,
    FrameUploadPayload,
    ArchiveFrameResponse,
    FrameQueryResponse,
)


class TestExtractionJobRequest:
    """Tests for ExtractionJobRequest schema."""

    def test_valid_request(self):
        """Test valid extraction job request."""
        match_id = uuid4()
        request = ExtractionJobRequest(
            match_id=match_id,
            vod_source="local",
            vod_path="/data/vods/valorant.mp4",
        )
        assert request.match_id == match_id
        assert request.vod_source == "local"
        assert request.vod_path == "/data/vods/valorant.mp4"

    def test_request_with_s3_source(self):
        """Test request with S3 source."""
        request = ExtractionJobRequest(
            match_id=uuid4(),
            vod_source="s3",
            vod_path="s3://bucket/valorant.mp4",
        )
        assert request.vod_source == "s3"

    def test_request_with_http_source(self):
        """Test request with HTTP source."""
        request = ExtractionJobRequest(
            match_id=uuid4(),
            vod_source="http",
            vod_path="https://cdn.example.com/valorant.mp4",
        )
        assert request.vod_source == "http"

    def test_request_serialization(self):
        """Test request can be serialized to dict."""
        match_id = uuid4()
        request = ExtractionJobRequest(
            match_id=match_id,
            vod_source="local",
            vod_path="/tmp/test.mp4",
        )
        data = request.model_dump()
        assert data["match_id"] == match_id
        assert data["vod_source"] == "local"


class TestExtractionJobResponse:
    """Tests for ExtractionJobResponse schema."""

    def test_response_creation(self):
        """Test creating a job response."""
        job_id = uuid4()
        response = ExtractionJobResponse(
            job_id=job_id,
            status="pending",
        )
        assert response.job_id == job_id
        assert response.status == "pending"

    def test_response_status_values(self):
        """Test response with different status values."""
        job_id = uuid4()
        for status in ["pending", "running", "completed", "failed"]:
            response = ExtractionJobResponse(job_id=job_id, status=status)
            assert response.status == status


class TestFrameData:
    """Tests for FrameData schema."""

    def test_frame_data_basic(self):
        """Test basic frame data."""
        frame = FrameData(
            frame_index=0,
            segment_type="IN_ROUND",
            timestamp_ms=0,
            content_hash="abc123",
        )
        assert frame.frame_index == 0
        assert frame.segment_type == "IN_ROUND"
        assert frame.timestamp_ms == 0
        assert frame.accuracy_tier == "STANDARD"

    def test_frame_data_all_segment_types(self):
        """Test frame with different segment types."""
        segment_types = [
            "IN_ROUND",
            "BUY_PHASE",
            "HALFTIME",
            "BETWEEN_ROUND",
            "UNKNOWN",
        ]
        for segment_type in segment_types:
            frame = FrameData(
                frame_index=1,
                segment_type=segment_type,
                timestamp_ms=1000,
                content_hash="hash",
            )
            assert frame.segment_type == segment_type

    def test_frame_data_custom_accuracy(self):
        """Test frame with custom accuracy tier."""
        frame = FrameData(
            frame_index=5,
            segment_type="IN_ROUND",
            timestamp_ms=5000,
            content_hash="hash",
            accuracy_tier="HIGH",
        )
        assert frame.accuracy_tier == "HIGH"


class TestFrameUploadPayload:
    """Tests for FrameUploadPayload schema."""

    def test_payload_with_multiple_frames(self):
        """Test payload with multiple frames."""
        match_id = uuid4()
        job_id = uuid4()
        
        frames = [
            FrameData(
                frame_index=i,
                segment_type="IN_ROUND",
                timestamp_ms=i * 1000,
                content_hash=f"hash_{i}",
            )
            for i in range(5)
        ]
        
        payload = FrameUploadPayload(
            frames=frames,
            extraction_job_id=job_id,
            match_id=match_id,
        )
        
        assert len(payload.frames) == 5
        assert payload.extraction_job_id == job_id
        assert payload.match_id == match_id

    def test_payload_serialization(self):
        """Test payload can be serialized."""
        match_id = uuid4()
        job_id = uuid4()
        
        payload = FrameUploadPayload(
            frames=[
                FrameData(
                    frame_index=0,
                    segment_type="IN_ROUND",
                    timestamp_ms=0,
                    content_hash="hash",
                )
            ],
            extraction_job_id=job_id,
            match_id=match_id,
        )
        
        data = payload.model_dump()
        assert len(data["frames"]) == 1
        assert str(data["extraction_job_id"]) == str(job_id)


class TestArchiveFrameResponse:
    """Tests for ArchiveFrameResponse schema."""

    def test_frame_response_basic(self):
        """Test basic frame response."""
        from datetime import datetime
        
        frame_id = uuid4()
        now = datetime.now()
        
        frame = ArchiveFrameResponse(
            frame_id=frame_id,
            content_hash="hash",
            segment_type="IN_ROUND",
            timestamp_ms=1000,
            created_at=now,
        )
        
        assert frame.frame_id == frame_id
        assert frame.segment_type == "IN_ROUND"
        assert not frame.is_pinned

    def test_frame_response_with_storage_url(self):
        """Test frame with storage URL."""
        from datetime import datetime
        
        frame = ArchiveFrameResponse(
            frame_id=uuid4(),
            content_hash="hash",
            storage_url="s3://bucket/frame.jpg",
            segment_type="BUY_PHASE",
            timestamp_ms=2000,
            is_pinned=True,
            created_at=datetime.now(),
        )
        
        assert frame.storage_url == "s3://bucket/frame.jpg"
        assert frame.is_pinned is True


class TestFrameQueryResponse:
    """Tests for FrameQueryResponse schema."""

    def test_query_response_basic(self):
        """Test query response."""
        from datetime import datetime
        
        frames = [
            ArchiveFrameResponse(
                frame_id=uuid4(),
                content_hash=f"hash_{i}",
                segment_type="IN_ROUND",
                timestamp_ms=i * 1000,
                created_at=datetime.now(),
            )
            for i in range(3)
        ]
        
        response = FrameQueryResponse(
            frames=frames,
            total_count=1800,
            page=1,
            page_size=50,
            has_more=True,
        )
        
        assert len(response.frames) == 3
        assert response.total_count == 1800
        assert response.page == 1
        assert response.has_more is True

    def test_query_response_last_page(self):
        """Test query response on last page."""
        from datetime import datetime
        
        response = FrameQueryResponse(
            frames=[],
            total_count=50,
            page=1,
            page_size=50,
            has_more=False,
        )
        
        assert len(response.frames) == 0
        assert response.has_more is False
