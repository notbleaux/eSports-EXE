"""
blackboard.py — SQLite-backed task store with optional Supabase mirror.

[Ver002.001] · Phase 3 of PLN-003-network-api + Phase 3.5 cloud mirror

A task blackboard is the coordination surface where agents post work, bid
on work, and submit results.

Persistence model:
  - SQLite with WAL journal mode (concurrent readers + single writer)
  - FK constraints on (task_contributions.task_id → tasks.id) ON DELETE CASCADE
  - synchronous=NORMAL (fsync at commit; tolerable for the gateway's
    write-rare-read-often access pattern)
  - Default DB path: `services/agent-gateway/data/agent-gateway.db`
  - Env override: `AGENT_GATEWAY_DB_PATH` (set to `:memory:` for tests)

Phase 3.5 — optional Supabase cloud mirror:
  - After each successful local write (create / bid / submit) the
    Blackboard fires a no-block call to `SupabaseMirror`, which
    asynchronously POSTs the row to the configured Supabase project's
    REST endpoint (env vars `SUPABASE_URL`, `SUPABASE_KEY`).
  - Mirror is **opt-in** and write-only; reads always come from local
    SQLite for latency. If env vars are unset the mirror is a no-op.
  - Mirror failures are logged but never propagated to the API caller.

Task lifecycle:

    open  →  claimed  →  partial_pending_handoff  →  completed
                                                  ↘  failed

Same Task / TaskStatus / TaskStateError types as Phase 2.
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

from supabase_mirror import SupabaseMirror, default_mirror

DEFAULT_DB_DIR = Path(__file__).resolve().parent / "data"
DEFAULT_DB_PATH = DEFAULT_DB_DIR / "agent-gateway.db"
DB_PATH_ENV_VAR = "AGENT_GATEWAY_DB_PATH"


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


SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks (
    id                TEXT PRIMARY KEY,
    creator_agent_id  TEXT NOT NULL,
    description       TEXT NOT NULL,
    status            TEXT NOT NULL,
    created_at        REAL NOT NULL,
    metadata          TEXT NOT NULL DEFAULT '{}',
    claimer_agent_id  TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS task_contributions (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id   TEXT NOT NULL,
    kind      TEXT NOT NULL,
    agent_id  TEXT NOT NULL,
    payload   TEXT NOT NULL DEFAULT '{}',
    at        REAL NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_contributions_task ON task_contributions(task_id);
"""


def _resolve_db_path(override: str | Path | None) -> str:
    """Return the DB path the singleton should use.

    Precedence:
      1. explicit override argument
      2. AGENT_GATEWAY_DB_PATH env var
      3. DEFAULT_DB_PATH (file relative to this module)
    """
    if override is not None:
        return str(override)
    env = os.environ.get(DB_PATH_ENV_VAR)
    if env:
        return env
    DEFAULT_DB_DIR.mkdir(parents=True, exist_ok=True)
    return str(DEFAULT_DB_PATH)


class Blackboard:
    """Thread-safe SQLite-backed task store with optional Supabase mirror.

    Same external interface as the Phase 2 in-memory implementation. Pass
    `:memory:` for tests that want ephemeral state without env var setup.

    `mirror` defaults to the module-level `default_mirror` (env-configured).
    Pass `mirror=SupabaseMirror()` (no args) to explicitly disable the
    mirror for a specific instance (useful in tests).
    """

    def __init__(
        self,
        db_path: str | Path | None = None,
        mirror: SupabaseMirror | None = None,
    ) -> None:
        self._lock = threading.Lock()
        self._db_path = _resolve_db_path(db_path)
        # check_same_thread=False so FastAPI's TestClient + worker threads
        # can share the same connection (guarded by self._lock).
        self._conn = sqlite3.connect(self._db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._mirror = mirror if mirror is not None else default_mirror
        self._init_db()

    def _init_db(self) -> None:
        cur = self._conn.cursor()
        if self._db_path != ":memory:":
            cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA synchronous=NORMAL")
        cur.executescript(SCHEMA)
        self._conn.commit()

    def _row_to_task(self, row: sqlite3.Row, contributions: list[dict[str, Any]]) -> Task:
        return Task(
            id=row["id"],
            creator_agent_id=row["creator_agent_id"],
            description=row["description"],
            status=TaskStatus(row["status"]),
            created_at=row["created_at"],
            metadata=json.loads(row["metadata"]),
            contributions=contributions,
            claimer_agent_id=row["claimer_agent_id"],
        )

    def _load_contributions(self, task_id: str) -> list[dict[str, Any]]:
        cur = self._conn.execute(
            "SELECT kind, agent_id, payload, at FROM task_contributions "
            "WHERE task_id = ? ORDER BY id ASC",
            (task_id,),
        )
        return [
            {"kind": r["kind"], "agent_id": r["agent_id"], "at": r["at"], **json.loads(r["payload"])}
            for r in cur.fetchall()
        ]

    def _append_contribution(
        self,
        task_id: str,
        kind: str,
        agent_id: str,
        payload: dict[str, Any],
        at: float,
    ) -> None:
        self._conn.execute(
            "INSERT INTO task_contributions (task_id, kind, agent_id, payload, at) "
            "VALUES (?, ?, ?, ?, ?)",
            (task_id, kind, agent_id, json.dumps(payload), at),
        )

    def create(
        self,
        creator_agent_id: str,
        description: str,
        metadata: dict[str, Any] | None = None,
    ) -> Task:
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
            self._conn.execute(
                "INSERT INTO tasks (id, creator_agent_id, description, status, created_at, metadata, claimer_agent_id) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    task.id,
                    task.creator_agent_id,
                    task.description,
                    task.status.value,
                    task.created_at,
                    json.dumps(task.metadata),
                    None,
                ),
            )
            self._conn.commit()
        # Phase 3.5: async mirror to Supabase (no-op when env unset)
        self._mirror.mirror_task_insert(
            task_id=task.id,
            creator_agent_id=task.creator_agent_id,
            description=task.description,
            status=task.status.value,
            created_at=task.created_at,
            metadata=task.metadata,
            claimer_agent_id=None,
        )
        return task

    def bid(
        self,
        task_id: str,
        bidder_agent_id: str,
        message: str | None = None,
    ) -> Task:
        """Claim an OPEN task or accept a hand-off from PARTIAL_PENDING_HANDOFF.

        First-bid-wins; Phase 5 will replace with multi-bidder auction.

        Raises:
            KeyError: task not found
            TaskStateError: task is not in OPEN or PARTIAL_PENDING_HANDOFF
        """
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM tasks WHERE id = ?", (task_id,)
            ).fetchone()
            if row is None:
                raise KeyError(task_id)
            status = TaskStatus(row["status"])
            if status not in (TaskStatus.OPEN, TaskStatus.PARTIAL_PENDING_HANDOFF):
                raise TaskStateError(f"cannot bid on task in state {status.value!r}")
            now = time.time()
            self._append_contribution(
                task_id, "bid", bidder_agent_id, {"message": message}, now
            )
            self._conn.execute(
                "UPDATE tasks SET status = ?, claimer_agent_id = ? WHERE id = ?",
                (TaskStatus.CLAIMED.value, bidder_agent_id, task_id),
            )
            self._conn.commit()
            task = self._get_unlocked(task_id)
        # Phase 3.5: mirror outside the lock — fire-and-forget queue
        self._mirror.mirror_contribution(task_id, "bid", bidder_agent_id, {"message": message}, now)
        self._mirror.mirror_task_update(task_id, TaskStatus.CLAIMED.value, bidder_agent_id)
        return task

    def submit(
        self,
        task_id: str,
        submitter_agent_id: str,
        content: str,
        complete: bool,
    ) -> Task:
        """Submit work against a CLAIMED task.

        - complete=True  → task → COMPLETED
        - complete=False → task → PARTIAL_PENDING_HANDOFF (claimer cleared
                            so another agent can pick up via /bid)

        Raises:
            KeyError: task not found
            TaskStateError: task not in CLAIMED, or submitter is not the claimer
        """
        if not content or not content.strip():
            raise ValueError("content must be non-empty")
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM tasks WHERE id = ?", (task_id,)
            ).fetchone()
            if row is None:
                raise KeyError(task_id)
            status = TaskStatus(row["status"])
            if status != TaskStatus.CLAIMED:
                raise TaskStateError(f"cannot submit on task in state {status.value!r}")
            if row["claimer_agent_id"] != submitter_agent_id:
                raise TaskStateError(
                    "only the current claimer can submit on this task"
                )
            now = time.time()
            self._append_contribution(
                task_id,
                "submission",
                submitter_agent_id,
                {"content": content, "complete": bool(complete)},
                now,
            )
            if complete:
                self._conn.execute(
                    "UPDATE tasks SET status = ? WHERE id = ?",
                    (TaskStatus.COMPLETED.value, task_id),
                )
                new_status = TaskStatus.COMPLETED.value
                new_claimer: str | None = submitter_agent_id
            else:
                self._conn.execute(
                    "UPDATE tasks SET status = ?, claimer_agent_id = NULL WHERE id = ?",
                    (TaskStatus.PARTIAL_PENDING_HANDOFF.value, task_id),
                )
                new_status = TaskStatus.PARTIAL_PENDING_HANDOFF.value
                new_claimer = None
            self._conn.commit()
            task = self._get_unlocked(task_id)
        # Phase 3.5: mirror outside the lock
        self._mirror.mirror_contribution(
            task_id,
            "submission",
            submitter_agent_id,
            {"content": content, "complete": bool(complete)},
            now,
        )
        self._mirror.mirror_task_update(task_id, new_status, new_claimer)
        return task

    def _get_unlocked(self, task_id: str) -> Task:
        """Internal: load a task without acquiring self._lock (caller holds it)."""
        row = self._conn.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        if row is None:
            raise KeyError(task_id)
        contributions = self._load_contributions(task_id)
        return self._row_to_task(row, contributions)

    def get(self, task_id: str) -> Task | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM tasks WHERE id = ?", (task_id,)
            ).fetchone()
            if row is None:
                return None
            contributions = self._load_contributions(task_id)
            return self._row_to_task(row, contributions)

    def list_open(self) -> list[Task]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT * FROM tasks WHERE status = ? ORDER BY created_at ASC",
                (TaskStatus.OPEN.value,),
            ).fetchall()
            return [self._row_to_task(r, self._load_contributions(r["id"])) for r in rows]

    def count(self) -> int:
        with self._lock:
            row = self._conn.execute("SELECT COUNT(*) AS c FROM tasks").fetchone()
            return int(row["c"])

    def reset(self) -> None:
        """Wipe state. Used by tests; also useful for ops-time resets.

        Cascades to task_contributions via the FK ON DELETE CASCADE.
        """
        with self._lock:
            self._conn.execute("DELETE FROM tasks")
            self._conn.commit()

    def close(self) -> None:
        """Close the underlying SQLite connection. Mostly for explicit cleanup."""
        with self._lock:
            self._conn.close()


# Module-level singleton instance — imported by app.py.
# Tests can either:
#   - set AGENT_GATEWAY_DB_PATH=:memory: before importing this module
#   - or instantiate their own Blackboard(":memory:") and patch as needed
# Default: persistent on-disk DB at services/agent-gateway/data/agent-gateway.db
blackboard = Blackboard()
