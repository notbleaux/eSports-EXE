# Comprehensive Code Review Report [Ver001.000]
**Date**: 2026-03-15
**Scope**: Week 1 Tasks (TacticalView + API Deployment)

---

## Executive Summary

| Category | Total | Critical (5) | Complex (4) | Advanced (3) | Standard (2) | Simple (1) |
|----------|-------|--------------|-------------|--------------|--------------|------------|
| **Frontend** | 37 | 4 | 5 | 6 | 5 | 3 |
| **Backend** | 12 | 3 | 2 | 3 | 2 | 2 |
| **Testing** | 14 | 1 | 2 | 4 | 4 | 3 |
| **Documentation** | 12 | 0 | 2 | 3 | 4 | 3 |
| **Code Quality** | 10 | 0 | 1 | 2 | 4 | 3 |
| **TOTAL** | **85** | **8** | **12** | **18** | **19** | **14** |

**Overall Status**: Requires fixes before production deployment

---

## Critical Issues (Grade 5) - MUST FIX

### 1. [TacticalView.test.tsx:53] ReferenceError: nglobal is not defined
**File**: `apps/website-v2/src/components/TacticalView/__tests__/TacticalView.test.tsx`
**Problem**: Typo `nglobal.cancelAnimationFrame` breaks entire test suite
**Fix**: Change to `global.cancelAnimationFrame`
**Impact**: Tests will fail in CI

### 2. [useTacticalWebSocket.ts] Stale Closure Bug in Reconnection
**File**: `apps/website-v2/src/components/TacticalView/useTacticalWebSocket.ts`
**Problem**: `state.reconnectAttempts` in closure uses initial value (0), causing infinite loops
**Fix**: Use ref pattern for mutable state in closures
**Impact**: WebSocket never reconnects or loops infinitely

### 3. [TacticalView.tsx] Missing Error Boundary for Canvas
**File**: `apps/website-v2/src/components/TacticalView/TacticalView.tsx`
**Problem**: Canvas errors crash entire React tree
**Fix**: Wrap in ErrorBoundary with fallback UI
**Impact**: Complete component failure on canvas errors

### 4. [TacticalView.tsx] No Canvas Context Loss Handling
**File**: `apps/website-v2/src/components/TacticalView/TacticalView.tsx`
**Problem**: GPU context loss causes permanent black screen
**Fix**: Add `webglcontextlost`/`webglcontextrestored` listeners
**Impact**: Requires page refresh to recover

### 5. [main.py] Rate Limiters Not Applied
**File**: `packages/shared/axiom_esports_data/api/main.py`
**Problem**: `limiter` and `auth_limiter` initialized but never registered with app
**Fix**: Add `limiter.init_app(app)` and apply `@limiter.limit()` decorators
**Impact**: No rate limiting on API endpoints

### 6. [main.py] Firewall Middleware Not Registered
**File**: `packages/shared/axiom_esports_data/api/main.py`
**Problem**: `FirewallMiddleware` exists but not added to app
**Fix**: Add `app.add_middleware(FirewallMiddleware)` after CORS
**Impact**: Data partition firewall not protecting endpoints

### 7. [db_manager.py] Database Init State Bug
**File**: `packages/shared/axiom_esports_data/api/src/db_manager.py`
**Problem**: On init failure, `_initialized=True` with `pool=None`, causing silent failures
**Fix**: Reset `_initialized=False` before raising exception
**Impact**: Health checks pass but DB is unusable

### 8. [render.yaml] CRITICAL PATH MISMATCH
**File**: `infrastructure/render.yaml`
**Problem**: Build uses `axiom-esports-data` (hyphens) but directory is `axiom_esports_data` (underscores)
**Fix**: Change line 11 to use underscores: `axiom_esports_data`
**Impact**: Deployment will fail completely

---

## Complex Issues (Grade 4) - SHOULD FIX

### 9. [useTacticalWebSocket.ts] Excessive Dependency Array
8 dependencies cause frequent callback recreation

### 10. [TacticalView.tsx] Non-Deterministic Draw Callback
`Date.now()` in draw breaks memoization contract

### 11. [TimelineScrubber.tsx] Missing Keyboard Navigation
No accessibility support (Arrow keys, Home, End)

### 12. [TacticalControls.tsx] Missing ARIA States
Toggle buttons lack `aria-pressed` attributes

### 13. [AgentSprite.tsx] Missing Accessibility
No `aria-label`, `role`, or keyboard support

### 14. [main.py] CORS Security Risk
`allow_credentials=True` + `allow_headers=["*"]` is vulnerability

### 15. [main.py] DB Pool Exhaustion Risk
Readiness check consumes connection from limited pool

### 16. [useTacticalWebSocket.test.ts] Incomplete Message Verification
Tests have placeholder comments instead of actual assertions

### 17. [useTacticalWebSocket.test.ts] Unreachable Reconnection Test
Cannot trigger reconnection logic in current mock setup

### 18. [types.test.ts] Local Type Guards
Testing local implementations, not exported code

### 19. [AGENTS.md vs Code] Version Header Inconsistency
Code uses `/** [Ver001.000] */` but docs use `[Ver001.000]` standalone

### 20. [Documentation] Duplicate Deployment Guides
`DEPLOYMENT_GUIDE.md` and `docs/DEPLOYMENT_GUIDE.md` diverge

---

## Advanced Issues (Grade 3) - RECOMMENDED

21. AgentSprite.tsx: No Reduced Motion Support
22. TacticalControls.tsx: CSS-in-JS Performance Issues
23. useTacticalWebSocket.ts: Incorrect Timer Type (NodeJS.Timeout)
24. useTacticalWebSocket.ts: No Message Validation (Zod/io-ts)
25. useTacticalWebSocket.ts: No Message Queue for Offline Actions
26. TacticalView.tsx: Canvas Context Error Handling
27. db_manager.py: SQL Injection Risk in Dynamic Queries
28. firewall.py: Response Body Double-Read Risk
29. performance.test.ts: Tests Mock Operations, Not Real Performance
30. TacticalView.test.tsx: Weak Assertions (don't verify actual behavior)
31. test_health.py: Defensive Import Pattern Masks Issues
32. test_api_lifespan.py: Uses print() instead of logging
33. DEPLOYMENT_GUIDE.md: Version Header Format Inconsistent
34. Python Files: Missing Version Headers
35. Root Documentation: Missing Version Headers
36. docs/ Directory: Inconsistent Version Headers
37. TacticalView.tsx: Missing Unmount Cleanup
38. AgentSprite.tsx: Agent Initials Logic Bug ("KAY/O" → "KA")

---

## Standard Issues (Grade 2) - NICE TO HAVE

39. TacticalView.test.tsx: Conditional Test Execution (if timeline)
40. useTacticalWebSocket.test.ts: Comment-Only Heartbeat Test
41. TacticalView.test.tsx: Missing Canvas Mock Assertions
42. conftest.py: No Test Database URL Fallback
43. render.yaml: Missing Resource Limits
44. main.py: Missing Request Body Size Limit
45. TimelineScrubber.tsx: Missing Drag Support
46. db_manager.py: Magic Number for Backoff (0.5)
47. AGENTS.md: VS Code Settings Conflict (relative vs absolute imports)
48. main.py: Duplicate Health Check Logic
49. TacticalControls.tsx: Unused Import (EyeOff)
50. TacticalView.tsx: Unused Imports (AgentSprite, AGENT_ROLE_COLORS)
51. TimelineScrubber.tsx: Unused Index Parameter
52. TacticalViewDemo.tsx: console.log in callbacks (4 instances)
53. useTacticalWebSocket.ts: console.log statements (7 instances)
54. package.json: Missing Test Dependencies at Root
55. vitest.config.js: Missing Type-Aware Testing
56. CI Workflow: Path Issues

---

## Simple Issues (Grade 1) - POLISH

57. README.md: Missing Error Handling Documentation
58. types.test.ts: Missing Runtime Validation Tests
59. AgentSprite.tsx: Missing Type Exports
60. render.yaml: PANDASCORE_API_KEY Configuration Guidance
61. main.py: Trailing Whitespace
62. test_api_lifespan.py: Version Header Format
63. db_manager.py: Input Validation for Env Vars
64. DEPLOYMENT_GUIDE.md: EOF Newline
65. render.yaml: YAML String Quoting Inconsistency
66. main.py: Docstring Grammar Improvements
67. main.py: Inconsistent Docstring Spacing
68. TacticalView Code: Minor JSDoc Gaps

---

## Top 10 Priority Fixes

1. **Fix render.yaml path mismatch** (Critical - breaks deployment)
2. **Fix nglobal typo** (Critical - breaks tests)
3. **Fix stale closure in useTacticalWebSocket** (Critical - broken reconnection)
4. **Register rate limiters** (Critical - no rate limiting)
5. **Register firewall middleware** (Critical - no data protection)
6. **Fix db_manager init state bug** (Critical - silent failures)
7. **Add canvas error boundaries** (Critical - crash on errors)
8. **Add canvas context loss handling** (Critical - unrecoverable failures)
9. **Add keyboard navigation** (Complex - accessibility)
10. **Fix CORS security** (Complex - security vulnerability)

---

## Sub-Agent Task Assignments

### Fix Batch 1: Critical Issues (Sub-Agent Alpha)
- Fix render.yaml path mismatch
- Fix nglobal typo in test file
- Fix db_manager.py init state bug

### Fix Batch 2: WebSocket & Canvas (Sub-Agent Beta)
- Fix stale closure in useTacticalWebSocket
- Add canvas error boundary
- Add canvas context loss handling

### Fix Batch 3: Security & Middleware (Sub-Agent Gamma)
- Register rate limiters in main.py
- Register firewall middleware
- Fix CORS configuration

### Fix Batch 4: Testing & Documentation (Sub-Agent Delta)
- Complete WebSocket test assertions
- Fix version headers across files
- Remove console.log statements

### Fix Batch 5: Accessibility & Polish (Sub-Agent Epsilon)
- Add ARIA labels and keyboard navigation
- Add reduced motion support
- Clean up unused imports

---

## Verification Checklist

- [ ] All Grade 5 issues fixed
- [ ] All Grade 4 issues fixed or documented
- [ ] Tests pass (npm test, pytest)
- [ ] TypeScript strict mode passes
- [ ] Deployment config validated
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Accessibility audit passed
