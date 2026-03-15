[Ver001.000]

# Authentication Service - Next Steps
**Agent:** B1 (Authentication & Security Specialist)  
**Date:** 2026-03-15

---

## Immediate Actions Required (Before Production)

### 1. Fix Import Path Issue (CRITICAL) ⚠️

**Problem:** Python cannot import from `axiom_esports_data` because the actual directory is `axiom-esports-data` (hyphens).

**Affected:** 9 files including all auth routes

**Fix Options:**

#### Option A: Create Symbolic Link (Recommended - Fastest)
```powershell
# Run as Administrator
cd packages/shared
New-Item -ItemType SymbolicLink -Path axiom_esports_data -Target axiom-esports-data

# Or use the provided script:
.\.job-board\B1\FIX-IMPORT-PATHS.ps1 -CreateSymlink
```

#### Option B: Rename Directory
```powershell
cd packages/shared
Rename-Item axiom-esports-data axiom_esports_data

# Then update all documentation references
```

**Verification:**
```python
py -c "import sys; sys.path.insert(0, 'packages/shared'); from api.src.auth.auth_routes import router; print('OK')"
```

---

### 2. Set Production Environment Variables (CRITICAL) ⚠️

```bash
# Generate secure keys
openssl rand -hex 32  # For JWT_SECRET_KEY
openssl rand -hex 16  # For SECRET_KEY
```

Add to production environment:
```bash
JWT_SECRET_KEY=your-64-char-hex-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

---

### 3. Change Default Admin Password (CRITICAL) ⚠️

**Security Risk:** Migration includes default admin with known password.

```sql
-- Run immediately after deployment
-- First, generate a new bcrypt hash for your password
-- Then update:
UPDATE users 
SET hashed_password = '$2b$12$YourNewBcryptHashHere' 
WHERE username = 'admin';
```

---

## Testing After Fix

### 1. Run E2E Tests
```bash
cd packages/shared
pip install -r requirements.txt
py -m pytest ../../.job-board/B1/test_auth_e2e.py -v
```

### 2. Manual API Testing
```bash
# Start the API
cd packages/shared/api
py main.py

# Test registration
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!","password_confirm":"TestPass123!","display_name":"Test User"}'

# Test login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPass123!"}'

# Test me endpoint (replace TOKEN with actual token)
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## Short-Term Improvements (Post-Deployment)

### 1. Add Rate Limiting
The `slowapi` package is already in requirements.txt but not implemented.

**Add to `auth_routes.py`:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: UserLogin):
    ...

@router.post("/register")
@limiter.limit("3/hour")
async def register(request: UserRegister):
    ...

@router.post("/password/reset-request")
@limiter.limit("3/hour")
async def request_password_reset(...):
    ...
```

### 2. Implement Login History
The `login_history` table exists but is not populated. Add to login endpoint:

```python
# After successful login in auth_routes.py
await conn.execute(
    """
    INSERT INTO login_history (user_id, ip_address, user_agent, status)
    VALUES ($1, $2, $3, 'success')
    """,
    user["id"], 
    request.client.host if request.client else None,
    request.headers.get("user-agent")
)
```

### 3. Implement Missing /auth/sessions Endpoint
See recommended implementation in REPORT-B1-AUTH.md section 2.9.

---

## Medium-Term Roadmap

### 1. Email Integration
- [ ] Configure SMTP settings
- [ ] Implement email verification
- [ ] Implement password reset emails
- [ ] Security alert emails

### 2. Enhanced Security
- [ ] Account lockout after failed attempts
- [ ] IP-based suspicious activity detection
- [ ] Concurrent session limits
- [ ] 2FA with TOTP

### 3. Session Management
- [ ] View active sessions endpoint
- [ ] Revoke individual sessions
- [ ] Logout from all devices

---

## Files Modified/Created by This Agent

### Created:
1. `.job-board/B1/REPORT-B1-AUTH.md` - Comprehensive test report
2. `.job-board/B1/FIX-IMPORT-PATHS.ps1` - PowerShell fix script
3. `.job-board/B1/test_auth_e2e.py` - E2E test suite
4. `.job-board/B1/NEXT-STEPS.md` - This file

### To Be Modified (by infrastructure team):
1. `packages/shared/` - Create symlink: `axiom_esports_data -> axiom-esports-data`

---

## Contact & Handoff

**Issues Found:**
- Import path blocking all auth functionality
- Missing rate limiting on auth endpoints
- JWT secret fallback in development mode
- Default admin password exposed in migration

**Test Status:**
- ⚠️ Tests written but cannot run until import fix applied
- ✅ Code review complete
- ✅ Security analysis complete

**Next Agent Should:**
1. Apply the import path fix
2. Set production environment variables
3. Run E2E tests
4. Fix any failing tests
5. Implement rate limiting
