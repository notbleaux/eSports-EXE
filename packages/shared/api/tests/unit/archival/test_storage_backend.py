"""
Unit tests for storage backend implementations.
Task: AS-3 - Storage Abstraction Layer Tests
"""

import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from src.njz_api.archival.storage.backend import (
    DuplicateHashError,
    LocalBackend,
    StorageError,
    compute_content_hash,
)


@pytest.fixture
def temp_storage_path(tmp_path):
    """Create a temporary storage path."""
    return str(tmp_path / "frames")


@pytest.fixture
async def local_backend(temp_storage_path):
    """Create a LocalBackend instance."""
    backend = LocalBackend(temp_storage_path)
    return backend


class TestComputeContentHash:
    """Tests for content hash computation."""

    def test_compute_hash_basic(self):
        """Test basic hash computation."""
        data = b"test data"
        hash_result = compute_content_hash(data)
        assert len(hash_result) == 64
        assert all(c in "0123456789abcdef" for c in hash_result)

    def test_compute_hash_deterministic(self):
        """Test that hash is deterministic."""
        data = b"same data"
        hash1 = compute_content_hash(data)
        hash2 = compute_content_hash(data)
        assert hash1 == hash2

    def test_compute_hash_different_data(self):
        """Test different data produces different hashes."""
        hash1 = compute_content_hash(b"data1")
        hash2 = compute_content_hash(b"data2")
        assert hash1 != hash2


class TestLocalBackend:
    """Tests for LocalBackend implementation."""

    @pytest.mark.asyncio
    async def test_initialization(self, temp_storage_path):
        """Test backend initialization."""
        backend = LocalBackend(temp_storage_path)
        assert backend.base_path == Path(temp_storage_path).resolve()
        assert backend.frames_path == Path(temp_storage_path) / "frames"
        assert backend.backend_name == "local"

    @pytest.mark.asyncio
    async def test_put_and_get(self, local_backend):
        """Test storing and retrieving data."""
        key = "a" * 64  # Valid SHA-256 hex
        data = b"test jpeg data"

        # Put data
        path = await local_backend.put(key, data)
        assert path is not None
        assert key[:2] in path
        assert key in path

        # Get data back
        retrieved = await local_backend.get(key)
        assert retrieved == data

    @pytest.mark.asyncio
    async def test_put_duplicate_raises_error(self, local_backend):
        """Test that duplicate keys raise DuplicateHashError."""
        key = "b" * 64
        data = b"original data"

        # First put should succeed
        await local_backend.put(key, data)

        # Second put should raise DuplicateHashError
        with pytest.raises(DuplicateHashError):
            await local_backend.put(key, b"different data")

    @pytest.mark.asyncio
    async def test_exists(self, local_backend):
        """Test exists method."""
        key = "c" * 64
        data = b"test data"

        assert await local_backend.exists(key) is False

        await local_backend.put(key, data)
        assert await local_backend.exists(key) is True

    @pytest.mark.asyncio
    async def test_delete(self, local_backend):
        """Test delete method."""
        key = "d" * 64
        data = b"test data"

        await local_backend.put(key, data)
        assert await local_backend.exists(key) is True

        deleted = await local_backend.delete(key)
        assert deleted is True
        assert await local_backend.exists(key) is False

        # Deleting non-existent returns False
        deleted = await local_backend.delete(key)
        assert deleted is False

    @pytest.mark.asyncio
    async def test_get_nonexistent_raises_error(self, local_backend):
        """Test getting non-existent key raises StorageError."""
        key = "e" * 64

        with pytest.raises(StorageError) as exc_info:
            await local_backend.get(key)
        assert "not found" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_invalid_key_length(self, local_backend):
        """Test that invalid key length raises ValueError."""
        with pytest.raises(ValueError, match="64 character"):
            await local_backend.put("too-short", b"data")

    @pytest.mark.asyncio
    async def test_get_storage_url(self, local_backend):
        """Test getting storage URL."""
        key = "f" * 64
        url = local_backend.get_storage_url(key)
        assert key[:2] in url
        assert key in url
        assert url.endswith(".jpg")

    @pytest.mark.asyncio
    async def test_health_check(self, local_backend, temp_storage_path):
        """Test health check."""
        health = await local_backend.health_check()
        assert "healthy" in health
        assert "backend" in health
        assert "latency_ms" in health
        assert "details" in health
        assert health["backend"] == "local"

    @pytest.mark.asyncio
    async def test_health_check_unwritable(self, tmp_path):
        """Test health check with unwritable directory."""
        # Create a read-only directory
        read_only_path = tmp_path / "readonly"
        read_only_path.mkdir()
        read_only_path.chmod(0o555)

        try:
            backend = LocalBackend(str(read_only_path))
            health = await backend.health_check()
            assert health["healthy"] is False
        finally:
            # Restore permissions for cleanup
            read_only_path.chmod(0o755)

    @pytest.mark.asyncio
    async def test_get_stats(self, local_backend):
        """Test storage statistics."""
        # Initially empty
        stats = await local_backend.get_stats()
        assert stats["total_files"] == 0
        assert stats["total_bytes"] == 0
        assert stats["backend"] == "local"

        # Add some files
        for i in range(3):
            key = f"{i:064x}"
            data = b"x" * 100
            await local_backend.put(key, data)

        stats = await local_backend.get_stats()
        assert stats["total_files"] == 3
        assert stats["total_bytes"] == 300


class TestStorageError:
    """Tests for StorageError exception."""

    def test_error_message(self):
        """Test error message formatting."""
        err = StorageError("something failed", backend="test", key="abc123")
        assert "something failed" in str(err)
        assert "test" in str(err)
        assert "abc123" in str(err)

    def test_error_without_key(self):
        """Test error without key."""
        err = StorageError("general failure", backend="test")
        assert "general failure" in str(err)
        assert err.key is None


class TestDuplicateHashError:
    """Tests for DuplicateHashError exception."""

    def test_error_message(self):
        """Test error message."""
        err = DuplicateHashError("abc123", "/path/to/file")
        assert "abc123" in str(err)
        assert err.content_hash == "abc123"
        assert err.existing_key == "/path/to/file"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
