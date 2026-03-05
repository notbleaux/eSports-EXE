"""
Data Export Pipeline
CSV/Parquet export for BASE files (analytics-ready)
"""

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import structlog

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

logger = structlog.get_logger(__name__)


class DataExporter:
    """
    Export BASE data to various formats for analytics
    """
    
    SUPPORTED_FORMATS = ["csv", "json", "jsonl", "parquet"]
    
    def __init__(self, export_path: str = "./data/exports"):
        self.export_path = Path(export_path)
        self.export_path.mkdir(parents=True, exist_ok=True)
    
    def _flatten_dict(self, d: Dict, parent_key: str = "", sep: str = "_") -> Dict:
        """Flatten nested dictionary for CSV export"""
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(self._flatten_dict(v, new_key, sep).items())
            elif isinstance(v, list):
                items.append((new_key, json.dumps(v)))
            else:
                items.append((new_key, v))
        return dict(items)
    
    def export_matches_csv(
        self,
        matches: List[Dict],
        filename: Optional[str] = None
    ) -> Path:
        """
        Export matches to CSV format
        """
        if not filename:
            filename = f"matches_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        filepath = self.export_path / filename
        
        if not matches:
            logger.warning("export.no_data", format="csv")
            return filepath
        
        # Flatten first match to get all columns
        flat_matches = [self._flatten_dict(m) for m in matches]
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=flat_matches[0].keys())
            writer.writeheader()
            writer.writerows(flat_matches)
        
        logger.info("export.completed", format="csv", records=len(matches), path=str(filepath))
        return filepath
    
    def export_matches_parquet(
        self,
        matches: List[Dict],
        filename: Optional[str] = None
    ) -> Optional[Path]:
        """
        Export matches to Parquet format (columnar, compressed)
        Best for analytics workflows
        """
        if not PANDAS_AVAILABLE:
            logger.error("export.pandas_required", format="parquet")
            return None
        
        if not filename:
            filename = f"matches_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.parquet"
        
        filepath = self.export_path / filename
        
        df = pd.json_normalize(matches, sep='_')
        df.to_parquet(filepath, compression='snappy', index=False)
        
        file_size = filepath.stat().st_size / 1024  # KB
        logger.info(
            "export.completed",
            format="parquet",
            records=len(matches),
            path=str(filepath),
            size_kb=round(file_size, 2)
        )
        return filepath
    
    def export_matches_jsonl(
        self,
        matches: List[Dict],
        filename: Optional[str] = None
    ) -> Path:
        """
        Export matches to JSON Lines format
        One JSON object per line - great for streaming
        """
        if not filename:
            filename = f"matches_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jsonl"
        
        filepath = self.export_path / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            for match in matches:
                f.write(json.dumps(match, ensure_ascii=False) + '\n')
        
        logger.info("export.completed", format="jsonl", records=len(matches), path=str(filepath))
        return filepath
    
    def export_player_stats_analytics(
        self,
        players: List[Dict],
        filename: Optional[str] = None
    ) -> Path:
        """
        Export player stats optimized for analytics
        Includes derived metrics and flattened structure
        """
        if not filename:
            filename = f"player_stats_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        filepath = self.export_path / filename
        
        # Process and enrich data
        processed = []
        for player in players:
            # Convert string numbers to floats for analytics
            processed_player = {
                "player": player.get("player"),
                "team": player.get("team"),
                "agent": player.get("agent"),
                "rating": float(player.get("rating", 0) or 0),
                "acs": float(player.get("acs", 0) or 0),
                "kills": int(player.get("kills", 0) or 0),
                "deaths": int(player.get("deaths", 0) or 0),
                "assists": int(player.get("assists", 0) or 0),
                "kd_ratio": float(player.get("kills", 0) or 0) / max(float(player.get("deaths", 1) or 1), 1),
                "kast_pct": float(player.get("kast", "0%").replace("%", "")) if player.get("kast") else 0,
                "adr": float(player.get("adr", 0) or 0),
                "headshot_pct": float(player.get("headshot_pct", "0%").replace("%", "")) if player.get("headshot_pct") else 0,
                "fk": int(player.get("fk", 0) or 0),
                "fd": int(player.get("fd", 0) or 0),
                "fd_diff": int(player.get("fk", 0) or 0) - int(player.get("fd", 0) or 0),
            }
            processed.append(processed_player)
        
        # Export to CSV
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            if processed:
                writer = csv.DictWriter(f, fieldnames=processed[0].keys())
                writer.writeheader()
                writer.writerows(processed)
        
        logger.info("export.analytics_completed", format="csv", records=len(processed), path=str(filepath))
        return filepath
    
    def create_export_bundle(
        self,
        data_type: str,
        data: List[Dict],
        formats: List[str] = None
    ) -> Dict[str, Path]:
        """
        Create export bundle in multiple formats
        """
        formats = formats or ["csv", "jsonl"]
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        exports = {}
        
        for fmt in formats:
            if fmt not in self.SUPPORTED_FORMATS:
                logger.warning("export.unsupported_format", format=fmt)
                continue
            
            try:
                if fmt == "csv":
                    exports[fmt] = self.export_matches_csv(data, f"{data_type}_{timestamp}.csv")
                elif fmt == "parquet":
                    result = self.export_matches_parquet(data, f"{data_type}_{timestamp}.parquet")
                    if result:
                        exports[fmt] = result
                elif fmt == "jsonl":
                    exports[fmt] = self.export_matches_jsonl(data, f"{data_type}_{timestamp}.jsonl")
            except Exception as e:
                logger.error("export.failed", format=fmt, error=str(e))
        
        return exports


# Global instance
exporter = DataExporter()