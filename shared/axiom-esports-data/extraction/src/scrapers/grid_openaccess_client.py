"""
GRID Open Access Client
Official esports data for CS:GO (free tier, non-commercial).
"""
import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import aiohttp

logger = logging.getLogger(__name__)

# GRID Open Access API
GRID_API_BASE = "https://api.grid.gg"
RATE_LIMIT_RPS = 10  # Conservative for free tier


@dataclass
class GRIDConfig:
    """Configuration for GRID API."""
    api_key: str  # Required for Open Access
    rate_limit_rps: int = RATE_LIMIT_RPS
    cache_ttl: int = 1800  # 30 minutes


class RateLimiter:
    """Token bucket rate limiter."""
    
    def __init__(self, requests_per_second: int = 10):
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


class GRIDOpenAccessClient:
    """
    GRID Open Access API client for CS:GO esports data.
    
    Open Access provides:
    - CS:GO match data
    - Dota 2 match data
    - Limited historical data
    - Non-commercial use only
    
    Sign up: https://app.grid.gg
    
    Usage:
        client = GRIDOpenAccessClient(api_key="your_key")
        await client.initialize()
        
        # Get series (matches)
        series = await client.get_series()
        
        # Get specific match
        match = await client.get_series_by_id(series_id)
        
        await client.close()
    """
    
    def __init__(self, config: GRIDConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.rate_limiter = RateLimiter(config.rate_limit_rps)
        self.cache: Dict[str, Any] = {}
        self.cache_timestamps: Dict[str, float] = {}
    
    async def initialize(self):
        """Initialize HTTP session."""
        self.session = aiohttp.ClientSession(
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Accept": "application/json",
                "User-Agent": "SATOR-eXe-ROTAS/1.0 (Research Project)"
            }
        )
        logger.info("GRID client initialized")
    
    async def close(self):
        """Close session."""
        if self.session:
            await self.session.close()
            logger.info("GRID client closed")
    
    def _get_cache_key(self, endpoint: str, params: Optional[Dict] = None) -> str:
        """Generate cache key."""
        key = endpoint
        if params:
            key += ":" + ",".join(f"{k}={v}" for k, v in sorted(params.items()))
        return key
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached data."""
        if key in self.cache:
            timestamp = self.cache_timestamps.get(key, 0)
            if time.time() - timestamp < self.config.cache_ttl:
                return self.cache[key]
            else:
                del self.cache[key]
                del self.cache_timestamps[key]
        return None
    
    def _set_cached(self, key: str, data: Any):
        """Cache data."""
        self.cache[key] = data
        self.cache_timestamps[key] = time.time()
    
    async def _request(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        use_cache: bool = True
    ) -> Optional[Dict]:
        """Make API request."""
        cache_key = self._get_cache_key(endpoint, params)
        
        if use_cache:
            cached = self._get_cached(cache_key)
            if cached is not None:
                return cached
        
        await self.rate_limiter.acquire()
        
        url = f"{GRID_API_BASE}{endpoint}"
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 429:
                    retry_after = int(response.headers.get("Retry-After", 5))
                    logger.warning("Rate limited, waiting %d seconds", retry_after)
                    await asyncio.sleep(retry_after)
                    return await self._request(endpoint, params, use_cache=False)
                
                if response.status == 401:
                    logger.error("Invalid API key")
                    return None
                
                if response.status == 403:
                    logger.error("Access forbidden (non-commercial only)")
                    return None
                
                response.raise_for_status()
                data = await response.json()
                
                if use_cache:
                    self._set_cached(cache_key, data)
                
                return data
                
        except aiohttp.ClientResponseError as e:
            logger.error("API error %d: %s", e.status, e.message)
            return None
        except Exception as e:
            logger.error("Request failed: %s", e)
            return None
    
    # === Series (Matches) ===
    
    async def get_series(
        self,
        game: str = "csgo",
        limit: int = 20,
        offset: int = 0
    ) -> Optional[List[Dict]]:
        """
        Get series (matches).
        
        Args:
            game: Game identifier (csgo, dota2)
            limit: Results per page
            offset: Pagination offset
        
        Returns:
            List of series
        """
        endpoint = "/data/v4/series"
        params = {"game": game, "limit": limit, "offset": offset}
        result = await self._request(endpoint, params)
        return result.get("data", []) if result else None
    
    async def get_series_by_id(self, series_id: str) -> Optional[Dict]:
        """Get specific series by ID."""
        endpoint = f"/data/v4/series/{series_id}"
        return await self._request(endpoint)
    
    # === Games (Individual Maps) ===
    
    async def get_games(
        self,
        series_id: Optional[str] = None,
        game: str = "csgo",
        limit: int = 20
    ) -> Optional[List[Dict]]:
        """
        Get games (individual maps).
        
        Args:
            series_id: Filter by series
            game: Game identifier
            limit: Results per page
        """
        endpoint = "/data/v4/games"
        params = {"game": game, "limit": limit}
        if series_id:
            params["series_id"] = series_id
        
        result = await self._request(endpoint, params)
        return result.get("data", []) if result else None
    
    async def get_game_by_id(self, game_id: str) -> Optional[Dict]:
        """Get specific game by ID."""
        endpoint = f"/data/v4/games/{game_id}"
        return await self._request(endpoint)
    
    # === Teams ===
    
    async def get_teams(
        self,
        game: str = "csgo",
        limit: int = 50
    ) -> Optional[List[Dict]]:
        """Get teams."""
        endpoint = "/data/v4/teams"
        params = {"game": game, "limit": limit}
        result = await self._request(endpoint, params)
        return result.get("data", []) if result else None
    
    async def get_team_by_id(self, team_id: str) -> Optional[Dict]:
        """Get team by ID."""
        endpoint = f"/data/v4/teams/{team_id}"
        return await self._request(endpoint)
    
    # === Players ===
    
    async def get_players(
        self,
        game: str = "csgo",
        limit: int = 50
    ) -> Optional[List[Dict]]:
        """Get players."""
        endpoint = "/data/v4/players"
        params = {"game": game, "limit": limit}
        result = await self._request(endpoint, params)
        return result.get("data", []) if result else None
    
    async def get_player_by_id(self, player_id: str) -> Optional[Dict]:
        """Get player by ID."""
        endpoint = f"/data/v4/players/{player_id}"
        return await self._request(endpoint)
    
    # === Tournaments ===
    
    async def get_tournaments(
        self,
        game: str = "csgo",
        limit: int = 20
    ) -> Optional[List[Dict]]:
        """Get tournaments."""
        endpoint = "/data/v4/tournaments"
        params = {"game": game, "limit": limit}
        result = await self._request(endpoint, params)
        return result.get("data", []) if result else None
    
    async def get_tournament_by_id(self, tournament_id: str) -> Optional[Dict]:
        """Get tournament by ID."""
        endpoint = f"/data/v4/tournaments/{tournament_id}"
        return await self._request(endpoint)
    
    # === Utility Methods ===
    
    async def get_recent_matches(self, game: str = "csgo", days: int = 7) -> List[Dict]:
        """
        Get recent matches.
        
        Note: GRID doesn't have date filtering, so we fetch recent
        and filter client-side based on available data.
        """
        series = await self.get_series(game=game, limit=50)
        return series if series else []
    
    async def get_team_stats(self, team_id: str) -> Optional[Dict]:
        """
        Get team statistics.
        Fetches team info and recent series.
        """
        team = await self.get_team_by_id(team_id)
        if not team:
            return None
        
        # Get recent series for this team
        all_series = await self.get_series(limit=100)
        team_series = []
        
        if all_series:
            for s in all_series:
                teams = s.get("teams", [])
                if any(t.get("id") == team_id for t in teams):
                    team_series.append(s)
        
        return {
            "team": team,
            "recent_series": team_series[:10],
            "series_count": len(team_series)
        }
    
    async def get_player_stats(self, player_id: str) -> Optional[Dict]:
        """Get player statistics."""
        player = await self.get_player_by_id(player_id)
        return player


# === Data Normalization ===

def normalize_grid_series(series: Dict) -> Dict:
    """
    Normalize GRID series to RAWS format.
    """
    teams = series.get("teams", [])
    team1 = teams[0] if len(teams) > 0 else {}
    team2 = teams[1] if len(teams) > 1 else {}
    
    return {
        "match_id": series.get("id", ""),
        "date": series.get("start_time", ""),
        "team1": team1.get("name", ""),
        "team2": team2.get("name", ""),
        "team1_id": team1.get("id", ""),
        "team2_id": team2.get("id", ""),
        "team1_score": series.get("score", {}).get(team1.get("id", ""), 0),
        "team2_score": series.get("score", {}).get(team2.get("id", ""), 0),
        "event": series.get("tournament", {}).get("name", ""),
        "game": series.get("game", {}).get("title", ""),
        "winner": next(
            (t.get("name") for t in teams if t.get("id") == series.get("winner_id")),
            None
        ),
        "source": "grid"
    }


# === CLI Interface ===

async def main():
    """Example usage."""
    import os
    import json
    
    api_key = os.getenv("GRID_API_KEY", "YOUR_API_KEY")
    if api_key == "YOUR_API_KEY":
        print("Set GRID_API_KEY environment variable")
        return
    
    config = GRIDConfig(api_key=api_key)
    client = GRIDOpenAccessClient(config)
    
    await client.initialize()
    
    try:
        print("=== Recent CS:GO Series ===")
        series = await client.get_series(game="csgo", limit=5)
        if series:
            for s in series:
                normalized = normalize_grid_series(s)
                print(f"{normalized['team1']} vs {normalized['team2']} "
                      f"({normalized['event']})")
        
        print("\n=== Teams ===")
        teams = await client.get_teams(game="csgo", limit=10)
        if teams:
            for t in teams[:5]:
                print(f"- {t.get('name')} ({t.get('nationality', 'Unknown')})")
        
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
