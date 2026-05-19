"""
app.py — FastAPI agent-coordination gateway (Phase 2 + VaultBrain Phase 3).

[Ver002.000] · Phase 2 of PLN-003-network-api + VaultBrain Integration

Scope:
  - `/health` endpoint returning 200 + service metadata
  - Signature-verification middleware (ECDSA secp256k1)
  - `/tasks/create`, `/tasks/{id}/bid`, `/tasks/{id}/submit` endpoints
  - **NEW:** VaultBrain PostgreSQL persistence (feature-flagged)

Persistence mode (feature flag):
  - `AGENT_GATEWAY_PERSISTENCE=memory` (default) → in-memory blackboard
  - `AGENT_GATEWAY_PERSISTENCE=vaultbrain` → VaultBrain PostgreSQL via PgBouncer

Run locally:

    pip install -r services/agent-gateway/requirements.txt
    uvicorn services.agent_gateway.app:app --reload --port 8001

(Port 8001 chosen to avoid collision with packages/shared/api on 8000.)
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Awaitable, Callable

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ── Persistence Layer Selection ─────────────────────────────────
# Feature flag: AGENT_GATEWAY_PERSISTENCE=memory|vaultbrain
# Default: memory (backward compatible with Phase 2)

_PERSISTENCE_MODE = os.getenv("AGENT_GATEWAY_PERSISTENCE", "memory").lower()

if _PERSISTENCE_MODE == "vaultbrain":
    try:
        from vaultbrain_adapter import TaskStateError, vaultbrain_store as store
    except ImportError:
        sys.stderr.write(
            "ERROR: psycopg2-binary not installed. Install with:\n"
            "    pip install -r services/agent-gateway/requirements.txt\n"
        )
        raise
    _PERSISTENCE_BACKEND = "vaultbrain"
else:
    from blackboard import TaskStateError, blackboard as store
    _PERSISTENCE_BACKEND = "memory"

SERVICE_NAME = "agent-gateway"
SERVICE_VERSION = "0.3.0-vaultbrain"
REPLAY_WINDOW_SECONDS = 60
PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

# Show persistence mode in startup
print(f"[AGENT_GATEWAY] Persistence backend: {_PERSISTENCE_BACKEND}", file=sys.stderr)

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
        "Phase 2 + VaultBrain Phase 3 — signature-verification middleware + /health + task endpoints. "
        f"Persistence: {_PERSISTENCE_BACKEND}. "
        "VaultBrain PostgreSQL cluster for persistent task storage."
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
        "open_tasks": len(store.list_open()),
        "persistence_backend": _PERSISTENCE_BACKEND,
    }


class TaskCreateRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=4096)
    metadata: dict[str, Any] = Field(default_factory=dict)


def _trusted_agent_id(request: Request) -> str:
    """Pull the middleware-verified agent_id off the request, else 500."""
    agent_id = getattr(request.state, "agent_id", None)
    if not agent_id:  # defensive — middleware should have set this
        raise HTTPException(status_code=500, detail="agent_id not propagated by middleware")
    return agent_id


@app.post("/tasks/create", status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreateRequest, request: Request) -> dict[str, Any]:
    """Post a new task to the blackboard.

    The middleware has already verified the caller's signature; `agent_id`
    on `request.state` is trusted.
    """
    creator_agent_id = _trusted_agent_id(request)
    try:
        task = store.create(
            creator_agent_id=creator_agent_id,
            description=payload.description,
            metadata=payload.metadata,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return task.to_dict()


class TaskBidRequest(BaseModel):
    message: str | None = Field(default=None, max_length=2048)


@app.post("/tasks/{task_id}/bid")
async def bid_on_task(
    task_id: str,
    payload: TaskBidRequest,
    request: Request,
) -> dict[str, Any]:
    """Claim an OPEN task (or accept a hand-off from PARTIAL_PENDING_HANDOFF).

    First bid wins — Phase 5 will swap this for a multi-bidder auction.
    """
    bidder_agent_id = _trusted_agent_id(request)
    try:
        task = store.bid(
            task_id=task_id,
            bidder_agent_id=bidder_agent_id,
            message=payload.message,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"task {task_id} not found")
    except TaskStateError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return task.to_dict()


class TaskSubmitRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=65536)
    complete: bool = Field(..., description="True → COMPLETED; False → PARTIAL_PENDING_HANDOFF")


@app.post("/tasks/{task_id}/submit")
async def submit_task(
    task_id: str,
    payload: TaskSubmitRequest,
    request: Request,
) -> dict[str, Any]:
    """Submit work for a task you currently claim.

    `complete=True` → COMPLETED; `complete=False` → PARTIAL_PENDING_HANDOFF
    (the task becomes biddable again so another agent can take it over).
    """
    submitter_agent_id = _trusted_agent_id(request)
    try:
        task = store.submit(
            task_id=task_id,
            submitter_agent_id=submitter_agent_id,
            content=payload.content,
            complete=payload.complete,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"task {task_id} not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TaskStateError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return task.to_dict()
