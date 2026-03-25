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

from services.api.src.njz_api.models.match import Match
from database import get_db

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/")
async def list_matches(
    game: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="not_started, running, finished"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """List matches with optional game/status filters."""
    stmt = select(Match)
    if game:
        stmt = stmt.where(Match.game == game)
    if status:
        stmt = stmt.where(Match.status == status)
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    matches = result.scalars().all()

    count_stmt = select(Match)
    if game:
        count_stmt = count_stmt.where(Match.game == game)
    if status:
        count_stmt = count_stmt.where(Match.status == status)
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    return {
        "matches": [
            {
                "id": m.id,
                "pandascore_id": m.pandascore_id,
                "name": m.name,
                "game": m.game,
                "status": m.status,
                "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
                "finished_at": m.finished_at.isoformat() if m.finished_at else None,
                "team1_id": m.team1_id,
                "team2_id": m.team2_id,
                "winner_id": m.winner_id,
            }
            for m in matches
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{match_id}")
async def get_match(match_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single match by ID."""
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return {
        "match": {
            "id": match.id,
            "pandascore_id": match.pandascore_id,
            "name": match.name,
            "game": match.game,
            "status": match.status,
            "scheduled_at": match.scheduled_at.isoformat() if match.scheduled_at else None,
            "finished_at": match.finished_at.isoformat() if match.finished_at else None,
            "team1_id": match.team1_id,
            "team2_id": match.team2_id,
            "winner_id": match.winner_id,
        }
    }
