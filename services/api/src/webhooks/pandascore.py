"""
Pandascore Webhook Handler — Path A Live Pipeline
Receives match updates from Pandascore, verifies signatures, and routes to Redis Streams.

[Ver001.000]
"""

import os
import json
import logging
import hmac
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from enum import Enum

from fastapi import APIRouter, Request, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from redis import asyncio as aioredis

# --- Configuration ---

logger = logging.getLogger("pandascore-webhook")

PANDASCORE_WEBHOOK_SECRET = os.getenv("PANDASCORE_WEBHOOK_SECRET", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
STREAM_NAME = os.getenv("STREAM_NAME", "pandascore:events")
STREAM_MAXLEN = int(os.getenv("STREAM_MAXLEN", "1000"))  # Keep last 1000 events

router = APIRouter(prefix="/webhooks/pandascore", tags=["webhooks"])

# --- Event Models ---

class PandascoreMatchUpdate(BaseModel):
    """Normalized match update from Pandascore"""
    event_type: str  # MATCH_START, ROUND_END, SCORE_UPDATE, MATCH_END, etc.
    match_id: str
    timestamp: int  # Unix milliseconds
    game: str  # "valorant" or "cs2"

    # Match metadata
    title: Optional[str] = None
    tournament_id: Optional[str] = None
    serie_id: Optional[str] = None

    # Team/Score data
    team1: Optional[Dict[str, Any]] = None
    team2: Optional[Dict[str, Any]] = None
    status: str = "pending"  # pending, live, finished

    # Live match data
    current_round: Optional[int] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None

    # Raw payload for reference
    raw_payload: Dict[str, Any]

    # Verification
    source: str = "pandascore"
    verified: bool = False
    confidence: float = 1.0

# --- Signature Verification ---

def verify_pandascore_signature(
    body: bytes,
    signature: str,
    secret: str = PANDASCORE_WEBHOOK_SECRET
) -> bool:
    """
    Verify HMAC-SHA256 signature from Pandascore webhook.

    Pandascore sends: X-Pandascore-Signature: sha256=<hex_digest>
    We compute: hmac-sha256(secret, body)
    """
    if not secret:
        logger.warning("PANDASCORE_WEBHOOK_SECRET not configured! Skipping signature verification.")
        return False

    # Parse signature header format: "sha256=<hex>"
    if not signature.startswith("sha256="):
        logger.error(f"Invalid signature format: {signature}")
        return False

    expected_sig = signature[7:]  # Remove "sha256=" prefix

    # Compute HMAC-SHA256
    computed = hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    # Constant-time comparison
    return hmac.compare_digest(computed, expected_sig)

# --- Event Normalization ---

def normalize_pandascore_event(
    raw_payload: Dict[str, Any]
) -> Tuple[Optional[PandascoreMatchUpdate], Optional[str]]:
    """
    Normalize Pandascore event to standard format.

    Returns: (normalized_event, error_message)
    """
    try:
        # Extract event type from Pandascore payload
        event_type = raw_payload.get("type", "unknown")

        # Extract match information
        match_id = raw_payload.get("id") or raw_payload.get("match", {}).get("id")
        if not match_id:
            return None, "No match ID found in payload"

        match = raw_payload.get("match", {})
        timestamp = int(datetime.now(timezone.utc).timestamp() * 1000)

        # Determine game based on match league or series
        game = "valorant"  # Default
        league = match.get("league", {})
        if "cs2" in (league.get("name", "")).lower() or "counter-strike" in (league.get("name", "")).lower():
            game = "cs2"

        # Extract score data
        team1_score = match.get("team1_score")
        team2_score = match.get("team2_score")
        current_round = None

        # Extract round information if available
        if "games" in match and match["games"]:
            last_game = match["games"][-1]
            current_round = last_game.get("rounds_count")

        # Build normalized event
        event = PandascoreMatchUpdate(
            event_type=event_type,
            match_id=str(match_id),
            timestamp=timestamp,
            game=game,
            title=match.get("name") or match.get("title"),
            tournament_id=league.get("id"),
            serie_id=match.get("serie_id"),
            team1={
                "id": match.get("team1", {}).get("id"),
                "name": match.get("team1", {}).get("name"),
            } if match.get("team1") else None,
            team2={
                "id": match.get("team2", {}).get("id"),
                "name": match.get("team2", {}).get("name"),
            } if match.get("team2") else None,
            status=match.get("status", "pending"),
            current_round=current_round,
            team1_score=team1_score,
            team2_score=team2_score,
            raw_payload=raw_payload,
            verified=True,
            confidence=0.95  # Pandascore is authoritative
        )

        return event, None

    except Exception as e:
        logger.exception(f"Error normalizing Pandascore event: {e}")
        return None, str(e)

# --- Redis Stream Publishing ---

async def publish_to_redis_stream(
    event: PandascoreMatchUpdate,
    redis_url: str = REDIS_URL,
    stream_name: str = STREAM_NAME
) -> Tuple[bool, Optional[str]]:
    """
    Publish normalized event to Redis Stream.

    Returns: (success, error_message)
    """
    try:
        redis = aioredis.from_url(redis_url, decode_responses=True)

        # Prepare stream entry
        entry_data = {
            "type": event.event_type,
            "match_id": event.match_id,
            "game": event.game,
            "timestamp": event.timestamp,
            "payload": json.dumps(event.dict(exclude={"raw_payload"}))
        }

        # Publish to stream (auto-generate message ID)
        message_id = await redis.xadd(
            stream_name,
            entry_data,
            maxlen=STREAM_MAXLEN  # Keep rolling window
        )

        logger.info(f"Published to Redis Stream: {stream_name}:{message_id}")

        await redis.close()
        return True, None

    except Exception as e:
        logger.exception(f"Error publishing to Redis Stream: {e}")
        return False, str(e)

# --- API Endpoint ---

@router.post("/match-update", status_code=202)
async def handle_match_update(
    request: Request,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Receive Pandascore match update webhook.

    Expected headers:
    - X-Pandascore-Signature: sha256=<hex_digest>

    Returns: 202 Accepted (async processing)
    """
    try:
        # Get signature from headers
        signature = request.headers.get("X-Pandascore-Signature", "")

        # Read raw body for signature verification
        body = await request.body()

        # Verify signature
        if not verify_pandascore_signature(body, signature):
            logger.warning("Invalid Pandascore signature")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )

        # Parse JSON
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload"
            )

        # Normalize event
        event, error = normalize_pandascore_event(payload)
        if error or not event:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to normalize event: {error}"
            )

        # Publish to Redis Stream asynchronously
        background_tasks.add_task(
            publish_to_redis_stream,
            event
        )

        return {
            "status": "accepted",
            "match_id": event.match_id,
            "event_type": event.event_type,
            "timestamp": event.timestamp
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in webhook handler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/health", tags=["health"])
async def webhook_health() -> Dict[str, Any]:
    """Health check for webhook service"""
    try:
        redis = aioredis.from_url(REDIS_URL, decode_responses=True)
        await redis.ping()
        await redis.close()

        return {
            "status": "healthy",
            "service": "pandascore-webhook",
            "stream": STREAM_NAME,
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000)
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }
