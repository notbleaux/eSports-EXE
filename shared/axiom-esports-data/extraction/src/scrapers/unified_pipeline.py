"""
Unified Data Pipeline Orchestrator
Coordinates data collection from all sources for SATOR-eXe-ROTAS.
"""
import asyncio
import json
import logging
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime

# Import scrapers
from .riot_api_client import RiotAPIClient, RiotAPIConfig
from .steam_api_client import SteamAPIClient, SteamAPIConfig
from .hltv_api_client import HLTVAsyncClient, HLTVConfig
from .kaggle_downloader import EsportsDatasetManager
from .grid_openaccess_client import GRIDOpenAccessClient, GRIDConfig

logger = logging.getLogger(__name__)


@dataclass
class PipelineConfig:
    """Configuration for unified pipeline."""
    # API Keys (optional - sources work without keys where possible)
    riot_api_key: Optional[str] = None
    steam_api_key: Optional[str] = None
    grid_api_key: Optional[str] = None
    
    # Data directories
    raw_data_path: str = "./data/raw"
    processed_data_path: str = "./data/processed"
    
    # Collection settings
    enable_valorant: bool = True
    enable_csgo: bool = True
    enable_historical: bool = True
    
    # Rate limits
    riot_rate_limit: int = 20
    steam_rate_limit: int = 100
    hltv_rate_limit: float = 1.0
    grid_rate_limit: int = 10


@dataclass
class PipelineResult:
    """Result from pipeline execution."""
    source: str
    data_type: str
    records_count: int
    timestamp: str
    errors: List[str]
    metadata: Dict[str, Any]


class UnifiedDataPipeline:
    """
    Unified data pipeline for eSports data collection.
    
    Integrates:
    - Riot Games API (Valorant)
    - Steam Web API (CS2)
    - HLTV (CS matches)
    - GRID Open Access (CS:GO)
    - Kaggle Datasets (Historical)
    
    Usage:
        config = PipelineConfig(
            riot_api_key=os.getenv("RIOT_API_KEY"),
            grid_api_key=os.getenv("GRID_API_KEY")
        )
        
        pipeline = UnifiedDataPipeline(config)
        await pipeline.initialize()
        
        # Collect all data
        results = await pipeline.collect_all()
        
        # Save to disk
        pipeline.save_results(results)
        
        await pipeline.close()
    """
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.clients: Dict[str, Any] = {}
        
        # Create directories
        Path(config.raw_data_path).mkdir(parents=True, exist_ok=True)
        Path(config.processed_data_path).mkdir(parents=True, exist_ok=True)
    
    async def initialize(self):
        """Initialize all enabled clients."""
        logger.info("Initializing unified data pipeline...")
        
        # Riot (Valorant)
        if self.config.enable_valorant and self.config.riot_api_key:
            riot_config = RiotAPIConfig(
                api_key=self.config.riot_api_key,
                rate_limit_rps=self.config.riot_rate_limit
            )
            self.clients["riot"] = RiotAPIClient(riot_config)
            await self.clients["riot"].initialize()
            logger.info("Riot client initialized")
        
        # Steam (CS2)
        if self.config.enable_csgo:
            steam_config = SteamAPIConfig(
                api_key=self.config.steam_api_key,
                rate_limit_rps=self.config.steam_rate_limit
            )
            self.clients["steam"] = SteamAPIClient(steam_config)
            await self.clients["steam"].initialize()
            logger.info("Steam client initialized")
        
        # HLTV (CS matches)
        if self.config.enable_csgo:
            hltv_config = HLTVConfig(rate_limit=self.config.hltv_rate_limit)
            self.clients["hltv"] = HLTVAsyncClient(hltv_config)
            await self.clients["hltv"].initialize()
            logger.info("HLTV client initialized")
        
        # GRID (CS:GO)
        if self.config.enable_csgo and self.config.grid_api_key:
            grid_config = GRIDConfig(
                api_key=self.config.grid_api_key,
                rate_limit_rps=self.config.grid_rate_limit
            )
            self.clients["grid"] = GRIDOpenAccessClient(grid_config)
            await self.clients["grid"].initialize()
            logger.info("GRID client initialized")
        
        # Kaggle (Historical datasets)
        if self.config.enable_historical:
            self.clients["kaggle"] = EsportsDatasetManager(
                base_path=f"{self.config.raw_data_path}/kaggle"
            )
            logger.info("Kaggle manager initialized")
        
        logger.info("Pipeline initialization complete")
    
    async def close(self):
        """Close all clients."""
        for name, client in self.clients.items():
            try:
                if hasattr(client, 'close'):
                    await client.close()
                    logger.info("%s client closed", name)
            except Exception as e:
                logger.error("Error closing %s: %s", name, e)
    
    # === Collection Methods ===
    
    async def collect_valorant_player(
        self,
        game_name: str,
        tag_line: str
    ) -> PipelineResult:
        """Collect Valorant player data from Riot API."""
        if "riot" not in self.clients:
            return PipelineResult(
                source="riot",
                data_type="valorant_player",
                records_count=0,
                timestamp=datetime.now().isoformat(),
                errors=["Riot client not initialized"],
                metadata={}
            )
        
        errors = []
        metadata = {}
        
        try:
            data = await self.clients["riot"].get_player_full_history(
                game_name, tag_line, max_matches=20
            )
            
            if "error" in data:
                errors.append(data["error"])
                records_count = 0
            else:
                records_count = len(data.get("matches", []))
                metadata = {
                    "player": data.get("account", {}),
                    "stats": data.get("stats", {})
                }
                
                # Save raw data
                self._save_raw("riot", f"player_{game_name}_{tag_line}.json", data)
            
        except Exception as e:
            logger.error("Riot collection failed: %s", e)
            errors.append(str(e))
            records_count = 0
        
        return PipelineResult(
            source="riot",
            data_type="valorant_player",
            records_count=records_count,
            timestamp=datetime.now().isoformat(),
            errors=errors,
            metadata=metadata
        )
    
    async def collect_cs2_global_stats(self) -> PipelineResult:
        """Collect CS2 global stats from Steam API."""
        if "steam" not in self.clients:
            return PipelineResult(
                source="steam",
                data_type="cs2_global",
                records_count=0,
                timestamp=datetime.now().isoformat(),
                errors=["Steam client not initialized"],
                metadata={}
            )
        
        errors = []
        metadata = {}
        
        try:
            player_count = await self.clients["steam"].get_cs2_player_count()
            server_info = await self.clients["steam"].get_cs2_server_info()
            
            metadata = {
                "player_count": player_count,
                "server_status": server_info
            }
            
            self._save_raw("steam", "global_stats.json", metadata)
            
            records_count = 1 if player_count else 0
            
        except Exception as e:
            logger.error("Steam collection failed: %s", e)
            errors.append(str(e))
            records_count = 0
        
        return PipelineResult(
            source="steam",
            data_type="cs2_global",
            records_count=records_count,
            timestamp=datetime.now().isoformat(),
            errors=errors,
            metadata=metadata
        )
    
    async def collect_hltv_matches(self, days: int = 7) -> PipelineResult:
        """Collect CS matches from HLTV."""
        if "hltv" not in self.clients:
            return PipelineResult(
                source="hltv",
                data_type="cs_matches",
                records_count=0,
                timestamp=datetime.now().isoformat(),
                errors=["HLTV client not initialized"],
                metadata={}
            )
        
        errors = []
        metadata = {}
        
        try:
            matches = await self.clients["hltv"].get_results(days=days)
            
            if matches:
                records_count = len(matches)
                metadata = {"days_requested": days, "sample_match": matches[0] if matches else None}
                self._save_raw("hltv", f"matches_{days}days.json", matches)
            else:
                records_count = 0
                errors.append("No matches returned")
            
        except Exception as e:
            logger.error("HLTV collection failed: %s", e)
            errors.append(str(e))
            records_count = 0
        
        return PipelineResult(
            source="hltv",
            data_type="cs_matches",
            records_count=records_count,
            timestamp=datetime.now().isoformat(),
            errors=errors,
            metadata=metadata
        )
    
    async def collect_grid_series(self, limit: int = 20) -> PipelineResult:
        """Collect CS:GO series from GRID."""
        if "grid" not in self.clients:
            return PipelineResult(
                source="grid",
                data_type="csgo_series",
                records_count=0,
                timestamp=datetime.now().isoformat(),
                errors=["GRID client not initialized (API key required)"],
                metadata={}
            )
        
        errors = []
        metadata = {}
        
        try:
            series = await self.clients["grid"].get_series(game="csgo", limit=limit)
            
            if series:
                records_count = len(series)
                metadata = {"series_count": records_count}
                self._save_raw("grid", "series.json", series)
            else:
                records_count = 0
                errors.append("No series returned")
            
        except Exception as e:
            logger.error("GRID collection failed: %s", e)
            errors.append(str(e))
            records_count = 0
        
        return PipelineResult(
            source="grid",
            data_type="csgo_series",
            records_count=records_count,
            timestamp=datetime.now().isoformat(),
            errors=errors,
            metadata=metadata
        )
    
    async def collect_kaggle_datasets(self) -> PipelineResult:
        """Collect historical datasets from Kaggle."""
        if "kaggle" not in self.clients:
            return PipelineResult(
                source="kaggle",
                data_type="historical",
                records_count=0,
                timestamp=datetime.now().isoformat(),
                errors=["Kaggle manager not initialized"],
                metadata={}
            )
        
        errors = []
        metadata = {}
        
        try:
            datasets = await self.clients["kaggle"].download_all()
            
            records_count = sum(len(d) for d in datasets.values())
            metadata = {
                "datasets": list(datasets.keys()),
                "counts": {k: len(v) for k, v in datasets.items()}
            }
            
        except Exception as e:
            logger.error("Kaggle collection failed: %s", e)
            errors.append(str(e))
            records_count = 0
        
        return PipelineResult(
            source="kaggle",
            data_type="historical",
            records_count=records_count,
            timestamp=datetime.now().isoformat(),
            errors=errors,
            metadata=metadata
        )
    
    async def collect_all(self) -> List[PipelineResult]:
        """Run complete data collection from all sources."""
        logger.info("Starting full data collection...")
        
        tasks = []
        
        # Valorant
        if self.config.enable_valorant:
            logger.info("Queueing Valorant collection...")
            # Example player collection (replace with actual targets)
            # tasks.append(self.collect_valorant_player("TenZ", "NA1"))
        
        # CS2 Global
        if self.config.enable_csgo:
            logger.info("Queueing CS2 collection...")
            tasks.append(self.collect_cs2_global_stats())
            tasks.append(self.collect_hltv_matches(days=7))
        
        # GRID
        if self.config.enable_csgo and self.config.grid_api_key:
            logger.info("Queueing GRID collection...")
            tasks.append(self.collect_grid_series(limit=20))
        
        # Kaggle
        if self.config.enable_historical:
            logger.info("Queueing Kaggle collection...")
            tasks.append(self.collect_kaggle_datasets())
        
        # Execute all tasks
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error("Collection task failed: %s", result)
                processed_results.append(PipelineResult(
                    source="unknown",
                    data_type="unknown",
                    records_count=0,
                    timestamp=datetime.now().isoformat(),
                    errors=[str(result)],
                    metadata={}
                ))
            else:
                processed_results.append(result)
        
        logger.info("Full collection complete: %d results", len(processed_results))
        return processed_results
    
    def _save_raw(self, source: str, filename: str, data: Any):
        """Save raw data to disk."""
        filepath = Path(self.config.raw_data_path) / source / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info("Saved: %s", filepath)
    
    def save_results(self, results: List[PipelineResult], filename: str = "pipeline_results.json"):
        """Save pipeline results to disk."""
        filepath = Path(self.config.processed_data_path) / filename
        
        data = {
            "timestamp": datetime.now().isoformat(),
            "results": [asdict(r) for r in results]
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info("Results saved: %s", filepath)
    
    def print_summary(self, results: List[PipelineResult]):
        """Print collection summary."""
        print("\n" + "=" * 60)
        print("DATA COLLECTION SUMMARY")
        print("=" * 60)
        
        total_records = 0
        for result in results:
            status = "✓" if not result.errors else "✗"
            print(f"\n{status} {result.source.upper()} - {result.data_type}")
            print(f"   Records: {result.records_count}")
            print(f"   Time: {result.timestamp}")
            if result.errors:
                print(f"   Errors: {', '.join(result.errors)}")
            total_records += result.records_count
        
        print("\n" + "-" * 60)
        print(f"TOTAL RECORDS: {total_records}")
        print("=" * 60)


# === CLI Interface ===

async def main():
    """Example pipeline execution."""
    import os
    
    config = PipelineConfig(
        riot_api_key=os.getenv("RIOT_API_KEY"),
        steam_api_key=os.getenv("STEAM_API_KEY"),
        grid_api_key=os.getenv("GRID_API_KEY"),
        enable_valorant=True,
        enable_csgo=True,
        enable_historical=True
    )
    
    pipeline = UnifiedDataPipeline(config)
    
    await pipeline.initialize()
    
    try:
        results = await pipeline.collect_all()
        pipeline.print_summary(results)
        pipeline.save_results(results)
    finally:
        await pipeline.close()


if __name__ == "__main__":
    asyncio.run(main())
