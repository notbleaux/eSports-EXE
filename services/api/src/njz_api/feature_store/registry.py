"""
Feature Registry

Central registry for feature definitions with versioning.
Similar to Tecton's feature registry but simplified.
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from ..database import get_db_pool
from .schemas import FeatureDefinition, FeatureView

logger = logging.getLogger(__name__)


class FeatureRegistry:
    """
    Central registry for all feature definitions.
    
    Provides:
    - Feature versioning
    - Feature discovery
    - Dependency tracking
    - Schema validation
    """
    
    def __init__(self):
        self._cache: Dict[str, FeatureDefinition] = {}
        self._view_cache: Dict[str, FeatureView] = {}
    
    async def register_feature(
        self,
        definition: FeatureDefinition,
        skip_if_exists: bool = False
    ) -> FeatureDefinition:
        """
        Register a new feature definition.
        
        Args:
            definition: Feature definition to register
            skip_if_exists: If True, don't error if feature exists
            
        Returns:
            Registered feature definition
        """
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Check if feature exists
            existing = await conn.fetchrow(
                """
                SELECT name, version FROM feature_definitions
                WHERE name = $1
                ORDER BY created_at DESC
                LIMIT 1
                """,
                definition.name
            )
            
            if existing and skip_if_exists:
                logger.info(f"Feature {definition.name} already exists, skipping")
                return await self.get_feature_definition(definition.name)
            
            # Insert new definition
            await conn.execute(
                """
                INSERT INTO feature_definitions (
                    name, version, entity_type, feature_type,
                    store_type, ttl_seconds, description, tags,
                    nullability, default_value, validation_rules,
                    owner, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
                """,
                definition.name,
                definition.version,
                definition.entity_type,
                definition.feature_type.value,
                definition.store_type.value,
                definition.ttl_seconds,
                definition.description,
                json.dumps(definition.tags),
                definition.nullability,
                json.dumps(definition.default_value) if definition.default_value else None,
                json.dumps(definition.validation_rules),
                definition.owner,
                datetime.utcnow()
            )
            
            logger.info(f"Registered feature: {definition.name} v{definition.version}")
            
            # Update cache
            self._cache[definition.name] = definition
            
            return definition
    
    async def get_feature_definition(
        self,
        name: str,
        version: Optional[str] = None
    ) -> Optional[FeatureDefinition]:
        """
        Get a feature definition by name.
        
        Args:
            name: Feature name
            version: Specific version (None = latest)
            
        Returns:
            Feature definition or None
        """
        # Check cache first
        if name in self._cache and not version:
            return self._cache[name]
        
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            if version:
                row = await conn.fetchrow(
                    """
                    SELECT * FROM feature_definitions
                    WHERE name = $1 AND version = $2
                    """,
                    name, version
                )
            else:
                row = await conn.fetchrow(
                    """
                    SELECT * FROM feature_definitions
                    WHERE name = $1
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    name
                )
            
            if not row:
                return None
            
            definition = FeatureDefinition(
                name=row['name'],
                version=row['version'],
                entity_type=row['entity_type'],
                feature_type=row['feature_type'],
                store_type=row['store_type'],
                ttl_seconds=row['ttl_seconds'],
                description=row['description'],
                tags=json.loads(row['tags']) if row['tags'] else [],
                nullability=row['nullability'],
                default_value=json.loads(row['default_value']) if row['default_value'] else None,
                validation_rules=json.loads(row['validation_rules']) if row['validation_rules'] else {},
                owner=row['owner'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            
            # Update cache
            if not version:
                self._cache[name] = definition
            
            return definition
    
    async def list_features(
        self,
        entity_type: Optional[str] = None,
        feature_type: Optional[str] = None,
        tag: Optional[str] = None
    ) -> List[FeatureDefinition]:
        """List all feature definitions with optional filtering."""
        pool = await get_db_pool()
        
        query = """
            SELECT DISTINCT ON (name) *
            FROM feature_definitions
            WHERE 1=1
        """
        params = []
        
        if entity_type:
            query += f" AND entity_type = ${len(params) + 1}"
            params.append(entity_type)
        
        if feature_type:
            query += f" AND feature_type = ${len(params) + 1}"
            params.append(feature_type)
        
        if tag:
            query += f" AND tags @> ${len(params) + 1}::jsonb"
            params.append(json.dumps([tag]))
        
        query += " ORDER BY name, created_at DESC"
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
            return [
                FeatureDefinition(
                    name=row['name'],
                    version=row['version'],
                    entity_type=row['entity_type'],
                    feature_type=row['feature_type'],
                    store_type=row['store_type'],
                    ttl_seconds=row['ttl_seconds'],
                    description=row['description'],
                    tags=json.loads(row['tags']) if row['tags'] else [],
                    nullability=row['nullability'],
                    default_value=json.loads(row['default_value']) if row['default_value'] else None,
                    validation_rules=json.loads(row['validation_rules']) if row['validation_rules'] else {},
                    owner=row['owner'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                )
                for row in rows
            ]
    
    async def register_feature_view(self, view: FeatureView) -> FeatureView:
        """Register a feature view."""
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO feature_views (
                    name, entity_type, features, materialize_online,
                    materialize_offline, refresh_interval_minutes,
                    lookback_window_days, description, owner, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (name) DO UPDATE SET
                    features = EXCLUDED.features,
                    materialize_online = EXCLUDED.materialize_online,
                    materialize_offline = EXCLUDED.materialize_offline,
                    refresh_interval_minutes = EXCLUDED.refresh_interval_minutes,
                    updated_at = NOW()
                """,
                view.name,
                view.entity_type,
                json.dumps(view.features),
                view.materialize_online,
                view.materialize_offline,
                view.refresh_interval_minutes,
                view.lookback_window_days,
                view.description,
                view.owner,
                datetime.utcnow()
            )
            
            self._view_cache[view.name] = view
            logger.info(f"Registered feature view: {view.name}")
            
            return view
    
    async def get_feature_view(self, name: str) -> Optional[FeatureView]:
        """Get a feature view by name."""
        if name in self._view_cache:
            return self._view_cache[name]
        
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM feature_views WHERE name = $1",
                name
            )
            
            if not row:
                return None
            
            view = FeatureView(
                name=row['name'],
                entity_type=row['entity_type'],
                features=json.loads(row['features']),
                materialize_online=row['materialize_online'],
                materialize_offline=row['materialize_offline'],
                refresh_interval_minutes=row['refresh_interval_minutes'],
                lookback_window_days=row['lookback_window_days'],
                description=row['description'],
                owner=row['owner'],
                created_at=row['created_at']
            )
            
            self._view_cache[name] = view
            return view
    
    async def validate_feature_exists(self, name: str) -> bool:
        """Check if a feature exists in the registry."""
        definition = await self.get_feature_definition(name)
        return definition is not None


# Global registry instance
_registry: Optional[FeatureRegistry] = None


async def get_feature_registry() -> FeatureRegistry:
    """Get the global feature registry."""
    global _registry
    if _registry is None:
        _registry = FeatureRegistry()
    return _registry
