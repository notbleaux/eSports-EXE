"""
Backup Scraper Sources
Fallback to alternative data sources when VLR.gg is down
"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import asyncio
import structlog

from core.exceptions import ScraperError
from core.logging import get_logger

logger = get_logger(__name__)


class BackupSource(ABC):
    """Abstract base class for backup data sources"""
    
    name: str = "unknown"
    priority: int = 0  # Higher = tried first
    
    @abstractmethod
    async def get_live_matches(self) -> List[Dict]:
        """Fetch live matches"""
        pass
    
    @abstractmethod
    async def get_upcoming_matches(self) -> List[Dict]:
        """Fetch upcoming matches"""
        pass
    
    @abstractmethod
    async def get_match_details(self, match_id: str) -> Optional[Dict]:
        """Fetch match details"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if source is available"""
        pass


class HLTVSource(BackupSource):
    """
    HLTV backup source (for CS:GO - can be adapted for Valorant)
    """
    name = "hltv"
    priority = 10
    
    async def health_check(self) -> bool:
        # TODO: Implement HLTV health check
        return False
    
    async def get_live_matches(self) -> List[Dict]:
        return []
    
    async def get_upcoming_matches(self) -> List[Dict]:
        return []
    
    async def get_match_details(self, match_id: str) -> Optional[Dict]:
        return None


class TheSpikeSource(BackupSource):
    """
    TheSpike.gg backup source (Valorant focused)
    """
    name = "thespike"
    priority = 20
    
    BASE_URL = "https://www.thespike.gg"
    
    async def health_check(self) -> bool:
        # TODO: Implement TheSpike health check
        return False
    
    async def get_live_matches(self) -> List[Dict]:
        return []
    
    async def get_upcoming_matches(self) -> List[Dict]:
        return []
    
    async def get_match_details(self, match_id: str) -> Optional[Dict]:
        return None


class LiquipediaSource(BackupSource):
    """
    Liquipedia backup source (comprehensive esports wiki)
    """
    name = "liquipedia"
    priority = 5
    
    BASE_URL = "https://liquipedia.net/valorant"
    
    async def health_check(self) -> bool:
        # TODO: Implement Liquipedia health check
        return False
    
    async def get_live_matches(self) -> List[Dict]:
        return []
    
    async def get_upcoming_matches(self) -> List[Dict]:
        return []
    
    async def get_match_details(self, match_id: str) -> Optional[Dict]:
        return None


class BackupSourceManager:
    """
    Manages backup data sources with failover logic
    """
    
    def __init__(self):
        self.sources: List[BackupSource] = [
            # TheSpikeSource(),  # Uncomment when implemented
            # LiquipediaSource(),
            # HLTVSource(),
        ]
        self.logger = get_logger(self.__class__.__name__)
    
    async def get_best_source(self, data_type: str) -> Optional[BackupSource]:
        """
        Find the best available backup source
        """
        # Sort by priority
        sorted_sources = sorted(self.sources, key=lambda s: s.priority, reverse=True)
        
        for source in sorted_sources:
            try:
                if await source.health_check():
                    self.logger.info("backup.source_available", source=source.name)
                    return source
            except Exception as e:
                self.logger.warning("backup.health_check_failed", source=source.name, error=str(e))
        
        return None
    
    async def fetch_with_fallback(
        self,
        primary_func,
        data_type: str,
        *args,
        **kwargs
    ) -> Any:
        """
        Try primary function, fallback to backup sources if it fails
        """
        # Try primary first
        try:
            result = await primary_func(*args, **kwargs)
            if result:
                return result
        except Exception as e:
            self.logger.warning("backup.primary_failed", error=str(e))
        
        # Try backup sources
        backup = await self.get_best_source(data_type)
        if not backup:
            self.logger.error("backup.no_sources_available")
            raise ScraperError("No data sources available")
        
        try:
            if data_type == "live_matches":
                return await backup.get_live_matches()
            elif data_type == "upcoming_matches":
                return await backup.get_upcoming_matches()
            elif data_type == "match_details":
                return await backup.get_match_details(args[0] if args else kwargs.get('match_id'))
            else:
                raise ValueError(f"Unknown data type: {data_type}")
        except Exception as e:
            self.logger.error("backup.source_failed", source=backup.name, error=str(e))
            raise ScraperError(f"Backup source {backup.name} failed: {str(e)}")


# Global instance
backup_manager = BackupSourceManager()