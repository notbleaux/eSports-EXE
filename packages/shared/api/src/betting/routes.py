"""
[Ver001.000]
Betting Routes - Match odds API endpoints
"""

import logging
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Request, status, Depends
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

# Import odds engine
from .odds_engine import (
    OddsEngine, MatchContext, OddsResult,
    OddsFormat as EngineOddsFormat
)
from .schemas import (
    OddsResponse, OddsHistoryResponse, OddsHistoryEntry,
    LeaderboardEntry, BettingLeaderboardResponse,
    OddsFormatsResponse, OddsFormatInfo,
    OddsCalculationRequest, OddsCalculationResponse
)
from .models import BetStatus, OddsFormat, Bet, OddsHistory, Leaderboard

# Import database manager
from axiom_esports_data.api.src.db_manager import db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["betting"])

# Initialize odds engine
odds_engine = OddsEngine(db_pool=db)

# Initialize limiter for rate limiting
limiter = Limiter(key_func=get_remote_address)


# ============================================================================
# Helper Functions
# ============================================================================

def _odds_result_to_response(result: OddsResult) -> OddsResponse:
    """Convert OddsResult to OddsResponse."""
    from .schemas import TeamFactorsResponse, HeadToHeadResponse
    
    return OddsResponse(
        match_id=result.match_id,
        team_a_decimal=result.team_a_decimal,
        team_b_decimal=result.team_b_decimal,
        team_a_american=result.team_a_american,
        team_b_american=result.team_b_american,
        team_a_probability=result.team_a_probability,
        team_b_probability=result.team_b_probability,
        vig_percentage=result.vig_percentage,
        margin=result.margin,
        team_a_factors=TeamFactorsResponse(
            team_id=result.team_a_factors.team_id,
            win_rate=result.team_a_factors.win_rate,
            form_score=result.team_a_factors.form_score,
            map_strength=result.team_a_factors.map_strength,
            player_availability=result.team_a_factors.player_availability,
            fatigue_factor=result.team_a_factors.fatigue_factor
        ),
        team_b_factors=TeamFactorsResponse(
            team_id=result.team_b_factors.team_id,
            win_rate=result.team_b_factors.win_rate,
            form_score=result.team_b_factors.form_score,
            map_strength=result.team_b_factors.map_strength,
            player_availability=result.team_b_factors.player_availability,
            fatigue_factor=result.team_b_factors.fatigue_factor
        ),
        head_to_head=HeadToHeadResponse(
            total_matches=result.head_to_head.total_matches,
            team_a_wins=result.head_to_head.team_a_wins,
            team_b_wins=result.head_to_head.team_b_wins,
            draws=result.head_to_head.draws,
            recent_form=result.head_to_head.recent_form
        ),
        is_live=result.is_live,
        last_updated=result.last_updated,
        confidence_score=result.confidence_score,
        cash_out_available=result.cash_out_available,
        cash_out_multiplier=result.cash_out_multiplier
    )


async def _get_match_context(match_id: str) -> Optional[MatchContext]:
    """Fetch match context from database or return mock for testing."""
    try:
        # Try to get from database
        if db.pool:
            async with db.pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    SELECT 
                        m.id::text as match_id,
                        m.game,
                        m.map_name,
                        ARRAY_AGG(DISTINCT pp.team) as teams
                    FROM matches m
                    LEFT JOIN player_performance pp ON pp.match_id = m.id::text
                    WHERE m.id::text = $1 OR m.external_id = $1
                    GROUP BY m.id, m.game, m.map_name
                    LIMIT 1
                    """,
                    match_id
                )
                
                if row:
                    teams = row['teams'] or ['team_a', 'team_b']
                    return MatchContext(
                        match_id=match_id,
                        team_a_id=teams[0] if len(teams) > 0 else 'team_a',
                        team_b_id=teams[1] if len(teams) > 1 else 'team_b',
                        game=row['game'] or 'valorant',
                        map_id=row['map_name'],
                        tournament_tier=1,
                        match_type='bo3'
                    )
    except Exception as e:
        logger.warning(f"Database query failed for match {match_id}: {e}")
    
    # Return mock context for testing/development
    return MatchContext(
        match_id=match_id,
        team_a_id=f"{match_id}_team_a",
        team_b_id=f"{match_id}_team_b",
        game='valorant',
        map_id=None,
        tournament_tier=1,
        match_type='bo3'
    )


async def _store_odds_history(result: OddsResult, trigger: str = "calculation") -> None:
    """Store odds calculation in history."""
    try:
        if db.pool:
            async with db.pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO odds_history (
                        match_id, timestamp, team_a_decimal, team_b_decimal,
                        team_a_american, team_b_american, team_a_probability,
                        team_b_probability, vig_percentage, confidence_score,
                        is_live, trigger
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    """,
                    result.match_id,
                    result.last_updated,
                    result.team_a_decimal,
                    result.team_b_decimal,
                    result.team_a_american,
                    result.team_b_american,
                    result.team_a_probability,
                    result.team_b_probability,
                    result.vig_percentage,
                    result.confidence_score,
                    result.is_live,
                    trigger
                )
    except Exception as e:
        logger.warning(f"Failed to store odds history: {e}")


async def _get_cached_odds(match_id: str) -> Optional[OddsResult]:
    """Get cached odds from engine's live_matches or calculate fresh."""
    if match_id in odds_engine.live_matches:
        cached = odds_engine.live_matches[match_id]
        # Check if cache is still fresh (less than 5 minutes old)
        cache_age = (datetime.utcnow() - cached.last_updated).total_seconds()
        if cache_age < 300:  # 5 minutes
            return cached
    return None


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/matches/{match_id}/odds", response_model=OddsResponse)
async def get_match_odds(
    match_id: str,
    format: Optional[str] = Query("decimal", pattern=r"^(decimal|american|fractional)$")
):
    """
    Get current odds for a match.
    
    Returns calculated odds based on team factors, head-to-head history,
    and current match context.
    
    - **match_id**: Unique match identifier
    - **format**: Odds format preference (decimal, american, fractional)
    """
    try:
        # Check cache first
        cached = await _get_cached_odds(match_id)
        if cached:
            logger.info(f"Returning cached odds for match {match_id}")
            return _odds_result_to_response(cached)
        
        # Get match context
        context = await _get_match_context(match_id)
        if not context:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Match {match_id} not found"
            )
        
        # Calculate odds
        result = await odds_engine.calculate_odds(context, is_live=False)
        
        # Cache the result
        odds_engine.live_matches[match_id] = result
        
        # Store in history
        await _store_odds_history(result, trigger="api_request")
        
        return _odds_result_to_response(result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating odds for match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate odds: {str(e)}"
        )


@router.get("/matches/{match_id}/odds/history", response_model=OddsHistoryResponse)
async def get_odds_history(
    match_id: str,
    limit: int = Query(50, ge=1, le=500)
):
    """
    Get historical odds changes for a match.
    
    Returns a chronological list of odds changes with timestamps
    and what triggered each change.
    
    - **match_id**: Unique match identifier
    - **limit**: Maximum number of history entries (1-500)
    """
    try:
        entries = []
        
        # Try to get from database
        if db.pool:
            async with db.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT 
                        timestamp,
                        team_a_decimal,
                        team_b_decimal,
                        team_a_probability,
                        team_b_probability,
                        trigger,
                        confidence_score
                    FROM odds_history
                    WHERE match_id = $1
                    ORDER BY timestamp DESC
                    LIMIT $2
                    """,
                    match_id,
                    limit
                )
                
                for row in rows:
                    entries.append(OddsHistoryEntry(
                        timestamp=row['timestamp'],
                        team_a_decimal=row['team_a_decimal'],
                        team_b_decimal=row['team_b_decimal'],
                        team_a_probability=row['team_a_probability'],
                        team_b_probability=row['team_b_probability'],
                        trigger=row['trigger'],
                        confidence_score=row['confidence_score']
                    ))
        
        # If no database entries, return empty response
        return OddsHistoryResponse(
            match_id=match_id,
            entries=entries,
            total_entries=len(entries)
        )
        
    except Exception as e:
        logger.error(f"Error fetching odds history for match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch odds history: {str(e)}"
        )


@router.post("/matches/{match_id}/odds/calculate", response_model=OddsCalculationResponse)
@limiter.limit("5/minute")
async def calculate_odds(
    request: Request,
    match_id: str,
    calc_request: Optional[OddsCalculationRequest] = None
):
    """
    Force recalculation of odds for a match.
    
    This endpoint bypasses cache and performs fresh odds calculation.
    Rate limited to 5 requests per minute per IP.
    
    - **match_id**: Unique match identifier
    - **is_live**: Whether match is currently live
    - **current_score**: Current score if live (e.g., {"team_a": 1, "team_b": 0})
    """
    try:
        # Get match context
        context = await _get_match_context(match_id)
        if not context:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Match {match_id} not found"
            )
        
        # Determine live status
        is_live = calc_request.is_live if calc_request else False
        current_score = calc_request.current_score if calc_request else None
        
        # Force recalculation
        result = await odds_engine.calculate_odds(
            context, 
            is_live=is_live,
            current_score=current_score
        )
        
        # Update cache
        odds_engine.live_matches[match_id] = result
        
        # Store in history
        trigger = "force_recalculation" if not is_live else "live_update"
        await _store_odds_history(result, trigger=trigger)
        
        return OddsCalculationResponse(
            match_id=match_id,
            success=True,
            odds=_odds_result_to_response(result),
            message="Odds recalculated successfully",
            calculated_at=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error forcing odds calculation for match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate odds: {str(e)}"
        )


@router.get("/leaderboard", response_model=BettingLeaderboardResponse)
async def get_betting_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    period: str = Query("all_time", pattern=r"^(all_time|monthly|weekly)$")
):
    """
    Get top bettors leaderboard.
    
    Returns ranked list of top performing bettors based on
    win rate, ROI, and profit/loss.
    
    - **limit**: Number of entries to return (1-100)
    - **period**: Time period filter (all_time, monthly, weekly)
    """
    try:
        entries = []
        
        # Try to get from database
        if db.pool:
            async with db.pool.acquire() as conn:
                # Build time filter
                time_filter = ""
                if period == "monthly":
                    time_filter = "AND last_bet_at > NOW() - INTERVAL '30 days'"
                elif period == "weekly":
                    time_filter = "AND last_bet_at > NOW() - INTERVAL '7 days'"
                
                rows = await conn.fetch(
                    f"""
                    SELECT 
                        ROW_NUMBER() OVER (ORDER BY roi_percentage DESC) as rank,
                        user_id,
                        username,
                        total_bets,
                        wins,
                        win_rate,
                        profit_loss,
                        roi_percentage,
                        current_streak,
                        best_streak
                    FROM betting_leaderboard
                    WHERE total_bets >= 5 {time_filter}
                    ORDER BY roi_percentage DESC
                    LIMIT $1
                    """,
                    limit
                )
                
                for row in rows:
                    entries.append(LeaderboardEntry(
                        rank=row['rank'],
                        user_id=str(row['user_id']),
                        username=row['username'],
                        total_bets=row['total_bets'],
                        wins=row['wins'],
                        win_rate=row['win_rate'],
                        profit_loss=row['profit_loss'],
                        roi_percentage=row['roi_percentage'],
                        current_streak=row['current_streak'],
                        best_streak=row['best_streak']
                    ))
        
        # If no database entries, return mock data for development
        if not entries:
            entries = [
                LeaderboardEntry(
                    rank=1,
                    user_id="user_001",
                    username="ValorantVeteran",
                    total_bets=45,
                    wins=32,
                    win_rate=0.71,
                    profit_loss=1250.50,
                    roi_percentage=27.8,
                    current_streak=3,
                    best_streak=8
                ),
                LeaderboardEntry(
                    rank=2,
                    user_id="user_002",
                    username="EsportsElite",
                    total_bets=38,
                    wins=26,
                    win_rate=0.68,
                    profit_loss=980.25,
                    roi_percentage=25.8,
                    current_streak=2,
                    best_streak=6
                ),
                LeaderboardEntry(
                    rank=3,
                    user_id="user_003",
                    username="BettingMaster",
                    total_bets=52,
                    wins=34,
                    win_rate=0.65,
                    profit_loss=875.00,
                    roi_percentage=16.8,
                    current_streak=1,
                    best_streak=5
                )
            ][:limit]
        
        return BettingLeaderboardResponse(
            entries=entries,
            total_entries=len(entries),
            generated_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error fetching betting leaderboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch leaderboard: {str(e)}"
        )


@router.get("/odds/formats", response_model=OddsFormatsResponse)
async def get_odds_formats():
    """
    Get available odds formats.
    
    Returns information about supported odds formats including
    decimal, american, and fractional formats.
    """
    formats = [
        OddsFormatInfo(
            key="decimal",
            name="Decimal Odds",
            description="European format. Total return per unit stake (e.g., 2.50 means $2.50 returned for $1 bet)",
            example="2.50",
            region="Europe, Australia, Canada"
        ),
        OddsFormatInfo(
            key="american",
            name="American Odds",
            description="US format. Positive numbers show profit on $100 bet, negative shows amount needed to bet to win $100",
            example="+150 (bet $100 to win $150) or -120 (bet $120 to win $100)",
            region="United States"
        ),
        OddsFormatInfo(
            key="fractional",
            name="Fractional Odds",
            description="UK format. Ratio of profit to stake (e.g., 5/2 means $5 profit for every $2 staked)",
            example="5/2",
            region="United Kingdom, Ireland"
        )
    ]
    
    return OddsFormatsResponse(formats=formats)


@router.get("/matches/{match_id}/odds/live")
async def get_live_odds(match_id: str):
    """
    Get live odds for an in-progress match.
    
    Returns current odds adjusted for live match state including
    current score and recent events.
    
    - **match_id**: Unique match identifier
    """
    try:
        # Check if we have cached live odds
        cached = odds_engine.live_matches.get(match_id)
        if cached and cached.is_live:
            return _odds_result_to_response(cached)
        
        # Get match context
        context = await _get_match_context(match_id)
        if not context:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Match {match_id} not found"
            )
        
        # Calculate as live with mock current score
        # In production, this would fetch from live data source
        result = await odds_engine.calculate_odds(
            context,
            is_live=True,
            current_score={"team_a": 0, "team_b": 0}
        )
        
        # Cache result
        odds_engine.live_matches[match_id] = result
        
        return _odds_result_to_response(result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching live odds for match {match_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch live odds: {str(e)}"
        )


@router.get("/health")
async def betting_health_check():
    """
    Health check for betting service.
    
    Returns service status and odds engine health.
    """
    return {
        "status": "healthy",
        "service": "betting",
        "odds_engine": "initialized",
        "cached_matches": len(odds_engine.live_matches),
        "timestamp": datetime.utcnow().isoformat()
    }
