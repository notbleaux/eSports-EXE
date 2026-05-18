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
    claimer_agent_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["status"] = self.status.value
        return d


class TaskStateError(Exception):
    """Raised when an operation is invalid given a task's current state."""


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

    def bid(
        self,
        task_id: str,
        bidder_agent_id: str,
        message: str | None = None,
    ) -> Task:
        """Claim an OPEN task or accept a hand-off from PARTIAL_PENDING_HANDOFF.

        Single-bidder Phase 2 model: first bid wins. Phase 5 will replace
        this with multi-bidder auction semantics + creator selection.

        Raises:
            KeyError: task not found
            TaskStateError: task is not in OPEN or PARTIAL_PENDING_HANDOFF
        """
        with self._lock:
            task = self._tasks.get(task_id)
            if task is None:
                raise KeyError(task_id)
            if task.status not in (TaskStatus.OPEN, TaskStatus.PARTIAL_PENDING_HANDOFF):
                raise TaskStateError(
                    f"cannot bid on task in state {task.status.value!r}"
                )
            task.contributions.append({
                "kind": "bid",
                "agent_id": bidder_agent_id,
                "message": message,
                "at": time.time(),
            })
            task.claimer_agent_id = bidder_agent_id
            task.status = TaskStatus.CLAIMED
            return task

    def submit(
        self,
        task_id: str,
        submitter_agent_id: str,
        content: str,
        complete: bool,
    ) -> Task:
        """Submit work against a CLAIMED task.

        - `complete=True`  → task → COMPLETED
        - `complete=False` → task → PARTIAL_PENDING_HANDOFF (claimer cleared
                              so another agent can pick up via /bid)

        Raises:
            KeyError: task not found
            TaskStateError: task not in CLAIMED, or submitter is not the claimer
        """
        if not content or not content.strip():
            raise ValueError("content must be non-empty")
        with self._lock:
            task = self._tasks.get(task_id)
            if task is None:
                raise KeyError(task_id)
            if task.status != TaskStatus.CLAIMED:
                raise TaskStateError(
                    f"cannot submit on task in state {task.status.value!r}"
                )
            if task.claimer_agent_id != submitter_agent_id:
                raise TaskStateError(
                    "only the current claimer can submit on this task"
                )
            task.contributions.append({
                "kind": "submission",
                "agent_id": submitter_agent_id,
                "content": content,
                "complete": bool(complete),
                "at": time.time(),
            })
            if complete:
                task.status = TaskStatus.COMPLETED
            else:
                task.status = TaskStatus.PARTIAL_PENDING_HANDOFF
                task.claimer_agent_id = None  # free for next bidder
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
