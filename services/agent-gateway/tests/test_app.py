"""Phase 2 scaffold tests — /health public + middleware rejects bad sig.

Run from repo root:
    pytest services/agent-gateway/tests/ -v
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Make `app` importable when pytest is run from repo root.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import app  # noqa: E402
from crypto_client import SecureAgentClient  # noqa: E402


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_health_is_public_and_returns_200(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "agent-gateway"
    assert body["status"] == "ok"
    assert body["phase"] == 7
    assert isinstance(body["registered_keys"], int)


def test_middleware_rejects_missing_headers(client: TestClient) -> None:
    response = client.get("/protected-path-stub")
    assert response.status_code == 401
    assert "missing" in response.json()["error"].lower()


def test_middleware_rejects_stale_timestamp(client: TestClient) -> None:
    stale_ts = str(time.time() - 600)  # 10 minutes old
    response = client.get(
        "/protected-path-stub",
        headers={
            "X-Agent-ID": "agent_claude_code_local",
            "X-Signature": "00" * 70,
            "X-Timestamp": stale_ts,
        },
    )
    assert response.status_code == 401
    assert "timestamp" in response.json()["error"].lower()


def test_middleware_rejects_bad_signature(client: TestClient) -> None:
    response = client.get(
        "/protected-path-stub",
        headers={
            "X-Agent-ID": "agent_claude_code_local",
            "X-Signature": "deadbeef" * 18,
            "X-Timestamp": str(time.time()),
        },
    )
    assert response.status_code == 401
    assert "signature" in response.json()["error"].lower()


def test_middleware_rejects_unknown_agent(client: TestClient, tmp_path: Path) -> None:
    """Agent_id not in registry's public_keys → 401."""
    ephemeral = SecureAgentClient(
        agent_id="agent_test_unregistered",
        keys_dir=tmp_path / "keys",
    )
    headers = ephemeral.generate_auth_headers()
    response = client.get("/protected-path-stub", headers=headers)
    assert response.status_code == 401
    assert "signature" in response.json()["error"].lower()
