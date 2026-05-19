"""
vaultbrain_adapter.py — PostgreSQL-backed task store for agent-gateway.

[Ver002.000] · VaultBrain Integration — Replaces in-memory blackboard

API-compatible replacement for blackboard.py. Same create/bid/submit/get/list_open
surface, but persists to VaultBrain PostgreSQL via psycopg2.

Migration: swap `from blackboard import blackboard` → `from vaultbrain_adapter import vaultbrain_store`
"""

from __future__ import annotations

import json
import os
import time
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Optional

import psycopg2
from psycopg2.extras import RealDictCursor


# ── Configuration ───────────────────────────────────────────────

DB_HOST = os.getenv("VAULTBRAIN_HOST", "pgbouncer")
DB_PORT = int(os.getenv("VAULTBRAIN_PORT", "6432"))
DB_NAME = os.getenv("VAULTBRAIN_DB", "vaultbrain")
DB_USER = os.getenv("VAULTBRAIN_USER", "vaultbrain")
DB_PASS = os.getenv("VAULTBRAIN_PASSWORD", os.getenv("POSTGRES_PASSWORD", "change_me"))

DSN = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


# ── Data Model (mirrors blackboard.py exactly) ────────────────

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
    claimer_agent_id: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["status"] = self.status.value
        return d


class TaskStateError(Exception):
    """Raised when an operation is invalid given a task's current state."""


# ── Database Adapter ──────────────────────────────────────────

class VaultBrainStore:
    """Thread-safe PostgreSQL-backed task store.

    Replaces the in-memory Blackboard with identical API surface.
    Uses connection pooling via PgBouncer for efficiency.
    """

    def __init__(self, dsn: str = DSN) -> None:
        self._dsn = dsn
        self._ensure_tables()

    def _connect(self) -> psycopg2.extensions.connection:
        return psycopg2.connect(self._dsn, cursor_factory=RealDictCursor)

    def _ensure_tables(self) -> None:
        """Idempotent schema creation. Safe to call on every init."""
        with self._connect() as conn:
            with conn.cursor() as cur:
                # Create enum if not exists (PostgreSQL-specific)
                cur.execute("""
                    DO $$ BEGIN
                        CREATE TYPE task_status AS ENUM ('open', 'claimed', 'partial_pending_handoff', 'completed', 'failed');
                    EXCEPTION WHEN duplicate_object THEN
                        -- Type already exists
                    END $$;
                """)

                cur.execute("""
                    CREATE TABLE IF NOT EXISTS agent_tasks (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        creator_agent_id TEXT NOT NULL,
                        claimer_agent_id TEXT,
                        description TEXT NOT NULL CHECK (char_length(description) > 0),
                        status task_status NOT NULL DEFAULT 'open',
                        metadata JSONB DEFAULT '{}',
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        completed_at TIMESTAMPTZ
                    );
                """)

                cur.execute("""
                    CREATE TABLE IF NOT EXISTS task_contributions (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
                        agent_id TEXT NOT NULL,
                        kind TEXT NOT NULL CHECK (kind IN ('bid', 'submission')),
                        message TEXT,
                        content TEXT,
                        complete BOOLEAN,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                    );
                """)

                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_tasks_status ON agent_tasks(status);
                    CREATE INDEX IF NOT EXISTS idx_tasks_creator ON agent_tasks(creator_agent_id);
                    CREATE INDEX IF NOT EXISTS idx_tasks_claimer ON agent_tasks(claimer_agent_id);
                    CREATE INDEX IF NOT EXISTS idx_contributions_task_id ON task_contributions(task_id);
                """)
            conn.commit()

    def _row_to_task(self, row: dict[str, Any]) -> Task:
        """Convert a PostgreSQL row to a Task dataclass."""
        # Fetch contributions
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT agent_id, kind, message, content, complete, created_at
                       FROM task_contributions
                       WHERE task_id = %s
                       ORDER BY created_at ASC""",
                    (str(row["id"]),)
                )
                contributions = [
                    {
                        "kind": r["kind"],
                        "agent_id": r["agent_id"],
                        "message": r["message"],
                        "content": r["content"],
                        "complete": r["complete"],
                        "at": r["created_at"].timestamp() if r["created_at"] else time.time(),
                    }
                    for r in cur.fetchall()
                ]

        return Task(
            id=str(row["id"]),
            creator_agent_id=row["creator_agent_id"],
            description=row["description"],
            status=TaskStatus(row["status"]),
            created_at=row["created_at"].timestamp() if row["created_at"] else time.time(),
            metadata=row["metadata"] or {},
            contributions=contributions,
            claimer_agent_id=row["claimer_agent_id"],
        )

    # ── Public API (mirrors Blackboard exactly) ─────────────────

    def create(
        self,
        creator_agent_id: str,
        description: str,
        metadata: dict[str, Any] | None = None,
    ) -> Task:
        """Insert a new OPEN task and return it."""
        if not description or not description.strip():
            raise ValueError("description must be non-empty")

        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO agent_tasks (creator_agent_id, description, status, metadata)
                       VALUES (%s, %s, 'open', %s)
                       RETURNING id, creator_agent_id, description, status, metadata, created_at, claimer_agent_id""",
                    (creator_agent_id, description.strip(), json.dumps(metadata or {}))
                )
                row = cur.fetchone()
            conn.commit()

        return self._row_to_task(row)

    def bid(
        self,
        task_id: str,
        bidder_agent_id: str,
        message: str | None = None,
    ) -> Task:
        """Claim an OPEN task or accept a hand-off from PARTIAL_PENDING_HANDOFF."""
        with self._connect() as conn:
            with conn.cursor() as cur:
                # Lock the row for update (prevents race conditions)
                cur.execute(
                    "SELECT status FROM agent_tasks WHERE id = %s FOR UPDATE",
                    (task_id,)
                )
                row = cur.fetchone()
                if not row:
                    raise KeyError(task_id)
                if row["status"] not in ("open", "partial_pending_handoff"):
                    raise TaskStateError(f"cannot bid on task in state {row['status']!r}")

                # Add bid contribution
                cur.execute(
                    """INSERT INTO task_contributions (task_id, agent_id, kind, message)
                       VALUES (%s, %s, 'bid', %s)""",
                    (task_id, bidder_agent_id, message)
                )

                # Update task status
                cur.execute(
                    """UPDATE agent_tasks
                       SET status = 'claimed', claimer_agent_id = %s, updated_at = now()
                       WHERE id = %s
                       RETURNING id, creator_agent_id, description, status, metadata, created_at, claimer_agent_id""",
                    (bidder_agent_id, task_id)
                )
                updated = cur.fetchone()
            conn.commit()

        return self._row_to_task(updated)

    def submit(
        self,
        task_id: str,
        submitter_agent_id: str,
        content: str,
        complete: bool,
    ) -> Task:
        """Submit work against a CLAIMED task."""
        if not content or not content.strip():
            raise ValueError("content must be non-empty")

        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT status, claimer_agent_id FROM agent_tasks WHERE id = %s FOR UPDATE",
                    (task_id,)
                )
                row = cur.fetchone()
                if not row:
                    raise KeyError(task_id)
                if row["status"] != "claimed":
                    raise TaskStateError(f"cannot submit on task in state {row['status']!r}")
                if row["claimer_agent_id"] != submitter_agent_id:
                    raise TaskStateError("only the current claimer can submit on this task")

                # Add submission contribution
                cur.execute(
                    """INSERT INTO task_contributions (task_id, agent_id, kind, content, complete)
                       VALUES (%s, %s, 'submission', %s, %s)""",
                    (task_id, submitter_agent_id, content, complete)
                )

                # Update task status
                new_status = "completed" if complete else "partial_pending_handoff"
                new_claimer = None if not complete else submitter_agent_id
                completed_at = "now()" if complete else "NULL"

                cur.execute(
                    f"""UPDATE agent_tasks
                       SET status = %s, claimer_agent_id = %s, updated_at = now(), completed_at = {completed_at}
                       WHERE id = %s
                       RETURNING id, creator_agent_id, description, status, metadata, created_at, claimer_agent_id""",
                    (new_status, new_claimer, task_id)
                )
                updated = cur.fetchone()
            conn.commit()

        return self._row_to_task(updated)

    def get(self, task_id: str) -> Task | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id, creator_agent_id, description, status, metadata, created_at, claimer_agent_id
                       FROM agent_tasks WHERE id = %s""",
                    (task_id,)
                )
                row = cur.fetchone()
        if not row:
            return None
        return self._row_to_task(row)

    def list_open(self) -> list[Task]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id, creator_agent_id, description, status, metadata, created_at, claimer_agent_id
                       FROM agent_tasks WHERE status = 'open' ORDER BY created_at DESC"""
                )
                rows = cur.fetchall()
        return [self._row_to_task(r) for r in rows]

    def count(self) -> int:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS cnt FROM agent_tasks")
                return cur.fetchone()["cnt"]

    def reset(self) -> None:
        """Test-only: wipe all tasks. NOT exposed via gateway."""
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM task_contributions")
                cur.execute("DELETE FROM agent_tasks")
            conn.commit()


# Module-level singleton — drop-in replacement for blackboard.
vaultbrain_store = VaultBrainStore()
