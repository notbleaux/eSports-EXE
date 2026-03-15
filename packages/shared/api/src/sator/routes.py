"""
SATOR Hub API Routes
===================
FastAPI endpoints for SATOR hub analytics.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ...axiom_esports_data.api.src.db_manager import db
from ..auth.auth_utils import get_optional_user, TokenData
from .service_enhanced import SatorServiceEnhanced as SatorService
from .models import (
    PlatformStats, PlayerStats, PlayerDetail, PlayerListResponse,
    TeamSummary, MatchSummary, MatchListResponse,
    SearchResponse, DataFreshness
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sator", tags=["sator"])


async def get_sator_service() -> SatorService:
    """Get SatorService instance."""
    return SatorService(db.pool)


# ========== Platform Stats ==========

@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    service: SatorService = Depends(get_sator_service)
):
    """
    Get platform-wide statistics.
    
    Returns:
        - Total players, teams, matches
        - Today's match count
        - Live match count
        - Data freshness status
        - Top performer highlights
    """
    try:
        return await service.get_platform_stats()
    except Exception as e:
        logger.error(f"Failed to get platform stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve platform statistics"
        )


# ========== Players ==========

@router.get("/players/top", response_model=list[PlayerStats])
async def get_top_players(
    limit: int = Query(10, ge=1, le=50),
    metric: str = Query("sim_rating", pattern="^(sim_rating|rar_score|acs|adr|kast_pct)$"),
    service: SatorService = Depends(get_sator_service)
):
    """
    Get top players by specified metric.
    
    Supported metrics:
    - sim_rating: Composite SATOR rating (0-10)
    - rar_score: Role Adjusted Rating (relative to position)
    - acs: Average Combat Score
    - adr: Average Damage per Round
    - kast_pct: Kill Assist Survive Trade %
    
    Returns the highest-rated players across all regions.
    """
    try:
        return await service.get_top_players(limit, metric)
    except Exception as e:
        logger.error(f"Failed to get top players: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve top players"
        )


@router.get("/players", response_model=PlayerListResponse)
async def list_players(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    team: Optional[str] = Query(None, description="Filter by team"),
    region: Optional[str] = Query(None, description="Filter by region (EMEA, Americas, Pacific, China)"),
    role: Optional[str] = Query(None, description="Filter by role (Duelist, Controller, Initiator, Sentinel)"),
    current_user: Optional[TokenData] = Depends(get_optional_user),
    service: SatorService = Depends(get_sator_service)
):
    """
    Get paginated list of players.
    
    Supports filtering by team, region, and role.
    Authentication optional - provides personalized rankings if logged in.
    """
    try:
        players, total = await service.get_players(
            page=page,
            page_size=page_size,
            team=team,
            region=region,
            role=role
        )
        
        return PlayerListResponse(
            players=players,
            total=total,
            page=page,
            page_size=page_size,
            has_more=page * page_size < total
        )
    except Exception as e:
        logger.error(f"Failed to list players: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve players"
        )


@router.get("/players/{player_id}", response_model=PlayerDetail)
async def get_player_detail(
    player_id: str,
    current_user: Optional[TokenData] = Depends(get_optional_user),
    service: SatorService = Depends(get_sator_service)
):
    """
    Get detailed information about a specific player.
    
    Includes:
    - Career statistics
    - Recent match history
    - Rating trends
    - Form analysis
    """
    try:
        player = await service.get_player_detail(player_id)
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player '{player_id}' not found"
            )
        return player
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get player detail: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve player details"
        )


# ========== Teams ==========

@router.get("/teams", response_model=list[TeamSummary])
async def list_teams(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    region: Optional[str] = Query(None, description="Filter by region"),
    service: SatorService = Depends(get_sator_service)
):
    """
    Get list of teams with aggregated statistics.
    
    Returns team summaries including roster size and match counts.
    """
    try:
        teams, total = await service.get_teams(
            page=page,
            page_size=page_size,
            region=region
        )
        return teams
    except Exception as e:
        logger.error(f"Failed to list teams: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve teams"
        )


# ========== Matches ==========

@router.get("/matches", response_model=MatchListResponse)
async def list_matches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(upcoming|live|completed)$"),
    tournament_id: Optional[str] = Query(None),
    service: SatorService = Depends(get_sator_service)
):
    """
    Get list of matches.
    
    Filter by status:
    - upcoming: Scheduled future matches
    - live: Currently ongoing matches (last 3 hours)
    - completed: Finished matches
    """
    try:
        matches, total = await service.get_matches(
            page=page,
            page_size=page_size,
            status=status,
            tournament_id=tournament_id
        )
        
        return MatchListResponse(
            matches=matches,
            total=total,
            page=page,
            page_size=page_size,
            has_more=page * page_size < total
        )
    except Exception as e:
        logger.error(f"Failed to list matches: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve matches"
        )


# ========== Search ==========

@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=2, max_length=100, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
    service: SatorService = Depends(get_sator_service)
):
    """
    Full-text search across players, teams, and tournaments.
    
    Returns ranked results with relevance scores.
    Target response time: <200ms
    """
    try:
        results, took_ms = await service.search(query=q, limit=limit)
        
        return SearchResponse(
            query=q,
            results=results,
            total=len(results),
            took_ms=took_ms
        )
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search operation failed"
        )


# ========== Data Freshness ==========

@router.get("/freshness", response_model=DataFreshness)
async def get_data_freshness(
    service: SatorService = Depends(get_sator_service)
):
    """
    Get data freshness status.
    
    Indicates whether data is:
    - Live: Updated within last 5 minutes
    - Recent: Updated within last hour
    - Stale: Older than 1 hour
    """
    try:
        return await service.get_data_freshness()
    except Exception as e:
        logger.error(f"Failed to get freshness: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve data freshness"
        )


# ========== Admin Endpoints ==========

@router.post("/admin/backfill-metrics")
async def backfill_metrics(
    limit: int = Query(100, ge=1, le=1000),
    service: SatorService = Depends(get_sator_service)
):
    """
    Admin: Backfill calculated metrics for players missing them.
    
    Calculates SimRating, RAR, and other derived fields.
    """
    try:
        result = await service.backfill_metrics(limit)
        return {
            "success": True,
            "message": f"Processed {result['total']} players",
            "updated": result['updated'],
            "failed": result['failed']
        }
    except Exception as e:
        logger.error(f"Failed to backfill metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to backfill metrics"
        )


# ========== Health Check ==========

@router.get("/health")
async def sator_health(
    service: SatorService = Depends(get_sator_service)
):
    """Health check for SATOR service."""
    try:
        # Quick check - get platform stats
        stats = await service.get_platform_stats()
        return {
            "status": "healthy",
            "database": "connected",
            "players_indexed": stats.total_players,
            "data_freshness": stats.data_freshness,
            "service": "sator"
        }
    except Exception as e:
        logger.error(f"SATOR health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SATOR service unhealthy"
        )
