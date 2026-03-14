"""SATOR Shared API Package."""
from .database import DatabasePool, init_pool, get_pool, close_pool
from .cache import CacheManager, init_cache, get_cache, cached
from .circuit_breaker import CircuitBreaker, circuit_breaker, CircuitBreakerOpen
from .features import FeatureManager, init_features, get_features, feature_flag
from .lifespan import lifespan

# Riot Games API
from .riot_client import (
    RiotApiClient,
    RiotApiConfig,
    RiotRateLimiter,
    HybridValorantDataSource,
)
from .riot_models import (
    RiotMatch,
    Matchlist,
    Content,
    Leaderboard,
    PlatformData,
    Account,
    ActiveShard,
    MatchPlayer,
    PlayerStats,
)

__all__ = [
    # Database
    "DatabasePool",
    "init_pool",
    "get_pool",
    "close_pool",
    # Cache
    "CacheManager",
    "init_cache",
    "get_cache",
    "cached",
    # Circuit Breaker
    "CircuitBreaker",
    "circuit_breaker",
    "CircuitBreakerOpen",
    # Features
    "FeatureManager",
    "init_features",
    "get_features",
    "feature_flag",
    # Lifespan
    "lifespan",
    # Riot API
    "RiotApiClient",
    "RiotApiConfig",
    "RiotRateLimiter",
    "HybridValorantDataSource",
    "RiotMatch",
    "Matchlist",
    "Content",
    "Leaderboard",
    "PlatformData",
    "Account",
    "ActiveShard",
    "MatchPlayer",
    "PlayerStats",
]