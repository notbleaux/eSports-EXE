---
name: sator-extraction
description: "Web scraping and data extraction for 4NJZ4 TENET Platform from VLR.gg and other sources. USE FOR: VLR.gg scraping, epoch harvesting, match parsing, ethical rate-limited extraction. DO NOT USE FOR: unethical scraping, high-volume extraction without limits, non-esports data sources."
license: MIT
metadata:
  author: SATOR Team
  version: "2.1.0"
---

# SATOR Extraction

> **ETHICAL EXTRACTION REQUIRED**
>
> Location: `packages/shared/axiom-esports-data/extraction/`
> All scraping must respect rate limits and source terms of service.
> VLR.gg: 2 requests per second maximum.
> Use KnownRecordRegistry to prevent duplicate extraction.

## Triggers

Activate this skill when user wants to:
- Scrape esports data from VLR.gg
- Implement epoch-based data harvesting
- Parse match data from HTML/JSON
- Create extraction pipelines for new data sources
- Work with KnownRecordRegistry for deduplication
- Implement content drift detection

## Rules

1. **Rate Limiting** — Maximum 2 req/sec for VLR.gg
2. **Ethical Scraping** — Respect robots.txt and terms of service
3. **KnownRecordRegistry** — Check before extracting to prevent duplicates
4. **Content Drift Detection** — Detect and handle source data changes
5. **3-Epoch System** — Foundation (2020-2023), Recent (H1 2024), Current (H2 2024+)
6. **Checksum Validation** — SHA-256 for integrity verification

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| VLR.gg scraping | Aggressive/high-volume scraping |
| Epoch-based harvesting | Real-time streaming extraction |
| Match data parsing | Personal data extraction |
| Content drift detection | Bypassing anti-bot measures |
| Ethical rate-limited extraction | Violating terms of service |
| Cross-reference validation | Unauthorized data access |

## Project Structure

```
packages/shared/axiom-esports-data/extraction/
├── src/
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── epoch_harvester.py    # Main epoch harvester
│   │   ├── vlr_client.py         # VLR.gg HTTP client
│   │   └── pandascore_client.py  # Pandascore API client
│   ├── parsers/
│   │   ├── __init__.py
│   │   ├── match_parser.py       # Parse match pages
│   │   ├── player_parser.py      # Parse player stats
│   │   └── team_parser.py        # Parse team data
│   ├── bridges/
│   │   ├── __init__.py
│   │   └── extraction_bridge.py  # Map to KCRITR schema
│   └── registry/
│       ├── __init__.py
│       └── known_record_registry.py
├── tests/
│   └── test_extraction.py
└── requirements.txt
```

## VLR Client

```python
import aiohttp
import asyncio
from typing import Optional
from datetime import datetime

class VLRClient:
    """Ethical VLR.gg client with rate limiting."""
    
    BASE_URL = "https://www.vlr.gg"
    RATE_LIMIT = 2.0  # requests per second
    
    def __init__(self):
        self._last_request: Optional[float] = None
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self._session = aiohttp.ClientSession(
            headers={
                'User-Agent': 'SATOR-Analytics/1.0 (Research Project)',
                'Accept': 'text/html,application/xhtml+xml',
            }
        )
        return self
    
    async def __aexit__(self, *args):
        if self._session:
            await self._session.close()
    
    async def _throttle(self) -> None:
        """Enforce rate limit."""
        if self._last_request:
            elapsed = asyncio.get_event_loop().time() - self._last_request
            min_interval = 1.0 / self.RATE_LIMIT
            if elapsed < min_interval:
                await asyncio.sleep(min_interval - elapsed)
        self._last_request = asyncio.get_event_loop().time()
    
    async def fetch_match(self, match_id: str) -> str:
        """Fetch match page HTML."""
        await self._throttle()
        url = f"{self.BASE_URL}/{match_id}"
        
        async with self._session.get(url) as response:
            response.raise_for_status()
            return await response.text()
    
    async def fetch_match_list(self, page: int = 1) -> str:
        """Fetch match list page."""
        await self._throttle()
        url = f"{self.BASE_URL}/matches/?page={page}"
        
        async with self._session.get(url) as response:
            response.raise_for_status()
            return await response.text()
```

## Pandascore Client (Official API)

```python
import aiohttp
import os
from typing import Optional, List, Dict

class PandascoreClient:
    """
    Official Pandascore API client for legal esports data access.
    Requires PANDASCORE_API_KEY environment variable.
    """
    
    BASE_URL = "https://api.pandascore.co"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('PANDASCORE_API_KEY')
        if not self.api_key:
            raise ValueError("PANDASCORE_API_KEY required")
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self._session = aiohttp.ClientSession(
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Accept': 'application/json',
            }
        )
        return self
    
    async def __aexit__(self, *args):
        if self._session:
            await self._session.close()
    
    async def get_matches(self, **params) -> List[Dict]:
        """Fetch matches from Pandascore API."""
        url = f"{self.BASE_URL}/valorant/matches"
        
        async with self._session.get(url, params=params) as response:
            response.raise_for_status()
            return await response.json()
    
    async def get_match(self, match_id: int) -> Dict:
        """Fetch specific match details."""
        url = f"{self.BASE_URL}/valorant/matches/{match_id}"
        
        async with self._session.get(url) as response:
            response.raise_for_status()
            return await response.json()
```

## Epoch Harvester

```python
from enum import Enum
from datetime import datetime, timedelta
from typing import List, Optional
import asyncio

class ExtractionEpoch(Enum):
    """Three-epoch temporal extraction system."""
    EPOCH_1 = 1  # Foundation: 2020-01-01 to 2023-12-31
    EPOCH_2 = 2  # Recent: 2024-01-01 to 2024-06-30
    EPOCH_3 = 3  # Current: 2024-07-01 to present

EPOCH_RANGES = {
    ExtractionEpoch.EPOCH_1: (datetime(2020, 1, 1), datetime(2023, 12, 31)),
    ExtractionEpoch.EPOCH_2: (datetime(2024, 1, 1), datetime(2024, 6, 30)),
    ExtractionEpoch.EPOCH_3: (datetime(2024, 7, 1), datetime.now()),
}

class EpochHarvester:
    """Harvest matches for a specific epoch."""
    
    def __init__(self, epoch: ExtractionEpoch, registry: 'KnownRecordRegistry'):
        self.epoch = epoch
        self.registry = registry
        self.start_date, self.end_date = EPOCH_RANGES[epoch]
    
    async def harvest(
        self,
        mode: str = "delta",
        max_matches: Optional[int] = None
    ) -> List[dict]:
        """
        Harvest matches for this epoch.
        
        Args:
            mode: "delta" for incremental, "full" for complete refresh
            max_matches: Limit number of matches (None for all)
        """
        matches = []
        page = 1
        
        async with VLRClient() as client:
            while True:
                if max_matches and len(matches) >= max_matches:
                    break
                
                # Fetch match list page
                html = await client.fetch_match_list(page)
                match_links = self._parse_match_links(html)
                
                if not match_links:
                    break
                
                for match_id in match_links:
                    if max_matches and len(matches) >= max_matches:
                        break
                    
                    # Check registry for delta mode
                    if mode == "delta" and self.registry.is_known(match_id):
                        continue
                    
                    # Fetch and parse match
                    try:
                        match_html = await client.fetch_match(match_id)
                        match_data = self._parse_match(match_html, match_id)
                        
                        # Validate epoch
                        match_date = match_data.get('date')
                        if not self._in_epoch(match_date):
                            continue
                        
                        matches.append(match_data)
                        self.registry.mark_known(match_id, match_data)
                        
                    except Exception as e:
                        # Log error, continue with next match
                        print(f"Error processing {match_id}: {e}")
                        continue
                
                page += 1
                
                # Safety break for endless loops
                if page > 1000:
                    break
        
        return matches
    
    def _in_epoch(self, match_date: datetime) -> bool:
        """Check if match date falls within this epoch."""
        return self.start_date <= match_date <= self.end_date
```

## Known Record Registry

```python
import json
import hashlib
from typing import Optional
from datetime import datetime
from pathlib import Path

class KnownRecordRegistry:
    """
    Track known records to prevent duplicate extraction.
    Uses checksum-based deduplication.
    """
    
    def __init__(self, registry_file: str = ".extraction_registry.json"):
        self.registry_file = Path(registry_file)
        self._records: dict = {}
        self._load()
    
    def _load(self) -> None:
        """Load registry from disk."""
        if self.registry_file.exists():
            with open(self.registry_file, 'r') as f:
                self._records = json.load(f)
    
    def _save(self) -> None:
        """Save registry to disk."""
        with open(self.registry_file, 'w') as f:
            json.dump(self._records, f, indent=2)
    
    def is_known(self, record_id: str, data: Optional[dict] = None) -> bool:
        """
        Check if record is known.
        If data provided, also verify checksum hasn't changed.
        """
        if record_id not in self._records:
            return False
        
        if data is not None:
            current_checksum = self._compute_checksum(data)
            stored_checksum = self._records[record_id].get('checksum')
            return current_checksum == stored_checksum
        
        return True
    
    def mark_known(self, record_id: str, data: dict) -> None:
        """Mark record as known with checksum."""
        self._records[record_id] = {
            'checksum': self._compute_checksum(data),
            'extracted_at': datetime.now().isoformat(),
        }
        self._save()
    
    @staticmethod
    def _compute_checksum(data: dict) -> str:
        """Compute SHA-256 checksum."""
        canonical = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical.encode()).hexdigest()
```

## Commands

```bash
cd packages/shared/axiom-esports-data

# Run epoch harvester
python -m extraction.src.scrapers.epoch_harvester --epoch=1 --mode=delta

# Run full harvest for all epochs
python -m extraction.src.scrapers.epoch_harvester --epoch=all --mode=full

# Test extraction
pytest extraction/tests/ -v

# Validate extraction integrity
python -m extraction.scripts.validate_extraction
```

## New in 2.1.0

- Pandascore API client for official data access
- Enhanced VLR client with rate limiting
- KnownRecordRegistry for deduplication
- Content drift detection patterns

## References

- [AXIOM.md](../../../docs/AXIOM.md)
- [DATA_DICTIONARY.md](../../../docs/DATA_DICTIONARY.md)
- [memory/CURRENT_FOCUS.md](../../../memory/CURRENT_FOCUS.md)
