"""PandaScore webhook receiver for live match events."""
from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
from datetime import datetime
import hmac
import hashlib
import asyncio
import os

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

WEBHOOK_SECRET = os.environ.get("PANDASCORE_WEBHOOK_SECRET", "")


def verify_signature(payload: bytes, signature: Optional[str]) -> bool:
    """Verify PandaScore webhook HMAC-SHA256 signature."""
    if not WEBHOOK_SECRET or not signature:
        return True  # Skip verification in dev (no secret configured)
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/pandascore")
async def pandascore_webhook(
    request: Request,
    x_pandascore_signature: Optional[str] = Header(None),
) -> dict:
    """
    Receive live match events from PandaScore.
    Events: match.begin, match.end, match.update, game.end
    Broadcasts received events to all connected WebSocket clients.
    """
    payload = await request.body()

    if not verify_signature(payload, x_pandascore_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()
    event_type = data.get("event", "unknown")
    obj = data.get("object", {})

    event_payload = {
        "event_type": event_type,
        "match_id": obj.get("id"),
        "game": obj.get("videogame", {}).get("slug"),
        "received_at": datetime.utcnow().isoformat(),
        "raw": data,
    }

    # Fire-and-forget broadcast to WebSocket clients
    from routers.ws_matches import push_match_event
    asyncio.create_task(push_match_event(event_payload))

    return {"received": True, "event": event_type}


@router.get("/pandascore/health")
async def webhook_health() -> dict:
    """Confirm webhook endpoint is reachable (for PandaScore verification)."""
    return {"status": "ok", "endpoint": "pandascore"}
