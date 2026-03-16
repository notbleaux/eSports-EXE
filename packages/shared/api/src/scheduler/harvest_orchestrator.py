"""
Harvest Orchestrator - TRINITY + OPERA Component A

Manages the scheduling and execution of harvest tasks using the SQLite task queue.
Provides worker pool architecture, CLI interface, and integration points for
daily harvests, backfill operations, and realtime watching.

CRITICAL: Zero external dependencies beyond sqlite3.
No Redis, no paid services, completely free to operate.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import signal
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set

from .sqlite_queue import (
    HarvestTask,
    SQLiteTaskQueue,
    TaskSource,
    TaskStatus,
    TaskType,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class HarvestOrchestrator:
    """
    Orchestrates harvest operations using the SQLite task queue.
    
    Features:
    - Worker pool for concurrent task execution
    - Task handlers registry for different task types
    - Metrics collection and reporting
    - Graceful shutdown handling
    - CLI integration for cron/systemd
    
    Usage:
        orchestrator = HarvestOrchestrator("/path/to/queue.db")
        
        # Register task handlers
        orchestrator.register_handler(TaskType.MATCH_SCRAPE, scrape_match)
        
        # Schedule tasks
        orchestrator.schedule_daily_harvest()
        
        # Run workers
        orchestrator.worker_loop(num_workers=4)
    """
    
    def __init__(
        self,
        db_path: Union[str, Path],
        max_workers: int = 4,
        poll_interval: float = 1.0,
        metrics_interval: int = 60,
    ):
        """
        Initialize the orchestrator.
        
        Args:
            db_path: Path to SQLite queue database
            max_workers: Maximum concurrent workers
            poll_interval: Seconds between queue polls when idle
            metrics_interval: Seconds between metrics logging
        """
        self.queue = SQLiteTaskQueue(db_path, max_workers=max_workers)
        self.max_workers = max_workers
        self.poll_interval = poll_interval
        self.metrics_interval = metrics_interval
        self.handlers: Dict[TaskType, Callable[[HarvestTask], Any]] = {}
        self.running = False
        self.shutdown_event = threading.Event()
        self.stats = {
            "tasks_completed": 0,
            "tasks_failed": 0,
            "tasks_retried": 0,
            "start_time": None,
        }
    
    def register_handler(
        self,
        task_type: TaskType,
        handler: Callable[[HarvestTask], Any]
    ) -> None:
        """
        Register a handler function for a task type.
        
        Args:
            task_type: Type of task this handler processes
            handler: Function that accepts a HarvestTask and returns result
        """
        self.handlers[task_type] = handler
        logger.info(f"Registered handler for {task_type.value}")
    
    def schedule_daily_harvest(
        self,
        date: Optional[datetime] = None,
        priority: int = 3,
    ) -> List[str]:
        """
        Schedule the daily harvest for a specific date.
        
        Creates tasks for:
        - Recent match scraping (last 24h)
        - Player stats updates
        - Tournament standings
        
        Args:
            date: Date to harvest (defaults to yesterday)
            priority: Task priority (lower = higher priority)
            
        Returns:
            List of scheduled task IDs
        """
        if date is None:
            date = datetime.now(timezone.utc) - timedelta(days=1)
        
        task_ids = []
        
        # Schedule match scraping for recent matches
        task = HarvestTask(
            task_type=TaskType.MATCH_SCRAPE,
            source=TaskSource.VLR_GG,
            payload={
                "operation": "daily_harvest",
                "date": date.strftime("%Y-%m-%d"),
                "filters": {"min_date": (date - timedelta(days=1)).isoformat()},
            },
            priority=priority,
        )
        task_ids.append(self.queue.enqueue(task))
        
        # Schedule player stats aggregation
        task = HarvestTask(
            task_type=TaskType.STATS_AGGREGATE,
            source=TaskSource.VLR_GG,
            payload={
                "operation": "daily_aggregate",
                "date": date.strftime("%Y-%m-%d"),
                "metrics": ["player_rating", "team_standings"],
            },
            priority=priority + 1,
        )
        task_ids.append(self.queue.enqueue(task))
        
        # Schedule index rebuild for search
        task = HarvestTask(
            task_type=TaskType.INDEX_BUILD,
            source=TaskSource.VLR_GG,
            payload={
                "operation": "update_search_index",
                "indices": ["players", "teams", "matches"],
            },
            priority=priority + 2,
        )
        task_ids.append(self.queue.enqueue(task))
        
        logger.info(f"Scheduled {len(task_ids)} daily harvest tasks for {date.date()}")
        return task_ids
    
    def schedule_backfill(
        self,
        start_date: datetime,
        end_date: datetime,
        priority: int = 5,
        chunk_size: int = 7,  # days per task
    ) -> List[str]:
        """
        Schedule a backfill operation for historical data.
        
        Args:
            start_date: Start of backfill period
            end_date: End of backfill period
            priority: Task priority (backfills are lower priority)
            chunk_size: Days to process per task
            
        Returns:
            List of scheduled task IDs
        """
        task_ids = []
        current = start_date
        
        while current < end_date:
            chunk_end = min(current + timedelta(days=chunk_size), end_date)
            
            task = HarvestTask(
                task_type=TaskType.MATCH_SCRAPE,
                source=TaskSource.BACKFILL,
                payload={
                    "operation": "backfill",
                    "start_date": current.strftime("%Y-%m-%d"),
                    "end_date": chunk_end.strftime("%Y-%m-%d"),
                    "chunk_index": len(task_ids),
                },
                priority=priority,
            )
            task_ids.append(self.queue.enqueue(task))
            
            current = chunk_end
        
        logger.info(
            f"Scheduled {len(task_ids)} backfill tasks from "
            f"{start_date.date()} to {end_date.date()}"
        )
        return task_ids
    
    def schedule_realtime_watch(
        self,
        watch_targets: List[Dict[str, Any]],
        priority: int = 2,
    ) -> List[str]:
        """
        Schedule realtime watching for live matches or events.
        
        Args:
            watch_targets: List of targets to watch (matches, tournaments)
            priority: High priority for realtime (default 2)
            
        Returns:
            List of scheduled task IDs
        """
        task_ids = []
        
        for target in watch_targets:
            task = HarvestTask(
                task_type=TaskType.MATCH_SCRAPE,
                source=TaskSource.REALTIME_WATCH,
                payload={
                    "operation": "realtime_watch",
                    "target": target,
                    "poll_interval": target.get("poll_interval", 60),
                },
                priority=priority,
                max_retries=5,  # More retries for realtime
            )
            task_ids.append(self.queue.enqueue(task))
        
        logger.info(f"Scheduled {len(task_ids)} realtime watch tasks")
        return task_ids
    
    def schedule_team_harvest(
        self,
        team_ids: List[str],
        priority: int = 4,
    ) -> List[str]:
        """
        Schedule tasks to harvest specific team data.
        
        Args:
            team_ids: List of team identifiers to harvest
            priority: Task priority
            
        Returns:
            List of scheduled task IDs
        """
        task_ids = []
        
        for team_id in team_ids:
            task = HarvestTask(
                task_type=TaskType.TEAM_SCRAPE,
                source=TaskSource.VLR_GG,
                payload={
                    "operation": "team_harvest",
                    "team_id": team_id,
                    "include_matches": True,
                    "include_players": True,
                },
                priority=priority,
            )
            task_ids.append(self.queue.enqueue(task))
        
        logger.info(f"Scheduled {len(task_ids)} team harvest tasks")
        return task_ids
    
    def schedule_player_harvest(
        self,
        player_ids: List[str],
        priority: int = 4,
    ) -> List[str]:
        """
        Schedule tasks to harvest specific player data.
        
        Args:
            player_ids: List of player identifiers to harvest
            priority: Task priority
            
        Returns:
            List of scheduled task IDs
        """
        task_ids = []
        
        for player_id in player_ids:
            task = HarvestTask(
                task_type=TaskType.PLAYER_SCRAPE,
                source=TaskSource.VLR_GG,
                payload={
                    "operation": "player_harvest",
                    "player_id": player_id,
                    "include_stats": True,
                    "include_matches": True,
                },
                priority=priority,
            )
            task_ids.append(self.queue.enqueue(task))
        
        logger.info(f"Scheduled {len(task_ids)} player harvest tasks")
        return task_ids
    
    def _execute_task(self, task: HarvestTask) -> Any:
        """
        Execute a single task using the appropriate handler.
        
        Args:
            task: The task to execute
            
        Returns:
            Handler result
            
        Raises:
            KeyError: If no handler registered for task type
            Exception: If handler raises an exception
        """
        if task.task_type not in self.handlers:
            raise KeyError(f"No handler registered for {task.task_type.value}")
        
        handler = self.handlers[task.task_type]
        logger.debug(f"Executing task {task.task_id} with {task.task_type.value} handler")
        
        return handler(task)
    
    def _worker_iteration(self, worker_id: str) -> bool:
        """
        Single iteration of worker loop - fetch and process one task.
        
        Args:
            worker_id: Unique identifier for this worker
            
        Returns:
            True if a task was processed, False if queue was empty
        """
        task = self.queue.dequeue(worker_id=worker_id)
        
        if not task:
            return False
        
        logger.info(
            f"Worker {worker_id} processing task {task.task_id} "
            f"({task.task_type.value} from {task.source.value})"
        )
        
        try:
            result = self._execute_task(task)
            self.queue.complete(task.task_id)
            self.stats["tasks_completed"] += 1
            logger.info(f"Task {task.task_id} completed successfully")
            return True
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Task {task.task_id} failed: {error_msg}")
            self.queue.fail(task.task_id, error_msg, retry=True)
            self.stats["tasks_failed"] += 1
            return True
    
    def worker_loop(
        self,
        num_workers: Optional[int] = None,
        max_iterations: Optional[int] = None,
    ) -> None:
        """
        Run the worker loop with a thread pool.
        
        This is the main entry point for worker processes.
        
        Args:
            num_workers: Number of concurrent workers (default: self.max_workers)
            max_iterations: Max tasks to process before exiting (None = infinite)
        """
        num_workers = num_workers or self.max_workers
        self.running = True
        self.stats["start_time"] = datetime.now(timezone.utc)
        
        # Setup signal handlers for graceful shutdown
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, initiating shutdown...")
            self.shutdown()
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        logger.info(f"Starting worker loop with {num_workers} workers")
        
        iteration = 0
        last_metrics_time = time.time()
        
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures: Set = set()
            
            while self.running:
                # Submit new tasks if we have capacity
                while len(futures) < num_workers and self.running:
                    future = executor.submit(
                        self._worker_iteration,
                        f"worker-{len(futures)}"
                    )
                    futures.add(future)
                
                # Wait for at least one task to complete
                if futures:
                    done, futures = wait(futures, return_when=FIRST_COMPLETED)
                    for future in done:
                        try:
                            future.result()
                        except Exception as e:
                            logger.error(f"Worker thread error: {e}")
                
                iteration += 1
                
                # Check max iterations
                if max_iterations and iteration >= max_iterations:
                    logger.info(f"Reached max iterations ({max_iterations}), shutting down")
                    break
                
                # Log metrics periodically
                current_time = time.time()
                if current_time - last_metrics_time >= self.metrics_interval:
                    self._log_metrics()
                    last_metrics_time = current_time
                
                # Small delay to prevent tight loop when empty
                if not futures:
                    time.sleep(self.poll_interval)
        
        logger.info("Worker loop ended")
        self._log_metrics()
    
    def _log_metrics(self) -> None:
        """Log current queue and worker metrics."""
        metrics = self.queue.get_metrics()
        runtime = datetime.now(timezone.utc) - self.stats["start_time"]
        
        logger.info(
            f"Queue metrics: pending={metrics['pending']}, "
            f"running={metrics['running']}, retrying={metrics['retrying']}, "
            f"dead_letter={metrics['dead_letter']}"
        )
        logger.info(
            f"Worker stats: completed={self.stats['tasks_completed']}, "
            f"failed={self.stats['tasks_failed']}, runtime={runtime}"
        )
        
        # Record to database for historical tracking
        self.queue.record_metrics()
    
    def shutdown(self) -> None:
        """Signal the worker loop to shut down gracefully."""
        self.running = False
        self.shutdown_event.set()
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current orchestrator status.
        
        Returns:
            Dictionary with queue metrics and worker stats
        """
        metrics = self.queue.get_metrics()
        runtime = (
            datetime.now(timezone.utc) - self.stats["start_time"]
            if self.stats["start_time"] else timedelta(0)
        )
        
        return {
            "queue": metrics,
            "workers": {
                "max_workers": self.max_workers,
                "running": self.running,
            },
            "stats": {
                **self.stats,
                "runtime_seconds": runtime.total_seconds(),
                "tasks_per_minute": (
                    (self.stats["tasks_completed"] + self.stats["tasks_failed"])
                    / max(runtime.total_seconds() / 60, 1)
                ),
            },
            "handlers": [t.value for t in self.handlers.keys()],
        }


# Import needed for worker_loop
from concurrent.futures import wait, FIRST_COMPLETED
from typing import Union


def create_default_orchestrator(db_path: Optional[str] = None) -> HarvestOrchestrator:
    """
    Create an orchestrator with default handlers.
    
    This is used by the CLI to provide a working orchestrator
    with basic handlers for common operations.
    """
    if db_path is None:
        # Default location in project data directory
        db_path = str(Path.home() / ".sator" / "harvest_queue.db")
    
    # Ensure directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    orchestrator = HarvestOrchestrator(db_path)
    
    # Register placeholder handlers (would be real implementations in production)
    def placeholder_handler(task: HarvestTask) -> Dict[str, Any]:
        """Placeholder handler that simulates work."""
        logger.info(f"Processing {task.task_type.value} task: {task.payload}")
        time.sleep(0.5)  # Simulate work
        return {"status": "success", "task_id": task.task_id}
    
    # Register handlers for all task types
    for task_type in TaskType:
        orchestrator.register_handler(task_type, placeholder_handler)
    
    return orchestrator


def main():
    """
    CLI entry point for the harvest orchestrator.
    
    Usage:
        python -m scheduler.harvest_orchestrator worker --workers 4
        python -m scheduler.harvest_orchestrator schedule-daily
        python -m scheduler.harvest_orchestrator schedule-backfill 2024-01-01 2024-03-01
        python -m scheduler.harvest_orchestrator status
        python -m scheduler.harvest_orchestrator metrics
    """
    parser = argparse.ArgumentParser(
        description="SATOR Harvest Orchestrator - SQLite Task Queue",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run 4 workers to process tasks
  %(prog)s worker --workers 4
  
  # Schedule daily harvest
  %(prog)s schedule-daily
  
  # Schedule backfill for date range
  %(prog)s schedule-backfill 2024-01-01 2024-03-01
  
  # Check queue status
  %(prog)s status
  
  # Show metrics
  %(prog)s metrics
  
  # Clear completed tasks older than 7 days
  %(prog)s cleanup --days 7
        """
    )
    
    parser.add_argument(
        "--db-path",
        default=None,
        help="Path to SQLite database (default: ~/.sator/harvest_queue.db)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Worker command
    worker_parser = subparsers.add_parser(
        "worker",
        help="Run worker loop to process tasks",
    )
    worker_parser.add_argument(
        "--workers", "-w",
        type=int,
        default=4,
        help="Number of concurrent workers (default: 4)",
    )
    worker_parser.add_argument(
        "--max-iterations",
        type=int,
        default=None,
        help="Maximum tasks to process before exiting",
    )
    worker_parser.add_argument(
        "--poll-interval",
        type=float,
        default=1.0,
        help="Seconds between polls when queue empty (default: 1.0)",
    )
    
    # Schedule daily command
    daily_parser = subparsers.add_parser(
        "schedule-daily",
        help="Schedule daily harvest tasks",
    )
    daily_parser.add_argument(
        "--date",
        type=lambda d: datetime.strptime(d, "%Y-%m-%d"),
        default=None,
        help="Date to harvest (default: yesterday)",
    )
    daily_parser.add_argument(
        "--priority",
        type=int,
        default=3,
        help="Task priority 1-10 (default: 3)",
    )
    
    # Schedule backfill command
    backfill_parser = subparsers.add_parser(
        "schedule-backfill",
        help="Schedule backfill tasks for date range",
    )
    backfill_parser.add_argument(
        "start_date",
        type=lambda d: datetime.strptime(d, "%Y-%m-%d"),
        help="Start date (YYYY-MM-DD)",
    )
    backfill_parser.add_argument(
        "end_date",
        type=lambda d: datetime.strptime(d, "%Y-%m-%d"),
        help="End date (YYYY-MM-DD)",
    )
    backfill_parser.add_argument(
        "--priority",
        type=int,
        default=5,
        help="Task priority 1-10 (default: 5)",
    )
    backfill_parser.add_argument(
        "--chunk-size",
        type=int,
        default=7,
        help="Days per task (default: 7)",
    )
    
    # Status command
    status_parser = subparsers.add_parser(
        "status",
        help="Show current queue status",
    )
    
    # Metrics command
    metrics_parser = subparsers.add_parser(
        "metrics",
        help="Show detailed metrics",
    )
    
    # Cleanup command
    cleanup_parser = subparsers.add_parser(
        "cleanup",
        help="Clean up old completed tasks",
    )
    cleanup_parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Remove tasks older than N days (default: 7)",
    )
    
    # Clear command
    clear_parser = subparsers.add_parser(
        "clear",
        help="Clear tasks from queue",
    )
    clear_parser.add_argument(
        "--status",
        choices=["pending", "running", "completed", "failed", "all"],
        default="completed",
        help="Clear tasks with this status (default: completed)",
    )
    
    # Requeue dead letter command
    requeue_parser = subparsers.add_parser(
        "requeue-dead",
        help="Requeue dead letter tasks for retry",
    )
    requeue_parser.add_argument(
        "--task-id",
        default=None,
        help="Requeue specific task ID (default: all)",
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Create orchestrator
    orchestrator = create_default_orchestrator(args.db_path)
    
    # Execute command
    if args.command == "worker":
        orchestrator.poll_interval = args.poll_interval
        orchestrator.worker_loop(
            num_workers=args.workers,
            max_iterations=args.max_iterations,
        )
    
    elif args.command == "schedule-daily":
        task_ids = orchestrator.schedule_daily_harvest(
            date=args.date,
            priority=args.priority,
        )
        print(f"Scheduled {len(task_ids)} daily harvest tasks")
        for tid in task_ids:
            print(f"  - {tid}")
    
    elif args.command == "schedule-backfill":
        task_ids = orchestrator.schedule_backfill(
            start_date=args.start_date,
            end_date=args.end_date,
            priority=args.priority,
            chunk_size=args.chunk_size,
        )
        print(f"Scheduled {len(task_ids)} backfill tasks")
        print(f"Date range: {args.start_date.date()} to {args.end_date.date()}")
    
    elif args.command == "status":
        status = orchestrator.get_status()
        print("\n=== Queue Status ===")
        print(f"Pending:    {status['queue']['pending']}")
        print(f"Running:    {status['queue']['running']}")
        print(f"Retrying:   {status['queue']['retrying']}")
        print(f"Completed:  {status['queue']['completed']}")
        print(f"Failed:     {status['queue']['failed']}")
        print(f"Dead Letter: {status['queue']['dead_letter']}")
        print(f"\nActive Workers: {status['workers']['max_workers']}")
        print(f"Running: {status['workers']['running']}")
    
    elif args.command == "metrics":
        metrics = orchestrator.queue.get_metrics()
        print("\n=== Queue Metrics ===")
        print(json.dumps(metrics, indent=2))
    
    elif args.command == "cleanup":
        deleted = orchestrator.queue.cleanup_old_tasks(days=args.days)
        print(f"Removed {deleted} completed tasks older than {args.days} days")
    
    elif args.command == "clear":
        from .sqlite_queue import TaskStatus
        status = None if args.status == "all" else TaskStatus(args.status)
        deleted = orchestrator.queue.clear_queue(status=status)
        print(f"Cleared {deleted} tasks")
    
    elif args.command == "requeue-dead":
        requeued = orchestrator.queue.requeue_dead_letter(task_id=args.task_id)
        print(f"Requeued {requeued} dead letter tasks")


if __name__ == "__main__":
    main()
