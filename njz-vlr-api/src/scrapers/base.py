"""
Base Scraper with Circuit Breaker, Rate Limiting, and RAWS Storage
Production-grade scraping infrastructure
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Generic, Optional, TypeVar
from abc import ABC, abstractmethod

from selectolax.parser import HTMLParser

from core.config import settings
from core.exceptions import ScraperError, CircuitBreakerOpen
from core.logging import get_logger
from utils.circuit_breaker import CircuitBreaker
from utils.http_client import HTTPClient
from utils.checksums import calculate_sha256

T = TypeVar('T')

logger = get_logger(__name__)


@dataclass
class ScrapeResult(Generic[T]):
    """
    Standardized scrape result with metadata
    """
    data: T
    raw_html: Optional[str] = None
    scrape_time: datetime = field(default_factory=datetime.utcnow)
    url: Optional[str] = None
    cache_hit: bool = False
    sha256: Optional[str] = None
    
    def to_raws_format(self) -> Dict[str, Any]:
        """Convert to RAWS storage format"""
        return {
            "metadata": {
                "scrape_time": self.scrape_time.isoformat(),
                "url": self.url,
                "sha256": self.sha256 or calculate_sha256(self.raw_html or ""),
                "version": settings.API_VERSION
            },
            "raw_html": self.raw_html,
            "parsed_data": self.data if isinstance(self.data, dict) else getattr(self.data, '__dict__', {})
        }


class BaseScraper(ABC, Generic[T]):
    """
    Production-grade base scraper
    
    Features:
    - Circuit breaker pattern
    - Rate limiting
    - Structured logging
    - RAWS storage integration
    """
    
    BASE_URL = "https://www.vlr.gg"
    
    def __init__(self):
        self.http_client: Optional[HTTPClient] = None
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=settings.VLR_CIRCUIT_BREAKER_THRESHOLD,
            recovery_timeout=settings.VLR_CIRCUIT_BREAKER_TIMEOUT
        )
        self._semaphore = asyncio.Semaphore(settings.VLR_CONCURRENT_REQUESTS)
        self.logger = get_logger(self.__class__.__name__)
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.http_client = HTTPClient()
        await self.http_client.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.http_client:
            await self.http_client.__aexit__(exc_type, exc_val, exc_tb)
    
    async def _fetch(self, url: str) -> str:
        """
        Fetch URL with circuit breaker and retry
        """
        if not self.circuit_breaker.can_execute():
            raise CircuitBreakerOpen("Circuit breaker is OPEN")
        
        try:
            html = await self.http_client.get(url)
            await self.circuit_breaker.record_success()
            return html
        except Exception as e:
            await self.circuit_breaker.record_failure()
            raise
    
    @abstractmethod
    async def parse(self, html: str, **kwargs) -> T:
        """Parse HTML - implement in subclass"""
        pass
    
    @abstractmethod
    def get_raws_path(self, **kwargs) -> str:
        """Generate RAWS storage path - implement in subclass"""
        pass
    
    async def scrape(
        self,
        url_path: str,
        save_raws: bool = True,
        **parse_kwargs
    ) -> ScrapeResult[T]:
        """
        Main scraping pipeline
        """
        url = f"{self.BASE_URL}{url_path}"
        
        async with self._semaphore:
            try:
                self.logger.info("scrape.start", url=url)
                
                # Fetch
                html = await self._fetch(url)
                
                # Parse
                data = await self.parse(html, **parse_kwargs)
                
                # Calculate checksum
                sha256 = calculate_sha256(html)
                
                result = ScrapeResult(
                    data=data,
                    raw_html=html if save_raws else None,
                    url=url,
                    sha256=sha256
                )
                
                self.logger.info("scrape.success", url=url, checksum=sha256[:16])
                return result
                
            except Exception as e:
                self.logger.error("scrape.failed", url=url, error=str(e))
                raise ScraperError(f"Failed to scrape {url}: {str(e)}")
    
    def _get_text(self, node, selector: str) -> Optional[str]:
        """Safely extract text from CSS selector"""
        elem = node.css_first(selector)
        return elem.text(strip=True) if elem else None
    
    def _get_attr(self, node, selector: str, attr: str) -> Optional[str]:
        """Safely extract attribute from CSS selector"""
        elem = node.css_first(selector)
        return elem.attributes.get(attr) if elem else None