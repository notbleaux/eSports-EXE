"""
blackboard.py — in-memory task store for the Phase 2 gateway.

[Ver001.000] · Phase 2 of PLN-003-network-api

A task blackboard is the coordination surface where agents post work, bid
on work, and submit results. Phase 2 uses an in-process dict; Phase 3
swaps in SQLite WAL (with Supabase failover) without changing this API.

Task lifecycle (informational — only OPEN is reachable from this PR):

    open  →  claimed  →  partial_pending_handoff  →  completed
                                                  ↘  failed

Subsequent Phase 2 PRs add /tasks/{id}/bid (open → claimed) and
/tasks/{id}/submit (claimed → completed or partial_pending_handoff).
"""

from __future__ import annotations

import threading
import time
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any


class TaskStatus(str, Enum):
    OPEN = "open"
    CLAIMED = "claimed"
    PARTIAL_PENDING_HANDOFF = "partial_pending_handoff"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Task:
    id: str
    creator_agent_id: str
    description: str
    status: TaskStatus
    created_at: float
    metadata: dict[str, Any] = field(default_factory=dict)
    contributions: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["status"] = self.status.value
        return d


class Blackboard:
    """Thread-safe in-memory task store.

    Subsequent phases will swap this for a persistent backend; the API
    surface (`create`, `get`, `list_open`, etc.) is the contract.
    """

    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}
        self._lock = threading.Lock()

    def create(
        self,
        creator_agent_id: str,
        description: str,
        metadata: dict[str, Any] | None = None,
    ) -> Task:
        """Insert a new OPEN task and return it.

        `creator_agent_id` is trusted (already verified by middleware).
        """
        if not description or not description.strip():
            raise ValueError("description must be non-empty")

        task = Task(
            id=str(uuid.uuid4()),
            creator_agent_id=creator_agent_id,
            description=description.strip(),
            status=TaskStatus.OPEN,
            created_at=time.time(),
            metadata=metadata or {},
        )
        with self._lock:
            self._tasks[task.id] = task
        return task

    def get(self, task_id: str) -> Task | None:
        with self._lock:
            return self._tasks.get(task_id)

    def list_open(self) -> list[Task]:
        with self._lock:
            return [t for t in self._tasks.values() if t.status == TaskStatus.OPEN]

    def count(self) -> int:
        with self._lock:
            return len(self._tasks)

    def reset(self) -> None:
        """Test-only: wipe state. Not exposed via the gateway."""
        with self._lock:
            self._tasks.clear()


# Module-level singleton instance — imported by app.py.
# Subsequent phases (3+) will inject this via FastAPI's Depends() instead.
blackboard = Blackboard()
