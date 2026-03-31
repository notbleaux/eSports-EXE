"""
FastAPI router for stats aggregation endpoints.

Provides REST API for:
- Player performance stats
- Match summaries
- Leaderboards
- Aggregated statistics

Phase 1: Data Pipeline (Backend)

[Ver001.000]
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field

from .service import StatsAggregationService
from .schemas import (
    PlayerPerformanceStats,
    MatchPerformanceSummary,
    AggregatedPlayerStats,
    StatsComparison,
)
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

# Initialize service
stats_service = StatsAggregationService()


# --- Request/Response Models ---

class PlayerStatsResponse(BaseModel):
    """Response model for player stats endpoint."""
    player_id: int
    game: str
    period_days: int
    stats: AggregatedPlayerStats
    cached: bool = False


class MatchStatsResponse(BaseModel):
    """Response model for match stats endpoint."""
    match_id: int
    summary: MatchPerformanceSummary
    cached: bool = False


class LeaderboardEntry(BaseModel):
    """Single entry in leaderboard."""
    rank: int
    player_id: int
    player_name: str
    value: float
    stats: dict


class LeaderboardResponse(BaseModel):
    """Response model for leaderboard endpoint."""
    category: str
    game: str
    period_days: int
    entries: List[LeaderboardEntry]
    generated_at: datetime


class StatsTrendResponse(BaseModel):
    """Response model for stats trend endpoint."""
    player_id: int
    metric: str
    current_value: float
    previous_value: float
    trend_percent: float
    trend_direction: str  # "up", "down", "stable"


class CacheStatsResponse(BaseModel):
    """Response model for cache statistics."""
    player_stats_cached: int
    match_summaries_cached: int
    live_matches_cached: int
    predictions_cached: int
    total_cached: int


# --- Endpoints ---

@router.get(
    "/player/{player_id}",
    response_model=AggregatedPlayerStats,
    summary="Get aggregated player stats",
    description=""
    "Get aggregated statistics for a player over a specified time period. "
    "Returns cached data if available, otherwise computes from database."
    "",
    responses={
        200: {"description": "Player stats retrieved successfully"},
        404: {"description": "Player not found or no stats available"},
    }
)
async def get_player_stats(
    player_id: int,
    game: str = Query("valorant", description="Game identifier"),
    period_days: int = Query(30, ge=1, le=365, description="Days to aggregate"),
    use_cache: bool = Query(True, description="Use cached data if available"),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get aggregated player statistics.
    
    Returns metrics including:
    - KDA (Kills + Assists / Deaths)
    - ACS (Average Combat Score)
    - ADR (Average Damage per Round)
    - KAST (Kill, Assist, Survive, Trade %)
    - Headshot percentage
    - Consistency metrics
    - Trends vs previous period
    """
    stats = await stats_service.get_aggregated_player_stats(
        player_id=player_id,
        game=game,
        period_days=period_days,
        use_cache=use_cache
    )
    
    if not stats:
        raise HTTPException(
            status_code=404,
            detail=f"No stats found for player {player_id} in the specified period"
        )
    
    return stats


@router.get(
    "/player/{player_id}/matches",
    response_model=List[PlayerPerformanceStats],
    summary="Get player's match-by-match stats",
    description="Get individual match performances for a player."
)
async def get_player_match_history(
    player_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get recent match performances for a player.
    
    Returns a list of individual match stats.
    """
    # This would query the database for recent matches
    # Implementation depends on your match history storage
    return []


@router.get(
    "/match/{match_id}",
    response_model=MatchPerformanceSummary,
    summary="Get match performance summary",
    description="Get performance stats for all players in a match."")
async def get_match_stats(
    match_id: int,
    use_cache: bool = Query(True, description="Use cached data if available"),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get performance summary for a match.
    
    Returns aggregated stats for all players who participated.
    """
    summary = await stats_service.get_match_summary(
        match_id=match_id,
        use_cache=use_cache
    )
    
    if not summary:
        raise HTTPException(
            status_code=404,
            detail=f"Match {match_id} not found or no stats available"
        )
    
    return summary


@router.get(
    "/match/{match_id}/player/{player_id}",
    response_model=PlayerPerformanceStats,
    summary="Get player stats for specific match",
    description="Get performance stats for a player in a specific match."
)
async def get_player_match_stats(
    match_id: int,
    player_id: int,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get a player's performance in a specific match.
    """
    stats = await stats_service.calculate_match_performance(
        player_id=player_id,
        match_id=match_id
    )
    
    if not stats:
        raise HTTPException(
            status_code=404,
            detail=f"No stats found for player {player_id} in match {match_id}"
        )
    
    return stats


@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
    summary="Get performance leaderboard",
    description="Get top players by a specific metric."
)
async def get_leaderboard(
    category: str = Query("kda", pattern="^(kda|acs|adr|kast|kills|headshot_pct)$"),
    game: str = Query("valorant"),
    limit: int = Query(10, ge=1, le=100),
    period_days: int = Query(30, ge=7, le=90),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get leaderboard for a specific metric.
    
    Categories:
    - kda: Kill/Death/Assist ratio
    - acs: Average Combat Score
    - adr: Average Damage per Round
    - kast: KAST percentage
    - kills: Total kills
    - headshot_pct: Headshot percentage
    """
    leaderboard = await stats_service.get_leaderboard(
        category=category,
        game=game,
        limit=limit,
        period_days=period_days
    )
    
    return LeaderboardResponse(
        category=category,
        game=game,
        period_days=period_days,
        entries=leaderboard,
        generated_at=datetime.utcnow()
    )


@router.get(
    "/compare",
    response_model=StatsComparison,
    summary="Compare two players",
    description="Compare statistics between two players."
)
async def compare_players(
    player1_id: int,
    player2_id: int,
    game: str = Query("valorant"),
    period_days: int = Query(30, ge=1, le=365),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Compare two players' statistics side-by-side.
    
    Returns individual stats and head-to-head comparison.
    """
    # Get stats for both players
    stats1 = await stats_service.get_aggregated_player_stats(
        player1_id, game, period_days
    )
    stats2 = await stats_service.get_aggregated_player_stats(
        player2_id, game, period_days
    )
    
    if not stats1 or not stats2:
        raise HTTPException(
            status_code=404,
            detail="One or both players not found"
        )
    
    # Calculate differences
    kda_diff = stats1.avg_kda - stats2.avg_kda
    acs_diff = stats1.avg_acs - stats2.avg_acs
    adr_diff = stats1.avg_adr - stats2.avg_adr
    kast_diff = stats1.avg_kast - stats2.avg_kast
    
    # Determine advantage
    advantage_player = None
    advantage_metric = None
    
    # Simple scoring: 1 point per metric where player1 > player2
    p1_score = sum([
        kda_diff > 0,
        acs_diff > 0,
        adr_diff > 0,
        kast_diff > 0
    ])
    
    if p1_score >= 3:
        advantage_player = player1_id
        advantage_metric = "overall"
    elif p1_score <= 1:
        advantage_player = player2_id
        advantage_metric = "overall"
    
    return StatsComparison(
        player1_id=player1_id,
        player2_id=player2_id,
        player1_stats=stats1,
        player2_stats=stats2,
        h2h_matches=0,  # Would query head-to-head matches
        player1_wins=0,
        player2_wins=0,
        kda_diff=round(kda_diff, 2),
        acs_diff=round(acs_diff, 2),
        adr_diff=round(adr_diff, 2),
        kast_diff=round(kast_diff, 2),
        advantage_player=advantage_player,
        advantage_metric=advantage_metric
    )


@router.get(
    "/player/{player_id}/trends",
    response_model=List[StatsTrendResponse],
    summary="Get player performance trends",
    description="Get trends for all metrics over time."
)
async def get_player_trends(
    player_id: int,
    game: str = Query("valorant"),
    current_period_days: int = Query(14, ge=7, le=60),
    previous_period_days: int = Query(14, ge=7, le=60),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get performance trends comparing current period to previous period.
    
    Returns trends for KDA, ACS, ADR, and KAST.
    """
    # Get current period stats
    current_stats = await stats_service.get_aggregated_player_stats(
        player_id, game, current_period_days
    )
    
    # Get previous period stats
    previous_stats = await stats_service.get_aggregated_player_stats(
        player_id, game, previous_period_days
    )
    
    if not current_stats:
        raise HTTPException(
            status_code=404,
            detail=f"No stats found for player {player_id}"
        )
    
    trends = []
    
    metrics = [
        ("kda", current_stats.avg_kda, previous_stats.avg_kda if previous_stats else 0),
        ("acs", current_stats.avg_acs, previous_stats.avg_acs if previous_stats else 0),
        ("adr", current_stats.avg_adr, previous_stats.avg_adr if previous_stats else 0),
        ("kast", current_stats.avg_kast, previous_stats.avg_kast if previous_stats else 0),
    ]
    
    for metric, current_val, prev_val in metrics:
        if prev_val > 0:
            trend_pct = ((current_val - prev_val) / prev_val) * 100
        else:
            trend_pct = 100.0 if current_val > 0 else 0.0
        
        if trend_pct > 5:
            direction = "up"
        elif trend_pct < -5:
            direction = "down"
        else:
            direction = "stable"
        
        trends.append(StatsTrendResponse(
            player_id=player_id,
            metric=metric,
            current_value=round(current_val, 2),
            previous_value=round(prev_val, 2),
            trend_percent=round(trend_pct, 1),
            trend_direction=direction
        ))
    
    return trends


# --- Admin/Cache Endpoints ---

@router.post(
    "/cache/invalidate/{player_id}",
    summary="Invalidate player cache",
    description="Clear cached stats for a player (admin only)."
)
async def invalidate_player_cache(
    player_id: int,
    game: str = "valorant",
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Invalidate all cached statistics for a player.
    
    Forces fresh computation on next request.
    """
    # Admin check required - CRITICAL: Currently allows any authenticated user
    if not current_user or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = await stats_service.invalidate_player_cache(player_id, game)
    
    if success:
        return {"message": f"Cache invalidated for player {player_id}"}
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to invalidate cache"
        )


@router.get(
    "/cache/stats",
    response_model=CacheStatsResponse,
    summary="Get cache statistics",
    description="Get statistics about the stats cache."
)
async def get_cache_stats(
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Get cache statistics including hit rates and memory usage.
    """
    stats = await stats_service.get_cache_stats()
    return CacheStatsResponse(**stats)


@router.post(
    "/cache/clear",
    summary="Clear all stats cache",
    description="Clear all cached statistics (admin only)."
)
async def clear_cache(
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Clear all cached statistics.
    
    Use with caution - will cause performance degradation until cache rebuilds.
    """
    # Admin check required - CRITICAL: Currently allows any authenticated user
    if not current_user or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = await stats_service.clear_cache()
    
    if success:
        return {"message": "All stats cache cleared"}
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to clear cache"
        )
