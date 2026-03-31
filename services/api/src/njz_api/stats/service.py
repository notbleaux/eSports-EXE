"""
Stats Aggregation Service

Main service class for aggregating player statistics,
computing metrics, and managing the cache layer.

[Ver001.000]
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import asdict

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from .calculators import (
    KDACalculator,
    ACSCalculator,
    ADRCalculator,
    KASTCalculator,
    HeadshotCalculator,
    PerformanceAggregator,
)
from .cache import StatsCache
from .schemas import (
    PlayerPerformanceStats,
    MatchPerformanceSummary,
    AggregatedPlayerStats,
)
from ..database import get_db_session
from ..models.player_stats import PlayerStats
from ..models.match import Match

logger = logging.getLogger(__name__)


class StatsAggregationService:
    """
    Service for aggregating and computing player statistics.
    
    Features:
    - Calculate performance metrics (KDA, ACS, ADR, KAST)
    - Aggregate stats across multiple matches
    - Cache computed results
    - Handle real-time match updates
    """
    
    def __init__(self):
        self.cache = StatsCache()
        self.calculators = {
            'kda': KDACalculator(),
            'acs': ACSCalculator(),
            'adr': ADRCalculator(),
            'kast': KASTCalculator(),
            'headshot': HeadshotCalculator(),
            'aggregator': PerformanceAggregator(),
        }
    
    # --- Individual Match Stats ---
    
    async def calculate_match_performance(
        self,
        player_id: int,
        match_id: int,
        db: Optional[AsyncSession] = None
    ) -> Optional[PlayerPerformanceStats]:
        """
        Calculate performance stats for a player in a specific match.
        
        Args:
            player_id: Player ID
            match_id: Match ID
            db: Database session (optional)
            
        Returns:
            PlayerPerformanceStats or None if not found
        """
        close_session = False
        if db is None:
            db = await get_db_session()
            close_session = True
        
        try:
            # Query raw stats from database
            query = select(PlayerStats).where(
                and_(
                    PlayerStats.player_id == player_id,
                    PlayerStats.match_id == match_id
                )
            )
            result = await db.execute(query)
            stats_record = result.scalar_one_or_none()
            
            if not stats_record:
                return None
            
            # Calculate metrics
            kda_result = KDACalculator.calculate(
                stats_record.kills,
                stats_record.deaths,
                stats_record.assists
            )
            
            adr_result = ADRCalculator.calculate(
                stats_record.damage_dealt or 0,
                stats_record.rounds_played
            )
            
            acs_result = ACSCalculator.calculate_from_combat(
                stats_record.kills,
                stats_record.assists,
                stats_record.damage_dealt or 0,
                stats_record.rounds_played,
                headshots=stats_record.headshots or 0
            )
            
            headshot_result = HeadshotCalculator.calculate(
                stats_record.headshots or 0,
                max(stats_record.kills, 1)
            )
            
            # Build performance stats object
            performance = PlayerPerformanceStats(
                player_id=player_id,
                match_id=match_id,
                team_id=stats_record.team_id,
                game=stats_record.game,
                kills=stats_record.kills,
                deaths=stats_record.deaths,
                assists=stats_record.assists,
                headshots=stats_record.headshots or 0,
                damage_dealt=stats_record.damage_dealt or 0,
                kda=round(kda_result.value, 2),
                kd_ratio=round(kda_result.raw_value or 0, 2),
                acs=acs_result.value,
                adr=adr_result.value,
                kast=stats_record.kast or 0.0,
                headshot_pct=headshot_result.value,
                rounds_played=stats_record.rounds_played,
                first_bloods=stats_record.first_bloods or 0,
                clutches_won=stats_record.clutches_won or 0,
                recorded_at=stats_record.recorded_at or datetime.utcnow()
            )
            
            return performance
            
        except Exception as e:
            logger.error(f"Error calculating match performance: {e}")
            return None
        finally:
            if close_session:
                await db.close()
    
    # --- Aggregated Stats ---
    
    async def get_aggregated_player_stats(
        self,
        player_id: int,
        game: str = "valorant",
        period_days: int = 30,
        use_cache: bool = True
    ) -> Optional[AggregatedPlayerStats]:
        """
        Get aggregated stats for a player over a time period.
        
        First checks cache, then computes from database if needed.
        
        Args:
            player_id: Player ID
            game: Game identifier
            period_days: Number of days to aggregate
            use_cache: Whether to use cache
            
        Returns:
            AggregatedPlayerStats or None
        """
        # Check cache first
        if use_cache:
            cached = await self.cache.get_player_stats(player_id, game, period_days)
            if cached:
                logger.debug(f"Cache hit for player {player_id}")
                # Remove cache metadata before returning
                cached_clean = {k: v for k, v in cached.items() if not k.startswith('_')}
                return AggregatedPlayerStats(**cached_clean)
        
        # Compute from database
        db = await get_db_session()
        try:
            since_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Query match stats for the period
            query = select(PlayerStats).where(
                and_(
                    PlayerStats.player_id == player_id,
                    PlayerStats.game == game,
                    PlayerStats.recorded_at >= since_date
                )
            ).order_by(PlayerStats.recorded_at.desc())
            
            result = await db.execute(query)
            stats_records = result.scalars().all()
            
            if not stats_records:
                return None
            
            # Convert to dicts for aggregation
            match_stats = []
            wins = 0
            
            for record in stats_records:
                # Calculate per-match metrics
                kda_result = KDACalculator.calculate(
                    record.kills, record.deaths, record.assists
                )
                acs_result = ACSCalculator.calculate_from_combat(
                    record.kills,
                    record.assists,
                    record.damage_dealt or 0,
                    record.rounds_played,
                    headshots=record.headshots or 0
                )
                adr_result = ADRCalculator.calculate(
                    record.damage_dealt or 0,
                    record.rounds_played
                )
                
                match_stats.append({
                    'kills': record.kills,
                    'deaths': record.deaths,
                    'assists': record.assists,
                    'damage_dealt': record.damage_dealt or 0,
                    'acs': acs_result.value,
                    'kast': record.kast or 0.0,
                    'rounds_played': record.rounds_played,
                })
                
                # Count wins (simplified: more kills than deaths)
                # In production, use actual match results
                if record.kills > record.deaths:
                    wins += 1
            
            # Aggregate
            aggregated = PerformanceAggregator.aggregate_player_stats(
                match_stats,
                period_days
            )
            
            # Get headshot percentage
            total_headshots = sum(s.headshots or 0 for s in stats_records)
            total_kills = sum(s.kills for s in stats_records)
            hs_result = HeadshotCalculator.calculate(total_headshots, max(total_kills, 1))
            
            # Calculate trends (compare first half vs second half)
            mid = len(match_stats) // 2
            if mid > 0:
                first_half = match_stats[:mid]
                second_half = match_stats[mid:]
                
                first_kda = (sum(s['kills'] + s['assists'] for s in first_half) / 
                           max(sum(s['deaths'] for s in first_half), 1))
                second_kda = (sum(s['kills'] + s['assists'] for s in second_half) / 
                             max(sum(s['deaths'] for s in second_half), 1))
                
                first_acs = mean(s['acs'] for s in first_half)
                second_acs = mean(s['acs'] for s in second_half)
                
                kda_trend = PerformanceAggregator.calculate_trend(second_kda, first_kda)
                acs_trend = PerformanceAggregator.calculate_trend(second_acs, first_acs)
            else:
                kda_trend = 0.0
                acs_trend = 0.0
            
            # Build result
            result_stats = AggregatedPlayerStats(
                player_id=player_id,
                game=game,
                period_days=period_days,
                matches_played=len(stats_records),
                wins=wins,
                losses=len(stats_records) - wins,
                total_kills=aggregated['total_kills'],
                total_deaths=aggregated['total_deaths'],
                total_assists=aggregated['total_assists'],
                total_damage=aggregated['total_damage'],
                total_rounds=aggregated['total_rounds'],
                avg_kills=aggregated['avg_kills'],
                avg_deaths=aggregated['avg_deaths'],
                avg_assists=aggregated['avg_assists'],
                avg_damage=aggregated['avg_damage'],
                avg_kpr=aggregated['avg_kpr'],
                avg_dpr=aggregated['avg_dpr'],
                avg_adr=aggregated['avg_adr'],
                avg_acs=aggregated['avg_acs'],
                avg_kast=aggregated['avg_kast'],
                avg_kda=aggregated['avg_kda'],
                headshot_pct=hs_result.value,
                kast_consistency=aggregated['kast_consistency'],
                acs_consistency=aggregated['acs_consistency'],
                kda_trend=kda_trend,
                acs_trend=acs_trend,
                last_updated=datetime.utcnow()
            )
            
            # Cache the result
            if use_cache:
                await self.cache.set_player_stats(
                    player_id,
                    result_stats.dict(),
                    game,
                    period_days
                )
            
            return result_stats
            
        except Exception as e:
            logger.error(f"Error aggregating player stats: {e}")
            return None
        finally:
            await db.close()
    
    async def get_match_summary(
        self,
        match_id: int,
        use_cache: bool = True
    ) -> Optional[MatchPerformanceSummary]:
        """
        Get performance summary for all players in a match.
        
        Args:
            match_id: Match ID
            use_cache: Whether to use cache
            
        Returns:
            MatchPerformanceSummary or None
        """
        # Check cache
        if use_cache:
            cached = await self.cache.get_match_summary(match_id)
            if cached:
                cached_clean = {k: v for k, v in cached.items() if not k.startswith('_')}
                return MatchPerformanceSummary(**cached_clean)
        
        # Compute from database
        db = await get_db_session()
        try:
            # Get match info
            match_query = select(Match).where(Match.id == match_id)
            match_result = await db.execute(match_query)
            match = match_result.scalar_one_or_none()
            
            if not match:
                return None
            
            # Get all player stats for match
            stats_query = select(PlayerStats).where(PlayerStats.match_id == match_id)
            stats_result = await db.execute(stats_query)
            stats_records = stats_result.scalars().all()
            
            if not stats_records:
                return None
            
            # Calculate performance for each player
            player_stats = []
            team1_kills = team1_deaths = team1_damage = 0
            team2_kills = team2_deaths = team2_damage = 0
            
            for record in stats_records:
                perf = await self.calculate_match_performance(
                    record.player_id,
                    match_id,
                    db
                )
                if perf:
                    player_stats.append(perf)
                    
                    # Aggregate by team
                    if record.team_id == match.team1_id:
                        team1_kills += record.kills
                        team1_deaths += record.deaths
                        team1_damage += record.damage_dealt or 0
                    else:
                        team2_kills += record.kills
                        team2_deaths += record.deaths
                        team2_damage += record.damage_dealt or 0
            
            summary = MatchPerformanceSummary(
                match_id=match_id,
                game=match.game or "valorant",
                team1_id=match.team1_id,
                team2_id=match.team2_id,
                team1_score=match.team1_score or 0,
                team2_score=match.team2_score or 0,
                total_rounds=(match.team1_score or 0) + (match.team2_score or 0),
                player_stats=player_stats,
                team1_kills=team1_kills,
                team1_deaths=team1_deaths,
                team1_damage=team1_damage,
                team2_kills=team2_kills,
                team2_deaths=team2_deaths,
                team2_damage=team2_damage,
                recorded_at=datetime.utcnow()
            )
            
            # Cache result
            if use_cache:
                await self.cache.set_match_summary(match_id, summary.dict())
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting match summary: {e}")
            return None
        finally:
            await db.close()
    
    # --- Batch Operations ---
    
    async def get_leaderboard(
        self,
        category: str = "kda",
        game: str = "valorant",
        limit: int = 10,
        period_days: int = 30,
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get leaderboard for a specific category.
        
        Args:
            category: Sort category (kda, acs, adr, kast, kills)
            game: Game identifier
            limit: Number of players to return
            period_days: Time period for stats
            use_cache: Whether to use cache
            
        Returns:
            List of player stats sorted by category
        """
        cache_key = f"{category}:{period_days}"
        
        # Check cache
        if use_cache:
            cached = await self.cache.get_leaderboard(cache_key, game, limit)
            if cached:
                return cached.get('leaderboard', [])
        
        # This would query pre-computed aggregations or compute on demand
        # For now, return empty list (implement based on your data volume)
        logger.warning("Leaderboard computation not yet implemented")
        return []
    
    # --- Cache Management ---
    
    async def invalidate_player_cache(self, player_id: int, game: str = "valorant") -> bool:
        """Invalidate all cached stats for a player."""
        return await self.cache.invalidate_player_stats(player_id, game)
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return await self.cache.get_cache_stats()
    
    async def clear_cache(self) -> bool:
        """Clear all cached stats."""
        return await self.cache.clear_all_stats()
