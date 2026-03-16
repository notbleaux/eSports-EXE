[Ver001.000]

# Phase 3 Sub-Agent Checklists
## Pre-Spawn Verification & Post-Completion Validation

---

## Sub-Agent Zeta: Backend Testing

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify Phase 2 files exist
[ -f "packages/shared/api/src/betting/routes.py" ] && echo "✅ Betting"
[ -f "packages/shared/api/src/gateway/routes.py" ] && echo "✅ Gateway"
[ -f "packages/shared/api/src/notifications/routes.py" ] && echo "✅ Notifications"
[ -f "packages/shared/api/src/auth/oauth.py" ] && echo "✅ OAuth"
[ -f "packages/shared/api/src/auth/two_factor.py" ] && echo "✅ 2FA"

# CHECK 2: Verify test infrastructure
[ -d "packages/shared/api/tests" ] && echo "✅ Tests directory"
[ -f "packages/shared/api/tests/unit/betting/test_routes.py" ] && echo "✅ Betting tests exist"
python -c "import pytest; print('✅ pytest available')"
python -c "import pytest_asyncio; print('✅ pytest-asyncio available')"

# CHECK 3: Verify coverage tools
python -c "import pytest_cov; print('✅ pytest-cov available')"

# CHECK 4: Check existing coverage baseline
cd packages/shared/api
pytest --collect-only 2>/dev/null | grep -c "test_" | xargs -I {} echo "Existing tests: {}"
```

### Spawn Brief for Sub-Agent Zeta

**Task:** Comprehensive Backend Testing  
**Duration:** 2 days  
**Priority:** P0

**Context:**
- All Phase 2 modules need test coverage
- Current: betting (25 tests), others (0 tests)
- Target: 85%+ coverage on all modules

**Required Deliverables:**

1. **tests/unit/betting/** (expand)
   - test_odds_engine.py (10 tests)
   - test_live_odds.py (5 tests)
   - test_cache.py (5 tests)

2. **tests/unit/gateway/** (new)
   - test_websocket_gateway.py (10 tests)
   - test_channel_pubsub.py (8 tests)
   - test_presence.py (7 tests)

3. **tests/unit/notifications/** (new)
   - test_push_service.py (10 tests)
   - test_routes.py (10 tests)

4. **tests/unit/auth/** (new)
   - test_oauth.py (10 tests)
   - test_two_factor.py (10 tests)

5. **tests/integration/** (new)
   - test_betting_websocket.py
   - test_oauth_flow.py
   - test_notification_delivery.py

**Testing Standards:**
- Use pytest with async/await support
- Mock external services (HTTPX for OAuth, pywebpush for notifications)
- Use fixtures for database setup
- All tests must be isolated
- Use `@pytest.mark.asyncio` for async tests

**Example Test Pattern:**
```python
import pytest
from src.betting.routes import calculate_odds

@pytest.mark.asyncio
async def test_calculate_odds_success():
    # Arrange
    match_id = "test_match_123"
    
    # Act
    result = await calculate_odds(match_id)
    
    # Assert
    assert result.match_id == match_id
    assert result.team_a_decimal > 1.0
    assert result.team_b_decimal > 1.0
```

### Post-Completion Verification
```bash
# VERIFY 1: Run all tests
cd packages/shared/api
pytest tests/unit -v --tb=short

# VERIFY 2: Coverage report
pytest --cov=src --cov-report=term-missing | grep -E "(betting|gateway|notifications|auth)"

# VERIFY 3: Coverage threshold
pytest --cov=src --cov-fail-under=85

# VERIFY 4: Integration tests
pytest tests/integration -v

# VERIFY 5: Test count
pytest --collect-only | grep -c "test_" | xargs -I {} echo "Total tests: {}"
```

---

## Sub-Agent Eta: E2E Testing

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify Playwright
[ -f "apps/website-v2/playwright.config.ts" ] && echo "✅ Playwright config"
npx playwright --version && echo "✅ Playwright installed"

# CHECK 2: Check existing E2E tests
ls apps/website-v2/tests/e2e/*.spec.ts 2>/dev/null | wc -l | xargs -I {} echo "Existing E2E tests: {}"

# CHECK 3: Verify frontend builds
cd apps/website-v2
npm run build 2>&1 | tail -5

# CHECK 4: Check API is testable
[ -f "packages/shared/api/main.py" ] && echo "✅ API available"
```

### Spawn Brief for Sub-Agent Eta

**Task:** Playwright E2E Test Suite  
**Duration:** 2 days  
**Priority:** P0

**Context:**
- Need comprehensive browser automation tests
- Cover all Phase 2 user flows
- Target: 50+ test scenarios

**Required Deliverables:**

1. **tests/e2e/auth/oauth.spec.ts** (10 tests)
   - OAuth login with Discord
   - OAuth login with Google
   - OAuth login with GitHub
   - OAuth account linking
   - OAuth error handling

2. **tests/e2e/auth/2fa.spec.ts** (10 tests)
   - 2FA setup flow
   - QR code display
   - TOTP verification
   - Backup codes generation
   - 2FA login flow
   - Backup code login

3. **tests/e2e/betting/odds.spec.ts** (8 tests)
   - View match odds
   - Odds history navigation
   - Live odds updates
   - Odds format selection

4. **tests/e2e/websocket/gateway.spec.ts** (10 tests)
   - Connection establishment
   - Channel subscription
   - Message broadcast
   - Auto-reconnect
   - Presence updates
   - Disconnection handling

5. **tests/e2e/notifications/push.spec.ts** (8 tests)
   - Permission request
   - Subscription toggle
   - Test notification
   - Preference updates
   - Unsubscribe

6. **tests/e2e/ui/components.spec.ts** (8 tests)
   - Component rendering
   - Component interactions
   - Accessibility checks

**Test Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test('OAuth login with Discord', async ({ page }) => {
  // Arrange
  await page.goto('/auth/login');
  
  // Act
  await page.click('[data-testid="discord-oauth"]');
  
  // Assert
  await expect(page).toHaveURL(/discord.com/);
});
```

**Configuration:**
- Use `data-testid` attributes for selectors
- Screenshot on failure
- Video recording in CI
- Parallel execution

### Post-Completion Verification
```bash
cd apps/website-v2

# VERIFY 1: Run E2E tests
npx playwright test --reporter=list

# VERIFY 2: Check test count
npx playwright test --list | grep -c "✓" | xargs -I {} echo "Tests: {}"

# VERIFY 3: Verify no flaky tests
npx playwright test --repeat-each=3

# VERIFY 4: Generate report
npx playwright test --reporter=html
```

---

## Sub-Agent Theta: Security Audit

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify security tools available
python -c "import bandit; print('✅ bandit available')" 2>/dev/null || echo "⚠️ Install: pip install bandit safety"
npm audit --version && echo "✅ npm audit available"

# CHECK 2: Check current security status
grep -r "password\s*=" packages/shared/api/src/ 2>/dev/null | head -5

# CHECK 3: Verify dependencies
[ -f "packages/shared/requirements.txt" ] && echo "✅ Python requirements"
[ -f "apps/website-v2/package.json" ] && echo "✅ Node dependencies"

# CHECK 4: Check for existing security docs
[ -f "SECURITY.md" ] && echo "⚠️ Security doc exists" || echo "✅ Need to create"
```

### Spawn Brief for Sub-Agent Theta

**Task:** Security Audit & Hardening  
**Duration:** 2 days  
**Priority:** P0

**Context:**
- Security is critical for production
- Need to audit all Phase 2 code
- Fix any vulnerabilities found

**Required Deliverables:**

1. **SECURITY_AUDIT_REPORT.md**
   - Dependency vulnerabilities
   - Code security issues
   - Configuration hardening
   - Remediation steps

2. **Security Fixes**
   - Fix all high/critical issues
   - Update vulnerable dependencies
   - Add security headers
   - Implement rate limiting gaps

3. **SECURITY.md** (new)
   - Security policy
   - Vulnerability reporting
   - Security best practices

**Audit Checklist:**

1. **Dependency Audit**
   ```bash
   safety check -r packages/shared/requirements.txt
   npm audit --audit-level=moderate
   ```

2. **Code Security (Bandit)**
   ```bash
   bandit -r packages/shared/api/src/ -f json -o bandit-report.json
   ```

3. **Manual Review**
   - [ ] No hardcoded secrets
   - [ ] No SQL injection vulnerabilities
   - [ ] Proper input validation
   - [ ] OAuth state validation
   - [ ] JWT secure configuration
   - [ ] 2FA rate limiting
   - [ ] WebSocket authentication
   - [ ] CORS configuration

**Common Issues to Fix:**
- Hardcoded passwords/secrets
- Missing input validation
- Weak crypto algorithms
- Insecure randomness
- Debug mode enabled

### Post-Completion Verification
```bash
# VERIFY 1: Bandit scan
bandit -r packages/shared/api/src/ -ll

# VERIFY 2: Dependency check
safety check -r packages/shared/requirements.txt
npm audit --audit-level=moderate

# VERIFY 3: Secret scan
grep -r "password\s*=\s*[\"']" packages/shared/api/src/ || echo "✅ No hardcoded passwords"
grep -r "secret\s*=\s*[\"']" packages/shared/api/src/ || echo "✅ No hardcoded secrets"

# VERIFY 4: Security doc exists
[ -f "SECURITY.md" ] && echo "✅ Security doc created"
```

---

## Sub-Agent Iota: Documentation

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify existing docs
[ -f "docs/API_V1_DOCUMENTATION.md" ] && echo "✅ API docs exist"
[ -f "docs/DEPLOYMENT_GUIDE.md" ] && echo "✅ Deployment guide exists"

# CHECK 2: Check Phase 2 implementation
[ -f "packages/shared/api/src/betting/routes.py" ] && echo "✅ Betting to document"
[ -f "packages/shared/api/src/gateway/routes.py" ] && echo "✅ Gateway to document"
[ -f "packages/shared/api/src/notifications/routes.py" ] && echo "✅ Notifications to document"

# CHECK 3: Check UI components
ls apps/website-v2/src/components/TENET/ui/**/*.tsx 2>/dev/null | wc -l | xargs -I {} echo "UI components: {}"

# CHECK 4: Verify version headers
grep -c "Ver001" docs/*.md 2>/dev/null | xargs -I {} echo "Versioned docs: {}"
```

### Spawn Brief for Sub-Agent Iota

**Task:** Complete Documentation  
**Duration:** 2 days  
**Priority:** P1

**Context:**
- Phase 2 features need documentation
- API docs need updating
- Component library needs docs

**Required Deliverables:**

1. **docs/API_V1_DOCUMENTATION.md** (update)
   Add sections:
   - Betting API (7 endpoints)
   - WebSocket Gateway
   - OAuth endpoints
   - 2FA endpoints
   - Push Notification API

2. **docs/WEBSOCKET_GUIDE.md** (new)
   - Connection setup
   - Channel subscription
   - Message format
   - Error handling
   - Example code

3. **docs/OAUTH_SETUP.md** (new)
   - Discord app setup
   - Google app setup
   - GitHub app setup
   - Environment variables
   - Testing locally

4. **docs/PUSH_NOTIFICATIONS.md** (new)
   - VAPID key generation
   - Browser setup
   - Permission handling
   - Testing push

5. **apps/website-v2/src/components/TENET/README.md** (new)
   - Component usage examples
   - Props for each component
   - Design tokens guide

6. **docs/DEPLOYMENT_GUIDE.md** (update)
   - New environment variables
   - OAuth provider setup
   - VAPID key setup
   - Migration 019_oauth_2fa.sql

**Documentation Standards:**
- Version header: `[Ver001.000]`
- Code examples for all APIs
- Tables for endpoints/props
- Screenshots for UI (if applicable)

**Example API Doc:**
```markdown
### Get Match Odds

```bash
GET /api/betting/matches/{match_id}/odds
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| match_id | string | Yes | Match ID |

**Response:**
```json
{
  "match_id": "...",
  "team_a_decimal": 1.85,
  "team_b_decimal": 2.10
}
```
```

### Post-Completion Verification
```bash
# VERIFY 1: All docs have version headers
grep -l "Ver001" docs/*.md apps/website-v2/src/components/TENET/*.md | wc -l

# VERIFY 2: API docs cover all endpoints
grep -c "^### " docs/API_V1_DOCUMENTATION.md | xargs -I {} echo "Endpoints documented: {}"

# VERIFY 3: Check for TODO/FIXME in docs
grep -i "todo\|fixme" docs/*.md || echo "✅ No TODOs in docs"
```

---

## Sub-Agent Kappa: Performance Optimization

### Pre-Spawn Read-Only Verification
```bash
# CHECK 1: Verify build tools
cd apps/website-v2
npm run build 2>&1 | tail -3

# CHECK 2: Check bundle analyzer
npm list @next/bundle-analyzer 2>/dev/null || echo "⚠️ May need bundle analyzer"

# CHECK 3: Check Lighthouse
which lighthouse || echo "⚠️ May need Lighthouse CLI"

# CHECK 4: Database check
[ -f "packages/shared/api/src/db_manager.py" ] && echo "✅ DB connection available"
```

### Spawn Brief for Sub-Agent Kappa

**Task:** Performance Optimization  
**Duration:** 2 days  
**Priority:** P1

**Context:**
- Need to optimize for production
- Bundle size, query performance, caching

**Required Deliverables:**

1. **PERFORMANCE_REPORT.md**
   - Bundle analysis
   - Query performance
   - WebSocket benchmarks
   - Recommendations

2. **Bundle Optimization**
   - Code splitting analysis
   - Lazy loading implementation
   - Tree shaking verification
   - Asset optimization

3. **Database Optimization**
   - Slow query identification
   - Index recommendations
   - Query caching strategy

4. **WebSocket Performance**
   - Connection pooling analysis
   - Message batching
   - Load test results

5. **Caching Implementation**
   - Redis caching for odds
   - Response caching
   - Cache invalidation strategy

**Tools to Use:**
```bash
# Bundle analysis
npm run build -- --analyze

# Lighthouse
lighthouse http://localhost:5173 --output=html

# Database profiling
EXPLAIN ANALYZE SELECT * FROM matches WHERE id = '...';

# Load testing
k6 run load-test.js
```

**Performance Targets:**
- Bundle size: < 500KB gzipped
- API response: < 200ms (p95)
- WebSocket latency: < 50ms
- Lighthouse score: > 90

### Post-Completion Verification
```bash
# VERIFY 1: Bundle size
du -h apps/website-v2/dist/assets/*.js | sort -h | tail -5

# VERIFY 2: Lighthouse score
lighthouse http://localhost:5173 --output=json | jq '.categories.performance.score'

# VERIFY 3: API performance
./scripts/api_benchmark.sh
```

---

## Sudo Tech: Production Readiness (Wave 3)

### Responsibilities

1. **Environment Validation**
   - Create `.env.example` with all variables
   - Validate environment configuration
   - Document secrets management

2. **Health Checks**
   - Verify all services have /health endpoints
   - Test health check responses
   - Set up monitoring

3. **Integration Testing**
   - Cross-service integration
   - End-to-end flows
   - Error scenarios

4. **Final Verification**
   - Production checklist
   - Security sign-off
   - Performance validation
   - Documentation review

### Production Checklist

```bash
# Database
[ ] Migrations applied
[ ] Indexes created
[ ] Backup configured

# API
[ ] All routes tested
[ ] Rate limiting active
[ ] CORS configured
[ ] Security headers set

# Frontend
[ ] Build successful
[ ] Tests passing
[ ] Bundle optimized
[ ] Assets compressed

# WebSocket
[ ] Gateway responding
[ ] Auth integrated
[ ] Presence tracking

# Monitoring
[ ] Logging configured
[ ] Alerts set up
[ ] Dashboards created

# Documentation
[ ] API docs updated
[ ] Deployment guide current
[ ] Runbooks created
```

---

*Checklists Version: 001.000*  
*Use with: PHASE_3_EXECUTION_PLAN.md*
