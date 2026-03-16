"""
[Ver001.000]
OAuth + 2FA Implementation
==========================
OAuth client configuration and utilities for Discord, Google, and GitHub.
"""

import os
import secrets
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta

import httpx
from axiom_esports_data.api.src.db_manager import db


# OAuth Provider Configuration
class OAuthConfig:
    """OAuth provider configuration with environment-based settings."""
    
    # Discord
    DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID", "")
    DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "")
    DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:8000/api/auth/oauth/discord/callback")
    DISCORD_AUTH_URL = "https://discord.com/oauth2/authorize"
    DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
    DISCORD_USER_URL = "https://discord.com/api/users/@me"
    DISCORD_SCOPE = "identify email"
    
    # Google
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/oauth/google/callback")
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    GOOGLE_SCOPE = "openid email profile"
    
    # GitHub
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/oauth/github/callback")
    GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
    GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
    GITHUB_USER_URL = "https://api.github.com/user"
    GITHUB_EMAIL_URL = "https://api.github.com/user/emails"
    GITHUB_SCOPE = "read:user user:email"


class OAuthProvider:
    """Base class for OAuth providers."""
    
    def __init__(self, name: str):
        self.name = name
    
    async def get_authorization_url(self, state: str, redirect_url: Optional[str] = None) -> str:
        """Generate OAuth authorization URL."""
        raise NotImplementedError
    
    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        raise NotImplementedError
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Fetch user information from provider."""
        raise NotImplementedError


class DiscordOAuth(OAuthProvider):
    """Discord OAuth implementation."""
    
    def __init__(self):
        super().__init__("discord")
    
    async def get_authorization_url(self, state: str, redirect_url: Optional[str] = None) -> str:
        redirect_uri = redirect_url or OAuthConfig.DISCORD_REDIRECT_URI
        return (
            f"{OAuthConfig.DISCORD_AUTH_URL}?"
            f"client_id={OAuthConfig.DISCORD_CLIENT_ID}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={OAuthConfig.DISCORD_SCOPE.replace(' ', '%20')}&"
            f"state={state}"
        )
    
    async def exchange_code(self, code: str, redirect_url: Optional[str] = None) -> Dict[str, Any]:
        redirect_uri = redirect_url or OAuthConfig.DISCORD_REDIRECT_URI
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OAuthConfig.DISCORD_TOKEN_URL,
                data={
                    "client_id": OAuthConfig.DISCORD_CLIENT_ID,
                    "client_secret": OAuthConfig.DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                OAuthConfig.DISCORD_USER_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                },
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "provider_id": data["id"],
                "email": data.get("email"),
                "username": data.get("username"),
                "avatar_url": (
                    f"https://cdn.discordapp.com/avatars/{data['id']}/{data['avatar']}.png"
                    if data.get("avatar") else None
                ),
                "raw_data": data,
            }


class GoogleOAuth(OAuthProvider):
    """Google OAuth implementation."""
    
    def __init__(self):
        super().__init__("google")
    
    async def get_authorization_url(self, state: str, redirect_url: Optional[str] = None) -> str:
        redirect_uri = redirect_url or OAuthConfig.GOOGLE_REDIRECT_URI
        return (
            f"{OAuthConfig.GOOGLE_AUTH_URL}?"
            f"client_id={OAuthConfig.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={OAuthConfig.GOOGLE_SCOPE.replace(' ', '%20')}&"
            f"state={state}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
    
    async def exchange_code(self, code: str, redirect_url: Optional[str] = None) -> Dict[str, Any]:
        redirect_uri = redirect_url or OAuthConfig.GOOGLE_REDIRECT_URI
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OAuthConfig.GOOGLE_TOKEN_URL,
                data={
                    "client_id": OAuthConfig.GOOGLE_CLIENT_ID,
                    "client_secret": OAuthConfig.GOOGLE_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                OAuthConfig.GOOGLE_USER_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "provider_id": data["id"],
                "email": data.get("email"),
                "username": data.get("name"),
                "avatar_url": data.get("picture"),
                "raw_data": data,
            }


class GitHubOAuth(OAuthProvider):
    """GitHub OAuth implementation."""
    
    def __init__(self):
        super().__init__("github")
    
    async def get_authorization_url(self, state: str, redirect_url: Optional[str] = None) -> str:
        redirect_uri = redirect_url or OAuthConfig.GITHUB_REDIRECT_URI
        return (
            f"{OAuthConfig.GITHUB_AUTH_URL}?"
            f"client_id={OAuthConfig.GITHUB_CLIENT_ID}&"
            f"redirect_uri={redirect_uri}&"
            f"scope={OAuthConfig.GITHUB_SCOPE.replace(' ', '%20')}&"
            f"state={state}"
        )
    
    async def exchange_code(self, code: str, redirect_url: Optional[str] = None) -> Dict[str, Any]:
        redirect_uri = redirect_url or OAuthConfig.GITHUB_REDIRECT_URI
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OAuthConfig.GITHUB_TOKEN_URL,
                data={
                    "client_id": OAuthConfig.GITHUB_CLIENT_ID,
                    "client_secret": OAuthConfig.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            # Get basic user info
            response = await client.get(
                OAuthConfig.GITHUB_USER_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            response.raise_for_status()
            data = response.json()
            
            # Get email (may be private)
            email = data.get("email")
            if not email:
                email_response = await client.get(
                    OAuthConfig.GITHUB_EMAIL_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                )
                if email_response.status_code == 200:
                    emails = email_response.json()
                    # Find primary email
                    for e in emails:
                        if e.get("primary") and e.get("verified"):
                            email = e.get("email")
                            break
                    # Fallback to first email
                    if not email and emails:
                        email = emails[0].get("email")
            
            return {
                "provider_id": str(data["id"]),
                "email": email,
                "username": data.get("login"),
                "avatar_url": data.get("avatar_url"),
                "raw_data": data,
            }


# Provider registry
PROVIDERS = {
    "discord": DiscordOAuth(),
    "google": GoogleOAuth(),
    "github": GitHubOAuth(),
}


def get_provider(name: str) -> OAuthProvider:
    """Get OAuth provider by name."""
    provider = PROVIDERS.get(name)
    if not provider:
        raise ValueError(f"Unknown OAuth provider: {name}")
    return provider


async def generate_state_token(
    provider: str,
    user_id: Optional[str] = None,
    redirect_url: Optional[str] = None
) -> str:
    """Generate and store CSRF state token."""
    state = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    async with db.pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO oauth_state_tokens (state_token, provider, user_id, redirect_url, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            """,
            state, provider, user_id, redirect_url, expires
        )
    
    return state


async def verify_state_token(state: str, provider: str) -> Optional[Dict[str, Any]]:
    """Verify and consume state token."""
    async with db.pool.acquire() as conn:
        # Find valid token
        record = await conn.fetchrow(
            """
            SELECT * FROM oauth_state_tokens
            WHERE state_token = $1 AND provider = $2 AND used = FALSE AND expires_at > NOW()
            """,
            state, provider
        )
        
        if not record:
            return None
        
        # Mark as used
        await conn.execute(
            "UPDATE oauth_state_tokens SET used = TRUE WHERE id = $1",
            record["id"]
        )
        
        return {
            "user_id": record.get("user_id"),
            "redirect_url": record.get("redirect_url"),
        }


async def find_user_by_oauth(provider: str, provider_account_id: str) -> Optional[Dict[str, Any]]:
    """Find user by OAuth provider and account ID."""
    async with db.pool.acquire() as conn:
        user = await conn.fetchrow(
            """
            SELECT u.* FROM users u
            JOIN oauth_accounts oa ON u.id = oa.user_id
            WHERE oa.provider = $1 AND oa.provider_account_id = $2
            """,
            provider, provider_account_id
        )
        return dict(user) if user else None


async def link_oauth_account(
    user_id: str,
    provider: str,
    provider_account_id: str,
    provider_email: Optional[str] = None,
    provider_username: Optional[str] = None,
    provider_avatar_url: Optional[str] = None,
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
    token_expires_at: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Link OAuth account to existing user."""
    async with db.pool.acquire() as conn:
        # Check if this OAuth account is already linked
        existing = await conn.fetchrow(
            """
            SELECT * FROM oauth_accounts
            WHERE provider = $1 AND provider_account_id = $2
            """,
            provider, provider_account_id
        )
        
        if existing:
            # Update tokens
            await conn.execute(
                """
                UPDATE oauth_accounts
                SET access_token = $1, refresh_token = $2, token_expires_at = $3,
                    provider_email = $4, provider_username = $5, provider_avatar_url = $6,
                    updated_at = NOW()
                WHERE id = $7
                """,
                access_token, refresh_token, token_expires_at,
                provider_email, provider_username, provider_avatar_url,
                existing["id"]
            )
            return dict(existing)
        
        # Check if user already has this provider linked
        existing_provider = await conn.fetchrow(
            "SELECT id FROM oauth_accounts WHERE user_id = $1 AND provider = $2",
            user_id, provider
        )
        
        if existing_provider:
            raise ValueError(f"User already has a {provider} account linked")
        
        # Create new link
        record = await conn.fetchrow(
            """
            INSERT INTO oauth_accounts (
                user_id, provider, provider_account_id, provider_email,
                provider_username, provider_avatar_url, access_token,
                refresh_token, token_expires_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            """,
            user_id, provider, provider_account_id, provider_email,
            provider_username, provider_avatar_url, access_token,
            refresh_token, token_expires_at
        )
        
        return dict(record)


async def get_user_oauth_accounts(user_id: str) -> list:
    """Get all OAuth accounts linked to a user."""
    async with db.pool.acquire() as conn:
        records = await conn.fetch(
            """
            SELECT id, provider, provider_account_id, provider_email,
                   provider_username, provider_avatar_url, is_primary,
                   created_at, updated_at
            FROM oauth_accounts
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user_id
        )
        return [dict(r) for r in records]


async def unlink_oauth_account(user_id: str, provider: str) -> bool:
    """Unlink OAuth account from user."""
    async with db.pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2",
            user_id, provider
        )
        # Check if any rows were deleted
        return "DELETE 1" in result or "DELETE" in result


def is_oauth_configured(provider: str) -> bool:
    """Check if OAuth provider is properly configured."""
    if provider == "discord":
        return bool(OAuthConfig.DISCORD_CLIENT_ID and OAuthConfig.DISCORD_CLIENT_SECRET)
    elif provider == "google":
        return bool(OAuthConfig.GOOGLE_CLIENT_ID and OAuthConfig.GOOGLE_CLIENT_SECRET)
    elif provider == "github":
        return bool(OAuthConfig.GITHUB_CLIENT_ID and OAuthConfig.GITHUB_CLIENT_SECRET)
    return False
