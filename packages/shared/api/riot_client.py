"""
Riot Games API Client for Valorant
Official API integration with rate limiting, caching, and circuit breaker
Documentation: https://developer.riotgames.com/docs/valorant
"""
import os
import asyncio
import aiohttp
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging

from .circuit_breaker import circuit_breaker, fallback_cached_data
from .cache import cached
from .riot_models import (
    RiotMatch, Matchlist, Content, Leaderboard, 
    PlatformData, Account, ActiveShard, RateLimitInfo
)

logger = logging.getLogger(__name__)


# =============================================================================
# Configuration
# =============================================================================

@dataclass
class RiotApiConfig:
    """Riot API configuration"""
    api_key: str
    region: str = "na"  # na, latam, br, eu, ap, kr
    shard: str = "na"   # na, latam, br, eu, ap, kr
    
    # Rate limits (Personal API Key)
    # Production keys have higher limits: 500/10s, 30000/10min
    requests_per_second: int = 20
    requests_per_2_minutes: int = 100
    
    # Request timeout
    timeout: int = 30
    
    # Retry configuration
    max_retries: int = 3
    retry_delay: float = 1.0
    
    @property
    def base_url(self) -> str:
        """Get base URL for Valorant API"""
        return f"https://{self.shard}.api.riotgames.com"
    
    @property
    def americas_url(self) -> str:
        """Get Americas region URL (for account endpoints)"""
        return "https://americas.api.riotgames.com"
    
    @property
    def asia_url(self) -> str:
        """Get Asia region URL (for account endpoints)"""
        return "https://asia.api.riotgames.com"
    
    @property
    def europe_url(self) -> str:
        """Get Europe region URL (for account endpoints)"""
        return "https://europe.api.riotgames.com"


# =============================================================================
# Rate Limiter
# =============================================================================

class RiotRateLimiter:
    """
    Token bucket rate limiter for Riot API
    Enforces both per-second and per-2-minutes limits
    """
    
    def __init__(self, per_second: int = 20, per_2_minutes: int = 100):
        self.per_second = per_second
        self.per_2_minutes = per_2_minutes
        
        # Token buckets
        self.second_bucket = per_second
        self.minute_bucket = per_2_minutes
        
        # Last refill times
        self.last_second_refill = datetime.now()
        self.last_minute_refill = datetime.now()
        
        # Lock for thread safety
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        """Acquire permission to make a request"""
        async with self._lock:
            now = datetime.now()
            
            # Refill second bucket
            second_elapsed = (now - self.last_second_refill).total_seconds()
            if second_elapsed >= 1:
                self.second_bucket = self.per_second
                self.last_second_refill = now
            
            # Refill 2-minute bucket
            minute_elapsed = (now - self.last_minute_refill).total_seconds()
            if minute_elapsed >= 120:
                self.minute_bucket = self.per_2_minutes
                self.last_minute_refill = now
            
            # Check if we can make a request
            if self.second_bucket > 0 and self.minute_bucket > 0:
                self.second_bucket -= 1
                self.minute_bucket -= 1
                return True
            
            # Calculate wait time
            wait_time = 0.0
            if self.second_bucket <= 0:
                wait_time = max(wait_time, 1 - second_elapsed)
            if self.minute_bucket <= 0:
                wait_time = max(wait_time, 120 - minute_elapsed)
            
            return wait_time
    
    async def wait(self):
        """Wait until a request can be made"""
        while True:
            result = await self.acquire()
            if result is True:
                return
            logger.debug(f"Rate limit hit, waiting {result:.2f}s")
            await asyncio.sleep(result)


# =============================================================================
# API Client
# =============================================================================

class RiotApiClient:
    """
    Riot Games API Client for Valorant
    
    Features:
    - Automatic rate limiting (respects Riot's limits)
    - Response caching
    - Circuit breaker for fault tolerance
    - Automatic retries with exponential backoff
    - Type-safe responses using Pydantic models
    """
    
    def __init__(self, config: Optional[RiotApiConfig] = None):
        self.config = config or RiotApiConfig(
            api_key=os.getenv("RIOT_API_KEY", "")
        )
        
        if not self.config.api_key:
            raise ValueError(
                "RIOT_API_KEY is required. "
                "Get one at: https://developer.riotgames.com/"
            )
        
        self.session: Optional[aiohttp.ClientSession] = None
        self.rate_limiter = RiotRateLimiter(
            per_second=self.config.requests_per_second,
            per_2_minutes=self.config.requests_per_2_minutes
        )
        
        # Track rate limit headers
        self.current_rate_limit: Optional[RateLimitInfo] = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            headers={
                "X-Riot-Token": self.config.api_key,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _get_account_url(self, puuid: Optional[str] = None) -> str:
        """Get appropriate regional URL for account endpoints"""
        # Determine region based on shard
        if self.config.shard in ["na", "latam", "br"]:
            return self.config.americas_url
        elif self.config.shard in ["kr"]:
            return self.config.asia_url
        else:  # eu, ap
            return self.config.europe_url
    
    def _update_rate_limit(self, headers: Dict[str, str]):
        """Update rate limit info from response headers"""
        try:
            self.current_rate_limit = RateLimitInfo(
                limit=int(headers.get("X-Rate-Limit-Limit", "0").split(":")[0]),
                count=int(headers.get("X-Rate-Limit-Count", "0").split(":")[0]),
                retry_after=int(headers.get("Retry-After", "0")) if "Retry-After" in headers else None
            )
        except (ValueError, IndexError):
            pass
    
    async def _make_request(
        self, 
        method: str, 
        url: str, 
        params: Optional[Dict] = None,
        retry_count: int = 0
    ) -> Dict[str, Any]:
        """
        Make a rate-limited request to the API
        
        Args:
            method: HTTP method
            url: Full URL
            params: Query parameters
            retry_count: Current retry attempt
            
        Returns:
            JSON response as dict
            
        Raises:
            aiohttp.ClientError: On HTTP errors
            asyncio.TimeoutError: On timeout
        """
        # Wait for rate limit
        await self.rate_limiter.wait()
        
        try:
            async with self.session.request(method, url, params=params) as response:
                # Update rate limit tracking
                self._update_rate_limit(dict(response.headers))
                
                # Handle rate limit exceeded
                if response.status == 429:
                    retry_after = int(response.headers.get("Retry-After", "1"))
                    logger.warning(f"Rate limit exceeded, retrying after {retry_after}s")
                    
                    if retry_count < self.config.max_retries:
                        await asyncio.sleep(retry_after)
                        return await self._make_request(method, url, params, retry_count + 1)
                    else:
                        raise aiohttp.ClientError(f"Rate limit exceeded after {retry_count} retries")
                
                # Handle other errors
                response.raise_for_status()
                
                # Return JSON response
                return await response.json()
                
        except aiohttp.ClientError as e:
            if retry_count < self.config.max_retries:
                wait_time = self.config.retry_delay * (2 ** retry_count)  # Exponential backoff
                logger.warning(f"Request failed, retrying in {wait_time}s: {e}")
                await asyncio.sleep(wait_time)
                return await self._make_request(method, url, params, retry_count + 1)
            raise
    
    # =====================================================================
    # VAL-CONTENT-V1 Endpoints
    # =====================================================================
    
    @circuit_breaker(name="riot_content", failure_threshold=5, fallback=fallback_cached_data)
    @cached(ttl=86400, key_prefix="riot_content")  # Cache for 24 hours
    async def get_content(self, locale: str = "en-US") -> Content:
        """
        Get Valorant game content (maps, agents, etc.)
        
        Args:
            locale: Locale for localized names (e.g., "en-US", "ko-KR")
            
        Returns:
            Content model with all game content
        """
        url = f"{self.config.base_url}/val/content/v1/contents"
        params = {"locale": locale}
        
        data = await self._make_request("GET", url, params)
        return Content(**data)
    
    # =====================================================================
    # VAL-MATCH-V1 Endpoints
    # =====================================================================
    
    @circuit_breaker(name="riot_match", failure_threshold=5, fallback=fallback_cached_data)
    @cached(ttl=3600, key_prefix="riot_match")  # Cache for 1 hour
    async def get_match(self, match_id: str) -> Optional[RiotMatch]:
        """
        Get match by ID
        
        Args:
            match_id: Match UUID
            
        Returns:
            RiotMatch model or None if not found
        """
        url = f"{self.config.base_url}/val/match/v1/matches/{match_id}"
        
        try:
            data = await self._make_request("GET", url)
            return RiotMatch(**data)
        except aiohttp.ClientResponseError as e:
            if e.status == 404:
                logger.warning(f"Match not found: {match_id}")
                return None
            raise
    
    @circuit_breaker(name="riot_matchlist", failure_threshold=5, fallback=fallback_cached_data)
    @cached(ttl=300, key_prefix="riot_matchlist")  # Cache for 5 minutes
    async def get_matchlist(
        self, 
        puuid: str, 
        queue: Optional[str] = None,
        start_index: int = 0,
        end_index: int = 20
    ) -> Matchlist:
        """
        Get matchlist for player
        
        Args:
            puuid: Player UUID
            queue: Queue type filter (e.g., "competitive", "unrated")
            start_index: Start index for pagination
            end_index: End index for pagination
            
        Returns:
            Matchlist model
        """
        url = f"{self.config.base_url}/val/match/v1/matchlists/by-puuid/{puuid}"
        params = {}
        if queue:
            params["queue"] = queue
        if start_index > 0:
            params["startIndex"] = start_index
        if end_index != 20:
            params["endIndex"] = end_index
        
        data = await self._make_request("GET", url, params)
        return Matchlist(**data)
    
    @circuit_breaker(name="riot_recent_matches", failure_threshold=5, fallback=fallback_cached_data)
    @cached(ttl=60, key_prefix="riot_recent")  # Cache for 1 minute
    async def get_recent_matches(self, queue: str) -> List[Dict[str, Any]]:
        """
        Get recent matches for a queue
        
        Args:
            queue: Queue type (e.g., "competitive", "deathmatch")
            
        Returns:
            List of recent match entries
        """
        url = f"{self.config.base_url}/val/match/v1/recent-matches/by-queue/{queue}"
        
        data = await self._make_request("GET", url)
        return data.get("matches", [])
    
    # =====================================================================
    # VAL-RANKED-V1 Endpoints
    # =====================================================================
    
    @circuit_breaker(name="riot_leaderboard", failure_threshold=5, fallback=fallback_cached_data)
    @cached(ttl=3600, key_prefix="riot_leaderboard")  # Cache for 1 hour
    async def get_leaderboard(
        self, 
        act_id: str,
        size: int = 200,
        start_index: int = 0
    ) -> Optional[Leaderboard]:
        """
        Get ranked leaderboard for an act
        
        Args:
            act_id: Act UUID
            size: Number of entries to return (max 1000)
            start_index: Start index for pagination
            
        Returns:
            Leaderboard model or None if not found
        """
        url = f"{self.config.base_url}/val/ranked/v1/leaderboards/by-act/{act_id}"
        params = {
            "size": min(size, 1000),
            "startIndex": start_index
        }
        
        try:
            data = await self._make_request("GET", url, params)
            return Leaderboard(**data)
        except aiohttp.ClientResponseError as e:
            if e.status == 404:
                logger.warning(f"Leaderboard not found for act: {act_id}")
                return None
            raise
    
    # =====================================================================
    # VAL-STATUS-V1 Endpoints
    # =====================================================================
    
    @circuit_breaker(name="riot_status", failure_threshold=5, fallback=fallback_cached_data)
    @cached(ttl=300, key_prefix="riot_status")  # Cache for 5 minutes
    async def get_platform_data(self) -> PlatformData:
        """
        Get platform status data
        
        Returns:
            PlatformData model with status info
        """
        url = f"{self.config.base_url}/val/status/v1/platformData"
        
        data = await self._make_request("GET", url)
        return PlatformData(**data)
    
    # =====================================================================
    # Account/RSO Endpoints (Production keys only)
    # =====================================================================
    
    @circuit_breaker(name="riot_account", failure_threshold=5, fallback=fallback_cached_data)
    async def get_account_by_riot_id(
        self, 
        game_name: str, 
        tag_line: str
    ) -> Optional[Account]:
        """
        Get account by Riot ID (requires Production API key)
        
        Args:
            game_name: Player's game name
            tag_line: Player's tag line (e.g., "NA1")
            
        Returns:
            Account model or None if not found
        """
        url = f"{self._get_account_url()}/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
        
        try:
            data = await self._make_request("GET", url)
            return Account(**data)
        except aiohttp.ClientResponseError as e:
            if e.status == 404:
                return None
            raise
    
    @circuit_breaker(name="riot_account", failure_threshold=5, fallback=fallback_cached_data)
    async def get_account_by_puuid(self, puuid: str) -> Optional[Account]:
        """
        Get account by PUUID (requires Production API key)
        
        Args:
            puuid: Player UUID
            
        Returns:
            Account model or None if not found
        """
        url = f"{self._get_account_url()}/riot/account/v1/accounts/by-puuid/{puuid}"
        
        try:
            data = await self._make_request("GET", url)
            return Account(**data)
        except aiohttp.ClientResponseError as e:
            if e.status == 404:
                return None
            raise
    
    @circuit_breaker(name="riot_active_shard", failure_threshold=5, fallback=fallback_cached_data)
    async def get_active_shard(self, puuid: str, game: str = "val") -> Optional[ActiveShard]:
        """
        Get active shard for a player (requires Production API key)
        
        Args:
            puuid: Player UUID
            game: Game code (default: "val")
            
        Returns:
            ActiveShard model or None if not found
        """
        url = f"{self._get_account_url()}/riot/account/v1/active-shards/by-game/{game}/by-puuid/{puuid}"
        
        try:
            data = await self._make_request("GET", url)
            return ActiveShard(**data)
        except aiohttp.ClientResponseError as e:
            if e.status == 404:
                return None
            raise
    
    # =====================================================================
    # Utility Methods
    # =====================================================================
    
    def get_rate_limit_status(self) -> Optional[Dict[str, Any]]:
        """Get current rate limit status"""
        if self.current_rate_limit:
            return {
                "limit": self.current_rate_limit.limit,
                "count": self.current_rate_limit.count,
                "remaining": self.current_rate_limit.remaining,
                "is_exceeded": self.current_rate_limit.is_exceeded
            }
        return None
    
    async def health_check(self) -> Dict[str, Any]:
        """Check API health by fetching platform status"""
        try:
            status = await self.get_platform_data()
            return {
                "healthy": True,
                "region": self.config.region,
                "shard": self.config.shard,
                "platform": status.name,
                "incidents": len(status.incidents),
                "maintenances": len(status.maintenances)
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e)
            }


# =============================================================================
# Hybrid Data Strategy
# =============================================================================

class HybridValorantDataSource:
    """
    Hybrid data source combining multiple APIs:
    - Riot API (official, requires key)
    - Pandascore (esports-focused)
    - VLR (community data, cached)
    
    Prioritizes official sources, falls back gracefully
    """
    
    def __init__(self):
        self.riot_client: Optional[RiotApiClient] = None
        self.riot_available = bool(os.getenv("RIOT_API_KEY"))
        
    async def __aenter__(self):
        if self.riot_available:
            self.riot_client = RiotApiClient()
            await self.riot_client.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.riot_client:
            await self.riot_client.__aexit__(exc_type, exc_val, exc_tb)
    
    async def get_match(self, match_id: str) -> Optional[RiotMatch]:
        """Get match from best available source"""
        if self.riot_available and self.riot_client:
            try:
                return await self.riot_client.get_match(match_id)
            except Exception as e:
                logger.warning(f"Riot API failed: {e}, trying fallback...")
        
        # Fallback to cached data
        return await fallback_cached_data("match", match_id)
    
    async def get_leaderboard(self, act_id: str) -> Optional[Leaderboard]:
        """Get leaderboard from best available source"""
        if self.riot_available and self.riot_client:
            try:
                return await self.riot_client.get_leaderboard(act_id)
            except Exception as e:
                logger.warning(f"Riot API failed: {e}")
        
        return None
    
    @property
    def is_official_source(self) -> bool:
        """Check if using official Riot API"""
        return self.riot_available


# =============================================================================
# Usage Example
# =============================================================================

async def main():
    """Example usage of Riot API client"""
    
    # Check if API key is configured
    if not os.getenv("RIOT_API_KEY"):
        print("RIOT_API_KEY not set. Set it to run this example.")
        print("Get your key at: https://developer.riotgames.com/")
        return
    
    async with RiotApiClient() as client:
        # Health check
        health = await client.health_check()
        print(f"API Health: {health}")
        
        # Get platform status
        try:
            status = await client.get_platform_data()
            print(f"Platform: {status.name}")
            print(f"Incidents: {len(status.incidents)}")
        except Exception as e:
            print(f"Failed to get status: {e}")
        
        # Get content
        try:
            content = await client.get_content()
            print(f"Agents: {len(content.characters)}")
            print(f"Maps: {len(content.maps)}")
        except Exception as e:
            print(f"Failed to get content: {e}")


if __name__ == "__main__":
    asyncio.run(main())
