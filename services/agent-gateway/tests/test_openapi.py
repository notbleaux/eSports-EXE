"""Phase 2 — OpenAPI 3.1 spec sanity tests.

These tests fail loudly if openapi.json is missing, malformed, or drifts
from what `app.py` actually serves. They complement the CI drift workflow
by giving local pytest runs the same protection.

Run from repo root:
    pytest services/agent-gateway/tests/test_openapi.py -v
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

GATEWAY_ROOT = Path(__file__).resolve().parents[1]
SPEC_PATH = GATEWAY_ROOT / "openapi.json"
sys.path.insert(0, str(GATEWAY_ROOT))

from app import app  # noqa: E402


@pytest.fixture(scope="module")
def spec() -> dict:
    assert SPEC_PATH.exists(), f"missing committed spec at {SPEC_PATH}"
    return json.loads(SPEC_PATH.read_text())


def test_openapi_version_is_3_1(spec: dict) -> None:
    assert spec["openapi"] == "3.1.0"


def test_committed_spec_matches_generated() -> None:
    """Drift detection mirroring CI's --check; catches stale spec in local pytest."""
    current = SPEC_PATH.read_text()
    generated_spec = app.openapi()
    generated_spec["openapi"] = "3.1.0"
    generated = json.dumps(generated_spec, indent=2, sort_keys=True) + "\n"
    if current != generated:
        pytest.fail(
            "services/agent-gateway/openapi.json is stale. "
            "Regenerate: python services/agent-gateway/scripts/export_openapi.py"
        )


def test_expected_paths_present(spec: dict) -> None:
    paths = set(spec.get("paths", {}).keys())
    expected = {
        "/health",
        "/tasks/create",
        "/tasks/{task_id}/bid",
        "/tasks/{task_id}/submit",
        "/telemetry/summary",
    }
    missing = expected - paths
    assert not missing, f"spec is missing expected paths: {missing}"


def test_request_schemas_present(spec: dict) -> None:
    schemas = spec.get("components", {}).get("schemas", {})
    for required in ("TaskCreateRequest", "TaskBidRequest", "TaskSubmitRequest"):
        assert required in schemas, f"schema {required!r} missing from components"
