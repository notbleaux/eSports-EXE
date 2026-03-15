"""
OPERA API Routes
================
FastAPI endpoints for OPERA tournament metadata and schedules.
Mostly public endpoints for viewing tournament information.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth.auth_utils import get_current_active_user, require_permissions, TokenData
from .tidb_client import TiDBOperaClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/opera", tags=["opera"])


def get_opera_client() -> TiDBOperaClient:
    """Get TiDBOperaClient instance."""
    return TiDBOperaClient()


# Tournament endpoints (public)

@router.get("/tournaments")
async def list_tournaments(
    circuit: Optional[str] = Query(None, description="Filter by circuit (e.g., vct, vcl)"),
    season: Optional[str] = Query(None, description="Filter by season (e.g., 2024, 2025)"),
    status: Optional[str] = Query(None, pattern="^(upcoming|ongoing|completed)$"),
    limit: int = Query(20, ge=1, le=100),
    client: TiDBOperaClient = Depends(get_opera_client)
):
    """
    List tournaments with optional filtering.
    
    Public endpoint - no authentication required.
    """
    try:
        tournaments = client.list_tournaments(circuit, season, status, limit)
        return {
            "tournaments": tournaments,
            "count": len(tournaments)
        }
    except Exception as e:
        logger.error(f"Failed to list tournaments: {e}")
        raise HTTPException(status_code=500, detail="Failed to load tournaments")


@router.get("/tournaments/{tournament_id}")
async def get_tournament(
    tournament_id: str,
    client: TiDBOperaClient = Depends(get_opera_client)
):
    """
    Get detailed information about a specific tournament.
    
    Public endpoint - no authentication required.
    """
    try:
        tournament = client.get_tournament(tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        return tournament
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get tournament: {e}")
        raise HTTPException(status_code=500, detail="Failed to load tournament")


@router.get("/tournaments/{tournament_id}/schedule")
async def get_tournament_schedule(
    tournament_id: str,
    client: TiDBOperaClient = Depends(get_opera_client)
):
    """
    Get schedule for a tournament.
    
    Public endpoint - no authentication required.
    """
    try:
        schedule = client.get_schedule_for_tournament(tournament_id)
        return {
            "tournament_id": tournament_id,
            "schedule": schedule,
            "count": len(schedule)
        }
    except Exception as e:
        logger.error(f"Failed to get schedule: {e}")
        raise HTTPException(status_code=500, detail="Failed to load schedule")


# Patch/Changelog endpoints (public)

@router.get("/patches/{patch_version}")
async def get_patch_info(
    patch_version: str,
    client: TiDBOperaClient = Depends(get_opera_client)
):
    """
    Get information about a specific game patch.
    
    Public endpoint - no authentication required.
    """
    try:
        patch = client.get_patch(patch_version)
        if not patch:
            raise HTTPException(status_code=404, detail="Patch not found")
        return patch
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get patch info: {e}")
        raise HTTPException(status_code=500, detail="Failed to load patch info")


@router.get("/patches")
async def list_patches(
    game: str = Query("valorant", pattern="^(valorant|cs2)$"),
    limit: int = Query(10, ge=1, le=50),
    client: TiDBOperaClient = Depends(get_opera_client)
):
    """
    List recent game patches.
    
    Public endpoint - no authentication required.
    """
    try:
        # This would query patches from TiDB
        # For now, return mock data
        return {
            "game": game,
            "patches": [
                {"version": "8.11", "release_date": "2024-06-01", "highlights": ["Agent updates"]}
            ],
            "count": 1
        }
    except Exception as e:
        logger.error(f"Failed to list patches: {e}")
        raise HTTPException(status_code=500, detail="Failed to load patches")


# Circuit information (public)

@router.get("/circuits")
async def list_circuits(
    region: Optional[str] = Query(None)
):
    """
    List available esports circuits.
    
    Public endpoint - no authentication required.
    """
    circuits = [
        {"id": "vct", "name": "Valorant Champions Tour", "regions": ["EMEA", "Americas", "Pacific", "China"]},
        {"id": "vcl", "name": "Valorant Challengers League", "regions": ["NA", "EU", "BR", "JP", "KR"]},
        {"id": "gc", "name": "Game Changers", "regions": ["Global"]},
    ]
    
    if region:
        circuits = [c for c in circuits if region.lower() in [r.lower() for r in c["regions"]]]
    
    return {"circuits": circuits}


# Admin endpoints (protected)

@router.post("/admin/tournaments", status_code=status.HTTP_201_CREATED)
async def create_tournament(
    tournament_data: dict,
    current_user: TokenData = Depends(require_permissions(["admin"])),
    client: TiDBOperaClient = Depends(get_opera_client)
):
    """
    Create a new tournament (admin only).
    
    **Requires admin permission**
    """
    try:
        # This would insert into TiDB
        logger.info(f"Admin {current_user.user_id} creating tournament")
        return {"success": True, "message": "Tournament created"}
    except Exception as e:
        logger.error(f"Failed to create tournament: {e}")
        raise HTTPException(status_code=500, detail="Failed to create tournament")


@router.post("/admin/tournaments/{tournament_id}/schedule")
async def add_schedule_item(
    tournament_id: str,
    schedule_item: dict,
    current_user: TokenData = Depends(require_permissions(["admin"])),
    client: TiDBOperaClient = Depends(get_opera_client)
):
    """
    Add a match to tournament schedule (admin only).
    
    **Requires admin permission**
    """
    try:
        logger.info(f"Admin {current_user.user_id} adding schedule item to {tournament_id}")
        return {"success": True, "message": "Schedule item added"}
    except Exception as e:
        logger.error(f"Failed to add schedule item: {e}")
        raise HTTPException(status_code=500, detail="Failed to add schedule item")


# Health check

@router.get("/health")
async def opera_health(
    client: TiDBOperaClient = Depends(get_opera_client)
):
    """
    Health check for OPERA service.
    
    Checks TiDB connectivity.
    """
    try:
        # Try to get a tournament to verify connectivity
        tournaments = client.list_tournaments(limit=1)
        return {
            "status": "healthy",
            "tidb_connected": True,
            "service": "opera",
            "tournaments_available": len(tournaments) > 0
        }
    except Exception as e:
        logger.error(f"OPERA health check failed: {e}")
        return {
            "status": "degraded",
            "tidb_connected": False,
            "service": "opera",
            "message": "TiDB connection unavailable"
        }
