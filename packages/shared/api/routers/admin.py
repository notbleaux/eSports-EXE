"""[Ver001.000] Admin API endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import sys
import os

_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.api.src.njz_api.models.player import Player
from services.api.src.njz_api.models.team import Team
from services.api.src.njz_api.models.match import Match
from database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", summary="Platform-wide stats for admin dashboard")
async def admin_stats(db: AsyncSession = Depends(get_db)):
    players = (await db.execute(select(func.count(Player.id)))).scalar() or 0
    teams = (await db.execute(select(func.count(Team.id)))).scalar() or 0
    matches = (await db.execute(select(func.count(Match.id)))).scalar() or 0
    return {"players": players, "teams": teams, "matches": matches, "forum_posts": 0}
