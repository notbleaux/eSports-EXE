"""
Daily Challenges Service
========================
Backend for daily video challenges, predictions, and rewards.
"""

from .challenge_service import ChallengeService
from .challenge_models import (
    DailyChallenge,
    ChallengeAttempt,
    ChallengeResult,
    ChallengeStreak,
    ChallengeLeaderboardEntry,
    SubmitAnswerRequest,
)
from .challenge_routes import router

__all__ = [
    "ChallengeService",
    "DailyChallenge",
    "ChallengeAttempt",
    "ChallengeResult",
    "ChallengeStreak",
    "ChallengeLeaderboardEntry",
    "SubmitAnswerRequest",
    "router",
]
