from fastapi import APIRouter, Query, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import sys
import os

# Add repo root to path for model imports
_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.api.src.njz_api.models.player import Player
from database import get_db
from cache import cache_get, cache_set

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/")
async def list_players(
    game: Optional[str] = Query(None, description="Filter by game: valorant or cs2"),
    team_id: Optional[int] = Query(None),
    slug: Optional[str] = Query(None, description="Filter by player slug"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    response: Response = None,
):
    """List players with optional game/team/slug filters."""
    if response:
        response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    cache_key = f"players:{game}:{team_id}:{slug}:{limit}:{offset}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    stmt = select(Player)
    if game:
        stmt = stmt.where(Player.game == game)
    if team_id:
        stmt = stmt.where(Player.team_id == team_id)
    if slug:
        stmt = stmt.where(Player.slug == slug)
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    players = result.scalars().all()

    count_stmt = select(func.count(Player.id))
    if game:
        count_stmt = count_stmt.where(Player.game == game)
    if team_id:
        count_stmt = count_stmt.where(Player.team_id == team_id)
    if slug:
        count_stmt = count_stmt.where(Player.slug == slug)
    total = (await db.execute(count_stmt)).scalar_one()

    result = {
        "players": [
            {
                "id": p.id,
                "pandascore_id": p.pandascore_id,
                "name": p.name,
                "slug": p.slug,
                "nationality": p.nationality,
                "game": p.game,
                "team_id": p.team_id,
            }
            for p in players
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }
    await cache_set(cache_key, result, ttl=120)
    return result


@router.get("/stats", summary="Aggregated player stats")
async def list_player_stats(
    game: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated K/D, ACS, HS% per player from player_stats table."""
    try:
        from services.api.src.njz_api.models.player_stats import PlayerStats
    except ImportError:
        try:
            from njz_api.models.player_stats import PlayerStats
        except ImportError as e:
            import logging
            logging.getLogger(__name__).error("PlayerStats model import failed: %s", e)
            raise HTTPException(status_code=503, detail="Stats service unavailable")

    stmt = (
        select(
            Player.id.label("player_id"),
            Player.name.label("handle"),
            Player.slug,
            Player.game,
            func.avg(PlayerStats.kd_ratio).label("avg_kd"),
            func.avg(PlayerStats.acs).label("avg_acs"),
            func.avg(PlayerStats.headshot_pct).label("avg_hs_pct"),
            func.count(PlayerStats.id).label("games"),
        )
        .join(PlayerStats, PlayerStats.player_id == Player.id)
        .group_by(Player.id, Player.name, Player.slug, Player.game)
        .order_by(func.avg(PlayerStats.kd_ratio).desc())
        .limit(limit)
    )
    if game:
        stmt = stmt.where(Player.game == game)
    result = await db.execute(stmt)
    rows = result.all()
    return {"stats": [
        {"player_id": r.player_id, "handle": r.handle, "slug": r.slug,
         "game": r.game, "avg_kd": round(float(r.avg_kd or 0), 2),
         "avg_acs": round(float(r.avg_acs or 0), 1),
         "avg_hs_pct": round(float(r.avg_hs_pct or 0), 1),
         "games": r.games}
        for r in rows
    ]}


@router.get("/{player_id}")
async def get_player(player_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single player by ID."""
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "player": {
            "id": player.id,
            "pandascore_id": player.pandascore_id,
            "name": player.name,
            "slug": player.slug,
            "nationality": player.nationality,
            "game": player.game,
            "team_id": player.team_id,
        }
    }
