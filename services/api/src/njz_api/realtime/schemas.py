"""
Pydantic schemas for real-time layer.

[Ver001.000]
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel, Field


class MatchEventType(str, Enum):
    """Types of match events."""
    MATCH_START = "MATCH_START"
    ROUND_START = "ROUND_START"
    ROUND_END = "ROUND_END"
    KILL = "KILL"
    DEATH = "DEATH"
    ASSIST = "ASSIST"
    SPIKE_PLANT = "SPIKE_PLANT"
    SPIKE_DEFUSE = "SPIKE_DEFUSE"
    ECONOMY_UPDATE = "ECONOMY_UPDATE"
    SCORE_UPDATE = "SCORE_UPDATE"
    PLAYER_STATS_UPDATE = "PLAYER_STATS_UPDATE"
    MATCH_END = "MATCH_END"


class LiveEvent(BaseModel):
    """Base model for live match events."""
    event_type: MatchEventType
    match_id: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    round_number: Optional[int] = None
    payload: Dict[str, Any] = {}


class LivePlayerStats(BaseModel):
    """Real-time player statistics during a match."""
    player_id: int
    team_id: int
    
    # Current match totals
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    damage_dealt: int = 0
    
    # Calculated metrics (updated each round)
    kda: float = 0.0
    adr: float = 0.0
    acs: float = 0.0
    
    # Round-specific
    first_bloods: int = 0
    clutches_won: int = 0
    
    # Economy
    credits_spent: int = 0
    damage_per_credit: float = 0.0
    
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class LiveMatchState(BaseModel):
    """Complete state of a live match."""
    match_id: int
    status: str = "live"  # live, paused, ended
    
    # Score
    team1_id: int
    team2_id: int
    team1_score: int = 0
    team2_score: int = 0
    current_round: int = 0
    total_rounds: int = 24  # BO24 for Valorant
    
    # Player stats by ID
    player_stats: Dict[int, LivePlayerStats] = {}
    
    # Economy tracking
    team1_bank: int = 0
    team2_bank: int = 0
    
    # Event history (recent)
    recent_events: List[LiveEvent] = []
    
    # Prediction
    win_probability_team1: float = 0.5
    win_probability_team2: float = 0.5
    predicted_winner: Optional[int] = None
    
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class RoundEvent(BaseModel):
    """Event within a round."""
    event_type: str  # kill, assist, death, plant, defuse
    timestamp: datetime
    player_id: Optional[int] = None
    target_id: Optional[int] = None
    weapon: Optional[str] = None
    headshot: bool = False
    clutch_situation: Optional[str] = None  # 1v1, 1v2, etc.


class RoundState(BaseModel):
    """State of a single round."""
    round_number: int
    phase: str = "buy"  # buy, live, post
    
    team1_players_alive: int = 5
    team2_players_alive: int = 5
    
    spike_planted: bool = False
    spike_planter: Optional[int] = None
    spike_site: Optional[str] = None
    
    events: List[RoundEvent] = []
    
    # Economy snapshot
    team1_loadout_value: int = 0
    team2_loadout_value: int = 0


class PredictionRequest(BaseModel):
    """Request for match prediction."""
    match_id: int
    team1_id: int
    team2_id: int
    current_score_team1: int = 0
    current_score_team2: int = 0
    rounds_played: int = 0
    map_id: Optional[str] = None
    
    # Live player stats
    player_stats: Optional[Dict[int, LivePlayerStats]] = None


class PredictionResult(BaseModel):
    """Result from prediction model."""
    match_id: int
    
    # Win probabilities
    team1_win_probability: float = Field(..., ge=0, le=1)
    team2_win_probability: float = Field(..., ge=0, le=1)
    
    # Confidence
    confidence: float = Field(..., ge=0, le=1)
    model_version: str = "v1.0"
    
    # Key factors
    key_factors: List[Dict[str, Any]] = []
    
    # Estimated remaining rounds
    estimated_rounds_remaining: Optional[int] = None
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class WebSocketMessage(BaseModel):
    """Message format for WebSocket communication."""
    type: str  # event, state, prediction, heartbeat
    match_id: Optional[int] = None
    data: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ClientSubscription(BaseModel):
    """Client subscription to match updates."""
    client_id: str
    match_ids: List[int] = []
    subscribed_at: datetime = Field(default_factory=datetime.utcnow)
    last_heartbeat: datetime = Field(default_factory=datetime.utcnow)
