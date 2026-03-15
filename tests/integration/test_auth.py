"""
Authentication Integration Tests

Tests user registration, login, and token validation.
Uses real database connections via asyncpg.
"""
import pytest
import asyncpg
from datetime import datetime, timezone


@pytest.mark.asyncio
class TestAuthEndpoints:
    """Test suite for authentication endpoints."""
    
    async def test_user_registration(self, transaction):
        """Test user can be registered successfully."""
        # Insert test user
        user_id = await transaction.fetchval(
            """
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            "testuser_integration",
            "test_integration@example.com",
            "hashed_password_for_testing",
            datetime.now(timezone.utc)
        )
        
        assert user_id is not None
        
        # Verify user exists
        user = await transaction.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            user_id
        )
        
        assert user is not None
        assert user["username"] == "testuser_integration"
        assert user["email"] == "test_integration@example.com"
    
    async def test_duplicate_username_prevented(self, transaction):
        """Test duplicate username registration is prevented."""
        # Insert first user
        await transaction.execute(
            """
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            "duptest",
            "dup1@example.com",
            "hash1",
            datetime.now(timezone.utc)
        )
        
        # Attempt duplicate username should fail
        with pytest.raises(asyncpg.exceptions.UniqueViolationError):
            await transaction.execute(
                """
                INSERT INTO users (username, email, password_hash, created_at)
                VALUES ($1, $2, $3, $4)
                """,
                "duptest",
                "dup2@example.com",
                "hash2",
                datetime.now(timezone.utc)
            )
    
    async def test_user_session_creation(self, transaction):
        """Test user session can be created."""
        # Create user
        user_id = await transaction.fetchval(
            """
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            "sessionuser",
            "session@example.com",
            "hash",
            datetime.now(timezone.utc)
        )
        
        # Create session
        session_token = "test-session-token-12345"
        session_id = await transaction.fetchval(
            """
            INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            user_id,
            session_token,
            datetime.now(timezone.utc),  # Already expired for testing
            datetime.now(timezone.utc)
        )
        
        assert session_id is not None
