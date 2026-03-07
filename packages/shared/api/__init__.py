"""SATOR Shared API Package."""
from .database import DatabasePool, init_pool, get_pool, close_pool
from .cache import CacheManager, init_cache, get_cache, cached
from .circuit_breaker import CircuitBreaker, circuit_breaker, CircuitBreakerOpen
from .features import FeatureManager, init_features, get_features, feature_flag
from .lifespan import lifespan

__all__ = [
    "DatabasePool",
    "init_pool",
    "get_pool",
    "close_pool",
    "CacheManager",
    "init_cache",
    "get_cache",
    "cached",
    "CircuitBreaker",
    "circuit_breaker",
    "CircuitBreakerOpen",
    "FeatureManager",
    "init_features",
    "get_features",
    "feature_flag",
    "lifespan",
]