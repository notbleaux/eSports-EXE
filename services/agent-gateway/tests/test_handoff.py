"""Phase 2 — /tasks/{id}/bid + /tasks/{id}/submit + hand-off semantics.

Run from repo root:
    pytest services/agent-gateway/tests/test_handoff.py -v
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterator
from unittest import mock

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import app  # noqa: E402
from blackboard import blackboard  # noqa: E402
from crypto_client import SecureAgentClient  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_blackboard() -> Iterator[None]:
    blackboard.reset()
    yield
    blackboard.reset()


@pytest.fixture
def two_agents(tmp_path: Path) -> Iterator[tuple[TestClient, SecureAgentClient, SecureAgentClient]]:
    """Two agents registered into a patched public_keys map."""
    alice = SecureAgentClient(agent_id="agent_test_alice", keys_dir=tmp_path / "alice")
    bob = SecureAgentClient(agent_id="agent_test_bob", keys_dir=tmp_path / "bob")
    fake_keys = {
        alice.agent_id: "04" + alice.public_key_hex()[2:],
        bob.agent_id: "04" + bob.public_key_hex()[2:],
    }
    with mock.patch("app._load_public_keys", return_value=fake_keys):
        yield TestClient(app), alice, bob


def _create(client: TestClient, agent: SecureAgentClient, description: str = "do thing") -> str:
    r = client.post("/tasks/create", json={"description": description}, headers=agent.generate_auth_headers())
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_bid_claims_open_task(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    client, alice, bob = two_agents
    task_id = _create(client, alice)

    r = client.post(
        f"/tasks/{task_id}/bid",
        json={"message": "I'll take it"},
        headers=bob.generate_auth_headers(),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "claimed"
    assert body["claimer_agent_id"] == bob.agent_id
    assert any(c["kind"] == "bid" and c["agent_id"] == bob.agent_id for c in body["contributions"])


def test_second_bid_on_claimed_task_rejected(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    client, alice, bob = two_agents
    task_id = _create(client, alice)
    client.post(f"/tasks/{task_id}/bid", json={}, headers=bob.generate_auth_headers())

    r = client.post(f"/tasks/{task_id}/bid", json={}, headers=alice.generate_auth_headers())
    assert r.status_code == 409
    assert "claimed" in r.json()["detail"].lower()


def test_bid_on_unknown_task_404(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    client, _alice, bob = two_agents
    r = client.post("/tasks/does-not-exist/bid", json={}, headers=bob.generate_auth_headers())
    assert r.status_code == 404


def test_submit_complete_marks_task_completed(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    client, alice, bob = two_agents
    task_id = _create(client, alice)
    client.post(f"/tasks/{task_id}/bid", json={}, headers=bob.generate_auth_headers())

    r = client.post(
        f"/tasks/{task_id}/submit",
        json={"content": "here is the answer", "complete": True},
        headers=bob.generate_auth_headers(),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "completed"


def test_submit_incomplete_transitions_to_partial_pending_handoff(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    client, alice, bob = two_agents
    task_id = _create(client, alice)
    client.post(f"/tasks/{task_id}/bid", json={}, headers=bob.generate_auth_headers())

    r = client.post(
        f"/tasks/{task_id}/submit",
        json={"content": "partial result", "complete": False},
        headers=bob.generate_auth_headers(),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "partial_pending_handoff"
    assert body["claimer_agent_id"] is None  # freed for next bidder


def test_handoff_chain_partial_then_rebid_then_complete(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    """End-to-end: bob bids → partial submit → alice picks up → complete."""
    client, alice, bob = two_agents
    task_id = _create(client, alice)

    client.post(f"/tasks/{task_id}/bid", json={}, headers=bob.generate_auth_headers())
    client.post(
        f"/tasks/{task_id}/submit",
        json={"content": "stage 1 done", "complete": False},
        headers=bob.generate_auth_headers(),
    )
    r = client.post(
        f"/tasks/{task_id}/bid",
        json={"message": "I'll finish it"},
        headers=alice.generate_auth_headers(),
    )
    assert r.status_code == 200
    assert r.json()["claimer_agent_id"] == alice.agent_id
    assert r.json()["status"] == "claimed"

    r = client.post(
        f"/tasks/{task_id}/submit",
        json={"content": "stage 2 done", "complete": True},
        headers=alice.generate_auth_headers(),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "completed"
    kinds = [c["kind"] for c in body["contributions"]]
    assert kinds == ["bid", "submission", "bid", "submission"]


def test_submit_by_non_claimer_rejected(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    client, alice, bob = two_agents
    task_id = _create(client, alice)
    client.post(f"/tasks/{task_id}/bid", json={}, headers=bob.generate_auth_headers())

    r = client.post(
        f"/tasks/{task_id}/submit",
        json={"content": "I'm not the claimer", "complete": True},
        headers=alice.generate_auth_headers(),
    )
    assert r.status_code == 409
    assert "claimer" in r.json()["detail"].lower()


def test_submit_on_open_task_rejected(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    client, alice, _bob = two_agents
    task_id = _create(client, alice)

    r = client.post(
        f"/tasks/{task_id}/submit",
        json={"content": "noone bid yet", "complete": True},
        headers=alice.generate_auth_headers(),
    )
    assert r.status_code == 409
    assert "open" in r.json()["detail"].lower()


def test_submit_empty_content_rejected(
    two_agents: tuple[TestClient, SecureAgentClient, SecureAgentClient],
) -> None:
    client, alice, bob = two_agents
    task_id = _create(client, alice)
    client.post(f"/tasks/{task_id}/bid", json={}, headers=bob.generate_auth_headers())

    r = client.post(
        f"/tasks/{task_id}/submit",
        json={"content": "", "complete": True},
        headers=bob.generate_auth_headers(),
    )
    assert r.status_code == 422  # pydantic min_length
