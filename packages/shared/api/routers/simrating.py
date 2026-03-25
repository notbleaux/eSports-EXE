from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime
from database import get_db

import sys
import os
_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.api.src.njz_api.models.player import Player
from cache import cache_get, cache_set

router = APIRouter(prefix="/simrating", tags=["simrating"])


def grade_from_score(score: float) -> str:
    if score >= 90: return "S"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"


def calculate_simrating(pandascore_id: int) -> dict:
    """
    SimRating v1 — deterministic heuristic based on pandascore_id.
    Phase 5 v2 will use real per-match stats (K/D/A, win rate, round impact).
    Formula produces stable 40-99 range per player.
    """
    rating = 40 + (pandascore_id % 60)
    components = {
        "consistency":    round(rating * 0.25, 2),
        "win_rate":       round(rating * 0.25, 2),
        "impact":         round(rating * 0.25, 2),
        "survivability":  round(rating * 0.25, 2),
    }
    return {
        "simrating": round(rating, 2),
        "grade": grade_from_score(rating),
        "percentile": round(rating),
        "components": components,
        "calculated_at": datetime.utcnow().isoformat(),
        "status": "calculated",
        "version": "v1_heuristic",
    }


@router.get("/players/{player_id}")
async def get_player_simrating(player_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get SimRating for a specific player.
    SimRating v1: deterministic heuristic (pandascore_id % 60 + 40).
    Phase 5 will replace with real ML calculation.
    """
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    calc = calculate_simrating(player.pandascore_id)
    return {"player_id": player_id, "player_slug": player.slug, **calc}


@router.get("/leaderboard")
async def get_simrating_leaderboard(
    game: Optional[str] = Query(None, description="valorant or cs2"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """Top players ranked by SimRating (descending). Phase 5 uses real stats."""
    cache_key = f"simrating:leaderboard:{game}:{limit}:{offset}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    stmt = select(Player)
    if game:
        stmt = stmt.where(Player.game == game)
    result = await db.execute(stmt)
    players = result.scalars().all()

    ranked = sorted(
        [
            {
                "rank": 0,
                "player_id": p.id,
                "player_name": p.name,
                "player_slug": p.slug,
                "game": p.game,
                "team_id": p.team_id,
                **calculate_simrating(p.pandascore_id),
            }
            for p in players
        ],
        key=lambda x: x["simrating"],
        reverse=True,
    )

    for i, entry in enumerate(ranked[offset : offset + limit], start=offset + 1):
        entry["rank"] = i

    page = ranked[offset : offset + limit]
    result = {
        "leaderboard": page,
        "total": len(ranked),
        "game": game,
        "limit": limit,
        "offset": offset,
    }
    await cache_set(cache_key, result, ttl=300)
    return result
