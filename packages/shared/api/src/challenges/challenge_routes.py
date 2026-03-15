"""
Daily Challenges API Routes
==========================
FastAPI endpoints for daily challenges with JWT authentication.
"""

import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth.auth_utils import get_current_active_user, get_optional_user, TokenData
from .challenge_service import ChallengeService
from .challenge_models import (
    DailyChallenge, ChallengeResult, ChallengeStreak, ChallengeStats,
    SubmitAnswerRequest, UserChallengeSummary, ChallengeLeaderboardEntry
)
from axiom_esports_data.api.src.db_manager import db
from ..tokens.token_service import TokenService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/challenges", tags=["challenges"])


async def get_challenge_service() -> ChallengeService:
    """Get ChallengeService instance."""
    token_service = TokenService(db.pool)
    return ChallengeService(db.pool, token_service)


# Public endpoints

@router.get("/daily", response_model=Optional[DailyChallenge])
async def get_daily_challenge(
    challenge_date: Optional[date] = Query(None, description="Date to get challenge for"),
    service: ChallengeService = Depends(get_challenge_service)
):
    """
    Get today's daily challenge (or specific date).
    
    Public endpoint - no authentication required to view challenges.
    """
    try:
        challenge = await service.get_daily_challenge(challenge_date)
        if not challenge:
            raise HTTPException(status_code=404, detail="No challenge found for this date")
        return challenge
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get daily challenge: {e}")
        raise HTTPException(status_code=500, detail="Failed to load challenge")


@router.get("/upcoming", response_model=list[DailyChallenge])
async def get_upcoming_challenges(
    days: int = Query(7, ge=1, le=30),
    service: ChallengeService = Depends(get_challenge_service)
):
    """Get upcoming challenges for the next N days (public)."""
    try:
        return await service.get_upcoming_challenges(days)
    except Exception as e:
        logger.error(f"Failed to get upcoming challenges: {e}")
        raise HTTPException(status_code=500, detail="Failed to load challenges")


@router.get("/{challenge_id}/stats", response_model=ChallengeStats)
async def get_challenge_stats(
    challenge_id: str,
    service: ChallengeService = Depends(get_challenge_service)
):
    """Get statistics for a specific challenge (public)."""
    try:
        return await service.get_challenge_stats(challenge_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get challenge stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to load stats")


# Protected endpoints

@router.post("/{challenge_id}/submit", response_model=ChallengeResult)
async def submit_challenge_answer(
    challenge_id: str,
    request: SubmitAnswerRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: ChallengeService = Depends(get_challenge_service)
):
    """
    Submit an answer for a daily challenge.
    
    **Authentication required**
    """
    try:
        result = await service.submit_answer(current_user.user_id, challenge_id, request)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit answer: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit answer")


@router.get("/user/streak", response_model=ChallengeStreak)
async def get_my_streak(
    current_user: TokenData = Depends(get_current_active_user),
    service: ChallengeService = Depends(get_challenge_service)
):
    """
    Get current user's challenge streak.
    
    **Authentication required**
    """
    try:
        return await service.get_user_streak(current_user.user_id)
    except Exception as e:
        logger.error(f"Failed to get streak: {e}")
        raise HTTPException(status_code=500, detail="Failed to load streak")


@router.get("/user/summary", response_model=UserChallengeSummary)
async def get_my_summary(
    current_user: TokenData = Depends(get_current_active_user),
    service: ChallengeService = Depends(get_challenge_service)
):
    """
    Get current user's challenge activity summary.
    
    **Authentication required**
    """
    try:
        return await service.get_user_summary(current_user.user_id)
    except Exception as e:
        logger.error(f"Failed to get user summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to load summary")


@router.get("/{challenge_id}/attempted")
async def has_attempted_challenge(
    challenge_id: str,
    current_user: TokenData = Depends(get_current_active_user),
    service: ChallengeService = Depends(get_challenge_service)
):
    """
    Check if user has attempted a challenge.
    
    **Authentication required**
    """
    try:
        attempted = await service.has_attempted(current_user.user_id, challenge_id)
        return {"attempted": attempted}
    except Exception as e:
        logger.error(f"Failed to check attempt status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check status")


@router.get("/leaderboard", response_model=list[ChallengeLeaderboardEntry])
async def get_leaderboard(
    period: str = Query("weekly", pattern="^(daily|weekly|monthly|all_time)$"),
    limit: int = Query(20, ge=1, le=100),
    service: ChallengeService = Depends(get_challenge_service)
):
    """Get challenge leaderboard (public)."""
    try:
        return await service.get_leaderboard(period, limit)
    except Exception as e:
        logger.error(f"Failed to get leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to load leaderboard")


# Health check

@router.get("/health")
async def challenges_health(
    service: ChallengeService = Depends(get_challenge_service)
):
    """Health check for challenges service."""
    try:
        challenge = await service.get_daily_challenge()
        return {
            "status": "healthy",
            "daily_challenge_available": challenge is not None,
            "service": "challenges"
        }
    except Exception as e:
        logger.error(f"Challenges health check failed: {e}")
        raise HTTPException(status_code=503, detail="Challenges service unhealthy")
