"""
Unit tests for archival service.
Task: AS-4 - Archival Service Tests
"""

import os
import sys
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from src.njz_api.archival.schemas.archive import (
    FrameMetadata,
)
from src.njz_api.archival.services.archival_service import (
    ArchivalService,
    ArchivalServiceError,
)
from src.njz_api.archival.storage.backend import (
    DuplicateHashError,
    StorageBackend,
    StorageError,
)


@pytest.fixture
def mock_storage():
    """Create a mock storage backend."""
    storage = AsyncMock(spec=StorageBackend)
    storage.put = AsyncMock(return_value="/path/to/frame.jpg")
    storage.get = AsyncMock(return_value=b"jpeg data")
    storage.delete = AsyncMock(return_value=True)
    storage.exists = AsyncMock(return_value=False)
    storage.health_check = AsyncMock(return_value={
        "healthy": True,
        "backend": "mock",
        "latency_ms": 1.0,
    })
    storage.get_storage_url = MagicMock(return_value="/path/to/frame.jpg")
    return storage


@pytest.fixture
def mock_db_pool():
    """Create a mock database pool."""
    pool = AsyncMock()
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock(return_value="INSERT 1")
    mock_conn.fetch = AsyncMock(return_value=[])
    mock_conn.fetchrow = AsyncMock(return_value=None)
    mock_conn.fetchval = AsyncMock(return_value=1)

    pool.acquire = MagicMock()
    pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

    return pool, mock_conn


@pytest.fixture
def sample_frame_metadata():
    """Create sample frame metadata."""
    return FrameMetadata(
        frame_index=0,
        segment_type="IN_ROUND",
        timestamp_ms=1000,
        content_hash="a" * 64,
        accuracy_tier="STANDARD",
        jpeg_data=b"test jpeg data",
        jpeg_size_bytes=100,
    )


@pytest.fixture
def archival_service(mock_storage, mock_db_pool):
    """Create an ArchivalService instance with mocks."""
    pool, _ = mock_db_pool
    return ArchivalService(mock_storage, pool)


class TestArchivalServiceInitialization:
    """Tests for service initialization."""

    def test_init(self, mock_storage, mock_db_pool):
        """Test service initialization."""
        pool, _ = mock_db_pool
        service = ArchivalService(mock_storage, pool)
        assert service.storage == mock_storage
        assert service.db_pool == pool


class TestUploadFrames:
    """Tests for frame upload functionality."""

    @pytest.mark.asyncio
    async def test_upload_single_frame(self, archival_service, sample_frame_metadata, mock_db_pool):
        """Test uploading a single frame."""
        pool, mock_conn = mock_db_pool
        extraction_job_id = uuid4()
        match_id = uuid4()

        response = await archival_service.upload_frames(
            frames=[sample_frame_metadata],
            extraction_job_id=extraction_job_id,
            match_id=match_id,
            actor="test_user",
        )

        assert response.success is True
        assert len(response.frame_ids) == 1
        assert response.manifest_id is not None
        assert response.duplicates_skipped == 0
        assert response.bytes_stored == 100

    @pytest.mark.asyncio
    async def test_upload_duplicate_detection(
        self, archival_service, sample_frame_metadata, mock_db_pool, mock_storage
    ):
        """Test duplicate frame detection during upload."""
        pool, mock_conn = mock_db_pool

        # First, make exists return True to simulate existing frame
        mock_storage.exists.return_value = True
        mock_storage.put.side_effect = DuplicateHashError(
            sample_frame_metadata.content_hash,
            "/existing/path.jpg"
        )

        # Mock fetchrow to return existing frame
        mock_conn.fetchrow = AsyncMock(return_value={
            "frame_id": uuid4()
        })

        extraction_job_id = uuid4()
        match_id = uuid4()

        response = await archival_service.upload_frames(
            frames=[sample_frame_metadata],
            extraction_job_id=extraction_job_id,
            match_id=match_id,
            actor="test_user",
        )

        assert response.duplicates_skipped == 1
        assert len(response.frame_ids) == 0

    @pytest.mark.asyncio
    async def test_upload_storage_error(
        self, archival_service, sample_frame_metadata, mock_storage
    ):
        """Test handling of storage errors."""
        mock_storage.put.side_effect = StorageError(
            "Disk full",
            backend="local",
            key=sample_frame_metadata.content_hash,
        )

        with pytest.raises(ArchivalServiceError) as exc_info:
            await archival_service.upload_frames(
                frames=[sample_frame_metadata],
                extraction_job_id=uuid4(),
                match_id=uuid4(),
            )

        assert "STORAGE_ERROR" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_upload_multiple_frames(self, archival_service, mock_db_pool):
        """Test uploading multiple frames."""
        pool, mock_conn = mock_db_pool

        frames = [
            FrameMetadata(
                frame_index=i,
                segment_type="IN_ROUND",
                timestamp_ms=i * 1000,
                content_hash=f"{i:064x}",
                jpeg_data=b"data",
                jpeg_size_bytes=50,
            )
            for i in range(5)
        ]

        response = await archival_service.upload_frames(
            frames=frames,
            extraction_job_id=uuid4(),
            match_id=uuid4(),
        )

        assert len(response.frame_ids) == 5
        assert response.bytes_stored == 250


class TestQueryFrames:
    """Tests for frame query functionality."""

    @pytest.mark.asyncio
    async def test_query_empty(self, archival_service):
        """Test querying with no results."""
        response = await archival_service.query_frames()
        assert response.frames == []
        assert response.total_count == 0
        assert response.has_more is False

    @pytest.mark.asyncio
    async def test_query_with_results(self, archival_service, mock_db_pool):
        """Test querying with results."""
        pool, mock_conn = mock_db_pool

        # Mock fetch results
        frame_id = uuid4()
        mock_conn.fetch = AsyncMock(return_value=[
            {
                "frame_id": frame_id,
                "content_hash": "a" * 64,
                "segment_type": "IN_ROUND",
                "timestamp_ms": 1000,
                "is_pinned": False,
                "pinned_at": None,
                "pinned_by": None,
                "storage_url": "/path.jpg",
                "jpeg_size_bytes": 100,
                "created_at": datetime.utcnow(),
            }
        ])
        mock_conn.fetchval = AsyncMock(return_value=1)

        response = await archival_service.query_frames(match_id=uuid4())

        assert len(response.frames) == 1
        assert response.total_count == 1
        assert response.frames[0].frame_id == frame_id

    @pytest.mark.asyncio
    async def test_query_pagination(self, archival_service, mock_db_pool):
        """Test query pagination."""
        pool, mock_conn = mock_db_pool
        mock_conn.fetchval = AsyncMock(return_value=150)

        response = await archival_service.query_frames(page=1, limit=50)
        assert response.page == 1
        assert response.page_size == 50
        assert response.has_more is True


class TestPinFrame:
    """Tests for frame pinning."""

    @pytest.mark.asyncio
    async def test_pin_success(self, archival_service, mock_db_pool):
        """Test successful pinning."""
        pool, mock_conn = mock_db_pool
        mock_conn.execute = AsyncMock(return_value="UPDATE 1")

        frame_id = uuid4()
        result = await archival_service.pin_frame(
            frame_id=frame_id,
            reason="Test pinning",
            actor="test_user",
            ttl_days=30,
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_pin_not_found(self, archival_service, mock_db_pool):
        """Test pinning non-existent frame."""
        pool, mock_conn = mock_db_pool
        mock_conn.execute = AsyncMock(return_value="UPDATE 0")

        result = await archival_service.pin_frame(
            frame_id=uuid4(),
            reason="Test",
            actor="test_user",
        )

        assert result is False


class TestUnpinFrame:
    """Tests for frame unpinning."""

    @pytest.mark.asyncio
    async def test_unpin_success(self, archival_service, mock_db_pool):
        """Test successful unpinning."""
        pool, mock_conn = mock_db_pool
        mock_conn.execute = AsyncMock(return_value="UPDATE 1")

        frame_id = uuid4()
        result = await archival_service.unpin_frame(frame_id, "test_user")

        assert result is True

    @pytest.mark.asyncio
    async def test_unpin_not_pinned(self, archival_service, mock_db_pool):
        """Test unpinning frame that isn't pinned."""
        pool, mock_conn = mock_db_pool
        mock_conn.execute = AsyncMock(return_value="UPDATE 0")

        result = await archival_service.unpin_frame(uuid4(), "test_user")
        assert result is False


class TestGarbageCollection:
    """Tests for garbage collection."""

    @pytest.mark.asyncio
    async def test_gc_dry_run(self, archival_service, mock_db_pool):
        """Test GC dry run mode."""
        pool, mock_conn = mock_db_pool
        mock_conn.fetch = AsyncMock(return_value=[])

        result = await archival_service.gc_unpinned_frames(
            retention_days=30,
            dry_run=True,
        )

        assert result["dry_run"] is True
        assert result["frames_deleted"] == 0

    @pytest.mark.asyncio
    async def test_gc_deletes_frames(self, archival_service, mock_db_pool, mock_storage):
        """Test GC actually deletes frames."""
        pool, mock_conn = mock_db_pool
        frame_id = uuid4()

        mock_conn.fetch = AsyncMock(return_value=[
            {
                "frame_id": frame_id,
                "content_hash": "a" * 64,
                "storage_url": "/path.jpg",
                "jpeg_size_bytes": 100,
            }
        ])

        result = await archival_service.gc_unpinned_frames(
            retention_days=30,
            dry_run=False,
        )

        assert result["dry_run"] is False
        mock_storage.delete.assert_called_once_with("a" * 64)


class TestGetAuditLog:
    """Tests for audit log retrieval."""

    @pytest.mark.asyncio
    async def test_get_audit_log_empty(self, archival_service):
        """Test empty audit log."""
        logs = await archival_service.get_audit_log()
        assert logs == []

    @pytest.mark.asyncio
    async def test_get_audit_log_with_entries(self, archival_service, mock_db_pool):
        """Test retrieving audit log entries."""
        pool, mock_conn = mock_db_pool
        log_id = uuid4()
        frame_id = uuid4()

        mock_conn.fetch = AsyncMock(return_value=[
            {
                "log_id": log_id,
                "frame_id": frame_id,
                "action": "UPLOAD",
                "actor": "test_user",
                "metadata": {"ip": "127.0.0.1"},
                "created_at": datetime.utcnow(),
            }
        ])

        logs = await archival_service.get_audit_log(frame_id=frame_id)

        assert len(logs) == 1
        assert logs[0].action == "UPLOAD"
        assert logs[0].actor == "test_user"


class TestHealthCheck:
    """Tests for health check functionality."""

    @pytest.mark.asyncio
    async def test_health_check_healthy(self, archival_service, mock_db_pool):
        """Test healthy status."""
        pool, mock_conn = mock_db_pool
        mock_conn.fetchval = AsyncMock(return_value=1)

        health = await archival_service.health_check()

        assert health["healthy"] is True
        assert "storage" in health
        assert "database" in health

    @pytest.mark.asyncio
    async def test_health_check_storage_unhealthy(self, archival_service, mock_storage):
        """Test when storage is unhealthy."""
        mock_storage.health_check.return_value = {
            "healthy": False,
            "backend": "local",
        }

        health = await archival_service.health_check()

        assert health["healthy"] is False


class TestMigrateFrames:
    """Tests for frame migration."""

    @pytest.mark.asyncio
    async def test_migrate_not_implemented(self, archival_service):
        """Test that migration returns not_implemented status."""
        result = await archival_service.migrate_frames(
            from_backend="local",
            to_backend="s3",
            dry_run=True,
        )

        assert result["status"] == "not_implemented"
        assert result["dry_run"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
