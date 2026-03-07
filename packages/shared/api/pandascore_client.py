"""
Pandascore API Integration - Legal Data Source
Replaces web scraping with official API access
Documentation: https://developers.pandascore.co/
"""
import os
import asyncio
import aiohttp
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from .circuit_breaker import circuit_breaker, fallback_cached_data
from .cache import cached


class PandascoreClient:
    """
    Official Pandascore API client for esports data.
    Free tier: 1000 calls/day, 1 call/second
    """
    
    BASE_URL = "https://api.pandascore.co"
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("PANDASCORE_API_KEY")
        if not self.api_key:
            raise ValueError("PANDASCORE_API_KEY required")
        
        self.session: Optional[aiohttp.ClientSession] = None
        self.last_call_time = datetime.min
        self.rate_limit_delay = 1.0  # 1 second between calls
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json"
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def _rate_limited_get(self, endpoint: str, params: dict = None) -> dict:
        """Make rate-limited API call."""
        # Enforce rate limit
        elapsed = (datetime.now() - self.last_call_time).total_seconds()
        if elapsed < self.rate_limit_delay:
            await asyncio.sleep(self.rate_limit_delay - elapsed)
        
        url = f"{self.BASE_URL}/{endpoint}"
        async with self.session.get(url, params=params) as response:
            self.last_call_time = datetime.now()
            response.raise_for_status()
            return await response.json()
    
    @circuit_breaker(name="pandascore", failure_threshold=5, fallback=fallback_cached_data)
    @cached(ttl=3600, key_prefix="pandascore")
    async def get_valorant_matches(
        self,
        status: str = "finished",
        per_page: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get Valorant matches from Pandascore.
        
        Args:
            status: 'finished', 'running', or 'upcoming'
            per_page: Results per page (max 100)
        
        Returns:
            List of match objects
        """
        params = {
            "filter[status]": status,
            "per_page": min(per_page, 100)
        }
        
        data = await self._rate_limited_get("valorant/matches", params)
        
        # Transform to SATOR format
        return [self._transform_match(m) for m in data]
    
    @circuit_breaker(name="pandascore", fallback=fallback_cached_data)
    @cached(ttl=7200, key_prefix="pandascore")
    async def get_match_details(self, match_id: int) -> Dict[str, Any]:
        """Get detailed match information."""
        data = await self._rate_limited_get(f"matches/{match_id}")
        return self._transform_match_detail(data)
    
    @circuit_breaker(name="pandascore", fallback=fallback_cached_data)
    @cached(ttl=86400, key_prefix="pandascore")
    async def get_players(self, team_id: int = None) -> List[Dict[str, Any]]:
        """Get player information."""
        params = {}
        if team_id:
            params["filter[team_id]"] = team_id
        
        data = await self._rate_limited_get("valorant/players", params)
        return [self._transform_player(p) for p in data]
    
    @circuit_breaker(name="pandascore", fallback=fallback_cached_data)
    @cached(ttl=86400, key_prefix="pandascore")
    async def get_teams(self) -> List[Dict[str, Any]]:
        """Get team information."""
        data = await self._rate_limited_get("valorant/teams")
        return [self._transform_team(t) for t in data]
    
    def _transform_match(self, match: dict) -> dict:
        """Transform Pandascore match to SATOR format."""
        return {
            "id": str(match.get("id")),
            "tournament": match.get("tournament", {}).get("name"),
            "team_a": match.get("opponents", [{}])[0].get("opponent", {}).get("name"),
            "team_b": match.get("opponents", [{}])[1].get("opponent", {}).get("name") if len(match.get("opponents", [])) > 1 else "TBD",
            "status": match.get("status"),
            "scheduled_at": match.get("scheduled_at"),
            "winner_id": match.get("winner_id"),
            "source": "pandascore",
            "legal": True
        }
    
    def _transform_match_detail(self, match: dict) -> dict:
        """Transform detailed match data."""
        base = self._transform_match(match)
        base.update({
            "games": match.get("games", []),
            "streams": match.get("streams_list", []),
            "vod_url": match.get("official_stream_url")
        })
        return base
    
    def _transform_player(self, player: dict) -> dict:
        """Transform player data."""
        return {
            "id": str(player.get("id")),
            "name": player.get("name"),
            "team": player.get("current_team", {}).get("name"),
            "nationality": player.get("nationality"),
            "source": "pandascore"
        }
    
    def _transform_team(self, team: dict) -> dict:
        """Transform team data."""
        return {
            "id": str(team.get("id")),
            "name": team.get("name"),
            "location": team.get("location"),
            "players": [p.get("name") for p in team.get("players", [])]
        }


class HybridDataSource:
    """
    Hybrid data source combining Pandascore (legal) with cached scraping data.
    Prioritizes legal API, falls back to cache when needed.
    """
    
    def __init__(self):
        self.pandascore: Optional[PandascoreClient] = None
        self.use_pandascore = bool(os.getenv("PANDASCORE_API_KEY"))
    
    async def __aenter__(self):
        if self.use_pandascore:
            self.pandascore = PandascoreClient()
            await self.pandascore.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.pandascore:
            await self.pandascore.__aexit__(exc_type, exc_val, exc_tb)
    
    async def get_matches(self, **kwargs) -> List[Dict]:
        """Get matches from best available source."""
        if self.use_pandascore and self.pandascore:
            try:
                return await self.pandascore.get_valorant_matches(**kwargs)
            except Exception as e:
                print(f"Pandascore failed: {e}, trying fallback...")
        
        # Fallback to cached data
        return await fallback_cached_data("matches")
    
    @property
    def is_legal(self) -> bool:
        """Check if using legal data source."""
        return self.use_pandascore


# Usage example
async def main():
    """Example usage."""
    async with HybridDataSource() as source:
        if source.is_legal:
            print("✓ Using legal Pandascore API")
        
        matches = await source.get_matches(status="finished", per_page=10)
        print(f"Retrieved {len(matches)} matches")
        
        for match in matches[:3]:
            print(f"- {match['team_a']} vs {match['team_b']}")


if __name__ == "__main__":
    asyncio.run(main())