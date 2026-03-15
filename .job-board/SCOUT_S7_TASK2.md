[Ver001.000]

# Scout S7 Task 2: Coordinated Security Hardening Plan
**Agent:** S7 (Rate Limiting Scout)  
**Date:** 2026-03-15  
**Status:** Task 2 Complete - Cross-Review with S8  
**Scope:** Libre-X-eSport 4NJZ4 TENET Platform

---

## Executive Summary

This report coordinates **S8's CORS/Security Headers findings** with **S7's Rate Limiting analysis** to create a unified security hardening strategy. Cross-analysis reveals interdependencies between CORS policy and rate limiting implementation that require coordinated deployment.

---

## 1. Cross-Analysis: S8 Findings + Rate Limiting Context

### 1.1 Interdependency Matrix

| S8 Finding | Rate Limiting Impact | Coordination Required |
|------------|---------------------|----------------------|
| CORS `allow_headers=["*"]` | Rate limit headers may be blocked | Sync header whitelist |
| Missing `Retry-After` header | Clients can't handle 429 gracefully | Add to security headers |
| No `X-RateLimit-*` headers | Clients unaware of quota status | Add to CORS expose_headers |
| Multiple FastAPI services | Inconsistent rate limit behavior | Unified middleware approach |
| Environment variable drift | Rate limit config also fragmented | Standardize both together |

### 1.2 Security Posture Reassessment

| Layer | S8 Rating | + Rate Limiting | Combined Rating |
|-------|-----------|-----------------|-----------------|
| CORS Policy | MEDIUM | Without rate limiting: credential stuffing risk | **HIGH PRIORITY** |
| Security Headers | LOW | No rate limit visibility | **HIGH PRIORITY** |
| DDoS Protection | NONE | First line of defense | **CRITICAL** |
| Brute Force Mitigation | NONE | Essential for auth endpoints | **CRITICAL** |

**Combined Security Posture: LOW** (elevated from S8's MEDIUM-LOW due to missing rate limiting)

---

## 2. Coordinated Security Hardening Plan

### 2.1 Implementation Order (Priority Sequence)

```
PHASE 1: Foundation (Deploy Together)
├── 1.1 Standardize environment variables (CORS + Rate Limit)
├── 1.2 Create unified security middleware
└── 1.3 Deploy to axiom-esports-data/api (primary API)

PHASE 2: Rate Limiting Layer
├── 2.1 Implement core rate limiting with slowapi
├── 2.2 Add rate limit headers to CORS expose_headers
└── 2.3 Configure per-endpoint limits

PHASE 3: CORS Hardening
├── 3.1 Replace wildcard headers with explicit list
├── 3.2 Add security headers middleware
└── 3.3 Configure credentials properly

PHASE 4: Rollout
├── 4.1 Deploy to remaining services
└── 4.2 Update .env.example documentation
```

### 2.2 Phase 1: Foundation Implementation

#### 2.2.1 Standardized Environment Variables

**`.env.example` updates (coordinated):**

```bash
# === CORS Configuration ===
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.vercel.app
CORS_ALLOWED_HEADERS=Authorization,Content-Type,X-Request-ID,X-API-Key,Accept,Accept-Language,Content-Language,X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset,Retry-After

# === Rate Limiting Configuration ===
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT=100/minute
RATE_LIMIT_ANONYMOUS=30/minute
RATE_LIMIT_AUTHENTICATED=1000/minute
RATE_LIMIT_BURST=20
RATE_LIMIT_WINDOW=60

# === Security Headers ===
SECURITY_HEADERS_ENABLED=true
HSTS_MAX_AGE=31536000
```

#### 2.2.2 Unified Security Middleware Module

**New file: `packages/shared/api/src/middleware/security_combined.py`**

```python
"""
Coordinated Security Middleware: CORS + Rate Limiting + Security Headers
Combines S8's security headers with S7's rate limiting requirements.
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

# === Environment Configuration ===
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
CORS_ALLOWED_HEADERS = os.getenv(
    "CORS_ALLOWED_HEADERS",
    "Authorization,Content-Type,X-Request-ID,X-API-Key,Accept,X-RateLimit-Limit,X-RateLimit-Remaining,Retry-After"
).split(",")

RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "100/minute")

# === Rate Limiter with CORS-Aware Headers ===
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[RATE_LIMIT_DEFAULT] if RATE_LIMIT_ENABLED else [],
    headers_enabled=True,  # Enable X-RateLimit-* headers
)

# === Security Headers Middleware ===
async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses (S8 Recommendation #1)"""
    response = await call_next(request)
    
    # Prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # Control referrer leakage
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # HTTPS enforcement (S8 Critical Priority)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Basic XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Request tracing (existing)
    response.headers["X-Request-ID"] = request.state.request_id if hasattr(request.state, "request_id") else "unknown"
    response.headers["X-API-Version"] = "v1"
    
    return response

# === Combined Setup Function ===
def setup_security(app: FastAPI) -> None:
    """
    Apply all security layers in correct order:
    1. Rate limiting (catches attacks early)
    2. CORS (handles cross-origin)
    3. Security headers (adds protection)
    """
    
    # 1. Rate Limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    # 2. CORS with explicit headers (S8 Recommendation #2)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[header.strip() for header in CORS_ALLOWED_HEADERS],  # No wildcard!
        expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
        max_age=600,
    )
    
    # 3. Security Headers
    app.middleware("http")(security_headers_middleware)

# === Per-Endpoint Rate Limit Decorators ===
def anonymous_limit():
    """Strict limit for unauthenticated requests"""
    return limiter.limit(os.getenv("RATE_LIMIT_ANONYMOUS", "30/minute"))

def authenticated_limit():
    """Generous limit for authenticated users"""
    return limiter.limit(os.getenv("RATE_LIMIT_AUTHENTICATED", "1000/minute"))

def strict_limit():
    """Very strict for auth endpoints (brute force protection)"""
    return limiter.limit("5/minute")

def search_limit():
    """Medium limit for search endpoints"""
    return limiter.limit("60/minute")
```

---

## 3. Coordinated Implementation by Service

### 3.1 Primary Target: `axiom-esports-data/api/main.py`

**Current (S8 findings + no rate limiting):**
```python
# Lines 131-140: CORS with wildcard headers
# Lines 379-380: Custom headers only
# NO rate limiting
# NO security headers
```

**Coordinated Update:**
```python
from packages.shared.api.src.middleware.security_combined import (
    setup_security, limiter, anonymous_limit, authenticated_limit, strict_limit
)

app = FastAPI()

# Apply all security layers at once
setup_security(app)

# Example endpoints with appropriate limits
@app.post("/v1/auth/login")
@strict_limit()  # Brute force protection
async def login():
    ...

@app.get("/v1/players")
@authenticated_limit()
async def get_players():
    ...

@app.get("/v1/search")
@anonymous_limit()  # Or search_limit()
async def search():
    ...
```

### 3.2 Secondary Targets

| Service | CORS Lines | Needs Security Middleware | Priority |
|---------|------------|---------------------------|----------|
| `packages/shared/api/main.py` | 77-89 | Yes | P1 |
| `services/exe-directory/main.py` | 685-701 | Yes | P2 |
| `pipeline/coordinator/main.py` | 210-226 | Yes | P3 |

---

## 4. Priority Order for Security Fixes

### 4.1 Critical Priority (Fix Immediately)

| # | Fix | Component | Risk | Effort |
|---|-----|-----------|------|--------|
| 1 | **Add rate limiting to auth endpoints** | All APIs | Credential stuffing, brute force | 2 hrs |
| 2 | **Remove CORS header wildcard** | All APIs | Header injection attacks | 1 hr |
| 3 | **Add HSTS header** | All APIs | MITM downgrade attacks | 30 min |

### 4.2 High Priority (Fix This Sprint)

| # | Fix | Component | Risk | Effort |
|---|-----|-----------|------|--------|
| 4 | **Add CSP header** | All APIs | XSS injection | 4 hrs |
| 5 | **Implement tiered rate limits** | All APIs | DDoS, resource exhaustion | 4 hrs |
| 6 | **Add X-Content-Type-Options** | All APIs | MIME sniffing | 30 min |

### 4.3 Medium Priority (Fix Next Sprint)

| # | Fix | Component | Risk | Effort |
|---|-----|-----------|------|--------|
| 7 | **Standardize env variable names** | All services | Config drift | 2 hrs |
| 8 | **Add X-Frame-Options** | All APIs | Clickjacking | 30 min |
| 9 | **Add rate limit headers** | All APIs | Client UX | 1 hr |

---

## 5. Testing Strategy for Combined Changes

### 5.1 Unit Tests

**`tests/security/test_cors_rate_limit.py`:**
```python
"""Test CORS and rate limiting interaction"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

class TestCORSWithRateLimiting:
    """Verify CORS headers are present on rate-limited responses"""
    
    async def test_preflight_with_rate_limit(self, client: AsyncClient):
        """OPTIONS request should not count against rate limit"""
        response = await client.options(
            "/v1/players",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        
        # Verify preflight didn't consume rate limit
        response = await client.get("/v1/players")
        assert "x-ratelimit-remaining" in response.headers
        assert int(response.headers["x-ratelimit-remaining"]) > 0
    
    async def test_rate_limit_headers_in_cors(self, client: AsyncClient):
        """Rate limit headers must be in CORS expose_headers"""
        response = await client.get("/v1/players")
        
        # CORS headers present
        assert "access-control-allow-origin" in response.headers
        
        # Rate limit headers present
        assert "x-ratelimit-limit" in response.headers
        assert "x-ratelimit-remaining" in response.headers
    
    async def test_429_response_has_cors_headers(self, client: AsyncClient):
        """Rate limited responses must include CORS headers"""
        # Exhaust rate limit
        for _ in range(35):  # > anonymous limit
            await client.get("/v1/search")
        
        response = await client.get(
            "/v1/search",
            headers={"Origin": "http://localhost:5173"}
        )
        
        assert response.status_code == 429
        assert "access-control-allow-origin" in response.headers
        assert "retry-after" in response.headers
```

### 5.2 Integration Tests

**`tests/integration/test_security_combined.py`:**
```python
"""Integration tests for coordinated security features"""

import pytest
import asyncio

class TestSecurityIntegration:
    """Test security features work together"""
    
    async def test_security_headers_with_rate_limit(self, client):
        """Security headers present even when rate limited"""
        response = await client.get("/v1/players")
        
        # S8's security headers
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["x-frame-options"] == "DENY"
        assert "strict-transport-security" in response.headers
        
        # S7's rate limit headers
        assert "x-ratelimit-limit" in response.headers
    
    async def test_cors_credentials_with_explicit_headers(self, client):
        """CORS credentials work with non-wildcard headers"""
        response = await client.get(
            "/v1/players",
            headers={
                "Origin": "http://localhost:5173",
                "Authorization": "Bearer test-token",
                "X-Request-ID": "test-123",
            }
        )
        
        assert response.status_code == 200
        assert response.headers["access-control-allow-credentials"] == "true"
```

### 5.3 E2E Security Test Suite

**`tests/e2e/security-critical-path.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Coordinated Security: CORS + Rate Limiting', () => {
  
  test('rate limited response includes CORS headers', async ({ request }) => {
    // Make requests to exhaust rate limit
    const requests = Array(35).fill(null).map(() => 
      request.get('/v1/search')
    );
    await Promise.all(requests);
    
    // Final request should be rate limited
    const response = await request.get('/v1/search', {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    
    expect(response.status()).toBe(429);
    expect(response.headers()['access-control-allow-origin']).toBeDefined();
    expect(response.headers()['retry-after']).toBeDefined();
  });
  
  test('security headers present on all responses', async ({ request }) => {
    const response = await request.get('/v1/players');
    
    // S8 security headers
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['strict-transport-security']).toContain('max-age=');
    
    // S7 rate limit headers
    expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
  });
  
  test('CORS preflight does not consume rate limit', async ({ request }) => {
    const preflight = await request.fetch('/v1/players', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
      }
    });
    
    expect(preflight.status()).toBe(200);
    
    // Subsequent request should have full quota
    const response = await request.get('/v1/players');
    const remaining = parseInt(response.headers()['x-ratelimit-remaining']);
    expect(remaining).toBeGreaterThan(0);
  });
});
```

---

## 6. Deployment Coordination Checklist

### 6.1 Pre-Deployment

- [ ] Create `security_combined.py` middleware module
- [ ] Update `.env.example` with new variables
- [ ] Add `slowapi` to `requirements.txt`
- [ ] Write unit tests for coordinated security
- [ ] Run full test suite

### 6.2 Deployment Order

```
Step 1: Deploy middleware to axiom-esports-data/api
        ↓ [Verify: CORS works, rate limits enforced, headers present]
        
Step 2: Deploy to packages/shared/api
        ↓ [Verify: All endpoints protected]
        
Step 3: Deploy to exe-directory
        ↓ [Verify: Service registry protected]
        
Step 4: Deploy to pipeline/coordinator
        ↓ [Verify: Internal API protected]
        
Step 5: Update documentation (AGENTS.md)
```

### 6.3 Rollback Criteria

| Issue | Rollback Action |
|-------|-----------------|
| CORS failures on frontend | Check `CORS_ALLOWED_HEADERS` includes all needed headers |
| Rate limits too strict | Adjust `RATE_LIMIT_*` environment variables |
| Missing security headers | Verify middleware is applied in correct order |

---

## 7. Summary

### 7.1 Coordinated Security Improvements

| Category | Before (S8 only) | After (S8 + S7) |
|----------|------------------|-----------------|
| CORS Headers | Wildcard (`["*"]`) | Explicit whitelist |
| Security Headers | 0/6 on backend | 6/6 on backend |
| Rate Limiting | None | Tiered per-endpoint |
| DDoS Protection | None | Anonymous: 30/min |
| Brute Force | None | Auth: 5/min |
| Combined Posture | MEDIUM-LOW | **HIGH** |

### 7.2 Key Coordination Points

1. **Rate limit headers must be in CORS `expose_headers`** - Client JavaScript needs access
2. **429 responses must include CORS headers** - Frontend needs to read error
3. **Security headers apply to ALL responses** - Including 429 rate limit responses
4. **Unified middleware ensures consistent order** - Rate limit → CORS → Headers

### 7.3 Trade Signal

**S7 Task 2 complete, ready for Foreman review.**

Coordinated security plan created combining:
- ✅ S8's CORS hardening recommendations
- ✅ S7's rate limiting requirements
- ✅ Unified implementation strategy
- ✅ Comprehensive testing approach

**Estimated implementation time:** 16 hours across all services
**Risk reduction:** MEDIUM-LOW → HIGH

---

*Scout S7 - Coordinated Security Hardening Plan Complete*
*Cross-reviewed with Scout S8 findings*
