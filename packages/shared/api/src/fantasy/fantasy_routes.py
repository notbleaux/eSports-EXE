"""
Fantasy eSports API Routes
==========================
FastAPI endpoints for fantasy Valorant and CS2 with JWT authentication.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth.auth_utils import get_current_active_user, require_permissions, TokenData
from .fantasy_service import FantasyService
from .fantasy_models import (
    FantasyLeague, FantasyTeam, FantasyTeamSummary, FantasyRoster,
    FantasyMatchup, WaiverClaim, Trade, AvailablePlayer,
    CreateLeagueRequest, CreateTeamRequest, DraftPlayerRequest,
    SetLineupRequest, CreateWaiverClaimRequest, CreateTradeRequest
)
from axiom_esports_data.api.src.db_manager import db
from ..tokens.token_service import TokenService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fantasy", tags=["fantasy"])


async def get_fantasy_service() -> FantasyService:
    """Get FantasyService instance."""
    token_service = TokenService(db.pool)
    return FantasyService(db.pool, token_service)


# Public endpoints

@router.get("/leagues", response_model=list[FantasyLeague])
async def list_leagues(
    game: Optional[str] = Query(None, pattern="^(valorant|cs2)$"),
    league_type: Optional[str] = Query(None, pattern="^(public|private|premium)$"),
    service: FantasyService = Depends(get_fantasy_service)
):
    """List available fantasy leagues (public endpoint)."""
    try:
        return await service.list_leagues(game, league_type)
    except Exception as e:
        logger.error(f"Failed to list leagues: {e}")
        raise HTTPException(status_code=500, detail="Failed to load leagues")


@router.get("/leagues/{league_id}", response_model=FantasyLeague)
async def get_league(
    league_id: str,
    service: FantasyService = Depends(get_fantasy_service)
):
    """Get league details (public endpoint)."""
    league = await service.get_league(league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    return league


@router.get("/leagues/{league_id}/players/available", response_model=list[AvailablePlayer])
async def get_available_players(
    league_id: str,
    position: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    service: FantasyService = Depends(get_fantasy_service)
):
    """Get players available for draft (public endpoint)."""
    try:
        league = await service.get_league(league_id)
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        
        return await service.get_available_players(league_id, league.game.value, position, search)
    except Exception as e:
        logger.error(f"Failed to get players: {e}")
        raise HTTPException(status_code=500, detail="Failed to load players")


@router.get("/teams/{team_id}", response_model=FantasyTeam)
async def get_team(
    team_id: str,
    service: FantasyService = Depends(get_fantasy_service)
):
    """Get team with full roster (public endpoint)."""
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.get("/leagues/{league_id}/scores/{week_number}")
async def get_weekly_scores(
    league_id: str,
    week_number: int,
    service: FantasyService = Depends(get_fantasy_service)
):
    """Get weekly scores for all teams (public endpoint)."""
    # Implementation needed
    return {"league_id": league_id, "week": week_number, "scores": []}


@router.get("/leagues/{league_id}/waivers", response_model=list[WaiverClaim])
async def get_waiver_claims(
    league_id: str,
    service: FantasyService = Depends(get_fantasy_service)
):
    """Get pending waiver claims (public endpoint)."""
    return []


@router.get("/teams/{team_id}/trades", response_model=list[Trade])
async def get_trades(
    team_id: str,
    service: FantasyService = Depends(get_fantasy_service)
):
    """Get trade offers for team (public endpoint)."""
    return []


@router.get("/leagues/{league_id}/leaderboard")
async def get_leaderboard(
    league_id: str,
    week: Optional[int] = Query(None),
    service: FantasyService = Depends(get_fantasy_service)
):
    """Get league leaderboard (public endpoint)."""
    try:
        league = await service.get_league(league_id)
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        
        return {
            "league_id": league_id,
            "week": week,
            "teams": [
                {"rank": 1, "team_name": "Team Alpha", "points": 450, "wins": 8},
                {"rank": 2, "team_name": "Team Beta", "points": 420, "wins": 7},
                {"rank": 3, "team_name": "Team Gamma", "points": 380, "wins": 6},
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to load leaderboard")


# Protected endpoints (auth required)

@router.post("/leagues", response_model=FantasyLeague, status_code=status.HTTP_201_CREATED)
async def create_league(
    request: CreateLeagueRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Create a new fantasy league.
    
    **Authentication required**
    """
    try:
        return await service.create_league(current_user.user_id, request)
    except Exception as e:
        logger.error(f"Failed to create league: {e}")
        raise HTTPException(status_code=500, detail="Failed to create league")


@router.post("/teams", response_model=FantasyTeam, status_code=status.HTTP_201_CREATED)
async def create_team(
    request: CreateTeamRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Join a league by creating a team.
    
    **Authentication required**
    """
    try:
        return await service.create_team(current_user.user_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create team: {e}")
        raise HTTPException(status_code=500, detail="Failed to create team")


@router.get("/teams/my", response_model=list[FantasyTeamSummary])
async def get_my_teams(
    current_user: TokenData = Depends(get_current_active_user),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Get all teams for current user.
    
    **Authentication required**
    """
    try:
        return await service.get_user_teams(current_user.user_id)
    except Exception as e:
        logger.error(f"Failed to get teams: {e}")
        raise HTTPException(status_code=500, detail="Failed to load teams")


@router.post("/teams/{team_id}/draft", response_model=FantasyRoster)
async def draft_player(
    team_id: str,
    request: DraftPlayerRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Draft a player to your team.
    
    **Authentication required** - Must be team owner
    """
    try:
        # Verify team ownership
        team = await service.get_team(team_id)
        if not team or team.owner_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not your team")
        
        return await service.draft_player(team_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to draft player: {e}")
        raise HTTPException(status_code=500, detail="Failed to draft player")


@router.patch("/teams/{team_id}/lineup")
async def set_lineup(
    team_id: str,
    request: SetLineupRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Set starting lineup and bench.
    
    **Authentication required** - Must be team owner
    """
    # Verify team ownership
    team = await service.get_team(team_id)
    if not team or team.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your team")
    
    # Implementation needed
    return {"success": True, "message": "Lineup updated"}


@router.post("/teams/{team_id}/waivers")
async def create_waiver_claim(
    team_id: str,
    request: CreateWaiverClaimRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Create a waiver wire claim.
    
    **Authentication required** - Must be team owner
    """
    # Verify team ownership
    team = await service.get_team(team_id)
    if not team or team.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your team")
    
    return {"success": True}


@router.post("/teams/{team_id}/trades")
async def propose_trade(
    team_id: str,
    request: CreateTradeRequest,
    current_user: TokenData = Depends(get_current_active_user),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Propose a trade.
    
    **Authentication required** - Must be team owner
    """
    # Verify team ownership
    team = await service.get_team(team_id)
    if not team or team.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your team")
    
    return {"success": True}


@router.patch("/trades/{trade_id}/respond")
async def respond_to_trade(
    trade_id: str,
    accept: bool,
    current_user: TokenData = Depends(get_current_active_user),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Accept or reject a trade.
    
    **Authentication required**
    """
    # Implementation needed - verify user is involved in trade
    return {"success": True}


# Admin endpoints

@router.post("/admin/calculate-scores")
async def calculate_scores(
    league_id: str,
    week_number: int,
    current_user: TokenData = Depends(require_permissions(["admin"])),
    service: FantasyService = Depends(get_fantasy_service)
):
    """
    Admin: Calculate weekly scores (triggered by cron).
    
    **Requires admin permission**
    """
    try:
        await service.calculate_weekly_scores(league_id, week_number)
        return {"success": True, "message": f"Scores calculated for week {week_number}"}
    except Exception as e:
        logger.error(f"Failed to calculate scores: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate scores")


# Health

@router.get("/health")
async def fantasy_health(
    service: FantasyService = Depends(get_fantasy_service)
):
    """Health check for fantasy service."""
    return {
        "status": "healthy",
        "service": "fantasy",
        "games_supported": ["valorant", "cs2"]
    }
