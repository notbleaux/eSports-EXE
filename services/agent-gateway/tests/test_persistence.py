"""Phase 3 — SQLite persistence + durability tests.

These exercise the storage layer directly (not via HTTP). They verify
that tasks survive Blackboard instance restarts and that the schema
constraints behave (FK cascade on task delete, etc.).

Run from repo root:
    pytest services/agent-gateway/tests/test_persistence.py -v
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from blackboard import Blackboard, TaskStatus  # noqa: E402


def test_tasks_persist_across_blackboard_restarts(tmp_path: Path) -> None:
    """A task created with one Blackboard instance is readable from a new one
    pointed at the same file. This is the core Phase 3 win over Phase 2."""
    db_path = tmp_path / "phase3.db"

    bb1 = Blackboard(str(db_path))
    task = bb1.create(creator_agent_id="agent_a", description="durable work")
    bb1.bid(task_id=task.id, bidder_agent_id="agent_b", message="claiming")
    bb1.submit(
        task_id=task.id,
        submitter_agent_id="agent_b",
        content="partial result",
        complete=False,
    )
    bb1.close()

    bb2 = Blackboard(str(db_path))
    reloaded = bb2.get(task.id)
    assert reloaded is not None
    assert reloaded.status == TaskStatus.PARTIAL_PENDING_HANDOFF
    assert reloaded.creator_agent_id == "agent_a"
    assert reloaded.claimer_agent_id is None  # freed on partial submit
    kinds = [c["kind"] for c in reloaded.contributions]
    assert kinds == ["bid", "submission"]
    bb2.close()


def test_contributions_cascade_delete_with_task(tmp_path: Path) -> None:
    """FK ON DELETE CASCADE: removing a task removes its contributions."""
    bb = Blackboard(str(tmp_path / "cascade.db"))
    task = bb.create(creator_agent_id="agent_a", description="will be deleted")
    bb.bid(task_id=task.id, bidder_agent_id="agent_b")

    # Bypass public API to verify cascade — directly DELETE the task row
    bb._conn.execute("DELETE FROM tasks WHERE id = ?", (task.id,))
    bb._conn.commit()

    orphans = bb._conn.execute(
        "SELECT COUNT(*) AS c FROM task_contributions WHERE task_id = ?",
        (task.id,),
    ).fetchone()
    assert orphans["c"] == 0
    bb.close()


def test_concurrent_create_is_serialized() -> None:
    """The Blackboard lock should serialize writes even when called rapidly."""
    bb = Blackboard(":memory:")
    for i in range(50):
        bb.create(creator_agent_id=f"agent_{i}", description=f"task {i}")
    assert bb.count() == 50
    assert len(bb.list_open()) == 50
    bb.close()


def test_list_open_only_returns_open_tasks() -> None:
    bb = Blackboard(":memory:")
    a = bb.create(creator_agent_id="creator", description="task a")
    b = bb.create(creator_agent_id="creator", description="task b")
    c = bb.create(creator_agent_id="creator", description="task c")

    bb.bid(task_id=a.id, bidder_agent_id="worker")
    bb.bid(task_id=b.id, bidder_agent_id="worker")
    bb.submit(task_id=a.id, submitter_agent_id="worker", content="done", complete=True)
    # a: completed, b: claimed, c: open
    open_ids = {t.id for t in bb.list_open()}
    assert open_ids == {c.id}
    assert bb.count() == 3
    bb.close()


def test_bid_on_unknown_task_raises_keyerror() -> None:
    bb = Blackboard(":memory:")
    with pytest.raises(KeyError):
        bb.bid(task_id="missing-uuid", bidder_agent_id="agent")
    bb.close()


def test_submit_on_unknown_task_raises_keyerror() -> None:
    bb = Blackboard(":memory:")
    with pytest.raises(KeyError):
        bb.submit(task_id="missing-uuid", submitter_agent_id="agent", content="x", complete=True)
    bb.close()


def test_create_empty_description_rejected() -> None:
    bb = Blackboard(":memory:")
    with pytest.raises(ValueError):
        bb.create(creator_agent_id="agent", description="   ")
    bb.close()


def test_submit_empty_content_rejected() -> None:
    bb = Blackboard(":memory:")
    task = bb.create(creator_agent_id="agent_a", description="task")
    bb.bid(task_id=task.id, bidder_agent_id="agent_b")
    with pytest.raises(ValueError):
        bb.submit(task_id=task.id, submitter_agent_id="agent_b", content="", complete=True)
    bb.close()


def test_handoff_chain_persisted(tmp_path: Path) -> None:
    """Full open→claimed→partial→re-claimed→completed chain reloads correctly."""
    db_path = tmp_path / "chain.db"

    bb = Blackboard(str(db_path))
    task = bb.create(creator_agent_id="alice", description="multi-stage")
    bb.bid(task_id=task.id, bidder_agent_id="bob")
    bb.submit(task_id=task.id, submitter_agent_id="bob", content="stage 1", complete=False)
    bb.bid(task_id=task.id, bidder_agent_id="alice", message="taking over")
    bb.submit(task_id=task.id, submitter_agent_id="alice", content="stage 2", complete=True)
    bb.close()

    bb2 = Blackboard(str(db_path))
    final = bb2.get(task.id)
    assert final is not None
    assert final.status == TaskStatus.COMPLETED
    assert final.claimer_agent_id == "alice"
    kinds = [c["kind"] for c in final.contributions]
    assert kinds == ["bid", "submission", "bid", "submission"]
    bb2.close()


def test_reset_clears_all_tasks_and_contributions() -> None:
    bb = Blackboard(":memory:")
    task = bb.create(creator_agent_id="a", description="x")
    bb.bid(task_id=task.id, bidder_agent_id="b")
    assert bb.count() == 1
    bb.reset()
    assert bb.count() == 0
    # Contributions table should also be empty (cascade or direct delete)
    rows = bb._conn.execute("SELECT COUNT(*) AS c FROM task_contributions").fetchone()
    assert rows["c"] == 0
    bb.close()
