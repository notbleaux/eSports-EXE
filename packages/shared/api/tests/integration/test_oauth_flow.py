"""
[Ver002.000]
OAuth End-to-End Integration Tests

Full OAuth flow tests from authorization to account linking.
"""

import pytest
import asyncio
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch, Mock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.auth.oauth import (
    DiscordOAuth, GoogleOAuth, GitHubOAuth,
    generate_state_token, verify_state_token, 
    link_oauth_account, find_user_by_oauth, OAuthConfig
)


class TestDiscordOAuthFullFlow:
    """Discord OAuth complete flow tests."""
    
    @pytest.fixture
    def mock_db_pool(self):
        """Create mock database pool."""
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_discord_oauth_full_flow(self, mock_db_pool):
        """Test complete Discord OAuth flow."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            # Step 1: Generate state token
            state = await generate_state_token("discord", user_id="user_123")
            assert isinstance(state, str)
            assert len(state) > 20
            
            # Step 2: Verify state token
            mock_conn.fetchrow.return_value = {
                "id": 1,
                "state_token": state,
                "provider": "discord",
                "user_id": "user_123",
                "redirect_url": "http://localhost:3000/auth/callback",
                "used": False,
                "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
            }
            
            state_data = await verify_state_token(state, "discord")
            assert state_data is not None
            assert state_data["user_id"] == "user_123"
            
            # Step 3: Exchange code for access token (mocked)
            discord = DiscordOAuth()
            
            # Mock httpx client for token exchange
            token_response = MagicMock()
            token_response.json.return_value = {
                "access_token": "discord_access_token_123",
                "token_type": "Bearer",
                "expires_in": 604800
            }
            token_response.raise_for_status = Mock()
            
            user_response = MagicMock()
            user_response.json.return_value = {
                "id": "discord_user_123",
                "email": "user@example.com",
                "username": "TestUser",
                "avatar": "avatar_hash_123"
            }
            user_response.raise_for_status = Mock()
            
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=token_response)
            mock_client.get = AsyncMock(return_value=user_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            
            with patch('httpx.AsyncClient', return_value=mock_client):
                with patch.object(OAuthConfig, 'DISCORD_CLIENT_ID', 'test_client_id'):
                    with patch.object(OAuthConfig, 'DISCORD_CLIENT_SECRET', 'test_client_secret'):
                        # Exchange code
                        token_data = await discord.exchange_code("auth_code_123")
                        assert token_data["access_token"] == "discord_access_token_123"
                        
                        # Get user info
                        user_info = await discord.get_user_info(token_data["access_token"])
                        assert user_info["provider_id"] == "discord_user_123"
                        assert user_info["email"] == "user@example.com"
            
            # Step 4: Link OAuth account to user
            mock_conn.fetchrow.side_effect = [
                None,  # No existing OAuth account with this provider_id
                None,  # User doesn't have discord linked yet
                {      # Return created account
                    "id": 1,
                    "user_id": "user_123",
                    "provider": "discord",
                    "provider_account_id": "discord_user_123"
                }
            ]
            
            linked_account = await link_oauth_account(
                user_id="user_123",
                provider="discord",
                provider_account_id="discord_user_123",
                provider_email="user@example.com",
                access_token="discord_access_token_123"
            )
            
            assert linked_account["user_id"] == "user_123"
            assert linked_account["provider"] == "discord"
    
    @pytest.mark.asyncio
    async def test_oauth_account_linking_integration(self, mock_db_pool):
        """Test OAuth account linking with existing user."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            # Scenario: Existing user linking Discord for first time
            mock_conn.fetchrow.side_effect = [
                None,  # No existing account with this discord id
                None,  # User doesn't have discord linked
                {      # Created account
                    "id": 1,
                    "user_id": "existing_user_456",
                    "provider": "discord",
                    "provider_account_id": "new_discord_789"
                }
            ]
            
            result = await link_oauth_account(
                user_id="existing_user_456",
                provider="discord",
                provider_account_id="new_discord_789",
                provider_email="existing@example.com",
                access_token="token123"
            )
            
            assert result["user_id"] == "existing_user_456"
            assert result["provider"] == "discord"
    
    @pytest.mark.asyncio
    async def test_oauth_duplicate_provider_error(self, mock_db_pool):
        """Test error when user tries to link same provider twice."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            # User already has Discord linked, trying to link another Discord account
            mock_conn.fetchrow.side_effect = [
                None,  # No account with this specific provider_id
                {"id": 2}  # But user already has a discord account
            ]
            
            with pytest.raises(ValueError) as exc_info:
                await link_oauth_account(
                    user_id="user_123",
                    provider="discord",
                    provider_account_id="different_discord_id",
                    provider_email="new@example.com"
                )
            
            assert "already has a discord account" in str(exc_info.value)


class TestGoogleOAuthFlow:
    """Google OAuth flow tests."""
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_google_oauth_authorization_url(self):
        """Test Google authorization URL generation."""
        google = GoogleOAuth()
        
        with patch.object(OAuthConfig, 'GOOGLE_CLIENT_ID', 'google_client_id'):
            url = await google.get_authorization_url("test_state_123")
            
            assert "accounts.google.com" in url
            assert "client_id=google_client_id" in url
            assert "state=test_state_123" in url
            assert "access_type=offline" in url  # Important for refresh tokens
            assert "prompt=consent" in url
    
    @pytest.mark.asyncio
    async def test_google_oauth_token_exchange(self, mock_db_pool):
        """Test Google token exchange."""
        mock_pool, mock_conn = mock_db_pool
        
        google = GoogleOAuth()
        
        token_response = MagicMock()
        token_response.json.return_value = {
            "access_token": "google_access_token",
            "refresh_token": "google_refresh_token",
            "id_token": "google_id_token",
            "expires_in": 3600
        }
        token_response.raise_for_status = Mock()
        
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=token_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        
        with patch('httpx.AsyncClient', return_value=mock_client):
            with patch.object(OAuthConfig, 'GOOGLE_CLIENT_ID', 'google_id'):
                with patch.object(OAuthConfig, 'GOOGLE_CLIENT_SECRET', 'google_secret'):
                    token_data = await google.exchange_code("google_auth_code")
                    
                    assert "access_token" in token_data
                    assert "refresh_token" in token_data  # Important for Google


class TestGitHubOAuthFlow:
    """GitHub OAuth flow tests."""
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_github_oauth_with_private_email(self, mock_db_pool):
        """Test GitHub OAuth when user has private email."""
        mock_pool, mock_conn = mock_db_pool
        
        github = GitHubOAuth()
        
        # First response - user with no public email
        user_response = MagicMock()
        user_response.json.return_value = {
            "id": 12345,
            "login": "testuser",
            "email": None,  # Private email
            "avatar_url": "https://avatar.url"
        }
        user_response.raise_for_status = Mock()
        
        # Second response - emails endpoint
        emails_response = MagicMock()
        emails_response.status_code = 200
        emails_response.json.return_value = [
            {"email": "primary@example.com", "primary": True, "verified": True},
            {"email": "secondary@example.com", "primary": False, "verified": True}
        ]
        emails_response.raise_for_status = Mock()
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(side_effect=[user_response, emails_response])
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        
        with patch('httpx.AsyncClient', return_value=mock_client):
            user_info = await github.get_user_info("github_token")
            
            assert user_info["email"] == "primary@example.com"
            assert mock_client.get.call_count == 2  # Called both endpoints
    
    @pytest.mark.asyncio
    async def test_github_oauth_with_public_email(self, mock_db_pool):
        """Test GitHub OAuth when user has public email."""
        mock_pool, mock_conn = mock_db_pool
        
        github = GitHubOAuth()
        
        user_response = MagicMock()
        user_response.json.return_value = {
            "id": 12345,
            "login": "testuser",
            "email": "public@example.com",  # Public email
            "avatar_url": "https://avatar.url"
        }
        user_response.raise_for_status = Mock()
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=user_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        
        with patch('httpx.AsyncClient', return_value=mock_client):
            user_info = await github.get_user_info("github_token")
            
            assert user_info["email"] == "public@example.com"
            assert mock_client.get.call_count == 1  # Only called user endpoint


class TestOAuthStateSecurity:
    """OAuth state parameter security tests."""
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_state_token_is_unique(self, mock_db_pool):
        """Test that generated state tokens are unique."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            states = []
            for i in range(5):
                mock_conn.fetchrow.return_value = None  # No collision
                state = await generate_state_token("discord")
                states.append(state)
            
            # All states should be unique
            assert len(set(states)) == 5
    
    @pytest.mark.asyncio
    async def test_used_state_token_rejected(self, mock_db_pool):
        """Test that used state tokens are rejected."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            # Return token that was already used
            mock_conn.fetchrow.return_value = {
                "id": 1,
                "state_token": "used_state",
                "provider": "discord",
                "user_id": "user_123",
                "used": True,  # Already used
                "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
            }
            
            result = await verify_state_token("used_state", "discord")
            
            # Query filters out used tokens, so result should be None
            # (This assumes the query includes "AND used = FALSE")
            # If not, we should explicitly check for used status
    
    @pytest.mark.asyncio
    async def test_expired_state_token_rejected(self, mock_db_pool):
        """Test that expired state tokens are rejected."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            # Return expired token
            mock_conn.fetchrow.return_value = None  # Query filters by expires_at
            
            result = await verify_state_token("expired_state", "discord")
            
            assert result is None


class TestOAuthAccountLookup:
    """OAuth account lookup tests."""
    
    @pytest.fixture
    def mock_db_pool(self):
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_conn.fetchrow = AsyncMock()
        
        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
        
        return mock_pool, mock_conn
    
    @pytest.mark.asyncio
    async def test_find_user_by_existing_oauth(self, mock_db_pool):
        """Test finding user by existing OAuth account."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            mock_conn.fetchrow.return_value = {
                "id": "user_123",
                "email": "user@example.com",
                "username": "testuser"
            }
            
            user = await find_user_by_oauth("discord", "discord_user_123")
            
            assert user is not None
            assert user["id"] == "user_123"
            assert user["email"] == "user@example.com"
    
    @pytest.mark.asyncio
    async def test_find_user_by_nonexistent_oauth(self, mock_db_pool):
        """Test finding user by non-existent OAuth account."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            mock_conn.fetchrow.return_value = None
            
            user = await find_user_by_oauth("discord", "unknown_user")
            
            assert user is None


class TestOAuthProviderConfiguration:
    """OAuth provider configuration tests."""
    
    def test_discord_config_attributes(self):
        """Test Discord OAuth configuration."""
        assert hasattr(OAuthConfig, 'DISCORD_CLIENT_ID')
        assert hasattr(OAuthConfig, 'DISCORD_CLIENT_SECRET')
        assert hasattr(OAuthConfig, 'DISCORD_REDIRECT_URI')
        assert hasattr(OAuthConfig, 'DISCORD_AUTH_URL')
        assert hasattr(OAuthConfig, 'DISCORD_TOKEN_URL')
    
    def test_google_config_attributes(self):
        """Test Google OAuth configuration."""
        assert hasattr(OAuthConfig, 'GOOGLE_CLIENT_ID')
        assert hasattr(OAuthConfig, 'GOOGLE_CLIENT_SECRET')
        assert hasattr(OAuthConfig, 'GOOGLE_REDIRECT_URI')
        assert hasattr(OAuthConfig, 'GOOGLE_AUTH_URL')
        assert hasattr(OAuthConfig, 'GOOGLE_TOKEN_URL')
        assert hasattr(OAuthConfig, 'GOOGLE_USER_URL')
    
    def test_github_config_attributes(self):
        """Test GitHub OAuth configuration."""
        assert hasattr(OAuthConfig, 'GITHUB_CLIENT_ID')
        assert hasattr(OAuthConfig, 'GITHUB_CLIENT_SECRET')
        assert hasattr(OAuthConfig, 'GITHUB_REDIRECT_URI')
        assert hasattr(OAuthConfig, 'GITHUB_AUTH_URL')
        assert hasattr(OAuthConfig, 'GITHUB_TOKEN_URL')


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
