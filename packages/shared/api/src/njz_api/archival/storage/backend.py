"""
Module: njz_api.archival.storage.backend
Purpose: Storage abstraction layer for archival system
Task: AS-3 - Storage Abstraction Layer
Date: 2026-03-28

[Ver001.000] - Initial storage backend implementation
"""

import hashlib
import logging
import os
from abc import abstractmethod
from pathlib import Path
from typing import Optional, Protocol, runtime_checkable

import aiofiles
import aiofiles.os

logger = logging.getLogger(__name__)


class StorageError(Exception):
    """Exception raised for storage backend errors.

    Attributes:
        message: Error description
        backend: Name of the storage backend that failed
        key: Object key that caused the error (if applicable)
    """

    def __init__(self, message: str, backend: str = "unknown", key: Optional[str] = None):
        self.message = message
        self.backend = backend
        self.key = key
        super().__init__(self.message)

    def __str__(self) -> str:
        key_info = f" (key: {self.key})" if self.key else ""
        return f"StorageError [{self.backend}]: {self.message}{key_info}"


class DuplicateHashError(Exception):
    """Exception raised when attempting to store content with existing hash.

    This is a normal condition in deduplicated storage - the content
    already exists and doesn't need to be stored again.
    """

    def __init__(self, content_hash: str, existing_key: Optional[str] = None):
        self.content_hash = content_hash
        self.existing_key = existing_key
        super().__init__(f"Content with hash {content_hash} already exists")


@runtime_checkable
class StorageBackend(Protocol):
    """Protocol defining the storage backend interface.

    All storage backends must implement these methods for consistent
    access to frame storage across local, S3, and other backends.

    Example:
        backend = LocalBackend("/data/frames")
        await backend.put("abc123...", jpeg_bytes)
        data = await backend.get("abc123...")
    """

    @abstractmethod
    async def put(self, key: str, data: bytes) -> str:
        """Store data at the given key.

        Args:
            key: Content hash (SHA-256 hex) used as storage key
            data: Binary data to store

        Returns:
            Storage URL/path where data was stored

        Raises:
            DuplicateHashError: If content with this hash already exists
            StorageError: If storage operation fails
        """
        ...

    @abstractmethod
    async def get(self, key: str) -> bytes:
        """Retrieve data by key.

        Args:
            key: Content hash (SHA-256 hex) of stored data

        Returns:
            Binary data

        Raises:
            StorageError: If data not found or retrieval fails
        """
        ...

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete data by key.

        Args:
            key: Content hash (SHA-256 hex) of data to delete

        Returns:
            True if data was deleted, False if not found

        Raises:
            StorageError: If deletion fails
        """
        ...

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if data exists for the given key.

        Args:
            key: Content hash (SHA-256 hex) to check

        Returns:
            True if data exists, False otherwise
        """
        ...

    @abstractmethod
    async def health_check(self) -> dict:
        """Check storage backend health.

        Returns:
            Dict with health status information:
            {
                "healthy": bool,
                "backend": str,
                "latency_ms": float,
                "details": dict  # backend-specific info
            }
        """
        ...

    @abstractmethod
    def get_storage_url(self, key: str) -> str:
        """Get the storage URL for a key.

        Args:
            key: Content hash (SHA-256 hex)

        Returns:
            URL that can be used to access the stored data
        """
        ...


class LocalBackend:
    """Local filesystem storage backend.

    Stores frames on local disk using content-addressed paths:
    {base_path}/frames/{hash[:2]}/{hash}.jpg

    The 2-character sharding reduces directory sizes for better
    filesystem performance with many files.

    Attributes:
        base_path: Root directory for frame storage
        frames_path: Full path to frames subdirectory
    """

    def __init__(self, base_path: Optional[str] = None):
        """Initialize local backend.

        Args:
            base_path: Root storage path. Defaults to DATA_DIR env var
                      or ./data/frames.
        """
        if base_path is None:
            base_path = os.getenv("DATA_DIR", "./data")

        self.base_path = Path(base_path).resolve()
        self.frames_path = self.base_path / "frames"
        self.backend_name = "local"

        logger.info(f"LocalBackend initialized: {self.frames_path}")

    async def _ensure_shard_dir(self, shard: str) -> Path:
        """Ensure shard directory exists.

        Args:
            shard: 2-character shard name (hash prefix)

        Returns:
            Path to shard directory
        """
        shard_path = self.frames_path / shard
        # Use aiofiles.os for async directory creation
        try:
            await aiofiles.os.makedirs(str(shard_path), exist_ok=True)
        except OSError as e:
            raise StorageError(
                f"Failed to create shard directory: {e}",
                backend=self.backend_name,
                key=shard,
            )
        return shard_path

    def _get_key_paths(self, key: str) -> tuple[Path, str]:
        """Get storage paths for a key.

        Args:
            key: SHA-256 hex hash

        Returns:
            Tuple of (shard_path, filename)
        """
        if len(key) < 2:
            raise ValueError("Key must be at least 2 characters")
        shard = key[:2].lower()
        filename = f"{key.lower()}.jpg"
        shard_path = self.frames_path / shard
        return shard_path, filename

    async def put(self, key: str, data: bytes) -> str:
        """Store data on local filesystem.

        Args:
            key: SHA-256 hex hash
            data: Binary JPEG data

        Returns:
            Storage path

        Raises:
            DuplicateHashError: If file already exists (deduplication)
            StorageError: If write fails
        """
        # Validate key format
        if len(key) != 64:
            raise ValueError("Key must be 64 character SHA-256 hex")

        shard_path, filename = self._get_key_paths(key)
        file_path = shard_path / filename

        # Check for existing file (deduplication)
        try:
            if await aiofiles.os.path.exists(str(file_path)):
                logger.debug(f"Deduplication hit for key: {key[:16]}...")
                raise DuplicateHashError(key, str(file_path))
        except OSError as e:
            raise StorageError(
                f"Failed to check existence: {e}",
                backend=self.backend_name,
                key=key,
            )

        # Ensure directory exists
        await self._ensure_shard_dir(key[:2].lower())

        # Write file asynchronously
        try:
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(data)
            logger.debug(f"Stored frame: {file_path}")
        except OSError as e:
            raise StorageError(
                f"Failed to write file: {e}",
                backend=self.backend_name,
                key=key,
            )

        return str(file_path)

    async def get(self, key: str) -> bytes:
        """Retrieve data from local filesystem.

        Args:
            key: SHA-256 hex hash

        Returns:
            Binary JPEG data

        Raises:
            StorageError: If file not found or read fails
        """
        shard_path, filename = self._get_key_paths(key)
        file_path = shard_path / filename

        try:
            async with aiofiles.open(file_path, "rb") as f:
                return await f.read()
        except FileNotFoundError:
            raise StorageError(
                "File not found",
                backend=self.backend_name,
                key=key,
            )
        except OSError as e:
            raise StorageError(
                f"Failed to read file: {e}",
                backend=self.backend_name,
                key=key,
            )

    async def delete(self, key: str) -> bool:
        """Delete data from local filesystem.

        Args:
            key: SHA-256 hex hash

        Returns:
            True if deleted, False if not found

        Raises:
            StorageError: If deletion fails
        """
        shard_path, filename = self._get_key_paths(key)
        file_path = shard_path / filename

        try:
            if not await aiofiles.os.path.exists(str(file_path)):
                return False
            await aiofiles.os.remove(str(file_path))
            logger.debug(f"Deleted frame: {file_path}")
            return True
        except FileNotFoundError:
            return False
        except OSError as e:
            raise StorageError(
                f"Failed to delete file: {e}",
                backend=self.backend_name,
                key=key,
            )

    async def exists(self, key: str) -> bool:
        """Check if data exists.

        Args:
            key: SHA-256 hex hash

        Returns:
            True if file exists
        """
        shard_path, filename = self._get_key_paths(key)
        file_path = shard_path / filename

        try:
            return await aiofiles.os.path.exists(str(file_path))
        except OSError:
            return False

    async def health_check(self) -> dict:
        """Check local storage health.

        Returns:
            Health status with disk usage info
        """
        import time

        start_time = time.time()
        healthy = True
        details = {}

        try:
            # Check if base path exists and is writable
            if not self.base_path.exists():
                healthy = False
                details["error"] = f"Base path does not exist: {self.base_path}"
            else:
                # Check write permissions by creating a test file
                test_file = self.base_path / ".health_check"
                try:
                    async with aiofiles.open(test_file, "w") as f:
                        await f.write("ok")
                    await aiofiles.os.remove(str(test_file))
                    details["writable"] = True
                except OSError as e:
                    healthy = False
                    details["writable"] = False
                    details["error"] = str(e)

            # Get disk usage if available
            try:
                import shutil

                stat = shutil.disk_usage(self.base_path)
                details["disk_total_bytes"] = stat.total
                details["disk_free_bytes"] = stat.free
                details["disk_used_bytes"] = stat.used
                details["disk_usage_percent"] = round((stat.used / stat.total) * 100, 2)
            except Exception as e:
                details["disk_info_error"] = str(e)

        except Exception as e:
            healthy = False
            details["error"] = str(e)

        latency_ms = (time.time() - start_time) * 1000

        return {
            "healthy": healthy,
            "backend": self.backend_name,
            "latency_ms": round(latency_ms, 2),
            "details": details,
        }

    def get_storage_url(self, key: str) -> str:
        """Get storage path for key.

        Args:
            key: SHA-256 hex hash

        Returns:
            Absolute file path
        """
        shard_path, filename = self._get_key_paths(key)
        return str(shard_path / filename)

    async def get_stats(self) -> dict:
        """Get storage statistics.

        Returns:
            Dict with file counts, total size, etc.
        """
        total_files = 0
        total_bytes = 0
        shard_count = 0

        try:
            if not await aiofiles.os.path.exists(str(self.frames_path)):
                return {
                    "total_files": 0,
                    "total_bytes": 0,
                    "shard_count": 0,
                    "backend": self.backend_name,
                }

            # Iterate through shard directories
            for shard in await aiofiles.os.listdir(str(self.frames_path)):
                shard_path = self.frames_path / shard
                if not await aiofiles.os.path.isdir(str(shard_path)):
                    continue

                shard_count += 1
                files = await aiofiles.os.listdir(str(shard_path))

                for filename in files:
                    if filename.endswith(".jpg"):
                        total_files += 1
                        try:
                            file_path = shard_path / filename
                            stat = await aiofiles.os.stat(str(file_path))
                            total_bytes += stat.st_size
                        except OSError:
                            pass

        except OSError as e:
            logger.warning(f"Failed to get storage stats: {e}")

        return {
            "total_files": total_files,
            "total_bytes": total_bytes,
            "shard_count": shard_count,
            "backend": self.backend_name,
        }


def compute_content_hash(data: bytes) -> str:
    """Compute SHA-256 hash of data.

    Args:
        data: Binary data to hash

    Returns:
        Lowercase hex-encoded SHA-256 hash
    """
    return hashlib.sha256(data).hexdigest().lower()
