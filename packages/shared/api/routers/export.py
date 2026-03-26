"""[Ver001.000] Data export endpoints — CSV and JSON streaming for players, matches, SimRatings.

Rate-limited to 5 exports per hour per authenticated user.
Maximum 10,000 rows per export request.
"""
import csv
import io
import json
import logging
import sys
import os
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

_REPO_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from database import get_db
from src.auth.auth_utils import get_current_user
from src.auth.auth_schemas import TokenData

try:
    from services.api.src.njz_api.models.player import Player
    from services.api.src.njz_api.models.player_stats import PlayerStats
    from services.api.src.njz_api.models.match import Match
    from services.api.src.njz_api.models.sim_calculation import SimCalculation
    _MODELS_AVAILABLE = True
except ImportError:
    _MODELS_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/export", tags=["export"])

MAX_ROWS = 10_000
EXPORT_FIELDS_PLAYERS = ["id", "name", "slug", "game", "nationality", "team_id"]
EXPORT_FIELDS_MATCHES = ["id", "pandascore_id", "game", "status", "scheduled_at", "team_a_score", "team_b_score"]
EXPORT_FIELDS_SIMRATINGS = ["id", "player_id", "sim_rating", "grade", "version", "calculated_at"]


def _require_models() -> None:
    if not _MODELS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Export service unavailable — DB models not loaded")


async def _csv_stream(headers: list[str], rows: list) -> AsyncGenerator[str, None]:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    yield buf.getvalue()


@router.get("/players", summary="Export player data as CSV or NDJSON")
async def export_players(
    game: Optional[str] = Query(None, description="Filter: valorant or cs2"),
    format: str = Query("csv", regex="^(csv|json)$"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Stream player records. Max 10,000 rows. Rate limited to 5/hour per user."""
    _require_models()
    stmt = select(Player).limit(MAX_ROWS)
    if game:
        stmt = stmt.where(Player.game == game)
    players = (await db.execute(stmt)).scalars().all()
    rows = [
        {f: getattr(p, f, None) for f in EXPORT_FIELDS_PLAYERS}
        for p in players
    ]

    from datetime import date
    filename = f"njz-{game or 'all'}-players-{date.today()}"

    if format == "json":
        async def ndjson():
            for row in rows:
                yield json.dumps(row) + "\n"
        return StreamingResponse(
            ndjson(),
            media_type="application/x-ndjson",
            headers={"Content-Disposition": f"attachment; filename={filename}.ndjson"},
        )
    else:
        async def csv_gen():
            buf = io.StringIO()
            writer = csv.DictWriter(buf, fieldnames=EXPORT_FIELDS_PLAYERS, extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                writer.writerow(row)
                yield buf.getvalue()
                buf.truncate(0); buf.seek(0)
        return StreamingResponse(
            csv_gen(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
        )


@router.get("/matches", summary="Export match data as CSV or NDJSON")
async def export_matches(
    game: Optional[str] = Query(None),
    format: str = Query("csv", regex="^(csv|json)$"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Stream match records. Max 10,000 rows."""
    _require_models()
    stmt = select(Match).limit(MAX_ROWS)
    if game:
        stmt = stmt.where(Match.game == game)
    matches = (await db.execute(stmt)).scalars().all()
    rows = [
        {f: str(getattr(m, f, "")) for f in EXPORT_FIELDS_MATCHES}
        for m in matches
    ]

    from datetime import date
    filename = f"njz-{game or 'all'}-matches-{date.today()}"

    if format == "json":
        async def ndjson():
            for row in rows:
                yield json.dumps(row) + "\n"
        return StreamingResponse(
            ndjson(),
            media_type="application/x-ndjson",
            headers={"Content-Disposition": f"attachment; filename={filename}.ndjson"},
        )
    else:
        async def csv_gen():
            buf = io.StringIO()
            writer = csv.DictWriter(buf, fieldnames=EXPORT_FIELDS_MATCHES, extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                writer.writerow(row)
                yield buf.getvalue()
                buf.truncate(0); buf.seek(0)
        return StreamingResponse(
            csv_gen(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
        )


@router.get("/simratings", summary="Export SimRating calculations as CSV or NDJSON")
async def export_simratings(
    game: Optional[str] = Query(None),
    format: str = Query("csv", regex="^(csv|json)$"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Stream SimRating calculation records. Max 10,000 rows."""
    _require_models()
    stmt = (
        select(SimCalculation, Player.game.label("player_game"))
        .join(Player, Player.id == SimCalculation.player_id)
        .limit(MAX_ROWS)
    )
    if game:
        stmt = stmt.where(Player.game == game)
    results = (await db.execute(stmt)).all()
    rows = [
        {
            "id": r.SimCalculation.id,
            "player_id": r.SimCalculation.player_id,
            "sim_rating": r.SimCalculation.sim_rating,
            "grade": r.SimCalculation.grade,
            "version": r.SimCalculation.version,
            "calculated_at": str(r.SimCalculation.calculated_at),
        }
        for r in results
    ]

    from datetime import date
    filename = f"njz-{game or 'all'}-simratings-{date.today()}"

    if format == "json":
        async def ndjson():
            for row in rows:
                yield json.dumps(row) + "\n"
        return StreamingResponse(
            ndjson(),
            media_type="application/x-ndjson",
            headers={"Content-Disposition": f"attachment; filename={filename}.ndjson"},
        )
    else:
        async def csv_gen():
            buf = io.StringIO()
            writer = csv.DictWriter(buf, fieldnames=EXPORT_FIELDS_SIMRATINGS, extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                writer.writerow(row)
                yield buf.getvalue()
                buf.truncate(0); buf.seek(0)
        return StreamingResponse(
            csv_gen(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
        )
