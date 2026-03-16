"""
SQLite Task Queue - Zero-Cost Harvest Scheduling

A production-grade task queue implementation using SQLite as the backend.
Provides priority queuing, exponential backoff retries, dead letter queue,
and comprehensive metrics - all with zero external dependencies.

CRITICAL: This module uses only built-in Python libraries (sqlite3).
No Redis, no paid services, zero additional costs.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum, auto
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from contextlib import contextmanager


class TaskStatus(Enum):
    """Task lifecycle states."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    DEAD_LETTER = "dead_letter"


class TaskSource(Enum):
    """Origin of the harvest task."""
    VLR_GG = "vlr_gg"
    RIOT_API = "riot_api"
    MANUAL = "manual"
    BACKFILL = "backfill"
    REALTIME_WATCH = "realtime_watch"


class TaskType(Enum):
    """Types of harvest operations."""
    MATCH_SCRAPE = "match_scrape"
    PLAYER_SCRAPE = "player_scrape"
    TEAM_SCRAPE = "team_scrape"
    TOURNAMENT_SCRAPE = "tournament_scrape"
    STATS_AGGREGATE = "stats_aggregate"
    INDEX_BUILD = "index_build"


@dataclass
class HarvestTask:
    """
    Represents a single harvest task.
    
    Attributes:
        task_type: Type of harvest operation
        source: Origin of the task
        payload: Task-specific data (URLs, IDs, etc.)
        priority: Queue priority (1-10, lower is higher priority)
        scheduled_at: When to execute the task
        retry_count: Number of retry attempts
        max_retries: Maximum retry attempts before dead letter
        created_at: Task creation timestamp
        task_id: Unique identifier (auto-generated)
        status: Current task status
        started_at: When execution began
        completed_at: When execution finished
        error_message: Last error if failed
    """
    task_type: TaskType
    source: TaskSource
    payload: Dict[str, Any] = field(default_factory=dict)
    priority: int = 5  # Default medium priority
    scheduled_at: datetime = field(default_factory=datetime.utcnow)
    retry_count: int = 0
    max_retries: int = 3
    created_at: datetime = field(default_factory=datetime.utcnow)
    task_id: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    def __post_init__(self):
        if self.task_id is None:
            self.task_id = f"{self.source.value}_{int(time.time() * 1000)}_{id(self)}"
        if not 1 <= self.priority <= 10:
            raise ValueError("Priority must be between 1 and 10")
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize task to dictionary."""
        return {
            "task_id": self.task_id,
            "task_type": self.task_type.value,
            "source": self.source.value,
            "payload": json.dumps(self.payload),
            "priority": self.priority,
            "scheduled_at": self.scheduled_at.isoformat(),
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "created_at": self.created_at.isoformat(),
            "status": self.status.value,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> HarvestTask:
        """Deserialize task from dictionary."""
        return cls(
            task_id=data["task_id"],
            task_type=TaskType(data["task_type"]),
            source=TaskSource(data["source"]),
            payload=json.loads(data["payload"]),
            priority=data["priority"],
            scheduled_at=datetime.fromisoformat(data["scheduled_at"]),
            retry_count=data["retry_count"],
            max_retries=data["max_retries"],
            created_at=datetime.fromisoformat(data["created_at"]),
            status=TaskStatus(data["status"]),
            started_at=datetime.fromisoformat(data["started_at"]) if data["started_at"] else None,
            completed_at=datetime.fromisoformat(data["completed_at"]) if data["completed_at"] else None,
            error_message=data["error_message"],
        )


class SQLiteTaskQueue:
    """
    Production-grade SQLite-based task queue.
    
    Features:
    - Priority queue support (1-10)
    - Exponential backoff for retries
    - Dead letter queue for failed tasks
    - Thread-safe operations
    - Comprehensive metrics
    - Zero external dependencies
    
    Usage:
        queue = SQLiteTaskQueue("/path/to/queue.db")
        task = HarvestTask(TaskType.MATCH_SCRAPE, TaskSource.VLR_GG, {"url": "..."})
        queue.enqueue(task)
        
        # Worker loop
        task = queue.dequeue()
        if task:
            try:
                # Process task
                queue.complete(task.task_id)
            except Exception as e:
                queue.fail(task.task_id, str(e))
    """
    
    # Exponential backoff: 30s, 60s, 120s, 240s, 480s...
    BASE_RETRY_DELAY = 30  # seconds
    MAX_RETRY_DELAY = 3600  # 1 hour max
    
    def __init__(self, db_path: Union[str, Path], max_workers: int = 4):
        """
        Initialize the task queue.
        
        Args:
            db_path: Path to SQLite database file
            max_workers: Maximum concurrent workers (for metrics)
        """
        self.db_path = Path(db_path)
        self.max_workers = max_workers
        self._local = threading.local()
        self._init_db()
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get thread-local database connection."""
        if not hasattr(self._local, 'connection') or self._local.connection is None:
            self._local.connection = sqlite3.connect(
                str(self.db_path),
                check_same_thread=False,
                timeout=30.0,
                isolation_level=None  # Autocommit mode for better concurrency
            )
            self._local.connection.row_factory = sqlite3.Row
            # Enable WAL mode for better concurrent access
            self._local.connection.execute("PRAGMA journal_mode=WAL")
            self._local.connection.execute("PRAGMA synchronous=NORMAL")
        return self._local.connection
    
    def _init_db(self) -> None:
        """Initialize database schema."""
        conn = self._get_connection()
        
        # Main task queue table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS task_queue (
                task_id TEXT PRIMARY KEY,
                task_type TEXT NOT NULL,
                source TEXT NOT NULL,
                payload TEXT NOT NULL,
                priority INTEGER NOT NULL DEFAULT 5,
                scheduled_at TEXT NOT NULL,
                retry_count INTEGER NOT NULL DEFAULT 0,
                max_retries INTEGER NOT NULL DEFAULT 3,
                created_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                started_at TEXT,
                completed_at TEXT,
                error_message TEXT,
                worker_id TEXT
            )
        """)
        
        # Indexes for efficient querying
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_queue_status_priority 
            ON task_queue(status, priority, scheduled_at)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_queue_scheduled 
            ON task_queue(scheduled_at) WHERE status IN ('pending', 'retrying')
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_queue_source 
            ON task_queue(source, created_at)
        """)
        
        # Dead letter queue for permanently failed tasks
        conn.execute("""
            CREATE TABLE IF NOT EXISTS failed_tasks (
                task_id TEXT PRIMARY KEY,
                task_type TEXT NOT NULL,
                source TEXT NOT NULL,
                payload TEXT NOT NULL,
                priority INTEGER NOT NULL,
                retry_count INTEGER NOT NULL,
                max_retries INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                failed_at TEXT NOT NULL,
                error_message TEXT,
                final_error TEXT NOT NULL
            )
        """)
        
        # Queue metrics table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS queue_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                pending_count INTEGER NOT NULL DEFAULT 0,
                running_count INTEGER NOT NULL DEFAULT 0,
                completed_count INTEGER NOT NULL DEFAULT 0,
                failed_count INTEGER NOT NULL DEFAULT 0,
                dead_letter_count INTEGER NOT NULL DEFAULT 0,
                avg_processing_time REAL,
                throughput_per_minute REAL
            )
        """)
        
        conn.commit()
    
    def enqueue(
        self,
        task: HarvestTask,
        replace_existing: bool = False
    ) -> str:
        """
        Add a task to the queue.
        
        Args:
            task: The harvest task to enqueue
            replace_existing: If True, replace task with same ID
            
        Returns:
            task_id of the enqueued task
        """
        conn = self._get_connection()
        data = task.to_dict()
        
        if replace_existing:
            conn.execute("""
                INSERT OR REPLACE INTO task_queue (
                    task_id, task_type, source, payload, priority,
                    scheduled_at, retry_count, max_retries, created_at,
                    status, started_at, completed_at, error_message
                ) VALUES (
                    :task_id, :task_type, :source, :payload, :priority,
                    :scheduled_at, :retry_count, :max_retries, :created_at,
                    :status, :started_at, :completed_at, :error_message
                )
            """, data)
        else:
            try:
                conn.execute("""
                    INSERT INTO task_queue (
                        task_id, task_type, source, payload, priority,
                        scheduled_at, retry_count, max_retries, created_at,
                        status, started_at, completed_at, error_message
                    ) VALUES (
                        :task_id, :task_type, :source, :payload, :priority,
                        :scheduled_at, :retry_count, :max_retries, :created_at,
                        :status, :started_at, :completed_at, :error_message
                    )
                """, data)
            except sqlite3.IntegrityError:
                # Task already exists, ignore
                pass
        
        conn.commit()
        return task.task_id
    
    def dequeue(
        self,
        worker_id: Optional[str] = None,
        task_types: Optional[List[TaskType]] = None,
        sources: Optional[List[TaskSource]] = None
    ) -> Optional[HarvestTask]:
        """
        Fetch the next available task from the queue.
        
        Uses a priority + scheduled_at ordering for fair processing.
        Implements atomic claim to prevent duplicate processing.
        
        Args:
            worker_id: Identifier for the claiming worker
            task_types: Filter by specific task types
            sources: Filter by specific sources
            
        Returns:
            HarvestTask if available, None otherwise
        """
        conn = self._get_connection()
        now = datetime.now(timezone.utc).isoformat()
        
        # Build query with optional filters
        type_filter = ""
        source_filter = ""
        params = [now, TaskStatus.PENDING.value, TaskStatus.RETRYING.value]
        
        if task_types:
            placeholders = ",".join(["?"] * len(task_types))
            type_filter = f"AND task_type IN ({placeholders})"
            params.extend([t.value for t in task_types])
        
        if sources:
            placeholders = ",".join(["?"] * len(sources))
            source_filter = f"AND source IN ({placeholders})"
            params.extend([s.value for s in sources])
        
        # Atomic claim using SELECT + UPDATE pattern
        # First, try to find and claim a task
        conn.execute("BEGIN IMMEDIATE")
        try:
            cursor = conn.execute(f"""
                SELECT * FROM task_queue
                WHERE scheduled_at <= ?
                  AND status IN (?, ?)
                  {type_filter}
                  {source_filter}
                ORDER BY priority ASC, scheduled_at ASC
                LIMIT 1
            """, params)
            
            row = cursor.fetchone()
            if not row:
                conn.execute("COMMIT")
                return None
            
            task_id = row["task_id"]
            started_at = datetime.now(timezone.utc).isoformat()
            
            # Claim the task
            conn.execute("""
                UPDATE task_queue
                SET status = ?, started_at = ?, worker_id = ?
                WHERE task_id = ? AND status IN (?, ?)
            """, (
                TaskStatus.RUNNING.value,
                started_at,
                worker_id,
                task_id,
                TaskStatus.PENDING.value,
                TaskStatus.RETRYING.value
            ))
            
            if conn.total_changes == 0:
                # Another worker claimed it
                conn.execute("COMMIT")
                return None
            
            conn.execute("COMMIT")
            
            # Fetch the updated task
            cursor = conn.execute(
                "SELECT * FROM task_queue WHERE task_id = ?",
                (task_id,)
            )
            row = cursor.fetchone()
            return HarvestTask.from_dict(dict(row)) if row else None
            
        except Exception:
            conn.execute("ROLLBACK")
            raise
    
    def complete(self, task_id: str) -> bool:
        """
        Mark a task as completed.
        
        Args:
            task_id: ID of the task to complete
            
        Returns:
            True if task was found and updated
        """
        conn = self._get_connection()
        completed_at = datetime.now(timezone.utc).isoformat()
        
        conn.execute("""
            UPDATE task_queue
            SET status = ?, completed_at = ?
            WHERE task_id = ?
        """, (TaskStatus.COMPLETED.value, completed_at, task_id))
        
        conn.commit()
        return conn.total_changes > 0
    
    def fail(
        self,
        task_id: str,
        error_message: str,
        retry: bool = True
    ) -> bool:
        """
        Mark a task as failed with optional retry.
        
        Implements exponential backoff for retries. If max retries
        exceeded, moves task to dead letter queue.
        
        Args:
            task_id: ID of the failed task
            error_message: Error description
            retry: Whether to schedule for retry
            
        Returns:
            True if task was handled (retried or dead-lettered)
        """
        conn = self._get_connection()
        
        # Get current task info
        cursor = conn.execute(
            "SELECT * FROM task_queue WHERE task_id = ?",
            (task_id,)
        )
        row = cursor.fetchone()
        if not row:
            return False
        
        task = HarvestTask.from_dict(dict(row))
        
        # Check if we should retry
        if retry and task.retry_count < task.max_retries:
            # Calculate exponential backoff
            delay = min(
                self.BASE_RETRY_DELAY * (2 ** task.retry_count),
                self.MAX_RETRY_DELAY
            )
            next_scheduled = datetime.now(timezone.utc) + timedelta(seconds=delay)
            
            conn.execute("""
                UPDATE task_queue
                SET status = ?,
                    retry_count = retry_count + 1,
                    scheduled_at = ?,
                    error_message = ?,
                    started_at = NULL,
                    worker_id = NULL
                WHERE task_id = ?
            """, (
                TaskStatus.RETRYING.value,
                next_scheduled.isoformat(),
                error_message,
                task_id
            ))
        else:
            # Move to dead letter queue
            conn.execute("""
                INSERT INTO failed_tasks (
                    task_id, task_type, source, payload, priority,
                    retry_count, max_retries, created_at, failed_at,
                    error_message, final_error
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task.task_id,
                task.task_type.value,
                task.source.value,
                json.dumps(task.payload),
                task.priority,
                task.retry_count,
                task.max_retries,
                task.created_at.isoformat(),
                datetime.now(timezone.utc).isoformat(),
                task.error_message,
                error_message
            ))
            
            # Remove from main queue
            conn.execute("DELETE FROM task_queue WHERE task_id = ?", (task_id,))
        
        conn.commit()
        return True
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get comprehensive queue metrics.
        
        Returns:
            Dictionary with counts, processing times, and rates
        """
        conn = self._get_connection()
        
        # Count by status
        cursor = conn.execute("""
            SELECT status, COUNT(*) as count
            FROM task_queue
            GROUP BY status
        """)
        status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}
        
        # Dead letter count
        cursor = conn.execute("SELECT COUNT(*) as count FROM failed_tasks")
        dead_letter_count = cursor.fetchone()["count"]
        
        # Average processing time for completed tasks
        cursor = conn.execute("""
            SELECT AVG(
                julianday(completed_at) - julianday(started_at)
            ) * 24 * 60 * 60 as avg_seconds
            FROM task_queue
            WHERE status = ? AND started_at IS NOT NULL AND completed_at IS NOT NULL
        """, (TaskStatus.COMPLETED.value,))
        row = cursor.fetchone()
        avg_processing_time = row["avg_seconds"] if row and row["avg_seconds"] else 0
        
        # Throughput (completed per minute, last hour)
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        cursor = conn.execute("""
            SELECT COUNT(*) as count
            FROM task_queue
            WHERE status = ? AND completed_at > ?
        """, (TaskStatus.COMPLETED.value, one_hour_ago))
        completed_last_hour = cursor.fetchone()["count"]
        throughput = completed_last_hour / 60.0  # per minute
        
        # Tasks by source
        cursor = conn.execute("""
            SELECT source, COUNT(*) as count
            FROM task_queue
            WHERE status IN (?, ?)
            GROUP BY source
        """, (TaskStatus.PENDING.value, TaskStatus.RETRYING.value))
        pending_by_source = {row["source"]: row["count"] for row in cursor.fetchall()}
        
        # Tasks by type
        cursor = conn.execute("""
            SELECT task_type, COUNT(*) as count
            FROM task_queue
            WHERE status IN (?, ?)
            GROUP BY task_type
        """, (TaskStatus.PENDING.value, TaskStatus.RETRYING.value))
        pending_by_type = {row["task_type"]: row["count"] for row in cursor.fetchall()}
        
        return {
            "pending": status_counts.get(TaskStatus.PENDING.value, 0),
            "running": status_counts.get(TaskStatus.RUNNING.value, 0),
            "completed": status_counts.get(TaskStatus.COMPLETED.value, 0),
            "failed": status_counts.get(TaskStatus.FAILED.value, 0),
            "retrying": status_counts.get(TaskStatus.RETRYING.value, 0),
            "dead_letter": dead_letter_count,
            "total_active": sum([
                status_counts.get(TaskStatus.PENDING.value, 0),
                status_counts.get(TaskStatus.RUNNING.value, 0),
                status_counts.get(TaskStatus.RETRYING.value, 0)
            ]),
            "avg_processing_time_seconds": round(avg_processing_time, 2) if avg_processing_time else 0,
            "throughput_per_minute": round(throughput, 2),
            "pending_by_source": pending_by_source,
            "pending_by_type": pending_by_type,
            "max_workers": self.max_workers,
        }
    
    def record_metrics(self) -> None:
        """Record current metrics snapshot to database."""
        conn = self._get_connection()
        metrics = self.get_metrics()
        
        conn.execute("""
            INSERT INTO queue_metrics (
                pending_count, running_count, completed_count,
                failed_count, dead_letter_count, avg_processing_time,
                throughput_per_minute
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            metrics["pending"],
            metrics["running"],
            metrics["completed"],
            metrics["failed"],
            metrics["dead_letter"],
            metrics["avg_processing_time_seconds"],
            metrics["throughput_per_minute"]
        ))
        
        conn.commit()
    
    def get_task(self, task_id: str) -> Optional[HarvestTask]:
        """Get a specific task by ID."""
        conn = self._get_connection()
        cursor = conn.execute(
            "SELECT * FROM task_queue WHERE task_id = ?",
            (task_id,)
        )
        row = cursor.fetchone()
        return HarvestTask.from_dict(dict(row)) if row else None
    
    def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending or retrying task."""
        conn = self._get_connection()
        conn.execute("""
            DELETE FROM task_queue
            WHERE task_id = ? AND status IN (?, ?)
        """, (task_id, TaskStatus.PENDING.value, TaskStatus.RETRYING.value))
        conn.commit()
        return conn.total_changes > 0
    
    def requeue_dead_letter(
        self,
        task_id: Optional[str] = None,
        max_retries: Optional[int] = None
    ) -> int:
        """
        Requeue tasks from dead letter queue for retry.
        
        Args:
            task_id: Specific task to requeue, or None for all
            max_retries: New max retries value
            
        Returns:
            Number of tasks requeued
        """
        conn = self._get_connection()
        
        if task_id:
            cursor = conn.execute(
                "SELECT * FROM failed_tasks WHERE task_id = ?",
                (task_id,)
            )
        else:
            cursor = conn.execute("SELECT * FROM failed_tasks")
        
        rows = cursor.fetchall()
        requeued = 0
        
        for row in rows:
            task = HarvestTask(
                task_type=TaskType(row["task_type"]),
                source=TaskSource(row["source"]),
                payload=json.loads(row["payload"]),
                priority=row["priority"],
                retry_count=0,
                max_retries=max_retries or row["max_retries"],
                created_at=datetime.now(timezone.utc),
            )
            self.enqueue(task)
            
            # Remove from dead letter
            conn.execute(
                "DELETE FROM failed_tasks WHERE task_id = ?",
                (row["task_id"],)
            )
            requeued += 1
        
        conn.commit()
        return requeued
    
    def cleanup_old_tasks(self, days: int = 7) -> int:
        """
        Remove completed tasks older than specified days.
        
        Args:
            days: Age threshold for cleanup
            
        Returns:
            Number of tasks removed
        """
        conn = self._get_connection()
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        conn.execute("""
            DELETE FROM task_queue
            WHERE status = ? AND completed_at < ?
        """, (TaskStatus.COMPLETED.value, cutoff))
        
        deleted = conn.total_changes
        conn.commit()
        return deleted
    
    def clear_queue(self, status: Optional[TaskStatus] = None) -> int:
        """
        Clear tasks from queue.
        
        Args:
            status: Clear only tasks with this status, or None for all
            
        Returns:
            Number of tasks cleared
        """
        conn = self._get_connection()
        
        if status:
            conn.execute(
                "DELETE FROM task_queue WHERE status = ?",
                (status.value,)
            )
        else:
            conn.execute("DELETE FROM task_queue")
        
        deleted = conn.total_changes
        conn.commit()
        return deleted
