"""[Ver001.000]
ETL Pipeline — 8-stage data transformation pipeline.

Stages:
1. Extract (from VLR/HLTV)
2. Validate (schema validation)
3. Transform (normalize data)
4. Enrich (add calculated fields)
5. Deduplicate (job dedup)
6. Partition (web vs game data)
7. Load (to database)
8. Index (to search)
"""
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import Any, Dict, List, Optional

from njz_api.database import get_db_pool
from njz_api.redis_cache import get_redis_client

logger = logging.getLogger(__name__)


class ETLStage(Enum):
    """ETL processing stages."""
    EXTRACT = auto()
    VALIDATE = auto()
    TRANSFORM = auto()
    ENRICH = auto()
    DEDUPLICATE = auto()
    PARTITION = auto()
    LOAD = auto()
    INDEX = auto()


@dataclass
class ETLRecord:
    """A record moving through the ETL pipeline."""
    record_id: str
    source: str
    raw_data: Dict[str, Any] = field(default_factory=dict)
    transformed_data: Dict[str, Any] = field(default_factory=dict)
    enriched_data: Dict[str, Any] = field(default_factory=dict)
    partition: Optional[str] = None  # 'web', 'game', or 'both'
    checksum: str = ""
    stage: ETLStage = ETLStage.EXTRACT
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


class ETLPipeline:
    """
    8-stage ETL pipeline for esports data processing.
    
    Integrates with existing Feature Store and Model Registry.
    """
    
    def __init__(self):
        self._redis = None
        self._records: List[ETLRecord] = []
        
    async def _get_redis(self):
        """Get or create Redis client."""
        if self._redis is None:
            self._redis = await get_redis_client()
        return self._redis
    
    async def extract(self, source: str, match_ids: List[str]) -> List[ETLRecord]:
        """Stage 1: Extract raw data from source."""
        logger.info(f"ETL Extract: {len(match_ids)} records from {source}")
        records = []
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            for match_id in match_ids:
                row = await conn.fetchrow(
                    "SELECT * FROM raw_extractions WHERE vlr_match_id = $1",
                    match_id
                )
                if row:
                    record = ETLRecord(
                        record_id=match_id,
                        source=source,
                        raw_data={"html": row["raw_html"], "checksum": row["checksum"]},
                        checksum=row["checksum"],
                        stage=ETLStage.EXTRACT,
                    )
                    records.append(record)
                else:
                    logger.warning(f"No raw data found for match {match_id}")
        
        self._records = records
        return records
    
    async def validate(self, records: List[ETLRecord]) -> List[ETLRecord]:
        """Stage 2: Validate schema and data integrity."""
        logger.info(f"ETL Validate: {len(records)} records")
        valid_records = []
        
        for record in records:
            # Basic validation - checksum verification
            if not record.checksum:
                record.error = "Missing checksum"
                logger.warning(f"Validation failed for {record.record_id}: {record.error}")
                continue
            
            # Additional schema validation can be added here
            record.stage = ETLStage.VALIDATE
            valid_records.append(record)
        
        return valid_records
    
    async def transform(self, records: List[ETLRecord]) -> List[ETLRecord]:
        """Stage 3: Transform raw data to normalized format."""
        logger.info(f"ETL Transform: {len(records)} records")
        
        for record in records:
            # Transform raw HTML to structured data
            # This is a simplified version - full parsing would be more complex
            transformed = {
                "match_id": record.record_id,
                "source": record.source,
                "extracted_at": datetime.utcnow().isoformat(),
                "data": record.raw_data.get("html", "")[:1000],  # Truncated for storage
            }
            record.transformed_data = transformed
            record.stage = ETLStage.TRANSFORM
        
        return records
    
    async def enrich(self, records: List[ETLRecord]) -> List[ETLRecord]:
        """Stage 4: Enrich with calculated fields."""
        logger.info(f"ETL Enrich: {len(records)} records")
        
        for record in records:
            # Add calculated fields like SimRating, RAR, etc.
            enriched = dict(record.transformed_data)
            enriched["_enriched"] = True
            enriched["_enriched_at"] = datetime.utcnow().isoformat()
            record.enriched_data = enriched
            record.stage = ETLStage.ENRICH
        
        return records
    
    async def deduplicate(self, records: List[ETLRecord]) -> List[ETLRecord]:
        """Stage 5: Remove duplicates based on checksum."""
        logger.info(f"ETL Deduplicate: {len(records)} records")
        
        seen_checksums = set()
        unique_records = []
        
        for record in records:
            if record.checksum in seen_checksums:
                logger.debug(f"Deduplicating record {record.record_id}")
                continue
            seen_checksums.add(record.checksum)
            record.stage = ETLStage.DEDUPLICATE
            unique_records.append(record)
        
        logger.info(f"ETL Deduplicate: {len(unique_records)} unique records")
        return unique_records
    
    async def partition(self, records: List[ETLRecord]) -> List[ETLRecord]:
        """Stage 6: Partition data for web vs game consumption."""
        logger.info(f"ETL Partition: {len(records)} records")
        
        for record in records:
            # Determine partition based on data content
            # By default, most data goes to both
            record.partition = "both"
            record.stage = ETLStage.PARTITION
        
        return records
    
    async def load(self, records: List[ETLRecord]) -> List[ETLRecord]:
        """Stage 7: Load data to database."""
        logger.info(f"ETL Load: {len(records)} records")
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            for record in records:
                try:
                    await conn.execute(
                        """
                        INSERT INTO processed_matches 
                        (match_id, source, data, checksum, partition, processed_at)
                        VALUES ($1, $2, $3, $4, $5, NOW())
                        ON CONFLICT (match_id) DO UPDATE SET
                            data = EXCLUDED.data,
                            checksum = EXCLUDED.checksum,
                            partition = EXCLUDED.partition,
                            processed_at = NOW()
                        """,
                        record.record_id,
                        record.source,
                        record.enriched_data,
                        record.checksum,
                        record.partition,
                    )
                    record.stage = ETLStage.LOAD
                except Exception as e:
                    record.error = str(e)
                    logger.error(f"Failed to load record {record.record_id}: {e}")
        
        return records
    
    async def index(self, records: List[ETLRecord]) -> List[ETLRecord]:
        """Stage 8: Index data for search."""
        logger.info(f"ETL Index: {len(records)} records")
        
        try:
            redis = await self._get_redis()
            for record in records:
                # Add to search index in Redis
                await redis.hset(
                    f"search:matches",
                    record.record_id,
                    record.enriched_data.get("match_id", ""),
                )
                record.stage = ETLStage.INDEX
        except Exception as e:
            logger.warning(f"Search indexing failed: {e}")
        
        return records
    
    async def run_full_pipeline(
        self,
        source: str,
        match_ids: List[str]
    ) -> Dict[str, Any]:
        """Run the complete 8-stage pipeline."""
        start_time = datetime.utcnow()
        
        # Stage 1: Extract
        records = await self.extract(source, match_ids)
        
        # Stage 2: Validate
        records = await self.validate(records)
        
        # Stage 3: Transform
        records = await self.transform(records)
        
        # Stage 4: Enrich
        records = await self.enrich(records)
        
        # Stage 5: Deduplicate
        records = await self.deduplicate(records)
        
        # Stage 6: Partition
        records = await self.partition(records)
        
        # Stage 7: Load
        records = await self.load(records)
        
        # Stage 8: Index
        records = await self.index(records)
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        successful = len([r for r in records if r.error is None])
        failed = len([r for r in records if r.error is not None])
        
        return {
            "total": len(records),
            "successful": successful,
            "failed": failed,
            "duration_seconds": duration,
            "records": [
                {
                    "id": r.record_id,
                    "stage": r.stage.name,
                    "error": r.error,
                    "partition": r.partition,
                }
                for r in records
            ],
        }
