"""
HTTP Client with Retry Logic and Rate Limiting
Production-grade HTTP client for scraping
"""

import time
from typing import Optional, Dict, Any
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from src.core.config import settings
from core.exceptions import RateLimitExceeded


class HTTPClient:
    """
    HTTP client with automatic retry, backoff, and rate limiting
    """
    
    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None
        self._last_request_time: Optional[float] = None
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            limits=httpx.Limits(
                max_connections=settings.VLR_CONCURRENT_REQUESTS,
                max_keepalive_connections=2
            ),
            headers={
                "User-Agent": "NJZ-VLR-API/2.0 (Research Project; Contact: api@njz.gg)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",
                "DNT": "1",
                "Connection": "keep-alive",
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    async def _apply_rate_limit(self):
        """Apply respectful rate limiting"""
        if self._last_request_time:
            elapsed = time.monotonic() - self._last_request_time
            delay = settings.VLR_REQUEST_DELAY - elapsed
            if delay > 0:
                time.sleep(delay)
        self._last_request_time = time.monotonic()
    
    @retry(
        stop=stop_after_attempt(settings.VLR_MAX_RETRIES),
        wait=wait_exponential(
            multiplier=settings.VLR_RETRY_BACKOFF,
            min=1,
            max=60
        ),
        retry=retry_if_exception_type((
            httpx.HTTPStatusError,
            httpx.ConnectError,
            httpx.TimeoutException
        )),
        reraise=True
    )
    async def get(self, url: str) -> str:
        """
        Perform GET request with retry and rate limiting
        
        Args:
            url: URL to fetch
        
        Returns:
            Response text (HTML)
        
        Raises:
            RateLimitExceeded: If VLR.gg returns 429
            httpx.HTTPError: On other HTTP errors
        """
        await self._apply_rate_limit()
        
        response = await self.client.get(url)
        
        if response.status_code == 429:
            raise RateLimitExceeded("VLR.gg rate limit exceeded")
        
        response.raise_for_status()
        return response.text


# Singleton instance
_http_client: Optional[HTTPClient] = None


async def get_http_client() -> HTTPClient:
    """Get or create HTTP client instance"""
    global _http_client
    if _http_client is None:
        _http_client = HTTPClient()
        await _http_client.__aenter__()
    return _http_client