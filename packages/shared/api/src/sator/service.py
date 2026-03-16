"""
SATOR Database Service
=====================
Database queries for SATOR hub analytics.
"""

import logging
from datetime import datetime, timedelta, date, timezone
from typing import Optional, List, Tuple, Dict, Any
import asyncpg

from .models import (
    PlayerStats, PlayerDetail, TeamSummary, MatchSummary,
    PlatformStats, SearchResult, DataFreshness
)

logger = logging.getLogger(__name__)


class SatorService:
    """Service for SATOR hub database operations."""
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
    
    # ========== Platform Stats ==========
    
    async def get_platform_stats(self) -> PlatformStats:
        """Get platform-wide statistics."""
        async with self.pool.acquire() as conn:
            # Count queries
            total_players = await conn.fetchval(
                "SELECT COUNT(DISTINCT player_id) FROM player_performance"
            )
            total_teams = await conn.fetchval(
                "SELECT COUNT(DISTINCT team) FROM player_performance WHERE team IS NOT NULL"
            )
            total_matches = await conn.fetchval(
                "SELECT COUNT(DISTINCT match_id) FROM player_performance"
            )
            
            # Today's matches
            today = date.today()
            matches_today = await conn.fetchval(
                """
                SELECT COUNT(DISTINCT match_id) FROM player_performance 
                WHERE realworld_time::date = $1
                """,
                today
            )
            
            # Live matches (simplified - matches from last 3 hours)
            three_hours_ago = datetime.now(timezone.utc) - timedelta(hours=3)
            matches_live = await conn.fetchval(
                """
                SELECT COUNT(DISTINCT match_id) FROM player_performance 
                WHERE realworld_time > $1
                """,
                three_hours_ago
            )
            
            # Top player by SimRating
            top_player_row = await conn.fetchrow(
                """
                SELECT player_id, name, team, region, role,
                       AVG(acs) as avg_acs, AVG(sim_rating) as avg_sim_rating
                FROM player_performance
                WHERE sim_rating IS NOT NULL
                GROUP BY player_id, name, team, region, role
                ORDER BY avg_sim_rating DESC
                LIMIT 1
                """
            )
            
            top_player = None
            if top_player_row:
                top_player = PlayerStats(
                    player_id=top_player_row['player_id'],
                    name=top_player_row['name'],
                    team=top_player_row['team'],
                    region=top_player_row['region'],
                    role=top_player_row['role'],
                    acs=float(top_player_row['avg_acs']) if top_player_row['avg_acs'] else None,
                    sim_rating=float(top_player_row['avg_sim_rating']) if top_player_row['avg_sim_rating'] else None,
                )
            
            # Data freshness
            last_update = await conn.fetchval(
                "SELECT MAX(extraction_timestamp) FROM player_performance"
            ) or datetime.now(timezone.utc)
            
            freshness = self._calculate_freshness(last_update)
            
            return PlatformStats(
                total_players=total_players or 0,
                total_teams=total_teams or 0,
                total_matches=total_matches or 0,
                matches_today=matches_today or 0,
                matches_live=min(matches_live or 0, 5),  # Cap at 5 for demo
                last_update=last_update,
                data_freshness=freshness,
                top_player=top_player,
                api_status="healthy",
                database_status="connected",
            )
    
    def _calculate_freshness(self, last_update: datetime) -> str:
        """Calculate data freshness status."""
        if not last_update:
            return "Stale"
        
        age = datetime.now(timezone.utc) - last_update
        if age < timedelta(minutes=5):
            return "Live"
        elif age < timedelta(hours=1):
            return "Recent"
        else:
            return "Stale"
    
    # ========== Players ==========
    
    async def get_top_players(self, limit: int = 10) -> List[PlayerStats]:
        """Get top players by SimRating."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    player_id, name, team, region, role,
                    AVG(kills) as avg_kills,
                    AVG(deaths) as avg_deaths,
                    AVG(acs) as avg_acs,
                    AVG(adr) as avg_adr,
                    AVG(kast_pct) as avg_kast,
                    AVG(headshot_pct) as avg_hs_pct,
                    AVG(sim_rating) as avg_sim_rating,
                    AVG(rar_score) as avg_rar,
                    COUNT(*) as matches_played
                FROM player_performance
                WHERE sim_rating IS NOT NULL
                GROUP BY player_id, name, team, region, role
                HAVING COUNT(*) >= 5  -- Min 5 matches
                ORDER BY avg_sim_rating DESC NULLS LAST
                LIMIT $1
                """,
                limit
            )
            
            players = []
            for row in rows:
                player = PlayerStats(
                    player_id=row['player_id'],
                    name=row['name'],
                    team=row['team'],
                    region=row['region'],
                    role=row['role'],
                    kills=round(row['avg_kills']) if row['avg_kills'] else None,
                    deaths=round(row['avg_deaths']) if row['avg_deaths'] else None,
                    kd_ratio=round(row['avg_kills'] / row['avg_deaths'], 2) if row['avg_deaths'] else None,
                    acs=round(row['avg_acs'], 1) if row['avg_acs'] else None,
                    adr=round(row['avg_adr'], 1) if row['avg_adr'] else None,
                    kast_pct=round(row['avg_kast'], 1) if row['avg_kast'] else None,
                    headshot_pct=round(row['avg_hs_pct'], 1) if row['avg_hs_pct'] else None,
                    sim_rating=round(row['avg_sim_rating'], 3) if row['avg_sim_rating'] else None,
                    rar_score=round(row['avg_rar'], 3) if row['avg_rar'] else None,
                    matches_played=row['matches_played'],
                )
                players.append(player)
            
            return players
    
    async def get_players(
        self,
        page: int = 1,
        page_size: int = 20,
        team: Optional[str] = None,
        region: Optional[str] = None,
        role: Optional[str] = None,
        min_matches: int = 5
    ) -> Tuple[List[PlayerStats], int]:
        """Get paginated player list with optional filters."""
        async with self.pool.acquire() as conn:
            # Build WHERE clause
            where_conditions = ["sim_rating IS NOT NULL"]
            params = []
            
            if team:
                params.append(team)
                where_conditions.append(f"team = ${len(params)}")
            if region:
                params.append(region)
                where_conditions.append(f"region = ${len(params)}")
            if role:
                params.append(role)
                where_conditions.append(f"role = ${len(params)}")
            
            where_sql = " AND ".join(where_conditions)
            
            # Count total
            count_sql = f"""
                SELECT COUNT(DISTINCT player_id) 
                FROM player_performance 
                WHERE {where_sql}
                GROUP BY player_id
                HAVING COUNT(*) >= $1
            """
            total_rows = await conn.fetch(count_sql, min_matches, *params)
            total = len(total_rows)
            
            # Fetch players
            offset = (page - 1) * page_size
            params.append(min_matches)
            params.append(page_size)
            params.append(offset)
            
            rows = await conn.fetch(
                f"""
                SELECT 
                    player_id, name, team, region, role,
                    AVG(kills) as avg_kills,
                    AVG(deaths) as avg_deaths,
                    AVG(acs) as avg_acs,
                    AVG(adr) as avg_adr,
                    AVG(kast_pct) as avg_kast,
                    AVG(sim_rating) as avg_sim_rating,
                    COUNT(*) as matches_played
                FROM player_performance
                WHERE {where_sql}
                GROUP BY player_id, name, team, region, role
                HAVING COUNT(*) >= ${len(params) - 2}
                ORDER BY avg_sim_rating DESC NULLS LAST
                LIMIT ${len(params) - 1} OFFSET ${len(params)}
                """,
                *params
            )
            
            players = []
            for row in rows:
                player = PlayerStats(
                    player_id=row['player_id'],
                    name=row['name'],
                    team=row['team'],
                    region=row['region'],
                    role=row['role'],
                    kills=round(row['avg_kills']) if row['avg_kills'] else None,
                    deaths=round(row['avg_deaths']) if row['avg_deaths'] else None,
                    kd_ratio=round(row['avg_kills'] / row['avg_deaths'], 2) if row['avg_deaths'] else None,
                    acs=round(row['avg_acs'], 1) if row['avg_acs'] else None,
                    adr=round(row['avg_adr'], 1) if row['avg_adr'] else None,
                    kast_pct=round(row['avg_kast'], 1) if row['avg_kast'] else None,
                    sim_rating=round(row['avg_sim_rating'], 3) if row['avg_sim_rating'] else None,
                    matches_played=row['matches_played'],
                )
                players.append(player)
            
            return players, total
    
    async def get_player_detail(self, player_id: str) -> Optional[PlayerDetail]:
        """Get detailed player information."""
        async with self.pool.acquire() as conn:
            # Main stats
            row = await conn.fetchrow(
                """
                SELECT 
                    player_id, name, team, region, role,
                    AVG(kills) as avg_kills,
                    AVG(deaths) as avg_deaths,
                    AVG(acs) as avg_acs,
                    AVG(adr) as avg_adr,
                    AVG(kast_pct) as avg_kast,
                    AVG(headshot_pct) as avg_hs_pct,
                    AVG(first_blood) as avg_fb,
                    AVG(clutch_wins) as avg_clutches,
                    AVG(sim_rating) as avg_sim_rating,
                    AVG(rar_score) as avg_rar,
                    MAX(sim_rating) as peak_rating,
                    COUNT(*) as matches_played
                FROM player_performance
                WHERE player_id = $1
                GROUP BY player_id, name, team, region, role
                """,
                player_id
            )
            
            if not row:
                return None
            
            # Recent matches (last 5)
            recent = await conn.fetch(
                """
                SELECT 
                    match_id, map_name, tournament, realworld_time,
                    kills, deaths, acs, sim_rating
                FROM player_performance
                WHERE player_id = $1
                ORDER BY realworld_time DESC
                LIMIT 5
                """,
                player_id
            )
            
            recent_matches = [dict(r) for r in recent]
            
            # Rating trend (compare last 30 days vs previous 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)
            
            recent_rating = await conn.fetchval(
                """
                SELECT AVG(sim_rating) FROM player_performance
                WHERE player_id = $1 AND realworld_time > $2
                """,
                player_id, thirty_days_ago
            )
            
            previous_rating = await conn.fetchval(
                """
                SELECT AVG(sim_rating) FROM player_performance
                WHERE player_id = $1 AND realworld_time > $2 AND realworld_time <= $3
                """,
                player_id, sixty_days_ago, thirty_days_ago
            )
            
            trend = "stable"
            if recent_rating and previous_rating:
                diff = recent_rating - previous_rating
                if diff > 0.05:
                    trend = "rising"
                elif diff < -0.05:
                    trend = "falling"
            
            return PlayerDetail(
                player_id=row['player_id'],
                name=row['name'],
                team=row['team'],
                region=row['region'],
                role=row['role'],
                kills=round(row['avg_kills']) if row['avg_kills'] else None,
                deaths=round(row['avg_deaths']) if row['avg_deaths'] else None,
                kd_ratio=round(row['avg_kills'] / row['avg_deaths'], 2) if row['avg_deaths'] else None,
                acs=round(row['avg_acs'], 1) if row['avg_acs'] else None,
                adr=round(row['avg_adr'], 1) if row['avg_adr'] else None,
                kast_pct=round(row['avg_kast'], 1) if row['avg_kast'] else None,
                headshot_pct=round(row['avg_hs_pct'], 1) if row['avg_hs_pct'] else None,
                first_blood=round(row['avg_fb']) if row['avg_fb'] else None,
                clutch_wins=round(row['avg_clutches']) if row['avg_clutches'] else None,
                sim_rating=round(row['avg_sim_rating'], 3) if row['avg_sim_rating'] else None,
                rar_score=round(row['avg_rar'], 3) if row['avg_rar'] else None,
                matches_played=row['matches_played'],
                recent_matches=recent_matches,
                rating_trend=trend,
                form_rating=round(recent_rating, 3) if recent_rating else None,
            )
    
    # ========== Teams ==========
    
    async def get_teams(
        self,
        page: int = 1,
        page_size: int = 20,
        region: Optional[str] = None
    ) -> Tuple[List[TeamSummary], int]:
        """Get team list with aggregated stats."""
        async with self.pool.acquire() as conn:
            where_clause = "WHERE team IS NOT NULL"
            params = []
            
            if region:
                params.append(region)
                where_clause += f" AND region = ${len(params)}"
            
            # Count
            count_row = await conn.fetchrow(
                f"SELECT COUNT(DISTINCT team) as count FROM player_performance {where_clause}",
                *params
            )
            total = count_row['count'] if count_row else 0
            
            # Fetch teams
            offset = (page - 1) * page_size
            params.extend([page_size, offset])
            
            rows = await conn.fetch(
                f"""
                SELECT 
                    team as name,
                    region,
                    COUNT(DISTINCT player_id) as player_count,
                    COUNT(DISTINCT match_id) as matches_played
                FROM player_performance
                {where_clause}
                GROUP BY team, region
                ORDER BY matches_played DESC
                LIMIT ${len(params) - 1} OFFSET ${len(params)}
                """,
                *params
            )
            
            teams = []
            for row in rows:
                team = TeamSummary(
                    team_id=row['name'].lower().replace(' ', '_'),
                    name=row['name'],
                    tag=row['name'][:3].upper(),
                    region=row['region'] or 'Unknown',
                    matches_played=row['matches_played'],
                )
                teams.append(team)
            
            return teams, total
    
    # ========== Matches ==========
    
    async def get_matches(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        tournament_id: Optional[str] = None
    ) -> Tuple[List[MatchSummary], int]:
        """Get match list."""
        async with self.pool.acquire() as conn:
            # This is a simplified implementation
            # In production, you'd have a proper matches table
            
            where_conditions = ["1=1"]
            params = []
            
            if tournament_id:
                params.append(tournament_id)
                where_conditions.append(f"tournament_id = ${len(params)}")
            
            where_sql = " AND ".join(where_conditions)
            
            # Get unique matches
            offset = (page - 1) * page_size
            params.extend([page_size, offset])
            
            rows = await conn.fetch(
                f"""
                SELECT DISTINCT ON (match_id)
                    match_id,
                    tournament,
                    tournament_id,
                    realworld_time,
                    map_name,
                    patch_version
                FROM player_performance
                WHERE {where_sql}
                ORDER BY match_id DESC
                LIMIT ${len(params) - 1} OFFSET ${len(params)}
                """,
                *params
            )
            
            matches = []
            for row in rows:
                # Determine status based on time
                match_time = row['realworld_time']
                now = datetime.now(timezone.utc)
                
                if match_time > now:
                    match_status = "upcoming"
                elif match_time > now - timedelta(hours=3):
                    match_status = "live"
                else:
                    match_status = "completed"
                
                # Filter by status if specified
                if status and match_status != status:
                    continue
                
                match = MatchSummary(
                    match_id=row['match_id'],
                    tournament_id=row['tournament_id'],
                    tournament_name=row['tournament'],
                    team_a="TBD",  # Would need proper team mapping
                    team_b="TBD",
                    status=match_status,
                    scheduled_at=match_time if match_status == "upcoming" else None,
                    started_at=match_time if match_status == "live" else None,
                    completed_at=match_time if match_status == "completed" else None,
                    patch_version=row['patch_version'],
                    maps=[row['map_name']] if row['map_name'] else [],
                )
                matches.append(match)
            
            # Get approximate total
            total = await conn.fetchval(
                f"SELECT COUNT(DISTINCT match_id) FROM player_performance WHERE {where_sql}",
                *params[:-2]
            )
            
            return matches, total or 0
    
    # ========== Search ==========
    
    async def search(
        self,
        query: str,
        limit: int = 20
    ) -> Tuple[List[SearchResult], float]:
        """Full-text search across players, teams, and matches."""
        import time
        start_time = time.time()
        
        async with self.pool.acquire() as conn:
            results = []
            search_pattern = f"%{query}%"
            
            # Search players
            player_rows = await conn.fetch(
                """
                SELECT DISTINCT ON (player_id)
                    player_id, name, team, region, role,
                    similarity(name, $1) as sml
                FROM player_performance
                WHERE name ILIKE $2 OR player_id ILIKE $2
                ORDER BY player_id, sml DESC
                LIMIT $3
                """,
                query, search_pattern, limit // 3
            )
            
            for row in player_rows:
                results.append(SearchResult(
                    type="player",
                    id=row['player_id'],
                    name=row['name'],
                    subtitle=f"{row['team']} • {row['region']}" if row['team'] else row['region'],
                    score=float(row['sml']) if row['sml'] else 0.5,
                ))
            
            # Search teams
            team_rows = await conn.fetch(
                """
                SELECT DISTINCT team, region
                FROM player_performance
                WHERE team ILIKE $1
                LIMIT $2
                """,
                search_pattern, limit // 3
            )
            
            for row in team_rows:
                results.append(SearchResult(
                    type="team",
                    id=row['team'].lower().replace(' ', '_'),
                    name=row['team'],
                    subtitle=row['region'],
                    score=0.7,
                ))
            
            # Search tournaments/matches
            match_rows = await conn.fetch(
                """
                SELECT DISTINCT tournament
                FROM player_performance
                WHERE tournament ILIKE $1
                LIMIT $2
                """,
                search_pattern, limit // 3
            )
            
            for row in match_rows:
                results.append(SearchResult(
                    type="match",
                    id=row['tournament'].lower().replace(' ', '_'),
                    name=row['tournament'],
                    subtitle="Tournament",
                    score=0.6,
                ))
            
            # Sort by score
            results.sort(key=lambda x: x.score, reverse=True)
            results = results[:limit]
            
            elapsed_ms = (time.time() - start_time) * 1000
            return results, elapsed_ms
    
    # ========== Data Freshness ==========
    
    async def get_data_freshness(self) -> DataFreshness:
        """Get data freshness status."""
        async with self.pool.acquire() as conn:
            last_update = await conn.fetchval(
                "SELECT MAX(extraction_timestamp) FROM player_performance"
            ) or datetime.now(timezone.utc)
            
            # Check materialized view refresh
            mv_last_refresh = await conn.fetchval(
                """
                SELECT last_refresh 
                FROM pg_matviews 
                WHERE matviewname = 'mv_daily_player_stats'
                """
            )
            
            freshness = self._calculate_freshness(last_update)
            
            return DataFreshness(
                status=freshness,
                last_update=last_update,
                next_update=last_update + timedelta(hours=1) if freshness != "Live" else None,
                sources={
                    "player_performance": last_update.isoformat(),
                    "materialized_views": mv_last_refresh.isoformat() if mv_last_refresh else None,
                },
                database="connected",
                cache="connected",
                websocket="connected",
            )
