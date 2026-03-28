"""
Module: njz_api.archival.services.archival_service
Purpose: Core archival service for frame storage and management
Tasks: AS-4, AS-7 - Archival Service with Metrics
Date: 2026-03-28

[Ver003.000] - Added structured logging with structlog
[Ver002.000] - Added metrics integration
[Ver001.000] - Initial archival service implementation
"""

import time
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID, uuid4

import asyncpg
import structlog

from ..metrics import get_metrics
from ..schemas.archive import (
    ArchiveAuditLogResponse,
    AuditMetadata,
    FrameInfo,
    FrameMetadata,
    FrameQueryResponse,
    FrameUploadResponse,
)
from ..storage.backend import DuplicateHashError, StorageBackend, StorageError

# Use structlog for structured logging
logger = structlog.get_logger(__name__)


class ArchivalServiceError(Exception):
    """Base exception for archival service errors."""

    def __init__(self, message: str, code: str = "ARCHIVAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ArchivalService:
    """Core service for archival system operations.

    Manages frame storage, deduplication, pinning, garbage collection,
    and audit logging. All operations are async and use the provided
    storage backend and database pool.

    Attributes:
        storage: Storage backend for binary frame data
        db_pool: Database connection pool for metadata

    Example:
        service = ArchivalService(storage_backend, db_pool)
        response = await service.upload_frames(frames, metadata, actor="extractor")
    """

    def __init__(self, storage_backend: StorageBackend, db_pool: asyncpg.Pool):
        """Initialize archival service.

        Args:
            storage_backend: Storage backend for frame data
            db_pool: Async database connection pool
        """
        self.storage = storage_backend
        self.db_pool = db_pool
        logger.info(
            "service_initialized",
            storage_backend=storage_backend.backend_name,
            db_pool_size=db_pool.get_size() if hasattr(db_pool, 'get_size') else 'unknown'
        )

    async def upload_frames(
        self,
        frames: List[FrameMetadata],
        extraction_job_id: UUID,
        match_id: UUID,
        manifest_id: Optional[UUID] = None,
        actor: str = "system",
    ) -> FrameUploadResponse:
        """Upload frames to archival storage with deduplication.

        Frames are deduplicated by content_hash. Duplicate frames are
        logged but not stored again.

        Args:
            frames: List of frame metadata with optional jpeg_data
            extraction_job_id: ID of the extraction job
            match_id: Associated match ID
            manifest_id: Optional existing manifest ID
            actor: User or service performing the upload

        Returns:
            FrameUploadResponse with stored frame IDs and stats

        Raises:
            ArchivalServiceError: If upload fails
        """
        start_time = time.time()
        stored_frame_ids: List[UUID] = []
        duplicates_skipped = 0
        bytes_stored = 0

        # Create or use existing manifest
        if manifest_id is None:
            manifest_id = await self._create_manifest(extraction_job_id, len(frames))
        else:
            await self._update_manifest_stats(manifest_id, len(frames))

        async with self.db_pool.acquire() as conn:
            for frame in frames:
                frame_id = uuid4()
                storage_url = None
                jpeg_size = frame.jpeg_size_bytes or 0

                # Attempt to store frame data if provided
                if frame.jpeg_data:
                    try:
                        storage_path = await self.storage.put(
                            frame.content_hash,
                            frame.jpeg_data,
                        )
                        storage_url = storage_path
                        bytes_stored += jpeg_size

                        # Log upload action
                        await self._log_action(
                            conn,
                            frame_id,
                            "UPLOAD",
                            actor,
                            {"content_hash": frame.content_hash},
                        )

                    except DuplicateHashError:
                        # Frame already exists - get existing storage URL
                        storage_url = self.storage.get_storage_url(frame.content_hash)
                        duplicates_skipped += 1
                        frame_id = (
                            await self._get_frame_by_hash(conn, frame.content_hash) or frame_id
                        )

                        # Log dedup skip
                        await self._log_action(
                            conn,
                            frame_id,
                            "DEDUP_SKIP",
                            actor,
                            {"content_hash": frame.content_hash},
                        )
                        continue
                    except StorageError as e:
                        logger.error(
                            "storage_error",
                            frame_id=str(frame_id),
                            error=e.message,
                        )
                        raise ArchivalServiceError(
                            f"Storage failed: {e.message}",
                            code="STORAGE_ERROR",
                        )

                # Insert frame record
                await conn.execute(
                    """
                    INSERT INTO archive_frames (
                        frame_id, manifest_id, content_hash, frame_index,
                        segment_type, timestamp_ms, accuracy_tier,
                        storage_url, jpeg_size_bytes, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                    ON CONFLICT (content_hash) DO NOTHING
                    """,
                    frame_id,
                    manifest_id,
                    frame.content_hash,
                    frame.frame_index,
                    frame.segment_type,
                    frame.timestamp_ms,
                    frame.accuracy_tier,
                    storage_url,
                    jpeg_size,
                )

                stored_frame_ids.append(frame_id)

            # Update manifest with final stats
            await self._finalize_manifest(conn, manifest_id, len(stored_frame_ids))

        processing_time_ms = (time.time() - start_time) * 1000

        # Update metrics
        try:
            metrics = get_metrics()
            metrics.increment_frames_uploaded(len(stored_frame_ids), status="success")
            metrics.increment_frames_deduplicated(duplicates_skipped)
            for frame in frames:
                if frame.jpeg_size_bytes:
                    metrics.observe_frame_size(frame.jpeg_size_bytes)
        except Exception:
            # Don't fail upload if metrics fail
            pass

        # Structured logging for upload completion
        logger.info(
            "frames_uploaded",
            match_id=str(match_id),
            manifest_id=str(manifest_id),
            frames_stored=len(stored_frame_ids),
            duplicates_skipped=duplicates_skipped,
            bytes_stored=bytes_stored,
            duration_ms=round(processing_time_ms, 2),
            actor=actor
        )

        return FrameUploadResponse(
            success=True,
            frame_ids=stored_frame_ids,
            manifest_id=manifest_id,
            duplicates_skipped=duplicates_skipped,
            bytes_stored=bytes_stored,
            processing_time_ms=processing_time_ms,
        )

    async def query_frames(
        self,
        match_id: Optional[UUID] = None,
        manifest_id: Optional[UUID] = None,
        segment_type: Optional[str] = None,
        is_pinned: Optional[bool] = None,
        page: int = 1,
        limit: int = 50,
    ) -> FrameQueryResponse:
        """Query frames with pagination and filtering.

        Args:
            match_id: Filter by match ID (via manifest join)
            manifest_id: Filter by specific manifest
            segment_type: Filter by segment type
            is_pinned: Filter by pinned status
            page: Page number (1-based)
            limit: Frames per page (max 100)

        Returns:
            FrameQueryResponse with paginated results
        """
        limit = min(max(limit, 1), 100)
        offset = (page - 1) * limit

        # Build query dynamically
        conditions = []
        params: List[Optional[object]] = []
        param_idx = 1

        if manifest_id:
            conditions.append(f"af.manifest_id = ${param_idx}")
            params.append(manifest_id)
            param_idx += 1

        if match_id:
            conditions.append(f"am.match_id = ${param_idx}")
            params.append(match_id)
            param_idx += 1

        if segment_type:
            conditions.append(f"af.segment_type = ${param_idx}")
            params.append(segment_type)
            param_idx += 1

        if is_pinned is not None:
            conditions.append(f"af.is_pinned = ${param_idx}")
            params.append(is_pinned)
            param_idx += 1

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        # Count total
        count_query = f"""
            SELECT COUNT(*)
            FROM archive_frames af
            JOIN archive_manifests am ON af.manifest_id = am.manifest_id
            {where_clause}
        """

        # Fetch frames
        select_query = f"""
            SELECT
                af.frame_id,
                af.content_hash,
                af.segment_type,
                af.timestamp_ms,
                af.is_pinned,
                af.pinned_at,
                af.pinned_by,
                af.storage_url,
                af.jpeg_size_bytes,
                af.created_at
            FROM archive_frames af
            JOIN archive_manifests am ON af.manifest_id = am.manifest_id
            {where_clause}
            ORDER BY af.timestamp_ms ASC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])

        async with self.db_pool.acquire() as conn:
            total_count = await conn.fetchval(count_query, *params[:-2])
            rows = await conn.fetch(select_query, *params)

        frames = [
            FrameInfo(
                frame_id=row["frame_id"],
                content_hash=row["content_hash"],
                segment_type=row["segment_type"],
                timestamp_ms=row["timestamp_ms"],
                is_pinned=row["is_pinned"],
                pinned_at=row["pinned_at"],
                pinned_by=row["pinned_by"],
                storage_url=row["storage_url"],
                jpeg_size_bytes=row["jpeg_size_bytes"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

        return FrameQueryResponse(
            frames=frames,
            total_count=total_count or 0,
            page=page,
            page_size=limit,
            has_more=len(frames) == limit,
        )

    async def pin_frame(
        self,
        frame_id: UUID,
        reason: str,
        actor: str,
        ttl_days: Optional[int] = None,
    ) -> bool:
        """Pin a frame to prevent garbage collection.

        Args:
            frame_id: Frame to pin
            reason: Reason for pinning
            actor: User or service pinning the frame
            ttl_days: Optional TTL (null = indefinite)

        Returns:
            True if frame was pinned, False if not found
        """
        async with self.db_pool.acquire() as conn:
            # Update frame
            result = await conn.execute(
                """
                UPDATE archive_frames
                SET is_pinned = TRUE,
                    pinned_at = NOW(),
                    pinned_by = $1
                WHERE frame_id = $2
                """,
                actor,
                frame_id,
            )

            if result == "UPDATE 0":
                return False

            # Log action
            metadata = {"reason": reason}
            if ttl_days:
                metadata["ttl_days"] = ttl_days
                metadata["expires_at"] = (datetime.utcnow() + timedelta(days=ttl_days)).isoformat()

            await self._log_action(conn, frame_id, "PIN", actor, metadata)
            logger.info(
                "frame_pinned",
                frame_id=str(frame_id),
                actor=actor,
                reason=reason,
                ttl_days=ttl_days
            )
            return True

    async def unpin_frame(self, frame_id: UUID, actor: str) -> bool:
        """Unpin a frame, allowing garbage collection.

        Args:
            frame_id: Frame to unpin
            actor: User or service unpinning the frame

        Returns:
            True if frame was unpinned, False if not found
        """
        async with self.db_pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE archive_frames
                SET is_pinned = FALSE,
                    pinned_at = NULL,
                    pinned_by = NULL
                WHERE frame_id = $1 AND is_pinned = TRUE
                """,
                frame_id,
            )

            if result == "UPDATE 0":
                return False

            await self._log_action(conn, frame_id, "UNPIN", actor, {})
            logger.info(
                "frame_unpinned",
                frame_id=str(frame_id),
                actor=actor
            )
            return True

    async def gc_unpinned_frames(
        self,
        retention_days: int,
        dry_run: bool = True,
        batch_size: int = 1000,
        actor: str = "gc_service",
    ) -> dict:
        """Garbage collect unpinned frames older than retention period.

        Args:
            retention_days: Delete frames older than this
            dry_run: If True, only count without deleting
            batch_size: Frames to process per batch
            actor: Service performing GC

        Returns:
            Dict with deletion stats
        """
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        total_deleted = 0
        total_bytes_freed = 0
        errors: List[str] = []

        async with self.db_pool.acquire() as conn:
            while True:
                # Find candidate frames
                rows = await conn.fetch(
                    """
                    SELECT frame_id, content_hash, storage_url, jpeg_size_bytes
                    FROM archive_frames
                    WHERE is_pinned = FALSE
                      AND created_at < $1
                    LIMIT $2
                    """,
                    cutoff_date,
                    batch_size,
                )

                if not rows:
                    break

                for row in rows:
                    frame_id = row["frame_id"]
                    content_hash = row["content_hash"]
                    storage_url = row["storage_url"]
                    size_bytes = row["jpeg_size_bytes"] or 0

                    if not dry_run:
                        try:
                            # Delete from storage
                            if storage_url:
                                await self.storage.delete(content_hash)

                            # Delete from database
                            await conn.execute(
                                "DELETE FROM archive_frames WHERE frame_id = $1",
                                frame_id,
                            )

                            # Log action
                            await self._log_action(
                                conn,
                                frame_id,
                                "DELETE",
                                actor,
                                {"reason": "garbage_collection", "dry_run": False},
                            )

                            total_deleted += 1
                            total_bytes_freed += size_bytes

                        except StorageError as e:
                            errors.append(f"Frame {frame_id}: {e.message}")
                            logger.error(
                                "gc_error",
                                frame_id=str(frame_id),
                                error=e.message,
                            )
                    else:
                        # Dry run - just count
                        total_deleted += 1
                        total_bytes_freed += size_bytes

                        await self._log_action(
                            conn,
                            frame_id,
                            "GC_SCAN",
                            actor,
                            {"reason": "garbage_collection", "dry_run": True},
                        )

                if len(rows) < batch_size:
                    break

        result = {
            "dry_run": dry_run,
            "frames_deleted": total_deleted,
            "bytes_freed": total_bytes_freed,
            "retention_days": retention_days,
            "cutoff_date": cutoff_date.isoformat(),
            "errors": errors if errors else None,
        }

        # Update metrics
        try:
            metrics = get_metrics()
            metrics.increment_gc_runs(dry_run=dry_run)
            metrics.increment_frames_deleted(total_deleted, dry_run=dry_run)
        except Exception:
            # Don't fail GC if metrics fail
            pass

        logger.info(
            "gc_completed",
            frames_deleted=total_deleted,
            bytes_freed=total_bytes_freed,
            dry_run=dry_run,
            retention_days=retention_days,
            error_count=len(errors) if errors else 0
        )
        return result

    async def migrate_frames(
        self,
        from_backend: str,
        to_backend: str,
        dry_run: bool = True,
        batch_size: int = 100,
        frame_limit: Optional[int] = None,
    ) -> dict:
        """Migrate frames between storage backends.

        Note: This is a placeholder implementation. Full implementation
        would require secondary storage backend instances.

        Args:
            from_backend: Source backend identifier
            to_backend: Destination backend identifier
            dry_run: If True, only count without migrating
            batch_size: Frames per batch
            frame_limit: Max frames to migrate

        Returns:
            Migration stats
        """
        # This is a placeholder - full implementation would:
        # 1. Fetch frames from source backend
        # 2. Store to destination backend
        # 3. Update storage_url in database
        # 4. Log MIGRATE actions

        logger.info(f"Migration requested: {from_backend} -> {to_backend}")

        return {
            "dry_run": dry_run,
            "from_backend": from_backend,
            "to_backend": to_backend,
            "frames_migrated": 0,
            "status": "not_implemented",
            "message": "Migration requires secondary storage backend configuration",
        }

    async def get_audit_log(
        self,
        frame_id: Optional[UUID] = None,
        action: Optional[str] = None,
        actor: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[ArchiveAuditLogResponse]:
        """Get audit log entries.

        Args:
            frame_id: Filter by specific frame
            action: Filter by action type
            actor: Filter by actor
            limit: Max entries to return
            offset: Pagination offset

        Returns:
            List of audit log entries
        """
        conditions = []
        params: List[Optional[object]] = []
        param_idx = 1

        if frame_id:
            conditions.append(f"frame_id = ${param_idx}")
            params.append(frame_id)
            param_idx += 1

        if action:
            conditions.append(f"action = ${param_idx}")
            params.append(action)
            param_idx += 1

        if actor:
            conditions.append(f"actor = ${param_idx}")
            params.append(actor)
            param_idx += 1

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        query = f"""
            SELECT log_id, frame_id, action, actor, metadata, created_at
            FROM archive_audit_log
            {where_clause}
            ORDER BY created_at DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])

        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)

        return [
            ArchiveAuditLogResponse(
                log_id=row["log_id"],
                frame_id=row["frame_id"],
                action=row["action"],
                actor=row["actor"],
                metadata=AuditMetadata(**(row["metadata"] or {})),
                created_at=row["created_at"],
            )
            for row in rows
        ]

    async def health_check(self) -> dict:
        """Check archival service health.

        Returns:
            Health status from storage and database
        """
        storage_health = await self.storage.health_check()

        db_healthy = False
        db_latency_ms = 0.0
        try:
            start = time.time()
            async with self.db_pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            db_latency_ms = (time.time() - start) * 1000
            db_healthy = True
        except Exception as e:
            logger.error(
                "health_check_db_failed",
                error=str(e)
            )

        return {
            "healthy": storage_health["healthy"] and db_healthy,
            "storage": storage_health,
            "database": {
                "healthy": db_healthy,
                "latency_ms": round(db_latency_ms, 2),
            },
        }

    async def health_check_db(self) -> dict:
        """Check database connectivity.
        
        Returns:
            Dict with status information
            
        Raises:
            Exception: If database is not accessible
        """
        async with self.db_pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            if result != 1:
                raise Exception("Database health check query failed")
        return {"status": "up"}

    async def health_check_storage(self) -> dict:
        """Check storage backend health.
        
        Returns:
            Dict with status information
            
        Raises:
            Exception: If storage is not accessible
        """
        storage_health = await self.storage.health_check()
        if not storage_health.get("healthy"):
            raise Exception(storage_health.get("error", "Storage health check failed"))
        return {"status": "up", "backend": storage_health.get("backend", "unknown")}

    # Private helper methods

    async def _create_manifest(
        self,
        extraction_job_id: UUID,
        expected_frames: int,
    ) -> UUID:
        """Create a new manifest for frame upload."""
        manifest_id = uuid4()

        async with self.db_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO archive_manifests (
                    manifest_id, extraction_job_id, total_frames,
                    unique_frames, storage_size_bytes, dedup_ratio, created_at
                ) VALUES ($1, $2, $3, 0, 0, 1.0, NOW())
                """,
                manifest_id,
                extraction_job_id,
                expected_frames,
            )

        return manifest_id

    async def _update_manifest_stats(self, manifest_id: UUID, additional_frames: int):
        """Update manifest expected frame count."""
        async with self.db_pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE archive_manifests
                SET total_frames = total_frames + $1
                WHERE manifest_id = $2
                """,
                additional_frames,
                manifest_id,
            )

    async def _finalize_manifest(
        self,
        conn: asyncpg.Connection,
        manifest_id: UUID,
        unique_frames: int,
    ):
        """Finalize manifest after upload completion."""
        # Calculate actual stats
        row = await conn.fetchrow(
            """
            SELECT
                total_frames,
                COALESCE(SUM(jpeg_size_bytes), 0) as total_bytes
            FROM archive_manifests am
            LEFT JOIN archive_frames af ON am.manifest_id = af.manifest_id
            WHERE am.manifest_id = $1
            GROUP BY am.manifest_id, am.total_frames
            """,
            manifest_id,
        )

        if row:
            total_frames = row["total_frames"] or unique_frames
            dedup_ratio = unique_frames / total_frames if total_frames > 0 else 1.0

            await conn.execute(
                """
                UPDATE archive_manifests
                SET unique_frames = $1,
                    storage_size_bytes = $2,
                    dedup_ratio = $3,
                    archived_at = NOW()
                WHERE manifest_id = $4
                """,
                unique_frames,
                row["total_bytes"],
                dedup_ratio,
                manifest_id,
            )

    async def _get_frame_by_hash(
        self,
        conn: asyncpg.Connection,
        content_hash: str,
    ) -> Optional[UUID]:
        """Get frame ID by content hash."""
        row = await conn.fetchrow(
            "SELECT frame_id FROM archive_frames WHERE content_hash = $1",
            content_hash,
        )
        return row["frame_id"] if row else None

    async def _log_action(
        self,
        conn: asyncpg.Connection,
        frame_id: UUID,
        action: str,
        actor: str,
        metadata: dict,
    ):
        """Log an action to the audit log."""
        await conn.execute(
            """
            INSERT INTO archive_audit_log (frame_id, action, actor, metadata, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            """,
            frame_id,
            action,
            actor,
            metadata,
        )
