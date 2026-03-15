[Ver001.000]

# Scout S8 Task 1: HTTP Security Headers & CORS Analysis
**Agent:** S8 (Security Headers & CORS Scout)  
**Date:** 2026-03-15  
**Status:** Task 1 Complete  
**Scope:** Libre-X-eSport 4NJZ4 TENET Platform

---

## 1. CORS Policy Assessment

### 1.1 Configuration Locations Found

| File | Lines | Env Var | Origin Count |
|------|-------|---------|--------------|
| `packages/shared/axiom-esports-data/api/main.py` | 131-140 | `CORS_ORIGINS` | Variable |
| `packages/shared/api/main.py` | 77-89 | Hardcoded | 4 fixed |
| `services/exe-directory/main.py` | 685-701 | `ALLOWED_ORIGINS` | Variable |
| `packages/shared/axiom-esports-data/pipeline/coordinator/main.py` | 210-226 | `CORS_ORIGINS` | Variable |

### 1.2 CORS Configuration Analysis

**Identified Configuration Pattern:**
```python
# From axiom-esports-data/api/main.py (representative)
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],  # ⚠️ WILDCARD - Security concern
    max_age=600,
)
```

**CORS Policy Evaluation:**

| Aspect | Status | Finding |
|--------|--------|---------|
| **Origin Validation** | ⚠️ WARNING | Wildcard headers combined with credentials=true |
| **Credentials** | ✅ OK | Properly enabled for authenticated requests |
| **Methods** | ✅ OK | Standard REST methods configured |
| **Preflight Cache** | ✅ OK | 10-minute cache reduces preflight requests |
| **Header Wildcard** | ❌ CRITICAL | `allow_headers=["*"]` violates security best practice |

### 1.3 Cross-Service CORS Inconsistencies

**Issue: Mixed Environment Variable Names**
- `packages/shared/axiom-esports-data/api/main.py`: Uses `CORS_ORIGINS`
- `services/exe-directory/main.py`: Uses `ALLOWED_ORIGINS`
- `.env.example`: Defines BOTH variables (lines 50-51)

**Impact:** Configuration drift risk between services.

---

## 2. Security Headers Assessment

### 2.1 Frontend (Vercel) Headers - vercel.json

| Header | Status | Value | Finding |
|--------|--------|-------|---------|
| X-Frame-Options | ✅ Present | DENY | Clickjacking protection active |
| X-Content-Type-Options | ✅ Present | nosniff | MIME-sniffing protection active |
| Referrer-Policy | ✅ Present | strict-origin-when-cross-origin | Referrer leakage controlled |
| Content-Security-Policy | ❌ MISSING | - | XSS injection vectors unmitigated |
| Strict-Transport-Security | ❌ MISSING | - | No HTTPS enforcement |
| X-XSS-Protection | ❌ MISSING | - | Legacy XSS protection absent |

**Coverage:** 3/6 recommended security headers present (50%)

### 2.2 Backend (FastAPI) Headers

**Custom Headers Implemented:**
- `X-Request-ID` - Request tracing (axiom-esports-data/api/main.py:379)
- `X-API-Version` - API version identifier (axiom-esports-data/api/main.py:380)
- `X-Total-Count`, `X-Page`, `X-Page-Size` - Pagination metadata (packages/shared/api/main.py:88)

**Security Headers Missing from ALL Backend Responses:**
| Header | Risk Level | Purpose |
|--------|------------|---------|
| X-Frame-Options | MEDIUM | Prevent clickjacking in API docs |
| X-Content-Type-Options | MEDIUM | Prevent MIME sniffing |
| Referrer-Policy | LOW | Control referrer information |
| Content-Security-Policy | HIGH | XSS and injection protection |
| Strict-Transport-Security | HIGH | Force HTTPS connections |
| X-XSS-Protection | LOW | Legacy browser XSS filter |

### 2.3 Documentation vs Implementation Gap

**AGENTS.md (line 461-464)** documents these headers as configured:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

**Reality:** These headers are ONLY set in Vercel frontend config, NOT in FastAPI backend responses.

---

## 3. Missing Security Headers List

### Critical Priority (High Risk)

| # | Header | Affected Component | Risk |
|---|--------|-------------------|------|
| 1 | **Strict-Transport-Security** | All FastAPI services | MITM attacks on HTTP downgrade |
| 2 | **Content-Security-Policy** | All FastAPI services | XSS, code injection attacks |

### Medium Priority

| # | Header | Affected Component | Risk |
|---|--------|-------------------|------|
| 3 | **X-Content-Type-Options** | All FastAPI services | MIME sniffing vulnerabilities |
| 4 | **X-Frame-Options** | All FastAPI services | Clickjacking via API docs |

### Low Priority

| # | Header | Affected Component | Risk |
|---|--------|-------------------|------|
| 5 | **Referrer-Policy** | All FastAPI services | Information leakage |
| 6 | **X-XSS-Protection** | All FastAPI services | Legacy browser protection |
| 7 | **Permissions-Policy** | All FastAPI services | Feature access control |

---

## 4. Credential Handling Assessment

### 4.1 CORS Credentials Configuration

**Finding:** All services enable `allow_credentials=True` with wildcard headers.

**OWASP CORS Guidelines Violation:**
> When responding to a credentialed request, the server must not specify the "*" wildcard for the Access-Control-Allow-Origin header; instead, it must specify an explicit origin.

**Current State:**
- ✅ Origins are explicitly listed (not wildcard)
- ❌ Headers use wildcard (`["*"]`) - violates spec when credentials=true

### 4.2 Credential Exposure Risk

| Component | JWT in Header | Session Cookie | Risk Level |
|-----------|---------------|----------------|------------|
| packages/shared/api/main.py | Yes | Potential | Medium |
| axiom-esports-data/api/main.py | Yes | No | Low |
| exe-directory/main.py | No | No | Low |
| pipeline/coordinator/main.py | No | No | Low |

---

## 5. Three Recommendations for Hardening

### Recommendation 1: Implement Security Headers Middleware (HIGH PRIORITY)

**Action:** Create a FastAPI middleware to add security headers to all responses.

**Implementation Location:** `packages/shared/api/src/middleware/security.py`

**Suggested Headers:**
```python
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["X-Frame-Options"] = "DENY"
response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
```

**Impact:** Eliminates clickjacking, MIME sniffing, and protocol downgrade attacks.

---

### Recommendation 2: Restrict CORS Headers from Wildcard to Explicit List (MEDIUM PRIORITY)

**Current (Insecure):**
```python
allow_headers=["*"]
```

**Recommended:**
```python
allow_headers=[
    "Authorization",
    "Content-Type",
    "X-Request-ID",
    "X-API-Key",
    "Accept",
    "Accept-Language",
    "Content-Language",
]
```

**Affected Files:**
- `packages/shared/axiom-esports-data/api/main.py:138`
- `packages/shared/api/main.py:87`
- `services/exe-directory/main.py:699`
- `packages/shared/axiom-esports-data/pipeline/coordinator/main.py:224`

**Impact:** Reduces attack surface for header-based attacks; complies with OWASP CORS guidelines.

---

### Recommendation 3: Standardize Environment Variable Names (LOW PRIORITY)

**Current State:**
- Two different env vars for same purpose
- Risk of configuration drift

**Recommended Action:**
1. Choose single variable name: `CORS_ORIGINS` (matches FastAPI convention)
2. Update `.env.example` to remove `ALLOWED_ORIGINS`
3. Update `services/exe-directory/main.py` to use `CORS_ORIGINS`
4. Add deprecation warning for old variable name

**Implementation:**
```python
# Backward-compatible approach
cors_origins = os.getenv(
    "CORS_ORIGINS",
    os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
).split(",")
```

**Impact:** Prevents misconfiguration between services; improves maintainability.

---

## 6. Summary Table

| Category | Status | Items |
|----------|--------|-------|
| CORS Origins | ✅ OK | Explicit origins configured |
| CORS Credentials | ⚠️ WARNING | Wildcard headers with credentials=true |
| Frontend Headers | ⚠️ PARTIAL | 3/6 headers present |
| Backend Headers | ❌ MISSING | 0/6 security headers present |
| Env Var Consistency | ❌ INCONSISTENT | Two different variable names |

**Overall Security Posture: MEDIUM-LOW**

Primary concerns:
1. Missing security headers on API responses
2. CORS header wildcard with credentials enabled
3. No HSTS enforcement

---

## 7. Trade Signal

**S8 Task 1 complete, ready for trade with S9.**

Awaiting S9's findings on database connection optimization for Task 2 handoff.

---

*Scout S8 - Security Headers & CORS Analysis Complete*
