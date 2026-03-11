"""Redis caching implementation for API responses."""
import json
import redis
import hashlib
from typing import Any, Optional, Callable
from functools import wraps


class CacheManager:
    """Manages Redis caching with automatic serialization."""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url, decode_responses=False)
        self._hits = 0
        self._misses = 0

    def _serialize(self, value: Any) -> bytes:
        """Serialize value to bytes using JSON (safer than pickle)."""
        return json.dumps(value, default=str).encode('utf-8')

    def _deserialize(self, data: bytes) -> Any:
        """Deserialize bytes to value using JSON (safer than pickle)."""
        return json.loads(data.decode('utf-8'))

    def _make_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments."""
        key_data = f"{prefix}:{args}:{kwargs}"
        return f"cache:{hashlib.md5(key_data.encode()).hexdigest()}"

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        data = self.redis.get(key)
        if data:
            self._hits += 1
            return self._deserialize(data)
        self._misses += 1
        return None

    def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in cache with TTL (seconds)."""
        self.redis.setex(key, ttl, self._serialize(value))

    def delete(self, key: str):
        """Delete key from cache."""
        self.redis.delete(key)

    def invalidate_pattern(self, pattern: str):
        """Delete all keys matching pattern."""
        for key in self.redis.scan_iter(match=f"cache:{pattern}:*"):
            self.redis.delete(key)

    def get_metrics(self) -> dict:
        """Return cache metrics."""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(hit_rate, 2),
            "keys_in_cache": len(list(self.redis.scan_iter(match="cache:*")))
        }

    def clear(self):
        """Clear all cached data."""
        for key in self.redis.scan_iter(match="cache:*"):
            self.redis.delete(key)


# Global cache instance
_cache: Optional[CacheManager] = None


def init_cache(redis_url: str = "redis://localhost:6379"):
    """Initialize global cache."""
    global _cache
    _cache = CacheManager(redis_url)


def get_cache() -> CacheManager:
    """Get global cache instance."""
    if _cache is None:
        raise RuntimeError("Cache not initialized. Call init_cache() first.")
    return _cache


def cached(ttl: int = 3600, key_prefix: str = "", invalidate_on: list[str] = None):
    """Decorator to cache function results."""
    invalidate_on = invalidate_on or []
    
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = get_cache()
            
            # Generate cache key
            cache_key = cache._make_key(key_prefix or func.__name__, *args, **kwargs)
            
            # Try cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute and cache
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        
        # Attach invalidation helper
        wrapper.invalidate = lambda: get_cache().invalidate_pattern(key_prefix or func.__name__)
        wrapper.invalidate_all = lambda: get_cache().invalidate_pattern("")
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """Invalidate cache entries matching pattern."""
    get_cache().invalidate_pattern(pattern)