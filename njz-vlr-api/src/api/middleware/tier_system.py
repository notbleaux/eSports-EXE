"""
API Tier System
Free/Pro/Enterprise rate limits with API key validation
"""

import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Optional
from functools import wraps
import structlog

from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = structlog.get_logger(__name__)


class APITier(Enum):
    """API subscription tiers"""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class RateLimitConfig:
    """Rate limit configuration per tier"""
    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    concurrent_requests: int
    cache_ttl_multiplier: float  # Higher tiers get longer cache


# Tier configurations
TIER_LIMITS = {
    APITier.FREE: RateLimitConfig(
        requests_per_minute=30,
        requests_per_hour=500,
        requests_per_day=2000,
        concurrent_requests=2,
        cache_ttl_multiplier=1.0
    ),
    APITier.PRO: RateLimitConfig(
        requests_per_minute=120,
        requests_per_hour=3000,
        requests_per_day=15000,
        concurrent_requests=5,
        cache_ttl_multiplier=2.0
    ),
    APITier.ENTERPRISE: RateLimitConfig(
        requests_per_minute=600,
        requests_per_hour=15000,
        requests_per_day=100000,
        concurrent_requests=20,
        cache_ttl_multiplier=5.0
    )
}


class APIKeyManager:
    """
    Manages API keys and their tier assignments
    """
    
    def __init__(self):
        # In production, this would be in a database
        # Format: {api_key: {"tier": tier, "owner": owner, "created": datetime}}
        self._keys: Dict[str, dict] = {}
        self._usage: Dict[str, dict] = {}  # Track usage per key
    
    def register_key(self, api_key: str, tier: APITier, owner: str) -> bool:
        """Register a new API key"""
        if api_key in self._keys:
            return False
        
        self._keys[api_key] = {
            "tier": tier,
            "owner": owner,
            "created": datetime.utcnow(),
            "active": True
        }
        self._usage[api_key] = {
            "minute": [],
            "hour": [],
            "day": []
        }
        logger.info("apikey.registered", tier=tier.value, owner=owner)
        return True
    
    def get_tier(self, api_key: str) -> Optional[APITier]:
        """Get tier for an API key"""
        key_data = self._keys.get(api_key)
        if key_data and key_data["active"]:
            return key_data["tier"]
        return None
    
    def revoke_key(self, api_key: str) -> bool:
        """Revoke an API key"""
        if api_key in self._keys:
            self._keys[api_key]["active"] = False
            logger.info("apikey.revoked", api_key=api_key[:8] + "...")
            return True
        return False
    
    def check_rate_limit(self, api_key: str) -> tuple[bool, Optional[dict]]:
        """
        Check if request is within rate limit
        Returns (allowed, limit_info)
        """
        tier = self.get_tier(api_key)
        if not tier:
            return False, {"error": "Invalid API key"}
        
        limits = TIER_LIMITS[tier]
        usage = self._usage.get(api_key, {"minute": [], "hour": [], "day": []})
        
        now = datetime.utcnow()
        
        # Clean old entries
        usage["minute"] = [t for t in usage["minute"] if now - t < timedelta(minutes=1)]
        usage["hour"] = [t for t in usage["hour"] if now - t < timedelta(hours=1)]
        usage["day"] = [t for t in usage["day"] if now - t < timedelta(days=1)]
        
        # Check limits
        if len(usage["minute"]) >= limits.requests_per_minute:
            return False, {
                "error": "Rate limit exceeded (per minute)",
                "limit": limits.requests_per_minute,
                "reset": (usage["minute"][0] + timedelta(minutes=1)).isoformat()
            }
        
        if len(usage["hour"]) >= limits.requests_per_hour:
            return False, {
                "error": "Rate limit exceeded (per hour)",
                "limit": limits.requests_per_hour,
                "reset": (usage["hour"][0] + timedelta(hours=1)).isoformat()
            }
        
        if len(usage["day"]) >= limits.requests_per_day:
            return False, {
                "error": "Rate limit exceeded (per day)",
                "limit": limits.requests_per_day,
                "reset": (usage["day"][0] + timedelta(days=1)).isoformat()
            }
        
        # Record usage
        usage["minute"].append(now)
        usage["hour"].append(now)
        usage["day"].append(now)
        self._usage[api_key] = usage
        
        return True, {
            "tier": tier.value,
            "limit_minute": limits.requests_per_minute,
            "remaining_minute": limits.requests_per_minute - len(usage["minute"]),
            "limit_hour": limits.requests_per_hour,
            "remaining_hour": limits.requests_per_hour - len(usage["hour"]),
            "limit_day": limits.requests_per_day,
            "remaining_day": limits.requests_per_day - len(usage["day"])
        }


# Global instances
key_manager = APIKeyManager()
security = HTTPBearer(auto_error=False)


async def get_api_tier(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
) -> Optional[APITier]:
    """
    Dependency to extract and validate API key tier
    """
    # For demo, allow free tier without key
    if not credentials:
        return APITier.FREE
    
    api_key = credentials.credentials
    tier = key_manager.get_tier(api_key)
    
    if not tier:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return tier


async def check_rate_limit(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None
) -> dict:
    """
    Dependency to check rate limits
    Returns rate limit info for headers
    """
    api_key = credentials.credentials if credentials else "anonymous"
    
    allowed, info = key_manager.check_rate_limit(api_key)
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=info
        )
    
    return info


def tier_minimum(minimum_tier: APITier):
    """
    Decorator to require minimum tier for endpoint
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Check if tier is in kwargs (from get_api_tier dependency)
            tier = kwargs.get('tier', APITier.FREE)
            
            tier_levels = {
                APITier.FREE: 0,
                APITier.PRO: 1,
                APITier.ENTERPRISE: 2
            }
            
            if tier_levels.get(tier, 0) < tier_levels.get(minimum_tier, 0):
                raise HTTPException(
                    status_code=403,
                    detail=f"This endpoint requires {minimum_tier.value} tier or higher"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def get_cache_ttl_for_tier(base_ttl: int, tier: Optional[APITier]) -> int:
    """Calculate cache TTL based on tier"""
    tier = tier or APITier.FREE
    multiplier = TIER_LIMITS[tier].cache_ttl_multiplier
    return int(base_ttl * multiplier)