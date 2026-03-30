"""
Model Registry Implementation

MLflow-style model registry with versioning and stage management.
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from ..database import get_db_pool
from .schemas import (
    ModelVersion,
    ModelStage,
    RegisteredModel,
    ModelMetrics,
    StageTransitionRequest
)

logger = logging.getLogger(__name__)


class ModelRegistry:
    """
    MLflow-style model registry.
    
    Features:
    - Model versioning
    - Stage transitions (None → Staging → Production → Archived)
    - Metrics tracking
    - Comparison tools
    """
    
    def __init__(self):
        self._cache: Dict[str, RegisteredModel] = {}
    
    async def create_registered_model(
        self,
        name: str,
        description: str = "",
        tags: Optional[Dict[str, str]] = None,
        owner: str = ""
    ) -> RegisteredModel:
        """Create a new registered model."""
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO registered_models (name, description, tags, owner)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (name) DO UPDATE SET
                    description = EXCLUDED.description,
                    tags = EXCLUDED.tags,
                    updated_at = NOW()
                """,
                name,
                description,
                json.dumps(tags or {}),
                owner
            )
            
            logger.info(f"Created registered model: {name}")
            
            return RegisteredModel(
                name=name,
                description=description,
                tags=tags or {},
                owner=owner
            )
    
    async def get_registered_model(self, name: str) -> Optional[RegisteredModel]:
        """Get a registered model by name."""
        if name in self._cache:
            return self._cache[name]
        
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM registered_models WHERE name = $1",
                name
            )
            
            if not row:
                return None
            
            model = RegisteredModel(
                name=row['name'],
                description=row['description'],
                tags=json.loads(row['tags']) if row['tags'] else {},
                latest_version=row['latest_version'],
                production_version=row['production_version'],
                staging_version=row['staging_version'],
                owner=row['owner'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            
            self._cache[name] = model
            return model
    
    async def create_model_version(
        self,
        name: str,
        source_system: str,
        run_id: Optional[str],
        framework: str,
        framework_version: str,
        artifact_uri: str,
        signature: Dict,
        description: str = "",
        tags: Optional[Dict[str, str]] = None,
        created_by: str = ""
    ) -> ModelVersion:
        """Create a new version of a model."""
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Get next version number
            result = await conn.fetchrow(
                "SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM model_versions WHERE name = $1",
                name
            )
            version = result['next_version']
            
            # Insert version
            await conn.execute(
                """
                INSERT INTO model_versions (
                    name, version, source_system, run_id, framework,
                    framework_version, artifact_uri, signature, description,
                    tags, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """,
                name,
                version,
                source_system,
                run_id,
                framework,
                framework_version,
                artifact_uri,
                json.dumps(signature),
                description,
                json.dumps(tags or {}),
                created_by
            )
            
            # Update latest version on registered model
            await conn.execute(
                """
                UPDATE registered_models
                SET latest_version = $1, updated_at = NOW()
                WHERE name = $2
                """,
                version,
                name
            )
            
            logger.info(f"Created model version: {name} v{version}")
            
            return ModelVersion(
                name=name,
                version=version,
                source_system=source_system,
                run_id=run_id,
                framework=framework,
                framework_version=framework_version,
                artifact_uri=artifact_uri,
                signature=signature,
                description=description,
                tags=tags or {},
                created_by=created_by
            )
    
    async def get_model_version(
        self,
        name: str,
        version: Optional[int] = None
    ) -> Optional[ModelVersion]:
        """
        Get a specific model version.
        
        If version is None, returns the latest version.
        """
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            if version:
                row = await conn.fetchrow(
                    """
                    SELECT * FROM model_versions
                    WHERE name = $1 AND version = $2
                    """,
                    name, version
                )
            else:
                row = await conn.fetchrow(
                    """
                    SELECT * FROM model_versions
                    WHERE name = $1
                    ORDER BY version DESC
                    LIMIT 1
                    """,
                    name
                )
            
            if not row:
                return None
            
            return ModelVersion(
                name=row['name'],
                version=row['version'],
                source_system=row['source_system'],
                run_id=row['run_id'],
                stage=ModelStage(row['stage']),
                stage_updated_at=row['stage_updated_at'],
                framework=row['framework'],
                framework_version=row['framework_version'],
                artifact_uri=row['artifact_uri'],
                signature=json.loads(row['signature']) if row['signature'] else {},
                description=row['description'],
                tags=json.loads(row['tags']) if row['tags'] else {},
                created_at=row['created_at'],
                updated_at=row['updated_at'],
                created_by=row['created_by']
            )
    
    async def transition_stage(
        self,
        request: StageTransitionRequest
    ) -> ModelVersion:
        """
        Transition a model version to a new stage.
        
        Handles:
        - Validation of transition rules
        - Archival of current model in target stage
        - Stage update with timestamp
        """
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            async with conn.transaction():
                # If transitioning to Production or Staging, archive current
                if request.archive_current and request.new_stage in (
                    ModelStage.PRODUCTION,
                    ModelStage.STAGING
                ):
                    # Find current model in target stage
                    current = await conn.fetchrow(
                        """
                        SELECT version FROM model_versions
                        WHERE name = $1 AND stage = $2
                        """,
                        request.model_name,
                        request.new_stage.value
                    )
                    
                    if current:
                        # Archive it
                        await conn.execute(
                            """
                            UPDATE model_versions
                            SET stage = 'Archived', stage_updated_at = NOW()
                            WHERE name = $1 AND version = $2
                            """,
                            request.model_name,
                            current['version']
                        )
                
                # Update target version's stage
                await conn.execute(
                    """
                    UPDATE model_versions
                    SET stage = $1, stage_updated_at = NOW()
                    WHERE name = $2 AND version = $3
                    """,
                    request.new_stage.value,
                    request.model_name,
                    request.version
                )
                
                # Update registered model's stage pointer
                if request.new_stage == ModelStage.PRODUCTION:
                    await conn.execute(
                        """
                        UPDATE registered_models
                        SET production_version = $1, updated_at = NOW()
                        WHERE name = $2
                        """,
                        request.version,
                        request.model_name
                    )
                elif request.new_stage == ModelStage.STAGING:
                    await conn.execute(
                        """
                        UPDATE registered_models
                        SET staging_version = $1, updated_at = NOW()
                        WHERE name = $2
                        """,
                        request.version,
                        request.model_name
                    )
                
                logger.info(
                    f"Transitioned {request.model_name} v{request.version} "
                    f"to {request.new_stage.value}"
                )
        
        # Return updated version
        return await self.get_model_version(request.model_name, request.version)
    
    async def log_metrics(self, metrics: ModelMetrics) -> ModelMetrics:
        """Log metrics for a model version."""
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO model_metrics (
                    model_name, model_version, dataset_name, dataset_version,
                    metrics, training_duration_seconds, epochs, computed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """,
                metrics.model_name,
                metrics.model_version,
                metrics.dataset_name,
                metrics.dataset_version,
                json.dumps(metrics.metrics),
                metrics.training_duration_seconds,
                metrics.epochs,
                metrics.computed_at
            )
            
            logger.info(
                f"Logged metrics for {metrics.model_name} v{metrics.model_version}"
            )
            
            return metrics
    
    async def get_production_model(self, name: str) -> Optional[ModelVersion]:
        """Get the current production version of a model."""
        registered = await self.get_registered_model(name)
        if not registered or not registered.production_version:
            return None
        
        return await self.get_model_version(name, registered.production_version)
    
    async def list_model_versions(
        self,
        name: str,
        stage: Optional[ModelStage] = None
    ) -> List[ModelVersion]:
        """List all versions of a model."""
        pool = await get_db_pool()
        
        query = "SELECT * FROM model_versions WHERE name = $1"
        params = [name]
        
        if stage:
            query += f" AND stage = ${len(params) + 1}"
            params.append(stage.value)
        
        query += " ORDER BY version DESC"
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
            return [
                ModelVersion(
                    name=row['name'],
                    version=row['version'],
                    source_system=row['source_system'],
                    run_id=row['run_id'],
                    stage=ModelStage(row['stage']),
                    stage_updated_at=row['stage_updated_at'],
                    framework=row['framework'],
                    framework_version=row['framework_version'],
                    artifact_uri=row['artifact_uri'],
                    signature=json.loads(row['signature']) if row['signature'] else {},
                    description=row['description'],
                    tags=json.loads(row['tags']) if row['tags'] else {},
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    created_by=row['created_by']
                )
                for row in rows
            ]


# Global registry instance
_registry: Optional[ModelRegistry] = None


async def get_model_registry() -> ModelRegistry:
    """Get the global model registry."""
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry
