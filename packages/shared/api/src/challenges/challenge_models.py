"""
Daily Challenges Pydantic Models
===============================
Data models for daily challenge system.
"""

from datetime import date, datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class VideoQuizData(BaseModel):
    """Data for video quiz challenges."""
    video_url: str
    round_timestamp: int = Field(..., description="Start time in seconds")
    options: List[str]
    correct_answer: str


class PredictionData(BaseModel):
    """Data for prediction challenges."""
    match_id: str
    team_a: str
    team_b: str
    options: List[str]
    correct_answer: Optional[str] = None


class StatGuessData(BaseModel):
    """Data for stat guessing challenges."""
    player_id: str
    stat: str
    options: List[str]
    correct_answer: str


class TriviaData(BaseModel):
    """Data for trivia challenges."""
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None


class DailyChallenge(BaseModel):
    """Daily challenge definition."""
    id: str
    challenge_date: date
    type: str = Field(..., pattern="^(video_quiz|prediction|stat_guess|match_result|trivia)$")
    title: str
    description: Optional[str] = None
    data: dict[str, Any]  # Polymorphic based on type
    difficulty: str = "medium"
    token_reward: int = 50
    time_limit_seconds: Optional[int] = None
    total_attempts: int = 0
    total_correct: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ChallengeAttempt(BaseModel):
    """User's attempt at a challenge."""
    user_id: str
    challenge_id: str
    attempted_at: datetime
    answer_given: Optional[str] = None
    is_correct: Optional[bool] = None
    tokens_earned: int = 0
    time_taken_seconds: Optional[int] = None

    class Config:
        from_attributes = True


class ChallengeResult(BaseModel):
    """Result of submitting a challenge answer."""
    success: bool
    is_correct: bool
    correct_answer: Optional[str] = None
    tokens_earned: int = 0
    new_balance: Optional[int] = None
    streak: int = 0
    message: str
    explanation: Optional[str] = None


class ChallengeStreak(BaseModel):
    """User's challenge streak information."""
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_correct_date: Optional[date] = None
    total_correct: int = 0
    updated_at: datetime

    class Config:
        from_attributes = True


class ChallengeLeaderboardEntry(BaseModel):
    """Entry in challenge leaderboard."""
    challenge_id: str
    user_id: str
    username: Optional[str] = None
    score: int = 0
    time_taken: Optional[int] = None
    rank_position: int
    completed_at: datetime


class ChallengeStats(BaseModel):
    """Statistics for a challenge."""
    challenge_id: str
    total_attempts: int
    total_correct: int
    success_rate: float  # percentage
    average_time_seconds: Optional[float] = None


# Request Models

class SubmitAnswerRequest(BaseModel):
    """Request to submit a challenge answer."""
    answer: str = Field(..., min_length=1, max_length=100)
    time_taken_seconds: Optional[int] = Field(None, ge=0, le=3600)


class CreateChallengeRequest(BaseModel):
    """Admin request to create a challenge."""
    challenge_date: date
    type: str
    title: str
    description: Optional[str] = None
    data: dict[str, Any]
    difficulty: str = "medium"
    token_reward: int = 50
    time_limit_seconds: Optional[int] = None


class ChallengeHintRequest(BaseModel):
    """Request a hint for a challenge (reduces reward)."""
    challenge_id: str


class UserChallengeSummary(BaseModel):
    """Summary of user's challenge activity."""
    user_id: str
    total_attempted: int
    total_correct: int
    success_rate: float
    current_streak: int
    longest_streak: int
    total_tokens_earned: int
    rank_percentile: Optional[float] = None
