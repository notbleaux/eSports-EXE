"""
Token Service
=============
Core business logic for the NJZ token economy.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

import asyncpg

from .token_models import (
    TokenBalance, TokenTransaction, TokenClaimResponse,
    TokenHistoryResponse, TokenStats, TransactionType,
    DailyClaimRequest, TokenAwardRequest, TokenDeductRequest,
    TokenLeaderboardEntry, TokenLeaderboardResponse,
    DAILY_CLAIM_BASE_AMOUNT, DAILY_CLAIM_STREAK_BONUS,
    DAILY_CLAIM_MAX_STREAK, DAILY_CLAIM_COOLDOWN_HOURS, STREAK_MILESTONES,
)

logger = logging.getLogger(__name__)


class TokenService:
    """Service for managing NJZ tokens."""
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
    
    async def get_or_create_balance(self, user_id: str) -> TokenBalance:
        """Get user's balance or create if doesn't exist."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT user_id, balance, total_earned, total_spent,
                       last_daily_claim, created_at, updated_at
                FROM user_tokens WHERE user_id = $1
                """,
                user_id
            )
            
            if row:
                streak = await self._calculate_streak(conn, user_id)
                balance_data = dict(row)
                balance_data['daily_streak'] = streak
                return TokenBalance(**balance_data)
            
            await conn.execute(
                """
                INSERT INTO user_tokens (user_id, balance, total_earned, total_spent)
                VALUES ($1, 0, 0, 0)
                ON CONFLICT (user_id) DO NOTHING
                """,
                user_id
            )
            
            return TokenBalance(user_id=user_id)
    
    async def claim_daily(self, request: DailyClaimRequest) -> TokenClaimResponse:
        """Process a daily token claim."""
        user_id = request.user_id
        
        async with self.db.acquire() as conn:
            async with conn.transaction():
                row = await conn.fetchrow(
                    """
                    SELECT balance, last_daily_claim 
                    FROM user_tokens WHERE user_id = $1
                    FOR UPDATE
                    """,
                    user_id
                )
                
                if not row:
                    await conn.execute(
                        "INSERT INTO user_tokens (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
                        user_id
                    )
                    row = {'balance': 0, 'last_daily_claim': None}
                
                last_claim = row['last_daily_claim']
                current_balance = row['balance']
                now = datetime.utcnow()
                
                if last_claim:
                    cooldown_end = last_claim + timedelta(hours=DAILY_CLAIM_COOLDOWN_HOURS)
                    if now < cooldown_end:
                        return TokenClaimResponse(
                            success=False,
                            amount=0,
                            new_balance=current_balance,
                            streak_count=await self._calculate_streak(conn, user_id),
                            next_claim_available=cooldown_end,
                            message=f"Next claim in {self._format_time(cooldown_end - now)}"
                        )
                
                streak = await self._calculate_streak(conn, user_id)
                if last_claim and (now - last_claim) < timedelta(hours=48):
                    streak = min(streak + 1, DAILY_CLAIM_MAX_STREAK)
                else:
                    streak = 1
                
                base_amount = DAILY_CLAIM_BASE_AMOUNT
                streak_bonus = min((streak - 1) * DAILY_CLAIM_STREAK_BONUS,
                                   (DAILY_CLAIM_MAX_STREAK - 1) * DAILY_CLAIM_STREAK_BONUS)
                total_amount = base_amount + streak_bonus
                
                milestone_bonus = 0
                for days, bonus in sorted(STREAK_MILESTONES.items(), reverse=True):
                    if streak >= days and streak % days == 0:
                        milestone_bonus = bonus
                        break
                
                total_amount += milestone_bonus
                new_balance = current_balance + total_amount
                
                await conn.execute(
                    """
                    UPDATE user_tokens 
                    SET balance = $1, total_earned = total_earned + $2,
                        last_daily_claim = $3, updated_at = $4
                    WHERE user_id = $5
                    """,
                    new_balance, total_amount, now, now, user_id
                )
                
                await conn.execute(
                    """
                    INSERT INTO token_transactions 
                    (user_id, amount, type, source, description, balance_after)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    user_id, total_amount, TransactionType.DAILY_CLAIM, 'daily_claim',
                    f"Daily claim - Day {streak} streak", new_balance
                )
                
                await conn.execute(
                    """
                    INSERT INTO daily_claims (user_id, claim_date, streak_count, tokens_awarded)
                    VALUES ($1, CURRENT_DATE, $2, $3)
                    ON CONFLICT (user_id, claim_date) DO UPDATE
                    SET streak_count = $2, tokens_awarded = $3
                    """,
                    user_id, streak, total_amount
                )
                
                milestone_msg = f" (+{milestone_bonus} bonus!)" if milestone_bonus > 0 else ""
                logger.info(f"User {user_id} claimed {total_amount} tokens (streak: {streak})")
                
                return TokenClaimResponse(
                    success=True,
                    amount=total_amount,
                    new_balance=new_balance,
                    streak_count=streak,
                    next_claim_available=now + timedelta(hours=DAILY_CLAIM_COOLDOWN_HOURS),
                    message=f"Claimed {total_amount} tokens! Streak: {streak}d{milestone_msg}"
                )
    
    async def award_tokens(
        self, request: TokenAwardRequest, tx_type: TransactionType = TransactionType.EARN
    ) -> TokenBalance:
        """Award tokens to a user."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                row = await conn.fetchrow(
                    """
                    INSERT INTO user_tokens (user_id, balance, total_earned)
                    VALUES ($1, $2, $2)
                    ON CONFLICT (user_id) DO UPDATE
                    SET balance = user_tokens.balance + $2,
                        total_earned = user_tokens.total_earned + $2,
                        updated_at = $3
                    RETURNING balance
                    """,
                    request.user_id, request.amount, datetime.utcnow()
                )
                
                new_balance = row['balance']
                
                await conn.execute(
                    """
                    INSERT INTO token_transactions 
                    (user_id, amount, type, source, description, balance_after)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    request.user_id, request.amount, tx_type, request.source,
                    request.description or f"By {request.admin_id}", new_balance
                )
                
                logger.info(f"Awarded {request.amount} to {request.user_id}")
                return await self.get_or_create_balance(request.user_id)
    
    async def deduct_tokens(
        self, request: TokenDeductRequest, tx_type: TransactionType = TransactionType.SPEND
    ) -> Tuple[bool, TokenBalance, str]:
        """Deduct tokens from a user."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                row = await conn.fetchrow(
                    "SELECT balance FROM user_tokens WHERE user_id = $1 FOR UPDATE",
                    request.user_id
                )
                
                if not row:
                    return False, await self.get_or_create_balance(request.user_id), "No balance"
                
                current_balance = row['balance']
                
                if current_balance < request.amount and not request.allow_negative:
                    return False, TokenBalance(user_id=request.user_id, balance=current_balance), \
                           f"Insufficient ({current_balance} < {request.amount})"
                
                new_balance = current_balance - request.amount
                
                await conn.execute(
                    """
                    UPDATE user_tokens 
                    SET balance = $1, total_spent = total_spent + $2, updated_at = $3
                    WHERE user_id = $4
                    """,
                    new_balance, request.amount, datetime.utcnow(), request.user_id
                )
                
                await conn.execute(
                    """
                    INSERT INTO token_transactions 
                    (user_id, amount, type, source, description, balance_after)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    request.user_id, -request.amount, tx_type, request.source,
                    request.description, new_balance
                )
                
                logger.info(f"Deducted {request.amount} from {request.user_id}")
                return True, await self.get_or_create_balance(request.user_id), "Success"
    
    async def get_transaction_history(
        self, user_id: str, page: int = 1, page_size: int = 20,
        tx_type: Optional[TransactionType] = None
    ) -> TokenHistoryResponse:
        """Get paginated transaction history."""
        offset = (page - 1) * page_size
        
        async with self.db.acquire() as conn:
            where_clause = "WHERE user_id = $1"
            params = [user_id]
            
            if tx_type:
                where_clause += f" AND type = ${len(params) + 1}"
                params.append(tx_type.value)
            
            count_row = await conn.fetchrow(
                f"SELECT COUNT(*) FROM token_transactions {where_clause}", *params
            )
            total_count = count_row['count']
            
            rows = await conn.fetch(
                f"""
                SELECT id, user_id, amount, type, source, description, balance_after, created_at
                FROM token_transactions {where_clause}
                ORDER BY created_at DESC LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
                """,
                *params, page_size, offset
            )
            
            transactions = [TokenTransaction(**dict(row)) for row in rows]
            
            return TokenHistoryResponse(
                user_id=user_id, transactions=transactions, total_count=total_count,
                page=page, page_size=page_size,
                has_more=offset + len(transactions) < total_count
            )
    
    async def get_token_stats(self, user_id: str) -> TokenStats:
        """Get comprehensive token statistics."""
        async with self.db.acquire() as conn:
            balance = await self.get_or_create_balance(user_id)
            
            tx_counts = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as tx_7d,
                    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as tx_30d,
                    COUNT(*) FILTER (WHERE type = 'daily_claim') as total_claims,
                    COALESCE(MAX(streak_count), 0) as longest_streak
                FROM token_transactions
                LEFT JOIN daily_claims USING (user_id)
                WHERE user_id = $1
                """,
                user_id
            )
            
            rank_row = await conn.fetchrow(
                """
                WITH ranked AS (
                    SELECT user_id, balance,
                           PERCENT_RANK() OVER (ORDER BY balance DESC) as percentile
                    FROM user_tokens
                )
                SELECT percentile FROM ranked WHERE user_id = $1
                """,
                user_id
            )
            
            return TokenStats(
                user_id=user_id, current_balance=balance.balance,
                total_earned=balance.total_earned, total_spent=balance.total_spent,
                daily_streak=balance.daily_streak,
                longest_streak=tx_counts['longest_streak'],
                total_claims=tx_counts['total_claims'] or 0,
                transactions_7d=tx_counts['tx_7d'] or 0,
                transactions_30d=tx_counts['tx_30d'] or 0,
                rank_percentile=rank_row['percentile'] if rank_row else None
            )
    
    async def get_leaderboard(
        self, page: int = 1, page_size: int = 20, current_user_id: Optional[str] = None
    ) -> TokenLeaderboardResponse:
        """Get token balance leaderboard."""
        offset = (page - 1) * page_size
        
        async with self.db.acquire() as conn:
            count_row = await conn.fetchrow("SELECT COUNT(*) FROM user_tokens")
            total_users = count_row['count']
            
            rows = await conn.fetch(
                """
                SELECT user_id, balance, total_earned,
                       ROW_NUMBER() OVER (ORDER BY balance DESC) as rank
                FROM user_tokens
                ORDER BY balance DESC LIMIT $1 OFFSET $2
                """,
                page_size, offset
            )
            
            entries = [
                TokenLeaderboardEntry(
                    rank=row['rank'], user_id=row['user_id'],
                    balance=row['balance'], total_earned=row['total_earned'],
                    is_current_user=(row['user_id'] == current_user_id)
                )
                for row in rows
            ]
            
            current_user_rank = None
            if current_user_id:
                rank_row = await conn.fetchrow(
                    """
                    SELECT rank FROM (
                        SELECT user_id, ROW_NUMBER() OVER (ORDER BY balance DESC) as rank
                        FROM user_tokens
                    ) ranked WHERE user_id = $1
                    """,
                    current_user_id
                )
                current_user_rank = rank_row['rank'] if rank_row else None
            
            return TokenLeaderboardResponse(
                entries=entries, total_users=total_users,
                current_user_rank=current_user_rank, page=page, page_size=page_size
            )
    
    async def _calculate_streak(self, conn, user_id: str) -> int:
        """Calculate current daily claim streak."""
        row = await conn.fetchrow(
            """
            SELECT streak_count, claim_date
            FROM daily_claims
            WHERE user_id = $1
            ORDER BY claim_date DESC LIMIT 1
            """,
            user_id
        )
        
        if not row:
            return 0
        
        last_claim_date = row['claim_date']
        today = datetime.utcnow().date()
        
        if last_claim_date == today:
            return row['streak_count']
        elif last_claim_date == today - timedelta(days=1):
            return row['streak_count']
        else:
            return 0
    
    @staticmethod
    def _format_time(delta: timedelta) -> str:
        """Format timedelta as human-readable."""
        hours = int(delta.total_seconds() // 3600)
        minutes = int((delta.total_seconds() % 3600) // 60)
        return f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
