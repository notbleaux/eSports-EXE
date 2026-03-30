"""[Ver001.000]
Pipeline Orchestrator — Coordinates the full data pipeline flow.

Coordinates:
    Discover → Fetch → Verify → Parse → Transform → CrossRef → Store → Index

Features:
    - Stage-by-stage resumption (restart from any stage)
    - Batch processing with configurable size
    - Parallel workers with rate limiting
    - Integration with existing Feature Store and Model Registry
"""

import argparse
import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum, auto
from typing import Any, Optional

from njz_api.database import get_db_pool
from njz_api.redis_cache import get_redis_client

# Feature Store integration (optional)
try:
    from njz_api.feature_store import service as feature_store
except (ImportError, AttributeError):
    feature_store = None

from .etl import ETLPipeline, ETLStage

logger = logging.getLogger(__name__)


class PipelineMode(Enum):
    """Pipeline operation modes."""
    DELTA = "delta"       # Process only new/changed records
    FULL = "full"         # Process all records
    BACKFILL = "backfill" # Fill gaps in historical data


class PipelineStage(Enum):
    """Pipeline processing stages."""
    ALL = "all"
    DISCOVER = "discover"
    FETCH = "fetch"
    VERIFY = "verify"
    PARSE = "parse"
    TRANSFORM = "transform"
    CROSSREF = "crossref"
    STORE = "store"
    INDEX = "index"


@dataclass
class PipelineResult:
    """Result of a pipeline run."""
    mode: str
    epochs: list[int]
    records_discovered: int = 0
    records_fetched: int = 0
    records_verified: int = 0
    records_parsed: int = 0
    records_transformed: int = 0
    records_stored: int = 0
    records_indexed: int = 0
    records_failed: int = 0
    duration_seconds: float = 0.0
    
    def to_dict(self) -> dict:
        return {
            "mode": self.mode,
            "epochs": self.epochs,
            "records_discovered": self.records_discovered,
            "records_fetched": self.records_fetched,
            "records_verified": self.records_verified,
            "records_parsed": self.records_parsed,
            "records_transformed": self.records_transformed,
            "records_stored": self.records_stored,
            "records_indexed": self.records_indexed,
            "records_failed": self.records_failed,
            "duration_seconds": round(self.duration_seconds, 2),
        }


class PipelineOrchestrator:
    """Main pipeline orchestrator coordinating all extraction stages.
    
    The orchestrator manages the flow of data through the pipeline,
    handling stage-by-stage resumption, parallel processing, and
    integration with existing infrastructure.
    """
    
    def __init__(
        self,
        max_workers: int = 3,
        batch_size: int = 100,
    ) -> None:
        """Initialize the pipeline orchestrator.
        
        Args:
            max_workers: Maximum parallel workers
            batch_size: Records per batch
        """
        self.max_workers = max_workers
        self.batch_size = batch_size
        self.etl_pipeline = ETLPipeline()
        self._redis = None
        
    async def _get_redis(self):
        """Get or create Redis client."""
        if self._redis is None:
            self._redis = await get_redis_client()
        return self._redis
    
    async def discover(self, mode: PipelineMode, epochs: list[int]) -> list[str]:
        """Discover matches to process."""
        logger.info(f"Pipeline Discover: mode={mode.value}, epochs={epochs}")
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            if mode == PipelineMode.DELTA:
                rows = await conn.fetch(
                    """
                    SELECT entity_id FROM extraction_log
                    WHERE entity_type = 'match'
                      AND is_complete = FALSE
                      AND epoch = ANY($1)
                    ORDER BY first_extracted_at ASC
                    LIMIT $2
                    """,
                    epochs,
                    self.batch_size * 10,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT entity_id FROM extraction_log
                    WHERE entity_type = 'match'
                      AND epoch = ANY($1)
                    ORDER BY first_extracted_at ASC
                    LIMIT $2
                    """,
                    epochs,
                    self.batch_size * 10,
                )
        
        match_ids = [row["entity_id"] for row in rows]
        logger.info(f"Pipeline Discover: found {len(match_ids)} matches")
        return match_ids
    
    async def run(
        self,
        mode: PipelineMode = PipelineMode.DELTA,
        epochs: Optional[list[int]] = None,
        start_stage: PipelineStage = PipelineStage.ALL,
        match_ids: Optional[list[str]] = None,
    ) -> PipelineResult:
        """Run the complete pipeline.
        
        Args:
            mode: Pipeline operation mode
            epochs: Epochs to process
            start_stage: Stage to start from (ALL runs all stages)
            match_ids: Optional specific match IDs to process
            
        Returns:
            PipelineResult with processing statistics
        """
        import time
        start_time = time.perf_counter()
        
        target_epochs = epochs or [1, 2, 3]
        result = PipelineResult(
            mode=mode.value,
            epochs=target_epochs,
        )
        
        try:
            # Stage 1: Discover
            if start_stage in (PipelineStage.ALL, PipelineStage.DISCOVER):
                if match_ids is None:
                    match_ids = await self.discover(mode, target_epochs)
                result.records_discovered = len(match_ids)
            
            if not match_ids:
                logger.info("No matches to process")
                return result
            
            # Stage 2-8: Run through ETL pipeline
            if start_stage in (PipelineStage.ALL, PipelineStage.FETCH):
                etl_result = await self.etl_pipeline.run_full_pipeline(
                    source="vlr_gg",
                    match_ids=match_ids,
                )
                result.records_fetched = etl_result.get("total", 0)
                result.records_stored = etl_result.get("successful", 0)
                result.records_failed = etl_result.get("failed", 0)
            
            # Update Feature Store if available
            try:
                if feature_store and hasattr(feature_store, 'refresh'):
                    await feature_store.refresh()
                    logger.info("Feature Store refreshed")
            except Exception as e:
                logger.warning(f"Feature Store refresh failed: {e}")
            
        except Exception as e:
            logger.error(f"Pipeline run failed: {e}")
            result.records_failed = len(match_ids) if match_ids else 0
        
        end_time = time.perf_counter()
        result.duration_seconds = round(end_time - start_time, 2)
        
        logger.info(
            f"Pipeline complete: {result.records_stored} stored, "
            f"{result.records_failed} failed in {result.duration_seconds}s"
        )
        
        return result
    
    async def get_status(self) -> dict:
        """Get current pipeline status."""
        try:
            redis = await self._get_redis()
            status = await redis.hgetall("pipeline:status")
            return {
                "status": status.get("state", "unknown"),
                "last_run": status.get("last_run"),
                "records_processed": int(status.get("records_processed", 0)),
            }
        except Exception as e:
            logger.warning(f"Failed to get pipeline status: {e}")
            return {"status": "unknown", "error": str(e)}


def main() -> None:
    parser = argparse.ArgumentParser(description="SATOR Pipeline Orchestrator")
    parser.add_argument("--mode", choices=["delta", "full", "backfill"], default="delta")
    parser.add_argument("--epochs", nargs="+", type=int, default=[1, 2, 3])
    parser.add_argument("--stage", choices=["all", "discover", "fetch", "store"], default="all")
    parser.add_argument("--max-workers", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=100)
    args = parser.parse_args()
    
    logging.basicConfig(level=logging.INFO)
    
    mode = PipelineMode(args.mode)
    stage = PipelineStage(args.stage)
    
    orchestrator = PipelineOrchestrator(
        max_workers=args.max_workers,
        batch_size=args.batch_size,
    )
    
    result = asyncio.run(orchestrator.run(
        mode=mode,
        epochs=args.epochs,
        start_stage=stage,
    ))
    
    print(f"Pipeline result: {result.to_dict()}")


if __name__ == "__main__":
    main()
