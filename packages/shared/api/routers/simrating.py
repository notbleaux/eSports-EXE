from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/simrating", tags=["simrating"])


@router.get("/players/{player_id}")
async def get_player_simrating(player_id: int):
    """
    Get SimRating for a specific player.
    SimRating = simulation-based performance rating (0-100 scale).
    Phase 5 will implement real ML calculations.
    """
    return {
        "player_id": player_id,
        "simrating": None,
        "rar": None,
        "calculated_at": None,
        "status": "pending_calculation",
    }


@router.get("/leaderboard")
async def get_simrating_leaderboard(
    game: Optional[str] = Query(None, description="valorant or cs2"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    """Top players by SimRating. Phase 5 will populate real data."""
    return {
        "leaderboard": [],
        "total": 0,
        "game": game,
        "limit": limit,
        "offset": offset,
    }
