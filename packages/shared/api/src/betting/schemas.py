"""
[Ver001.000]
Betting Routes - Pydantic schemas for match odds API endpoints
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class TeamFactorsResponse(BaseModel):
    """Team factors in odds response."""
    team_id: str
    win_rate: float = Field(..., ge=0, le=1, description="Recent win rate (0-1)")
    form_score: float = Field(..., ge=0, le=1, description="Last 5 matches weighted")
    map_strength: float = Field(..., ge=0, le=1, description="Map-specific performance")
    player_availability: float = Field(..., ge=0, le=1, description="Roster strength")
    fatigue_factor: float = Field(..., ge=0, le=1, description="Match density impact")


class HeadToHeadResponse(BaseModel):
    """Head-to-head matchup data."""
    total_matches: int
    team_a_wins: int
    team_b_wins: int
    draws: int
    recent_form: str = Field(..., description="Form string e.g., 'WLWLW'")


class OddsResponse(BaseModel):
    """Complete odds calculation response."""
    match_id: str
    
    # Decimal odds
    team_a_decimal: float = Field(..., description="Decimal odds for team A")
    team_b_decimal: float = Field(..., description="Decimal odds for team B")
    
    # American odds
    team_a_american: int = Field(..., description="American odds for team A")
    team_b_american: int = Field(..., description="American odds for team B")
    
    # Probabilities
    team_a_probability: float = Field(..., ge=0, le=1, description="Implied probability for team A")
    team_b_probability: float = Field(..., ge=0, le=1, description="Implied probability for team B")
    
    # Market info
    vig_percentage: float = Field(..., description="House edge percentage")
    margin: float = Field(..., description="Bookmaker margin")
    
    # Factor details
    team_a_factors: TeamFactorsResponse
    team_b_factors: TeamFactorsResponse
    head_to_head: HeadToHeadResponse
    
    # Status
    is_live: bool = Field(..., description="Whether match is live")
    last_updated: datetime = Field(..., description="Last odds update timestamp")
    confidence_score: float = Field(..., ge=0, le=1, description="Data quality confidence")
    
    # Cash-out
    cash_out_available: bool
    cash_out_multiplier: float = Field(..., ge=0, le=1, description="Cash-out percentage")
    
    class Config:
        json_schema_extra = {
            "example": {
                "match_id": "match_123",
                "team_a_decimal": 1.85,
                "team_b_decimal": 2.10,
                "team_a_american": -118,
                "team_b_american": 110,
                "team_a_probability": 0.540,
                "team_b_probability": 0.476,
                "vig_percentage": 0.05,
                "margin": 5.0,
                "team_a_factors": {
                    "team_id": "team_a",
                    "win_rate": 0.65,
                    "form_score": 0.70,
                    "map_strength": 0.60,
                    "player_availability": 1.0,
                    "fatigue_factor": 0.90
                },
                "team_b_factors": {
                    "team_id": "team_b",
                    "win_rate": 0.55,
                    "form_score": 0.60,
                    "map_strength": 0.65,
                    "player_availability": 1.0,
                    "fatigue_factor": 0.95
                },
                "head_to_head": {
                    "total_matches": 5,
                    "team_a_wins": 3,
                    "team_b_wins": 2,
                    "draws": 0,
                    "recent_form": "WLWLW"
                },
                "is_live": False,
                "last_updated": "2024-01-15T10:30:00Z",
                "confidence_score": 0.85,
                "cash_out_available": False,
                "cash_out_multiplier": 0.0
            }
        }


class OddsHistoryEntry(BaseModel):
    """Single odds history entry."""
    timestamp: datetime
    team_a_decimal: float
    team_b_decimal: float
    team_a_probability: float
    team_b_probability: float
    trigger: str = Field(..., description="What triggered the odds change")
    confidence_score: float


class OddsHistoryResponse(BaseModel):
    """Odds history response."""
    match_id: str
    entries: List[OddsHistoryEntry]
    total_entries: int


class OddsCalculationRequest(BaseModel):
    """Request to force odds recalculation."""
    is_live: Optional[bool] = False
    current_score: Optional[Dict[str, int]] = Field(
        None, 
        description="Current score if live {\"team_a\": 1, \"team_b\": 0}"
    )


class OddsCalculationResponse(BaseModel):
    """Response from forced odds calculation."""
    match_id: str
    success: bool
    odds: Optional[OddsResponse] = None
    message: str
    calculated_at: datetime


class LeaderboardEntry(BaseModel):
    """Single betting leaderboard entry."""
    rank: int = Field(..., ge=1)
    user_id: str
    username: str
    total_bets: int
    wins: int
    win_rate: float = Field(..., ge=0, le=1)
    profit_loss: float
    roi_percentage: float
    current_streak: int
    best_streak: int


class BettingLeaderboardResponse(BaseModel):
    """Betting leaderboard response."""
    entries: List[LeaderboardEntry]
    total_entries: int
    generated_at: datetime


class OddsFormatInfo(BaseModel):
    """Information about an odds format."""
    key: str
    name: str
    description: str
    example: str
    region: str


class OddsFormatsResponse(BaseModel):
    """Available odds formats response."""
    formats: List[OddsFormatInfo]


class CashOutRequest(BaseModel):
    """Cash out request."""
    bet_id: str
    accept_current_multiplier: bool = True


class CashOutResponse(BaseModel):
    """Cash out response."""
    bet_id: str
    success: bool
    cashed_out_amount: float
    potential_winnings: float
    multiplier_used: float
    processed_at: datetime
    message: str


class BetSlipRequest(BaseModel):
    """Place a bet request."""
    match_id: str
    team_id: str
    amount: float = Field(..., gt=0)
    odds_accepted: float = Field(..., gt=1)
    odds_format: str = Field(default="decimal", pattern=r"^(decimal|american|fractional)$")


class BetSlipResponse(BaseModel):
    """Bet placement response."""
    bet_id: str
    match_id: str
    team_id: str
    amount: float
    odds_accepted: float
    potential_payout: float
    placed_at: datetime
    status: str  # pending, active, won, lost, cashed_out
