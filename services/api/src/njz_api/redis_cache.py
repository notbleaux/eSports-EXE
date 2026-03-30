"""[Ver001.000]
Redis cache client.
"""

import os
import logging
from typing import Optional
from redis import asyncio as aioredis

logger = logging.getLogger(__name__)

_redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> aioredis.Redis:
    """Get or create Redis client."""
    global _redis_client
    
    if _redis_client is None:
        redis_url = os.environ.get(
            "REDIS_URL",
            "redis://localhost:6379"
        )
        
        _redis_client = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        logger.info("Redis client created")
    
    return _redis_client


async def close_redis_client():
    """Close Redis client."""
    global _redis_client
    
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis client closed")


# Compatibility alias for modules that import redis_client
# Usage: await redis_client() instead of await get_redis_client()
redis_client = get_redis_client
