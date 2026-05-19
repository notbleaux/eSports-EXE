"""
telemetry_monitor.py — Per-agent event counters for the agent-gateway.

[Ver001.000] · Phase 7-A of PLN-003-network-api

Subscribes to the Phase 5 Redis Pub/Sub bus and aggregates per-agent
event counts into a SQLite-backed `telemetry_counters` table (schema
bootstrapped by `blackboard.py`).

Surfaces via `GET /telemetry/summary` (public endpoint, like /health).

Activation: monitor is opt-in via `REDIS_URL` env var. If unset, the
monitor is a no-op stub — counters never update from the bus, but the
`summary()` API still returns whatever's in the table (allows direct
writes for tests).

Design constraints:
  - Independent SQLite connection on the same DB path as Blackboard.
    WAL journal mode (set by Blackboard) supports concurrent readers
    + single writer; busy_timeout absorbs any write-write contention.
  - Subscriber runs in a daemon thread; survives broken JSON via try/except.
  - No cost / budget enforcement here — Phase 7-A is measurement only.
    Phase 4's worker enforces budgets at the pre-bid decision layer.
"""

from __future__ import annotations

import json
import sqlite3
import sys
import threading
import time
from pathlib import Path
from typing import Any

from async_bus import (
    CHANNEL_CLAIMED,
    CHANNEL_CREATED,
    CHANNEL_HANDOFF,
    CHANNEL_SUBMITTED,
    AsyncEventBus,
    default_bus,
)
from blackboard import (
    DB_PATH_ENV_VAR,
    DEFAULT_DB_PATH,
    SCHEMA,
    _resolve_db_path,
)

# Channel → agent_id-field mapping used to extract who "owns" each event
_CHANNEL_AGENT_FIELD = {
    CHANNEL_CREATED: "creator_agent_id",
    CHANNEL_CLAIMED: "claimer_agent_id",
    CHANNEL_HANDOFF: "previous_claimer",
    CHANNEL_SUBMITTED: "submitter_agent_id",
}
# Channel → friendly event kind stored in the counters table
_CHANNEL_KIND = {
    CHANNEL_CREATED: "created",
    CHANNEL_CLAIMED: "claimed",
    CHANNEL_HANDOFF: "handoff",
    CHANNEL_SUBMITTED: "submitted",
}


def _log(level: str, msg: str) -> None:
    sys.stderr.write(f"[telemetry {level}] {msg}\n")


class TelemetryMonitor:
    """Subscribe to the agent.tasks.* bus + aggregate per-agent counters.

    Construction is cheap; call `start()` to spawn the subscriber thread.
    `summary()` is always safe (reads from the table, never blocks).
    """

    def __init__(
        self,
        db_path: str | Path | None = None,
        bus: AsyncEventBus | None = None,
    ) -> None:
        self._db_path = _resolve_db_path(db_path)
        self._bus = bus if bus is not None else default_bus
        self._conn = sqlite3.connect(self._db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA busy_timeout = 5000")
        # Ensure the telemetry_counters table exists even if Blackboard
        # hasn't been instantiated yet (e.g. telemetry-only deployments).
        self._conn.executescript(SCHEMA)
        self._conn.commit()
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        """Start the bus subscriber in a daemon thread."""
        if not self._bus.is_enabled:
            _log("info", "REDIS_URL unset — monitor will not subscribe; summary still works")
            return
        if self.is_running:
            return
        self._stop.clear()
        self._thread = threading.Thread(
            target=self._consume_loop,
            name="telemetry-subscriber",
            daemon=True,
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=2.0)
            self._thread = None

    def _consume_loop(self) -> None:
        channels = (CHANNEL_CREATED, CHANNEL_CLAIMED, CHANNEL_HANDOFF, CHANNEL_SUBMITTED)
        # async_bus.subscribe() doesn't expose the channel name on each msg,
        # so we run one subscriber per channel in serial — for telemetry's
        # low throughput this is fine (Phase 5's payload includes the
        # relevant agent_id field but not the channel).
        # Workaround: subscribe via raw pubsub to know channel-of-origin.
        client = self._bus._get_client()
        if client is None:
            return
        pubsub = client.pubsub()
        pubsub.subscribe(*channels)
        try:
            for msg in pubsub.listen():
                if self._stop.is_set():
                    break
                if msg.get("type") != "message":
                    continue
                channel = msg.get("channel")
                if isinstance(channel, bytes):
                    channel = channel.decode("utf-8")
                data = msg.get("data")
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                if not data or channel not in _CHANNEL_AGENT_FIELD:
                    continue
                try:
                    payload = json.loads(data)
                except (ValueError, TypeError):
                    _log("warn", f"non-JSON payload on {channel!r}: {data!r}")
                    continue
                agent_field = _CHANNEL_AGENT_FIELD[channel]
                kind = _CHANNEL_KIND[channel]
                agent_id = payload.get(agent_field)
                if not agent_id:
                    continue
                self.record(agent_id=agent_id, event_kind=kind)
        finally:
            try:
                pubsub.close()
            except Exception:
                pass

    def record(self, agent_id: str, event_kind: str) -> None:
        """Upsert a counter row. Safe to call directly (used by tests)."""
        now = time.time()
        self._conn.execute(
            "INSERT INTO telemetry_counters (agent_id, event_kind, count, updated_at) "
            "VALUES (?, ?, 1, ?) "
            "ON CONFLICT (agent_id, event_kind) DO UPDATE SET "
            "  count = count + 1, updated_at = excluded.updated_at",
            (agent_id, event_kind, now),
        )
        self._conn.commit()

    def summary(self) -> dict[str, Any]:
        """Return aggregated counters in a JSON-friendly shape.

        Shape:
          {
            "agents": {
              "<agent_id>": {"created": N, "claimed": N, "handoff": N, "submitted": N},
              ...
            },
            "totals": {"created": N, "claimed": N, "handoff": N, "submitted": N},
            "agent_count": N,
            "updated_at": <epoch float>,
          }
        """
        rows = self._conn.execute(
            "SELECT agent_id, event_kind, count, updated_at FROM telemetry_counters"
        ).fetchall()
        agents: dict[str, dict[str, int]] = {}
        totals: dict[str, int] = {k: 0 for k in _CHANNEL_KIND.values()}
        latest = 0.0
        for r in rows:
            agents.setdefault(r["agent_id"], {})[r["event_kind"]] = r["count"]
            totals[r["event_kind"]] = totals.get(r["event_kind"], 0) + r["count"]
            if r["updated_at"] > latest:
                latest = r["updated_at"]
        return {
            "agents": agents,
            "totals": totals,
            "agent_count": len(agents),
            "updated_at": latest,
        }

    def reset(self) -> None:
        """Test-only — clear all counters."""
        self._conn.execute("DELETE FROM telemetry_counters")
        self._conn.commit()

    def close(self) -> None:
        self.stop()
        self._conn.close()


# Module-level singleton — uses the same DB path as Blackboard.
default_monitor = TelemetryMonitor()
