"""Phase 7-A — TelemetryMonitor + /telemetry/summary endpoint tests.

Run from repo root:
    pytest services/agent-gateway/tests/test_telemetry.py -v
"""

from __future__ import annotations

import sys
import time
from pathlib import Path
from typing import Iterator

import fakeredis
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import app  # noqa: E402
from async_bus import (  # noqa: E402
    CHANNEL_CLAIMED,
    CHANNEL_CREATED,
    CHANNEL_HANDOFF,
    CHANNEL_SUBMITTED,
    AsyncEventBus,
)
from telemetry_monitor import TelemetryMonitor, default_monitor  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_default_monitor() -> Iterator[None]:
    default_monitor.reset()
    yield
    default_monitor.reset()


def test_summary_returns_expected_shape() -> None:
    mon = TelemetryMonitor(db_path=":memory:")
    summary = mon.summary()
    assert summary == {
        "agents": {},
        "totals": {"created": 0, "claimed": 0, "handoff": 0, "submitted": 0},
        "agent_count": 0,
        "updated_at": 0.0,
    }
    mon.close()


def test_record_aggregates_per_agent_and_kind() -> None:
    mon = TelemetryMonitor(db_path=":memory:")
    mon.record(agent_id="alice", event_kind="created")
    mon.record(agent_id="alice", event_kind="created")
    mon.record(agent_id="alice", event_kind="claimed")
    mon.record(agent_id="bob", event_kind="claimed")

    summary = mon.summary()
    assert summary["agent_count"] == 2
    assert summary["agents"]["alice"]["created"] == 2
    assert summary["agents"]["alice"]["claimed"] == 1
    assert summary["agents"]["bob"]["claimed"] == 1
    assert summary["totals"]["created"] == 2
    assert summary["totals"]["claimed"] == 2
    assert summary["updated_at"] > 0
    mon.close()


def test_monitor_is_noop_when_bus_disabled() -> None:
    """No REDIS_URL → start() doesn't spawn a thread; summary still works."""
    disabled_bus = AsyncEventBus(url=None, client=None)
    mon = TelemetryMonitor(db_path=":memory:", bus=disabled_bus)
    mon.start()
    assert mon.is_running is False
    # Direct record still works (used by tests, ops admin tools, etc.)
    mon.record(agent_id="agent_x", event_kind="created")
    assert mon.summary()["totals"]["created"] == 1
    mon.close()


def test_subscriber_updates_counters_from_bus_events(tmp_path: Path) -> None:
    """End-to-end: publish on the bus → counter increments via subscriber."""
    client = fakeredis.FakeRedis(decode_responses=True)
    bus = AsyncEventBus(url="redis://fake", client=client)
    mon = TelemetryMonitor(db_path=str(tmp_path / "tel.db"), bus=bus)
    mon.start()
    time.sleep(0.1)  # let subscriber settle on the 4 channels

    bus.publish_task_created(task_id="t1", creator_agent_id="alice", description="x", created_at=1.0)
    bus.publish_task_claimed(task_id="t1", claimer_agent_id="bob", at=2.0)
    bus.publish_task_handoff(task_id="t1", previous_claimer="bob", at=3.0)
    bus.publish_task_submitted(task_id="t1", submitter_agent_id="alice", at=4.0)

    # Poll up to 2s for the subscriber to drain
    deadline = time.time() + 2.0
    while time.time() < deadline:
        summary = mon.summary()
        if summary["totals"]["submitted"] >= 1:
            break
        time.sleep(0.05)

    summary = mon.summary()
    assert summary["totals"]["created"] == 1
    assert summary["totals"]["claimed"] == 1
    assert summary["totals"]["handoff"] == 1
    assert summary["totals"]["submitted"] == 1
    assert summary["agents"]["alice"]["created"] == 1
    assert summary["agents"]["bob"]["claimed"] == 1
    assert summary["agents"]["alice"]["submitted"] == 1
    mon.close()


def test_summary_endpoint_is_public() -> None:
    """GET /telemetry/summary bypasses auth middleware."""
    client = TestClient(app)
    response = client.get("/telemetry/summary")
    assert response.status_code == 200
    body = response.json()
    assert "agents" in body
    assert "totals" in body
    assert set(body["totals"].keys()) == {"created", "claimed", "handoff", "submitted"}


def test_summary_endpoint_reflects_direct_records() -> None:
    """Direct record on default_monitor surfaces through the HTTP endpoint."""
    default_monitor.record(agent_id="agent_telemetry_test", event_kind="created")
    default_monitor.record(agent_id="agent_telemetry_test", event_kind="submitted")

    client = TestClient(app)
    response = client.get("/telemetry/summary")
    body = response.json()
    assert body["agents"]["agent_telemetry_test"]["created"] == 1
    assert body["agents"]["agent_telemetry_test"]["submitted"] == 1
    assert body["totals"]["created"] >= 1
