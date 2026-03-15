"""
Token Economy Integration Tests

Tests token balance, transactions, and daily claims.
Uses real database connections.
"""
import pytest
from datetime import datetime, timezone


@pytest.mark.asyncio
class TestTokenEndpoints:
    """Test suite for token economy endpoints."""
    
    async def test_token_balance_creation(self, transaction):
        """Test user token balance can be created."""
        user_id = "test-user-token-001"
        
        # Create token balance
        await transaction.execute(
            """
            INSERT INTO user_tokens (user_id, balance, total_earned, total_spent, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $5)
            """,
            user_id,
            1000,  # balance
            1000,  # total_earned
            0,     # total_spent
            datetime.now(timezone.utc)
        )
        
        # Verify balance
        balance = await transaction.fetchrow(
            "SELECT * FROM user_tokens WHERE user_id = $1",
            user_id
        )
        
        assert balance is not None
        assert balance["balance"] == 1000
        assert balance["total_earned"] == 1000
        assert balance["total_spent"] == 0
    
    async def test_token_transaction_logging(self, transaction):
        """Test token transactions are logged correctly."""
        user_id = "test-user-token-002"
        
        # Create user balance first
        await transaction.execute(
            """
            INSERT INTO user_tokens (user_id, balance, total_earned, total_spent, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $5)
            """,
            user_id,
            500,
            500,
            0,
            datetime.now(timezone.utc)
        )
        
        # Log transaction
        await transaction.execute(
            """
            INSERT INTO token_transactions (user_id, amount, type, source, description, balance_after, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            user_id,
            100,
            "earn",
            "daily_claim",
            "Daily login bonus",
            600,
            datetime.now(timezone.utc)
        )
        
        # Verify transaction
        transactions = await transaction.fetch(
            "SELECT * FROM token_transactions WHERE user_id = $1",
            user_id
        )
        
        assert len(transactions) == 1
        assert transactions[0]["amount"] == 100
        assert transactions[0]["type"] == "earn"
    
    async def test_daily_claim_tracking(self, transaction):
        """Test daily claims are tracked for streaks."""
        user_id = "test-user-token-003"
        
        # Record daily claim
        await transaction.execute(
            """
            INSERT INTO daily_claims (user_id, claim_date, streak_count, tokens_awarded, created_at)
            VALUES ($1, $2, $3, $4, $5)
            """,
            user_id,
            datetime.now(timezone.utc).date(),
            1,  # streak count
            50,  # tokens awarded
            datetime.now(timezone.utc)
        )
        
        # Verify claim
        claims = await transaction.fetch(
            "SELECT * FROM daily_claims WHERE user_id = $1",
            user_id
        )
        
        assert len(claims) == 1
        assert claims[0]["streak_count"] == 1
        assert claims[0]["tokens_awarded"] == 50
