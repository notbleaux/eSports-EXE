---
name: sator-python-pipeline
description: "Async Python data pipeline development for 4NJZ4 TENET Platform. USE FOR: ETL pipelines, async data processing, PostgreSQL with asyncpg, epoch-based extraction. Location: packages/shared/axiom-esports-data/. DO NOT USE FOR: synchronous Python scripts, non-SATOR data pipelines, general Python development."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# SATOR Python Pipeline

> **ASYNC-FIRST ARCHITECTURE**
>
> Location: `packages/shared/axiom-esports-data/`
> All data pipeline code must use async/await patterns.
> Use aiohttp for HTTP, asyncpg for PostgreSQL.
> Temporal epoch management is required for extraction.

## Triggers

Activate this skill when user wants to:
- Create or modify Python ETL pipelines
- Work with async data extraction
- Implement PostgreSQL data operations
- Create epoch-based data processing
- Build data orchestration workflows
- Work with TimescaleDB hypertables

## Rules

1. **Async-First** — Use `async`/`await` for all I/O operations
2. **Rate Limiting** — Respect source rate limits (VLR.gg: 2 req/sec)
3. **Temporal Epochs** — All extraction uses 3-epoch system
4. **Checksum Validation** — SHA-256 for data integrity
5. **Connection Pooling** — Use asyncpg with proper pool management
6. **Type Hints** — All functions must have type annotations

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| Async Python ETL pipelines | Synchronous data processing |
| PostgreSQL + asyncpg | SQLite, MySQL, ORM (SQLAlchemy) |
| TimescaleDB operations | Standard PostgreSQL only |
| Epoch-based extraction | Real-time streaming |
| Data orchestration | General Python scripts |
| Web scraping with ethics | Unethical/high-volume scraping |

## Project Structure

```
packages/shared/axiom-esports-data/
├── pipeline/
│   ├── orchestrator.py         # Main pipeline orchestrator
│   ├── coordinator.py          # Job coordination
│   └── workers/
│       ├── base_worker.py
│       └── match_worker.py
├── extraction/
│   ├── src/
│   │   ├── scrapers/
│   │   │   ├── epoch_harvester.py
│   │   │   └── vlr_client.py
│   │   ├── parsers/
│   │   │   └── match_parser.py
│   │   └── bridges/
│   │       └── extraction_bridge.py
│   └── requirements.txt
├── analytics/
│   └── src/
│       └── calculators/
├── infrastructure/
│   ├── migrations/             # SQL migrations
│   └── docker-compose.yml
└── api/
    └── src/
        └── database.py         # asyncpg connection pool
```

## Async Patterns

### HTTP Client with aiohttp

```python
import aiohttp
import asyncio
from typing import Optional

class VLRClient:
    def __init__(self, rate_limit: float = 2.0):
        self.rate_limit = rate_limit
        self._last_request: Optional[float] = None
    
    async def _throttle(self) -> None:
        """Respect rate limit between requests."""
        if self._last_request:
            elapsed = asyncio.get_event_loop().time() - self._last_request
            if elapsed < 1.0 / self.rate_limit:
                await asyncio.sleep(1.0 / self.rate_limit - elapsed)
        self._last_request = asyncio.get_event_loop().time()
    
    async def fetch_match(self, match_id: str) -> str:
        await self._throttle()
        async with aiohttp.ClientSession() as session:
            url = f"https://www.vlr.gg/{match_id}"
            async with session.get(url) as response:
                response.raise_for_status()
                return await response.text()
```

### PostgreSQL with asyncpg

```python
import asyncpg
from typing import Optional
import os

class DatabasePool:
    _pool: Optional[asyncpg.Pool] = None
    
    @classmethod
    async def get_pool(cls) -> asyncpg.Pool:
        if cls._pool is None:
            cls._pool = await asyncpg.create_pool(
                os.getenv('DATABASE_URL'),
                min_size=1,
                max_size=5,
                command_timeout=60,
            )
        return cls._pool
    
    @classmethod
    async def close(cls) -> None:
        if cls._pool:
            await cls._pool.close()
            cls._pool = None

# Usage
async def insert_match(match_data: dict) -> None:
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO matches (match_id, data, checksum)
            VALUES ($1, $2, $3)
            ON CONFLICT (match_id) DO NOTHING
            """,
            match_data['match_id'],
            match_data,
            match_data['checksum']
        )
```

## Epoch-Based Extraction

```python
from enum import Enum
from datetime import datetime, timedelta

class ExtractionEpoch(Enum):
    """Three-epoch temporal extraction system."""
    EPOCH_1 = 1  # Foundation: 2020-01-01 to 2023-12-31
    EPOCH_2 = 2  # Recent: 2024-01-01 to 2024-06-30
    EPOCH_3 = 3  # Current: 2024-07-01 to present

EPOCH_BOUNDARIES = {
    ExtractionEpoch.EPOCH_1: (datetime(2020, 1, 1), datetime(2023, 12, 31)),
    ExtractionEpoch.EPOCH_2: (datetime(2024, 1, 1), datetime(2024, 6, 30)),
    ExtractionEpoch.EPOCH_3: (datetime(2024, 7, 1), datetime.now()),
}

class EpochHarvester:
    def __init__(self, epoch: ExtractionEpoch):
        self.epoch = epoch
        self.start_date, self.end_date = EPOCH_BOUNDARIES[epoch]
    
    async def harvest(self, mode: str = "delta") -> list:
        """
        Harvest matches for this epoch.
        
        Args:
            mode: "delta" for incremental, "full" for complete refresh
        """
        # Implementation
        pass
```

## Checksum Validation

```python
import hashlib
import json

def compute_checksum(data: dict) -> str:
    """Compute SHA-256 checksum for data integrity."""
    canonical = json.dumps(data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical.encode()).hexdigest()

def verify_checksum(data: dict, expected_checksum: str) -> bool:
    """Verify data matches expected checksum."""
    return compute_checksum(data) == expected_checksum
```

## Pipeline Orchestrator

```python
import asyncio
from typing import List

class PipelineOrchestrator:
    def __init__(self):
        self.workers: List[BaseWorker] = []
    
    def register_worker(self, worker: BaseWorker) -> None:
        self.workers.append(worker)
    
    async def run(self, epochs: List[ExtractionEpoch]) -> None:
        """Run pipeline for specified epochs."""
        tasks = []
        for epoch in epochs:
            for worker in self.workers:
                tasks.append(worker.process_epoch(epoch))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle results and errors
        for result in results:
            if isinstance(result, Exception):
                # Log error, alert on critical failures
                pass
```

## TimescaleDB Operations

```python
async def create_hypertable(conn: asyncpg.Connection) -> None:
    """Create TimescaleDB hypertable for time-series data."""
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS player_performance (
            time TIMESTAMPTZ NOT NULL,
            player_id TEXT NOT NULL,
            match_id TEXT NOT NULL,
            sim_rating FLOAT,
            raw_acs FLOAT,
            PRIMARY KEY (time, player_id, match_id)
        );
    """)
    
    await conn.execute("""
        SELECT create_hypertable('player_performance', 'time', 
            chunk_time_interval => INTERVAL '90 days',
            if_not_exists => TRUE
        );
    """)
```

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
VLR_RATE_LIMIT=2.0
DATA_RETENTION_DAYS=730

# Optional
PANDASCORE_API_KEY=pc_live_xxxxxxxx
```

## Testing

```bash
cd packages/shared

# Run pipeline tests
pytest axiom-esports-data/pipeline/tests/ -v

# Run extraction tests
pytest axiom-esports-data/extraction/tests/ -v

# Test with specific epoch
python -m axiom-esports-data.extraction.src.scrapers.epoch_harvester --epoch=1 --mode=delta
```

## References

- [AXIOM.md](../../../docs/AXIOM.md)
- [DATA_DICTIONARY.md](../../../docs/DATA_DICTIONARY.md)
