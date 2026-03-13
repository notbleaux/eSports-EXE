"""
Database Access Layer — Implemented Query Functions for FastAPI Routes

This module provides the actual database query implementations that were
stubs in the original db.py file.

[Ver001.000]
"""
import logging
from typing import Any, Optional
from datetime import datetime, timedelta
import json

from api.src.db_manager import db

logger = logging.getLogger(__name__)


# ============================================================================
# PLAYER QUERIES
# ============================================================================

async def get_player_record(player_id: str) -> Optional[dict]:
    """
    Fetch a single player's most recent performance record.
    
    Args:
        player_id: UUID string of the player
        
    Returns:
        Player record dict or None if not found
    """
    pool = await db.get_pool()
    if not pool:
        logger.warning("Database pool not available")
        return None
    
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT 
                    player_id,
                    name,
                    team,
                    region,
                    role,
                    kills,
                    deaths,
                    acs,
                    adr,
                    kast_pct,
                    role_adjusted_value,
                    replacement_level,
                    rar_score,
                    investment_grade,
                    headshot_pct,
                    first_blood,
                    clutch_wins,
                    agent,
                    economy_rating,
                    adjusted_kill_value,
                    sim_rating,
                    age,
                    peak_age_estimate,
                    career_stage,
                    match_id,
                    map_name,
                    tournament,
                    patch_version,
                    realworld_time,
                    data_source,
                    extraction_timestamp,
                    confidence_tier,
                    separation_flag
                FROM player_performance 
                WHERE player_id = $1 
                ORDER BY realworld_time DESC 
                LIMIT 1
                """,
                player_id
            )
            
            if row:
                result = dict(row)
                # Convert datetime to ISO format for JSON serialization
                if result.get('realworld_time'):
                    result['realworld_time'] = result['realworld_time'].isoformat()
                if result.get('extraction_timestamp'):
                    result['extraction_timestamp'] = result['extraction_timestamp'].isoformat()
                return result
            return None
            
    except Exception as e:
        logger.error(f"Error fetching player {player_id}: {e}")
        return None


async def get_player_stats_aggregated(player_id: str) -> Optional[dict]:
    """
    Get aggregated stats for a player across all matches.
    
    Returns career averages and totals.
    """
    pool = await db.get_pool()
    if not pool:
        return None
    
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT 
                    player_id,
                    name,
                    team,
                    region,
                    role,
                    COUNT(*) as total_maps,
                    ROUND(AVG(kills), 2) as avg_kills,
                    ROUND(AVG(deaths), 2) as avg_deaths,
                    ROUND(AVG(acs), 2) as avg_acs,
                    ROUND(AVG(adr), 2) as avg_adr,
                    ROUND(AVG(kast_pct), 2) as avg_kast,
                    ROUND(AVG(rar_score), 4) as avg_rar,
                    ROUND(AVG(sim_rating), 4) as avg_sim_rating,
                    MAX(investment_grade) as peak_grade,
                    MIN(realworld_time) as first_match,
                    MAX(realworld_time) as last_match
                FROM player_performance 
                WHERE player_id = $1 
                GROUP BY player_id, name, team, region, role
                """,
                player_id
            )
            
            if row:
                result = dict(row)
                if result.get('first_match'):
                    result['first_match'] = result['first_match'].isoformat()
                if result.get('last_match'):
                    result['last_match'] = result['last_match'].isoformat()
                return result
            return None
            
    except Exception as e:
        logger.error(f"Error aggregating stats for player {player_id}: {e}")
        return None


async def get_player_list(
    region: Optional[str] = None,
    role: Optional[str] = None,
    min_maps: int = 50,
    grade: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    List players with filtering and pagination.
    
    Returns:
        Tuple of (players_list, total_count)
    """
    pool = await db.get_pool()
    if not pool:
        logger.warning("Database pool not available")
        return [], 0
    
    try:
        # Build WHERE clause dynamically
        where_conditions = ["1=1"]
        params = []
        param_idx = 1
        
        if region:
            where_conditions.append(f"region = ${param_idx}")
            params.append(region)
            param_idx += 1
        
        if role:
            where_conditions.append(f"role = ${param_idx}")
            params.append(role)
            param_idx += 1
        
        if grade:
            where_conditions.append(f"investment_grade = ${param_idx}")
            params.append(grade)
            param_idx += 1
        
        where_sql = " AND ".join(where_conditions)
        
        async with pool.acquire() as conn:
            # Get total count
            count_sql = f"""
                SELECT COUNT(DISTINCT player_id) 
                FROM player_performance 
                WHERE {where_sql}
                GROUP BY player_id 
                HAVING COUNT(*) >= ${param_idx}
            """
            count_params = params + [min_maps]
            
            total_row = await conn.fetchrow(count_sql, *count_params)
            total = total_row[0] if total_row else 0
            
            # Get paginated results with latest record per player
            query_sql = f"""
                WITH latest_records AS (
                    SELECT DISTINCT ON (player_id)
                        player_id,
                        name,
                        team,
                        region,
                        role,
                        kills,
                        deaths,
                        acs,
                        adr,
                        kast_pct,
                        rar_score,
                        investment_grade,
                        sim_rating,
                        match_id,
                        map_name,
                        realworld_time,
                        confidence_tier,
                        COUNT(*) OVER (PARTITION BY player_id) as map_count
                    FROM player_performance 
                    WHERE {where_sql}
                    ORDER BY player_id, realworld_time DESC
                )
                SELECT * FROM latest_records
                WHERE map_count >= ${param_idx}
                ORDER BY sim_rating DESC NULLS LAST
                LIMIT ${param_idx + 1} OFFSET ${param_idx + 2}
            """
            query_params = params + [min_maps, limit, offset]
            
            rows = await conn.fetch(query_sql, *query_params)
            
            results = []
            for row in rows:
                result = dict(row)
                if result.get('realworld_time'):
                    result['realworld_time'] = result['realworld_time'].isoformat()
                results.append(result)
            
            return results, total
            
    except Exception as e:
        logger.error(f"Error fetching player list: {e}")
        return [], 0


# ============================================================================
# MATCH QUERIES
# ============================================================================

async def get_match_record(match_id: str) -> Optional[dict]:
    """
    Fetch match metadata and all player performances.
    
    Returns:
        Match dict with nested players list
    """
    pool = await db.get_pool()
    if not pool:
        return None
    
    try:
        async with pool.acquire() as conn:
            # Get match metadata from first row
            meta_row = await conn.fetchrow(
                """
                SELECT 
                    match_id,
                    tournament,
                    patch_version,
                    MIN(realworld_time) as match_date
                FROM player_performance 
                WHERE match_id = $1 
                GROUP BY match_id, tournament, patch_version
                """,
                match_id
            )
            
            if not meta_row:
                return None
            
            # Get all player performances for this match
            players = await conn.fetch(
                """
                SELECT 
                    player_id,
                    name,
                    team,
                    role,
                    kills,
                    deaths,
                    acs,
                    adr,
                    kast_pct,
                    rar_score,
                    investment_grade,
                    agent,
                    map_name
                FROM player_performance 
                WHERE match_id = $1 
                ORDER BY team, acs DESC
                """,
                match_id
            )
            
            match_data = dict(meta_row)
            match_data['match_date'] = match_data['match_date'].isoformat()
            match_data['players'] = [dict(p) for p in players]
            
            return match_data
            
    except Exception as e:
        logger.error(f"Error fetching match {match_id}: {e}")
        return None


async def get_recent_matches(limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    """
    Get list of recent matches with summary stats.
    """
    pool = await db.get_pool()
    if not pool:
        return [], 0
    
    try:
        async with pool.acquire() as conn:
            # Get total unique matches
            total_row = await conn.fetchval(
                "SELECT COUNT(DISTINCT match_id) FROM player_performance"
            )
            
            # Get recent matches
            rows = await conn.fetch(
                """
                SELECT 
                    match_id,
                    tournament,
                    patch_version,
                    MIN(realworld_time) as match_date,
                    COUNT(DISTINCT player_id) as player_count,
                    COUNT(DISTINCT map_name) as map_count
                FROM player_performance 
                GROUP BY match_id, tournament, patch_version
                ORDER BY MIN(realworld_time) DESC
                LIMIT $1 OFFSET $2
                """,
                limit, offset
            )
            
            results = []
            for row in rows:
                result = dict(row)
                result['match_date'] = result['match_date'].isoformat()
                results.append(result)
            
            return results, total_row or 0
            
    except Exception as e:
        logger.error(f"Error fetching recent matches: {e}")
        return [], 0


# ============================================================================
# ANALYTICS QUERIES
# ============================================================================

async def get_leaderboard(metric: str = "sim_rating", limit: int = 10) -> list[dict]:
    """
    Get top players by a specific metric.
    
    Args:
        metric: One of 'sim_rating', 'acs', 'rar_score', 'kast_pct'
        limit: Number of players to return
    """
    pool = await db.get_pool()
    if not pool:
        return []
    
    # Validate metric to prevent SQL injection
    valid_metrics = {'sim_rating', 'acs', 'rar_score', 'kast_pct', 'adr'}
    if metric not in valid_metrics:
        metric = 'sim_rating'
    
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                WITH ranked AS (
                    SELECT DISTINCT ON (player_id)
                        player_id,
                        name,
                        team,
                        region,
                        role,
                        {metric},
                        investment_grade,
                        realworld_time,
                        COUNT(*) OVER (PARTITION BY player_id) as map_count
                    FROM player_performance 
                    WHERE {metric} IS NOT NULL
                    ORDER BY player_id, realworld_time DESC
                )
                SELECT * FROM ranked
                WHERE map_count >= 50
                ORDER BY {metric} DESC NULLS LAST
                LIMIT $1
                """,
                limit
            )
            
            results = []
            for row in rows:
                result = dict(row)
                if result.get('realworld_time'):
                    result['realworld_time'] = result['realworld_time'].isoformat()
                results.append(result)
            
            return results
            
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        return []


async def get_regional_stats() -> list[dict]:
    """
    Get aggregated stats by region.
    """
    pool = await db.get_pool()
    if not pool:
        return []
    
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    region,
                    COUNT(DISTINCT player_id) as player_count,
                    COUNT(*) as total_maps,
                    ROUND(AVG(acs), 2) as avg_acs,
                    ROUND(AVG(rar_score), 4) as avg_rar,
                    ROUND(AVG(sim_rating), 4) as avg_sim_rating
                FROM player_performance 
                WHERE region IS NOT NULL
                GROUP BY region
                ORDER BY player_count DESC
                """
            )
            
            return [dict(row) for row in rows]
            
    except Exception as e:
        logger.error(f"Error fetching regional stats: {e}")
        return []


# ============================================================================
# SATOR LAYER QUERIES (Visualization Data)
# ============================================================================

async def get_sator_events(match_id: str, round_number: int) -> list[dict]:
    """
    Fetch SATOR Layer 1 events for a specific round.
    (Hotstreaks, key moments)
    """
    pool = await db.get_pool()
    if not pool:
        return []
    
    try:
        async with pool.acquire() as conn:
            # This would query the sator_layer_1 table
            # For now, return empty (table may not be populated)
            rows = await conn.fetch(
                """
                SELECT 
                    event_id,
                    player_id,
                    event_type,
                    timestamp,
                    description
                FROM sator_layer_1_events 
                WHERE match_id = $1 AND round_number = $2
                ORDER BY timestamp
                """,
                match_id, round_number
            )
            
            return [dict(row) for row in rows]
            
    except Exception as e:
        logger.error(f"Error fetching SATOR events: {e}")
        return []


async def get_rotas_trails(match_id: str, round_number: int) -> list[dict]:
    """
    Fetch ROTAS Layer 5 rotation trails for a round.
    """
    pool = await db.get_pool()
    if not pool:
        return []
    
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    trail_id,
                    player_id,
                    path_data,
                    start_time,
                    end_time
                FROM rotas_layer_5_trails 
                WHERE match_id = $1 AND round_number = $2
                ORDER BY start_time
                """,
                match_id, round_number
            )
            
            results = []
            for row in rows:
                result = dict(row)
                # Parse JSON path data if stored as string
                if result.get('path_data') and isinstance(result['path_data'], str):
                    result['path_data'] = json.loads(result['path_data'])
                results.append(result)
            
            return results
            
    except Exception as e:
        logger.error(f"Error fetching ROTAS trails: {e}")
        return []


# ============================================================================
# COLLECTION/PIPELINE STATUS
# ============================================================================

async def get_collection_status() -> dict:
    """
    Get data collection pipeline status.
    """
    pool = await db.get_pool()
    if not pool:
        return {"error": "Database unavailable"}
    
    try:
        async with pool.acquire() as conn:
            # Total records
            total_records = await conn.fetchval(
                "SELECT COUNT(*) FROM player_performance"
            )
            
            # Records in last 24 hours
            recent_records = await conn.fetchval(
                """
                SELECT COUNT(*) FROM player_performance 
                WHERE extraction_timestamp > NOW() - INTERVAL '24 hours'
                """
            )
            
            # Unique players
            unique_players = await conn.fetchval(
                "SELECT COUNT(DISTINCT player_id) FROM player_performance"
            )
            
            # Unique matches
            unique_matches = await conn.fetchval(
                "SELECT COUNT(DISTINCT match_id) FROM player_performance"
            )
            
            # Data sources breakdown
            sources = await conn.fetch(
                """
                SELECT data_source, COUNT(*) as count 
                FROM player_performance 
                GROUP BY data_source
                ORDER BY count DESC
                """
            )
            
            # Latest extraction timestamp
            latest_extraction = await conn.fetchval(
                "SELECT MAX(extraction_timestamp) FROM player_performance"
            )
            
            return {
                "total_records": total_records,
                "records_last_24h": recent_records,
                "unique_players": unique_players,
                "unique_matches": unique_matches,
                "data_sources": {row['data_source']: row['count'] for row in sources},
                "latest_extraction": latest_extraction.isoformat() if latest_extraction else None,
                "status": "healthy" if recent_records > 0 else "stale"
            }
            
    except Exception as e:
        logger.error(f"Error fetching collection status: {e}")
        return {"error": str(e)}


# ============================================================================
# HEALTH CHECK
# ============================================================================

async def health_check() -> dict:
    """
    Comprehensive health check for the database layer.
    """
    pool = await db.get_pool()
    if not pool:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "Pool not initialized"
        }
    
    try:
        async with pool.acquire() as conn:
            # Check connection
            version = await conn.fetchval("SELECT version()")
            
            # Check table exists
            table_exists = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT FROM information.tables 
                    WHERE table_name = 'player_performance'
                )
                """
            )
            
            # Get connection pool stats
            pool_size = len(pool._holders)
            free_connections = len(pool._queue._queue)
            
            return {
                "status": "healthy",
                "database": "connected",
                "version": version[:50] if version else "unknown",
                "table_exists": table_exists,
                "pool_size": pool_size,
                "free_connections": free_connections,
            }
            
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": "error",
            "error": str(e)
        }
