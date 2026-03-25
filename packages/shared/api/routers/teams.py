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

from services.api.src.njz_api.models.team import Team
from database import get_db

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/")
async def list_teams(
    game: Optional[str] = Query(None, description="Filter by game: valorant or cs2"),
    region: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """List teams with optional game/region filters."""
    stmt = select(Team)
    if game:
        stmt = stmt.where(Team.game == game)
    if region:
        stmt = stmt.where(Team.region == region)
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    teams = result.scalars().all()

    count_stmt = select(Team)
    if game:
        count_stmt = count_stmt.where(Team.game == game)
    if region:
        count_stmt = count_stmt.where(Team.region == region)
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    return {
        "teams": [
            {
                "id": t.id,
                "pandascore_id": t.pandascore_id,
                "name": t.name,
                "slug": t.slug,
                "acronym": t.acronym,
                "game": t.game,
                "region": t.region,
            }
            for t in teams
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{team_id}")
async def get_team(team_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single team by ID."""
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return {
        "team": {
            "id": team.id,
            "pandascore_id": team.pandascore_id,
            "name": team.name,
            "slug": team.slug,
            "acronym": team.acronym,
            "game": team.game,
            "region": team.region,
        }
    }
