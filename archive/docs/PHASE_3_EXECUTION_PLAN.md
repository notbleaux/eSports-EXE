[Ver001.000]

# Phase 3 Execution Plan
## Testing, Security & Production Preparation

**Date:** 2026-03-16  
**Status:** Planning  
**Scope:** Quality assurance, testing, documentation, security hardening  
**Estimated Duration:** 5-7 days

---

## Executive Summary

Phase 3 focuses on transforming the Phase 2 implementation into production-ready code through comprehensive testing, security hardening, documentation, and performance optimization.

### Resource Allocation

| Role | Assignment | Responsibility |
|------|------------|----------------|
| **Sudo Tech** | Coordinator | Architecture decisions, final reviews, integration |
| **Sub-Agent Zeta** | QA Specialist | Backend unit tests, integration tests |
| **Sub-Agent Eta** | E2E Specialist | Playwright E2E tests, critical path testing |
| **Sub-Agent Theta** | Security Specialist | Security audit, hardening, dependency scan |
| **Sub-Agent Iota** | Docs Specialist | API documentation, component docs, guides |
| **Sub-Agent Kappa** | Performance Specialist | Optimization, load testing, bundle analysis |

---

## Pre-Spawn Read-Only Verification

Before spawning any agents, Sudo Tech will verify:

```bash
# 1. Code completeness check
[ -f "packages/shared/api/src/betting/routes.py" ] && echo "✅ Betting"
[ -f "packages/shared/api/src/gateway/routes.py" ] && echo "✅ Gateway"
[ -f "packages/shared/api/src/notifications/routes.py" ] && echo "✅ Notifications"
[ -f "packages/shared/api/src/auth/oauth.py" ] && echo "✅ OAuth"
[ -f "apps/website-v2/src/components/TENET/index.tsx" ] && echo "✅ TENET"

# 2. Type safety check
cd apps/website-v2 && npm run typecheck 2>&1 | grep -c "TENET" | xargs -I {} echo "TENET errors: {}"

# 3. Python syntax check
python -m py_compile packages/shared/api/src/betting/routes.py && echo "✅ Betting syntax"
python -m py_compile packages/shared/api/src/gateway/routes.py && echo "✅ Gateway syntax"
python -m py_compile packages/shared/api/src/notifications/routes.py && echo "✅ Notifications syntax"

# 4. Test coverage baseline
find packages/shared/api/tests -name "*.py" | wc -l | xargs -I {} echo "Existing test files: {}"
```

---

## Workstream Breakdown

### WS-1: Backend Testing (Zeta)
**Priority:** P0  
**Duration:** 2 days  
**Goal:** Achieve 85%+ test coverage on all Phase 2 modules

#### Missing Tests Identified

| Module | Current Tests | Required Tests | Coverage Target |
|--------|---------------|----------------|-----------------|
| betting | 25 | 40 | 90% |
| gateway | 0 | 25 | 85% |
| notifications | 0 | 20 | 85% |
| auth/oauth | 0 | 15 | 80% |
| auth/2fa | 0 | 15 | 80% |

#### Deliverables

1. **tests/unit/betting/** (Expand existing)
   - test_odds_engine.py (unit tests for calculation logic)
   - test_live_odds.py (WebSocket broadcast integration)
   - test_cache_behavior.py (Redis caching)

2. **tests/unit/gateway/** (New)
   - test_websocket_gateway.py (connection management)
   - test_channel_pubsub.py (message routing)
   - test_presence_tracking.py (user presence)

3. **tests/unit/notifications/** (New)
   - test_push_service.py (VAPID, subscription)
   - test_routes.py (API endpoints)

4. **tests/unit/auth/** (New)
   - test_oauth.py (provider integration)
   - test_two_factor.py (TOTP verification)

5. **tests/integration/** (New)
   - test_betting_websocket.py (betting + WS integration)
   - test_oauth_flow.py (end-to-end OAuth)
   - test_notification_delivery.py (push delivery)

#### Testing Standards
- Use pytest with async support
- Mock external services (OAuth providers, push services)
- Use pytest-cov for coverage reporting
- All tests must pass in CI

#### Post-Verification
```bash
pytest packages/shared/api/tests --cov=src --cov-report=html
coverage report | grep -E "(betting|gateway|notifications|auth)"
```

---

### WS-2: E2E Testing (Eta)
**Priority:** P0  
**Duration:** 2 days  
**Goal:** Comprehensive browser automation testing

#### Test Scenarios

1. **Authentication Flows**
   ```typescript
   // tests/e2e/auth/oauth.spec.ts
   - OAuth login with each provider
   - 2FA setup and verification
   - Backup code usage
   - Session persistence
   ```

2. **Betting Flows**
   ```typescript
   // tests/e2e/betting/odds.spec.ts
   - View match odds
   - Odds history navigation
   - Live odds updates via WebSocket
   ```

3. **WebSocket Flows**
   ```typescript
   // tests/e2e/websocket/gateway.spec.ts
   - Connection establishment
   - Channel subscription
   - Message broadcast
   - Reconnection behavior
   - Presence updates
   ```

4. **Notification Flows**
   ```typescript
   // tests/e2e/notifications/push.spec.ts
   - Permission request
   - Subscription toggle
   - Test notification receive
   - Preference updates
   ```

5. **UI Component Testing**
   ```typescript
   // tests/e2e/ui/components.spec.ts
   - Component rendering
   - Interaction testing
   - Accessibility checks
   ```

#### Deliverables
- 15+ E2E test files
- 50+ test scenarios
- Screenshots on failure
- Video recording for CI

#### Post-Verification
```bash
cd apps/website-v2
npx playwright test --reporter=list
```

---

### WS-3: Security Hardening (Theta)
**Priority:** P0  
**Duration:** 2 days  
**Goal:** Security audit and vulnerability remediation

#### Security Audit Checklist

1. **Dependency Audit**
   ```bash
   # Python
   pip install safety bandit
   safety check -r requirements.txt
   bandit -r packages/shared/api/src/
   
   # Node.js
   npm audit
   npm audit fix
   ```

2. **Secrets Scanning**
   ```bash
   # Check for hardcoded secrets
   grep -r "password\s*=" packages/shared/api/src/
   grep -r "api_key\s*=" packages/shared/api/src/
   grep -r "secret\s*=" packages/shared/api/src/
   ```

3. **Authentication Security**
   - [ ] OAuth state parameter validation
   - [ ] JWT token expiration appropriate
   - [ ] 2FA rate limiting (5 attempts/15min)
   - [ ] Backup codes single-use enforcement
   - [ ] Password strength requirements

4. **API Security**
   - [ ] Rate limiting on all endpoints
   - [ ] Input validation (SQL injection prevention)
   - [ ] CORS configuration review
   - [ ] Security headers (HSTS, CSP, X-Frame-Options)

5. **WebSocket Security**
   - [ ] Authentication on connection
   - [ ] Message size limits
   - [ ] Rate limiting per connection
   - [ ] Origin validation

6. **Push Notification Security**
   - [ ] VAPID key protection
   - [ ] Subscription verification
   - [ ] Payload size limits

#### Deliverables
- `SECURITY_AUDIT_REPORT.md`
- Fixed vulnerabilities
- Updated security configurations
- `SECURITY.md` documentation

#### Post-Verification
```bash
bandit -r packages/shared/api/src/ -f json -o security-report.json
npm audit --audit-level=moderate
```

---

### WS-4: Documentation (Iota)
**Priority:** P1  
**Duration:** 2 days  
**Goal:** Complete documentation for all Phase 2 features

#### Documentation Gaps

1. **API Documentation Updates** (`docs/API_V1_DOCUMENTATION.md`)
   Add sections for:
   - Betting API (7 endpoints)
   - WebSocket Gateway (/ws/gateway)
   - OAuth endpoints (/auth/oauth/*)
   - 2FA endpoints (/auth/2fa/*)
   - Push Notification API (/notifications/*)

2. **Component Documentation**
   Create `apps/website-v2/src/components/TENET/README.md`:
   - Component usage examples
   - Props documentation
   - Design tokens guide

3. **Deployment Guide Updates** (`docs/DEPLOYMENT_GUIDE.md`)
   Add:
   - OAuth provider setup (Discord, Google, GitHub)
   - VAPID key generation
   - Environment variables reference
   - Migration 019_oauth_2fa.sql

4. **New Documents**
   - `docs/WEBSOCKET_GUIDE.md` - WebSocket usage guide
   - `docs/OAUTH_SETUP.md` - OAuth provider configuration
   - `docs/PUSH_NOTIFICATIONS.md` - Push setup guide
   - `docs/UI_COMPONENTS.md` - Component library guide

5. **README Updates**
   - Root README.md with Phase 2 features
   - API README.md with new endpoints

#### Documentation Standards
- Version headers on all docs: `[Ver001.000]`
- Code examples for all APIs
- Screenshots for UI components
- Environment variable tables

#### Post-Verification
```bash
# Check all new files have version headers
grep -l "Ver001" docs/*.md apps/website-v2/src/components/TENET/*.md
```

---

### WS-5: Performance Optimization (Kappa)
**Priority:** P1  
**Duration:** 2 days  
**Goal:** Optimize for production performance

#### Optimization Areas

1. **Frontend Bundle Analysis**
   ```bash
   cd apps/website-v2
   npm run build -- --analyze
   # Check bundle size, code splitting
   ```

2. **Database Query Optimization**
   ```python
   # Review slow queries in:
   # - betting/routes.py (odds calculation)
   # - gateway/websocket_gateway.py (presence)
   # - notifications/routes.py (subscriptions)
   
   # Add indexes if missing
   # Add query caching
   ```

3. **WebSocket Performance**
   - Connection pooling
   - Message batching
   - Binary protocol consideration
   - Load testing with k6

4. **Caching Strategy**
   ```python
   # Review caching in:
   # - Betting odds (current: in-memory)
   # - User sessions
   # - OAuth tokens
   
   # Implement Redis caching where appropriate
   ```

5. **Asset Optimization**
   - Image compression
   - Font subsetting
   - CSS purging

#### Deliverables
- `PERFORMANCE_REPORT.md`
- Optimized bundle sizes
- Database indexes
- Caching implementation

#### Post-Verification
```bash
# Bundle size check
du -h apps/website-v2/dist/assets/*.js | sort -h

# Lighthouse CI
npm run lighthouse
```

---

### WS-6: Production Readiness (Sudo Tech)
**Priority:** P0  
**Duration:** 3 days  
**Goal:** Final integration and production preparation

#### Integration Tasks

1. **Environment Variable Validation**
   Create `.env.example` with all required variables:
   ```bash
   # Database
   DATABASE_URL=
   REDIS_URL=
   
   # Security
   JWT_SECRET_KEY=
   ENCRYPTION_KEY=
   
   # OAuth
   DISCORD_CLIENT_ID=
   DISCORD_CLIENT_SECRET=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   
   # Push
   VAPID_PUBLIC_KEY=
   VAPID_PRIVATE_KEY=
   VAPID_CLAIMS_EMAIL=
   ```

2. **Health Check Endpoints**
   Verify all services have health checks:
   - `/health` - General health
   - `/ready` - Ready for traffic
   - `/health/betting` - Betting service
   - `/health/websocket` - WebSocket service

3. **Monitoring Setup**
   - Logging configuration (structured JSON)
   - Error tracking (Sentry integration)
   - Metrics collection (Prometheus)
   - Alerting rules

4. **Database Migrations**
   Verify migration order:
   ```bash
   # 019_oauth_2fa.sql must be applied
   psql $DATABASE_URL -f packages/shared/api/migrations/019_oauth_2fa.sql
   ```

5. **CI/CD Pipeline**
   Update GitHub Actions:
   - Add new test suites
   - Security scanning
   - Performance budgets

6. **Rollback Procedures**
   Document rollback steps for:
   - Database migrations
   - API deployments
   - Frontend releases

#### Deliverables
- Updated `.env.example`
- Health check verification
- Monitoring dashboard
- Rollback runbook

#### Post-Verification
```bash
# Full system check
./scripts/production_checklist.sh
```

---

## Execution Sequence

### Wave 1: Foundation (Days 1-2)
```
Day 1:
├── Zeta: Begin backend unit tests
├── Theta: Start security audit
└── Iota: Begin API documentation

Day 2:
├── Zeta: Continue backend tests
├── Theta: Security fixes
├── Iota: Continue docs
└── Sudo: Pre-integration review
```

### Wave 2: Testing & Optimization (Days 3-4)
```
Day 3:
├── Eta: Begin E2E tests
├── Kappa: Begin performance analysis
├── Zeta: Integration tests
└── Iota: Component documentation

Day 4:
├── Eta: Continue E2E tests
├── Kappa: Optimization implementation
├── Theta: Final security review
└── Sudo: Mid-phase review
```

### Wave 3: Integration & Finalization (Days 5-7)
```
Day 5:
├── Sudo: Cross-service integration
├── Sudo: Environment validation
├── All: Bug fixes from testing
└── Iota: Final documentation

Day 6:
├── Sudo: Full system testing
├── Sudo: Performance validation
├── Sudo: Security sign-off
└── Sudo: Documentation review

Day 7:
├── Sudo: Production checklist
├── Sudo: Final verification
├── All: Sign-off
└── Sudo: Deployment preparation
```

---

## Risk Management

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Test flakiness | Medium | Medium | Retry logic, isolated tests |
| Security vulnerability found | Low | High | Immediate fix, re-audit |
| Performance regression | Medium | Medium | Benchmarking, profiling |
| Documentation incomplete | Low | Medium | Templates, checklists |
| OAuth provider issues | Low | Medium | Dev app testing |

---

## Success Criteria

Phase 3 complete when:

- [ ] **Testing**
  - [ ] Backend: 85%+ coverage
  - [ ] E2E: 50+ scenarios passing
  - [ ] All tests pass in CI
  
- [ ] **Security**
  - [ ] No high/critical vulnerabilities
  - [ ] Security audit report
  - [ ] Dependencies updated
  
- [ ] **Documentation**
  - [ ] API docs updated
  - [ ] Component docs complete
  - [ ] Deployment guide updated
  
- [ ] **Performance**
  - [ ] Bundle size < 500KB (gzipped)
  - [ ] API response < 200ms (p95)
  - [ ] WebSocket latency < 50ms
  
- [ ] **Production Readiness**
  - [ ] Environment variables documented
  - [ ] Health checks passing
  - [ ] Monitoring configured
  - [ ] Rollback procedures tested

---

## Communication Plan

### Daily Standup (Async)
Agents report:
- Completed yesterday
- Working on today
- Blockers/needs help

### Checkpoint Schedule

| Day | Time | Activity |
|-----|------|----------|
| 1-4 | 09:00 | Agent spawn/check-in |
| 1-4 | 21:00 | Review & feedback |
| 5 | 14:00 | Integration start |
| 6 | 14:00 | System testing |
| 7 | 10:00 | Final verification |
| 7 | 16:00 | Sign-off |

---

## Immediate Next Actions

Upon approval, Sudo Tech will:

1. Execute pre-spawn read-only checks
2. Spawn Sub-Agent Zeta (Backend Testing)
3. Spawn Sub-Agent Theta (Security Audit)
4. Spawn Sub-Agent Iota (Documentation)

**Ready to proceed?**

---

*Plan Version: 001.000*  
*Last Updated: 2026-03-16*  
*Status: Awaiting approval*
