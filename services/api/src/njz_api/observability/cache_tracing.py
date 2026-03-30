"""
Cache Tracing Module

Enhanced Redis cache operations with OpenTelemetry tracing.
[Ver001.000]

Provides detailed cache operation visibility for performance analysis.
"""

import time
import logging
from typing import Optional, Any, Union, List
from functools import wraps

from redis.asyncio import Redis

from .tracing import get_tracing_manager, TraceAttributes

logger = logging.getLogger(__name__)


class TracedRedis:
    """
    Wrapped Redis client with tracing support.
    
    Tracks cache operations with hit/miss ratios and latency metrics.
    """
    
    def __init__(self, client: Redis):
        self._client = client
        self._tracer = get_tracing_manager()
        
        # Cache statistics (local aggregation)
        self._stats = {
            "hits": 0,
            "misses": 0,
            "operations": 0,
        }
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value with tracing."""
        start_time = time.time()
        
        with self._tracer.start_cache_span("get", key):
            try:
                result = await self._client.get(key)
                duration = (time.time() - start_time) * 1000
                
                is_hit = result is not None
                self._stats["operations"] += 1
                if is_hit:
                    self._stats["hits"] += 1
                else:
                    self._stats["misses"] += 1
                
                self._tracer.set_attributes({
                    TraceAttributes.CACHE_HIT: is_hit,
                    TraceAttributes.CACHE_DURATION_MS: duration,
                    "cache.stats.hits": self._stats["hits"],
                    "cache.stats.misses": self._stats["misses"],
                    "cache.stats.hit_ratio": self._calculate_hit_ratio(),
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def set(
        self,
        key: str,
        value: Any,
        ex: Optional[int] = None,
        px: Optional[int] = None,
        nx: bool = False,
        xx: bool = False,
    ) -> bool:
        """Set value with tracing."""
        start_time = time.time()
        
        with self._tracer.start_cache_span("set", key):
            try:
                result = await self._client.set(key, value, ex=ex, px=px, nx=nx, xx=xx)
                duration = (time.time() - start_time) * 1000
                
                self._stats["operations"] += 1
                
                self._tracer.set_attributes({
                    TraceAttributes.CACHE_DURATION_MS: duration,
                    "cache.ttl.seconds": ex,
                    "cache.set.nx": nx,
                    "cache.set.xx": xx,
                    "cache.result": result,
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def delete(self, *keys: str) -> int:
        """Delete keys with tracing."""
        start_time = time.time()
        
        with self._tracer.start_cache_span("delete", keys[0] if keys else None):
            try:
                result = await self._client.delete(*keys)
                duration = (time.time() - start_time) * 1000
                
                self._stats["operations"] += 1
                
                self._tracer.set_attributes({
                    TraceAttributes.CACHE_DURATION_MS: duration,
                    "cache.keys.deleted": result,
                    "cache.keys.count": len(keys),
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def exists(self, *keys: str) -> int:
        """Check existence with tracing."""
        with self._tracer.start_cache_span("exists", keys[0] if keys else None):
            return await self._client.exists(*keys)
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiry with tracing."""
        with self._tracer.start_cache_span("expire", key):
            self._tracer.set_attributes({"cache.ttl.seconds": seconds})
            return await self._client.expire(key, seconds)
    
    async def ttl(self, key: str) -> int:
        """Get TTL with tracing."""
        with self._tracer.start_cache_span("ttl", key):
            return await self._client.ttl(key)
    
    async def mget(self, keys: List[str]) -> List[Optional[Any]]:
        """Multi-get with tracing."""
        start_time = time.time()
        
        with self._tracer.start_cache_span("mget", keys[0] if keys else None):
            try:
                results = await self._client.mget(keys)
                duration = (time.time() - start_time) * 1000
                
                hits = sum(1 for r in results if r is not None)
                misses = len(results) - hits
                
                self._stats["hits"] += hits
                self._stats["misses"] += misses
                self._stats["operations"] += len(keys)
                
                self._tracer.set_attributes({
                    TraceAttributes.CACHE_DURATION_MS: duration,
                    TraceAttributes.DB_ROWS_AFFECTED: hits,
                    "cache.mget.keys": len(keys),
                    "cache.mget.hits": hits,
                    "cache.mget.misses": misses,
                })
                
                return results
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def mset(self, mapping: dict) -> bool:
        """Multi-set with tracing."""
        start_time = time.time()
        
        with self._tracer.start_cache_span("mset"):
            try:
                result = await self._client.mset(mapping)
                duration = (time.time() - start_time) * 1000
                
                self._stats["operations"] += len(mapping)
                
                self._tracer.set_attributes({
                    TraceAttributes.CACHE_DURATION_MS: duration,
                    "cache.mset.keys": len(mapping),
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def hget(self, name: str, key: str) -> Optional[Any]:
        """Hash get with tracing."""
        start_time = time.time()
        cache_key = f"{name}:{key}"
        
        with self._tracer.start_cache_span("hget", cache_key):
            try:
                result = await self._client.hget(name, key)
                duration = (time.time() - start_time) * 1000
                
                is_hit = result is not None
                if is_hit:
                    self._stats["hits"] += 1
                else:
                    self._stats["misses"] += 1
                
                self._tracer.set_attributes({
                    TraceAttributes.CACHE_HIT: is_hit,
                    TraceAttributes.CACHE_DURATION_MS: duration,
                    "cache.hash.name": name,
                    "cache.hash.key": key,
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def hset(self, name: str, key: str, value: Any) -> int:
        """Hash set with tracing."""
        with self._tracer.start_cache_span("hset", f"{name}:{key}"):
            self._tracer.set_attributes({
                "cache.hash.name": name,
                "cache.hash.key": key,
            })
            return await self._client.hset(name, key, value)
    
    async def hgetall(self, name: str) -> dict:
        """Hash get all with tracing."""
        with self._tracer.start_cache_span("hgetall", name):
            return await self._client.hgetall(name)
    
    async def lpush(self, key: str, *values: Any) -> int:
        """List push with tracing."""
        with self._tracer.start_cache_span("lpush", key):
            self._tracer.set_attributes({"cache.list.values": len(values)})
            return await self._client.lpush(key, *values)
    
    async def lrange(self, key: str, start: int, end: int) -> List[Any]:
        """List range with tracing."""
        with self._tracer.start_cache_span("lrange", key):
            self._tracer.set_attributes({
                "cache.list.start": start,
                "cache.list.end": end,
            })
            return await self._client.lrange(key, start, end)
    
    async def publish(self, channel: str, message: Any) -> int:
        """Publish with tracing."""
        with self._tracer.start_cache_span("publish", channel):
            self._tracer.set_attributes({
                "cache.pubsub.channel": channel,
                "cache.pubsub.message_size": len(str(message)),
            })
            return await self._client.publish(channel, message)
    
    def _calculate_hit_ratio(self) -> float:
        """Calculate cache hit ratio."""
        total = self._stats["hits"] + self._stats["misses"]
        if total == 0:
            return 0.0
        return self._stats["hits"] / total
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        return {
            **self._stats,
            "hit_ratio": self._calculate_hit_ratio(),
        }
    
    async def close(self):
        """Close connection."""
        with self._tracer.start_span("cache.close", {
            TraceAttributes.APP_COMPONENT: "cache",
        }):
            await self._client.close()
    
    # Pass-through to underlying client for unsupported operations
    def __getattr__(self, name: str) -> Any:
        """Pass through to underlying Redis client."""
        return getattr(self._client, name)


# Global traced client instance
_traced_client: Optional[TracedRedis] = None


async def get_traced_redis(redis_url: Optional[str] = None) -> TracedRedis:
    """Get or create traced Redis client."""
    global _traced_client
    
    if _traced_client is None:
        import os
        url = redis_url or os.environ.get("REDIS_URL", "redis://localhost:6379")
        
        client = Redis.from_url(
            url,
            encoding="utf-8",
            decode_responses=True,
        )
        
        _traced_client = TracedRedis(client)
        logger.info("Traced Redis client created")
    
    return _traced_client


async def close_traced_redis():
    """Close the traced Redis client."""
    global _traced_client
    
    if _traced_client:
        await _traced_client.close()
        _traced_client = None
        logger.info("Traced Redis client closed")


def cached(
    key_prefix: str,
    ttl: int = 300,
    key_builder: Optional[callable] = None,
):
    """
    Decorator for cached function results.
    
    Usage:
        @cached(key_prefix="player", ttl=60)
        async def get_player(player_id: str):
            return await db.fetchrow("SELECT * FROM players WHERE id = $1", player_id)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default key from args
                arg_str = ":".join(str(a) for a in args)
                kwarg_str = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = f"{key_prefix}:{arg_str}:{kwarg_str}"
            
            tracer = get_tracing_manager()
            client = await get_traced_redis()
            
            with tracer.start_span("cache.decorator", {
                TraceAttributes.APP_COMPONENT: "cache",
                "cache.key": cache_key,
                "cache.ttl": ttl,
            }):
                # Try to get from cache
                cached_value = await client.get(cache_key)
                
                if cached_value is not None:
                    tracer.add_event("cache.hit", {"cache.key": cache_key})
                    return cached_value
                
                tracer.add_event("cache.miss", {"cache.key": cache_key})
                
                # Execute function
                result = await func(*args, **kwargs)
                
                # Store in cache
                if result is not None:
                    await client.set(cache_key, result, ex=ttl)
                    tracer.add_event("cache.set", {"cache.key": cache_key})
                
                return result
        
        return wrapper
    return decorator
