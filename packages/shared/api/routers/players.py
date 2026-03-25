from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import sys
import os

# Add repo root to path for model imports
_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.api.src.njz_api.models.player import Player
from database import get_db

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/")
async def list_players(
    game: Optional[str] = Query(None, description="Filter by game: valorant or cs2"),
    team_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """List players with optional game/team filters."""
    stmt = select(Player)
    if game:
        stmt = stmt.where(Player.game == game)
    if team_id:
        stmt = stmt.where(Player.team_id == team_id)
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    players = result.scalars().all()

    count_stmt = select(Player)
    if game:
        count_stmt = count_stmt.where(Player.game == game)
    if team_id:
        count_stmt = count_stmt.where(Player.team_id == team_id)
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    return {
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
