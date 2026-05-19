"""Phase 5 — AsyncEventBus + Redis Pub/Sub tests.

Uses `fakeredis` as a drop-in replacement so tests don't require a
live Redis daemon.

Run from repo root:
    pytest services/agent-gateway/tests/test_async_bus.py -v
"""

from __future__ import annotations

import json
import sys
import threading
import time
from pathlib import Path
from typing import Any

import fakeredis
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from async_bus import (  # noqa: E402
    CHANNEL_CLAIMED,
    CHANNEL_CREATED,
    CHANNEL_HANDOFF,
    CHANNEL_SUBMITTED,
    AsyncEventBus,
)
from blackboard import Blackboard  # noqa: E402


def test_disabled_bus_is_silent_noop() -> None:
    """Bus with no URL and no client is silent — publishes return immediately."""
    bus = AsyncEventBus(url=None, client=None)
    assert bus.is_enabled is False
    bus.publish_task_created(task_id="t1", creator_agent_id="a", description="d", created_at=1.0)
    bus.publish_task_claimed(task_id="t1", claimer_agent_id="b", at=2.0)
    bus.publish_task_handoff(task_id="t1", previous_claimer="b", at=3.0)
    bus.publish_task_submitted(task_id="t1", submitter_agent_id="b", at=4.0)
    # Reaching here without exception is the assertion.


def _drain_pubsub(pubsub: Any, expected: int, timeout: float = 2.0) -> list[dict[str, Any]]:
    """Synchronously collect `expected` messages from a fakeredis pubsub."""
    collected: list[dict[str, Any]] = []
    deadline = time.time() + timeout
    while len(collected) < expected and time.time() < deadline:
        msg = pubsub.get_message(timeout=0.1)
        if msg is None:
            continue
        if msg.get("type") != "message":
            continue
        data = msg.get("data")
        if isinstance(data, bytes):
            data = data.decode("utf-8")
        collected.append(json.loads(data))
    return collected


def test_enabled_bus_publishes_to_correct_channel() -> None:
    """A subscriber on `agent.tasks.created` receives the right payload."""
    client = fakeredis.FakeRedis(decode_responses=True)
    bus = AsyncEventBus(url="redis://fake", client=client)
    assert bus.is_enabled is True

    pubsub = client.pubsub()
    pubsub.subscribe(CHANNEL_CREATED)
    # Consume the subscribe-confirmation
    pubsub.get_message(timeout=0.1)

    bus.publish_task_created(
        task_id="t-uuid", creator_agent_id="alice",
        description="ship phase 5", created_at=42.0,
    )

    msgs = _drain_pubsub(pubsub, expected=1)
    pubsub.close()
    assert len(msgs) == 1
    assert msgs[0] == {
        "id": "t-uuid",
        "creator_agent_id": "alice",
        "description": "ship phase 5",
        "created_at": 42.0,
    }


def test_blackboard_full_lifecycle_fires_all_4_channels() -> None:
    """End-to-end: subscribers on all 4 channels see create + bid + partial + bid + complete."""
    client = fakeredis.FakeRedis(decode_responses=True)
    bus = AsyncEventBus(url="redis://fake", client=client)

    pubsub = client.pubsub()
    pubsub.subscribe(CHANNEL_CREATED, CHANNEL_CLAIMED, CHANNEL_HANDOFF, CHANNEL_SUBMITTED)
    # Drain the 4 subscribe-confirmations
    for _ in range(4):
        pubsub.get_message(timeout=0.1)

    bb = Blackboard(":memory:", bus=bus)
    task = bb.create(creator_agent_id="alice", description="multi-stage")
    bb.bid(task_id=task.id, bidder_agent_id="bob")
    bb.submit(task_id=task.id, submitter_agent_id="bob", content="partial", complete=False)
    bb.bid(task_id=task.id, bidder_agent_id="alice", message="taking over")
    bb.submit(task_id=task.id, submitter_agent_id="alice", content="done", complete=True)
    bb.close()

    # Expect: created, claimed (bob), handoff, claimed (alice), submitted
    msgs = _drain_pubsub(pubsub, expected=5)
    pubsub.close()
    assert len(msgs) == 5

    # Ordering preserved (single publisher, same channel ordering across channels in fakeredis)
    assert msgs[0]["creator_agent_id"] == "alice"        # created
    assert msgs[1]["claimer_agent_id"] == "bob"          # bob claimed
    assert msgs[2]["previous_claimer"] == "bob"          # bob's partial → handoff
    assert msgs[3]["claimer_agent_id"] == "alice"        # alice re-claimed
    assert msgs[4]["submitter_agent_id"] == "alice"      # alice completed


def test_publish_failure_does_not_crash_caller() -> None:
    """Redis publish raising propagates as a logged warning, not an exception."""

    class BrokenClient:
        def publish(self, channel: str, payload: str) -> None:
            raise ConnectionError("simulated outage")

    bus = AsyncEventBus(url="redis://fake", client=BrokenClient())
    # Should not raise — the publish failure is swallowed.
    bus.publish_task_created(task_id="t1", creator_agent_id="a", description="d", created_at=1.0)


def test_subscribe_yields_decoded_payloads() -> None:
    """The public `subscribe()` generator yields parsed JSON payloads."""
    client = fakeredis.FakeRedis(decode_responses=True)
    bus = AsyncEventBus(url="redis://fake", client=client)

    received: list[dict[str, Any]] = []

    def consume() -> None:
        for payload in bus.subscribe(CHANNEL_CLAIMED):
            received.append(payload)
            if len(received) >= 2:
                return

    consumer = threading.Thread(target=consume, daemon=True)
    consumer.start()
    time.sleep(0.1)  # let subscriber settle

    bus.publish_task_claimed(task_id="t1", claimer_agent_id="bob", at=1.0)
    bus.publish_task_claimed(task_id="t2", claimer_agent_id="alice", at=2.0)
    consumer.join(timeout=2.0)

    assert len(received) == 2
    assert {m["id"] for m in received} == {"t1", "t2"}


def test_blackboard_bus_parameter_isolated() -> None:
    """Passing a custom bus to Blackboard doesn't leak to default_bus."""
    custom_client = fakeredis.FakeRedis(decode_responses=True)
    custom_bus = AsyncEventBus(url="redis://fake", client=custom_client)

    pubsub = custom_client.pubsub()
    pubsub.subscribe(CHANNEL_CREATED)
    pubsub.get_message(timeout=0.1)  # subscribe confirm

    bb = Blackboard(":memory:", bus=custom_bus)
    bb.create(creator_agent_id="a", description="x")

    msgs = _drain_pubsub(pubsub, expected=1)
    pubsub.close()
    bb.close()
    assert len(msgs) == 1
