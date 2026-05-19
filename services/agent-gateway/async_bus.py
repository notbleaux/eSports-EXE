"""
async_bus.py — Redis Pub/Sub event bus for the agent-gateway.

[Ver001.000] · Phase 5 of PLN-003-network-api

Publishes task-lifecycle events so downstream consumers (Hermes-MiMo
worker in Phase 4, telemetry monitor in Phase 7, future UI live-feeds)
can react without polling.

Activation is **opt-in** via `REDIS_URL` env var. If unset, the bus is
a no-op stub — `publish_*` methods return immediately, no Redis client
is constructed, no network calls happen.

Channels (4):
  agent.tasks.created    {id, creator_agent_id, description, created_at}
  agent.tasks.claimed    {id, claimer_agent_id, at}
  agent.tasks.handoff    {id, previous_claimer, at}   (partial submit)
  agent.tasks.submitted  {id, submitter_agent_id, at} (complete submit)

Reuses the existing Redis service in `docker-compose.yml`. Single
runtime dep added: `redis>=5.0,<6.0` (sync client; FastAPI's own thread
pool absorbs the blocking publish, which is fast — <1ms typical).

Design constraints:
  - Publish failures are logged but never propagated to API callers
    (same fire-and-forget contract as SupabaseMirror)
  - One channel per logical event, not one per task, so subscribers
    can filter at the channel level
  - JSON payloads (UTF-8) for cross-language consumer compatibility
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any, Iterator

REDIS_URL_ENV = "REDIS_URL"

CHANNEL_CREATED = "agent.tasks.created"
CHANNEL_CLAIMED = "agent.tasks.claimed"
CHANNEL_HANDOFF = "agent.tasks.handoff"
CHANNEL_SUBMITTED = "agent.tasks.submitted"


def _log(level: str, msg: str) -> None:
    sys.stderr.write(f"[async_bus {level}] {msg}\n")


class AsyncEventBus:
    """Thin wrapper over `redis.Redis` with task-lifecycle publish helpers.

    No-op when `REDIS_URL` is unset (or the optional `redis` library
    is not installed). Tests pass a `client` directly (e.g. fakeredis)
    to bypass env discovery.
    """

    def __init__(
        self,
        url: str | None = None,
        client: Any | None = None,
    ) -> None:
        self._url = url
        self._client = client
        self._connect_failed = False

    @classmethod
    def from_env(cls) -> AsyncEventBus:
        return cls(url=os.environ.get(REDIS_URL_ENV) or None)

    @property
    def is_enabled(self) -> bool:
        """True if a client is available (either injected or env-derived)."""
        if self._client is not None:
            return True
        if not self._url or self._connect_failed:
            return False
        # Lazy-connect — defer redis import + connection until first publish
        return True

    def _get_client(self) -> Any | None:
        if self._client is not None:
            return self._client
        if not self._url or self._connect_failed:
            return None
        try:
            import redis  # type: ignore[import-not-found]
        except ImportError:
            _log("warn", "redis library not installed; bus is no-op (pip install redis)")
            self._connect_failed = True
            return None
        try:
            self._client = redis.Redis.from_url(self._url, decode_responses=True)
            # Smoke-ping to surface connection errors at startup, not first publish.
            self._client.ping()
            return self._client
        except Exception as e:  # broad — any Redis connection error
            _log("warn", f"redis connection failed ({e!r}); bus is no-op")
            self._connect_failed = True
            self._client = None
            return None

    def _publish(self, channel: str, payload: dict[str, Any]) -> None:
        client = self._get_client()
        if client is None:
            return
        try:
            client.publish(channel, json.dumps(payload))
        except Exception as e:  # never crash the API caller
            _log("warn", f"publish to {channel!r} failed: {e!r}")

    # ---- public publish methods ----

    def publish_task_created(
        self,
        task_id: str,
        creator_agent_id: str,
        description: str,
        created_at: float,
    ) -> None:
        self._publish(
            CHANNEL_CREATED,
            {
                "id": task_id,
                "creator_agent_id": creator_agent_id,
                "description": description,
                "created_at": created_at,
            },
        )

    def publish_task_claimed(
        self,
        task_id: str,
        claimer_agent_id: str,
        at: float,
    ) -> None:
        self._publish(
            CHANNEL_CLAIMED,
            {"id": task_id, "claimer_agent_id": claimer_agent_id, "at": at},
        )

    def publish_task_handoff(
        self,
        task_id: str,
        previous_claimer: str,
        at: float,
    ) -> None:
        self._publish(
            CHANNEL_HANDOFF,
            {"id": task_id, "previous_claimer": previous_claimer, "at": at},
        )

    def publish_task_submitted(
        self,
        task_id: str,
        submitter_agent_id: str,
        at: float,
    ) -> None:
        self._publish(
            CHANNEL_SUBMITTED,
            {"id": task_id, "submitter_agent_id": submitter_agent_id, "at": at},
        )

    # ---- consumer API ----

    def subscribe(self, *channels: str) -> Iterator[dict[str, Any]]:
        """Yield decoded JSON message payloads from the given channels.

        Blocking generator. Returns immediately if bus is disabled.
        Consumer typically runs in a dedicated thread or asyncio task.
        """
        client = self._get_client()
        if client is None:
            return
        pubsub = client.pubsub()
        pubsub.subscribe(*channels)
        try:
            for msg in pubsub.listen():
                if msg.get("type") != "message":
                    continue
                data = msg.get("data")
                if data is None:
                    continue
                try:
                    yield json.loads(data)
                except (ValueError, TypeError):
                    _log("warn", f"non-JSON payload on {msg.get('channel')!r}: {data!r}")
        finally:
            try:
                pubsub.close()
            except Exception:
                pass


# Module-level singleton — pulls env at import time.
default_bus = AsyncEventBus.from_env()
