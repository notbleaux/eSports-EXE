"""
SATOR Database Service - ENHANCED VERSION
========================================
Database queries for SATOR hub analytics with derived metrics support.

This enhanced version includes:
- SimRating calculation
- RAR (Role Adjusted Rating) calculation
- Economy metrics
- Career stage classification
- Region and role inference
"""

import logging
from datetime import datetime, timedelta, date
from typing import Optional, List, Tuple, Dict, Any
import asyncpg

# Import metrics calculator using relative path
# Note: metrics_calculator is in axiom-esports-data package
from ....axiom_esports_data.analytics.src.metrics_calculator import (
    MetricsCalculator, infer_role_from_agent, infer_region_from_team, get_full_team_name
)
from .models import (
    PlayerStats, PlayerDetail, TeamSummary, MatchSummary,
    PlatformStats, SearchResult, DataFreshness
)

logger = logging.getLogger(__name__)


class SatorServiceEnhanced:
    """
    Enhanced SATOR service with derived metrics calculation.
    
    This service calculates SimRating, RAR, and other derived fields
    on-the-fly from raw VLR data.
    """
    
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        self.calculator = MetricsCalculator(pool)
    
    # ========== Platform Stats ==========
    
    async def get_platform_stats(self) -> PlatformStats:
        """Get platform-wide statistics with enhanced metrics."""
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
            
            # Live matches
            three_hours_ago = datetime.utcnow() - timedelta(hours=3)
            matches_live = await conn.fetchval(
                """
                SELECT COUNT(DISTINCT match_id) FROM player_performance 
                WHERE realworld_time > $1
                """,
                three_hours_ago
            )
            
            # Top player by SimRating (with fallback to ACS)
            top_player_row = await conn.fetchrow(
                """
                SELECT 
                    player_id, name, team, region, role,
                    AVG(acs) as avg_acs,
                    AVG(sim_rating) as avg_sim_rating,
                    AVG(rar_score) as avg_rar,
                    investment_grade
                FROM player_performance
                WHERE (sim_rating IS NOT NULL OR acs IS NOT NULL)
                GROUP BY player_id, name, team, region, role, investment_grade
                ORDER BY 
                    CASE WHEN AVG(sim_rating) IS NOT NULL THEN AVG(sim_rating) 
                         ELSE AVG(acs) / 40 END DESC
                LIMIT 1
                """
            )
            
            top_player = None
            if top_player_row:
                top_player = PlayerStats(
                    player_id=top_player_row['player_id'],
                    name=top_player_row['name'],
                    team=top_player_row['team'],
                    region=top_player_row['region'] or infer_region_from_team(top_player_row['team']),
                    role=top_player_row['role'] or "Unknown",
                    acs=round(float(top_player_row['avg_acs']), 1) if top_player_row['avg_acs'] else None,
                    sim_rating=round(float(top_player_row['avg_sim_rating']), 3) if top_player_row['avg_sim_rating'] else None,
                    rar_score=round(float(top_player_row['avg_rar']), 3) if top_player_row['avg_rar'] else None,
                    investment_grade=top_player_row['investment_grade'],
                )
            
            # Data freshness
            last_update = await conn.fetchval(
                "SELECT MAX(extraction_timestamp) FROM player_performance"
            ) or datetime.utcnow()
            
            freshness = self._calculate_freshness(last_update)
            
            # Coverage stats
            coverage = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as total,
                    COUNT(sim_rating) as with_simrating,
                    COUNT(rar_score) as with_rar
                FROM player_performance
                """
            )
            
            simrating_coverage = 0
            if coverage and coverage['total'] > 0:
                simrating_coverage = round(coverage['with_simrating'] / coverage['total'] * 100, 1)
            
            return PlatformStats(
                total_players=total_players or 0,
                total_teams=total_teams or 0,
                total_matches=total_matches or 0,
                matches_today=matches_today or 0,
                matches_live=min(matches_live or 0, 5),
                last_update=last_update,
                data_freshness=freshness,
                top_player=top_player,
                api_status="healthy",
                database_status=f"connected (SimRating coverage: {simrating_coverage}%)",
            )
    
    def _calculate_freshness(self, last_update: datetime) -> str:
        """Calculate data freshness status."""
        if not last_update:
            return "Stale"
        
        age = datetime.utcnow() - last_update
        if age < timedelta(minutes=5):
            return "Live"
        elif age < timedelta(hours=1):
            return "Recent"
        else:
            return "Stale"
    
    # ========== Players with Enhanced Metrics ==========
    
    async def get_top_players(self, limit: int = 10, metric: str = "sim_rating") -> List[PlayerStats]:
        """
        Get top players by specified metric.
        
        Supported metrics: sim_rating, rar_score, acs, adr, kast_pct
        """
        # Validate metric
        valid_metrics = ["sim_rating", "rar_score", "acs", "adr", "kast_pct"]
        if metric not in valid_metrics:
            metric = "sim_rating"
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
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
                    investment_grade,
                    COUNT(*) as matches_played
                FROM player_performance
                WHERE {metric} IS NOT NULL OR acs IS NOT NULL
                GROUP BY player_id, name, team, region, role, investment_grade
                HAVING COUNT(*) >= 5
                ORDER BY AVG({metric}) DESC NULLS LAST
                LIMIT $1
                """,
                limit
            )
            
            players = []
            for row in rows:
                # Infer region if missing
                region = row['region'] or infer_region_from_team(row['team'])
                role = row['role'] or "Unknown"
                
                player = PlayerStats(
                    player_id=row['player_id'],
                    name=row['name'],
                    team=row['team'],
                    region=region,
                    role=role,
                    kills=round(row['avg_kills']) if row['avg_kills'] else None,
                    deaths=round(row['avg_deaths']) if row['avg_deaths'] else None,
                    kd_ratio=round(row['avg_kills'] / row['avg_deaths'], 2) if row['avg_deaths'] else None,
                    acs=round(row['avg_acs'], 1) if row['avg_acs'] else None,
                    adr=round(row['avg_adr'], 1) if row['avg_adr'] else None,
                    kast_pct=round(row['avg_kast'], 1) if row['avg_kast'] else None,
                    headshot_pct=round(row['avg_hs_pct'], 1) if row['avg_hs_pct'] else None,
                    sim_rating=round(float(row['avg_sim_rating']), 3) if row['avg_sim_rating'] else None,
                    rar_score=round(float(row['avg_rar']), 3) if row['avg_rar'] else None,
                    investment_grade=row['investment_grade'],
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
        """Get paginated player list with enhanced fields."""
        async with self.pool.acquire() as conn:
            # Build WHERE clause
            where_conditions = ["(sim_rating IS NOT NULL OR acs IS NOT NULL)"]
            params = []
            
            if team:
                params.append(team)
                where_conditions.append(f"team = ${len(params)}")
            if region:
                params.append(region)
                where_conditions.append(f"(region = ${len(params)} OR region IS NULL)")
            if role:
                params.append(role)
                where_conditions.append(f"(role = ${len(params)} OR role IS NULL)")
            
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
                    AVG(headshot_pct) as avg_hs_pct,
                    AVG(sim_rating) as avg_sim_rating,
                    AVG(rar_score) as avg_rar,
                    investment_grade,
                    COUNT(*) as matches_played
                FROM player_performance
                WHERE {where_sql}
                GROUP BY player_id, name, team, region, role, investment_grade
                HAVING COUNT(*) >= ${len(params) - 2}
                ORDER BY AVG(sim_rating) DESC NULLS LAST
                LIMIT ${len(params) - 1} OFFSET ${len(params)}
                """,
                *params
            )
            
            players = []
            for row in rows:
                # Infer missing data
                region = row['region'] or infer_region_from_team(row['team'])
                
                player = PlayerStats(
                    player_id=row['player_id'],
                    name=row['name'],
                    team=row['team'],
                    region=region,
                    role=row['role'] or infer_role_from_agent(None),
                    kills=round(row['avg_kills']) if row['avg_kills'] else None,
                    deaths=round(row['avg_deaths']) if row['avg_deaths'] else None,
                    kd_ratio=round(row['avg_kills'] / row['avg_deaths'], 2) if row['avg_deaths'] else None,
                    acs=round(row['avg_acs'], 1) if row['avg_acs'] else None,
                    adr=round(row['avg_adr'], 1) if row['avg_adr'] else None,
                    kast_pct=round(row['avg_kast'], 1) if row['avg_kast'] else None,
                    headshot_pct=round(row['avg_hs_pct'], 1) if row['avg_hs_pct'] else None,
                    sim_rating=round(float(row['avg_sim_rating']), 3) if row['avg_sim_rating'] else None,
                    rar_score=round(float(row['avg_rar']), 3) if row['avg_rar'] else None,
                    investment_grade=row['investment_grade'],
                    matches_played=row['matches_played'],
                )
                players.append(player)
            
            return players, total
    
    async def get_player_detail(self, player_id: str) -> Optional[PlayerDetail]:
        """Get detailed player information with calculated metrics."""
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
                    investment_grade,
                    economy_rating,
                    adjusted_kill_value,
                    career_stage,
                    COUNT(*) as matches_played
                FROM player_performance
                WHERE player_id = $1
                GROUP BY player_id, name, team, region, role, 
                         investment_grade, economy_rating, adjusted_kill_value, career_stage
                """,
                player_id
            )
            
            if not row:
                return None
            
            # Calculate metrics if missing
            simrating = None
            rar = None
            economy = None
            career = None
            
            if not row['avg_sim_rating']:
                # Calculate on-the-fly
                simrating = await self.calculator.calculate_simrating(player_id)
            
            if not row['avg_rar']:
                rar = await self.calculator.calculate_rar(player_id)
            
            if not row['economy_rating']:
                economy = await self.calculator.calculate_economy_metrics(player_id)
            
            if not row['career_stage']:
                career = await self.calculator.classify_career_stage(player_id)
            
            # Recent matches
            recent = await conn.fetch(
                """
                SELECT 
                    match_id, map_name, tournament, realworld_time,
                    kills, deaths, acs, sim_rating, rar_score
                FROM player_performance
                WHERE player_id = $1
                ORDER BY realworld_time DESC
                LIMIT 5
                """,
                player_id
            )
            
            recent_matches = [dict(r) for r in recent]
            
            # Determine trend
            recent_rating = row['avg_sim_rating'] or (simrating.sim_rating if simrating else 0)
            rating_trend = career['trend'] if career else "stable"
            form_rating = round(recent_rating, 3) if recent_rating else None
            
            return PlayerDetail(
                player_id=row['player_id'],
                name=row['name'],
                team=row['team'],
                region=row['region'] or infer_region_from_team(row['team']),
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
                sim_rating=round(float(row['avg_sim_rating']), 3) if row['avg_sim_rating'] else (simrating.sim_rating if simrating else None),
                rar_score=round(float(row['avg_rar']), 3) if row['avg_rar'] else (rar.rar_score if rar else None),
                investment_grade=row['investment_grade'] or (rar.investment_grade if rar else None),
                economy_rating=round(float(row['economy_rating']), 2) if row['economy_rating'] else (economy.economy_rating if economy else None),
                adjusted_kill_value=round(float(row['adjusted_kill_value']), 2) if row['adjusted_kill_value'] else (economy.adjusted_kill_value if economy else None),
                career_stage=row['career_stage'] or (career['career_stage'] if career else None),
                matches_played=row['matches_played'],
                recent_matches=recent_matches,
                rating_trend=rating_trend,
                form_rating=form_rating,
            )
    
    # ========== Batch Metric Calculation ==========
    
    async def backfill_metrics(self, limit: int = 100) -> Dict[str, int]:
        """
        Backfill calculated metrics for players missing them.
        
        Returns count of updated records.
        """
        async with self.pool.acquire() as conn:
            # Find players missing sim_rating
            rows = await conn.fetch(
                """
                SELECT DISTINCT player_id
                FROM player_performance
                WHERE sim_rating IS NULL
                  AND acs IS NOT NULL
                LIMIT $1
                """,
                limit
            )
            
            updated = 0
            failed = 0
            
            for row in rows:
                success = await self.calculator.update_player_metrics(row['player_id'])
                if success:
                    updated += 1
                else:
                    failed += 1
            
            return {"updated": updated, "failed": failed, "total": len(rows)}


# Keep original SatorService for backward compatibility
from .service import SatorService
