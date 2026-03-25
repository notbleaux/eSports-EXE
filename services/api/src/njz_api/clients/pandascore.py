"""
PandaScore API Client
https://developers.pandascore.co/

Provides Valorant and CS2 data:
- Matches (upcoming, live, completed)
- Teams and rosters
- Players and stats
- Tournaments and series
"""
import os
import httpx
from typing import Any, Optional

PANDASCORE_BASE_URL = "https://api.pandascore.co"


class PandaScoreClient:
    """Async HTTP client for PandaScore API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("PANDASCORE_API_KEY", "")
        self.base_url = PANDASCORE_BASE_URL
        self.timeout = 30

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

    async def _get(self, path: str, params: Optional[dict] = None) -> Any:
        """Make a GET request to PandaScore API."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}{path}",
                headers=self._headers(),
                params=params or {},
            )
            response.raise_for_status()
            return response.json()

    # ── Valorant ─────────────────────────────────────────────

    async def get_valorant_matches(
        self, status: str = "upcoming", page: int = 1, per_page: int = 20
    ) -> list:
        """Get Valorant matches. status: upcoming | running | past"""
        return await self._get(
            "/valorant/matches",
            params={"filter[status]": status, "page": page,
                    "per_page": per_page, "sort": "-begin_at"},
        )

    async def get_valorant_teams(self, page: int = 1, per_page: int = 50) -> list:
        return await self._get(
            "/valorant/teams", params={"page": page, "per_page": per_page}
        )

    async def get_valorant_players(self, page: int = 1, per_page: int = 50) -> list:
        return await self._get(
            "/valorant/players", params={"page": page, "per_page": per_page}
        )

    async def get_valorant_tournaments(self, page: int = 1, per_page: int = 20) -> list:
        return await self._get(
            "/valorant/tournaments/upcoming",
            params={"page": page, "per_page": per_page},
        )

    # ── CS2 ──────────────────────────────────────────────────

    async def get_cs2_matches(
        self, status: str = "upcoming", page: int = 1, per_page: int = 20
    ) -> list:
        """Get CS2 matches. status: upcoming | running | past"""
        return await self._get(
            "/csgo/matches",
            params={"filter[status]": status, "page": page,
                    "per_page": per_page, "sort": "-begin_at"},
        )

    async def get_cs2_teams(self, page: int = 1, per_page: int = 50) -> list:
        return await self._get(
            "/csgo/teams", params={"page": page, "per_page": per_page}
        )

    async def get_cs2_players(self, page: int = 1, per_page: int = 50) -> list:
        return await self._get(
            "/csgo/players", params={"page": page, "per_page": per_page}
        )

    # ── Generic ──────────────────────────────────────────────

    async def get_player_by_id(self, player_id: str, game: str = "valorant") -> dict:
        endpoint = "/valorant/players" if game == "valorant" else "/csgo/players"
        return await self._get(f"{endpoint}/{player_id}")

    async def get_team_by_id(self, team_id: str, game: str = "valorant") -> dict:
        endpoint = "/valorant/teams" if game == "valorant" else "/csgo/teams"
        return await self._get(f"{endpoint}/{team_id}")

    # ── Player Stats ──────────────────────────────────────────

    async def get_valorant_player_stats(
        self, player_id: int, page: int = 1, per_page: int = 50
    ) -> list:
        """Fetch recent per-match stats for a Valorant player."""
        return await self._get(
            f"/valorant/players/{player_id}/stats",
            params={"page": page, "per_page": per_page},
        )

    async def get_cs2_player_stats(
        self, player_id: int, page: int = 1, per_page: int = 50
    ) -> list:
        """Fetch recent per-match stats for a CS2 player."""
        return await self._get(
            f"/csgo/players/{player_id}/stats",
            params={"page": page, "per_page": per_page},
        )


# Module-level singleton — use this in route handlers
pandascore = PandaScoreClient()
