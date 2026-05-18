"""
Pydantic schemas for stats aggregation service.

[Ver001.000]
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CombatStats(BaseModel):
    """Raw combat statistics from a match."""
    kills: int = Field(0, ge=0)
    deaths: int = Field(0, ge=0)
    assists: int = Field(0, ge=0)
    headshots: int = Field(0, ge=0)
    damage_dealt: int = Field(0, ge=0)
    rounds_played: int = Field(0, ge=0)


class RoundImpactStats(BaseModel):
    """Round impact metrics."""
    first_bloods: int = Field(0, ge=0)
    first_deaths: int = Field(0, ge=0)
    clutches_won: int = Field(0, ge=0)
    clutches_lost: int = Field(0, ge=0)
    clutches_1v1: int = Field(0, ge=0)
    clutches_1v2: int = Field(0, ge=0)
    clutches_1v3: int = Field(0, ge=0)
    clutches_1v4: int = Field(0, ge=0)
    clutches_1v5: int = Field(0, ge=0)


class EconomyStats(BaseModel):
    """Economy-related statistics."""
    damage_per_credit: float = Field(0.0, ge=0)
    kills_per_credit: float = Field(0.0, ge=0)
    eco_rounds_won: int = Field(0, ge=0)
    eco_rounds_played: int = Field(0, ge=0)
    full_buy_rounds_won: int = Field(0, ge=0)
    full_buy_rounds_played: int = Field(0, ge=0)


class PlayerPerformanceStats(BaseModel):
    """Complete player performance statistics for a match."""
    player_id: int
    match_id: int
    team_id: int
    game: str = "valorant"
    
    # Combat
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    headshots: int = 0
    damage_dealt: int = 0
    
    # Calculated metrics
    kda: float = Field(0.0, description="(K + A) / max(D, 1)")
    kd_ratio: float = Field(0.0, description="K / max(D, 1)")
    acs: float = Field(0.0, description="Average Combat Score")
    adr: float = Field(0.0, description="Average Damage per Round")
    kast: float = Field(0.0, ge=0, le=100, description="KAST percentage")
    headshot_pct: float = Field(0.0, ge=0, le=100, description="Headshot percentage")
    
    # Round impact
    rounds_played: int = 0
    first_bloods: int = 0
    first_deaths: int = 0
    clutches_won: int = 0
    clutches_attempted: int = 0
    
    # Economy
    damage_per_credit: float = 0.0
    
    # Meta
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class MatchPerformanceSummary(BaseModel):
    """Summary of all player performances in a match."""
    match_id: int
    game: str
    team1_id: int
    team2_id: int
    team1_score: int
    team2_score: int
    total_rounds: int
    
    player_stats: List[PlayerPerformanceStats]
    
    # Team aggregates
    team1_kills: int = 0
    team1_deaths: int = 0
    team1_damage: int = 0
    team2_kills: int = 0
    team2_deaths: int = 0
    team2_damage: int = 0
    
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class AggregatedPlayerStats(BaseModel):
    """Time-aggregated player statistics across multiple matches."""
    player_id: int
    game: str
    period_days: int = Field(30, description="Aggregation period")
    
    # Match count
    matches_played: int = 0
    wins: int = 0
    losses: int = 0
    
    # Totals
    total_kills: int = 0
    total_deaths: int = 0
    total_assists: int = 0
    total_damage: int = 0
    total_rounds: int = 0
    
    # Averages (per match)
    avg_kills: float = 0.0
    avg_deaths: float = 0.0
    avg_assists: float = 0.0
    avg_damage: float = 0.0
    
    # Averages (per round)
    avg_kpr: float = Field(0.0, description="Kills per round")
    avg_dpr: float = Field(0.0, description="Deaths per round")
    avg_adr: float = Field(0.0, description="Average Damage per Round")
    
    # Performance metrics
    avg_acs: float = 0.0
    avg_kast: float = 0.0
    avg_kda: float = 0.0
    headshot_pct: float = 0.0
    
    # Consistency
    kast_consistency: float = Field(0.0, description="Standard deviation of KAST")
    acs_consistency: float = Field(0.0, description="Standard deviation of ACS")
    
    # Trends (vs previous period)
    kda_trend: float = Field(0.0, description="Percentage change in KDA")
    acs_trend: float = Field(0.0, description="Percentage change in ACS")
    
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class StatsComparison(BaseModel):
    """Compare two players' stats."""
    player1_id: int
    player2_id: int
    
    player1_stats: AggregatedPlayerStats
    player2_stats: AggregatedPlayerStats
    
    # Head-to-head if available
    h2h_matches: int = 0
    player1_wins: int = 0
    player2_wins: int = 0
    
    # Key differentials
    kda_diff: float = 0.0
    acs_diff: float = 0.0
    adr_diff: float = 0.0
    kast_diff: float = 0.0
    
    advantage_player: Optional[int] = None
    advantage_metric: Optional[str] = None


class LiveMatchStats(BaseModel):
    """Real-time stats during a live match."""
    match_id: int
    current_round: int
    team1_score: int
    team2_score: int
    
    # Live player stats for current match
    player_stats: Dict[int, PlayerPerformanceStats]
    
    # Round-by-round history
    round_history: List[Dict[str, Any]] = []
    
    # Running totals
    total_kills_team1: int = 0
    total_kills_team2: int = 0
    
    # Economy tracking
    team1_bank: int = 0
    team2_bank: int = 0
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PredictionInput(BaseModel):
    """Input for match prediction models."""
    team1_id: int
    team2_id: int
    map_id: Optional[str] = None
    
    # Recent form (last 5 matches)
    team1_recent_stats: Optional[AggregatedPlayerStats] = None
    team2_recent_stats: Optional[AggregatedPlayerStats] = None
    
    # Head-to-head history
    h2h_matches: int = 0
    team1_wins: int = 0
    team2_wins: int = 0
    
    # Current match state (for live predictions)
    current_score_team1: int = 0
    current_score_team2: int = 0
    rounds_played: int = 0


class PredictionOutput(BaseModel):
    """Output from match prediction models."""
    match_id: Optional[int] = None
    team1_win_probability: float = Field(..., ge=0, le=1)
    team2_win_probability: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1, description="Model confidence")
    
    # Key factors
    key_factors: List[Dict[str, Any]] = []
    
    # If live prediction
    rounds_remaining_estimate: Optional[int] = None
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)
