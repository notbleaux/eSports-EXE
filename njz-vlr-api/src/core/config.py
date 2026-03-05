"""
NJZ VLR API Configuration
Production-grade configuration management with environment validation
"""

from functools import lru_cache
from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings
import os


class VLRConfig(BaseSettings):
    """
    VLR.gg API scraping configuration
    Tuned for respectful scraping with intelligent rate limiting
    """
    
    # API Settings
    API_TITLE: str = "NJZ VLR API"
    API_VERSION: str = "2.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 3001
    WORKERS: int = Field(default=4, env="WORKERS")
    
    # VLR.gg Rate Limiting (Respectful defaults)
    VLR_REQUEST_DELAY: float = Field(default=1.5, env="VLR_REQUEST_DELAY")
    VLR_MAX_RETRIES: int = Field(default=3, env="VLR_MAX_RETRIES")
    VLR_RETRY_BACKOFF: float = Field(default=2.0, env="VLR_RETRY_BACKOFF")
    VLR_CONCURRENT_REQUESTS: int = Field(default=2, env="VLR_CONCURRENT_REQUESTS")
    VLR_CIRCUIT_BREAKER_THRESHOLD: int = Field(default=5, env="VLR_CIRCUIT_BREAKER_THRESHOLD")
    VLR_CIRCUIT_BREAKER_TIMEOUT: int = Field(default=60, env="VLR_CIRCUIT_BREAKER_TIMEOUT")
    
    # Cache Configuration (Multi-tier)
    CACHE_L1_TTL: int = Field(default=300, env="CACHE_L1_TTL")      # 5 minutes (memory)
    CACHE_L2_TTL: int = Field(default=1800, env="CACHE_L2_TTL")     # 30 minutes (Redis)
    CACHE_L3_TTL: int = Field(default=3600, env="CACHE_L3_TTL")     # 1 hour (disk)
    
    # Redis Settings (for L2 cache)
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_ENABLED: bool = Field(default=False, env="REDIS_ENABLED")
    
    # Data Storage (RAWS/BASE)
    DATA_STORAGE_PATH: str = Field(default="./data", env="DATA_STORAGE_PATH")
    RAWS_ENABLED: bool = Field(default=True, env="RAWS_ENABLED")
    BASE_ENABLED: bool = Field(default=True, env="BASE_ENABLED")
    INTEGRITY_CHECK_INTERVAL: int = Field(default=3600, env="INTEGRITY_CHECK_INTERVAL")
    
    # Database (PostgreSQL for BASE)
    DATABASE_URL: str = Field(default="sqlite:///./data/njz_vlr.db", env="DATABASE_URL")
    
    # Monitoring
    PROMETHEUS_ENABLED: bool = Field(default=True, env="PROMETHEUS_ENABLED")
    METRICS_PORT: int = Field(default=9090, env="METRICS_PORT")
    HEALTH_CHECK_INTERVAL: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")
    
    # API Security
    API_KEY_REQUIRED: bool = Field(default=False, env="API_KEY_REQUIRED")
    ALLOWED_API_KEYS: List[str] = Field(default=[], env="ALLOWED_API_KEYS")
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=3600, env="RATE_LIMIT_WINDOW")
    
    # Webhook Settings
    WEBHOOK_SECRET: str = Field(default="", env="WEBHOOK_SECRET")
    WEBHOOK_RETRY_ATTEMPTS: int = Field(default=3, env="WEBHOOK_RETRY_ATTEMPTS")
    
    @validator('ALLOWED_API_KEYS', pre=True, always=True)
    def parse_api_keys(cls, v):
        """Parse comma-separated API keys"""
        if isinstance(v, str):
            return [key.strip() for key in v.split(',') if key.strip()]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


class CacheTTLS:
    """
    Cache TTL configuration per endpoint
    Optimized for data freshness vs. load reduction
    """
    
    LIVE_SCORE: int = 30           # 30 seconds - live data
    UPCOMING_MATCHES: int = 300    # 5 minutes
    MATCH_DETAILS: int = 300       # 5 minutes
    MATCH_RESULTS: int = 3600      # 1 hour
    RANKINGS: int = 3600           # 1 hour
    STATS: int = 1800              # 30 minutes
    PLAYER_PROFILE: int = 1800     # 30 minutes
    TEAM_PROFILE: int = 1800       # 30 minutes
    EVENTS: int = 1800             # 30 minutes
    EVENT_MATCHES: int = 600       # 10 minutes
    NEWS: int = 600                # 10 minutes
    HEALTH: int = 10               # 10 seconds


class RegionCodes:
    """Valid VLR.gg region codes"""
    
    VALID_REGIONS = [
        "na",      # North America
        "eu",      # Europe
        "ap",      # Asia Pacific
        "la",      # Latin America
        "la-s",    # Latin America South
        "la-n",    # Latin America North
        "oce",     # Oceania
        "kr",      # Korea
        "mn",      # MENA
        "gc",      # Game Changers
        "br",      # Brazil
        "cn",      # China
        "jp",      # Japan
        "col",     # Collegiate
    ]
    
    @classmethod
    def validate(cls, region: str) -> bool:
        return region.lower() in cls.VALID_REGIONS


@lru_cache()
def get_settings() -> VLRConfig:
    """Cached configuration instance"""
    return VLRConfig()


# Global settings instance
settings = get_settings()