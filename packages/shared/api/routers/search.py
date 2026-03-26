"""[Ver001.000] Unified search endpoint across Players, Teams, and Matches."""
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Optional
import sys, os

_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.api.src.njz_api.models.player import Player
from services.api.src.njz_api.models.team import Team
from database import get_db
from cache import cache_get, cache_set

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/", summary="Unified search across Players and Teams")
async def search(
    q: str = Query(..., min_length=2, max_length=100, description="Search query"),
    game: Optional[str] = Query(None, description="Filter by game: valorant or cs2"),
    resource_type: Optional[str] = Query(None, description="Filter by type: player, team"),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Search across players and teams. Results are cached for 60s."""
    cache_key = f"search:{q}:{game}:{resource_type}:{limit}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    results = []

    if resource_type in (None, "player"):
        stmt = select(Player).where(
            or_(
                Player.name.ilike(f"%{q}%"),
                Player.slug.ilike(f"%{q}%"),
            )
        ).limit(limit)
        if game:
            stmt = stmt.where(Player.game == game)
        r = await db.execute(stmt)
        for p in r.scalars().all():
            results.append({
                "type": "player", "id": p.id, "name": p.name or p.slug,
                "slug": p.slug, "game": p.game,
            })

    if resource_type in (None, "team"):
        stmt = select(Team).where(
            or_(
                Team.name.ilike(f"%{q}%"),
                Team.slug.ilike(f"%{q}%"),
            )
        ).limit(limit)
        if game:
            stmt = stmt.where(Team.game == game)
        r = await db.execute(stmt)
        for t in r.scalars().all():
            results.append({
                "type": "team", "id": t.id, "name": t.name or t.slug,
                "slug": t.slug, "game": t.game,
            })

    out = {"results": results[:limit], "total": len(results), "query": q}
    await cache_set(cache_key, out, ttl=60)
    return out
