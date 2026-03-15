"""
Challenge Service
================
Business logic for daily challenges.
"""

import logging
import random
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple

import asyncpg

from .challenge_models import (
    DailyChallenge, ChallengeAttempt, ChallengeResult, ChallengeStreak,
    ChallengeStats, SubmitAnswerRequest, UserChallengeSummary
)

logger = logging.getLogger(__name__)


class ChallengeService:
    """Service for daily challenges."""
    
    def __init__(self, db_pool: asyncpg.Pool, token_service=None):
        self.db = db_pool
        self.token_service = token_service
    
    async def get_daily_challenge(self, challenge_date: Optional[date] = None) -> Optional[DailyChallenge]:
        """Get the challenge for a specific date (defaults to today)."""
        target_date = challenge_date or date.today()
        
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, challenge_date, type, title, description, data,
                       difficulty, token_reward, time_limit_seconds,
                       total_attempts, total_correct, created_at
                FROM daily_challenges
                WHERE challenge_date = $1
                """,
                target_date
            )
            
            return DailyChallenge(**dict(row)) if row else None
    
    async def get_upcoming_challenges(self, days: int = 7) -> List[DailyChallenge]:
        """Get upcoming challenges for the next N days."""
        async with self.db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, challenge_date, type, title, description, data,
                       difficulty, token_reward, time_limit_seconds,
                       total_attempts, total_correct, created_at
                FROM daily_challenges
                WHERE challenge_date >= CURRENT_DATE
                ORDER BY challenge_date ASC
                LIMIT $1
                """,
                days
            )
            
            return [DailyChallenge(**dict(row)) for row in rows]
    
    async def submit_answer(
        self,
        user_id: str,
        challenge_id: str,
        request: SubmitAnswerRequest
    ) -> ChallengeResult:
        """Submit an answer for a challenge."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Get challenge
                challenge = await conn.fetchrow(
                    "SELECT * FROM daily_challenges WHERE id = $1",
                    challenge_id
                )
                
                if not challenge:
                    return ChallengeResult(
                        success=False,
                        is_correct=False,
                        message="Challenge not found"
                    )
                
                # Check if already attempted
                existing = await conn.fetchrow(
                    """
                    SELECT is_correct FROM user_challenges
                    WHERE user_id = $1 AND challenge_id = $2
                    """,
                    user_id, challenge_id
                )
                
                if existing:
                    return ChallengeResult(
                        success=False,
                        is_correct=False,
                        message="You have already attempted this challenge"
                    )
                
                # Check answer
                challenge_data = challenge['data']
                correct_answer = challenge_data.get('correct_answer')
                
                # For prediction challenges, answer might not be known yet
                if correct_answer is None:
                    # Store attempt but don't grade yet
                    await conn.execute(
                        """
                        INSERT INTO user_challenges
                        (user_id, challenge_id, answer_given, is_correct, time_taken_seconds)
                        VALUES ($1, $2, $3, NULL, $4)
                        """,
                        user_id, challenge_id, request.answer, request.time_taken_seconds
                    )
                    
                    return ChallengeResult(
                        success=True,
                        is_correct=False,  # Will be graded later
                        message="Your prediction has been recorded! Check back after the match.",
                        streak=await self._get_current_streak(conn, user_id)
                    )
                
                # Grade the answer
                is_correct = request.answer.lower().strip() == correct_answer.lower().strip()
                
                # Calculate tokens
                tokens_earned = challenge['token_reward'] if is_correct else 0
                
                # Streak bonus
                streak = await self._get_current_streak(conn, user_id)
                if is_correct and streak > 0:
                    streak_bonus = min(streak * 5, 50)  # +5 per streak, max +50
                    tokens_earned += streak_bonus
                
                # Store attempt
                await conn.execute(
                    """
                    INSERT INTO user_challenges
                    (user_id, challenge_id, answer_given, is_correct, tokens_earned, time_taken_seconds)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    user_id, challenge_id, request.answer, is_correct,
                    tokens_earned, request.time_taken_seconds
                )
                
                # Award tokens if correct
                new_balance = None
                if is_correct and tokens_earned > 0 and self.token_service:
                    from ..tokens.token_models import TokenAwardRequest
                    award_req = TokenAwardRequest(
                        user_id=user_id,
                        amount=tokens_earned,
                        source='daily_challenge',
                        description=f"Completed daily challenge: {challenge['title']}",
                        admin_id='system'
                    )
                    balance = await self.token_service.award_tokens(award_req)
                    new_balance = balance.balance
                
                # Build response
                message = f"Correct! You earned {tokens_earned} tokens!" if is_correct else "Incorrect. Try again tomorrow!"
                
                logger.info(f"User {user_id} answered challenge {challenge_id}: {is_correct}")
                
                return ChallengeResult(
                    success=True,
                    is_correct=is_correct,
                    correct_answer=correct_answer if not is_correct else None,
                    tokens_earned=tokens_earned,
                    new_balance=new_balance,
                    streak=streak + (1 if is_correct else 0),
                    message=message,
                    explanation=challenge_data.get('explanation')
                )
    
    async def get_user_streak(self, user_id: str) -> ChallengeStreak:
        """Get user's challenge streak."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT user_id, current_streak, longest_streak,
                       last_correct_date, total_correct, updated_at
                FROM challenge_streaks
                WHERE user_id = $1
                """,
                user_id
            )
            
            if row:
                return ChallengeStreak(**dict(row))
            
            return ChallengeStreak(user_id=user_id)
    
    async def get_challenge_stats(self, challenge_id: str) -> ChallengeStats:
        """Get statistics for a challenge."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT total_attempts, total_correct
                FROM daily_challenges
                WHERE id = $1
                """,
                challenge_id
            )
            
            if not row:
                raise ValueError("Challenge not found")
            
            total_attempts = row['total_attempts']
            total_correct = row['total_correct']
            
            # Get average time
            avg_time = await conn.fetchval(
                """
                SELECT AVG(time_taken_seconds)
                FROM user_challenges
                WHERE challenge_id = $1 AND time_taken_seconds IS NOT NULL
                """,
                challenge_id
            )
            
            success_rate = (total_correct / total_attempts * 100) if total_attempts > 0 else 0
            
            return ChallengeStats(
                challenge_id=challenge_id,
                total_attempts=total_attempts,
                total_correct=total_correct,
                success_rate=round(success_rate, 1),
                average_time_seconds=avg_time
            )
    
    async def get_user_summary(self, user_id: str) -> UserChallengeSummary:
        """Get summary of user's challenge activity."""
        async with self.db.acquire() as conn:
            # Get attempt stats
            stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as total_attempted,
                    COUNT(*) FILTER (WHERE is_correct = TRUE) as total_correct,
                    SUM(tokens_earned) as total_tokens
                FROM user_challenges
                WHERE user_id = $1
                """,
                user_id
            )
            
            # Get streak
            streak = await self.get_user_streak(user_id)
            
            # Calculate success rate
            total_attempted = stats['total_attempted'] or 0
            total_correct = stats['total_correct'] or 0
            success_rate = (total_correct / total_attempted * 100) if total_attempted > 0 else 0
            
            # Get percentile rank
            percentile = await conn.fetchval(
                """
                WITH user_scores AS (
                    SELECT user_id, COUNT(*) FILTER (WHERE is_correct = TRUE) as correct_count
                    FROM user_challenges
                    GROUP BY user_id
                ),
                ranked AS (
                    SELECT user_id, 
                           PERCENT_RANK() OVER (ORDER BY correct_count DESC) as percentile
                    FROM user_scores
                )
                SELECT percentile FROM ranked WHERE user_id = $1
                """,
                user_id
            )
            
            return UserChallengeSummary(
                user_id=user_id,
                total_attempted=total_attempted,
                total_correct=total_correct,
                success_rate=round(success_rate, 1),
                current_streak=streak.current_streak,
                longest_streak=streak.longest_streak,
                total_tokens_earned=stats['total_tokens'] or 0,
                rank_percentile=percentile
            )
    
    async def has_attempted(self, user_id: str, challenge_id: str) -> bool:
        """Check if user has attempted a challenge."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT 1 FROM user_challenges
                WHERE user_id = $1 AND challenge_id = $2
                """,
                user_id, challenge_id
            )
            return row is not None
    
    async def _get_current_streak(self, conn, user_id: str) -> int:
        """Get current streak for user."""
        row = await conn.fetchrow(
            "SELECT current_streak FROM challenge_streaks WHERE user_id = $1",
            user_id
        )
        return row['current_streak'] if row else 0
    
    async def create_challenge(self, challenge_data: dict) -> DailyChallenge:
        """Create a new challenge (admin only)."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO daily_challenges
                (id, challenge_date, type, title, description, data, difficulty, token_reward, time_limit_seconds)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
                """,
                challenge_data['id'],
                challenge_data['challenge_date'],
                challenge_data['type'],
                challenge_data['title'],
                challenge_data.get('description'),
                challenge_data['data'],
                challenge_data.get('difficulty', 'medium'),
                challenge_data.get('token_reward', 50),
                challenge_data.get('time_limit_seconds')
            )
            
            logger.info(f"Created challenge {row['id']} for {row['challenge_date']}")
            return DailyChallenge(**dict(row))
