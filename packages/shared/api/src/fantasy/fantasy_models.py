"""
Fantasy eSports Pydantic Models
===============================
Data models for fantasy Valorant and CS2.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class GameType(str, Enum):
    VALORANT = "valorant"
    CS2 = "cs2"


class LeagueType(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    PREMIUM = "premium"


class DraftType(str, Enum):
    SNAKE = "snake"
    AUCTION = "auction"
    PICK_EM = "pick_em"


class DraftStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class FantasyLeague(BaseModel):
    """Fantasy league configuration."""
    id: str
    name: str
    description: Optional[str] = None
    game: GameType
    league_type: LeagueType = LeagueType.PUBLIC
    max_teams: int = 10
    roster_size: int = 5
    salary_cap: int = 100000
    draft_type: DraftType = DraftType.SNAKE
    draft_status: DraftStatus = DraftStatus.PENDING
    season_start_date: Optional[date] = None
    season_end_date: Optional[date] = None
    entry_fee_tokens: int = 0
    prize_pool_tokens: int = 0
    scoring_rules: Optional[Dict[str, Any]] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    team_count: int = 0
    
    class Config:
        from_attributes = True


class FantasyTeamSummary(BaseModel):
    """Team summary for listings."""
    id: str
    league_id: str
    owner_id: str
    team_name: str
    team_logo_url: Optional[str] = None
    total_points: int = 0
    weekly_points: int = 0
    rank_position: Optional[int] = None
    wins: int = 0
    losses: int = 0
    draws: int = 0
    streak: Optional[str] = None
    roster_count: int = 0


class FantasyTeam(BaseModel):
    """Full fantasy team with roster."""
    id: str
    league_id: str
    owner_id: str
    team_name: str
    team_logo_url: Optional[str] = None
    total_points: int = 0
    weekly_points: int = 0
    rank_position: Optional[int] = None
    wins: int = 0
    losses: int = 0
    draws: int = 0
    streak: Optional[str] = None
    budget_remaining: Optional[int] = None
    is_active: bool = True
    roster: List["FantasyRoster"] = []
    created_at: datetime
    updated_at: datetime


class FantasyRoster(BaseModel):
    """Individual roster spot."""
    id: int
    team_id: str
    player_id: str
    player_name: str
    player_role: Optional[str] = None
    team_tag: Optional[str] = None
    acquisition_type: str
    draft_round: Optional[int] = None
    draft_pick: Optional[int] = None
    purchase_price: Optional[int] = None
    is_captain: bool = False
    is_vice_captain: bool = False
    is_starter: bool = True
    is_bench: bool = False
    week_acquired: int = 1
    week_dropped: Optional[int] = None
    player_stats: Optional["PlayerSeasonStats"] = None
    
    class Config:
        from_attributes = True


class PlayerSeasonStats(BaseModel):
    """Aggregated stats for a rostered player."""
    total_points: Decimal = Decimal("0")
    matches_played: int = 0
    avg_fantasy_points: Decimal = Decimal("0")
    recent_form: List[Decimal] = []  # Last 5 weeks


class FantasyScoringPeriod(BaseModel):
    """Weekly scoring period."""
    id: int
    league_id: str
    week_number: int
    start_date: date
    end_date: date
    is_playoffs: bool = False
    is_finals: bool = False
    status: str = "upcoming"
    created_at: datetime


class FantasyPlayerScore(BaseModel):
    """Weekly performance for a player."""
    id: int
    scoring_period_id: int
    player_id: str
    fantasy_team_id: Optional[str] = None
    game: GameType
    
    # Match stats
    matches_played: int = 0
    matches_won: int = 0
    maps_played: int = 0
    rounds_played: int = 0
    
    # Combat
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    kd_ratio: Optional[Decimal] = None
    kast: Optional[Decimal] = None
    
    # CS2 specific
    headshots: int = 0
    headshot_pct: Optional[Decimal] = None
    awp_kills: int = 0
    entry_kills: int = 0
    entry_deaths: int = 0
    clutch_attempts: int = 0
    clutch_wins: int = 0
    
    # Valorant specific
    aces: int = 0
    first_bloods: int = 0
    plants: int = 0
    defuses: int = 0
    ult_kills: int = 0
    
    # Fantasy
    fantasy_points: Decimal = Decimal("0")
    breakdown: Optional[Dict[str, Decimal]] = None
    
    created_at: datetime
    updated_at: datetime


class FantasyMatchup(BaseModel):
    """Head-to-head matchup."""
    id: int
    league_id: str
    week_number: int
    team_a: FantasyTeamSummary
    team_b: FantasyTeamSummary
    team_a_points: Decimal = Decimal("0")
    team_b_points: Decimal = Decimal("0")
    winner_id: Optional[str] = None
    is_tie: bool = False
    status: str = "upcoming"
    created_at: datetime


class WaiverClaim(BaseModel):
    """Waiver wire claim."""
    id: int
    league_id: str
    team_id: str
    team_name: str
    player_to_add: str
    player_to_add_name: str
    player_to_drop: Optional[str] = None
    player_to_drop_name: Optional[str] = None
    claim_priority: int
    status: str = "pending"
    processed_at: Optional[datetime] = None
    created_at: datetime


class Trade(BaseModel):
    """Trade between teams."""
    id: str
    league_id: str
    proposing_team_id: str
    proposing_team_name: str
    receiving_team_id: str
    receiving_team_name: str
    proposed_players: List[Dict[str, str]]  # [{id, name}]
    received_players: List[Dict[str, str]]
    status: str = "pending"
    expires_at: datetime
    created_at: datetime
    responded_at: Optional[datetime] = None


class AvailablePlayer(BaseModel):
    """Player available for draft/waiver."""
    player_id: str
    name: str
    team_tag: str
    role: str
    game: GameType
    
    # Recent stats
    matches_played: int = 0
    avg_kills: Decimal = Decimal("0")
    avg_deaths: Decimal = Decimal("0")
    avg_assists: Decimal = Decimal("0")
    avg_fantasy_points: Decimal = Decimal("0")
    
    # Draft status
    is_drafted: bool = False
    drafted_by: Optional[str] = None
    estimated_value: Optional[int] = None  # For auction


# Request Models

class CreateLeagueRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    game: GameType
    league_type: LeagueType = LeagueType.PUBLIC
    max_teams: int = Field(10, ge=2, le=50)
    roster_size: int = Field(5, ge=3, le=10)
    salary_cap: int = Field(100000, ge=50000, le=500000)
    draft_type: DraftType = DraftType.SNAKE
    season_start_date: Optional[date] = None
    season_end_date: Optional[date] = None
    entry_fee_tokens: int = Field(0, ge=0)
    prize_pool_tokens: int = Field(0, ge=0)


class CreateTeamRequest(BaseModel):
    league_id: str
    team_name: str = Field(..., min_length=3, max_length=100)
    team_logo_url: Optional[str] = None


class DraftPlayerRequest(BaseModel):
    player_id: str
    player_name: str
    player_role: Optional[str] = None
    team_tag: Optional[str] = None
    bid_amount: Optional[int] = None  # For auction drafts


class SetLineupRequest(BaseModel):
    starters: List[str]  # Player IDs
    bench: List[str]
    captain: Optional[str] = None
    vice_captain: Optional[str] = None


class CreateWaiverClaimRequest(BaseModel):
    player_to_add: str
    player_to_drop: Optional[str] = None


class CreateTradeRequest(BaseModel):
    receiving_team_id: str
    proposed_players: List[str]  # Player IDs to give
    received_players: List[str]  # Player IDs to receive


class ScoringRules(BaseModel):
    """Fantasy scoring configuration."""
    kill: Decimal = Decimal("1.0")
    death: Decimal = Decimal("-0.5")
    assist: Decimal = Decimal("0.5")
    headshot: Optional[Decimal] = Decimal("0.5")  # CS2
    awp_kill: Optional[Decimal] = Decimal("1.5")  # CS2
    entry_kill: Optional[Decimal] = Decimal("2.0")  # CS2
    clutch_win: Optional[Decimal] = Decimal("3.0")  # CS2
    ace: Optional[Decimal] = Decimal("5.0")  # Valorant
    first_blood: Optional[Decimal] = Decimal("2.0")  # Valorant
    plant: Optional[Decimal] = Decimal("1.0")  # Valorant
    defuse: Optional[Decimal] = Decimal("2.0")  # Valorant
    match_win: Decimal = Decimal("3.0")
