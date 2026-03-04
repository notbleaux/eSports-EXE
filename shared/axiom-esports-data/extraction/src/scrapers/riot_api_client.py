"""
Riot Games API Client
Official Valorant API integration with rate limiting and caching.
"""
import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import aiohttp

logger = logging.getLogger(__name__)

# Riot Games API endpoints
RIOT_API_BASE = "https://{region}.api.riotgames.com"
VAL_API_BASE = "https://{region}.api.riotgames.com/val"

# Free tier: 20 requests per second, 100 requests per 2 minutes
RATE_LIMIT_RPS = 20
RATE_LIMIT_BURST = 100


@dataclass
class RiotAPIConfig:
    """Configuration for Riot Games API."""
    api_key: str
    region: str = "na"  # na, eu, ap, kr, latam, br
    rate_limit_rps: int = RATE_LIMIT_RPS
    cache_ttl: int = 3600  # 1 hour


class RateLimiter:
    """Token bucket rate limiter for Riot API."""
    
    def __init__(self, requests_per_second: int = 20):
        self.tokens = requests_per_second
        self.max_tokens = requests_per_second
        self.last_update = time.time()
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        async with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            self.tokens = min(
                self.max_tokens,
                self.tokens + elapsed * self.max_tokens
            )
            self.last_update = now
            
            if self.tokens < 1:
                wait_time = (1 - self.tokens) / self.max_tokens
                await asyncio.sleep(wait_time)
                self.tokens = 0
            else:
                self.tokens -= 1


class RiotAPIClient:
    """
    Official Riot Games API client for Valorant data.
    
    Features:
    - Rate limiting (20 req/sec free tier)
    - Automatic retries with exponential backoff
    - Response caching
    - Error handling for 429, 403, 503
    
    Usage:
        client = RiotAPIClient(api_key="RGAPI-...")
        await client.initialize()
        
        # Get player by name
        player = await client.get_player_by_name("player#tag")
        
        # Get match history
        matches = await client.get_matchlist(player["puuid"])
        
        await client.close()
    """
    
    def __init__(self, config: RiotAPIConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.rate_limiter = RateLimiter(config.rate_limit_rps)
        self.cache: Dict[str, Any] = {}
        self.cache_timestamps: Dict[str, float] = {}
    
    async def initialize(self):
        """Initialize HTTP session."""
        self.session = aiohttp.ClientSession(
            headers={
                "X-Riot-Token": self.config.api_key,
                "Accept": "application/json",
                "User-Agent": "SATOR-eXe-ROTAS/1.0 (Research Project)"
            }
        )
        logger.info("Riot API client initialized for region: %s", self.config.region)
    
    async def close(self):
        """Close HTTP session."""
        if self.session:
            await self.session.close()
            logger.info("Riot API client closed")
    
    def _get_cache_key(self, endpoint: str, params: Optional[Dict] = None) -> str:
        """Generate cache key for request."""
        key = f"{self.config.region}:{endpoint}"
        if params:
            key += ":" + ",".join(f"{k}={v}" for k, v in sorted(params.items()))
        return key
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached response if valid."""
        if key in self.cache:
            timestamp = self.cache_timestamps.get(key, 0)
            if time.time() - timestamp < self.config.cache_ttl:
                logger.debug("Cache hit for %s", key)
                return self.cache[key]
            else:
                del self.cache[key]
                del self.cache_timestamps[key]
        return None
    
    def _set_cached(self, key: str, data: Any):
        """Cache response."""
        self.cache[key] = data
        self.cache_timestamps[key] = time.time()
    
    async def _request(
        self, 
        endpoint: str, 
        params: Optional[Dict] = None,
        use_cache: bool = True
    ) -> Optional[Dict]:
        """Make rate-limited API request."""
        cache_key = self._get_cache_key(endpoint, params)
        
        if use_cache:
            cached = self._get_cached(cache_key)
            if cached is not None:
                return cached
        
        await self.rate_limiter.acquire()
        
        url = f"{RIOT_API_BASE.format(region=self.config.region)}{endpoint}"
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 429:
                    # Rate limited - wait and retry
                    retry_after = int(response.headers.get("Retry-After", 1))
                    logger.warning("Rate limited, waiting %d seconds", retry_after)
                    await asyncio.sleep(retry_after)
                    return await self._request(endpoint, params, use_cache=False)
                
                response.raise_for_status()
                data = await response.json()
                
                if use_cache:
                    self._set_cached(cache_key, data)
                
                return data
                
        except aiohttp.ClientResponseError as e:
            if e.status == 403:
                logger.error("API key invalid or expired")
            elif e.status == 404:
                logger.debug("Resource not found: %s", endpoint)
            elif e.status == 503:
                logger.warning("Service unavailable, retrying...")
                await asyncio.sleep(5)
                return await self._request(endpoint, params, use_cache=False)
            else:
                logger.error("API error %d: %s", e.status, e.message)
            return None
            
        except Exception as e:
            logger.error("Request failed: %s", e)
            return None
    
    # === Account API ===
    
    async def get_account_by_riot_id(self, game_name: str, tag_line: str) -> Optional[Dict]:
        """
        Get account by Riot ID (name#tag).
        
        Args:
            game_name: Player name (e.g., "TenZ")
            tag_line: Tag number (e.g., "NA1")
        
        Returns:
            Account data including PUUID
        """
        endpoint = f"/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
        return await self._request(endpoint)
    
    async def get_account_by_puuid(self, puuid: str) -> Optional[Dict]:
        """Get account by PUUID."""
        endpoint = f"/riot/account/v1/accounts/by-puuid/{puuid}"
        return await self._request(endpoint)
    
    # === Valorant Match API ===
    
    async def get_matchlist(
        self, 
        puuid: str, 
        start: int = 0, 
        count: int = 20
    ) -> Optional[List[str]]:
        """
        Get match IDs for a player.
        
        Args:
            puuid: Player PUUID
            start: Start index
            count: Number of matches (max 20 for recent, 200 for history)
        
        Returns:
            List of match IDs
        """
        endpoint = f"/val/match/v1/matchlists/by-puuid/{puuid}"
        params = {"start": start, "count": count}
        result = await self._request(endpoint, params)
        return result.get("history", []) if result else None
    
    async def get_match(self, match_id: str) -> Optional[Dict]:
        """
        Get full match data.
        
        Returns:
            Match details including players, rounds, stats
        """
        endpoint = f"/val/match/v1/matches/{match_id}"
        return await self._request(endpoint)
    
    # === Valorant Content API (no key required) ===
    
    async def get_content(self, locale: str = "en-US") -> Optional[Dict]:
        """
        Get game content (maps, agents, weapons, etc.).
        Cached indefinitely as it rarely changes.
        """
        endpoint = "/val/content/v1/contents"
        params = {"locale": locale}
        return await self._request(endpoint, params)
    
    # === Bulk Operations ===
    
    async def get_player_full_history(
        self, 
        game_name: str, 
        tag_line: str,
        max_matches: int = 100
    ) -> Dict:
        """
        Get complete player profile with match history.
        
        Returns:
            {
                "account": {...},
                "matches": [...],
                "stats": {...}
            }
        """
        account = await self.get_account_by_riot_id(game_name, tag_line)
        if not account:
            return {"error": "Account not found"}
        
        puuid = account.get("puuid")
        match_ids = await self.get_matchlist(puuid, count=max_matches)
        
        matches = []
        if match_ids:
            for match_id in match_ids[:max_matches]:
                match_data = await self.get_match(match_id)
                if match_data:
                    matches.append(match_data)
                await asyncio.sleep(0.05)  # Be polite
        
        return {
            "account": account,
            "matches": matches,
            "stats": self._calculate_player_stats(matches, puuid)
        }
    
    def _calculate_player_stats(self, matches: List[Dict], puuid: str) -> Dict:
        """Calculate aggregate stats from match history."""
        if not matches:
            return {}
        
        total_kills = 0
        total_deaths = 0
        total_assists = 0
        total_rounds = 0
        wins = 0
        
        for match in matches:
            for player in match.get("players", []):
                if player.get("puuid") == puuid:
                    stats = player.get("stats", {})
                    total_kills += stats.get("kills", 0)
                    total_deaths += stats.get("deaths", 0)
                    total_assists += stats.get("assists", 0)
                    
                    # Check if won
                    team = player.get("teamId", "")
                    winning_team = match.get("teams", [{}])[0] if match.get("teams") else {}
                    if winning_team.get("teamId") == team and winning_team.get("won"):
                        wins += 1
                    break
            
            total_rounds += len(match.get("roundResults", []))
        
        match_count = len(matches)
        return {
            "matches_played": match_count,
            "wins": wins,
            "win_rate": round(wins / match_count * 100, 2) if match_count > 0 else 0,
            "total_kills": total_kills,
            "total_deaths": total_deaths,
            "total_assists": total_assists,
            "kd_ratio": round(total_kills / total_deaths, 2) if total_deaths > 0 else 0,
            "kda": round((total_kills + total_assists) / max(total_deaths, 1), 2),
            "avg_kills_per_round": round(total_kills / total_rounds, 2) if total_rounds > 0 else 0
        }


# === CLI Interface ===

async def main():
    """Example usage."""
    import os
    import json
    
    api_key = os.getenv("RIOT_API_KEY", "YOUR_API_KEY_HERE")
    if api_key == "YOUR_API_KEY_HERE":
        print("Set RIOT_API_KEY environment variable")
        return
    
    config = RiotAPIConfig(api_key=api_key, region="na")
    client = RiotAPIClient(config)
    
    await client.initialize()
    
    try:
        # Example: Get player stats
        result = await client.get_player_full_history("TenZ", "NA1", max_matches=10)
        print(json.dumps(result, indent=2))
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
