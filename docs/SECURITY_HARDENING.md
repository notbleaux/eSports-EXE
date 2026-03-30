[Ver001.000] [Part: 1/1, Phase: 1/1, Progress: 100%, Status: Complete]

# Security Hardening Guide
## TeXeT Keys App - Authentication & Access Control

---

## 1. EXECUTIVE SUMMARY

**CRITICAL:** This document addresses immediate security hardening requirements for the TeXeT (Keys App) authentication layer, which controls access gates to the platform.

### Scope
- OAuth 2.0 implementation (Google, Discord, GitHub)
- JWT token handling
- Session management
- Rate limiting
- Input validation
- CSRF protection

---

## 2. CURRENT SECURITY POSTURE

### 2.1 Implemented Controls

| Control | Status | Location |
|---------|--------|----------|
| HTTPS enforcement | ✅ | `oauth.py:enforce_https()` |
| OAuth state parameter | ✅ | `oauth.py` - `secrets.token_urlsafe(32)` |
| Rate limiting | ✅ | `auth_routes.py` - `@auth_limiter.limit("5/minute")` |
| Password hashing | ✅ | `auth_utils.py` - bcrypt |
| JWT signing | ✅ | `auth_utils.py` - HS256 |
| 2FA support | ✅ | `two_factor.py` - TOTP |

### 2.2 Identified Vulnerabilities

| Risk | Severity | Mitigation |
|------|----------|------------|
| JWT in URL params (legacy) | 🔴 HIGH | Move to HttpOnly cookies |
| Missing CSP headers | 🟡 MEDIUM | Add Content-Security-Policy |
| Weak session timeout | 🟡 MEDIUM | Reduce to 15 min idle |
| No device fingerprinting | 🟡 MEDIUM | Implement for sensitive ops |
| Missing breach detection | 🟡 MEDIUM | Check haveibeenpwned API |

---

## 3. HARDENING IMPLEMENTATION

### 3.1 Secure Cookie Configuration

```python
# packages/shared/api/src/auth/cookies.py
"""
Secure cookie configuration for JWT storage.
Replaces URL parameter token storage.
"""
from fastapi import Response
from datetime import datetime, timedelta, timezone
import os

# Cookie settings
COOKIE_NAME = "njz_session"
COOKIE_SECURE = os.getenv("APP_ENVIRONMENT") == "production"
COOKIE_HTTPONLY = True
COOKIE_SAMESITE = "lax"  # or "strict" for higher security
COOKIE_MAX_AGE = 3600  # 1 hour


def set_auth_cookie(response: Response, token: str) -> None:
    """
    Set secure HttpOnly cookie with JWT token.
    
    Args:
        response: FastAPI response object
        token: JWT access token
    """
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    """Clear authentication cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )


def get_token_from_cookie(request) -> str | None:
    """Extract JWT from cookie instead of URL parameter."""
    return request.cookies.get(COOKIE_NAME)
```

### 3.2 Hardened JWT Configuration

```python
# packages/shared/api/src/auth/jwt_config.py
"""
Hardened JWT configuration with short expiry and refresh tokens.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import secrets
import jwt
from jwt.exceptions import InvalidTokenError

# JWT Configuration
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE = timedelta(minutes=15)  # Short-lived
JWT_REFRESH_TOKEN_EXPIRE = timedelta(days=7)     # Longer-lived
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY or len(JWT_SECRET_KEY) < 32:
    raise ValueError("JWT_SECRET_KEY must be at least 32 characters")


class JWTHelper:
    """Hardened JWT token handling."""
    
    @staticmethod
    def create_access_token(
        user_id: str,
        device_id: Optional[str] = None,
        scopes: list[str] = None
    ) -> str:
        """
        Create short-lived access token.
        
        Args:
            user_id: User identifier
            device_id: Device fingerprint for binding
            scopes: Permission scopes
        """
        now = datetime.now(timezone.utc)
        
        payload = {
            "sub": user_id,
            "iat": now,
            "exp": now + JWT_ACCESS_TOKEN_EXPIRE,
            "type": "access",
            "jti": secrets.token_urlsafe(16),  # Unique token ID
            "device_id": device_id,
            "scopes": scopes or ["read"],
        }
        
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create refresh token with rotation."""
        now = datetime.now(timezone.utc)
        
        payload = {
            "sub": user_id,
            "iat": now,
            "exp": now + JWT_REFRESH_TOKEN_EXPIRE,
            "type": "refresh",
            "jti": secrets.token_urlsafe(16),
        }
        
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def decode_token(token: str, token_type: str = "access") -> dict:
        """
        Decode and validate token.
        
        Raises:
            InvalidTokenError: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                JWT_SECRET_KEY,
                algorithms=[JWT_ALGORITHM],
            )
            
            # Verify token type
            if payload.get("type") != token_type:
                raise InvalidTokenError(f"Expected {token_type} token")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise InvalidTokenError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise InvalidTokenError(f"Invalid token: {e}")


class TokenBlacklist:
    """
    Token blacklist for logout and breach response.
    Uses Redis for distributed storage.
    """
    
    def __init__(self, redis_client):
        self.redis = redis_client
        self.key_prefix = "token_blacklist:"
    
    async def blacklist(self, jti: str, expires_in: int) -> None:
        """Add token JTI to blacklist."""
        await self.redis.setex(
            f"{self.key_prefix}{jti}",
            expires_in,
            "1"
        )
    
    async def is_blacklisted(self, jti: str) -> bool:
        """Check if token JTI is blacklisted."""
        result = await self.redis.get(f"{self.key_prefix}{jti}")
        return result is not None
```

### 3.3 Device Fingerprinting

```python
# packages/shared/api/src/auth/device_fingerprint.py
"""
Device fingerprinting for enhanced security.
Detects suspicious login patterns.
"""
import hashlib
import json
from typing import Optional
from fastapi import Request


class DeviceFingerprint:
    """Generate and validate device fingerprints."""
    
    @staticmethod
    def generate(request: Request) -> str:
        """
        Generate device fingerprint from request headers.
        
        Combines:
        - User-Agent
        - Accept-Language
        - Screen resolution (if available)
        - Timezone (if available)
        """
        components = [
            request.headers.get("user-agent", ""),
            request.headers.get("accept-language", ""),
            request.headers.get("x-screen-resolution", ""),
            request.headers.get("x-timezone", ""),
        ]
        
        # Add IP (hashed for privacy)
        client_ip = request.client.host if request.client else ""
        components.append(hashlib.sha256(client_ip.encode()).hexdigest()[:16])
        
        fingerprint = hashlib.sha256(
            "|".join(components).encode()
        ).hexdigest()[:32]
        
        return fingerprint
    
    @staticmethod
    def verify(
        current: str,
        expected: Optional[str]
    ) -> bool:
        """
        Verify device fingerprint.
        
        Returns True if fingerprint matches or no previous fingerprint.
        """
        if expected is None:
            return True
        return current == expected


class LoginAnomalyDetector:
    """Detect suspicious login patterns."""
    
    SUSPICIOUS_PATTERNS = {
        "rapid_location_change": 300,  # 5 minutes
        "impossible_travel_speed": 500,  # km/h
        "unusual_hour": [(0, 5)],  # 12am-5am
    }
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def check_login(
        self,
        user_id: str,
        ip_address: str,
        device_fingerprint: str,
        timestamp: datetime
    ) -> dict:
        """
        Check login for anomalies.
        
        Returns:
            {
                "is_suspicious": bool,
                "risk_score": float,  # 0-1
                "factors": list[str]
            }
        """
        risk_score = 0.0
        factors = []
        
        # Check for new device
        last_device = await self._get_last_device(user_id)
        if last_device and last_device != device_fingerprint:
            risk_score += 0.3
            factors.append("new_device")
        
        # Check for new IP
        last_ip = await self._get_last_ip(user_id)
        if last_ip and last_ip != ip_address:
            risk_score += 0.2
            factors.append("new_ip")
        
        # Check for unusual time
        hour = timestamp.hour
        for start, end in self.SUSPICIOUS_PATTERNS["unusual_hour"]:
            if start <= hour <= end:
                risk_score += 0.2
                factors.append("unusual_time")
        
        # Store current login info
        await self._store_login_info(user_id, ip_address, device_fingerprint, timestamp)
        
        return {
            "is_suspicious": risk_score > 0.5,
            "risk_score": min(risk_score, 1.0),
            "factors": factors
        }
```

### 3.4 Hardened Authentication Routes

```python
# packages/shared/api/src/auth/hardened_routes.py
"""
Hardened authentication routes with comprehensive security controls.
"""
from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

from .jwt_config import JWTHelper, TokenBlacklist
from .cookies import set_auth_cookie, clear_auth_cookie, get_token_from_cookie
from .device_fingerprint import DeviceFingerprint, LoginAnomalyDetector
from ..database import get_redis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

# Stricter rate limits
limiter = Limiter(key_func=get_remote_address)


@router.post("/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
):
    """
    Hardened login with device fingerprinting and anomaly detection.
    """
    # Verify user credentials
    user = await verify_credentials(credentials.username, credentials.password)
    if not user:
        logger.warning(f"Failed login attempt for {credentials.username} from {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Generate device fingerprint
    device_fp = DeviceFingerprint.generate(request)
    
    # Check for anomalies
    redis = await get_redis()
    detector = LoginAnomalyDetector(redis)
    anomaly = await detector.check_login(
        user_id=user.id,
        ip_address=request.client.host,
        device_fingerprint=device_fp,
        timestamp=datetime.now(timezone.utc)
    )
    
    if anomaly["is_suspicious"]:
        logger.warning(f"Suspicious login for {user.id}: {anomaly['factors']}")
        
        # Require additional verification
        if user.two_factor_enabled:
            # Return temporary token for 2FA
            temp_token = JWTHelper.create_access_token(
                user_id=user.id,
                device_id=device_fp,
                scopes=["2fa_pending"]
            )
            return {
                "requires_2fa": True,
                "temp_token": temp_token  # Short-lived, limited scope
            }
        else:
            # Send email notification
            await send_security_alert(user.email, anomaly)
    
    # Create tokens
    access_token = JWTHelper.create_access_token(
        user_id=user.id,
        device_id=device_fp
    )
    refresh_token = JWTHelper.create_refresh_token(user.id)
    
    # Set secure cookie (NOT URL parameter)
    set_auth_cookie(response, access_token)
    
    # Store refresh token hash
    await store_refresh_token(user.id, refresh_token)
    
    logger.info(f"Successful login for {user.id} from {request.client.host}")
    
    return {
        "message": "Login successful",
        "refresh_token": refresh_token,  # For mobile apps
        "user": {"id": user.id, "username": user.username}
    }


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """
    Logout with token blacklisting.
    """
    try:
        # Decode token to get JTI
        payload = JWTHelper.decode_token(credentials.credentials)
        jti = payload.get("jti")
        
        # Blacklist token
        if jti:
            redis = await get_redis()
            blacklist = TokenBlacklist(redis)
            await blacklist.blacklist(jti, 3600)  # 1 hour
        
        # Clear cookie
        clear_auth_cookie(response)
        
        logger.info(f"Logout for user {payload.get('sub')}")
        
        return {"message": "Logout successful"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        # Still clear cookie
        clear_auth_cookie(response)
        return {"message": "Logout successful"}


@router.post("/refresh")
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    response: Response,
    refresh_token: str
):
    """
    Refresh access token with rotation.
    """
    try:
        # Validate refresh token
        payload = JWTHelper.decode_token(refresh_token, token_type="refresh")
        user_id = payload.get("sub")
        
        # Check if refresh token is valid in database
        if not await verify_refresh_token(user_id, refresh_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Generate new token pair (rotation)
        new_access = JWTHelper.create_access_token(user_id)
        new_refresh = JWTHelper.create_refresh_token(user_id)
        
        # Invalidate old refresh token
        await invalidate_refresh_token(user_id, refresh_token)
        
        # Store new refresh token
        await store_refresh_token(user_id, new_refresh)
        
        # Set new cookie
        set_auth_cookie(response, new_access)
        
        return {
            "refresh_token": new_refresh
        }
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
```

### 3.5 Security Headers

```python
# packages/shared/api/src/middleware/security_headers.py
"""
Security headers middleware.
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https://api.njzitegeist.com;"
        )
        
        # HSTS (only in production)
        import os
        if os.getenv("APP_ENVIRONMENT") == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Permissions policy
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(), "
            "usb=()"
        )
        
        return response
```

---

## 4. SECURITY CHECKLIST

### 4.1 Pre-Deployment Checklist

- [ ] JWT_SECRET_KEY is at least 32 characters and cryptographically random
- [ ] HTTPS enforced in production
- [ ] HttpOnly cookies for JWT storage
- [ ] Rate limiting configured (5 req/min auth, 100 req/min general)
- [ ] Security headers middleware enabled
- [ ] Device fingerprinting enabled
- [ ] Token blacklisting configured
- [ ] Refresh token rotation enabled
- [ ] CSP headers configured
- [ ] HSTS enabled in production
- [ ] Snyk/Dependabot configured
- [ ] Security logging enabled

### 4.2 Audit Checklist

- [ ] Review all authentication routes
- [ ] Verify no JWT in URL parameters
- [ ] Check cookie security attributes
- [ ] Test rate limiting effectiveness
- [ ] Validate CSP headers
- [ ] Review session timeout configuration
- [ ] Check password policy enforcement
- [ ] Verify 2FA implementation
- [ ] Test logout token invalidation
- [ ] Audit third-party dependencies

---

## 5. INCIDENT RESPONSE

### 5.1 Suspected Breach Response

```python
async def handle_suspected_breach(user_id: str):
    """
    Response procedure for suspected account compromise.
    """
    # 1. Invalidate all sessions
    await invalidate_all_user_sessions(user_id)
    
    # 2. Force password reset
    await force_password_reset(user_id)
    
    # 3. Disable 2FA (requires re-setup)
    await disable_2fa(user_id)
    
    # 4. Send security notification
    await send_breach_notification(user_id)
    
    # 5. Log incident
    logger.critical(f"Security breach response triggered for user {user_id}")
```

### 5.2 Token Leak Response

```python
async def revoke_leaked_token(jti: str):
    """Revoke a specific token by JTI."""
    redis = await get_redis()
    blacklist = TokenBlacklist(redis)
    await blacklist.blacklist(jti, 86400 * 7)  # 7 days
```

---

## 6. MONITORING & ALERTING

### 6.1 Security Metrics

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Failed login rate | >10/min per IP | Block IP temporarily |
| New device logins | >3 per hour per user | Require 2FA |
| Token refresh rate | >20/min per user | Investigate |
| Anomalous location | Impossible travel | Alert + require verification |

### 6.2 Security Log Format

```json
{
  "timestamp": "2026-03-30T12:00:00Z",
  "event": "login_attempt",
  "user_id": "usr_xxx",
  "ip_address": "xxx.xxx.xxx.xxx",
  "device_fingerprint": "abc123...",
  "success": true,
  "mfa_used": true,
  "risk_score": 0.1,
  "anomaly_factors": []
}
```

---

## 7. THIRD-PARTY SECURITY AUDIT

### 7.1 Required Audits (Before Production)

| Audit Type | Provider | Scope | Timeline |
|------------|----------|-------|----------|
| Penetration Test | TBD | Full API + Web | 2 weeks |
| OAuth Security | TBD | OAuth implementation | 1 week |
| Code Review | TBD | Auth modules | 1 week |
| Dependency Scan | Snyk | All packages | Ongoing |

### 7.2 Vulnerability Disclosure

**Security Contact:** security@njzitegeist.com

**Bug Bounty Program:**
- Scope: *.njzitegeist.com
- Rewards: $100-$1000 depending on severity
- Safe Harbor: Protected under responsible disclosure

---

## 8. DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | Security Team | Initial hardening guide |

---

*End of Security Hardening Guide*  
**CRITICAL: Review and implement all HIGH severity items before production deployment.**
