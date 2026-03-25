"""
v1 OAuth Router — NJZiteGeisTe Platform
Lightweight v1 OAuth endpoints (Google + Discord) for the platform auth flow.
[Ver001.000]
"""
import os
import urllib.parse
from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse, JSONResponse

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


PROVIDERS = {
    "google": _google_config,
    "discord": _discord_config,
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

    state = urllib.parse.quote(redirect_to, safe="")
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
):
    """
    Handle OAuth callback.
    In production this would exchange the code for tokens and create/update the user.
    This stub returns a JSON payload so the frontend hook can handle the token.
    """
    if error:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": error, "provider": provider},
        )

    if provider not in PROVIDERS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown provider: {provider}")

    cfg = PROVIDERS[provider]()
    if not cfg["client_id"]:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Provider not configured")

    # Decode redirect destination from state
    redirect_to = urllib.parse.unquote(state) if state else "/"

    # TODO: exchange `code` for provider token → fetch user info → upsert user → issue JWT
    # For now, return the code so the frontend can see the flow works end-to-end.
    # Replace this block with actual token exchange in Phase 8.
    return JSONResponse(
        content={
            "provider": provider,
            "code": code,         # Do NOT expose in production — exchange server-side
            "redirect_to": redirect_to,
            "status": "callback_received",
            "message": "OAuth callback received. Token exchange not yet implemented — see Phase 8.",
        }
    )
