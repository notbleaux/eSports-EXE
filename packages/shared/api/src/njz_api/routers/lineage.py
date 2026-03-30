"""
Data Lineage API

Query and inspect data provenance and confidence scores.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..auth import require_auth
from ..database import get_db_pool

router = APIRouter(prefix="/v1/lineage", tags=["lineage"])


class LineageEntry(BaseModel):
    lineage_id: UUID
    source_system: str
    external_id: Optional[str]
    entity_type: str
    entity_id: Optional[UUID]
    confidence_score: float
    checksum: str
    parent_lineage_id: Optional[UUID]
    metadata: Dict[str, Any]
    created_at: datetime


class LineageSummary(BaseModel):
    total_entries: int
    by_source: Dict[str, int]
    by_entity_type: Dict[str, int]
    avg_confidence: float


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[LineageEntry])
async def get_entity_lineage(
    entity_type: str,
    entity_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    _=Depends(require_auth)
):
    """Get complete lineage history for an entity."""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT lineage_id, source_system, external_id, entity_type, entity_id,
                   confidence_score, checksum, parent_lineage_id, metadata, created_at
            FROM data_lineage
            WHERE entity_type = $1 AND entity_id = $2
            ORDER BY created_at DESC
            LIMIT $3
            """,
            entity_type, entity_id, limit
        )
        
        return [LineageEntry(**dict(row)) for row in rows]


@router.get("/summary", response_model=LineageSummary)
async def get_lineage_summary(
    source_system: Optional[str] = Query(None),
    _=Depends(require_auth)
):
    """Get summary statistics of lineage tracking."""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        # Build query conditions
        where_clause = ""
        params = []
        if source_system:
            where_clause = "WHERE source_system = $1"
            params.append(source_system)
        
        total = await conn.fetchval(
            f"SELECT COUNT(*) FROM data_lineage {where_clause}", *params
        )
        
        # By source
        by_source = await conn.fetch(
            f"""
            SELECT source_system, COUNT(*) as count
            FROM data_lineage
            {where_clause}
            GROUP BY source_system
            """,
            *params
        )
        
        # By entity type
        by_type = await conn.fetch(
            f"""
            SELECT entity_type, COUNT(*) as count
            FROM data_lineage
            {where_clause}
            GROUP BY entity_type
            """,
            *params
        )
        
        # Average confidence
        avg_conf = await conn.fetchval(
            f"SELECT AVG(confidence_score) FROM data_lineage {where_clause}",
            *params
        ) or 0.0
        
        return LineageSummary(
            total_entries=total,
            by_source={r['source_system']: r['count'] for r in by_source},
            by_entity_type={r['entity_type']: r['count'] for r in by_type},
            avg_confidence=round(avg_conf, 3)
        )


@router.get("/entry/{lineage_id}", response_model=LineageEntry)
async def get_lineage_entry(
    lineage_id: UUID,
    _=Depends(require_auth)
):
    """Get a specific lineage entry."""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT lineage_id, source_system, external_id, entity_type, entity_id,
                   confidence_score, checksum, parent_lineage_id, metadata, created_at
            FROM data_lineage
            WHERE lineage_id = $1
            """,
            lineage_id
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="Lineage entry not found")
        
        return LineageEntry(**dict(row))


@router.get("/tree/{lineage_id}", response_model=Dict[str, Any])
async def get_lineage_tree(
    lineage_id: UUID,
    include_children: bool = Query(True),
    _=Depends(require_auth)
):
    """Get lineage tree (ancestors and optionally descendants)."""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        # Get the entry
        entry = await conn.fetchrow(
            "SELECT * FROM data_lineage WHERE lineage_id = $1",
            lineage_id
        )
        
        if not entry:
            raise HTTPException(status_code=404, detail="Lineage entry not found")
        
        # Get ancestors
        ancestors = await conn.fetch(
            """
            WITH RECURSIVE ancestors AS (
                SELECT * FROM data_lineage WHERE lineage_id = $1
                UNION ALL
                SELECT dl.* FROM data_lineage dl
                JOIN ancestors a ON dl.lineage_id = a.parent_lineage_id
            )
            SELECT * FROM ancestors WHERE lineage_id != $1
            ORDER BY created_at ASC
            """,
            lineage_id
        )
        
        result = {
            "entry": dict(entry),
            "ancestors": [dict(a) for a in ancestors]
        }
        
        # Get descendants if requested
        if include_children:
            descendants = await conn.fetch(
                """
                WITH RECURSIVE descendants AS (
                    SELECT * FROM data_lineage WHERE lineage_id = $1
                    UNION ALL
                    SELECT dl.* FROM data_lineage dl
                    JOIN descendants d ON dl.parent_lineage_id = d.lineage_id
                )
                SELECT * FROM descendants WHERE lineage_id != $1
                ORDER BY created_at DESC
                """,
                lineage_id
            )
            result["descendants"] = [dict(d) for d in descendants]
        
        return result


@router.get("/confidence/{entity_type}/{entity_id}")
async def get_entity_confidence(
    entity_type: str,
    entity_id: UUID,
    _=Depends(require_auth)
):
    """Get confidence score breakdown for an entity."""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT 
                AVG(confidence_score) as avg_confidence,
                MAX(confidence_score) as max_confidence,
                MIN(confidence_score) as min_confidence,
                COUNT(*) as data_points,
                array_agg(DISTINCT source_system) as sources
            FROM data_lineage
            WHERE entity_type = $1 AND entity_id = $2
            """,
            entity_type, entity_id
        )
        
        if not row or row['data_points'] == 0:
            raise HTTPException(status_code=404, detail="No lineage data found")
        
        return {
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "avg_confidence": round(row['avg_confidence'], 3),
            "max_confidence": row['max_confidence'],
            "min_confidence": row['min_confidence'],
            "data_points": row['data_points'],
            "sources": row['sources']
        }


@router.get("/sources", response_model=List[Dict[str, Any]])
async def list_source_systems(
    active_only: bool = Query(True),
    _=Depends(require_auth)
):
    """List all source systems and their configurations."""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        query = "SELECT * FROM source_systems"
        if active_only:
            query += " WHERE is_active = TRUE"
        query += " ORDER BY system_name"
        
        rows = await conn.fetch(query)
        return [dict(row) for row in rows]
