"""[Ver001.000] Leaderboard cache service — structured TTLs and cache warming."""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# TTL constants
TTL_GLOBAL_LEADERBOARD = 300    # 5 minutes
TTL_GAME_LEADERBOARD = 600      # 10 minutes (less volatile)
TTL_PLAYER_SIMRATING = 120      # 2 minutes per-player


def leaderboard_cache_key(game: Optional[str], limit: int) -> str:
    return f"lb:v2:{game or 'all'}:{limit}"


def player_simrating_cache_key(player_id: int) -> str:
    return f"simrating:player:{player_id}"


async def get_cached_leaderboard(game: Optional[str], limit: int):
    from cache import cache_get
    key = leaderboard_cache_key(game, limit)
    result = await cache_get(key)
    if result:
        logger.debug(f"Cache HIT leaderboard key={key}")
    else:
        logger.debug(f"Cache MISS leaderboard key={key}")
    return result


async def set_cached_leaderboard(game: Optional[str], limit: int, data: dict):
    from cache import cache_set
    key = leaderboard_cache_key(game, limit)
    ttl = TTL_GAME_LEADERBOARD if game else TTL_GLOBAL_LEADERBOARD
    await cache_set(key, data, ttl=ttl)


async def invalidate_leaderboard(game: Optional[str] = None):
    """Invalidate leaderboard cache entries. Called on match completion or stats update."""
    from cache import cache_set
    # Simple invalidation by writing empty TTL-1 entry
    # In production, use Redis DEL pattern matching
    for g in ([game] if game else [None, 'valorant', 'cs2']):
        for limit in [10, 25, 50, 100]:
            key = leaderboard_cache_key(g, limit)
            logger.info(f"Invalidating cache key: {key}")
            # Set with TTL=1 to expire immediately
            await cache_set(key, None, ttl=1)


async def warm_leaderboard_cache(db):
    """Pre-warm top leaderboard entries on startup."""
    logger.info("Warming leaderboard cache...")
    from routers.simrating import _compute_leaderboard
    try:
        for game in [None, 'valorant', 'cs2']:
            for limit in [10, 50]:
                data = await _compute_leaderboard(db, game, limit)
                await set_cached_leaderboard(game, limit, data)
                logger.info(f"  Warmed: game={game} limit={limit}")
    except Exception as e:
        logger.warning(f"Cache warming failed (non-fatal): {e}")
