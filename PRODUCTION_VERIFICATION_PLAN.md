[Ver001.000]

# Production Verification Plan
## 3-Round Pre-Staging Deployment Verification

**Date:** 2026-03-16  
**Status:** Verification Phase  
**Objective:** Comprehensive review and sign-off before production deployment  
**Rounds Required:** 3 (Discovery → Action → Integration)

---

## Verification Strategy

### Round 1: Read-Only Discovery (Discovery Agents)
**Purpose:** Comprehensive codebase review without modifications  
**Duration:** 1 day  
**Agents:** Discovery Alpha, Beta, Gamma, Delta, Echo

### Round 2: Action Verification (Verification Agents)
**Purpose:** Functional testing and validation  
**Duration:** 1 day  
**Agents:** Verify Alpha, Beta, Gamma, Delta

### Round 3: Integration Sudo Check (Sudo Tech)
**Purpose:** Final integration validation and sign-off  
**Duration:** 0.5 day  
**Owner:** Sudo Tech

---

## Round 1: Read-Only Discovery

### Discovery Alpha: Codebase Structure Review
**Scope:** File structure, naming conventions, organization

**Checklist:**
- [ ] All Phase 2/3 files present in correct locations
- [ ] Naming conventions consistent (snake_case Python, camelCase TypeScript)
- [ ] Version headers present on all new files
- [ ] No orphaned files or duplicates
- [ ] Import paths correct and functional
- [ ] Directory structure follows project conventions

**Deliverable:** `ROUND1_DISCOVERY_ALPHA.md` - Structure report

---

### Discovery Beta: Dependencies Audit
**Scope:** All dependencies, versions, compatibility

**Checklist:**
- [ ] `requirements.txt` complete with all needed packages
- [ ] `package.json` dependencies up to date
- [ ] No version conflicts
- [ ] Security vulnerabilities in dependencies
- [ ] Development vs production deps correctly categorized
- [ ] Optional dependencies documented

**Files to Review:**
- `packages/shared/requirements.txt`
- `apps/website-v2/package.json`
- `package.json` (root)

**Deliverable:** `ROUND1_DISCOVERY_BETA.md` - Dependency report

---

### Discovery Gamma: Code Quality Review
**Scope:** Code patterns, consistency, best practices

**Checklist (Python):**
- [ ] Async/await usage correct
- [ ] Type hints present
- [ ] Error handling comprehensive
- [ ] No hardcoded secrets
- [ ] Logging used (not print)
- [ ] Database connections properly managed
- [ ] FastAPI patterns followed

**Checklist (TypeScript):**
- [ ] Type safety maintained
- [ ] React hooks used correctly
- [ ] forwardRef on components
- [ ] Props interfaces exported
- [ ] Error boundaries present
- [ ] Design tokens used

**Files to Review:**
- `packages/shared/api/src/betting/routes.py`
- `packages/shared/api/src/gateway/websocket_gateway.py`
- `packages/shared/api/src/auth/oauth.py`
- `packages/shared/api/src/auth/two_factor.py`
- `packages/shared/api/src/notifications/push_service.py`
- `apps/website-v2/src/components/TENET/ui/**/*.tsx`

**Deliverable:** `ROUND1_DISCOVERY_GAMMA.md` - Code quality report

---

### Discovery Delta: Test Suite Review
**Scope:** Test coverage, quality, completeness

**Checklist:**
- [ ] All test files have version headers
- [ ] Tests follow naming conventions
- [ ] Fixtures and helpers in conftest.py
- [ ] Mock usage appropriate
- [ ] Test data realistic
- [ ] Edge cases covered
- [ ] Integration test scenarios complete
- [ ] E2E tests have proper selectors

**Files to Review:**
- `packages/shared/api/tests/unit/**/*.py`
- `packages/shared/api/tests/integration/**/*.py`
- `apps/website-v2/e2e/**/*.spec.ts`

**Deliverable:** `ROUND1_DISCOVERY_DELTA.md` - Test quality report

---

### Discovery Echo: Documentation Review
**Scope:** Completeness, accuracy, usability

**Checklist:**
- [ ] All API endpoints documented
- [ ] Environment variables documented
- [ ] Setup instructions clear
- [ ] Code examples work
- [ ] Version headers present
- [ ] Links between documents work
- [ ] Deployment steps complete
- [ ] Troubleshooting section present

**Files to Review:**
- `docs/API_V1_DOCUMENTATION.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/WEBSOCKET_GUIDE.md`
- `docs/OAUTH_SETUP.md`
- `docs/PUSH_NOTIFICATIONS.md`
- `SECURITY.md`
- `apps/website-v2/src/components/TENET/README.md`

**Deliverable:** `ROUND1_DISCOVERY_ECHO.md` - Documentation report

---

## Round 2: Action Verification

### Verify Alpha: Backend Functionality
**Scope:** Run all backend tests, verify functionality

**Tests to Run:**
```bash
cd packages/shared/api
python -m pytest tests/unit/ -v --tb=short
python -m pytest tests/integration/ -v --tb=short
python -m pytest tests/ --cov=src --cov-report=term
```

**Verification:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage >= 85%
- [ ] No deprecation warnings (or documented)
- [ ] Test execution time reasonable

**Deliverable:** `ROUND2_VERIFY_ALPHA.md` - Test execution report with results

---

### Verify Beta: E2E Functionality
**Scope:** Run critical E2E tests

**Tests to Run:**
```bash
cd apps/website-v2
npx playwright test e2e/critical/ --project=chromium --reporter=list
```

**Verification:**
- [ ] Critical E2E tests pass
- [ ] Screenshots on failure work
- [ ] Test execution stable (no flakiness)
- [ ] Cross-browser tests pass (if time permits)

**Deliverable:** `ROUND2_VERIFY_BETA.md` - E2E test report

---

### Verify Gamma: Security Verification
**Scope:** Run security scans, verify fixes

**Scans to Run:**
```bash
# Python security
cd packages/shared/api
python -m bandit -r src/ -f json -o bandit-results.json

# Dependency check
python -m safety check -r requirements.txt

# Node security
cd apps/website-v2
npm audit --audit-level=moderate
```

**Verification:**
- [ ] Bandit: 0 high/critical issues
- [ ] Safety: No known vulnerabilities
- [ ] npm audit: 0 high/critical in production deps
- [ ] All previously identified issues fixed

**Deliverable:** `ROUND2_VERIFY_GAMMA.md` - Security verification report

---

### Verify Delta: Build Verification
**Scope:** Verify builds work correctly

**Builds to Run:**
```bash
# Frontend build
cd apps/website-v2
npm run build

# Python syntax check
cd packages/shared/api
python -m py_compile src/main.py
python -m compileall src/

# TypeScript check
npm run typecheck
```

**Verification:**
- [ ] Frontend build succeeds
- [ ] No TypeScript errors in TENET
- [ ] Python syntax valid
- [ ] No build warnings (or documented)
- [ ] Bundle size within limits

**Deliverable:** `ROUND2_VERIFY_DELTA.md` - Build verification report

---

## Round 3: Integration Sudo Check

### Sudo Tech: Final Integration Review

**Purpose:** Comprehensive final check before sign-off

### 3.1 Service Integration Check

**WebSocket + Betting Integration:**
```python
# Verify odds updates broadcast via WebSocket
# Check: Betting calculation triggers WS broadcast
```

**OAuth + User Integration:**
```python
# Verify OAuth login creates/links user
# Check: User can access protected resources
```

**2FA + Auth Integration:**
```python
# Verify 2FA flow completes login
# Check: Backup codes work when TOTP unavailable
```

**Push + Notifications Integration:**
```python
# Verify subscription stored correctly
# Check: Test notification delivery
```

### 3.2 Environment Configuration Check

**Verify .env.example Complete:**
```bash
# Required variables present
DATABASE_URL
REDIS_URL
JWT_SECRET_KEY
ENCRYPTION_KEY

# OAuth variables
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET

# Push variables
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_CLAIMS_EMAIL
```

### 3.3 Database Migration Check

**Verify Migration Applied:**
```sql
-- Check tables exist
SELECT * FROM information_schema.tables 
WHERE table_name IN ('oauth_accounts', 'two_factor', 'push_subscriptions');
```

### 3.4 Health Check Verification

**Verify Endpoints Respond:**
```bash
# Health checks
curl http://localhost:8000/health
curl http://localhost:8000/ready

# API endpoints
curl http://localhost:8000/api/betting/matches/test/odds
curl http://localhost:8000/api/notifications/vapid-public-key
```

### 3.5 Final Sign-Off Checklist

**Testing:**
- [ ] Round 1 reports reviewed - all issues addressed
- [ ] Round 2 reports reviewed - all tests passing
- [ ] Backend tests: 172 passing
- [ ] E2E tests: Critical path passing
- [ ] Coverage: 85%+ achieved

**Security:**
- [ ] Bandit scan: Clean
- [ ] npm audit: Clean (production deps)
- [ ] Safety check: No vulnerabilities
- [ ] No hardcoded secrets
- [ ] Rate limiting active

**Documentation:**
- [ ] API docs: All endpoints documented
- [ ] Setup guides: Complete
- [ ] Deployment guide: Updated
- [ ] README files: Present

**Code Quality:**
- [ ] Version headers: All files
- [ ] Type safety: TypeScript passing
- [ ] Python syntax: Valid
- [ ] No critical code smells

**Infrastructure:**
- [ ] Dependencies: All installed
- [ ] Migrations: Ready
- [ ] Environment vars: Documented
- [ ] Health checks: Working

**Sign-Off:**
- [ ] Round 1: Discovery complete ✅
- [ ] Round 2: Verification complete ✅
- [ ] Round 3: Integration complete ✅
- [ ] **PRODUCTION SIGN-OFF** ✅

---

## Deliverables by Round

### Round 1 Deliverables (5 reports)
1. `ROUND1_DISCOVERY_ALPHA.md` - Structure review
2. `ROUND1_DISCOVERY_BETA.md` - Dependencies review
3. `ROUND1_DISCOVERY_GAMMA.md` - Code quality review
4. `ROUND1_DISCOVERY_DELTA.md` - Test suite review
5. `ROUND1_DISCOVERY_ECHO.md` - Documentation review

### Round 2 Deliverables (4 reports)
1. `ROUND2_VERIFY_ALPHA.md` - Backend test execution
2. `ROUND2_VERIFY_BETA.md` - E2E test execution
3. `ROUND2_VERIFY_GAMMA.md` - Security verification
4. `ROUND2_VERIFY_DELTA.md` - Build verification

### Round 3 Deliverables (1 report)
1. `ROUND3_SUDO_SIGNOFF.md` - Final integration + sign-off

---

## Success Criteria

**For Production Sign-Off:**
- [ ] All 5 Round 1 reports submitted
- [ ] All 4 Round 2 reports submitted
- [ ] Round 3 sign-off completed
- [ ] Zero critical issues remaining
- [ ] All tests passing
- [ ] Security audit clean
- [ ] Documentation complete

---

## Timeline

```
Round 1 (Day 1): Discovery
  ├── Alpha: Structure review (4 hours)
  ├── Beta: Dependencies review (3 hours)
  ├── Gamma: Code quality review (6 hours)
  ├── Delta: Test suite review (4 hours)
  └── Echo: Documentation review (3 hours)

Review Gate 1: Round 1 reports reviewed by Sudo
  └── Issues logged for Round 2 verification

Round 2 (Day 2): Action Verification
  ├── Alpha: Backend tests execution (3 hours)
  ├── Beta: E2E tests execution (4 hours)
  ├── Gamma: Security verification (3 hours)
  └── Delta: Build verification (2 hours)

Review Gate 2: Round 2 reports reviewed by Sudo
  └── Issues must be resolved before Round 3

Round 3 (Day 3): Integration Sudo Check
  └── Sudo: Final integration + sign-off (4 hours)

Final Gate: Production Sign-Off
  └── Deployment authorized ✅
```

---

## Communication Protocol

### Round 1: Async Discovery
- Agents work independently
- Slack/Discord updates every 2 hours
- Questions directed to Sudo
- Reports submitted by end of day

### Round 2: Coordinated Verification
- Morning kickoff with Sudo
- Test execution coordinated
- Blockers addressed immediately
- Reports submitted by end of day

### Round 3: Sudo Led
- Sudo performs integration check
- Reviews all Round 1/2 reports
- Addresses any final issues
- Issues final sign-off

---

*Plan Version: 001.000*  
*Status: Ready for Round 1 Execution*  
*Next Step: Spawn Discovery Agents*
