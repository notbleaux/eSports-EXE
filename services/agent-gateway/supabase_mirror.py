"""
supabase_mirror.py — Optional cloud mirror for the agent-gateway blackboard.

[Ver001.000] · Phase 3.5 of PLN-003-network-api

Sits *alongside* the SQLite primary store as a fire-and-forget write
mirror, so a copy of every task lifecycle event ends up in the
NJZitegeiste Supabase project for disaster recovery.

Activation is **opt-in** via env vars:

    SUPABASE_URL   = https://<project-ref>.supabase.co
    SUPABASE_KEY   = service-role JWT (write access) OR anon key + RLS policy

If either is unset, this module returns a no-op stub so the gateway
runs as plain Phase 3 SQLite without the mirror. No new runtime deps
beyond stdlib (urllib.request, json).

Schema expected in Supabase (mirror tables; prefixed to avoid clash with
the existing NJZitegeiste eSports schema):

    create table agent_gateway_tasks (
        id text primary key,
        creator_agent_id text not null,
        description text not null,
        status text not null,
        created_at double precision not null,
        metadata jsonb not null default '{}'::jsonb,
        claimer_agent_id text,
        mirrored_at double precision not null default extract(epoch from now())
    );

    create table agent_gateway_contributions (
        id bigserial primary key,
        task_id text not null references agent_gateway_tasks(id) on delete cascade,
        kind text not null,
        agent_id text not null,
        payload jsonb not null default '{}'::jsonb,
        at double precision not null
    );

Phase 3.5 itself does NOT auto-apply this schema — the operator runs the
DDL once via the Supabase MCP / dashboard. The mirror gracefully
degrades to no-op if the tables don't exist (logged-once warning).

Design constraints:
- Mirror is write-only from the gateway's POV (no reads). Reads always
  hit local SQLite for latency.
- Writes are non-blocking. The mirror runs in a daemon thread pool;
  failures are logged but never propagated to the API caller.
- Order is preserved per task_id (single-writer thread per task) but
  not across tasks (different tasks can race).
"""

from __future__ import annotations

import json
import os
import queue
import sys
import threading
import urllib.error
import urllib.request
from typing import Any, Iterable

SUPABASE_URL_ENV = "SUPABASE_URL"
SUPABASE_KEY_ENV = "SUPABASE_KEY"


def _log(level: str, msg: str) -> None:
    sys.stderr.write(f"[supabase_mirror {level}] {msg}\n")


class SupabaseMirror:
    """Async write-mirror to a Supabase REST endpoint.

    Each public method enqueues a job onto an internal queue; a daemon
    thread drains the queue serially. The thread is started lazily on
    first enqueue.

    No-op stub semantics: pass `url=None` (or omit) to disable. The
    public methods become cheap no-ops; `is_enabled` returns False.
    """

    def __init__(
        self,
        url: str | None = None,
        key: str | None = None,
        *,
        timeout_seconds: float = 5.0,
    ) -> None:
        self._url = url
        self._key = key
        self._timeout = timeout_seconds
        self._queue: queue.Queue[tuple[str, dict[str, Any]] | None] = queue.Queue()
        self._worker: threading.Thread | None = None
        self._missing_tables_warned = False

    @classmethod
    def from_env(cls) -> SupabaseMirror:
        """Build a mirror from env vars. Returns a no-op if either is unset."""
        url = os.environ.get(SUPABASE_URL_ENV)
        key = os.environ.get(SUPABASE_KEY_ENV)
        return cls(url=url or None, key=key or None)

    @property
    def is_enabled(self) -> bool:
        return bool(self._url and self._key)

    def _ensure_worker(self) -> None:
        if self._worker is not None and self._worker.is_alive():
            return
        self._worker = threading.Thread(
            target=self._drain_queue,
            name="supabase-mirror-writer",
            daemon=True,
        )
        self._worker.start()

    def _enqueue(self, table: str, payload: dict[str, Any]) -> None:
        if not self.is_enabled:
            return
        self._queue.put((table, payload))
        self._ensure_worker()

    def _drain_queue(self) -> None:
        while True:
            job = self._queue.get()
            if job is None:  # sentinel
                return
            table, payload = job
            try:
                self._post(table, payload)
            except Exception as e:  # never let the worker thread die
                _log("warn", f"mirror write to {table} failed: {e!r}")
            finally:
                self._queue.task_done()

    def _post(self, table: str, payload: dict[str, Any]) -> None:
        """POST one row via Supabase REST. Best-effort; raises on bad response."""
        assert self._url and self._key
        endpoint = f"{self._url.rstrip('/')}/rest/v1/{table}"
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "apikey": self._key,
                "Authorization": f"Bearer {self._key}",
                "Prefer": "resolution=merge-duplicates",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                if resp.status >= 300:
                    raise RuntimeError(f"status {resp.status}: {resp.read()[:200]!r}")
        except urllib.error.HTTPError as e:
            if e.code == 404 and not self._missing_tables_warned:
                _log(
                    "warn",
                    f"mirror table {table!r} not found (404). See module docstring "
                    f"for the schema; mirror is degrading to no-op for this run.",
                )
                self._missing_tables_warned = True
                return
            raise

    # ---- public mirror methods (called by Blackboard after successful local writes) ----

    def mirror_task_insert(
        self,
        task_id: str,
        creator_agent_id: str,
        description: str,
        status: str,
        created_at: float,
        metadata: dict[str, Any],
        claimer_agent_id: str | None = None,
    ) -> None:
        self._enqueue(
            "agent_gateway_tasks",
            {
                "id": task_id,
                "creator_agent_id": creator_agent_id,
                "description": description,
                "status": status,
                "created_at": created_at,
                "metadata": metadata,
                "claimer_agent_id": claimer_agent_id,
            },
        )

    def mirror_task_update(
        self,
        task_id: str,
        status: str,
        claimer_agent_id: str | None,
    ) -> None:
        # Supabase's `merge-duplicates` handles upsert-on-primary-key
        self._enqueue(
            "agent_gateway_tasks",
            {
                "id": task_id,
                "status": status,
                "claimer_agent_id": claimer_agent_id,
            },
        )

    def mirror_contribution(
        self,
        task_id: str,
        kind: str,
        agent_id: str,
        payload: dict[str, Any],
        at: float,
    ) -> None:
        self._enqueue(
            "agent_gateway_contributions",
            {
                "task_id": task_id,
                "kind": kind,
                "agent_id": agent_id,
                "payload": payload,
                "at": at,
            },
        )

    # ---- lifecycle / test hooks ----

    def flush(self, timeout: float = 5.0) -> None:
        """Block until all queued mirror writes have completed (or timeout)."""
        if not self.is_enabled:
            return
        self._queue.join()

    def shutdown(self) -> None:
        """Stop the worker thread cleanly."""
        if self._worker is None:
            return
        self._queue.put(None)
        self._worker.join(timeout=2.0)
        self._worker = None

    # ---- introspection (test) ----

    def pending_count(self) -> int:
        return self._queue.qsize()


# Default singleton — pulls env at import time.
default_mirror = SupabaseMirror.from_env()
