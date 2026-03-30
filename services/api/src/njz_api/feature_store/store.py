"""
Feature Store Implementation

Dual-store architecture:
- Online: Redis (low latency, recent features)
- Offline: PostgreSQL/TimescaleDB (historical, training data)
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID
import time

import asyncpg
from ..database import get_db_pool
from ..redis_cache import redis_client
from .schemas import (
    FeatureDefinition,
    FeatureValue,
    FeatureType,
    FeatureStoreType,
    OnlineFeatureResponse,
    OfflineFeatureQuery,
    FeatureVector
)
from .registry import get_feature_registry

logger = logging.getLogger(__name__)


class FeatureStore:
    """
    Tecton-style feature store with online/offline separation.
    
    Online Store (Redis):
    - Low latency (< 10ms)
    - Current feature values only
    - TTL-based expiration
    
    Offline Store (PostgreSQL/TimescaleDB):
    - Historical feature values
    - Point-in-time correctness
    - Training data generation
    """
    
    def __init__(self):
        self._redis = None
    
    async def _get_redis(self):
        """Get Redis connection."""
        if self._redis is None:
            from redis import asyncio as aioredis
            self._redis = aioredis.from_url(
                "redis://localhost:6379",
                encoding="utf-8",
                decode_responses=True
            )
        return self._redis
    
    def _make_key(
        self,
        entity_type: str,
        entity_id: UUID,
        feature_name: str
    ) -> str:
        """Create Redis key for a feature."""
        return f"feature:{entity_type}:{entity_id}:{feature_name}"
    
    async def write_feature(
        self,
        value: FeatureValue,
        definition: Optional[FeatureDefinition] = None
    ) -> FeatureValue:
        """
        Write a feature value to the store(s).
        
        Writes to online and/or offline based on feature definition.
        """
        if definition is None:
            registry = await get_feature_registry()
            definition = await registry.get_feature_definition(value.feature_name)
            if not definition:
                raise ValueError(f"Feature {value.feature_name} not registered")
        
        # Write to offline store (always, for history)
        if definition.store_type in (FeatureStoreType.OFFLINE, FeatureStoreType.BOTH):
            await self._write_offline(value)
        
        # Write to online store (if configured)
        if definition.store_type in (FeatureStoreType.ONLINE, FeatureStoreType.BOTH):
            await self._write_online(value, definition.ttl_seconds)
        
        return value
    
    async def _write_online(self, value: FeatureValue, ttl_seconds: Optional[int]):
        """Write feature to Redis online store."""
        try:
            redis = await self._get_redis()
            key = self._make_key(value.entity_type, value.entity_id, value.feature_name)
            
            # Serialize value
            feature_data = {
                "value": json.dumps(value.value),
                "value_type": value.value_type.value,
                "version": value.feature_definition_version,
                "computed_at": value.computed_at.isoformat(),
                "source": value.source_system
            }
            
            # Set with TTL
            ttl = ttl_seconds or 86400  # Default 24 hours
            await redis.hset(key, mapping=feature_data)
            await redis.expire(key, ttl)
            
            logger.debug(f"Wrote online feature: {key}")
            
        except Exception as e:
            logger.error(f"Failed to write online feature: {e}")
            # Don't fail the request, offline store has the data
    
    async def _write_offline(self, value: FeatureValue):
        """Write feature to PostgreSQL offline store."""
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO feature_values (
                    feature_name, entity_id, entity_type, value, value_type,
                    feature_definition_version, computed_at, event_timestamp,
                    ingestion_timestamp, source_system, source_id, is_valid
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                """,
                value.feature_name,
                value.entity_id,
                value.entity_type,
                json.dumps(value.value),
                value.value_type.value,
                value.feature_definition_version,
                value.computed_at,
                value.event_timestamp,
                value.ingestion_timestamp,
                value.source_system,
                value.source_id,
                value.is_valid
            )
            
            logger.debug(f"Wrote offline feature: {value.feature_name}")
    
    async def get_online_features(
        self,
        entity_type: str,
        entity_id: UUID,
        feature_names: List[str]
    ) -> OnlineFeatureResponse:
        """
        Get features from online store (Redis).
        
        Low latency lookup for real-time inference.
        """
        start_time = time.time()
        redis = await self._get_redis()
        
        features = {}
        missing = []
        cache_hits = 0
        
        for name in feature_names:
            key = self._make_key(entity_type, entity_id, name)
            
            try:
                data = await redis.hgetall(key)
                
                if data:
                    features[name] = json.loads(data["value"])
                    cache_hits += 1
                else:
                    missing.append(name)
                    
            except Exception as e:
                logger.error(f"Redis error for {key}: {e}")
                missing.append(name)
        
        lookup_time = (time.time() - start_time) * 1000
        
        return OnlineFeatureResponse(
            entity_id=entity_id,
            entity_type=entity_type,
            features=features,
            lookup_time_ms=lookup_time,
            cache_hit=(cache_hits == len(feature_names)),
            missing_features=missing
        )
    
    async def get_offline_features(
        self,
        query: OfflineFeatureQuery
    ) -> List[FeatureValue]:
        """
        Get historical features from offline store.
        
        For training data generation with point-in-time correctness.
        """
        pool = await get_db_pool()
        
        # Build query
        params = [query.entity_type, query.start_time, query.end_time]
        feature_filter = ""
        
        if query.feature_names:
            placeholders = [f"${i + 4}" for i in range(len(query.feature_names))]
            feature_filter = f"AND feature_name IN ({', '.join(placeholders)})"
            params.extend(query.feature_names)
        
        entity_filter = ""
        if query.entity_ids:
            placeholders = [f"${i + len(params) + 1}" for i in range(len(query.entity_ids))]
            entity_filter = f"AND entity_id IN ({', '.join(placeholders)})"
            params.extend(query.entity_ids)
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT *
                FROM feature_values
                WHERE entity_type = $1
                  AND computed_at >= $2
                  AND computed_at <= $3
                  {feature_filter}
                  {entity_filter}
                ORDER BY computed_at DESC
                """,
                *params
            )
            
            return [
                FeatureValue(
                    feature_name=row['feature_name'],
                    entity_id=row['entity_id'],
                    entity_type=row['entity_type'],
                    value=json.loads(row['value']),
                    value_type=row['value_type'],
                    feature_definition_version=row['feature_definition_version'],
                    computed_at=row['computed_at'],
                    event_timestamp=row['event_timestamp'],
                    ingestion_timestamp=row['ingestion_timestamp'],
                    source_system=row['source_system'],
                    source_id=row['source_id'],
                    is_valid=row['is_valid']
                )
                for row in rows
            ]
    
    async def get_feature_vector(
        self,
        entity_type: str,
        entity_id: UUID,
        feature_names: List[str],
        timestamp: Optional[datetime] = None
    ) -> FeatureVector:
        """
        Get a feature vector for an entity.
        
        For ML model inference. Uses online store for current values,
        or offline store for historical point-in-time values.
        """
        if timestamp is None or timestamp >= datetime.utcnow() - timedelta(minutes=5):
            # Use online store for recent/current features
            response = await self.get_online_features(entity_type, entity_id, feature_names)
            
            return FeatureVector(
                entity_id=entity_id,
                entity_type=entity_type,
                timestamp=datetime.utcnow(),
                features=response.features,
                feature_names=list(response.features.keys()),
                missing_features=response.missing_features,
                imputed_features={}
            )
        else:
            # Use offline store for historical features
            query = OfflineFeatureQuery(
                entity_type=entity_type,
                entity_ids=[entity_id],
                feature_names=feature_names,
                start_time=timestamp - timedelta(seconds=1),
                end_time=timestamp + timedelta(seconds=1)
            )
            
            values = await self.get_offline_features(query)
            
            features = {}
            missing = []
            
            for name in feature_names:
                # Get most recent value before timestamp
                matching = [v for v in values if v.feature_name == name]
                if matching:
                    features[name] = matching[0].value
                else:
                    missing.append(name)
            
            return FeatureVector(
                entity_id=entity_id,
                entity_type=entity_type,
                timestamp=timestamp,
                features=features,
                feature_names=list(features.keys()),
                missing_features=missing,
                imputed_features={}
            )
    
    async def backfill_features(
        self,
        feature_name: str,
        entity_type: str,
        start_time: datetime,
        end_time: datetime
    ) -> int:
        """
        Backfill features from source systems.
        
        Re-computes and stores features for a time range.
        """
        # This would integrate with data pipeline
        logger.info(f"Backfilling {feature_name} for {entity_type} from {start_time} to {end_time}")
        # Implementation depends on specific feature computation logic
        return 0


# Global store instance
_store: Optional[FeatureStore] = None


async def get_feature_store() -> FeatureStore:
    """Get the global feature store."""
    global _store
    if _store is None:
        _store = FeatureStore()
    return _store
