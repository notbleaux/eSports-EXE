"""
Player performance calculators for esports metrics.

Implements:
- KDA (Kills + Assists / Deaths)
- ACS (Average Combat Score) - Valorant specific
- ADR (Average Damage per Round)
- KAST (Kill, Assist, Survive, Trade percentage)

[Ver001.000]
"""

import math
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from statistics import mean, stdev


@dataclass
class CalculationResult:
    """Result from a calculator with metadata."""
    value: float
    raw_value: Optional[float] = None
    formula_used: str = ""
    confidence: float = 1.0


class KDACalculator:
    """
    Calculate KDA (Kills + Assists / Deaths) and KD Ratio.
    
    KDA gives partial credit for assists, while KD is pure K/D.
    """
    
    @staticmethod
    def calculate(kills: int, deaths: int, assists: int = 0) -> CalculationResult:
        """
        Calculate KDA and KD ratio.
        
        Args:
            kills: Number of kills
            deaths: Number of deaths (minimum 1 to avoid division by zero)
            assists: Number of assists
            
        Returns:
            CalculationResult with KDA value
        """
        effective_deaths = max(deaths, 1)
        
        kda = (kills + assists) / effective_deaths
        kd_ratio = kills / effective_deaths
        
        return CalculationResult(
            value=kda,
            raw_value=kd_ratio,
            formula_used="(kills + assists) / max(deaths, 1)",
            confidence=1.0 if deaths > 0 else 0.5
        )
    
    @staticmethod
    def calculate_series(stats_list: List[Dict[str, int]]) -> CalculationResult:
        """Calculate average KDA across multiple matches."""
        if not stats_list:
            return CalculationResult(value=0.0, confidence=0.0)
        
        total_kills = sum(s.get('kills', 0) for s in stats_list)
        total_deaths = sum(s.get('deaths', 0) for s in stats_list)
        total_assists = sum(s.get('assists', 0) for s in stats_list)
        
        return KDACalculator.calculate(total_kills, total_deaths, total_assists)


class ACSCalculator:
    """
    Calculate ACS (Average Combat Score) for Valorant.
    
    ACS Formula (based on Valorant's scoring):
    - Damage: 1 point per damage
    - Kills: 150 (regular), 180 (first blood), 200 (2+ multikill)
    - Assists: 50 (regular), 75 (first blood assist)
    - Round survival: 30 points
    - Spike plants/defuses: 100 points
    
    Note: This is an approximation as Riot doesn't publish exact formula.
    """
    
    KILL_SCORE = 150
    FIRST_BLOOD_SCORE = 180
    MULTIKILL_BONUS = 50  # Per kill beyond first
    ASSIST_SCORE = 50
    FIRST_BLOOD_ASSIST_SCORE = 75
    SURVIVAL_SCORE = 30
    PLANT_DEFUSE_SCORE = 100
    
    @classmethod
    def calculate(
        cls,
        kills: int,
        first_bloods: int = 0,
        multikills: int = 0,  # Count of 2+ kill rounds
        assists: int = 0,
        first_blood_assists: int = 0,
        rounds_survived: int = 0,
        plants_defuses: int = 0,
        damage: int = 0,
        rounds_played: int = 1
    ) -> CalculationResult:
        """
        Calculate ACS for a match.
        
        Args:
            kills: Total kills
            first_bloods: Kills that were first bloods
            multikills: Number of multikill rounds (2+ kills)
            assists: Total assists
            first_blood_assists: Assists on first bloods
            rounds_survived: Rounds player survived
            plants_defuses: Spike plants or defuses
            damage: Total damage dealt
            rounds_played: Total rounds in match
            
        Returns:
            CalculationResult with ACS value
        """
        if rounds_played < 1:
            rounds_played = 1
        
        # Calculate score components
        kill_score = (kills * cls.KILL_SCORE)
        kill_score += (first_bloods * (cls.FIRST_BLOOD_SCORE - cls.KILL_SCORE))
        kill_score += (multikills * cls.MULTIKILL_BONUS)
        
        assist_score = (assists * cls.ASSIST_SCORE)
        assist_score += (first_blood_assists * (cls.FIRST_BLOOD_ASSIST_SCORE - cls.ASSIST_SCORE))
        
        survival_score = rounds_survived * cls.SURVIVAL_SCORE
        plant_score = plants_defuses * cls.PLANT_DEFUSE_SCORE
        damage_score = damage  # 1:1 for damage
        
        total_score = kill_score + assist_score + survival_score + plant_score + damage_score
        acs = total_score / rounds_played
        
        return CalculationResult(
            value=round(acs, 1),
            raw_value=total_score,
            formula_used="(kill_score + assist_score + survival_score + plant_score + damage) / rounds",
            confidence=0.9  # Approximation of Riot's formula
        )
    
    @staticmethod
    def calculate_from_combat(
        kills: int,
        assists: int,
        damage: int,
        rounds_played: int,
        headshots: int = 0
    ) -> CalculationResult:
        """
        Simplified ACS calculation when detailed data unavailable.
        
        Uses approximation: ACS ≈ (K * 150 + A * 50 + damage) / rounds
        """
        if rounds_played < 1:
            rounds_played = 1
        
        score = (kills * 150) + (assists * 50) + damage
        # Headshot bonus (small)
        score += headshots * 10
        
        acs = score / rounds_played
        
        return CalculationResult(
            value=round(acs, 1),
            raw_value=score,
            formula_used="simplified: (K*150 + A*50 + damage + HS*10) / rounds",
            confidence=0.7
        )


class ADRCalculator:
    """
    Calculate ADR (Average Damage per Round).
    
    Simple but crucial metric for consistent damage output.
    """
    
    @staticmethod
    def calculate(damage: int, rounds_played: int) -> CalculationResult:
        """
        Calculate ADR.
        
        Args:
            damage: Total damage dealt
            rounds_played: Number of rounds
            
        Returns:
            CalculationResult with ADR value
        """
        if rounds_played < 1:
            rounds_played = 1
        
        adr = damage / rounds_played
        
        return CalculationResult(
            value=round(adr, 1),
            formula_used="damage / rounds_played",
            confidence=1.0
        )
    
    @staticmethod
    def calculate_series(damage_list: List[int], rounds_list: List[int]) -> CalculationResult:
        """Calculate ADR across multiple matches."""
        total_damage = sum(damage_list)
        total_rounds = sum(rounds_list)
        
        return ADRCalculator.calculate(total_damage, total_rounds)


class KASTCalculator:
    """
    Calculate KAST (Kill, Assist, Survive, Trade) percentage.
    
    KAST measures round participation and is one of the best
    predictors of winning in Valorant.
    
    A player has KAST in a round if they:
    - Got a kill
    - Got an assist
    - Survived the round
    - Were traded (died but teammate got kill within 2s)
    """
    
    @staticmethod
    def calculate(
        rounds_with_kill: int,
        rounds_with_assist: int,
        rounds_survived: int,
        rounds_traded: int,
        total_rounds: int
    ) -> CalculationResult:
        """
        Calculate KAST percentage.
        
        Args:
            rounds_with_kill: Rounds where player got a kill
            rounds_with_assist: Rounds where player got an assist
            rounds_survived: Rounds where player survived
            rounds_traded: Rounds where player was traded
            total_rounds: Total rounds played
            
        Returns:
            CalculationResult with KAST percentage (0-100)
        """
        if total_rounds < 1:
            total_rounds = 1
        
        # Use set union logic (a round can satisfy multiple conditions)
        # For aggregated data, we use inclusion-exclusion approximation
        kast_rounds = rounds_with_kill + rounds_with_assist + rounds_survived + rounds_traded
        
        # Cap at total rounds (can't participate more than 100%)
        kast_rounds = min(kast_rounds, total_rounds)
        
        kast_pct = (kast_rounds / total_rounds) * 100
        
        return CalculationResult(
            value=round(kast_pct, 1),
            formula_used="participation_rounds / total_rounds * 100",
            confidence=0.95 if rounds_traded > 0 else 0.8  # Lower confidence without trade data
        )
    
    @staticmethod
    def calculate_from_rounds(round_participation: List[bool]) -> CalculationResult:
        """
        Calculate KAST from per-round participation list.
        
        This is more accurate when we have round-by-round data.
        """
        if not round_participation:
            return CalculationResult(value=0.0, confidence=0.0)
        
        kast_rounds = sum(1 for participated in round_participation if participated)
        kast_pct = (kast_rounds / len(round_participation)) * 100
        
        return CalculationResult(
            value=round(kast_pct, 1),
            formula_used="count(participated) / total_rounds * 100",
            confidence=1.0
        )


class PerformanceAggregator:
    """
    Aggregate performance metrics across multiple matches.
    
    Calculates trends, consistency metrics, and weighted averages.
    """
    
    @staticmethod
    def calculate_consistency(values: List[float]) -> float:
        """
        Calculate consistency as inverse of coefficient of variation.
        
        Returns 0-1 where 1 is perfectly consistent.
        """
        if len(values) < 2:
            return 1.0
        
        avg = mean(values)
        if avg == 0:
            return 0.0
        
        try:
            std = stdev(values)
            cv = std / avg  # Coefficient of variation
            consistency = max(0, 1 - cv)
            return round(consistency, 2)
        except:
            return 0.0
    
    @staticmethod
    def calculate_trend(current: float, previous: float) -> float:
        """
        Calculate percentage trend between two periods.
        
        Returns:
            Percentage change (-100 to +infinity)
        """
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        
        trend = ((current - previous) / previous) * 100
        return round(trend, 1)
    
    @staticmethod
    def weighted_average(values: List[float], weights: List[float]) -> float:
        """Calculate weighted average."""
        if not values or not weights or len(values) != len(weights):
            return 0.0
        
        total_weight = sum(weights)
        if total_weight == 0:
            return 0.0
        
        weighted_sum = sum(v * w for v, w in zip(values, weights))
        return weighted_sum / total_weight
    
    @classmethod
    def aggregate_player_stats(
        cls,
        match_stats: List[Dict[str, Any]],
        period_days: int = 30
    ) -> Dict[str, Any]:
        """
        Aggregate player stats across multiple matches.
        
        Args:
            match_stats: List of match performance dicts
            period_days: Time period for aggregation
            
        Returns:
            Dictionary with aggregated statistics
        """
        if not match_stats:
            return {}
        
        matches_played = len(match_stats)
        
        # Extract values
        kills = [s.get('kills', 0) for s in match_stats]
        deaths = [s.get('deaths', 0) for s in match_stats]
        assists = [s.get('assists', 0) for s in match_stats]
        damage = [s.get('damage_dealt', 0) for s in match_stats]
        acs_list = [s.get('acs', 0) for s in match_stats]
        kast_list = [s.get('kast', 0) for s in match_stats]
        rounds = [s.get('rounds_played', 0) for s in match_stats]
        
        total_kills = sum(kills)
        total_deaths = sum(deaths)
        total_assists = sum(assists)
        total_damage = sum(damage)
        total_rounds = sum(rounds)
        
        # Calculate per-round metrics
        avg_kpr = total_kills / total_rounds if total_rounds > 0 else 0
        avg_dpr = total_deaths / total_rounds if total_rounds > 0 else 0
        avg_adr = total_damage / total_rounds if total_rounds > 0 else 0
        
        # Calculate KDA
        kda_result = KDACalculator.calculate(total_kills, total_deaths, total_assists)
        
        # Calculate consistency
        kast_consistency = cls.calculate_consistency(kast_list)
        acs_consistency = cls.calculate_consistency(acs_list)
        
        return {
            'matches_played': matches_played,
            'total_kills': total_kills,
            'total_deaths': total_deaths,
            'total_assists': total_assists,
            'total_damage': total_damage,
            'total_rounds': total_rounds,
            'avg_kills': round(mean(kills), 1),
            'avg_deaths': round(mean(deaths), 1),
            'avg_assists': round(mean(assists), 1),
            'avg_damage': round(mean(damage), 1),
            'avg_kpr': round(avg_kpr, 2),
            'avg_dpr': round(avg_dpr, 2),
            'avg_adr': round(avg_adr, 1),
            'avg_acs': round(mean(acs_list), 1) if acs_list else 0,
            'avg_kast': round(mean(kast_list), 1) if kast_list else 0,
            'avg_kda': round(kda_result.value, 2),
            'kast_consistency': kast_consistency,
            'acs_consistency': acs_consistency,
        }


class HeadshotCalculator:
    """Calculate headshot percentage and related metrics."""
    
    @staticmethod
    def calculate(headshots: int, total_kills: int) -> CalculationResult:
        """
        Calculate headshot percentage.
        
        Args:
            headshots: Number of headshot kills
            total_kills: Total number of kills
            
        Returns:
            CalculationResult with headshot percentage (0-100)
        """
        if total_kills < 1:
            total_kills = 1
        
        hs_pct = (headshots / total_kills) * 100
        
        return CalculationResult(
            value=round(hs_pct, 1),
            formula_used="headshots / total_kills * 100",
            confidence=1.0
        )
