# Scout Agent S7 - Task 1: API Security & Rate Limiting Analysis

**Agent:** S7 (API Security & Rate Limiting)  
**Date:** 2026-03-15  
**Status:** ✅ Complete  
**Scope:** Initial Scout Review - Security Configuration Analysis

---

## Executive Summary

The SATOR API has foundational JWT authentication and CORS protection, but **lacks critical API rate limiting** despite SlowAPI being listed in requirements. The JWT implementation follows security best practices, but authentication endpoints are vulnerable to brute-force attacks without rate limiting.

---

## 1. CORS Configuration Analysis

**Location:** `packages/shared/api/main.py` (lines 77-89)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://notbleaux.github.io",
        "https://notbleaux.github.io/eSports-EXE",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Page-Size"],
)
```

### Assessment:
| Aspect | Status | Notes |
|--------|--------|-------|
| Origin Restrictions | ✅ Good | Specific origins configured |
| Credentials | ✅ Good | allow_credentials=True |
| Methods | ⚠️ Warning | All methods allowed |
| Headers | 🔴 Critical | `allow_headers=["*"]` allows ALL headers |

### Gap Identified:
- **Wildcard headers** (`allow_headers=["*"]`) could allow malicious custom headers
- No `max_age` configured for CORS preflight caching

---

## 2. SlowAPI Integration Status

**Dependency:** `slowapi>=0.1.9` in `requirements.txt` (line 13)  
**Implementation Status:** 🔴 **NOT CONFIGURED**

### Current State:
- SlowAPI is installed but **never imported or initialized** in `main.py`
- No `Limiter` instance created
- No `@limiter.limit()` decorators on any routes
- No rate limiting middleware attached

### Missing Implementation:
```python
# These critical lines are ABSENT from main.py:
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

---

## 3. JWT Implementation Analysis

**Location:** `packages/shared/api/src/auth/auth_utils.py`

### Strengths:
| Feature | Implementation | Status |
|---------|---------------|--------|
| Algorithm | HS256 | ✅ Standard |
| Secret Key | Environment-based with production check | ✅ Good |
| Token Types | Access + Refresh with type claims | ✅ Good |
| Token Expiration | 15 min access, 7 day refresh | ✅ Good |
| Password Hashing | bcrypt via passlib | ✅ Industry Standard |
| Refresh Rotation | Old tokens revoked on refresh | ✅ Good |
| Password Change | All refresh tokens revoked | ✅ Good |

### Weaknesses:
| Issue | Location | Risk |
|-------|----------|------|
| Dev fallback secret | Line 31 | Low (production check exists) |
| No token binding | N/A | Medium (no IP/device binding) |

---

## 4. Auth Routes Security Assessment

**Location:** `packages/shared/api/src/auth/auth_routes.py`

### Endpoints Without Rate Limiting:
| Endpoint | Method | Risk Level | Attack Vector |
|----------|--------|------------|---------------|
| `/auth/register` | POST | 🔴 **CRITICAL** | Mass registration attacks |
| `/auth/login` | POST | 🔴 **CRITICAL** | Brute force / credential stuffing |
| `/auth/refresh` | POST | 🟡 **HIGH** | Token enumeration |
| `/auth/password/reset-request` | POST | 🟡 **HIGH** | Email enumeration / DoS |

### Positive Security Features:
- Password reset uses cryptographically secure tokens (`os.urandom(32).hex()`)
- Reset tokens expire after 1 hour
- User enumeration prevention on password reset (always returns success)
- All refresh tokens revoked on password change

---

## 5. Security Gaps Identified

### Critical (Immediate Action Required):
1. **No API Rate Limiting** - Authentication endpoints vulnerable to brute force
2. **Wildcard CORS Headers** - `allow_headers=["*"]` is overly permissive
3. **No Security Headers** - Missing X-Frame-Options, X-Content-Type-Options, CSP

### High Priority:
4. **No Request Logging** - No audit trail for security events
5. **No Bot Protection** - No CAPTCHA or bot detection on auth endpoints
6. **No IP Blocking** - No mechanism to block malicious IPs

### Medium Priority:
7. **No Account Lockout** - Failed login attempts don't lock accounts
8. **No Device Fingerprinting** - Tokens not bound to devices/sessions

---

## 6. Rate Limiting Implementation Plan

### Phase 1: Core Implementation (Priority: CRITICAL)

**Step 1: Configure SlowAPI in main.py**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize limiter with Redis storage for distributed deployments
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=os.getenv("REDIS_URL", "memory://")
)

app = FastAPI(...)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**Step 2: Apply Rate Limits to Auth Routes**
```python
@router.post("/register", response_model=UserResponse)
@limiter.limit("3/hour")  # Strict limit on registration
async def register(request: UserRegister, ...):
    ...

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # Prevent brute force
async def login(request: UserLogin, ...):
    ...

@router.post("/password/reset-request")
@limiter.limit("3/hour")  # Prevent email spam
async def request_password_reset(...):
    ...
```

### Phase 2: Endpoint-Specific Limits (Priority: HIGH)

| Endpoint Pattern | Rate Limit | Rationale |
|-----------------|------------|-----------|
| `/auth/login` | 5/minute | Prevent brute force |
| `/auth/register` | 3/hour | Prevent mass registration |
| `/auth/refresh` | 10/minute | Reasonable for active users |
| `/auth/password/*` | 3/hour | Prevent abuse |
| `/api/tokens/claim-daily` | 1/day | Business logic limit |
| `/api/sator/*` (GET) | 100/minute | Standard API access |
| `/api/sator/*` (POST/PUT/DELETE) | 30/minute | Write operations |

### Phase 3: Advanced Protection (Priority: MEDIUM)

**Custom Key Functions:**
```python
async def get_user_limit_key(request) -> str:
    """Rate limit by user ID if authenticated, else IP"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        token_data = verify_token(token)
        if token_data:
            return f"user:{token_data.user_id}"
    return get_remote_address(request)
```

---

## 7. Three Specific Security Recommendations

### Recommendation 1: Implement Immediate Rate Limiting on Auth Endpoints

**Priority:** 🔴 CRITICAL  
**Effort:** Low (1-2 hours)  
**Impact:** High

**Action:**
```python
# Add to auth_routes.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, user_login: UserLogin):
    # existing logic
```

**Rationale:** Prevents brute force attacks and credential stuffing without impacting legitimate users.

---

### Recommendation 2: Add Security Headers Middleware

**Priority:** 🟡 HIGH  
**Effort:** Low (30 minutes)  
**Impact:** Medium

**Action:** Create `packages/shared/api/src/middleware/security.py`:
```python
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
```

**Rationale:** Protects against common web attacks (clickjacking, XSS, MIME sniffing).

---

### Recommendation 3: Implement Account Lockout After Failed Logins

**Priority:** 🟡 HIGH  
**Effort:** Medium (4-6 hours)  
**Impact:** High

**Action:** Add login attempt tracking:
```python
# New table: login_attempts
CREATE TABLE login_attempts (
    id SERIAL PRIMARY KEY,
    username_or_email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    attempted_at TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE
);

# Index for cleanup
CREATE INDEX idx_login_attempts_time ON login_attempts(attempted_at);
```

**Logic in login endpoint:**
```python
async def check_account_lockout(username: str, ip: str) -> bool:
    """Check if account is locked due to failed attempts"""
    # Count failed attempts in last 15 minutes
    failed_count = await conn.fetchval("""
        SELECT COUNT(*) FROM login_attempts 
        WHERE (username_or_email = $1 OR ip_address = $2)
        AND attempted_at > NOW() - INTERVAL '15 minutes'
        AND success = FALSE
    """, username, ip)
    
    return failed_count >= 5  # Lock after 5 failures
```

**Rationale:** Prevents brute force attacks even if rate limiting is bypassed.

---

## 8. Risk Matrix

| Vulnerability | Likelihood | Impact | Risk Score | Priority |
|--------------|------------|--------|------------|----------|
| Brute Force Auth | High | High | 🔴 Critical | P0 |
| Mass Registration | Medium | Medium | 🟡 High | P1 |
| Clickjacking | Low | Medium | 🟢 Medium | P2 |
| Email Enumeration | Low | Low | 🟢 Low | P3 |

---

## Sign-Off

**Scout Agent:** S7  
**Task:** 1 of 4  
**Status:** ✅ Complete - Ready for trade with S8  

**Key Finding:** SlowAPI is in requirements.txt but not implemented - critical security gap for auth endpoints.
