"""
Authentication test fixtures.
Provides test users, tokens, and auth utilities.
"""
import pytest
from datetime import datetime, timezone
from typing import Dict, Any
import jwt
import os

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "test-secret-key")
JWT_ALGORITHM = "HS256"


@pytest.fixture
def test_user_data() -> Dict[str, Any]:
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPassword123!",
        "display_name": "Test User"
    }


@pytest.fixture
def test_admin_data() -> Dict[str, Any]:
    """Sample admin user data for testing."""
    return {
        "username": "testadmin",
        "email": "admin@example.com",
        "password": "AdminPassword123!",
        "display_name": "Test Admin",
        "is_admin": True
    }


@pytest.fixture
def create_test_token():
    """Factory fixture to create JWT tokens for testing."""
    def _create_token(user_id: str, username: str, is_admin: bool = False) -> str:
        payload = {
            "sub": user_id,
            "username": username,
            "is_admin": is_admin,
            "iat": datetime.now(timezone.utc),
            "exp": int(datetime.now(timezone.utc).timestamp()) + 3600  # 1 hour (int per RFC 7519)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return _create_token


@pytest.fixture
def auth_headers(create_test_token):
    """Create authorization headers with valid token."""
    token = create_test_token("test-user-id", "testuser")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(create_test_token):
    """Create authorization headers with admin token."""
    token = create_test_token("admin-user-id", "testadmin", is_admin=True)
    return {"Authorization": f"Bearer {token}"}
