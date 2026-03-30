[Ver001.000] [Part: 1/1, Phase: 2/3, Progress: 20%, Status: On-Going]

# Authentication Production Hardening
## RLS, OAuth2+PKCE, and Tiered API Key System

---

## 1. EXECUTIVE SUMMARY

**Objective:** Implement production-grade authentication with Row-Level Security, OAuth2+PKCE, and tiered API key management.

**Current State:**
- Basic JWT tokens in cookies
- Simple rate limiting
- No RLS enforcement

**Target State:**
- Supabase RLS policies on all tables
- OAuth2 + PKCE for SPAs
- Tiered API keys (Free/Pro/Enterprise)
- Fine-grained permissions

---

## 2. ROW-LEVEL SECURITY (RLS) IMPLEMENTATION

### 2.1 Enable RLS on All Tables

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners (important!)
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE predictions FORCE ROW LEVEL SECURITY;
ALTER TABLE user_follows FORCE ROW LEVEL SECURITY;
```

### 2.2 RLS Policies

```sql
-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Predictions table (users only see own predictions)
CREATE POLICY "Users can view own predictions" ON predictions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own predictions" ON predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON predictions
    FOR UPDATE USING (auth.uid() = user_id);

-- Player follows (users see who they follow)
CREATE POLICY "Users can view own follows" ON user_follows
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can follow players" ON user_follows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow" ON user_follows
    FOR DELETE USING (auth.uid() = user_id);

-- Public data (matches, players) - readable by all
CREATE POLICY "Matches are public" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Players are public" ON players
    FOR SELECT USING (true);

-- Teams are public
CREATE POLICY "Teams are public" ON teams
    FOR SELECT USING (true);

-- Admin policies for moderation
CREATE POLICY "Admins can moderate predictions" ON predictions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );
```

### 2.3 Helper Functions

```sql
-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user tier (free/pro/enterprise)
CREATE OR REPLACE FUNCTION get_user_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    tier TEXT;
BEGIN
    SELECT subscription_tier INTO tier
    FROM users
    WHERE id = user_uuid;
    
    RETURN COALESCE(tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check rate limit for user
CREATE OR REPLACE FUNCTION check_rate_limit(
    user_uuid UUID,
    endpoint TEXT,
    max_requests INTEGER,
    window_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM api_request_logs
    WHERE user_id = user_uuid
      AND endpoint = check_rate_limit.endpoint
      AND created_at > NOW() - INTERVAL '1 second' * window_seconds;
    
    RETURN request_count < max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. OAUTH2 + PKCE IMPLEMENTATION

### 3.1 PKCE Flow Overview

```
┌─────────┐                                    ┌─────────────┐
│  Client │                                    │  Auth Server│
└────┬────┘                                    └──────┬──────┘
     │                                                │
     │ 1. Generate code_verifier (random string)      │
     │    code_challenge = SHA256(code_verifier)      │
     │                                                │
     │ 2. /authorize?code_challenge=xxx&...           │
     │ ─────────────────────────────────────────────> │
     │                                                │
     │ 3. User authenticates                          │
     │ 4. Redirect with authorization_code            │
     │ <───────────────────────────────────────────── │
     │                                                │
     │ 5. /token                                      │
     │    code=xxx&code_verifier=original             │
     │ ─────────────────────────────────────────────> │
     │                                                │
     │ 6. Return access_token + refresh_token         │
     │ <───────────────────────────────────────────── │
```

### 3.2 PKCE Implementation

```python
# packages/shared/api/src/auth/pkce.py
"""
PKCE (Proof Key for Code Exchange) implementation for SPA security.
Prevents authorization code interception attacks.
"""
import secrets
import hashlib
import base64
from typing import Tuple, Optional
from datetime import datetime, timedelta

from ..redis.cache import redis_client


class PKCEManager:
    """Manage PKCE code verifiers and challenges."""
    
    CODE_TTL = 600  # 10 minutes
    
    @staticmethod
    def generate_code_verifier() -> str:
        """Generate cryptographically random code verifier."""
        return base64.urlsafe_b64encode(
            secrets.token_bytes(32)
        ).decode("utf-8").rstrip("=")
    
    @staticmethod
    def generate_code_challenge(verifier: str) -> str:
        """Generate S256 code challenge from verifier."""
        digest = hashlib.sha256(verifier.encode()).digest()
        return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")
    
    @classmethod
    async def store_verifier(
        cls,
        state: str,
        verifier: str,
        redirect_uri: str
    ) -> None:
        """
        Store code verifier temporarily (until token exchange).
        
        Args:
            state: OAuth state parameter (key)
            verifier: Code verifier to store
            redirect_uri: Associated redirect URI
        """
        key = f"pkce:verifier:{state}"
        data = {
            "verifier": verifier,
            "redirect_uri": redirect_uri,
            "created_at": datetime.utcnow().isoformat()
        }
        await redis_client.setex(key, cls.CODE_TTL, json.dumps(data))
    
    @classmethod
    async def get_verifier(cls, state: str) -> Optional[dict]:
        """Retrieve and validate code verifier."""
        key = f"pkce:verifier:{state}"
        data = await redis_client.get(key)
        
        if data:
            # Delete after retrieval (one-time use)
            await redis_client.delete(key)
            return json.loads(data)
        
        return None


# OAuth2 + PKCE Authorization endpoint
@router.get("/oauth/authorize")
async def oauth_authorize(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str = "",
    state: str = None,
    code_challenge: str = None,
    code_challenge_method: str = "S256"
):
    """
    OAuth2 Authorization endpoint with PKCE support.
    
    Query Parameters:
        response_type: Must be "code"
        client_id: Registered client ID
        redirect_uri: Must match registered URI
        scope: Space-separated scopes
        state: CSRF protection token
        code_challenge: PKCE code challenge
        code_challenge_method: Must be "S256"
    """
    # Validate client
    client = await get_oauth_client(client_id)
    if not client:
        raise HTTPException(status_code=400, detail="Invalid client_id")
    
    # Validate redirect_uri
    if redirect_uri not in client.redirect_uris:
        raise HTTPException(status_code=400, detail="Invalid redirect_uri")
    
    # PKCE is required for public clients (SPAs)
    if client.type == "public" and not code_challenge:
        raise HTTPException(
            status_code=400, 
            detail="PKCE required for public clients"
        )
    
    # Store authorization request
    auth_request_id = secrets.token_urlsafe(16)
    await store_auth_request(
        auth_request_id,
        client_id=client_id,
        redirect_uri=redirect_uri,
        scope=scope,
        state=state,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method
    )
    
    # Redirect to consent/login page
    return RedirectResponse(
        url=f"/auth/consent?request_id={auth_request_id}"
    )


@router.post("/oauth/token")
async def oauth_token(
    grant_type: str,
    code: str = None,
    redirect_uri: str = None,
    code_verifier: str = None,
    refresh_token: str = None
):
    """
    OAuth2 Token endpoint with PKCE validation.
    """
    if grant_type == "authorization_code":
        # Validate authorization code
        auth_request = await get_auth_request(code)
        if not auth_request:
            raise HTTPException(
                status_code=400, 
                detail="Invalid or expired code"
            )
        
        # PKCE validation (required if code_challenge was sent)
        if auth_request.get("code_challenge"):
            if not code_verifier:
                raise HTTPException(
                    status_code=400,
                    detail="code_verifier required"
                )
            
            # Verify code challenge
            expected_challenge = PKCEManager.generate_code_challenge(code_verifier)
            if expected_challenge != auth_request["code_challenge"]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid code_verifier"
                )
        
        # Generate tokens
        access_token = create_access_token(
            user_id=auth_request["user_id"],
            scope=auth_request["scope"]
        )
        refresh_token = create_refresh_token(auth_request["user_id"])
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": refresh_token,
            "scope": auth_request["scope"]
        }
    
    elif grant_type == "refresh_token":
        # Validate refresh token
        user_id = await validate_refresh_token(refresh_token)
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid refresh token"
            )
        
        # Rotate tokens
        new_access = create_access_token(user_id)
        new_refresh = create_refresh_token(user_id)
        
        # Invalidate old refresh token
        await invalidate_refresh_token(refresh_token)
        
        return {
            "access_token": new_access,
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": new_refresh
        }
```

### 3.3 React PKCE Client

```typescript
// apps/web/src/lib/auth/pkce.ts
/**
 * PKCE client for React SPA
 */

export class PKCEClient {
  private static CODE_VERIFIER_KEY = 'pkce_verifier';
  
  /**
   * Generate code verifier and challenge
   */
  static generatePKCE(): { verifier: string; challenge: string } {
    // Generate random code verifier
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = base64URLEncode(array);
    
    // Generate code challenge
    const challenge = base64URLEncode(
      sha256(verifier)
    );
    
    return { verifier, challenge };
  }
  
  /**
   * Store code verifier in sessionStorage (cleared on tab close)
   */
  static storeVerifier(verifier: string): void {
    sessionStorage.setItem(this.CODE_VERIFIER_KEY, verifier);
  }
  
  /**
   * Retrieve and clear code verifier
   */
  static getVerifier(): string | null {
    const verifier = sessionStorage.getItem(this.CODE_VERIFIER_KEY);
    sessionStorage.removeItem(this.CODE_VERIFIER_KEY);
    return verifier;
  }
  
  /**
   * Initiate OAuth flow with PKCE
   */
  static async authorize(
    provider: 'google' | 'discord' | 'github'
  ): Promise<void> {
    const { verifier, challenge } = this.generatePKCE();
    const state = generateRandomState();
    
    // Store verifier for later
    this.storeVerifier(verifier);
    
    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/callback`,
      scope: 'openid profile email',
      state: state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });
    
    // Redirect to authorization server
    window.location.href = `/api/auth/oauth/${provider}/authorize?${params}`;
  }
  
  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCode(code: string): Promise<Tokens> {
    const verifier = this.getVerifier();
    
    if (!verifier) {
      throw new Error('PKCE verifier not found');
    }
    
    const response = await fetch('/api/auth/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        code_verifier: verifier,
        redirect_uri: `${window.location.origin}/auth/callback`
      })
    });
    
    if (!response.ok) {
      throw new Error('Token exchange failed');
    }
    
    return response.json();
  }
}

// Utility functions
function base64URLEncode(buffer: ArrayBuffer | Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function generateRandomState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}
```

---

## 4. TIERED API KEY SYSTEM

### 4.1 API Key Schema

```python
# packages/shared/api/src/auth/api_keys.py
"""
Tiered API key management with rate limiting.
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, Any

from ..database import get_db_pool
from ..redis.cache import redis_client


class Tier(Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


TIER_LIMITS = {
    Tier.FREE: {
        "requests_per_minute": 30,
        "requests_per_hour": 500,
        "requests_per_day": 2000,
        "concurrent_requests": 2,
        "websocket_connections": 1,
        "features": ["read", "predictions.read"]
    },
    Tier.PRO: {
        "requests_per_minute": 500,
        "requests_per_hour": 10000,
        "requests_per_day": 50000,
        "concurrent_requests": 10,
        "websocket_connections": 5,
        "features": ["read", "write", "predictions.write", "simulation.run"]
    },
    Tier.ENTERPRISE: {
        "requests_per_minute": 10000,  # Unlimited effectively
        "requests_per_hour": 1000000,
        "requests_per_day": 10000000,
        "concurrent_requests": 100,
        "websocket_connections": 50,
        "features": ["*"]  # All features
    }
}


class APIKeyManager:
    """Manage API key lifecycle and validation."""
    
    @staticmethod
    def generate_key() -> Tuple[str, str]:
        """
        Generate new API key pair.
        
        Returns:
            (full_key, key_hash) - Full key shown once, hash stored
        """
        # Generate random key
        prefix = "njz_"
        random_part = secrets.token_urlsafe(32)
        full_key = f"{prefix}{random_part}"
        
        # Hash for storage (never store full key)
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        return full_key, key_hash
    
    @classmethod
    async def create_key(
        cls,
        user_id: str,
        name: str,
        tier: Tier = Tier.FREE,
        expires_in_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create new API key for user.
        
        Returns:
            dict with full_key (shown once!), key_id, etc.
        """
        full_key, key_hash = cls.generate_key()
        key_id = secrets.token_urlsafe(8)
        
        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO api_keys (
                    id, user_id, name, key_hash, tier,
                    created_at, expires_at, is_active, last_used_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, 
                key_id, user_id, name, key_hash, tier.value,
                datetime.utcnow(), expires_at, True, None
            )
        
        return {
            "key_id": key_id,
            "full_key": full_key,  # SHOW ONCE!
            "name": name,
            "tier": tier.value,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat() if expires_at else None
        }
    
    @classmethod
    async def validate_key(cls, full_key: str) -> Optional[Dict[str, Any]]:
        """
        Validate API key and return key info.
        
        Args:
            full_key: Complete API key from request
            
        Returns:
            Key info if valid, None otherwise
        """
        # Hash the provided key
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        # Look up in database
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, user_id, tier, is_active, expires_at
                FROM api_keys
                WHERE key_hash = $1
            """, key_hash)
        
        if not row:
            return None
        
        # Check if active
        if not row["is_active"]:
            return None
        
        # Check expiration
        if row["expires_at"] and row["expires_at"] < datetime.utcnow():
            return None
        
        # Update last used
        await conn.execute("""
            UPDATE api_keys
            SET last_used_at = $1, use_count = use_count + 1
            WHERE id = $2
        """, datetime.utcnow(), row["id"])
        
        return {
            "key_id": row["id"],
            "user_id": row["user_id"],
            "tier": Tier(row["tier"]),
            "features": TIER_LIMITS[Tier(row["tier"])]["features"]
        }


class RateLimiter:
    """Tiered rate limiting for API keys."""
    
    @staticmethod
    async def check_rate_limit(
        key_id: str,
        tier: Tier,
        endpoint: str
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Check if request is within rate limit.
        
        Returns:
            (allowed, headers) - Whether allowed and rate limit headers
        """
        limits = TIER_LIMITS[tier]
        
        # Check per-minute limit
        minute_key = f"ratelimit:{key_id}:minute"
        minute_count = await redis_client.incr(minute_key)
        
        if minute_count == 1:
            # Set expiry on first request
            await redis_client.expire(minute_key, 60)
        
        # Check limits
        allowed = minute_count <= limits["requests_per_minute"]
        
        headers = {
            "X-RateLimit-Limit": str(limits["requests_per_minute"]),
            "X-RateLimit-Remaining": str(max(0, limits["requests_per_minute"] - minute_count)),
            "X-RateLimit-Reset": str(await redis_client.ttl(minute_key))
        }
        
        if not allowed:
            headers["Retry-After"] = str(await redis_client.ttl(minute_key))
        
        return allowed, headers


# FastAPI dependency
async def require_api_key(
    authorization: str = Header(...),
    required_feature: str = "read"
) -> Dict[str, Any]:
    """
    Dependency to require valid API key with feature check.
    
    Usage:
        @app.get("/api/v1/data")
        async def get_data(key_info: dict = Depends(require_api_key)):
            ...
    """
    # Extract key from header
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )
    
    api_key = authorization[7:]  # Remove "Bearer "
    
    # Validate key
    key_info = await APIKeyManager.validate_key(api_key)
    if not key_info:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired API key"
        )
    
    # Check feature access
    features = key_info["features"]
    if "*" not in features and required_feature not in features:
        raise HTTPException(
            status_code=403,
            detail=f"API key does not have access to: {required_feature}"
        )
    
    # Check rate limit
    allowed, headers = await RateLimiter.check_rate_limit(
        key_info["key_id"],
        key_info["tier"],
        endpoint="global"
    )
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers=headers
        )
    
    # Store headers for response
    key_info["_rate_limit_headers"] = headers
    
    return key_info
```

### 4.2 API Key Middleware

```python
# packages/shared/api/src/middleware/api_key.py
"""
API key authentication middleware with rate limiting.
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from ..auth.api_keys import APIKeyManager, RateLimiter, Tier


class APIKeyMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate API keys and enforce rate limits.
    
    Public endpoints can be accessed without API key.
    Protected endpoints require valid API key.
    """
    
    PUBLIC_PATHS = [
        "/health",
        "/docs",
        "/openapi.json",
        "/auth/",
        "/v1/auth/",
        "/v1/players",  # Public player listings
        "/v1/teams",    # Public team listings
        "/v1/matches",  # Public match listings
    ]
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        # Check if path is public
        path = request.url.path
        if any(path.startswith(p) for p in self.PUBLIC_PATHS):
            return await call_next(request)
        
        # Require API key for protected endpoints
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return Response(
                content='{"error": "API key required"}',
                status_code=401,
                media_type="application/json",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Validate API key
        if not auth_header.startswith("Bearer "):
            return Response(
                content='{"error": "Invalid authorization format"}',
                status_code=401,
                media_type="application/json"
            )
        
        api_key = auth_header[7:]
        key_info = await APIKeyManager.validate_key(api_key)
        
        if not key_info:
            return Response(
                content='{"error": "Invalid or expired API key"}',
                status_code=401,
                media_type="application/json"
            )
        
        # Check rate limit
        allowed, headers = await RateLimiter.check_rate_limit(
            key_info["key_id"],
            key_info["tier"],
            path
        )
        
        if not allowed:
            return Response(
                content='{"error": "Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
                headers=headers
            )
        
        # Add key info to request state
        request.state.api_key = key_info
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        for header, value in headers.items():
            response.headers[header] = str(value)
        
        return response
```

---

## 5. DATABASE SCHEMA

```sql
-- API Keys table
CREATE TABLE api_keys (
    id VARCHAR(16) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash
    tier VARCHAR(20) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    use_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- OAuth clients table
CREATE TABLE oauth_clients (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('public', 'confidential')),
    client_secret_hash VARCHAR(64),  -- NULL for public clients
    redirect_uris TEXT[] NOT NULL,
    allowed_scopes TEXT[] NOT NULL DEFAULT '{read}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- OAuth authorization codes
CREATE TABLE oauth_authorization_codes (
    code VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(32) NOT NULL REFERENCES oauth_clients(id),
    user_id UUID NOT NULL REFERENCES users(id),
    redirect_uri TEXT NOT NULL,
    scope TEXT NOT NULL,
    code_challenge VARCHAR(128),
    code_challenge_method VARCHAR(10),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oauth_codes_expires ON oauth_authorization_codes(expires_at);

-- Rate limit logs (for analytics)
CREATE TABLE api_request_logs (
    id BIGSERIAL PRIMARY KEY,
    key_id VARCHAR(16) REFERENCES api_keys(id),
    user_id UUID REFERENCES users(id),
    endpoint TEXT NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable for time-series
SELECT create_hypertable('api_request_logs', 'created_at', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);
```

---

## 6. IMPLEMENTATION TIMELINE

### Week 1: RLS Implementation
- [ ] Enable RLS on all tables
- [ ] Create policies for users, predictions, follows
- [ ] Test policies with application queries
- [ ] Document RLS behavior

### Week 2: OAuth2 + PKCE
- [ ] Implement PKCE manager
- [ ] Create authorization endpoint
- [ ] Create token endpoint
- [ ] Build React PKCE client
- [ ] Test complete flow

### Week 3: API Key System
- [ ] Create API key tables
- [ ] Implement key generation
- [ ] Build rate limiting
- [ ] Create middleware
- [ ] Add admin UI for key management

### Week 4: Integration & Testing
- [ ] Integrate with existing auth
- [ ] Load test rate limiting
- [ ] Security audit
- [ ] Documentation

---

## 7. DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | Security Team | Production hardening plan |

---

*End of Authentication Production Hardening Guide*
