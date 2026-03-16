"""
VLR Client — Ethical VLR.gg HTTP client with rate limiting.

This is the base VLR client implementing the skill-spec contract.
For production use with circuit breaker and resilience features,
see ResilientVLRClient in vlr_resilient_client.py.
"""
import asyncio
import hashlib
import logging
from typing import Optional

import aiohttp

logger = logging.getLogger(__name__)


class VLRClient:
    """
    Ethical VLR.gg client with rate limiting.
    
    Implements the base extraction contract:
    - Rate limit: 2 requests per second maximum
    - SHA-256 checksums for integrity
    - Proper user-agent identification
    
    Usage:
        async with VLRClient() as client:
            html = await client.fetch_match("12345")
    """

    BASE_URL = "https://www.vlr.gg"
    RATE_LIMIT = 2.0  # requests per second

    def __init__(self, session: Optional[aiohttp.ClientSession] = None):
        self._last_request: Optional[float] = None
        self._session = session
        self._owned_session = session is None

    async def __aenter__(self):
        if self._owned_session:
            self._session = aiohttp.ClientSession(
                headers={
                    'User-Agent': 'SATOR-Analytics/1.0 (Research Project; contact@axiom-esports.example)',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._owned_session and self._session:
            await self._session.close()
            self._session = None

    async def _throttle(self) -> None:
        """Enforce rate limit of 2 requests per second."""
        if self._last_request is not None:
            elapsed = asyncio.get_event_loop().time() - self._last_request
            min_interval = 1.0 / self.RATE_LIMIT
            if elapsed < min_interval:
                wait_time = min_interval - elapsed
                logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
                await asyncio.sleep(wait_time)
        self._last_request = asyncio.get_event_loop().time()

    def _compute_checksum(self, content: str) -> str:
        """Compute SHA-256 checksum of content."""
        return hashlib.sha256(content.encode()).hexdigest()

    async def fetch_match(self, match_id: str) -> tuple[str, str]:
        """
        Fetch match page HTML.
        
        Args:
            match_id: VLR match ID (e.g., "12345")
            
        Returns:
            Tuple of (html_content, checksum)
            
        Raises:
            aiohttp.ClientError: On HTTP errors
        """
        await self._throttle()
        url = f"{self.BASE_URL}/{match_id}"

        async with self._session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
            response.raise_for_status()
            html = await response.text()
            checksum = self._compute_checksum(html)
            logger.debug(f"Fetched match {match_id}: {len(html)} bytes, checksum {checksum[:16]}...")
            return html, checksum

    async def fetch_match_list(self, page: int = 1) -> tuple[str, str]:
        """
        Fetch match list page.
        
        Args:
            page: Page number for pagination
            
        Returns:
            Tuple of (html_content, checksum)
        """
        await self._throttle()
        url = f"{self.BASE_URL}/matches/?page={page}"

        async with self._session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
            response.raise_for_status()
            html = await response.text()
            checksum = self._compute_checksum(html)
            logger.debug(f"Fetched match list page {page}: {len(html)} bytes")
            return html, checksum

    async def fetch_player(self, player_id: str) -> tuple[str, str]:
        """
        Fetch player profile page.
        
        Args:
            player_id: VLR player ID
            
        Returns:
            Tuple of (html_content, checksum)
        """
        await self._throttle()
        url = f"{self.BASE_URL}/player/{player_id}"

        async with self._session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
            response.raise_for_status()
            html = await response.text()
            checksum = self._compute_checksum(html)
            logger.debug(f"Fetched player {player_id}: {len(html)} bytes")
            return html, checksum

    async def fetch_team(self, team_id: str) -> tuple[str, str]:
        """
        Fetch team profile page.
        
        Args:
            team_id: VLR team ID
            
        Returns:
            Tuple of (html_content, checksum)
        """
        await self._throttle()
        url = f"{self.BASE_URL}/team/{team_id}"

        async with self._session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
            response.raise_for_status()
            html = await response.text()
            checksum = self._compute_checksum(html)
            logger.debug(f"Fetched team {team_id}: {len(html)} bytes")
            return html, checksum
