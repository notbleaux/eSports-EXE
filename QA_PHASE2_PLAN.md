# QA Phase 2: Dynamic Testing [Ver002.300]
**Status**: EXECUTING
**Duration**: 45 minutes

---

## Phase 2-A: Frontend Test Execution

### Sub-Agent Delta
**Task**: Execute frontend test suite with coverage

**Commands**:
```bash
cd C:\Users\jacke\Documents\GitHub\eSports-EXE\apps\website-v2
npx vitest run src/components/TacticalView/__tests__/ --reporter=verbose 2>&1
```

**Expected Results**:
- types.test.ts: 15 tests pass
- useTacticalWebSocket.test.ts: 12 tests pass
- TacticalView.test.tsx: 14 tests pass
- performance.test.ts: 10 tests pass
- **Total: 51/51 tests pass**

**Success Criteria**:
- [ ] All tests pass
- [ ] No test timeouts
- [ ] Coverage reported

---

## Phase 2-B: Backend Test Execution

### Sub-Agent Epsilon
**Task**: Execute Python test suite

**Commands**:
```bash
cd C:\Users\jacke\Documents\GitHub\eSports-EXE\packages\shared

# Lifespan test
& "C:\Program Files\Python311\python.exe" test_api_lifespan.py 2>&1

# If pytest available
# & "C:\Program Files\Python311\python.exe" -m pytest tests/unit/ -v 2>&1
```

**Expected Results**:
- Lifespan tests: 6/6 pass
- API imports: Successful
- Health endpoints: Respond correctly

**Success Criteria**:
- [ ] Lifespan test passes
- [ ] No import errors
- [ ] Health check returns 200

---

## Phase 2-C: Build Verification

### Sub-Agent Zeta
**Task**: Verify frontend builds successfully

**Commands**:
```bash
cd C:\Users\jacke\Documents\GitHub\eSports-EXE\apps\website-v2
npm run build 2>&1
```

**Expected Results**:
- Build completes without errors
- No TypeScript errors during build
- Output in `dist/` directory

**Success Criteria**:
- [ ] Build succeeds
- [ ] 0 TypeScript errors
- [ ] Output files generated

---

## Parallel Execution

All three Sub-Agents execute simultaneously:
- Delta: Frontend tests (~15 min)
- Epsilon: Backend tests (~15 min)
- Zeta: Build verification (~15 min)

**Total Phase 2 Time**: 15 minutes (parallel)
