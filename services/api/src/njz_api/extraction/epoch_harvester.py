"""[Ver001.000]
Epoch Harvester — Async VLR.gg extraction across three temporal epochs.

Epoch I:   2020-12-03 → 2022-12-31  (historic, lower confidence)
Epoch II:  2023-01-01 → 2025-12-31  (mature dataset, high confidence)
Epoch III: 2026-01-01 → present      (current, incremental updates)

Coordinated Harvest Protocol
-----------------------------
The harvester operates under a shared contract with the KnownRecordRegistry
to prevent re-scraping already processed matches.
"""
import argparse
import asyncio
import logging
import os
from datetime import date, datetime
from typing import Optional

import aiohttp
import asyncpg

from njz_api.database import get_db_pool
from njz_api.redis_cache import get_redis_client
from .vlr_resilient_client import VLRResilientClient

logger = logging.getLogger(__name__)

EPOCHS = {
    1: {"start": date(2020, 12, 3), "end": date(2022, 12, 31), "confidence_floor": 50.0},
    2: {"start": date(2023, 1, 1), "end": date(2025, 12, 31), "confidence_floor": 75.0},
    3: {"start": date(2026, 1, 1), "end": date.today(), "confidence_floor": 100.0},
}

VLR_MATCH_LIST_URL = "https://www.vlr.gg/matches/results"


class VLREpochHarvester:
    """
    Coordinates extraction across three epochs using async workers.
    Supports full and delta modes.
    """

    def __init__(
        self,
        mode: str = "delta",
        epochs: Optional[list[int]] = None,
        max_concurrent: int = 3,
    ) -> None:
        self.mode = mode
        self.target_epochs = epochs or [1, 2, 3]
        self.max_concurrent = max_concurrent
        self._redis = None
        self._processed_key = "vlr:harvester:processed"

    async def _get_redis(self):
        """Get or create Redis client."""
        if self._redis is None:
            self._redis = await get_redis_client()
        return self._redis

    async def _is_processed(self, match_id: str) -> bool:
        """Check if match was already processed via Redis."""
        try:
            redis = await self._get_redis()
            return await redis.sismember(self._processed_key, match_id)
        except Exception as e:
            logger.warning(f"Redis check failed for {match_id}: {e}")
            return False

    async def _mark_processed(self, match_id: str, checksum: str) -> None:
        """Mark match as processed in Redis."""
        try:
            redis = await self._get_redis()
            await redis.sadd(self._processed_key, match_id)
            # Also store checksum for change detection
            await redis.hset(f"vlr:checksums", match_id, checksum)
        except Exception as e:
            logger.warning(f"Redis mark failed for {match_id}: {e}")

    async def harvest_epoch(
        self,
        epoch_num: int,
        client: VLRResilientClient,
    ) -> int:
        """Harvest a single epoch. Returns count of records processed."""
        config = EPOCHS[epoch_num]
        logger.info(
            "Starting Epoch %d extraction: %s → %s (mode=%s)",
            epoch_num, config["start"], config["end"], self.mode
        )
        records_processed = 0
        records_skipped = 0

        match_ids = await self._get_target_match_ids(epoch_num, config)
        logger.info("Epoch %d: %d matches to process", epoch_num, len(match_ids))

        for match_id in match_ids:
            # Check if already processed
            if await self._is_processed(match_id):
                records_skipped += 1
                continue

            url = f"https://www.vlr.gg/{match_id}"
            try:
                response = await client.ethical_fetch(url)

                if response.status == 200:
                    # Store in database via raw data repository
                    await self._store_raw_data(
                        match_id=match_id,
                        raw_html=response.raw_html,
                        checksum=response.checksum,
                        epoch=epoch_num,
                    )
                    # Mark as processed
                    await self._mark_processed(match_id, response.checksum)
                    records_processed += 1
                else:
                    logger.warning(
                        "Non-200 response (%d) for match %s — not stored",
                        response.status, match_id,
                    )

            except Exception as exc:
                logger.error("Failed to harvest match %s: %s", match_id, exc)

        logger.info(
            "Epoch %d complete: %d stored, %d skipped (already known)",
            epoch_num, records_processed, records_skipped,
        )
        return records_processed

    async def _store_raw_data(
        self,
        match_id: str,
        raw_html: str,
        checksum: str,
        epoch: int,
    ) -> None:
        """Store raw extraction data in database."""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO raw_extractions 
                (vlr_match_id, raw_html, checksum, epoch, source_url, extracted_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (vlr_match_id) DO UPDATE SET
                    raw_html = EXCLUDED.raw_html,
                    checksum = EXCLUDED.checksum,
                    epoch = EXCLUDED.epoch,
                    extracted_at = NOW()
                """,
                match_id,
                raw_html,
                checksum,
                epoch,
                f"https://www.vlr.gg/{match_id}",
            )

    async def _get_target_match_ids(self, epoch_num: int, config: dict) -> list[str]:
        """Return list of match IDs for this epoch (delta or full)."""
        start: date = config["start"]
        end: date = config["end"]

        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                if self.mode == "delta":
                    rows = await conn.fetch(
                        """
                        SELECT entity_id
                        FROM extraction_log
                        WHERE source = 'vlr_gg'
                          AND entity_type = 'match'
                          AND is_complete = FALSE
                          AND first_extracted_at >= $1
                          AND first_extracted_at <  $2
                        ORDER BY first_extracted_at ASC
                        """,
                        datetime.combine(start, datetime.min.time()),
                        datetime.combine(end, datetime.max.time()),
                    )
                else:
                    rows = await conn.fetch(
                        """
                        SELECT entity_id
                        FROM extraction_log
                        WHERE source = 'vlr_gg'
                          AND entity_type = 'match'
                          AND first_extracted_at >= $1
                          AND first_extracted_at <  $2
                        ORDER BY first_extracted_at ASC
                        """,
                        datetime.combine(start, datetime.min.time()),
                        datetime.combine(end, datetime.max.time()),
                    )
                return [row["entity_id"] for row in rows]
        except Exception as exc:
            logger.error(
                "Failed to fetch match IDs for epoch %d from DB: %s", epoch_num, exc
            )
            return []

    async def run(self) -> dict[int, int]:
        """Run harvest across all target epochs concurrently."""
        async with aiohttp.ClientSession() as session:
            client = VLRResilientClient(
                rate_limit_seconds=2.0,
                max_concurrent=self.max_concurrent,
                session=session,
            )
            tasks = [
                self.harvest_epoch(epoch_num, client)
                for epoch_num in self.target_epochs
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        totals = {}
        for epoch_num, result in zip(self.target_epochs, results):
            if isinstance(result, Exception):
                logger.error("Epoch %d failed: %s", epoch_num, result)
                totals[epoch_num] = 0
            else:
                totals[epoch_num] = result
        return totals


def main() -> None:
    parser = argparse.ArgumentParser(description="SATOR Epoch Harvester")
    parser.add_argument("--mode", choices=["full", "delta"], default="delta")
    parser.add_argument("--epochs", nargs="+", type=int, default=[1, 2, 3])
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    harvester = VLREpochHarvester(mode=args.mode, epochs=args.epochs)
    totals = asyncio.run(harvester.run())
    for epoch_num, count in totals.items():
        logger.info("Epoch %d: %d records harvested", epoch_num, count)


if __name__ == "__main__":
    main()
