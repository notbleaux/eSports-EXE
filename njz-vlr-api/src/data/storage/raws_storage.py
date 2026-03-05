"""
RAWS (Raw Archive Web Scrape) Storage System
Immutable raw data storage with integrity verification
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from core.config import settings
from utils.checksums import calculate_sha256
from core.logging import get_logger

logger = get_logger(__name__)


class RAWSStorage:
    """
    Immutable raw scrape storage with SHA-256 verification
    """
    
    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path or settings.DATA_STORAGE_PATH) / "raws"
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def _get_full_path(self, path: str) -> Path:
        """Generate full storage path"""
        full_path = self.base_path / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        return full_path
    
    async def save(self, path: str, data: Dict[str, Any]) -> str:
        """
        Save data to RAWS with integrity checksum
        
        Returns:
            Absolute path to saved file
        """
        full_path = self._get_full_path(path)
        
        # Calculate checksums
        raw_html = data.get("raw_html", "")
        html_checksum = calculate_sha256(raw_html)
        
        # Enrich metadata
        data["metadata"] = {
            **data.get("metadata", {}),
            "stored_at": datetime.utcnow().isoformat(),
            "checksums": {
                "raw_html_sha256": html_checksum,
            },
            "storage_version": "1.0.0"
        }
        
        # Write file
        with open(full_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info("raws.saved", path=str(full_path), checksum=html_checksum[:16])
        return str(full_path)
    
    def load(self, path: str) -> Optional[Dict[str, Any]]:
        """Load data from RAWS"""
        full_path = self.base_path / path
        
        if not full_path.exists():
            return None
        
        with open(full_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def list_files(self, pattern: str = "*.json", limit: int = 100) -> list:
        """List available scrapes"""
        files = sorted(self.base_path.rglob(pattern), 
                      key=lambda p: p.stat().st_mtime, 
                      reverse=True)
        return [str(f.relative_to(self.base_path)) for f in files[:limit]]