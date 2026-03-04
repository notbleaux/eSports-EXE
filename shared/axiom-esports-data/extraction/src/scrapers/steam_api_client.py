"""
Steam Web API Client
Counter-Strike 2 player and match data integration.
"""
import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import aiohttp

logger = logging.getLogger(__name__)

STEAM_API_BASE = "https://api.steampowered.com"

# Free tier: 100,000 requests per day (no API key needed for basic endpoints)
# With key: higher limits and more endpoints
RATE_LIMIT_RPS = 100  # Conservative


@dataclass
class SteamAPIConfig:
    """Configuration for Steam Web API."""
    api_key: Optional[str] = None  # Optional for basic endpoints
    rate_limit_rps: int = RATE_LIMIT_RPS
    cache_ttl: int = 1800  # 30 minutes


class RateLimiter:
    """Token bucket rate limiter."""
    
    def __init__(self, requests_per_second: int = 100):
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


class SteamAPIClient:
    """
    Steam Web API client for CS2 data.
    
    Features:
    - No API key required for basic endpoints (player counts, app info)
    - Optional key for extended player data
    - Rate limiting and caching
    - Automatic retry on 503
    
    Free Endpoints (no key):
    - GetGlobalAchievementPercentagesForApp
    - GetNewsForApp
    - GetGlobalStatsForGame
    
    Key Required:
    - GetPlayerSummaries
    - GetOwnedGames
    - GetUserStatsForGame
    
    Usage:
        client = SteamAPIClient()  # No key for basic
        await client.initialize()
        
        # Get current CS2 player count
        count = await client.get_cs2_player_count()
        
        # Get player stats (requires key)
        stats = await client.get_cs2_stats(steam_id)
        
        await client.close()
    """
    
    def __init__(self, config: Optional[SteamAPIConfig] = None):
        self.config = config or SteamAPIConfig()
        self.session: Optional[aiohttp.ClientSession] = None
        self.rate_limiter = RateLimiter(self.config.rate_limit_rps)
        self.cache: Dict[str, Any] = {}
        self.cache_timestamps: Dict[str, float] = {}
    
    async def initialize(self):
        """Initialize HTTP session."""
        headers = {
            "Accept": "application/json",
            "User-Agent": "SATOR-eXe-ROTAS/1.0 (Research Project)"
        }
        self.session = aiohttp.ClientSession(headers=headers)
        logger.info("Steam API client initialized (key: %s)", 
                   "yes" if self.config.api_key else "no")
    
    async def close(self):
        """Close HTTP session."""
        if self.session:
            await self.session.close()
            logger.info("Steam API client closed")
    
    def _get_cache_key(self, endpoint: str, params: Optional[Dict] = None) -> str:
        """Generate cache key."""
        key = endpoint
        if params:
            key += ":" + ",".join(f"{k}={v}" for k, v in sorted(params.items()))
        return key
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached response."""
        if key in self.cache:
            timestamp = self.cache_timestamps.get(key, 0)
            if time.time() - timestamp < self.config.cache_ttl:
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
        interface: str,
        method: str,
        version: str = "v0001",
        params: Optional[Dict] = None,
        use_cache: bool = True
    ) -> Optional[Dict]:
        """Make API request."""
        endpoint = f"/{interface}/{method}/{version}/"
        cache_key = self._get_cache_key(endpoint, params)
        
        if use_cache:
            cached = self._get_cached(cache_key)
            if cached is not None:
                return cached
        
        await self.rate_limiter.acquire()
        
        url = f"{STEAM_API_BASE}{endpoint}"
        
        # Add API key if available
        request_params = params.copy() if params else {}
        if self.config.api_key:
            request_params["key"] = self.config.api_key
        
        try:
            async with self.session.get(url, params=request_params) as response:
                if response.status == 503:
                    logger.warning("Service unavailable, retrying...")
                    await asyncio.sleep(2)
                    return await self._request(
                        interface, method, version, params, use_cache=False
                    )
                
                response.raise_for_status()
                data = await response.json()
                
                if use_cache:
                    self._set_cached(cache_key, data)
                
                return data
                
        except aiohttp.ClientResponseError as e:
            if e.status == 403:
                logger.error("API key invalid or missing for this endpoint")
            elif e.status == 429:
                logger.warning("Rate limited, backing off...")
                await asyncio.sleep(10)
                return await self._request(
                    interface, method, version, params, use_cache=False
                )
            else:
                logger.error("API error %d: %s", e.status, e.message)
            return None
            
        except Exception as e:
            logger.error("Request failed: %s", e)
            return None
    
    # === Free Endpoints (no API key) ===
    
    async def get_cs2_player_count(self) -> Optional[int]:
        """
        Get current CS2 player count.
        
        Returns:
            Number of current players
        """
        result = await self._request(
            "ISteamUserStats",
            "GetNumberOfCurrentPlayers",
            params={"appid": 730}  # CS2 app ID
        )
        if result:
            return result.get("response", {}).get("player_count")
        return None
    
    async def get_app_info(self, app_id: int = 730) -> Optional[Dict]:
        """
        Get app information from Steam Store.
        
        Returns:
            App details (name, description, genres, etc.)
        """
        # Steam Store API (different from Web API)
        cache_key = f"app_info:{app_id}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        await self.rate_limiter.acquire()
        
        url = f"https://store.steampowered.com/api/appdetails"
        params = {"appids": app_id}
        
        try:
            async with self.session.get(url, params=params) as response:
                response.raise_for_status()
                data = await response.json()
                
                app_data = data.get(str(app_id), {})
                if app_data.get("success"):
                    result = app_data.get("data", {})
                    self._set_cached(cache_key, result)
                    return result
                return None
                
        except Exception as e:
            logger.error("Failed to get app info: %s", e)
            return None
    
    async def get_global_achievements(self, app_id: int = 730) -> Optional[List[Dict]]:
        """
        Get global achievement percentages.
        
        Returns:
            List of achievements with unlock percentages
        """
        result = await self._request(
            "ISteamUserStats",
            "GetGlobalAchievementPercentagesForApp",
            params={"gameid": app_id}
        )
        if result:
            return result.get("achievementpercentages", {}).get("achievements", [])
        return None
    
    async def get_game_news(self, app_id: int = 730, count: int = 5) -> Optional[List[Dict]]:
        """
        Get news for CS2.
        
        Returns:
            List of news items
        """
        result = await self._request(
            "ISteamNews",
            "GetNewsForApp",
            params={"appid": app_id, "count": count, "maxlength": 300}
        )
        if result:
            return result.get("appnews", {}).get("newsitems", [])
        return None
    
    # === Key Required Endpoints ===
    
    async def get_player_summaries(self, steam_ids: List[str]) -> Optional[List[Dict]]:
        """
        Get player profile summaries.
        
        Args:
            steam_ids: List of Steam IDs (up to 100)
        
        Returns:
            Player profiles (name, avatar, online status, etc.)
        """
        if not self.config.api_key:
            logger.error("API key required for player summaries")
            return None
        
        ids_str = ",".join(steam_ids[:100])  # Max 100
        result = await self._request(
            "ISteamUser",
            "GetPlayerSummaries",
            version="v0002",
            params={"steamids": ids_str}
        )
        if result:
            return result.get("response", {}).get("players", [])
        return None
    
    async def get_owned_games(self, steam_id: str) -> Optional[List[Dict]]:
        """
        Get games owned by player.
        
        Returns:
            List of owned games with playtime
        """
        if not self.config.api_key:
            logger.error("API key required for owned games")
            return None
        
        result = await self._request(
            "IPlayerService",
            "GetOwnedGames",
            params={
                "steamid": steam_id,
                "include_appinfo": 1,
                "include_played_free_games": 1
            }
        )
        if result:
            return result.get("response", {}).get("games", [])
        return None
    
    async def get_cs2_stats(self, steam_id: str) -> Optional[Dict]:
        """
        Get CS2 player statistics.
        
        Returns:
            Player stats (kills, deaths, wins, etc.)
        """
        if not self.config.api_key:
            logger.error("API key required for game stats")
            return None
        
        result = await self._request(
            "ISteamUserStats",
            "GetUserStatsForGame",
            params={"steamid": steam_id, "appid": 730}
        )
        if result:
            stats = result.get("playerstats", {})
            return {
                "steam_id": steam_id,
                "game": stats.get("gameName"),
                "stats": {s["name"]: s["value"] for s in stats.get("stats", [])},
                "achievements": stats.get("achievements", [])
            }
        return None
    
    # === CS2 Specific Helpers ===
    
    async def get_cs2_server_info(self) -> Optional[Dict]:
        """Get CS2 server status."""
        result = await self._request(
            "ICSGOServers_730",
            "GetGameServersStatus",
            params={"format": "json"}
        )
        if result:
            return result.get("result", {})
        return None
    
    async def get_cs2_full_profile(self, steam_id: str) -> Dict:
        """
        Get comprehensive CS2 player profile.
        
        Returns:
            Combined player data
        """
        profile = {"steam_id": steam_id}
        
        # Player summary
        summaries = await self.get_player_summaries([steam_id])
        if summaries:
            profile["player"] = summaries[0]
        
        # CS2 stats
        stats = await self.get_cs2_stats(steam_id)
        if stats:
            profile["cs2_stats"] = stats
        
        # Owned games (to check CS2 ownership)
        games = await self.get_owned_games(steam_id)
        if games:
            cs2_game = next((g for g in games if g.get("appid") == 730), None)
            if cs2_game:
                profile["cs2_ownership"] = {
                    "owned": True,
                    "playtime_hours": round(cs2_game.get("playtime_forever", 0) / 60, 2),
                    "playtime_2weeks_hours": round(cs2_game.get("playtime_2weeks", 0) / 60, 2)
                }
        
        return profile


# === Utility Functions ===

def steam_id_to_community_id(steam_id: str) -> Optional[str]:
    """
    Convert Steam ID to Community ID for profile URLs.
    
    Args:
        steam_id: Steam ID (e.g., "76561197960434622")
    
    Returns:
        Community ID or None if invalid
    """
    try:
        steam_id = int(steam_id)
        if steam_id < 76561197960265728:
            return None
        return str(steam_id - 76561197960265728)
    except ValueError:
        return None


def community_id_to_steam_id(community_id: str) -> Optional[str]:
    """Convert Community ID to Steam ID."""
    try:
        return str(int(community_id) + 76561197960265728)
    except ValueError:
        return None


# === CLI Interface ===

async def main():
    """Example usage."""
    import os
    import json
    
    api_key = os.getenv("STEAM_API_KEY")  # Optional
    
    config = SteamAPIConfig(api_key=api_key)
    client = SteamAPIClient(config)
    
    await client.initialize()
    
    try:
        # Free endpoints (no key needed)
        print("=== CS2 Current Players ===")
        count = await client.get_cs2_player_count()
        print(f"Current CS2 players: {count:,}")
        
        print("\n=== CS2 Server Status ===")
        servers = await client.get_cs2_server_info()
        if servers:
            print(f"Matchmaking status: {servers.get('matchmaking', {}).get('state', 'unknown')}")
        
        # Key-required endpoints
        if api_key:
            print("\n=== Player Profile (requires key) ===")
            # Example Steam ID (random pro player)
            steam_id = "76561197960434622"  # Example
            profile = await client.get_cs2_full_profile(steam_id)
            print(json.dumps(profile, indent=2))
        
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
