"""
[Ver001.000]
Critical OAuth Security Tests
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch, Mock, call
from datetime import datetime, timezone, timedelta

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.auth.oauth import (
    OAuthConfig, DiscordOAuth, GoogleOAuth, GitHubOAuth,
    generate_state_token, verify_state_token, get_provider,
    find_user_by_oauth, link_oauth_account, is_oauth_configured
)


class TestOAuthStateValidation:
    """OAuth state parameter CSRF prevention tests."""
    
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
    async def test_state_token_generation(self, mock_db_pool):
        """State token is generated and stored."""
        mock_pool, mock_conn = mock_db_pool
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            state = await generate_state_token("discord", user_id="user_123")
            
            # State should be a non-empty string
            assert isinstance(state, str)
            assert len(state) > 20  # Should be sufficiently long
            
            # Should store in database
            mock_conn.execute.assert_called_once()
            call_args = mock_conn.execute.call_args[0]
            assert "INSERT INTO oauth_state_tokens" in call_args[0]
    
    @pytest.mark.asyncio
    async def test_state_token_verification_success(self, mock_db_pool):
        """Valid state token verifies successfully."""
        mock_pool, mock_conn = mock_db_pool
        
        # Mock valid token record
        mock_conn.fetchrow.return_value = {
            "id": 1,
            "state_token": "valid_state",
            "provider": "discord",
            "user_id": "user_123",
            "redirect_url": "http://localhost/callback",
            "used": False,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
        }
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_state_token("valid_state", "discord")
            
            assert result is not None
            assert result["user_id"] == "user_123"
            assert result["redirect_url"] == "http://localhost/callback"
            
            # Should mark as used
            mock_conn.execute.assert_called()
            update_call = mock_conn.execute.call_args
            assert "used = TRUE" in update_call[0][0] or "UPDATE oauth_state_tokens" in update_call[0][0]
    
    @pytest.mark.asyncio
    async def test_state_token_verification_invalid(self, mock_db_pool):
        """Invalid state token returns None."""
        mock_pool, mock_conn = mock_db_pool
        
        # Mock no valid token found
        mock_conn.fetchrow.return_value = None
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_state_token("invalid_state", "discord")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_state_token_expired(self, mock_db_pool):
        """Expired state token is rejected."""
        mock_pool, mock_conn = mock_db_pool
        
        # Mock returns None because query filters by expires_at > NOW()
        mock_conn.fetchrow.return_value = None
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_state_token("expired_state", "discord")
            assert result is None
    
    @pytest.mark.asyncio
    async def test_state_token_wrong_provider(self, mock_db_pool):
        """State token for wrong provider is rejected."""
        mock_pool, mock_conn = mock_db_pool
        
        # Mock token for different provider
        mock_conn.fetchrow.return_value = None  # Query filters by provider
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await verify_state_token("state_for_discord", "google")
            
            assert result is None


class TestOAuthProviderConfiguration:
    """OAuth provider configuration tests."""
    
    def test_oauth_config_class_exists(self):
        """OAuthConfig class exists with required attributes."""
        assert hasattr(OAuthConfig, 'DISCORD_CLIENT_ID')
        assert hasattr(OAuthConfig, 'DISCORD_CLIENT_SECRET')
        assert hasattr(OAuthConfig, 'GOOGLE_CLIENT_ID')
        assert hasattr(OAuthConfig, 'GITHUB_CLIENT_ID')
    
    def test_get_provider_returns_valid_provider(self):
        """get_provider returns valid provider instances."""
        discord = get_provider("discord")
        google = get_provider("google")
        github = get_provider("github")
        
        assert isinstance(discord, DiscordOAuth)
        assert isinstance(google, GoogleOAuth)
        assert isinstance(github, GitHubOAuth)
    
    def test_get_provider_unknown_raises_error(self):
        """get_provider raises error for unknown provider."""
        with pytest.raises(ValueError) as exc_info:
            get_provider("unknown_provider")
        
        assert "Unknown OAuth provider" in str(exc_info.value)
    
    @patch.dict(os.environ, {
        'DISCORD_CLIENT_ID': 'test_discord_id',
        'DISCORD_CLIENT_SECRET': 'test_discord_secret'
    }, clear=False)
    def test_is_oauth_configured_discord(self):
        """is_oauth_configured checks Discord config."""
        with patch.object(OAuthConfig, 'DISCORD_CLIENT_ID', 'test_id'):
            with patch.object(OAuthConfig, 'DISCORD_CLIENT_SECRET', 'test_secret'):
                assert is_oauth_configured("discord") == True
    
    def test_is_oauth_configured_not_configured(self):
        """is_oauth_configured returns False when not configured."""
        with patch.object(OAuthConfig, 'DISCORD_CLIENT_ID', ''):
            with patch.object(OAuthConfig, 'DISCORD_CLIENT_SECRET', ''):
                assert is_oauth_configured("discord") == False


class TestDiscordOAuth:
    """Discord OAuth provider tests."""
    
    @pytest.fixture
    def discord(self):
        return DiscordOAuth()
    
    @pytest.mark.asyncio
    async def test_authorization_url_generation(self, discord):
        """Authorization URL contains required parameters."""
        with patch.object(OAuthConfig, 'DISCORD_CLIENT_ID', 'test_client_id'):
            url = await discord.get_authorization_url("test_state_123")
            
            assert "discord.com/oauth2/authorize" in url
            assert "client_id=test_client_id" in url
            assert "state=test_state_123" in url
            assert "response_type=code" in url
            assert "scope=" in url
    
    @pytest.mark.asyncio
    async def test_exchange_code_success(self, discord):
        """Code exchange makes correct HTTP request."""
        # Create response that properly returns dict for json()
        response_data = {
            "access_token": "test_token",
            "token_type": "Bearer",
            "expires_in": 604800
        }
        
        mock_response = MagicMock()
        mock_response.json = MagicMock(return_value=response_data)
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        
        with patch('httpx.AsyncClient', return_value=mock_client):
            with patch.object(OAuthConfig, 'DISCORD_CLIENT_ID', 'test_id'):
                with patch.object(OAuthConfig, 'DISCORD_CLIENT_SECRET', 'test_secret'):
                    result = await discord.exchange_code("auth_code_123")
        
        assert result["access_token"] == "test_token"
        mock_client.post.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_info_success(self, discord):
        """User info fetch parses Discord response correctly."""
        response_data = {
            "id": "123456789",
            "email": "user@example.com",
            "username": "TestUser",
            "avatar": "abc123"
        }
        
        mock_response = MagicMock()
        mock_response.json = MagicMock(return_value=response_data)
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        
        with patch('httpx.AsyncClient', return_value=mock_client):
            result = await discord.get_user_info("access_token_123")
        
        assert result["provider_id"] == "123456789"
        assert result["email"] == "user@example.com"
        assert result["username"] == "TestUser"
        assert "avatar" in result["avatar_url"]


class TestGoogleOAuth:
    """Google OAuth provider tests."""
    
    @pytest.fixture
    def google(self):
        return GoogleOAuth()
    
    @pytest.mark.asyncio
    async def test_authorization_url_includes_offline_access(self, google):
        """Google URL includes offline access for refresh tokens."""
        with patch.object(OAuthConfig, 'GOOGLE_CLIENT_ID', 'test_id'):
            url = await google.get_authorization_url("state_123")
            
            assert "accounts.google.com" in url
            assert "access_type=offline" in url
            assert "prompt=consent" in url  # Ensures refresh token is provided


class TestGitHubOAuth:
    """GitHub OAuth provider tests."""
    
    @pytest.fixture
    def github(self):
        return GitHubOAuth()
    
    @pytest.mark.asyncio
    async def test_get_user_info_fetches_email_when_private(self, github):
        """User info fetches email separately when private."""
        # First response - user with no public email
        user_response = MagicMock()
        user_response.json = MagicMock(return_value={
            "id": 12345,
            "login": "testuser",
            "email": None,  # Private email
            "avatar_url": "https://avatar.url"
        })
        user_response.raise_for_status = MagicMock()
        
        # Second response - emails endpoint
        emails_response = MagicMock()
        emails_response.status_code = 200
        emails_response.json = MagicMock(return_value=[
            {"email": "primary@example.com", "primary": True, "verified": True},
            {"email": "other@example.com", "primary": False, "verified": True}
        ])
        emails_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(side_effect=[user_response, emails_response])
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        
        with patch('httpx.AsyncClient', return_value=mock_client):
            result = await github.get_user_info("token_123")
        
        # Should get primary email from emails endpoint
        assert result["email"] == "primary@example.com"
        assert mock_client.get.call_count == 2  # Called both endpoints


class TestOAuthAccountLinking:
    """OAuth account linking tests."""
    
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
    async def test_link_oauth_account_new_link(self, mock_db_pool):
        """New OAuth account is linked to user."""
        mock_pool, mock_conn = mock_db_pool
        
        # No existing account
        mock_conn.fetchrow.side_effect = [None, None, {
            "id": 1,
            "user_id": "user_123",
            "provider": "discord",
            "provider_account_id": "discord_123"
        }]
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await link_oauth_account(
                user_id="user_123",
                provider="discord",
                provider_account_id="discord_123",
                provider_email="user@example.com"
            )
            
            assert result["user_id"] == "user_123"
            assert result["provider"] == "discord"
    
    @pytest.mark.asyncio
    async def test_link_oauth_account_already_linked_same_user(self, mock_db_pool):
        """Already linked account updates tokens."""
        mock_pool, mock_conn = mock_db_pool
        
        # Existing account
        existing = {
            "id": 1,
            "user_id": "user_123",
            "provider": "discord",
            "provider_account_id": "discord_123"
        }
        mock_conn.fetchrow.return_value = existing
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await link_oauth_account(
                user_id="user_123",
                provider="discord",
                provider_account_id="discord_123",
                access_token="new_token"
            )
            
            # Should update, not create
            mock_conn.execute.assert_called()
            update_call = mock_conn.execute.call_args[0]
            assert "UPDATE oauth_accounts" in update_call[0]
    
    @pytest.mark.asyncio
    async def test_link_oauth_account_duplicate_provider_raises(self, mock_db_pool):
        """Linking same provider twice raises error."""
        mock_pool, mock_conn = mock_db_pool
        
        # No account with this provider_account_id
        # But user already has discord linked
        mock_conn.fetchrow.side_effect = [None, {"id": 2}]
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            with pytest.raises(ValueError) as exc_info:
                await link_oauth_account(
                    user_id="user_123",
                    provider="discord",
                    provider_account_id="different_discord_id"
                )
            
            assert "already has a discord account linked" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_find_user_by_oauth_finds_existing(self, mock_db_pool):
        """find_user_by_oauth finds existing linked user."""
        mock_pool, mock_conn = mock_db_pool
        
        mock_conn.fetchrow.return_value = {
            "id": "user_123",
            "email": "user@example.com",
            "username": "testuser"
        }
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await find_user_by_oauth("discord", "discord_123")
            
            assert result is not None
            assert result["id"] == "user_123"
    
    @pytest.mark.asyncio
    async def test_find_user_by_oauth_returns_none_if_not_found(self, mock_db_pool):
        """find_user_by_oauth returns None if no linked account."""
        mock_pool, mock_conn = mock_db_pool
        mock_conn.fetchrow.return_value = None
        
        with patch('src.auth.oauth.db') as mock_db:
            mock_db.pool = mock_pool
            
            result = await find_user_by_oauth("discord", "unknown_id")
            
            assert result is None


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
