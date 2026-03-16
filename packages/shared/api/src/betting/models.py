"""
[Ver001.000]
Betting Routes - Database models for betting system
"""

from typing import Optional, List
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum


class BetStatus(str, Enum):
    """Bet status enumeration."""
    PENDING = "pending"
    ACTIVE = "active"
    WON = "won"
    LOST = "lost"
    CASHED_OUT = "cashed_out"
    CANCELLED = "cancelled"


class OddsFormat(str, Enum):
    """Odds format enumeration."""
    DECIMAL = "decimal"
    AMERICAN = "american"
    FRACTIONAL = "fractional"


@dataclass
class Bet:
    """Bet database model."""
    bet_id: str
    user_id: str
    match_id: str
    team_id: str
    amount: float
    odds_accepted: float
    odds_format: OddsFormat
    potential_payout: float
    status: BetStatus
    placed_at: datetime
    settled_at: Optional[datetime] = None
    result: Optional[str] = None  # win, loss, push
    profit_loss: Optional[float] = None
    cash_out_amount: Optional[float] = None
    cash_out_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)


@dataclass
class OddsHistory:
    """Odds history database model."""
    history_id: str
    match_id: str
    timestamp: datetime
    team_a_decimal: float
    team_b_decimal: float
    team_a_american: int
    team_b_american: int
    team_a_probability: float
    team_b_probability: float
    vig_percentage: float
    confidence_score: float
    is_live: bool
    trigger: str  # What caused the odds change (e.g., "lineup_change", "market_movement")
    metadata: Optional[dict] = None
    
    # For live matches
    current_score_team_a: Optional[int] = None
    current_score_team_b: Optional[int] = None
    round_number: Optional[int] = None


@dataclass
class Leaderboard:
    """Betting leaderboard database model."""
    leaderboard_id: str
    user_id: str
    username: str
    
    # Stats
    total_bets: int = 0
    wins: int = 0
    losses: int = 0
    pushes: int = 0
    total_wagered: float = 0.0
    total_won: float = 0.0
    profit_loss: float = 0.0
    
    # Derived metrics
    win_rate: float = 0.0
    roi_percentage: float = 0.0
    
    # Streaks
    current_streak: int = 0  # Positive for win streak, negative for loss streak
    best_streak: int = 0
    worst_streak: int = 0
    
    # Time tracking
    first_bet_at: Optional[datetime] = None
    last_bet_at: Optional[datetime] = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)


@dataclass
class MatchBettingStats:
    """Aggregated betting stats for a match."""
    match_id: str
    total_bets: int
    total_volume: float
    team_a_bets: int
    team_b_bets: int
    team_a_volume: float
    team_b_volume: float
    team_a_percentage: float  # Percentage of bets on team A
    last_updated: datetime


@dataclass
class UserBettingStats:
    """User's betting statistics."""
    user_id: str
    username: str
    total_bets: int
    active_bets: int
    settled_bets: int
    wins: int
    losses: int
    pushes: int
    total_wagered: float
    total_won: float
    profit_loss: float
    win_rate: float
    roi_percentage: float
    average_odds: float
    favorite_team: Optional[str] = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)


# SQL Table Definitions for PostgreSQL/asyncpg
# These are used for database migrations and schema reference

BETS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS bets (
    bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    match_id UUID NOT NULL REFERENCES matches(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    odds_accepted DECIMAL(10, 4) NOT NULL CHECK (odds_accepted > 1),
    odds_format VARCHAR(20) DEFAULT 'decimal',
    potential_payout DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE,
    result VARCHAR(10),
    profit_loss DECIMAL(15, 2),
    cash_out_amount DECIMAL(15, 2),
    cash_out_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_placed_at ON bets(placed_at);
"""

ODDS_HISTORY_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS odds_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    team_a_decimal DECIMAL(10, 4) NOT NULL,
    team_b_decimal DECIMAL(10, 4) NOT NULL,
    team_a_american INTEGER NOT NULL,
    team_b_american INTEGER NOT NULL,
    team_a_probability DECIMAL(5, 4) NOT NULL,
    team_b_probability DECIMAL(5, 4) NOT NULL,
    vig_percentage DECIMAL(5, 4) NOT NULL,
    confidence_score DECIMAL(4, 3) NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    trigger VARCHAR(50),
    metadata JSONB,
    current_score_team_a INTEGER,
    current_score_team_b INTEGER,
    round_number INTEGER
);

CREATE INDEX IF NOT EXISTS idx_odds_history_match_id ON odds_history(match_id);
CREATE INDEX IF NOT EXISTS idx_odds_history_timestamp ON odds_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_odds_history_match_time ON odds_history(match_id, timestamp);
"""

LEADERBOARD_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS betting_leaderboard (
    leaderboard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    username VARCHAR(100) NOT NULL,
    total_bets INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    pushes INTEGER DEFAULT 0,
    total_wagered DECIMAL(15, 2) DEFAULT 0,
    total_won DECIMAL(15, 2) DEFAULT 0,
    profit_loss DECIMAL(15, 2) DEFAULT 0,
    win_rate DECIMAL(5, 4) DEFAULT 0,
    roi_percentage DECIMAL(7, 4) DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    worst_streak INTEGER DEFAULT 0,
    first_bet_at TIMESTAMP WITH TIME ZONE,
    last_bet_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_win_rate ON betting_leaderboard(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_profit ON betting_leaderboard(profit_loss DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_roi ON betting_leaderboard(roi_percentage DESC);
"""
