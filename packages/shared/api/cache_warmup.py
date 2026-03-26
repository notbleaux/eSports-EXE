"""[Ver001.000] Cache warm-up on API startup — pre-populates leaderboard Redis keys.

Called from main.py lifespan to avoid cold-start latency spikes on first requests.
"""
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

GAMES = ["valorant", "cs2"]
LEADERBOARD_LIMIT = 100
LEADERBOARD_PAGES = 10  # offsets 0, 100, 200, ..., 900


async def warm_leaderboard_cache(db: "AsyncSession") -> None:
    """
    Pre-populate leaderboard cache keys for all games and pages.
    Runs once at startup so first user requests hit cache, not DB.
    """
    try:
        from sqlalchemy import select, func
        from services.api.src.njz_api.models.player import Player
        from services.api.src.njz_api.models.player_stats import PlayerStats
        from cache import cache_set
        from routers.simrating import grade_from_score
    except ImportError as e:
        logger.warning("Cache warmup skipped — import error: %s", e)
        return

    for game in GAMES:
        stmt = (
            select(
                Player.id.label("player_id"),
                Player.name.label("handle"),
                Player.slug,
                Player.game,
                func.avg(PlayerStats.kd_ratio).label("avg_kd"),
                func.avg(PlayerStats.acs).label("avg_acs"),
                func.avg(PlayerStats.headshot_pct).label("avg_hs"),
                func.count(PlayerStats.id).label("games"),
            )
            .join(PlayerStats, PlayerStats.player_id == Player.id)
            .where(Player.game == game)
            .group_by(Player.id, Player.name, Player.slug, Player.game)
            .order_by(func.avg(PlayerStats.kd_ratio).desc())
            .limit(LEADERBOARD_LIMIT * LEADERBOARD_PAGES)
        )
        try:
            rows = (await db.execute(stmt)).all()
        except Exception as exc:
            logger.warning("Leaderboard warm-up query failed for %s: %s", game, exc)
            continue

        all_entries = [
            {
                "player_id": r.player_id,
                "handle": r.handle,
                "slug": r.slug,
                "game": r.game,
                "avg_kd": round(float(r.avg_kd or 0), 2),
                "avg_acs": round(float(r.avg_acs or 0), 1),
                "avg_hs_pct": round(float(r.avg_hs or 0), 1),
                "games": r.games,
            }
            for r in rows
        ]

        for page in range(LEADERBOARD_PAGES):
            offset = page * LEADERBOARD_LIMIT
            slice_ = all_entries[offset: offset + LEADERBOARD_LIMIT]
            ttl = 300 if page == 0 else 600  # Top 100 refreshes faster
            cache_key = f"leaderboard:{game}:{LEADERBOARD_LIMIT}:{offset}"
            await cache_set(cache_key, {"leaderboard": slice_, "total": len(all_entries)}, ttl=ttl)

    logger.info("Leaderboard cache warm-up complete (%s games × %s pages)", len(GAMES), LEADERBOARD_PAGES)
