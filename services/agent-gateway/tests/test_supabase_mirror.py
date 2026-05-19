"""Phase 3.5 — SupabaseMirror unit tests.

Verifies:
  - no-op when env unset (default mode in tests)
  - enabled-mirror enqueues correctly + flushes
  - 404 (table missing) degrades gracefully
  - Blackboard.create/bid/submit fire the mirror with the right rows

Run from repo root:
    pytest services/agent-gateway/tests/test_supabase_mirror.py -v
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest import mock
from urllib.error import HTTPError

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from blackboard import Blackboard  # noqa: E402
from supabase_mirror import SupabaseMirror  # noqa: E402


def test_disabled_mirror_is_silent_noop() -> None:
    """Mirror with no URL/key drops all calls without errors."""
    m = SupabaseMirror(url=None, key=None)
    assert m.is_enabled is False
    m.mirror_task_insert(
        task_id="t1", creator_agent_id="a", description="d",
        status="open", created_at=1.0, metadata={},
    )
    m.mirror_task_update(task_id="t1", status="claimed", claimer_agent_id="b")
    m.mirror_contribution(task_id="t1", kind="bid", agent_id="b", payload={}, at=1.0)
    assert m.pending_count() == 0
    m.shutdown()


def test_enabled_mirror_posts_via_urlopen() -> None:
    """Enabled mirror sends POSTs to the REST endpoint after flush()."""
    m = SupabaseMirror(url="https://test.supabase.co", key="testkey")
    assert m.is_enabled is True

    posted: list[tuple[str, dict]] = []

    class FakeResponse:
        status = 201
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def read(self): return b""

    def fake_urlopen(req, timeout):  # noqa: ARG001
        body = json.loads(req.data.decode("utf-8"))
        posted.append((req.full_url, body))
        return FakeResponse()

    with mock.patch("supabase_mirror.urllib.request.urlopen", fake_urlopen):
        m.mirror_task_insert(
            task_id="t-uuid", creator_agent_id="alice", description="ship it",
            status="open", created_at=42.0, metadata={"priority": "high"},
        )
        m.flush()
    m.shutdown()

    assert len(posted) == 1
    url, body = posted[0]
    assert url.endswith("/rest/v1/agent_gateway_tasks")
    assert body["id"] == "t-uuid"
    assert body["creator_agent_id"] == "alice"
    assert body["status"] == "open"
    assert body["metadata"] == {"priority": "high"}


def test_pending_count_reflects_queue_depth() -> None:
    """pending_count tracks unprocessed jobs (before worker drains)."""
    m = SupabaseMirror(url="https://test.supabase.co", key="testkey")
    # Stall the worker by patching _post to block; check queue grows.
    blocker = mock.MagicMock(side_effect=lambda *a, **kw: __import__("time").sleep(0.05))
    with mock.patch.object(m, "_post", blocker):
        for i in range(5):
            m.mirror_task_insert(
                task_id=f"t{i}", creator_agent_id="a", description="d",
                status="open", created_at=float(i), metadata={},
            )
        # Worker is draining slowly; at least one is in flight or pending
        assert m.pending_count() + blocker.call_count <= 5
        m.flush(timeout=5.0)
        assert blocker.call_count == 5
    m.shutdown()


def test_missing_table_404_degrades_gracefully() -> None:
    """A 404 from Supabase (missing mirror schema) is logged and swallowed."""
    m = SupabaseMirror(url="https://test.supabase.co", key="testkey")

    def fake_urlopen(req, timeout):  # noqa: ARG001
        raise HTTPError(
            req.full_url, 404, "Not Found", hdrs=None, fp=None,  # type: ignore[arg-type]
        )

    with mock.patch("supabase_mirror.urllib.request.urlopen", fake_urlopen):
        # Two calls — first warns + swallows, second is a no-op log-wise
        m.mirror_task_insert(
            task_id="t1", creator_agent_id="a", description="d",
            status="open", created_at=1.0, metadata={},
        )
        m.mirror_task_insert(
            task_id="t2", creator_agent_id="a", description="d",
            status="open", created_at=2.0, metadata={},
        )
        m.flush()
    # If the worker crashed, the join in flush() would deadlock — we
    # got here, so the worker survived both 404s.
    m.shutdown()


def test_blackboard_create_fires_mirror_with_correct_row() -> None:
    """Wiring: Blackboard.create triggers mirror_task_insert with right values."""
    mirror = mock.MagicMock(spec=SupabaseMirror)
    mirror.is_enabled = True

    bb = Blackboard(":memory:", mirror=mirror)
    task = bb.create(creator_agent_id="agent_x", description="check the wiring")

    mirror.mirror_task_insert.assert_called_once()
    kwargs = mirror.mirror_task_insert.call_args.kwargs
    assert kwargs["task_id"] == task.id
    assert kwargs["creator_agent_id"] == "agent_x"
    assert kwargs["description"] == "check the wiring"
    assert kwargs["status"] == "open"
    assert kwargs["claimer_agent_id"] is None
    bb.close()


def test_blackboard_bid_and_submit_fire_mirror() -> None:
    """Wiring: bid + submit each issue one contribution mirror + one task-update mirror."""
    mirror = mock.MagicMock(spec=SupabaseMirror)
    mirror.is_enabled = True

    bb = Blackboard(":memory:", mirror=mirror)
    task = bb.create(creator_agent_id="alice", description="task")
    bb.bid(task_id=task.id, bidder_agent_id="bob", message="taking it")
    bb.submit(task_id=task.id, submitter_agent_id="bob", content="done", complete=True)

    # 1 create + 1 bid-contribution + 1 submit-contribution
    assert mirror.mirror_contribution.call_count == 2
    # 1 create-insert + 1 bid-update + 1 submit-update
    assert mirror.mirror_task_insert.call_count == 1
    assert mirror.mirror_task_update.call_count == 2

    # The final task-update is the complete transition
    last_update = mirror.mirror_task_update.call_args_list[-1]
    assert last_update.args[1] == "completed" or last_update.kwargs.get("status") == "completed"
    bb.close()
