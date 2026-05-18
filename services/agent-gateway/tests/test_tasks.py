"""Phase 2 — /tasks/create endpoint tests.

Run from repo root:
    pytest services/agent-gateway/tests/test_tasks.py -v
"""

from __future__ import annotations

import json
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
    """Each test starts with an empty task store."""
    blackboard.reset()
    yield
    blackboard.reset()


@pytest.fixture
def signed_client(tmp_path: Path) -> Iterator[tuple[TestClient, SecureAgentClient]]:
    """Yield a TestClient + an agent whose key is patched into the registry.

    We don't touch the on-disk registry; instead we monkeypatch
    `_load_public_keys` so the middleware sees this ephemeral keypair.
    """
    agent_id = "agent_test_phase2_writer"
    agent = SecureAgentClient(agent_id=agent_id, keys_dir=tmp_path / "keys")

    fake_public_keys = {agent_id: "04" + agent.public_key_hex()[2:]}
    with mock.patch("app._load_public_keys", return_value=fake_public_keys):
        yield TestClient(app), agent


def test_create_task_succeeds_with_valid_signature(
    signed_client: tuple[TestClient, SecureAgentClient],
) -> None:
    client, agent = signed_client
    headers = agent.generate_auth_headers()
    response = client.post(
        "/tasks/create",
        json={"description": "Verify SimRating v2 on Valorant match 12345"},
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "open"
    assert body["creator_agent_id"] == agent.agent_id
    assert body["description"] == "Verify SimRating v2 on Valorant match 12345"
    assert body["id"]  # UUID generated
    assert body["created_at"] > 0


def test_create_task_rejects_unsigned_request() -> None:
    client = TestClient(app)
    response = client.post(
        "/tasks/create",
        json={"description": "no headers"},
    )
    assert response.status_code == 401


def test_create_task_rejects_empty_description(
    signed_client: tuple[TestClient, SecureAgentClient],
) -> None:
    client, agent = signed_client
    headers = agent.generate_auth_headers()
    response = client.post(
        "/tasks/create",
        json={"description": ""},
        headers=headers,
    )
    assert response.status_code == 422  # pydantic min_length validator


def test_create_task_accepts_metadata(
    signed_client: tuple[TestClient, SecureAgentClient],
) -> None:
    client, agent = signed_client
    headers = agent.generate_auth_headers()
    response = client.post(
        "/tasks/create",
        json={
            "description": "Tagged task",
            "metadata": {"priority": "high", "game": "valorant"},
        },
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["metadata"] == {"priority": "high", "game": "valorant"}


def test_health_reflects_blackboard_state(
    signed_client: tuple[TestClient, SecureAgentClient],
) -> None:
    client, agent = signed_client
    assert client.get("/health").json()["open_tasks"] == 0

    headers = agent.generate_auth_headers()
    client.post("/tasks/create", json={"description": "task A"}, headers=headers)
    client.post("/tasks/create", json={"description": "task B"}, headers=headers)

    assert client.get("/health").json()["open_tasks"] == 2
