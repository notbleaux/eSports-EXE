"""
Kaggle Dataset Downloader
Free historical eSports datasets for CS and Valorant.
"""
import asyncio
import csv
import json
import logging
import os
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


@dataclass
class KaggleDatasetConfig:
    """Configuration for Kaggle dataset."""
    dataset_slug: str  # e.g., "dataset-owner/dataset-name"
    download_path: str = "./data/kaggle"
    unzip: bool = True
    keep_zip: bool = False


class KaggleDownloader:
    """
    Download and process Kaggle datasets.
    
    Prerequisites:
        pip install kaggle
        # Configure kaggle.json credentials:
        # ~/.kaggle/kaggle.json -> {"username":"...","key":"..."}
    
    Usage:
        downloader = KaggleDownloader()
        
        # Download CS:GO match data
        path = await downloader.download("christianlillelund/csgo-professional-matches")
        
        # Load as list of dicts
        data = downloader.load_csv(path / "matches.csv")
    """
    
    def __init__(self):
        self.kaggle_available = self._check_kaggle_cli()
    
    def _check_kaggle_cli(self) -> bool:
        """Check if kaggle CLI is available."""
        import shutil
        return shutil.which("kaggle") is not None
    
    async def download(self, config: KaggleDatasetConfig) -> Optional[Path]:
        """
        Download dataset from Kaggle.
        
        Args:
            config: Dataset configuration
        
        Returns:
            Path to downloaded directory
        """
        if not self.kaggle_available:
            logger.error("Kaggle CLI not found. Install: pip install kaggle")
            return None
        
        # Check credentials
        kaggle_dir = Path.home() / ".kaggle"
        kaggle_json = kaggle_dir / "kaggle.json"
        if not kaggle_json.exists():
            logger.error(
                "Kaggle credentials not found. "
                "Create ~/.kaggle/kaggle.json with your API token."
            )
            return None
        
        # Create download directory
        download_path = Path(config.download_path) / config.dataset_slug.replace("/", "_")
        download_path.mkdir(parents=True, exist_ok=True)
        
        logger.info("Downloading dataset: %s", config.dataset_slug)
        
        try:
            # Use kaggle CLI
            process = await asyncio.create_subprocess_exec(
                "kaggle", "datasets", "download", "-d", config.dataset_slug,
                "-p", str(download_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error("Kaggle download failed: %s", stderr.decode())
                return None
            
            logger.info("Download complete: %s", config.dataset_slug)
            
            # Unzip if requested
            if config.unzip:
                zip_path = download_path / f"{config.dataset_slug.split('/')[-1]}.zip"
                if zip_path.exists():
                    with zipfile.ZipFile(zip_path, 'r') as zf:
                        zf.extractall(download_path)
                    logger.info("Extracted: %s", zip_path)
                    
                    if not config.keep_zip:
                        zip_path.unlink()
            
            return download_path
            
        except Exception as e:
            logger.error("Download failed: %s", e)
            return None
    
    def load_csv(self, filepath: Path) -> List[Dict[str, Any]]:
        """Load CSV file as list of dictionaries."""
        if not filepath.exists():
            logger.error("File not found: %s", filepath)
            return []
        
        records = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(dict(row))
        
        logger.info("Loaded %d records from %s", len(records), filepath.name)
        return records
    
    def load_json(self, filepath: Path) -> Any:
        """Load JSON file."""
        if not filepath.exists():
            logger.error("File not found: %s", filepath)
            return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)


# === Recommended eSports Datasets ===

ESPORTS_DATASETS = {
    "csgo_matches": {
        "slug": "christianlillelund/csgo-professional-matches",
        "description": "CS:GO professional match data",
        "files": ["matches.csv", "players.csv", "economy.csv"],
        "last_updated": "2023"
    },
    "csgo_pro_matches": {
        "slug": "joshuanaude/csgo-professional-matches-2012-2020",
        "description": "Historical CS:GO matches 2012-2020",
        "files": ["matches.csv"],
        "last_updated": "2020"
    },
    "valorant_champions_2022": {
        "slug": "chrico03/valorant-champions-2022",
        "description": "Valorant Champions 2022 tournament data",
        "files": ["players_stats.csv", "matches_stats.csv"],
        "last_updated": "2022"
    },
    "esports_earnings": {
        "slug": "bobby2k/esports-earnings",
        "description": "General esports earnings data",
        "files": ["esports_earnings.csv"],
        "last_updated": "2023"
    }
}


class EsportsDatasetManager:
    """
    Manager for eSports datasets from Kaggle.
    """
    
    def __init__(self, base_path: str = "./data/kaggle"):
        self.base_path = Path(base_path)
        self.downloader = KaggleDownloader()
    
    async def download_csgo_matches(self) -> Optional[List[Dict]]:
        """Download and load CS:GO match dataset."""
        config = KaggleDatasetConfig(
            dataset_slug=ESPORTS_DATASETS["csgo_matches"]["slug"],
            download_path=str(self.base_path)
        )
        
        path = await self.downloader.download(config)
        if not path:
            return None
        
        # Load matches
        matches_file = path / "matches.csv"
        return self.downloader.load_csv(matches_file)
    
    async def download_valorant_champions(self) -> Optional[List[Dict]]:
        """Download and load Valorant Champions 2022 data."""
        config = KaggleDatasetConfig(
            dataset_slug=ESPORTS_DATASETS["valorant_champions_2022"]["slug"],
            download_path=str(self.base_path)
        )
        
        path = await self.downloader.download(config)
        if not path:
            return None
        
        players_file = path / "players_stats.csv"
        return self.downloader.load_csv(players_file)
    
    async def download_all(self) -> Dict[str, List[Dict]]:
        """Download all recommended datasets."""
        results = {}
        
        # CS:GO
        logger.info("Downloading CS:GO matches...")
        csgo = await self.download_csgo_matches()
        if csgo:
            results["csgo_matches"] = csgo
        
        # Valorant
        logger.info("Downloading Valorant Champions data...")
        val = await self.download_valorant_champions()
        if val:
            results["valorant_champions"] = val
        
        return results


# === Data Processing ===

def normalize_csgo_match(raw_match: Dict) -> Dict:
    """
    Normalize CS:GO match record to RAWS format.
    
    Input fields vary by dataset source.
    Output follows RAWS schema conventions.
    """
    normalized = {
        "match_id": raw_match.get("match_id", "unknown"),
        "date": raw_match.get("date", raw_match.get("match_date")),
        "team1": raw_match.get("team1", raw_match.get("t1", "")),
        "team2": raw_match.get("team2", raw_match.get("t2", "")),
        "team1_score": int(raw_match.get("team1_score", raw_match.get("t1_score", 0))),
        "team2_score": int(raw_match.get("team2_score", raw_match.get("t2_score", 0))),
        "map": raw_match.get("map", raw_match.get("_map", "unknown")),
        "event": raw_match.get("event", raw_match.get("tournament", "")),
        "winner": raw_match.get("winner", ""),
        "source": "kaggle"
    }
    
    # Calculate derived fields
    if not normalized["winner"]:
        if normalized["team1_score"] > normalized["team2_score"]:
            normalized["winner"] = normalized["team1"]
        elif normalized["team2_score"] > normalized["team1_score"]:
            normalized["winner"] = normalized["team2"]
        else:
            normalized["winner"] = "draw"
    
    return normalized


def normalize_valorant_player(raw_player: Dict) -> Dict:
    """Normalize Valorant player stats to RAWS format."""
    return {
        "player_id": raw_player.get("player_id", ""),
        "player_name": raw_player.get("player", raw_player.get("player_name", "")),
        "team": raw_player.get("team", ""),
        "agent": raw_player.get("agent", ""),
        "rating": float(raw_player.get("rating", 0)),
        "acs": float(raw_player.get("acs", raw_player.get("average_combat_score", 0))),
        "kills": int(raw_player.get("kills", 0)),
        "deaths": int(raw_player.get("deaths", 0)),
        "assists": int(raw_player.get("assists", 0)),
        "kd": float(raw_player.get("kd", 0)),
        "kast": float(raw_player.get("kast", 0)),
        "adr": float(raw_player.get("adr", raw_player.get("average_damage_per_round", 0))),
        "hs_pct": float(raw_player.get("hs_pct", raw_player.get("headshot_percentage", 0))),
        "source": "kaggle"
    }


# === CLI Interface ===

async def main():
    """Example usage."""
    import json
    
    manager = EsportsDatasetManager()
    
    # Download all datasets
    print("Downloading eSports datasets from Kaggle...")
    datasets = await manager.download_all()
    
    for name, data in datasets.items():
        print(f"\n{name}: {len(data)} records")
        if data:
            print("Sample record:")
            print(json.dumps(data[0], indent=2))
    
    # Normalize and save
    if "csgo_matches" in datasets:
        normalized = [normalize_csgo_match(m) for m in datasets["csgo_matches"][:5]]
        print("\n\nNormalized CS:GO matches (sample):")
        print(json.dumps(normalized, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
