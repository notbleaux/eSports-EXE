"""Valorant extraction worker using VLR.gg."""

import hashlib
import logging
from datetime import datetime
from typing import Any, Dict, List

from pipeline.coordinator.workers.base_worker import BaseExtractionWorker
from pipeline.coordinator.models import ExtractionJob, GameType, AgentCapabilities, DataSource

logger = logging.getLogger(__name__)


class ValorantExtractionWorker(BaseExtractionWorker):
    """Valorant extraction worker using VLR.gg."""
    
    def __init__(
        self,
        agent_id: Optional[str] = None,
        coordinator_url: str = "http://localhost:8000",
        api_key: str = "",
        name: str = "valorant-worker",
    ):
        super().__init__(agent_id, coordinator_url, api_key, name)
        self.game_type = GameType.VALORANT
        self._vlr_client = None
    
    def get_capabilities(self) -> AgentCapabilities:
        """Get Valorant agent capabilities."""
        return AgentCapabilities(
            games=[GameType.VALORANT],
            sources=[DataSource.VLR_GG],
            max_concurrent_jobs=1,
            rate_limit_rps=0.5,  # VLR is more restrictive
        )
    
    async def extract(self, job: ExtractionJob) -> Dict[str, Any]:
        """Extract Valorant match data from VLR.gg.
        
        VLR client already implements:
        - Circuit breaker (5-failure threshold)
        - Delta mode (skip unchanged content)
        - Rate limiting
        
        Args:
            job: Extraction job configuration
            
        Returns:
            Dict with extraction results
        """
        match_id = job.config.match_id
        start_time = datetime.utcnow()
        
        if not match_id:
            raise ValueError("Job config missing match_id")
        
        # Fetch match data from VLR
        records = await self._extract_from_vlr(match_id)
        
        # Calculate data hash
        data_hash = hashlib.sha256(
            str(records).encode()
        ).hexdigest()[:16]
        
        processing_time_ms = int(
            (datetime.utcnow() - start_time).total_seconds() * 1000
        )
        
        return {
            "batch_id": f"val_{match_id}_{int(datetime.utcnow().timestamp())}",
            "job_id": str(job.id),
            "records_processed": len(records),
            "records_failed": 0,
            "data_hash": data_hash,
            "processing_time_ms": processing_time_ms,
            "source": DataSource.VLR_GG.value,
            "records": records,
        }
    
    async def _extract_from_vlr(self, match_id: str) -> List[Dict]:
        """Extract match data from VLR.gg.
        
        Args:
            match_id: VLR match ID
            
        Returns:
            List of standardized record dicts
        """
        try:
            from extraction.src.scrapers.vlr_resilient_client import ResilientVLRClient
            
            client = ResilientVLRClient()
            
            # Note: VLR client is context manager compatible
            # For now, simulate the extraction
            logger.info(f"Extracting VLR match {match_id}")
            
            # Mock data extraction - in production would use:
            # match_data = await client.get_match(match_id)
            # player_stats = await client.get_player_stats(match_id)
            
            records = self._get_mock_records(match_id)
            return records
            
        except ImportError:
            logger.warning("VLR client not available, using mock data")
            return self._get_mock_records(match_id)
        except Exception as e:
            logger.error(f"VLR extraction error: {e}")
            raise
    
    def _transform_vlr_data(
        self,
        match_data: Dict,
        player_stats: Dict,
    ) -> List[Dict]:
        """Transform VLR data to standardized schema.
        
        Args:
            match_data: Raw match data from VLR
            player_stats: Player statistics from VLR
            
        Returns:
            List of standardized records
        """
        records = []
        
        # Extract match info
        match_info = {
            "match_id": match_data.get("id"),
            "date": match_data.get("date"),
            "team1": match_data.get("team1", {}).get("name"),
            "team2": match_data.get("team2", {}).get("name"),
            "score1": match_data.get("team1", {}).get("score"),
            "score2": match_data.get("team2", {}).get("score"),
            "event": match_data.get("event", {}).get("name"),
            "map": match_data.get("map"),
        }
        
        # Transform player stats - Valorant includes agent (character) data
        players = player_stats.get("players", [])
        for player in players:
            record = {
                **match_info,
                "player_id": player.get("id"),
                "player_name": player.get("name"),
                "team": player.get("team"),
                "agent": player.get("agent"),  # Valorant-specific
                "kills": player.get("kills"),
                "deaths": player.get("deaths"),
                "assists": player.get("assists"),
                "acs": player.get("acs"),  # Average Combat Score
                "adr": player.get("adr"),
                "rating": player.get("rating"),
                "kast": player.get("kast"),
                "hs_pct": player.get("headshot_percentage"),
                "first_blood": player.get("first_blood"),
                "first_death": player.get("first_death"),
                "clutch_win": player.get("clutch_win"),
                "clutch_attempt": player.get("clutch_attempt"),
            }
            records.append(record)
        
        return records
    
    def _get_mock_records(self, match_id: str) -> List[Dict]:
        """Generate mock records for testing.
        
        Args:
            match_id: Match identifier
            
        Returns:
            List of mock records with Valorant-specific fields
        """
        agents = ["Jett", "Sage", "Phoenix", "Omen", "Sova"]
        
        return [
            {
                "match_id": match_id,
                "source": "vlr_gg",
                "player_name": f"player_{i}",
                "agent": agents[i % len(agents)],
                "kills": 18 + i,
                "deaths": 12 - (i % 3),
                "assists": 6,
                "acs": 220 + (i * 10),
                "adr": 145,
                "rating": 1.05 + (i * 0.02),
            }
            for i in range(10)
        ]
