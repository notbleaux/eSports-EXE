"""
Hub Data Gateway — Unified API for TRINITY + OPERA Architecture
Connects SATOR, ROTAS, AREPO, OPERA, TENET hubs to A+B+C+D databases.
"""

import os
import logging
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime, date

# Import all 4 database components
from ..scheduler.sqlite_queue import SQLiteTaskQueue, TaskSource, TaskType
from ..opera.tidb_client import TiDBOperaClient
from ..edge.turso_sync import TursoEdgeSync

# Import existing database connections
from ...axiom-esports-data.api.src.db_manager import db as sator_db

logger = logging.getLogger(__name__)


@dataclass
class CrossHubQueryResult:
    """Result from a cross-hub query spanning multiple databases."""
    sator_data: Optional[Dict[str, Any]] = None
    opera_metadata: Optional[Dict[str, Any]] = None
    rotas_analytics: Optional[Dict[str, Any]] = None
    edge_cached: bool = False
    query_time_ms: float = 0.0


class HubDataGateway:
    """
    Unified gateway for all hub data queries.
    
    Provides:
    - SATOR (B): Player performance data
    - ROTAS (B): Analytics from materialized views
    - AREPO (B+D): Cross-reference queries
    - OPERA (D): Tournament metadata
    - TENET (C): Edge-cached recent data
    """
    
    def __init__(
        self,
        sqlite_queue: Optional[SQLiteTaskQueue] = None,
        opera_client: Optional[TiDBOperaClient] = None,
        turso_sync: Optional[TursoEdgeSync] = None
    ):
        self.queue = sqlite_queue or SQLiteTaskQueue()
        self.opera = opera_client or TiDBOperaClient()
        self.turso = turso_sync
        
        # Component availability flags
        self.has_opera = opera_client is not None
        self.has_turso = turso_sync is not None
    
    # ========== SATOR Hub Methods (Component B) ==========
    
    async def get_player_performance(
        self,
        player_id: str,
        tournament_id: Optional[str] = None,
        date_range: Optional[Tuple[date, date]] = None,
        use_edge_cache: bool = False
    ) -> Dict[str, Any]:
        """
        Get player performance data from SATOR.
        
        Args:
            player_id: Player unique identifier
            tournament_id: Optional tournament filter (links to OPERA)
            date_range: Optional (start, end) date filter
            use_edge_cache: If True, query Turso edge cache first
        
        Returns:
            Performance data with optional tournament context
        """
        start_time = datetime.now()
        result = {'player_id': player_id, 'matches': []}
        
        # Try edge cache first if enabled
        if use_edge_cache and self.has_turso:
            try:
                edge_data = await self._query_turso_player(player_id, date_range)
                if edge_data:
                    result['matches'] = edge_data
                    result['source'] = 'turso_edge'
                    result['query_time_ms'] = (datetime.now() - start_time).total_seconds() * 1000
                    return result
            except Exception as e:
                logger.warning(f"Edge cache miss for player {player_id}: {e}")
        
        # Query PostgreSQL (SATOR)
        async with sator_db.pool.acquire() as conn:
            query = """
                SELECT 
                    player_id, name, team, region, role,
                    kills, deaths, acs, adr, kast_pct,
                    headshot_pct, first_blood, clutch_wins, agent, sim_rating,
                    match_id, map_name, tournament, patch_version, realworld_time,
                    tournament_id
                FROM player_performance
                WHERE player_id = $1
            """
            params = [player_id]
            
            if tournament_id:
                query += " AND tournament_id = $2"
                params.append(tournament_id)
            
            if date_range:
                query += f" AND realworld_time BETWEEN ${len(params) + 1} AND ${len(params) + 2}"
                params.extend(date_range)
            
            query += " ORDER BY realworld_time DESC LIMIT 100"
            
            rows = await conn.fetch(query, *params)
            result['matches'] = [dict(row) for row in rows]
            result['source'] = 'postgresql'
        
        result['query_time_ms'] = (datetime.now() - start_time).total_seconds() * 1000
        return result
    
    # ========== ROTAS Hub Methods (Component B - Materialized Views) ==========
    
    async def get_player_leaderboard(
        self,
        stat_date: Optional[date] = None,
        region: Optional[str] = None,
        team: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get daily player leaderboard from ROTAS analytics.
        Queries mv_daily_player_stats materialized view.
        """
        if stat_date is None:
            stat_date = date.today()
        
        async with sator_db.pool.acquire() as conn:
            query = """
                SELECT 
                    player_id, name, team, region, role,
                    matches_played, avg_acs, avg_adr, avg_kast, kdr,
                    avg_headshot_pct, total_first_bloods, total_clutches,
                    avg_sim_rating, avg_rar_score, last_match_time
                FROM mv_daily_player_stats
                WHERE stat_date = $1
            """
            params = [stat_date]
            
            if region:
                query += f" AND region = ${len(params) + 1}"
                params.append(region)
            
            if team:
                query += f" AND team = ${len(params) + 1}"
                params.append(team)
            
            query += " ORDER BY avg_sim_rating DESC LIMIT $" + str(len(params) + 1)
            params.append(limit)
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def get_team_rankings(
        self,
        week_start: Optional[date] = None,
        region: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get weekly team rankings from ROTAS analytics.
        Queries mv_weekly_team_rankings materialized view.
        """
        if week_start is None:
            # Get current week start (Monday)
            week_start = date.today() - timedelta(days=date.today().weekday())
        
        async with sator_db.pool.acquire() as conn:
            query = """
                SELECT 
                    team, region, week_start, team_avg_acs,
                    high_performances, matches_played, unique_players,
                    regional_rank, global_rank, performance_tier
                FROM mv_weekly_team_rankings
                WHERE week_start = $1
            """
            params = [week_start]
            
            if region:
                query += " AND region = $2 ORDER BY regional_rank"
                params.append(region)
            else:
                query += " ORDER BY global_rank"
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    # ========== OPERA Hub Methods (Component D) ==========
    
    def get_tournament(self, tournament_id: str) -> Optional[Dict[str, Any]]:
        """Get tournament metadata from OPERA (TiDB)."""
        if not self.has_opera:
            logger.warning("OPERA (TiDB) not configured")
            return None
        
        return self.opera.get_tournament(tournament_id)
    
    def list_tournaments(
        self,
        circuit: Optional[str] = None,
        season: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """List tournaments from OPERA."""
        if not self.has_opera:
            return []
        
        return self.opera.list_tournaments(circuit, season, status, limit)
    
    def get_tournament_schedule(self, tournament_id: str) -> List[Dict[str, Any]]:
        """Get tournament schedule from OPERA."""
        if not self.has_opera:
            return []
        
        return self.opera.get_schedule_for_tournament(tournament_id)
    
    def get_patch_info(self, patch_version: str) -> Optional[Dict[str, Any]]:
        """Get patch/changelog info from OPERA."""
        if not self.has_opera:
            return None
        
        return self.opera.get_patch(patch_version)
    
    # ========== AREPO Hub Methods (Cross-Reference B+D) ==========
    
    async def get_player_tournament_performance(
        self,
        player_id: str,
        tournament_id: str
    ) -> CrossHubQueryResult:
        """
        Cross-hub query: Player performance in specific tournament.
        Joins SATOR (B) performance data with OPERA (D) tournament metadata.
        """
        start_time = datetime.now()
        result = CrossHubQueryResult()
        
        # Get tournament metadata from OPERA (D)
        if self.has_opera:
            result.opera_metadata = self.opera.get_tournament(tournament_id)
        
        # Get performance data from SATOR (B)
        result.sator_data = await self.get_player_performance(
            player_id=player_id,
            tournament_id=tournament_id
        )
        
        # Get analytics from ROTAS (B views)
        result.rotas_analytics = await self._get_rotas_player_summary(player_id)
        
        result.query_time_ms = (datetime.now() - start_time).total_seconds() * 1000
        return result
    
    async def get_tournament_with_analytics(
        self,
        tournament_id: str
    ) -> Dict[str, Any]:
        """
        Get tournament with full analytics cross-reference.
        Combines OPERA metadata with SATOR performance summaries.
        """
        result = {
            'tournament_id': tournament_id,
            'metadata': None,
            'schedule_summary': {},
            'performance_summary': {},
            'cross_references': {}
        }
        
        # OPERA metadata (D)
        if self.has_opera:
            result['metadata'] = self.opera.get_tournament(tournament_id)
            schedule = self.opera.get_schedule_for_tournament(tournament_id)
            result['schedule_summary'] = {
                'total_matches': len(schedule),
                'completed': len([s for s in schedule if s.get('status') == 'completed']),
                'upcoming': len([s for s in schedule if s.get('status') == 'scheduled']),
                'live': len([s for s in schedule if s.get('status') == 'live'])
            }
        
        # SATOR performance summary (B)
        async with sator_db.pool.acquire() as conn:
            summary = await conn.fetchrow("""
                SELECT 
                    COUNT(DISTINCT match_id) as total_matches,
                    COUNT(DISTINCT player_id) as unique_players,
                    COUNT(DISTINCT team) as unique_teams,
                    AVG(acs) as tournament_avg_acs,
                    MAX(acs) as tournament_max_acs
                FROM player_performance
                WHERE tournament_id = $1
            """, tournament_id)
            
            if summary:
                result['performance_summary'] = dict(summary)
        
        return result
    
    # ========== TENET Hub Methods (Component C - Edge) ==========
    
    async def query_edge_cache(
        self,
        player_id: Optional[str] = None,
        match_id: Optional[str] = None,
        tournament_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Query Turso edge cache for recent data.
        Falls back to PostgreSQL if Turso not available.
        """
        if not self.has_turso:
            logger.debug("Turso edge cache not configured, using PostgreSQL")
            # Fallback to main database
            return await self._query_postgres_fallback(
                player_id, match_id, tournament_id, limit
            )
        
        try:
            # Build Turso query
            conditions = []
            params = []
            
            if player_id:
                conditions.append("player_id = ?")
                params.append(player_id)
            if match_id:
                conditions.append("match_id = ?")
                params.append(match_id)
            if tournament_id:
                conditions.append("tournament_id = ?")
                params.append(tournament_id)
            
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            result = await self.turso.turso.execute(
                f"""
                SELECT * FROM player_performance_edge
                WHERE {where_clause}
                ORDER BY realworld_time DESC
                LIMIT ?
                """,
                params + [limit]
            )
            
            return [dict(row) for row in result.rows]
            
        except Exception as e:
            logger.warning(f"Turso query failed, falling back: {e}")
            return await self._query_postgres_fallback(
                player_id, match_id, tournament_id, limit
            )
    
    # ========== Task Queue Methods (Component A) ==========
    
    async def schedule_harvest_task(
        self,
        source: TaskSource,
        task_type: TaskType,
        params: Dict[str, Any],
        priority: int = 5
    ) -> int:
        """Schedule a harvest task in SQLite queue."""
        return await self.queue.enqueue(source, task_type, params, priority=priority)
    
    async def get_queue_metrics(self) -> Dict[str, Any]:
        """Get SQLite task queue metrics."""
        return await self.queue.get_metrics()
    
    # ========== Private Helper Methods ==========
    
    async def _query_turso_player(
        self,
        player_id: str,
        date_range: Optional[Tuple[date, date]]
    ) -> Optional[List[Dict[str, Any]]]:
        """Query player data from Turso edge cache."""
        if not self.has_turso:
            return None
        
        query = "SELECT * FROM player_performance_edge WHERE player_id = ?"
        params = [player_id]
        
        if date_range:
            query += " AND realworld_time BETWEEN ? AND ?"
            params.extend([d.isoformat() for d in date_range])
        
        query += " ORDER BY realworld_time DESC LIMIT 100"
        
        result = await self.turso.turso.execute(query, params)
        return [dict(row) for row in result.rows] if result.rows else None
    
    async def _query_postgres_fallback(
        self,
        player_id: Optional[str],
        match_id: Optional[str],
        tournament_id: Optional[str],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Fallback query to PostgreSQL when Turso unavailable."""
        async with sator_db.pool.acquire() as conn:
            conditions = []
            params = []
            param_idx = 1
            
            if player_id:
                conditions.append(f"player_id = ${param_idx}")
                params.append(player_id)
                param_idx += 1
            if match_id:
                conditions.append(f"match_id = ${param_idx}")
                params.append(match_id)
                param_idx += 1
            if tournament_id:
                conditions.append(f"tournament_id = ${param_idx}")
                params.append(tournament_id)
                param_idx += 1
            
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            rows = await conn.fetch(
                f"""
                SELECT * FROM player_performance
                WHERE {where_clause}
                ORDER BY realworld_time DESC
                LIMIT ${param_idx}
                """,
                *params, limit
            )
            return [dict(row) for row in rows]
    
    async def _get_rotas_player_summary(self, player_id: str) -> Optional[Dict[str, Any]]:
        """Get ROTAS analytics summary for player."""
        async with sator_db.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM mv_daily_player_stats
                WHERE player_id = $1
                ORDER BY stat_date DESC
                LIMIT 1
            """, player_id)
            return dict(row) if row else None
    
    async def close(self):
        """Cleanup resources."""
        if self.has_turso and self.turso:
            await self.turso.close()


# Singleton instance for application use
_hub_gateway: Optional[HubDataGateway] = None


def get_hub_gateway() -> HubDataGateway:
    """Get or create singleton HubDataGateway instance."""
    global _hub_gateway
    if _hub_gateway is None:
        _hub_gateway = HubDataGateway()
    return _hub_gateway


# FastAPI dependency injection
async def get_gateway() -> HubDataGateway:
    """FastAPI dependency for HubDataGateway."""
    gateway = get_hub_gateway()
    try:
        yield gateway
    finally:
        # Don't close singleton on each request
        pass
