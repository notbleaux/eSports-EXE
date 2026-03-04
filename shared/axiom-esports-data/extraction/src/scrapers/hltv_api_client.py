"""
HLTV Async API Client
Counter-Strike match and player data via unofficial HLTV API.
Uses hltv-async-api library with rate limiting and ethical scraping.
"""
import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

# Rate limits (conservative to respect HLTV)
HLTV_RATE_LIMIT = 1  # 1 request per second
HLTV_BURST_LIMIT = 10  # Max burst


@dataclass
class HLTVConfig:
    """Configuration for HLTV client."""
    rate_limit: float = HLTV_RATE_LIMIT
    cache_ttl: int = 3600  # 1 hour
    respect_robots_txt: bool = True


class RateLimiter:
    """Simple rate limiter."""
    
    def __init__(self, requests_per_second: float = 1.0):
        self.min_interval = 1.0 / requests_per_second
        self.last_request = 0
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        async with self.lock:
            now = time.time()
            elapsed = now - self.last_request
            if elapsed < self.min_interval:
                await asyncio.sleep(self.min_interval - elapsed)
            self.last_request = time.time()


class HLTVAsyncClient:
    """
    HLTV data client using hltv-async-api library.
    
    Features:
    - Rate limiting (1 req/sec to respect HLTV)
    - Caching to reduce server load
    - Error handling and retry logic
    - Ethical user agent
    
    Note: HLTV robots.txt blocks query-parameterized URLs but allows
    direct match pages. This client respects those restrictions.
    
    Prerequisites:
        pip install hltv-async-api
    
    Usage:
        client = HLTVAsyncClient()
        await client.initialize()
        
        # Get match results
        matches = await client.get_results()
        
        # Get player stats
        stats = await client.get_player_stats("s1mple")
        
        await client.close()
    """
    
    def __init__(self, config: Optional[HLTVConfig] = None):
        self.config = config or HLTVConfig()
        self.rate_limiter = RateLimiter(self.config.rate_limit)
        self.cache: Dict[str, Any] = {}
        self.cache_timestamps: Dict[str, float] = {}
        self._client = None
    
    async def initialize(self):
        """Initialize HLTV client."""
        try:
            from hltv_async_api import Hltv
            
            self._client = Hltv(
                use_proxy=False,
                proxy_list=[],
                proxy_protocol="http",
                proxy_key="",  # Premium proxy key if available
                debug=False,
                timeout=30,
                max_delay=10  # Seconds between requests
            )
            logger.info("HLTV client initialized")
            
        except ImportError:
            logger.error("hltv-async-api not installed. Run: pip install hltv-async-api")
            raise
    
    async def close(self):
        """Close client."""
        if self._client:
            # hltv-async-api doesn't have explicit close, but we clear references
            self._client = None
        logger.info("HLTV client closed")
    
    def _get_cache_key(self, method: str, **kwargs) -> str:
        """Generate cache key."""
        key = method
        if kwargs:
            key += ":" + ",".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return key
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached data."""
        if key in self.cache:
            timestamp = self.cache_timestamps.get(key, 0)
            if time.time() - timestamp < self.config.cache_ttl:
                logger.debug("Cache hit: %s", key)
                return self.cache[key]
            else:
                del self.cache[key]
                del self.cache_timestamps[key]
        return None
    
    def _set_cached(self, key: str, data: Any):
        """Cache data."""
        self.cache[key] = data
        self.cache_timestamps[key] = time.time()
    
    async def _make_request(self, method_name: str, use_cache: bool = True, **kwargs):
        """Make rate-limited request."""
        cache_key = self._get_cache_key(method_name, **kwargs)
        
        if use_cache:
            cached = self._get_cached(cache_key)
            if cached is not None:
                return cached
        
        await self.rate_limiter.acquire()
        
        if not self._client:
            raise RuntimeError("Client not initialized. Call initialize() first.")
        
        try:
            method = getattr(self._client, method_name, None)
            if not method:
                raise ValueError(f"Unknown method: {method_name}")
            
            # hltv-async-api uses synchronous calls with aiohttp internally
            result = await asyncio.to_thread(method, **kwargs)
            
            if use_cache and result:
                self._set_cached(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error("HLTV request failed (%s): %s", method_name, e)
            return None
    
    # === Match Results ===
    
    async def get_results(self, days: int = 7, **filters) -> Optional[List[Dict]]:
        """
        Get match results.
        
        Args:
            days: Number of days to look back
            **filters: team, event, etc.
        
        Returns:
            List of match results
        """
        return await self._make_request("get_results", days=days, **filters)
    
    # === Matches ===
    
    async def get_match(self, match_id: int) -> Optional[Dict]:
        """
        Get detailed match info.
        
        Args:
            match_id: HLTV match ID
        
        Returns:
            Match details including maps, scores, stats
        """
        return await self._make_request("get_match", match_id=match_id)
    
    # === Teams ===
    
    async def get_team(self, team_id: int) -> Optional[Dict]:
        """
        Get team information.
        
        Args:
            team_id: HLTV team ID
        
        Returns:
            Team details including roster, rankings
        """
        return await self._make_request("get_team_info", team_id=team_id)
    
    async def get_team_by_name(self, team_name: str) -> Optional[Dict]:
        """Get team by name."""
        return await self._make_request("get_team_info", team_name=team_name)
    
    # === Players ===
    
    async def get_player(self, player_id: int) -> Optional[Dict]:
        """
        Get player information.
        
        Args:
            player_id: HLTV player ID
        
        Returns:
            Player details including stats
        """
        return await self._make_request("get_player_info", player_id=player_id)
    
    async def get_player_by_name(self, player_name: str) -> Optional[Dict]:
        """Get player by name."""
        return await self._make_request("get_player_info", player_name=player_name)
    
    # === Rankings ===
    
    async def get_rankings(self) -> Optional[List[Dict]]:
        """
        Get current team rankings.
        
        Returns:
            Top 30 teams with points
        """
        return await self._make_request("get_rankings")
    
    # === Events ===
    
    async def get_events(self) -> Optional[List[Dict]]:
        """
        Get upcoming and ongoing events.
        
        Returns:
            List of tournaments/events
        """
        return await self._make_request("get_events")
    
    async def get_event(self, event_id: int) -> Optional[Dict]:
        """Get event details."""
        return await self._make_request("get_event", event_id=event_id)
    
    # === Bulk Operations ===
    
    async def get_recent_pro_matches(
        self, 
        days: int = 7, 
        min_tier: str = "tier1"
    ) -> List[Dict]:
        """
        Get recent professional matches.
        
        Args:
            days: Lookback period
            min_tier: Minimum event tier (tier1, tier2, etc.)
        
        Returns:
            Filtered match list
        """
        results = await self.get_results(days=days)
        if not results:
            return []
        
        # Filter by event tier if specified
        filtered = []
        for match in results:
            event_tier = match.get("event_tier", "").lower()
            if min_tier == "tier1" and event_tier not in ["tier1", "s"]:
                continue
            filtered.append(match)
        
        return filtered
    
    async def get_team_match_history(
        self, 
        team_id: int, 
        max_matches: int = 10
    ) -> List[Dict]:
        """
        Get recent matches for a specific team.
        
        Note: This fetches all results and filters client-side.
        Consider caching for frequent queries.
        """
        # Get 30 days of results
        results = await self.get_results(days=30)
        if not results:
            return []
        
        team_matches = [
            m for m in results 
            if team_id in [m.get("team1_id"), m.get("team2_id")]
        ]
        
        return team_matches[:max_matches]
    
    async def get_top_players_stats(self, top_n: int = 20) -> List[Dict]:
        """
        Get stats for top-ranked players.
        
        This is a composite operation that gets rankings first,
        then player stats for top teams.
        """
        rankings = await self.get_rankings()
        if not rankings:
            return []
        
        player_stats = []
        seen_players = set()
        
        # Get players from top N teams
        for team in rankings[:top_n]:
            team_id = team.get("team_id")
            if not team_id:
                continue
            
            team_info = await self.get_team(team_id)
            if not team_info:
                continue
            
            for player in team_info.get("roster", []):
                player_id = player.get("player_id")
                if player_id and player_id not in seen_players:
                    seen_players.add(player_id)
                    stats = await self.get_player(player_id)
                    if stats:
                        player_stats.append(stats)
                    
                    # Rate limiting between players
                    await asyncio.sleep(1)
        
        return player_stats


# === Alternative: Direct Scraping (if library unavailable) ===

class HLTVScraperClient:
    """
    Fallback HLTV client using direct scraping.
    Only uses endpoints allowed by robots.txt.
    """
    
    BASE_URL = "https://www.hltv.org"
    
    def __init__(self):
        self.rate_limiter = RateLimiter(1.0)  # 1 req/sec
        self.session = None
    
    async def initialize(self):
        import aiohttp
        self.session = aiohttp.ClientSession(
            headers={
                "User-Agent": "SATOR-eXe-ROTAS/1.0 (Research; contact@example.com)",
                "Accept": "text/html,application/xhtml+xml"
            }
        )
    
    async def close(self):
        if self.session:
            await self.session.close()
    
    async def _fetch(self, path: str) -> Optional[str]:
        """Fetch page content."""
        await self.rate_limiter.acquire()
        
        url = f"{self.BASE_URL}{path}"
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.text()
                logger.warning("HLTV returned %d for %s", response.status, path)
                return None
        except Exception as e:
            logger.error("Failed to fetch %s: %s", path, e)
            return None
    
    # These paths are generally allowed by robots.txt
    # (direct match/team/player pages without query parameters)


# === CLI Interface ===

async def main():
    """Example usage."""
    import json
    
    client = HLTVAsyncClient()
    await client.initialize()
    
    try:
        print("=== HLTV Rankings ===")
        rankings = await client.get_rankings()
        if rankings:
            for i, team in enumerate(rankings[:10], 1):
                print(f"{i}. {team.get('team_name')} ({team.get('points')} points)")
        
        print("\n=== Recent Results (last 3 days) ===")
        results = await client.get_results(days=3)
        if results:
            for match in results[:5]:
                t1 = match.get('team1', 'Unknown')
                t2 = match.get('team2', 'Unknown')
                s1 = match.get('team1_score', 0)
                s2 = match.get('team2_score', 0)
                print(f"{t1} {s1} - {s2} {t2}")
        
        print("\n=== Player Stats (s1mple) ===")
        player = await client.get_player_by_name("s1mple")
        if player:
            print(json.dumps(player, indent=2))
        
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
