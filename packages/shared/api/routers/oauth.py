"""
v1 OAuth Router — NJZiteGeisTe Platform
Lightweight v1 OAuth endpoints (Google + Discord) for the platform auth flow.
[Ver002.001] — Phase 8: Full token exchange, user upsert, JWT issuance + CSRF state validation
"""
import os
import secrets
import logging
import urllib.parse
from datetime import timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse, JSONResponse, Response as FastAPIResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from src.auth.auth_utils import create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/oauth", tags=["oauth-v1"])

# ============================================================================
# Provider configuration (read from env at request time to allow hot-reload)
# ============================================================================

def _google_config() -> dict:
    return {
        "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/v1/oauth/google/callback"),
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "openid email profile",
    }


def _discord_config() -> dict:
    return {
        "client_id": os.getenv("DISCORD_CLIENT_ID", ""),
        "client_secret": os.getenv("DISCORD_CLIENT_SECRET", ""),
        "redirect_uri": os.getenv("DISCORD_REDIRECT_URI", "http://localhost:8000/v1/oauth/discord/callback"),
        "auth_url": "https://discord.com/api/oauth2/authorize",
        "token_url": "https://discord.com/api/oauth2/token",
        "scope": "identify email",
    }


def _github_config() -> dict:
    return {
        "client_id": os.getenv("GITHUB_CLIENT_ID", ""),
        "client_secret": os.getenv("GITHUB_CLIENT_SECRET", ""),
        "redirect_uri": os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/v1/oauth/github/callback"),
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "scope": "user:email read:user",
        "userinfo_url": "https://api.github.com/user",
        "userinfo_email_url": "https://api.github.com/user/emails",
    }


PROVIDERS = {
    "google": _google_config,
    "discord": _discord_config,
    "github": _github_config,
}


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/providers")
async def list_providers():
    """Return configured OAuth providers."""
    return [
        {
            "provider": name,
            "configured": bool(cfg()["client_id"]),
            "login_url": f"/v1/oauth/{name}/login",
        }
        for name, cfg in PROVIDERS.items()
    ]


@router.get("/{provider}/login")
async def oauth_login(
    provider: str,
    request: Request,
    redirect_to: str = Query("/", description="Post-auth frontend redirect path"),
):
    """Redirect browser to the OAuth provider's authorization page."""
    if provider not in PROVIDERS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown provider: {provider}")

    cfg = PROVIDERS[provider]()
    if not cfg["client_id"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Provider '{provider}' is not configured — set {provider.upper()}_CLIENT_ID",
        )

    # CSRF protection: embed a random nonce in the state parameter.
    # Format: "<nonce>:<url-encoded redirect_to>"
    # The callback validates that the nonce matches what we stored in the session.
    csrf_nonce = secrets.token_urlsafe(32)
    request.session[f"oauth_state_{provider}"] = csrf_nonce
    encoded_redirect = urllib.parse.quote(redirect_to, safe="")
    state = f"{csrf_nonce}:{encoded_redirect}"

    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": cfg["redirect_uri"],
        "response_type": "code",
        "scope": cfg["scope"],
        "state": state,
    }
    if provider == "discord":
        params["prompt"] = "none"

    auth_url = cfg["auth_url"] + "?" + urllib.parse.urlencode(params)
    return RedirectResponse(url=auth_url)


@router.get("/{provider}/callback")
async def oauth_callback(
    request: Request,
    provider: str,
    code: str = Query(...),
    state: str = Query(""),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle OAuth callback — Phase 8 full implementation:
    exchange code → fetch user info → upsert user → issue JWT → redirect.
    """
    if provider not in PROVIDERS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown provider: {provider}")

    cfg = PROVIDERS[provider]()
    if not cfg["client_id"]:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Provider not configured")

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # -----------------------------------------------------------------------
    # CSRF state validation
    # State format: "<nonce>:<url-encoded redirect_to>"
    # -----------------------------------------------------------------------
    expected_nonce = request.session.pop(f"oauth_state_{provider}", None)
    redirect_to = "/"
    if state:
        parts = state.split(":", 1)
        received_nonce = parts[0]
        if expected_nonce is None or not secrets.compare_digest(received_nonce, expected_nonce):
            logger.warning("OAuth CSRF state mismatch for provider %s", provider)
            return RedirectResponse(
                url=f"{frontend_url}/?oauth=error&reason=invalid_state"
            )
        if len(parts) == 2:
            redirect_to = urllib.parse.unquote(parts[1]) or "/"
    elif expected_nonce is not None:
        # State param missing on callback — reject
        logger.warning("OAuth callback missing state for provider %s", provider)
        return RedirectResponse(
            url=f"{frontend_url}/?oauth=error&reason=missing_state"
        )

    if error:
        return RedirectResponse(
            url=f"{frontend_url}{redirect_to}?oauth=error&reason={urllib.parse.quote(error)}"
        )

    # ------------------------------------------------------------------
    # 1. Exchange authorization code for provider access token
    # ------------------------------------------------------------------
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(
                cfg["token_url"],
                data={
                    "client_id": cfg["client_id"],
                    "client_secret": cfg["client_secret"],
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": cfg["redirect_uri"],
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                },
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()
    except httpx.HTTPError as exc:
        logger.error("OAuth token exchange failed for %s: %s", provider, exc)
        return RedirectResponse(
            url=f"{frontend_url}{redirect_to}?oauth=error&reason=token_exchange_failed"
        )

    provider_access_token: str = token_data.get("access_token", "")
    if not provider_access_token:
        logger.error("No access_token in response from %s: %s", provider, token_data)
        return RedirectResponse(
            url=f"{frontend_url}{redirect_to}?oauth=error&reason=no_access_token"
        )

    # ------------------------------------------------------------------
    # 2. Fetch user info from provider
    # ------------------------------------------------------------------
    if provider == "google":
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    elif provider == "github":
        user_info_url = cfg["userinfo_url"]
    else:
        user_info_url = "https://discord.com/api/users/@me"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            info_resp = await client.get(
                user_info_url,
                headers={
                    "Authorization": f"Bearer {provider_access_token}",
                    "Accept": "application/json",
                },
            )
            info_resp.raise_for_status()
            raw = info_resp.json()
    except httpx.HTTPError as exc:
        logger.error("OAuth user info fetch failed for %s: %s", provider, exc)
        return RedirectResponse(
            url=f"{frontend_url}{redirect_to}?oauth=error&reason=user_info_failed"
        )

    # Normalize provider-specific field names
    if provider == "google":
        provider_id = raw.get("id", "")
        email: Optional[str] = raw.get("email")
        display_name: str = raw.get("name", raw.get("email", ""))
        avatar_url: Optional[str] = raw.get("picture")
    elif provider == "github":
        provider_id = str(raw.get("id", ""))
        email = raw.get("email")  # may be None if user set email private
        display_name = raw.get("login", "")
        avatar_url = raw.get("avatar_url")
        # If email is private, fetch from /user/emails and pick primary verified one
        if not email:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    emails_resp = await client.get(
                        cfg["userinfo_email_url"],
                        headers={
                            "Authorization": f"Bearer {provider_access_token}",
                            "Accept": "application/json",
                        },
                    )
                    emails_resp.raise_for_status()
                    emails_data = emails_resp.json()
                    # Pick the primary verified email; fall back to any verified email
                    for entry in emails_data:
                        if entry.get("primary") and entry.get("verified"):
                            email = entry.get("email")
                            break
                    if not email:
                        for entry in emails_data:
                            if entry.get("verified"):
                                email = entry.get("email")
                                break
            except httpx.HTTPError as exc:
                logger.warning("GitHub secondary email fetch failed: %s", exc)
    else:  # discord
        provider_id = raw.get("id", "")
        email = raw.get("email")
        display_name = raw.get("username", raw.get("global_name", ""))
        avatar_hash = raw.get("avatar")
        avatar_url = (
            f"https://cdn.discordapp.com/avatars/{provider_id}/{avatar_hash}.png"
            if avatar_hash else None
        )

    if not provider_id:
        return RedirectResponse(
            url=f"{frontend_url}{redirect_to}?oauth=error&reason=missing_provider_id"
        )

    # ------------------------------------------------------------------
    # 3. Upsert user in DB
    # ------------------------------------------------------------------
    user_id: Optional[str] = None
    username: str = display_name or email or provider_id
    try:
        # Find existing oauth_account → user
        result = await db.execute(
            text(
                "SELECT u.id, u.username, u.email FROM users u "
                "JOIN oauth_accounts oa ON u.id = oa.user_id "
                "WHERE oa.provider = :provider AND oa.provider_account_id = :pid"
            ),
            {"provider": provider, "pid": str(provider_id)},
        )
        row = result.fetchone()

        if row:
            user_id = str(row[0])
            username = row[1] or username
            # Refresh stored tokens
            await db.execute(
                text(
                    "UPDATE oauth_accounts SET access_token = :at, updated_at = NOW() "
                    "WHERE provider = :provider AND provider_account_id = :pid"
                ),
                {"at": provider_access_token, "provider": provider, "pid": str(provider_id)},
            )
        else:
            # Try to find user by email
            if email:
                email_result = await db.execute(
                    text("SELECT id, username FROM users WHERE email = :email"),
                    {"email": email},
                )
                email_row = email_result.fetchone()
                if email_row:
                    user_id = str(email_row[0])
                    username = email_row[1] or username

            # Create user if still not found
            if not user_id:
                create_result = await db.execute(
                    text(
                        "INSERT INTO users (username, email, avatar_url, is_active, created_at, updated_at) "
                        "VALUES (:username, :email, :avatar, true, NOW(), NOW()) RETURNING id"
                    ),
                    {"username": username, "email": email, "avatar": avatar_url},
                )
                user_id = str(create_result.fetchone()[0])

            # Link oauth account
            await db.execute(
                text(
                    "INSERT INTO oauth_accounts "
                    "(user_id, provider, provider_account_id, provider_email, "
                    "provider_username, provider_avatar_url, access_token, created_at, updated_at) "
                    "VALUES (:uid, :provider, :pid, :email, :uname, :avatar, :at, NOW(), NOW()) "
                    "ON CONFLICT (provider, provider_account_id) DO UPDATE "
                    "SET access_token = EXCLUDED.access_token, updated_at = NOW()"
                ),
                {
                    "uid": user_id,
                    "provider": provider,
                    "pid": str(provider_id),
                    "email": email,
                    "uname": display_name,
                    "avatar": avatar_url,
                    "at": provider_access_token,
                },
            )

        await db.commit()
    except Exception as exc:
        logger.error(
            "OAuth DB upsert failed for %s:%s — JWT issued without DB record. Error: %s",
            provider, provider_id, exc,
        )
        await db.rollback()
        # Still issue a JWT so the user isn't locked out; persistence retried on next login
        user_id = f"{provider}:{provider_id}"

    # ------------------------------------------------------------------
    # 4. Issue platform JWT
    # ------------------------------------------------------------------
    jwt_data = {
        "sub": user_id,
        "username": username,
        "email": email or "",
        "provider": provider,
        "permissions": [],
        "is_active": True,
    }
    expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    access_token, _exp = create_access_token(
        data=jwt_data,
        expires_delta=timedelta(minutes=expire_minutes),
    )

    # ------------------------------------------------------------------
    # 5. Set HttpOnly cookie and redirect to frontend
    # Passing the JWT as a URL param exposes it in browser history and server
    # logs. Use a SameSite=Lax HttpOnly cookie instead.
    # ------------------------------------------------------------------
    redirect_url = f"{frontend_url}{redirect_to}?oauth=success"
    response = RedirectResponse(url=redirect_url, status_code=302)
    secure = os.getenv("APP_ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="njz_access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=secure,
        max_age=expire_minutes * 60,
        path="/",
    )
    return response
