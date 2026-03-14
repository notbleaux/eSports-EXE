[Ver001.000]
"""
Token Economy Pydantic Models
============================
Data models for the NJZ token system.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class TransactionType(str, Enum):
    """Types of token transactions."""
    EARN = "earn"
    SPEND = "spend"
    BET_WIN = "bet_win"
    BET_LOSS = "bet_loss"
    DAILY_CLAIM = "daily_claim"
    FANTASY_WIN = "fantasy_win"
    FANTASY_ENTRY = "fantasy_entry"
    SIMULATION_REWARD = "simulation_reward"
    COMMUNITY_REWARD = "community_reward"


class TokenBalance(BaseModel):
    """User token balance information."""
    user_id: str = Field(..., description="Unique user identifier")
    balance: int = Field(default=0, ge=0, description="Current token balance")
    total_earned: int = Field(default=0, ge=0, description="Total tokens ever earned")
    total_spent: int = Field(default=0, ge=0, description="Total tokens ever spent")
    last_daily_claim: Optional[datetime] = Field(None, description="Last daily claim timestamp")
    daily_streak: int = Field(default=0, ge=0, description="Consecutive daily claims")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


class TokenTransaction(BaseModel):
    """Individual token transaction record."""
    id: int = Field(..., description="Transaction ID")
    user_id: str = Field(..., description="User identifier")
    amount: int = Field(..., description="Token amount")
    type: TransactionType = Field(..., description="Transaction type")
    source: str = Field(..., description="Source of transaction")
    description: Optional[str] = Field(None, description="Human-readable description")
    balance_after: Optional[int] = Field(None, description="Balance after this transaction")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


class TokenClaimResponse(BaseModel):
    """Response from a token claim operation."""
    success: bool = Field(..., description="Whether claim was successful")
    amount: int = Field(default=0, description="Tokens awarded")
    new_balance: int = Field(..., description="Updated balance")
    streak_count: int = Field(default=1, description="Current daily streak")
    next_claim_available: datetime = Field(..., description="When next claim is available")
    message: str = Field(..., description="User-facing message")


class TokenHistoryResponse(BaseModel):
    """Paginated token transaction history."""
    user_id: str = Field(..., description="User identifier")
    transactions: List[TokenTransaction] = Field(default_factory=list)
    total_count: int = Field(..., description="Total transaction count")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    has_more: bool = Field(default=False)


class TokenStats(BaseModel):
    """User token statistics."""
    user_id: str = Field(..., description="User identifier")
    current_balance: int = Field(..., description="Current token balance")
    total_earned: int = Field(..., description="All-time earned")
    total_spent: int = Field(..., description="All-time spent")
    daily_streak: int = Field(..., description="Current claim streak")
    longest_streak: int = Field(..., description="Longest streak ever")
    total_claims: int = Field(..., description="Total daily claims")
    transactions_7d: int = Field(..., description="Transactions in last 7 days")
    transactions_30d: int = Field(..., description="Transactions in last 30 days")
    rank_percentile: Optional[float] = Field(None, description="Top X% of users by balance")


class DailyClaimRequest(BaseModel):
    """Request to claim daily tokens."""
    user_id: str = Field(..., description="User claiming tokens")
    timezone: Optional[str] = Field(default="UTC", description="User timezone")


class TokenAwardRequest(BaseModel):
    """Admin request to award tokens to a user."""
    user_id: str = Field(..., description="User to award")
    amount: int = Field(..., gt=0, description="Amount to award")
    source: str = Field(..., description="Reason for award")
    description: Optional[str] = Field(None, description="Additional context")
    admin_id: str = Field(..., description="Admin performing the action")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        if v > 1000000:
            raise ValueError('Amount cannot exceed 1,000,000')
        return v


class TokenDeductRequest(BaseModel):
    """Request to deduct tokens from a user."""
    user_id: str = Field(..., description="User to deduct from")
    amount: int = Field(..., gt=0, description="Amount to deduct")
    source: str = Field(..., description="Reason for deduction")
    description: Optional[str] = Field(None, description="Additional context")
    allow_negative: bool = Field(default=False, description="Allow balance to go negative")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v


class TokenLeaderboardEntry(BaseModel):
    """Entry in token leaderboard."""
    rank: int = Field(..., ge=1)
    user_id: str = Field(...)
    username: Optional[str] = Field(None)
    balance: int = Field(..., ge=0)
    total_earned: int = Field(..., ge=0)
    is_current_user: bool = Field(default=False)


class TokenLeaderboardResponse(BaseModel):
    """Token balance leaderboard."""
    entries: List[TokenLeaderboardEntry] = Field(default_factory=list)
    total_users: int = Field(...)
    current_user_rank: Optional[int] = Field(None)
    page: int = Field(default=1)
    page_size: int = Field(default=20)


DAILY_CLAIM_BASE_AMOUNT = 100
DAILY_CLAIM_STREAK_BONUS = 10
DAILY_CLAIM_MAX_STREAK = 7
DAILY_CLAIM_COOLDOWN_HOURS = 24

STREAK_MILESTONES = {
    7: 500,
    30: 2000,
    100: 10000,
}
