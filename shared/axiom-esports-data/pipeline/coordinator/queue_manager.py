"""
Priority queue manager with game isolation for the dual-game pipeline coordinator.

Provides separate priority queues for Counter-Strike and Valorant to prevent
resource contention and enable game-specific scaling.
"""

from __future__ import annotations

import asyncio
import heapq
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, AsyncIterator, Optional
from uuid import UUID

from pipeline.coordinator.models import (
    ExtractionJob,
    GameType,
    JobBatch,
    JobPriority,
    JobStatus,
    QueueStats,
)

logger = logging.getLogger(__name__)


@dataclass(order=True)
class QueueEntry:
    """
    Internal queue entry with sortable priority.
    
    Uses heapq-compatible ordering with tie-breaking by creation time.
    """
    # Priority fields (must come first for heapq ordering)
    priority_value: int = field(compare=True)
    created_at: datetime = field(compare=True)
    
    # Non-sorting fields
    job_id: UUID = field(compare=False)
    job: ExtractionJob = field(compare=False)
    
    @classmethod
    def from_job(cls, job: ExtractionJob) -> QueueEntry:
        """Create queue entry from extraction job."""
        return cls(
            priority_value=job.priority.value,
            created_at=job.created_at,
            job_id=job.id,
            job=job,
        )


class GameQueue:
    """
    Priority queue for a single game type.
    
    Thread-safe with async locking for concurrent access.
    """
    
    def __init__(self, game: GameType):
        self.game = game
        self._heap: list[QueueEntry] = []
        self._job_map: dict[UUID, QueueEntry] = {}
        self._processing: dict[UUID, ExtractionJob] = {}
        self._completed: list[ExtractionJob] = []  # Recent completions (bounded)
        self._failed: list[ExtractionJob] = []     # Recent failures (bounded)
        self._lock = asyncio.Lock()
        self._max_history = 10000  # Keep last N completed/failed jobs
        
    async def enqueue(self, job: ExtractionJob) -> None:
        """
        Add a job to the queue.
        
        Args:
            job: ExtractionJob to enqueue
            
        Raises:
            ValueError: If job game doesn't match queue game
        """
        if job.game != self.game:
            raise ValueError(
                f"Cannot enqueue {job.game.value} job in {self.game.value} queue"
            )
        
        async with self._lock:
            entry = QueueEntry.from_job(job)
            heapq.heappush(self._heap, entry)
            self._job_map[job.id] = entry
            job.status = JobStatus.PENDING
            
        logger.debug(f"Enqueued job {job.id} in {self.game.value} queue "
                     f"(priority={job.priority.name})")

    async def enqueue_batch(self, batch: JobBatch) -> None:
        """
        Add all jobs from a batch to the queue.
        
        Args:
            batch: JobBatch containing jobs to enqueue
        """
        if batch.game != self.game:
            raise ValueError(
                f"Cannot enqueue {batch.game.value} batch in {self.game.value} queue"
            )
        
        async with self._lock:
            for job in batch.jobs:
                if job.status == JobStatus.PENDING:
                    entry = QueueEntry.from_job(job)
                    heapq.heappush(self._heap, entry)
                    self._job_map[job.id] = entry
        
        logger.info(f"Enqueued batch {batch.id} with {len(batch.jobs)} jobs "
                    f"in {self.game.value} queue")

    async def dequeue(self) -> Optional[ExtractionJob]:
        """
        Get the highest priority job from the queue.
        
        Returns:
            Highest priority ExtractionJob, or None if queue is empty
        """
        async with self._lock:
            while self._heap:
                entry = heapq.heappop(self._heap)
                
                # Skip if job was cancelled or already assigned
                if entry.job.status != JobStatus.PENDING:
                    self._job_map.pop(entry.job_id, None)
                    continue
                
                # Move to processing
                self._processing[entry.job_id] = entry.job
                self._job_map.pop(entry.job_id, None)
                entry.job.mark_started()
                
                logger.debug(f"Dequeued job {entry.job_id} from {self.game.value} queue")
                return entry.job
            
            return None

    async def peek(self) -> Optional[ExtractionJob]:
        """
        View the highest priority job without removing it.
        
        Returns:
            Highest priority ExtractionJob, or None if queue is empty
        """
        async with self._lock:
            while self._heap:
                entry = self._heap[0]
                if entry.job.status == JobStatus.PENDING:
                    return entry.job
                # Remove stale entries
                heapq.heappop(self._heap)
                self._job_map.pop(entry.job_id, None)
            return None

    async def get_job(self, job_id: UUID) -> Optional[ExtractionJob]:
        """
        Get a job by ID from any state (pending, processing, or completed).
        
        Args:
            job_id: UUID of job to find
            
        Returns:
            ExtractionJob if found, None otherwise
        """
        async with self._lock:
            # Check pending
            if job_id in self._job_map:
                return self._job_map[job_id].job
            
            # Check processing
            if job_id in self._processing:
                return self._processing[job_id]
            
            # Check completed/failed (recent only)
            for job in self._completed:
                if job.id == job_id:
                    return job
            for job in self._failed:
                if job.id == job_id:
                    return job
            
            return None

    async def complete_job(
        self,
        job_id: UUID,
        result: Optional[dict[str, Any]] = None,
        processing_time_ms: Optional[int] = None,
    ) -> bool:
        """
        Mark a job as completed.
        
        Args:
            job_id: UUID of job to complete
            result: Optional result data
            processing_time_ms: Optional processing time
            
        Returns:
            True if job was found and completed, False otherwise
        """
        async with self._lock:
            job = self._processing.pop(job_id, None)
            if not job:
                return False
            
            job.mark_completed(result or {})
            if processing_time_ms:
                job._processing_time_ms = processing_time_ms
            
            self._completed.append(job)
            if len(self._completed) > self._max_history:
                self._completed.pop(0)
            
            logger.debug(f"Completed job {job_id} in {self.game.value} queue")
            return True

    async def fail_job(
        self,
        job_id: UUID,
        error: str,
        error_code: Optional[str] = None,
        retry: bool = False,
    ) -> bool:
        """
        Mark a job as failed.
        
        Args:
            job_id: UUID of job to fail
            error: Error message
            error_code: Optional error code
            retry: Whether to requeue for retry
            
        Returns:
            True if job was found and marked failed, False otherwise
        """
        async with self._lock:
            job = self._processing.pop(job_id, None)
            if not job:
                return False
            
            job.mark_failed(error, error_code)
            
            if retry and job.is_retryable():
                # Requeue with same priority
                entry = QueueEntry.from_job(job)
                heapq.heappush(self._heap, entry)
                self._job_map[job.id] = entry
                job.status = JobStatus.PENDING
                logger.info(f"Requeued job {job_id} for retry "
                            f"(attempt {job.retry_count}/{job.max_retries})")
            else:
                self._failed.append(job)
                if len(self._failed) > self._max_history:
                    self._failed.pop(0)
                logger.warning(f"Failed job {job_id} in {self.game.value} queue: {error}")
            
            return True

    async def cancel_job(self, job_id: UUID) -> bool:
        """
        Cancel a pending job.
        
        Args:
            job_id: UUID of job to cancel
            
        Returns:
            True if job was found and cancelled, False otherwise
        """
        async with self._lock:
            entry = self._job_map.get(job_id)
            if entry and entry.job.status == JobStatus.PENDING:
                entry.job.status = JobStatus.CANCELLED
                self._job_map.pop(job_id, None)
                logger.info(f"Cancelled job {job_id} in {self.game.value} queue")
                return True
            return False

    async def get_stats(self) -> QueueStats:
        """
        Get current queue statistics.
        
        Returns:
            QueueStats with current metrics
        """
        async with self._lock:
            now = datetime.utcnow()
            cutoff_24h = now - timedelta(hours=24)
            
            # Count completed in last 24h
            completed_24h = sum(
                1 for j in self._completed
                if j.completed_at and j.completed_at > cutoff_24h
            )
            failed_24h = sum(
                1 for j in self._failed
                if j.completed_at and j.completed_at > cutoff_24h
            )
            
            # Calculate oldest pending
            oldest_age: Optional[float] = None
            for entry in self._heap:
                if entry.job.status == JobStatus.PENDING:
                    age = (now - entry.created_at).total_seconds()
                    if oldest_age is None or age > oldest_age:
                        oldest_age = age
            
            # Calculate average wait time for pending jobs
            total_wait = 0.0
            pending_count = 0
            for entry in self._heap:
                if entry.job.status == JobStatus.PENDING:
                    total_wait += (now - entry.created_at).total_seconds()
                    pending_count += 1
            
            avg_wait = total_wait / pending_count if pending_count > 0 else None
            
            # Determine health
            pending = len([e for e in self._heap if e.job.status == JobStatus.PENDING])
            if pending > 1000 or (oldest_age and oldest_age > 3600):
                health = "critical"
            elif pending > 500 or (oldest_age and oldest_age > 1800):
                health = "warning"
            else:
                health = "healthy"
            
            return QueueStats(
                game=self.game,
                pending=pending,
                processing=len(self._processing),
                completed_24h=completed_24h,
                failed_24h=failed_24h,
                avg_wait_time_seconds=avg_wait,
                oldest_job_age_seconds=oldest_age,
                health=health,
            )

    async def list_pending(
        self,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> list[ExtractionJob]:
        """
        List pending jobs in priority order.
        
        Args:
            limit: Maximum number of jobs to return
            offset: Number of jobs to skip
            
        Returns:
            List of pending ExtractionJobs
        """
        async with self._lock:
            # Sort by heap order (priority, then creation time)
            sorted_entries = sorted(self._heap)
            pending = [
                e.job for e in sorted_entries
                if e.job.status == JobStatus.PENDING
            ]
            
            if offset:
                pending = pending[offset:]
            if limit:
                pending = pending[:limit]
            
            return pending

    async def list_processing(self) -> list[ExtractionJob]:
        """List all currently processing jobs."""
        async with self._lock:
            return list(self._processing.values())

    async def requeue_stuck_jobs(self, timeout_seconds: float = 300.0) -> int:
        """
        Requeue jobs that have been processing too long.
        
        Args:
            timeout_seconds: Maximum time allowed for processing
            
        Returns:
            Number of jobs requeued
        """
        async with self._lock:
            now = datetime.utcnow()
            stuck: list[UUID] = []
            
            for job_id, job in self._processing.items():
                if job.started_at:
                    elapsed = (now - job.started_at).total_seconds()
                    if elapsed > timeout_seconds:
                        stuck.append(job_id)
            
            requeued = 0
            for job_id in stuck:
                job = self._processing.pop(job_id)
                job.status = JobStatus.PENDING
                job.started_at = None
                entry = QueueEntry.from_job(job)
                heapq.heappush(self._heap, entry)
                self._job_map[job_id] = entry
                requeued += 1
                logger.warning(f"Requeued stuck job {job_id} after {timeout_seconds}s")
            
            return requeued


class QueueManager:
    """
    Manager for dual-game priority queues.
    
    Provides isolated queues for Counter-Strike and Valorant with
    unified management interface.
    """
    
    def __init__(self):
        self._queues: dict[GameType, GameQueue] = {
            GameType.CS: GameQueue(GameType.CS),
            GameType.VALORANT: GameQueue(GameType.VALORANT),
        }
        self._cleanup_task: Optional[asyncio.Task] = None
        self._running = False
    
    def get_queue(self, game: GameType) -> GameQueue:
        """
        Get the queue for a specific game.
        
        Args:
            game: GameType to get queue for
            
        Returns:
            GameQueue for the specified game
        """
        return self._queues[game]
    
    async def enqueue(self, job: ExtractionJob) -> None:
        """Enqueue a job in the appropriate game queue."""
        await self._queues[job.game].enqueue(job)
    
    async def enqueue_batch(self, batch: JobBatch) -> None:
        """Enqueue all jobs from a batch."""
        await self._queues[batch.game].enqueue_batch(batch)
    
    async def dequeue(self, game: GameType) -> Optional[ExtractionJob]:
        """Dequeue the highest priority job for a game."""
        return await self._queues[game].dequeue()
    
    async def get_job(self, job_id: UUID, game: Optional[GameType] = None) -> Optional[ExtractionJob]:
        """
        Get a job by ID.
        
        Args:
            job_id: UUID of job to find
            game: Optional game hint to narrow search
            
        Returns:
            ExtractionJob if found, None otherwise
        """
        if game:
            return await self._queues[game].get_job(job_id)
        
        for queue in self._queues.values():
            job = await queue.get_job(job_id)
            if job:
                return job
        return None
    
    async def complete_job(
        self,
        job_id: UUID,
        game: GameType,
        result: Optional[dict[str, Any]] = None,
        processing_time_ms: Optional[int] = None,
    ) -> bool:
        """Mark a job as completed."""
        return await self._queues[game].complete_job(job_id, result, processing_time_ms)
    
    async def fail_job(
        self,
        job_id: UUID,
        game: GameType,
        error: str,
        error_code: Optional[str] = None,
        retry: bool = False,
    ) -> bool:
        """Mark a job as failed."""
        return await self._queues[game].fail_job(job_id, error, error_code, retry)
    
    async def cancel_job(self, job_id: UUID, game: GameType) -> bool:
        """Cancel a pending job."""
        return await self._queues[game].cancel_job(job_id)
    
    async def get_stats(self) -> dict[GameType, QueueStats]:
        """Get statistics for all queues."""
        return {
            game: await queue.get_stats()
            for game, queue in self._queues.items()
        }
    
    async def get_all_stats(self) -> list[QueueStats]:
        """Get statistics for all queues as a list."""
        return [await queue.get_stats() for queue in self._queues.values()]
    
    async def start(self) -> None:
        """Start background maintenance tasks."""
        self._running = True
        self._cleanup_task = asyncio.create_task(self._maintenance_loop())
        logger.info("Queue manager started")
    
    async def stop(self) -> None:
        """Stop background maintenance tasks."""
        self._running = False
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        logger.info("Queue manager stopped")
    
    async def _maintenance_loop(self) -> None:
        """Background loop for maintenance tasks."""
        while self._running:
            try:
                for queue in self._queues.values():
                    requeued = await queue.requeue_stuck_jobs(timeout_seconds=600.0)
                    if requeued > 0:
                        logger.warning(f"Requeued {requeued} stuck jobs in {queue.game.value}")
            except Exception as e:
                logger.error(f"Error in queue maintenance: {e}")
            
            await asyncio.sleep(60.0)  # Check every minute


# Global queue manager instance
_queue_manager: Optional[QueueManager] = None


def get_queue_manager() -> QueueManager:
    """Get or create the global queue manager instance."""
    global _queue_manager
    if _queue_manager is None:
        _queue_manager = QueueManager()
    return _queue_manager
