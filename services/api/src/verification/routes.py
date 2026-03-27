"""
Verification & Live Data API Routes — Path B Legacy Pipeline

Endpoints:
- GET /v1/live/matches - Current live matches
- GET /v1/live/matches/{match_id} - Specific match
- GET /v1/history/matches - Past matches with confidence
- GET /v1/history/matches/{match_id} - Specific history
- GET /v1/review-queue - Admin: Items flagged for review
- POST /v1/review-queue/{id}/decide - Admin: Review decision

[Ver001.000]
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from fastapi import APIRouter, Query, HTTPException, status, Depends, BackgroundTasks
from pydantic import BaseModel, Field

from .tenet_integration import (
    get_tenet_client,
    verify_match_data,
    VerificationSource,
    VerificationResult,
)

logger = logging.getLogger("verification-routes")

router = APIRouter(prefix="/v1", tags=["verification"])

# --- Response Models ---

class LiveMatchSummary(BaseModel):
    """Summary of a live match"""
    match_id: str
    game: str
    title: Optional[str] = None
    status: str = "live"
    team1_name: Optional[str] = None
    team2_name: Optional[str] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    updated_at: int  # Unix milliseconds
    confidence: float = Field(ge=0.0, le=1.0)
    source: str

class MatchHistory(BaseModel):
    """Historical match with verification status"""
    match_id: str
    game: str
    title: Optional[str] = None
    status: str
    team1_name: Optional[str] = None
    team2_name: Optional[str] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    started_at: int  # Unix milliseconds
    ended_at: Optional[int] = None
    confidence: float = Field(description="Verification confidence score", ge=0.0, le=1.0)
    confidence_level: str  # "trusted", "high", "medium", "low", "flagged"
    verification_issues: List[str] = []
    requires_review: bool = False

class ReviewQueueItem(BaseModel):
    """Item flagged for manual review"""
    item_id: str
    data_type: str  # "match", "player", "team", "result"
    game: str
    confidence: float
    issues: List[str]
    flagged_at: int  # Unix milliseconds
    notes: Optional[str] = None

class ReviewDecision(BaseModel):
    """Manual review decision"""
    decision: str  # "approve", "reject", "needs_more_data"
    notes: Optional[str] = None

# --- Live Matches Endpoints ---

@router.get("/live/matches", response_model=List[LiveMatchSummary])
async def get_live_matches(
    game: Optional[str] = Query(None, description="Filter by game: valorant, cs2"),
    confidence_min: float = Query(0.5, ge=0.0, le=1.0, description="Minimum confidence threshold")
) -> List[LiveMatchSummary]:
    """
    Get current live matches.

    Returns matches with live status, filtered by confidence.
    Source: Path A (Pandascore) or Path B (verified)
    """
    try:
        # In production, this would query:
        # SELECT * FROM matches WHERE status = 'live' AND confidence >= $1
        # For now, return empty list (database integration in Phase 5)

        return []

    except Exception as e:
        logger.error(f"Error fetching live matches: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch live matches"
        )

@router.get("/live/matches/{match_id}", response_model=LiveMatchSummary)
async def get_live_match(match_id: str) -> LiveMatchSummary:
    """
    Get specific live match details.

    Returns current match state with confidence score.
    """
    try:
        # In production: SELECT * FROM matches WHERE match_id = $1 AND status = 'live'
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Live match {match_id} not found"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch match"
        )

# --- Match History Endpoints ---

@router.get("/history/matches", response_model=List[MatchHistory])
async def get_match_history(
    game: Optional[str] = Query(None, description="Filter by game"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    confidence_min: float = Query(0.7, ge=0.0, le=1.0, description="Minimum confidence"),
    show_flagged: bool = Query(False, description="Include flagged items")
) -> List[MatchHistory]:
    """
    Get match history with verification confidence.

    Returns completed matches with:
    - Verification confidence scores
    - Identified issues
    - Flagged for review status

    Filters by confidence threshold and game.
    Pagination supported.
    """
    try:
        # In production:
        # SELECT * FROM matches
        # WHERE status = 'finished'
        # AND confidence >= $1
        # AND (requires_review = FALSE OR $2 = TRUE)
        # ORDER BY ended_at DESC
        # LIMIT $3 OFFSET $4

        return []

    except Exception as e:
        logger.error(f"Error fetching match history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch match history"
        )

@router.get("/history/matches/{match_id}", response_model=MatchHistory)
async def get_match_history_detail(match_id: str) -> MatchHistory:
    """
    Get detailed historical match with full verification data.

    Returns verification result, identified issues, and review status.
    """
    try:
        # In production: SELECT * FROM matches WHERE match_id = $1
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match history {match_id} not found"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching match detail {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch match detail"
        )

# --- Review Queue Endpoints (Admin) ---

@router.get("/review-queue", response_model=List[ReviewQueueItem])
async def get_review_queue(
    game: Optional[str] = Query(None, description="Filter by game"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    priority: bool = Query(False, description="High priority items (confidence < 0.5)")
) -> List[ReviewQueueItem]:
    """
    Get items flagged for manual review.

    Admin endpoint: Returns matches/data with low confidence scores.
    """
    try:
        client = await get_tenet_client()
        queue, error = await client.get_review_queue()

        if error:
            logger.error(f"Failed to fetch review queue: {error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch review queue"
            )

        # Apply filters
        items = queue or []

        if game:
            items = [item for item in items if item.get("game") == game]

        if priority:
            items = [item for item in items if item.get("confidence", 1.0) < 0.5]

        # Apply pagination
        items = items[offset:offset + limit]

        return [ReviewQueueItem(**item) for item in items]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching review queue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch review queue"
        )

@router.post("/review-queue/{item_id}/decide", status_code=202)
async def submit_review_decision(
    item_id: str,
    decision: ReviewDecision,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Submit manual review decision for flagged item.

    Decision: "approve", "reject", "needs_more_data"

    Returns: 202 Accepted (async processing)
    """
    if decision.decision not in ("approve", "reject", "needs_more_data"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid decision. Must be: approve, reject, or needs_more_data"
        )

    try:
        client = await get_tenet_client()

        # Submit decision asynchronously
        background_tasks.add_task(
            client.submit_review_decision,
            item_id,
            decision.decision,
            decision.notes
        )

        return {
            "status": "accepted",
            "item_id": item_id,
            "decision": decision.decision,
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000)
        }

    except Exception as e:
        logger.error(f"Error submitting review decision: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit review decision"
        )

# --- Health Check ---

@router.get("/health", tags=["health"])
async def verification_health() -> Dict[str, Any]:
    """Health check for verification service"""
    try:
        client = await get_tenet_client()
        tenet_healthy = await client.health_check()

        return {
            "status": "healthy" if tenet_healthy else "degraded",
            "service": "verification-api",
            "tenet": "connected" if tenet_healthy else "disconnected",
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000)
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }
