"""
[Ver001.000]
Authentication End-to-End Tests
===============================

Run these tests after fixing the import path issue:
    cd packages/shared
    py -m pytest ../../.job-board/B1/test_auth_e2e.py -v

Requirements:
    pip install pytest pytest-asyncio httpx asyncpg

Environment:
    DATABASE_URL=postgresql://user:pass@host/db
    JWT_SECRET_KEY=test-secret-key-for-testing
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio

# Add packages/shared to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'shared'))

# Skip all tests if import fails
pytestmark = pytest.mark.skipif(
    not os.path.exists(os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'shared', 'axiom_esports_data')),
    reason="Import path fix not applied. Run FIX-IMPORT-PATHS.ps1 first."
)

try:
    from fastapi.testclient import TestClient
    from api.main import app
    IMPORTS_OK = True
except ImportError as e:
    IMPORTS_OK = False
    IMPORT_ERROR = str(e)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def test_client():
    """Create a test client for the API."""
    if not IMPORTS_OK:
        pytest.skip(f"Imports failed: {IMPORT_ERROR}")
    with TestClient(app) as client:
        yield client


@pytest.fixture
def test_user():
    """Generate unique test user data."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    return {
        "username": f"testuser_{timestamp}",
        "email": f"test_{timestamp}@example.com",
        "password": "TestPassword123!",
        "password_confirm": "TestPassword123!",
        "display_name": f"Test User {timestamp}"
    }


@pytest.fixture
def admin_credentials():
    """Default admin credentials from migration."""
    return {
        "username": "admin",
        "password": "admin123"  # Default from migration - CHANGE IN PRODUCTION
    }


# ============================================================================
# Registration Tests
# ============================================================================

class TestRegistration:
    """Tests for POST /auth/register"""
    
    def test_register_success(self, test_client, test_user):
        """Test successful user registration."""
        response = test_client.post("/auth/register", json=test_user)
        assert response.status_code == 201
        
        data = response.json()
        assert "id" in data
        assert data["username"] == test_user["username"]
        assert data["email"] == test_user["email"]
        assert "hashed_password" not in data  # Password should not be returned
        assert data["is_active"] is True
        
    def test_register_duplicate_username(self, test_client, test_user):
        """Test registration with duplicate username."""
        # First registration
        response1 = test_client.post("/auth/register", json=test_user)
        assert response1.status_code == 201
        
        # Second registration with same username
        test_user["email"] = f"different_{test_user['email']}"
        response2 = test_client.post("/auth/register", json=test_user)
        assert response2.status_code == 409
        assert "already registered" in response2.json()["detail"].lower()
        
    def test_register_duplicate_email(self, test_client, test_user):
        """Test registration with duplicate email."""
        # First registration
        response1 = test_client.post("/auth/register", json=test_user)
        assert response1.status_code == 201
        
        # Second registration with same email
        test_user["username"] = f"different_{test_user['username']}"
        response2 = test_client.post("/auth/register", json=test_user)
        assert response2.status_code == 409
        assert "already registered" in response2.json()["detail"].lower()
        
    def test_register_password_mismatch(self, test_client, test_user):
        """Test registration with mismatched passwords."""
        test_user["password_confirm"] = "DifferentPassword123!"
        response = test_client.post("/auth/register", json=test_user)
        assert response.status_code == 422  # Validation error
        
    def test_register_invalid_email(self, test_client, test_user):
        """Test registration with invalid email."""
        test_user["email"] = "not-an-email"
        response = test_client.post("/auth/register", json=test_user)
        assert response.status_code == 422
        
    def test_register_short_password(self, test_client, test_user):
        """Test registration with short password."""
        test_user["password"] = "short"
        test_user["password_confirm"] = "short"
        response = test_client.post("/auth/register", json=test_user)
        assert response.status_code == 422


# ============================================================================
# Login Tests
# ============================================================================

class TestLogin:
    """Tests for POST /auth/login"""
    
    def test_login_with_username(self, test_client, test_user):
        """Test login using username."""
        # Register first
        test_client.post("/auth/register", json=test_user)
        
        # Login
        response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        
    def test_login_with_email(self, test_client, test_user):
        """Test login using email."""
        # Register first
        test_client.post("/auth/register", json=test_user)
        
        # Login with email
        response = test_client.post("/auth/login", json={
            "username": test_user["email"],  # Can use email as username
            "password": test_user["password"]
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
        
    def test_login_wrong_password(self, test_client, test_user):
        """Test login with incorrect password."""
        # Register first
        test_client.post("/auth/register", json=test_user)
        
        # Login with wrong password
        response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
        
    def test_login_nonexistent_user(self, test_client):
        """Test login with non-existent user."""
        response = test_client.post("/auth/login", json={
            "username": "nonexistent_user_12345",
            "password": "SomePassword123!"
        })
        assert response.status_code == 401


# ============================================================================
# Token Refresh Tests
# ============================================================================

class TestTokenRefresh:
    """Tests for POST /auth/refresh"""
    
    def test_refresh_token_success(self, test_client, test_user):
        """Test successful token refresh."""
        # Register and login
        test_client.post("/auth/register", json=test_user)
        login_response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh
        response = test_client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["refresh_token"] != refresh_token  # Should be rotated
        
    def test_refresh_token_reuse(self, test_client, test_user):
        """Test that used refresh token cannot be reused."""
        # Register and login
        test_client.post("/auth/register", json=test_user)
        login_response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh once
        test_client.post("/auth/refresh", json={"refresh_token": refresh_token})
        
        # Try to refresh again with same token
        response = test_client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert response.status_code == 401
        
    def test_refresh_invalid_token(self, test_client):
        """Test refresh with invalid token."""
        response = test_client.post("/auth/refresh", json={
            "refresh_token": "invalid.token.here"
        })
        assert response.status_code == 401


# ============================================================================
# User Profile Tests
# ============================================================================

class TestUserProfile:
    """Tests for GET /auth/me and PATCH /auth/me"""
    
    def test_get_me_success(self, test_client, test_user):
        """Test getting current user profile."""
        # Register and login
        test_client.post("/auth/register", json=test_user)
        login_response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        access_token = login_response.json()["access_token"]
        
        # Get profile
        response = test_client.get("/auth/me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["username"] == test_user["username"]
        assert "hashed_password" not in data
        
    def test_get_me_no_auth(self, test_client):
        """Test getting profile without authentication."""
        response = test_client.get("/auth/me")
        assert response.status_code == 403  # or 401 depending on implementation
        
    def test_update_me_success(self, test_client, test_user):
        """Test updating user profile."""
        # Register and login
        test_client.post("/auth/register", json=test_user)
        login_response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        access_token = login_response.json()["access_token"]
        
        # Update profile
        new_display_name = "Updated Name"
        response = test_client.patch("/auth/me", json={
            "display_name": new_display_name
        }, headers={
            "Authorization": f"Bearer {access_token}"
        })
        assert response.status_code == 200
        assert response.json()["display_name"] == new_display_name


# ============================================================================
# Password Change Tests
# ============================================================================

class TestPasswordChange:
    """Tests for POST /auth/password/change"""
    
    def test_change_password_success(self, test_client, test_user):
        """Test successful password change."""
        # Register and login
        test_client.post("/auth/register", json=test_user)
        login_response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        access_token = login_response.json()["access_token"]
        
        # Change password
        new_password = "NewPassword123!"
        response = test_client.post("/auth/password/change", json={
            "current_password": test_user["password"],
            "new_password": new_password,
            "new_password_confirm": new_password
        }, headers={
            "Authorization": f"Bearer {access_token}"
        })
        assert response.status_code == 200
        
        # Verify can login with new password
        login_response2 = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": new_password
        })
        assert login_response2.status_code == 200
        
    def test_change_password_wrong_current(self, test_client, test_user):
        """Test password change with wrong current password."""
        # Register and login
        test_client.post("/auth/register", json=test_user)
        login_response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        access_token = login_response.json()["access_token"]
        
        # Try to change with wrong current password
        response = test_client.post("/auth/password/change", json={
            "current_password": "WrongPassword123!",
            "new_password": "NewPassword123!",
            "new_password_confirm": "NewPassword123!"
        }, headers={
            "Authorization": f"Bearer {access_token}"
        })
        assert response.status_code == 401


# ============================================================================
# Logout Tests
# ============================================================================

class TestLogout:
    """Tests for POST /auth/logout"""
    
    def test_logout_success(self, test_client, test_user):
        """Test successful logout."""
        # Register and login
        test_client.post("/auth/register", json=test_user)
        login_response = test_client.post("/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        access_token = login_response.json()["access_token"]
        refresh_token = login_response.json()["refresh_token"]
        
        # Logout
        response = test_client.post("/auth/logout", json={
            "refresh_token": refresh_token
        }, headers={
            "Authorization": f"Bearer {access_token}"
        })
        assert response.status_code == 200
        
        # Verify refresh token is revoked
        refresh_response = test_client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert refresh_response.status_code == 401


# ============================================================================
# Password Reset Tests
# ============================================================================

class TestPasswordReset:
    """Tests for POST /auth/password/reset-request and POST /auth/password/reset"""
    
    def test_reset_request_nonexistent_email(self, test_client):
        """Test reset request for non-existent email (should not reveal)."""
        response = test_client.post("/auth/password/reset-request", json={
            "email": "nonexistent@example.com"
        })
        # Should return success to prevent user enumeration
        assert response.status_code == 200
        
    def test_reset_request_success(self, test_client, test_user):
        """Test password reset request for existing user."""
        # Register user
        test_client.post("/auth/register", json=test_user)
        
        response = test_client.post("/auth/password/reset-request", json={
            "email": test_user["email"]
        })
        assert response.status_code == 200
        
        # Note: Email is not actually sent in current implementation (TODO)


# ============================================================================
# Security Tests
# ============================================================================

class TestSecurity:
    """Security-focused tests"""
    
    def test_password_not_returned_in_response(self, test_client, test_user):
        """Verify password hash is never returned in API responses."""
        response = test_client.post("/auth/register", json=test_user)
        assert response.status_code == 201
        
        response_text = response.text
        assert "password" not in response_text.lower() or "hashed_password" not in response_text
        
    def test_sql_injection_username(self, test_client):
        """Test SQL injection protection in username."""
        malicious_username = "test'; DROP TABLE users; --"
        response = test_client.post("/auth/register", json={
            "username": malicious_username,
            "email": "test@example.com",
            "password": "TestPassword123!",
            "password_confirm": "TestPassword123!"
        })
        # Should either reject or safely handle, not execute SQL
        assert response.status_code in [201, 422]


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
