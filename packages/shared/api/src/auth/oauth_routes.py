"""
[Ver001.000]
OAuth + 2FA Implementation
==========================
OAuth routes for Discord, Google, and GitHub authentication.
"""

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from axiom_esports_data.api.src.db_manager import db
from .auth_schemas import (
    Token, TokenData, OAuthAccountResponse, OAuthLoginRequest,
    OAuthLinkRequest, OAuthProviderResponse
)
from .auth_utils import (
    create_access_token, create_refresh_token, get_current_user, get_current_active_user
)
from .oauth import (
    get_provider, generate_state_token, verify_state_token,
    find_user_by_oauth, link_oauth_account, get_user_oauth_accounts,
    unlink_oauth_account, is_oauth_configured, PROVIDERS
)


router = APIRouter(prefix="/oauth", tags=["oauth"])

# Rate limiter
oauth_limiter = Limiter(key_func=get_remote_address)


@router.get("/providers", response_model=list[OAuthProviderResponse])
async def list_oauth_providers():
    """List available OAuth providers and their configuration status."""
    providers = []
    for name in ["discord", "google", "github"]:
        providers.append(OAuthProviderResponse(
            name=name,
            display_name=name.capitalize(),
            configured=is_oauth_configured(name),
            auth_url=f"/api/auth/oauth/{name}/login"
        ))
    return providers


@router.get("/{provider}/login")
@oauth_limiter.limit("10/minute")
async def oauth_login(
    request: Request,
    provider: str,
    redirect_url: Optional[str] = Query(None, description="Optional post-auth redirect URL"),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Initiate OAuth login flow.
    
    - If user is authenticated, links the OAuth account
    - If user is not authenticated, creates new account or logs in
    """
    if provider not in PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider: {provider}"
        )
    
    if not is_oauth_configured(provider):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OAuth provider {provider} is not configured"
        )
    
    # Generate state token for CSRF protection
    user_id = current_user.user_id if current_user else None
    state = await generate_state_token(provider, user_id, redirect_url)
    
    # Get authorization URL
    oauth_provider = get_provider(provider)
    auth_url = await oauth_provider.get_authorization_url(state, redirect_url)
    
    return RedirectResponse(url=auth_url)


@router.get("/{provider}/callback")
@oauth_limiter.limit("10/minute")
async def oauth_callback(
    request: Request,
    provider: str,
    code: str = Query(..., description="Authorization code from OAuth provider"),
    state: str = Query(..., description="CSRF state token"),
):
    """
    OAuth callback endpoint.
    
    Handles the OAuth provider redirect and completes authentication.
    """
    if provider not in PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider: {provider}"
        )
    
    # Verify state token
    state_data = await verify_state_token(state, provider)
    if not state_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state token"
        )
    
    # Exchange code for tokens
    try:
        oauth_provider = get_provider(provider)
        token_data = await oauth_provider.exchange_code(code, state_data.get("redirect_url"))
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to obtain access token"
            )
        
        # Get user info from provider
        user_info = await oauth_provider.get_user_info(access_token)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth exchange failed: {str(e)}"
        )
    
    provider_account_id = user_info["provider_id"]
    provider_email = user_info.get("email")
    provider_username = user_info.get("username")
    provider_avatar_url = user_info.get("avatar_url")
    
    async with db.pool.acquire() as conn:
        # Case 1: User is linking account (authenticated before OAuth)
        if state_data.get("user_id"):
            user_id = state_data["user_id"]
            
            # Check if OAuth account is already linked to another user
            existing_user = await find_user_by_oauth(provider, provider_account_id)
            if existing_user and existing_user["id"] != user_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"This {provider} account is already linked to another user"
                )
            
            # Link account
            try:
                await link_oauth_account(
                    user_id=user_id,
                    provider=provider,
                    provider_account_id=provider_account_id,
                    provider_email=provider_email,
                    provider_username=provider_username,
                    provider_avatar_url=provider_avatar_url,
                    access_token=access_token,
                    refresh_token=token_data.get("refresh_token"),
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=str(e)
                )
            
            # Redirect back to app
            redirect_url = state_data.get("redirect_url", "/settings/connections")
            return RedirectResponse(url=f"{redirect_url}?linked={provider}")
        
        # Case 2: New login/registration
        # Check if OAuth account exists
        existing_user = await find_user_by_oauth(provider, provider_account_id)
        
        if existing_user:
            # Existing user - log them in
            user_id = existing_user["id"]
            
            # Update login timestamp
            await conn.execute(
                "UPDATE users SET last_login = $1 WHERE id = $2",
                datetime.now(timezone.utc), user_id
            )
            
            # Update OAuth tokens
            await conn.execute(
                """
                UPDATE oauth_accounts
                SET access_token = $1, refresh_token = $2, updated_at = NOW()
                WHERE user_id = $3 AND provider = $4
                """,
                access_token, token_data.get("refresh_token"), user_id, provider
            )
            
        else:
            # New user - create account
            import secrets as secrets_module
            user_id = f"usr_{secrets_module.token_urlsafe(12)}"
            
            # Generate random password (user will set one later if needed)
            random_password = secrets_module.token_urlsafe(32)
            from .auth_utils import hash_password
            hashed_password = hash_password(random_password)
            
            now = datetime.now(timezone.utc)
            
            # Create username from provider username (ensure uniqueness)
            base_username = provider_username or f"{provider}_user"
            username = base_username
            counter = 1
            
            while await conn.fetchrow("SELECT id FROM users WHERE username = $1", username):
                username = f"{base_username}_{counter}"
                counter += 1
            
            await conn.execute(
                """
                INSERT INTO users (id, username, email, display_name, hashed_password,
                                 is_active, is_verified, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                user_id, username, provider_email, provider_username or username,
                hashed_password, True, True, now, now
            )
            
            # Initialize token wallet
            await conn.execute(
                """
                INSERT INTO user_tokens (user_id, balance, total_earned, total_spent, created_at, updated_at)
                VALUES ($1, 0, 0, 0, $2, $2)
                """,
                user_id, now
            )
            
            # Link OAuth account
            await conn.execute(
                """
                INSERT INTO oauth_accounts (
                    user_id, provider, provider_account_id, provider_email,
                    provider_username, provider_avatar_url, access_token, refresh_token,
                    is_primary
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
                """,
                user_id, provider, provider_account_id, provider_email,
                provider_username, provider_avatar_url, access_token,
                token_data.get("refresh_token")
            )
        
        # Get user permissions
        permissions = await conn.fetch(
            "SELECT permission FROM user_permissions WHERE user_id = $1",
            user_id
        )
        perm_list = [p["permission"] for p in permissions]
        
        # Get user data
        user = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
        
        # Create JWT tokens
        token_data_payload = {
            "sub": user_id,
            "username": user["username"],
            "email": user["email"],
            "permissions": perm_list,
            "is_active": user["is_active"],
        }
        
        access_token, access_expires = create_access_token(token_data_payload)
        refresh_token, refresh_expires = create_refresh_token({"sub": user_id})
        
        # Store refresh token
        await conn.execute(
            """
            INSERT INTO refresh_tokens (token, user_id, expires_at, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            refresh_token, user_id, refresh_expires, datetime.now(timezone.utc)
        )
        
        # Redirect to frontend with tokens
        # In production, use a more secure method (e.g., httpOnly cookies)
        redirect_url = state_data.get("redirect_url", "/")
        token_param = f"access_token={access_token}&refresh_token={refresh_token}"
        return RedirectResponse(url=f"{redirect_url}?oauth=success&{token_param}")


@router.post("/link", response_model=OAuthAccountResponse)
async def link_oauth(
    request: OAuthLinkRequest,
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Link OAuth account manually (for mobile apps or non-browser flows).
    
    Requires the provider's access token obtained through client-side OAuth.
    """
    if request.provider not in PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider: {request.provider}"
        )
    
    try:
        oauth_provider = get_provider(request.provider)
        user_info = await oauth_provider.get_user_info(request.access_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid access token: {str(e)}"
        )
    
    provider_account_id = user_info["provider_id"]
    
    # Check if already linked to another user
    existing_user = await find_user_by_oauth(request.provider, provider_account_id)
    if existing_user and existing_user["id"] != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This {request.provider} account is already linked to another user"
        )
    
    try:
        account = await link_oauth_account(
            user_id=current_user.user_id,
            provider=request.provider,
            provider_account_id=provider_account_id,
            provider_email=user_info.get("email"),
            provider_username=user_info.get("username"),
            provider_avatar_url=user_info.get("avatar_url"),
            access_token=request.access_token,
        )
        
        return OAuthAccountResponse(
            id=account["id"],
            provider=account["provider"],
            provider_account_id=account["provider_account_id"],
            provider_email=account.get("provider_email"),
            provider_username=account.get("provider_username"),
            provider_avatar_url=account.get("provider_avatar_url"),
            is_primary=account["is_primary"],
            created_at=account["created_at"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )


@router.get("/accounts", response_model=list[OAuthAccountResponse])
async def list_linked_accounts(
    current_user: TokenData = Depends(get_current_active_user)
):
    """List all OAuth accounts linked to the current user."""
    accounts = await get_user_oauth_accounts(current_user.user_id)
    
    return [
        OAuthAccountResponse(
            id=acc["id"],
            provider=acc["provider"],
            provider_account_id=acc["provider_account_id"],
            provider_email=acc.get("provider_email"),
            provider_username=acc.get("provider_username"),
            provider_avatar_url=acc.get("provider_avatar_url"),
            is_primary=acc["is_primary"],
            created_at=acc["created_at"],
        )
        for acc in accounts
    ]


@router.delete("/accounts/{provider}")
async def unlink_oauth(
    provider: str,
    current_user: TokenData = Depends(get_current_active_user)
):
    """Unlink an OAuth account from the current user."""
    # Get user's OAuth accounts
    accounts = await get_user_oauth_accounts(current_user.user_id)
    
    # Check if user has this provider linked
    provider_accounts = [a for a in accounts if a["provider"] == provider]
    if not provider_accounts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {provider} account linked"
        )
    
    # Check if user has a password set (not only OAuth)
    async with db.pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT hashed_password FROM users WHERE id = $1",
            current_user.user_id
        )
        
        # Count remaining linked accounts
        remaining = len([a for a in accounts if a["provider"] != provider])
        
        # Prevent unlinking if no other auth method exists
        # This is a simplified check - you might want to track if user has set a password
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot unlink only authentication method. Set a password first."
            )
    
    success = await unlink_oauth_account(current_user.user_id, provider)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unlink account"
        )
    
    return {"message": f"{provider} account unlinked successfully"}
