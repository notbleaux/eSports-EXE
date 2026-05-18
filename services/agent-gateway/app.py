"""
app.py — FastAPI agent-coordination gateway (Phase 2 skeleton).

[Ver001.000] · Phase 2 of PLN-003-network-api

Scope of this PR (R2.6 — scaffold only):
  - `/health` endpoint returning 200 + service metadata
  - Signature-verification middleware that:
      * skips `/health` (public)
      * extracts X-Agent-ID / X-Signature / X-Timestamp headers
      * loads the agent's public hex from polyrepo/registry/index.json
      * verifies the ECDSA signature against `{agent_id}:{timestamp}`
      * rejects requests with stale timestamps (> 60s skew)

Out of scope this PR (subsequent Phase 2 PRs will add):
  - `/tasks/create`, `/tasks/{id}/bid`, `/tasks/{id}/submit` endpoints
  - In-memory task blackboard
  - OpenAPI 3.1 spec export + CI publish

Run locally:

    pip install -r services/agent-gateway/requirements.txt
    uvicorn services.agent_gateway.app:app --reload --port 8001

(Port 8001 chosen to avoid collision with packages/shared/api on 8000.)
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Awaitable, Callable

from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse

try:
    from ecdsa import VerifyingKey, SECP256k1, BadSignatureError
    from ecdsa.util import sigdecode_der
except ImportError:  # pragma: no cover
    sys.stderr.write(
        "ERROR: 'ecdsa' library not installed. Install with:\n"
        "    pip install -r services/agent-gateway/requirements.txt\n"
    )
    raise


SERVICE_NAME = "agent-gateway"
SERVICE_VERSION = "0.2.0-phase2-scaffold"
REPLAY_WINDOW_SECONDS = 60
PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

REGISTRY_PATH = (
    Path(__file__).resolve().parents[2] / "polyrepo" / "registry" / "index.json"
)


def _load_public_keys(registry_path: Path = REGISTRY_PATH) -> dict[str, str | None]:
    """Read the `public_keys` block from the central registry.

    Returns {agent_id: hex_or_null}. Caller decides how to handle a None
    entry (means the slot is reserved but no key registered yet).
    """
    try:
        registry = json.loads(registry_path.read_text())
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}
    return registry.get("public_keys", {})


def _verify_signature(agent_id: str, signature_hex: str, timestamp: str) -> bool:
    """ECDSA secp256k1 verify of `{agent_id}:{timestamp}` against agent's public key.

    Returns True on valid sig, False otherwise. Logs to stderr on failure
    causes but does not raise — middleware translates to 401.
    """
    public_keys = _load_public_keys()
    pub_hex = public_keys.get(agent_id)
    if not pub_hex or not pub_hex.startswith("04"):
        return False
    try:
        vk = VerifyingKey.from_string(bytes.fromhex(pub_hex[2:]), curve=SECP256k1)
        message = f"{agent_id}:{timestamp}".encode("utf-8")
        vk.verify(bytes.fromhex(signature_hex), message, sigdecode=sigdecode_der)
        return True
    except (BadSignatureError, ValueError):
        return False


def _is_timestamp_fresh(timestamp: str, now: float | None = None) -> bool:
    """Reject requests whose timestamp is too old (replay protection)."""
    try:
        ts = float(timestamp)
    except ValueError:
        return False
    current = now if now is not None else time.time()
    return abs(current - ts) <= REPLAY_WINDOW_SECONDS


app = FastAPI(
    title="ZSXT Agent-Coordination Gateway",
    version=SERVICE_VERSION,
    description=(
        "Phase 2 skeleton — signature-verification middleware + /health. "
        "Endpoints for /tasks/* land in subsequent PRs."
    ),
)


@app.middleware("http")
async def signature_verification_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Reject requests missing or failing ECDSA sign-off, except on PUBLIC_PATHS."""
    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    agent_id = request.headers.get("X-Agent-ID")
    signature = request.headers.get("X-Signature")
    timestamp = request.headers.get("X-Timestamp")

    if not (agent_id and signature and timestamp):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "missing X-Agent-ID, X-Signature, or X-Timestamp"},
        )

    if not _is_timestamp_fresh(timestamp):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "timestamp outside replay window"},
        )

    if not _verify_signature(agent_id, signature, timestamp):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "signature verification failed"},
        )

    request.state.agent_id = agent_id
    return await call_next(request)


@app.get("/health")
async def health() -> dict[str, str | int]:
    """Liveness probe — bypasses auth middleware via PUBLIC_PATHS."""
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "phase": 2,
        "status": "ok",
        "registered_keys": sum(1 for v in _load_public_keys().values() if v),
    }
