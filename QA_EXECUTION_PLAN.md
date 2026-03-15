# QA Execution Plan [Ver002.000]
**Option**: 2 (Full QA)
**Date**: 2026-03-15
**Duration**: 3 hours
**Status**: EXECUTING

---

## Phase 1: Static Analysis (30 min)
**Parallel Execution**: 3 Sub-Agents

### Sub-Agent Alpha: TypeScript Analysis
**Task**: Execute TypeScript strict check
**Command**: `cd apps/website-v2 && npx tsc --noEmit --strict`
**Target Files**:
- TacticalView.tsx
- useTacticalWebSocket.ts
- TacticalControls.tsx
- TimelineScrubber.tsx
- AgentSprite.tsx
- CanvasErrorBoundary.tsx
- types.ts
- All test files

**Success Criteria**:
- [ ] 0 type errors
- [ ] 0 implicit any
- [ ] All strict null checks pass

**Output**: Type check report with error count

---

### Sub-Agent Beta: Python Analysis
**Task**: Execute Python type and lint checks
**Commands**:
```bash
cd packages/shared
python -m mypy axiom_esports_data/api/main.py --ignore-missing-imports
python -m ruff check axiom_esports_data/api/
python -m py_compile axiom_esports_data/api/main.py
```

**Target Files**:
- main.py
- db_manager.py
- middleware/firewall.py
- All route files

**Success Criteria**:
- [ ] 0 mypy errors
- [ ] 0 ruff errors
- [ ] Clean Python syntax

**Output**: Python analysis report

---

### Sub-Agent Gamma: Configuration Validation
**Task**: Validate deployment configs
**Commands**:
```bash
cd infrastructure
python -c "import yaml; yaml.safe_load(open('render.yaml'))"

cd apps/website-v2
python -c "import json; json.load(open('vercel.json'))"
```

**Checks**:
- [ ] render.yaml valid YAML
- [ ] vercel.json valid JSON
- [ ] Environment variables defined
- [ ] Service dependencies correct

**Output**: Config validation report

---

## Phase 2: Dynamic Testing (45 min)
**Parallel Execution**: 3 Sub-Agents

### Sub-Agent Delta: Frontend Tests
**Task**: Execute frontend test suite with coverage
**Commands**:
```bash
cd apps/website-v2
npx vitest run src/components/TacticalView/__tests__/ --coverage
```

**Test Files**:
- types.test.ts
- useTacticalWebSocket.test.ts
- TacticalView.test.tsx
- performance.test.ts

**Success Criteria**:
- [ ] 51/51 TacticalView tests pass
- [ ] Coverage >80% statements
- [ ] Coverage >70% branches
- [ ] No test timeouts

**Output**: Test results with coverage report

---

### Sub-Agent Epsilon: Backend Tests
**Task**: Execute Python test suite
**Commands**:
```bash
cd packages/shared
python test_api_lifespan.py
pytest tests/unit/ -v --tb=short
pytest tests/integration/ -v --tb=short
```

**Test Files**:
- test_api_lifespan.py
- tests/unit/test_health.py
- tests/integration/test_auth.py
- tests/integration/test_tokens.py

**Success Criteria**:
- [ ] 6/6 lifespan tests pass
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Database connections work

**Output**: Backend test report

---

### Sub-Agent Zeta: YAML/JSON Validation
**Task**: Deep config validation
**Checks**:
- [ ] render.yaml has all required env vars
- [ ] vercel.json routes valid
- [ ] No missing required fields
- [ ] Port configurations correct

**Output**: Detailed config validation

---

## Phase 3: Manual Verification (45 min)
**Sequential Execution**: 2 Sub-Agents

### Sub-Agent Eta: API Manual Testing
**Task**: Manual API endpoint verification
**Steps**:

1. **Start API locally** (if not running):
   ```bash
   cd packages/shared/axiom_esports_data/api
   uvicorn main:app --reload --port 8000
   ```

2. **Health Endpoint Test**:
   ```bash
   curl -s http://localhost:8000/health | jq
   # Expected: {"status": "healthy", ...}
   ```

3. **Ready Endpoint Test**:
   ```bash
   curl -s http://localhost:8000/ready | jq
   # Expected: {"ready": true}
   ```

4. **Rate Limiting Test**:
   ```bash
   # Send 70 requests in 1 minute
   for i in {1..70}; do
     curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/health
   done | sort | uniq -c
   # Expected: ~60 x 200, ~10 x 429
   ```

5. **CORS Test**:
   ```bash
   curl -I -X OPTIONS http://localhost:8000/health \
     -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: GET"
   # Expected: 200 with Access-Control-Allow-Origin header
   ```

6. **Security Headers Test**:
   ```bash
   curl -I http://localhost:8000/health
   # Expected: X-Frame-Options, X-Content-Type-Options
   ```

**Success Criteria**:
- [ ] All endpoints respond correctly
- [ ] Rate limiting returns 429 after threshold
- [ ] CORS headers present
- [ ] Security headers present

**Output**: Manual test results

---

### Sub-Agent Theta: Component Manual Testing
**Task**: Manual component verification
**Steps**:

1. **Build Frontend**:
   ```bash
   cd apps/website-v2
   npm run build
   # Expected: No build errors
   ```

2. **Type Check**:
   ```bash
   npx tsc --noEmit
   # Expected: 0 errors
   ```

3. **Lint Check**:
   ```bash
   npx eslint src/components/TacticalView/ --ext .ts,.tsx
   # Expected: 0 errors, 0 warnings
   ```

**Success Criteria**:
- [ ] Build completes without errors
- [ ] Type check passes
- [ ] Lint check passes

**Output**: Component build report

---

## Phase 4: Security Verification (30 min)
**Parallel Execution**: 2 Sub-Agents

### Sub-Agent Iota: Security Headers Check
**Task**: Verify all security mechanisms
**Checks**:

1. **Firewall Middleware Active**:
   ```python
   # Check in main.py
   assert "FirewallMiddleware" in app.user_middleware
   ```

2. **Rate Limiter Active**:
   ```python
   # Check limiter applied
   assert hasattr(app.state, 'limiter')
   ```

3. **CORS Secure**:
   ```bash
   # Should not allow wildcard with credentials
   curl -s -H "Origin: https://evil.com" http://localhost:8000/health
   # Should not have Access-Control-Allow-Origin: *
   ```

4. **Security Headers Present**:
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin

**Output**: Security verification report

---

### Sub-Agent Kappa: Data Partition Check
**Task**: Verify firewall filters game-only fields
**Checks**:

1. **GAME_ONLY_FIELDS not in API responses**:
   ```python
   GAME_ONLY_FIELDS = [
       'internalAgentState',
       'radarData',
       'detailedReplayFrameData',
       # ... etc
   ]
   # Check these are filtered
   ```

2. **Response validation**:
   ```bash
   # Any endpoint returning match data
   curl -s http://localhost:8000/v1/matches/123 | jq
   # Verify no game-only fields present
   ```

**Output**: Data partition verification

---

## Phase 5: Final Verification & Sign Off (20 min)
**Executed by Me**

### Compile All Reports
1. Collect all Sub-Agent outputs
2. Create summary dashboard
3. Identify any blocking issues
4. Fix any quick issues (if any)

### QA Exit Checklist
- [ ] TypeScript: 0 errors
- [ ] Python: 0 errors
- [ ] Tests: 57/57 passing
- [ ] Coverage: >80%
- [ ] Health endpoints: 200 OK
- [ ] Rate limiting: Working
- [ ] CORS: Secure
- [ ] Security headers: Present
- [ ] Build: Successful
- [ ] Firewall: Active

### Week 1 Sign Off
**If all checks pass**:
- ✅ Week 1 APPROVED FOR PRODUCTION
- ✅ Ready for Week 2 Circuit Breaker
- ✅ Deployment ready

**If issues found**:
- Document issues
- Create fix plan
- Execute fixes
- Re-run affected QA phases

---

## Timeline

| Time | Phase | Sub-Agents | Activity |
|------|-------|-----------|----------|
| 0:00-0:30 | 1 | Alpha, Beta, Gamma | Static analysis |
| 0:30-1:15 | 2 | Delta, Epsilon, Zeta | Dynamic testing |
| 1:15-2:00 | 3 | Eta, Theta | Manual verification |
| 2:00-2:30 | 4 | Iota, Kappa | Security verification |
| 2:30-2:50 | 5 | Me | Compile & sign off |
| 2:50-3:00 | - | Me | Buffer for fixes |

**Total**: 3 hours

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Type Errors | 0 | tsc --noEmit |
| Python Errors | 0 | mypy + ruff |
| Test Pass Rate | 100% | pytest + vitest |
| Code Coverage | >80% | coverage report |
| Health Check | 200 OK | curl |
| Rate Limiting | 429 returned | Load test |
| Security Headers | Present | curl -I |

---

## Contingency Plans

### If TypeScript Errors Found
- Priority: HIGH
- Action: Fix immediately, re-run TypeScript check
- Time: +15 min per error

### If Tests Fail
- Priority: HIGH
- Action: Debug, fix, re-run tests
- Time: +30 min per failure

### If Manual Tests Fail
- Priority: CRITICAL
- Action: Fix before proceeding
- Time: Variable

### If Security Issues Found
- Priority: CRITICAL
- Action: Fix immediately
- Time: +30 min per issue

---

## Next Steps After QA

If QA PASSES:
1. Week 1 Sign Off
2. Deploy Sub-Agents for Week 2 Circuit Breaker
3. Execute Week 2 Day 1

If QA FAILS:
1. Create fix tickets
2. Execute fixes
3. Re-run failed QA phases
4. Re-assess timeline

---

**Status**: READY TO EXECUTE
**Next Action**: Deploy Phase 1 Sub-Agents (Alpha, Beta, Gamma)
