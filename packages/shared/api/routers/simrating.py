from fastapi import APIRouter, Query, Depends, HTTPException, Response
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
from services.api.src.njz_api.models.player_stats import PlayerStats
from services.api.src.njz_api.models.sim_calculation import SimCalculation
from cache import cache_get, cache_set, cache_delete
from services.leaderboard_cache import get_cached_leaderboard, set_cached_leaderboard

router = APIRouter(prefix="/simrating", tags=["simrating"])


def grade_from_score(score: float) -> str:
    if score >= 90: return "S"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"


def calculate_simrating_v1(pandascore_id: int) -> dict:
    """
    SimRating v1 — deterministic heuristic based on pandascore_id.
    Used as fallback when no real stats are available.
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
        "games_sampled": 0,
    }


async def calculate_simrating_v2(player_id: int, db: AsyncSession) -> dict:
    """
    SimRating v2 — weighted stats formula using real match data.
    Falls back to v1 heuristic if no stats are available.

    Components (each 0-25, total 0-100):
      kd_score    — K/D ratio (2.0 KD = max 25)
      acs_score   — Average Combat Score (300 ACS = max 25)
      consistency — Games sample size (20 games = max 25)
      precision   — Headshot % (30% HS = max 25)
    """
    stmt = (
        select(PlayerStats)
        .where(PlayerStats.player_id == player_id)
        .order_by(PlayerStats.recorded_at.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    stats = result.scalars().all()

    if not stats:
        # Need pandascore_id for v1 fallback
        p_result = await db.execute(select(Player).where(Player.id == player_id))
        player = p_result.scalar_one_or_none()
        pid = player.pandascore_id if player else player_id
        return calculate_simrating_v1(pid)

    avg_kd = sum(s.kd_ratio for s in stats) / len(stats)
    avg_acs = sum(s.acs for s in stats) / len(stats)
    avg_hs_pct = sum(s.headshot_pct for s in stats) / len(stats)
    games = len(stats)

    kd_score = min(avg_kd / 2.0, 1.0) * 25
    acs_score = min(avg_acs / 300.0, 1.0) * 25
    consistency = min(games / 20.0, 1.0) * 25
    precision = min(avg_hs_pct / 30.0, 1.0) * 25

    simrating = round(kd_score + acs_score + consistency + precision, 1)

    return {
        "simrating": simrating,
        "grade": grade_from_score(simrating),
        "percentile": round(simrating),
        "components": {
            "kd_score": round(kd_score, 2),
            "acs_score": round(acs_score, 2),
            "consistency": round(consistency, 2),
            "precision": round(precision, 2),
        },
        "calculated_at": datetime.utcnow().isoformat(),
        "status": "calculated",
        "version": "v2_stats",
        "games_sampled": games,
    }


@router.get("/players/{player_id}")
async def get_player_simrating(player_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get SimRating for a specific player.
    SimRating v2: real stats-based (K/D, ACS, headshot %, games played).
    Falls back to v1 heuristic when no stats are available.
    """
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    calc = await calculate_simrating_v2(player_id, db)

    # Persist audit record (non-blocking — don't fail the request if this errors)
    try:
        comps = calc.get("components") or {}
        record = SimCalculation(
            player_id=player.id,
            game=player.game,
            simrating=calc["simrating"],
            source=calc.get("version", "unknown"),
            grade=calc["grade"],
            games_sampled=calc.get("games_sampled", 0),
            components=comps,
            kd_score=comps.get("kd_score", 0.0),
            acs_score=comps.get("acs_score", 0.0),
            consistency_score=comps.get("consistency", 0.0),
            precision_score=comps.get("precision", 0.0),
        )
        db.add(record)
        await db.commit()
    except Exception:
        await db.rollback()

    return {"player_id": player_id, "player_slug": player.slug, **calc}


async def _compute_leaderboard(db: AsyncSession, game: Optional[str], limit: int, offset: int = 0) -> dict:
    """Compute leaderboard data without caching. Used by the endpoint and cache warming."""
    stmt = select(Player)
    if game:
        stmt = stmt.where(Player.game == game)
    result = await db.execute(stmt)
    players = result.scalars().all()

    entries = []
    for p in players:
        calc = await calculate_simrating_v2(p.id, db)
        entries.append({
            "rank": 0,
            "player_id": p.id,
            "player_name": p.name,
            "player_slug": p.slug,
            "game": p.game,
            "team_id": p.team_id,
            **calc,
        })

    ranked = sorted(entries, key=lambda x: x["simrating"], reverse=True)

    for i, entry in enumerate(ranked[offset: offset + limit], start=offset + 1):
        entry["rank"] = i

    page = ranked[offset: offset + limit]
    return {
        "leaderboard": page,
        "total": len(ranked),
        "game": game,
        "limit": limit,
        "offset": offset,
    }


@router.get("/leaderboard")
async def get_simrating_leaderboard(
    response: Response,
    game: Optional[str] = Query(None, description="valorant or cs2"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """Top players ranked by SimRating v2 (descending)."""
    response.headers["Cache-Control"] = "public, max-age=120, stale-while-revalidate=300"

    cached = await get_cached_leaderboard(game, limit)
    if cached:
        return cached

    result = await _compute_leaderboard(db, game, limit, offset)
    await set_cached_leaderboard(game, limit, result)
    return result


@router.get("/position", summary="Position-based SimRating for a player")
async def get_position_simrating(
    player_id: int = Query(...),
    position: str = Query("flex", pattern="^(duelist|initiator|controller|sentinel|flex)$"),
    db: AsyncSession = Depends(get_db),
):
    """Return overall + role-specific SimRating breakdown."""
    import sys, os
    _ml = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'services', 'api', 'src', 'njz_api', 'ml')
    if _ml not in sys.path:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
    try:
        from services.api.src.njz_api.ml.position_simrating import calculate_position_simrating
        from services.api.src.njz_api.models.player_stats import PlayerStats
    except ImportError:
        return {"error": "ML module not available"}

    from sqlalchemy import func
    stmt = (
        select(
            func.avg(PlayerStats.kd_ratio).label("avg_kd"),
            func.avg(PlayerStats.acs).label("avg_acs"),
            func.avg(PlayerStats.headshot_pct).label("avg_hs"),
            func.count(PlayerStats.id).label("games"),
        )
        .where(PlayerStats.player_id == player_id)
    )
    result = await db.execute(stmt)
    row = result.one_or_none()
    if not row or not row.games:
        return {"player_id": player_id, "position": position, "ratings": None, "reason": "no_stats"}

    kd    = min(float(row.avg_kd or 0) / 2.0, 1.0) * 25
    acs   = min(float(row.avg_acs or 0) / 300.0, 1.0) * 25
    cons  = min(float(row.games) / 20.0, 1.0) * 25
    prec  = min(float(row.avg_hs or 0) / 30.0, 1.0) * 25

    ratings = calculate_position_simrating(kd, acs, cons, prec, position)
    return {"player_id": player_id, "position": position, "ratings": ratings, "games": row.games}
