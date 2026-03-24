# Enhanced Master Work Plan

[Ver002.000]

**Date**: 2026-03-23  
**Authority**: Foreman / SATUR  
**Scope**: Comprehensive fixes for all Phases 1-3 issues  
**Duration**: 60 hours over 3 weeks  
**Status**: READY FOR EXECUTION

---

## Strategic Overview

This work plan integrates findings from:
- Phase 1-3 Verification Report
- Comprehensive Repository CRIT Report
- 10 Strategic Recommendations

### Work Waves

```
WAVE 1: Critical Fixes (P0)        → 20 hours  → Days 1-5
WAVE 2: Quality Hardening (P1)     → 24 hours  → Days 6-12
WAVE 3: Automation & Polish (P2)   → 16 hours  → Days 13-18
WAVE 4: Verification & Release     → 8 hours   → Days 19-21
```

---

## Wave 1: Critical Fixes (P0) - 20 Hours

### Objective
Resolve all production-blocking issues.

### Wave 1.1: HubRegistry & Heroes (8 hours)

#### Agent: FIX-W1-001 (HubRegistry Repair)
**Task**: Fix broken import paths in HubRegistry.ts
**Duration**: 2 hours
**Files**: `src/hubs/HubRegistry.ts`

```typescript
// BEFORE (BROKEN)
const SATORHub = lazy(() => import('../components/SATOR/SATORHub'))

// AFTER (FIXED)
const SATORHub = lazy(() => import('../hub-1-sator/index.jsx'))
```

**Deliverables**:
- [ ] Updated import paths (5 hubs)
- [ ] TypeScript errors fixed
- [ ] Hub navigation tested
- [ ] Unit tests updated

---

#### Agent: FIX-W1-002 (Heroes Implementation)
**Task**: Create missing heroes/ component directory
**Duration**: 6 hours
**Files**: `src/components/heroes/*`

**Components to Create**:
1. **Hero.tsx** (2h)
   - Main hero section
   - Props: title, subtitle, mascot, background, cta
   - Responsive design

2. **HeroMascot.tsx** (2h)
   - Mascot integration
   - Animation support (idle, wave, celebrate)
   - Position variants (left, right, center)

3. **HeroSection.tsx** (1.5h)
   - Layout wrapper
   - Full-height option
   - Background variants

4. **index.ts** (0.5h)
   - Barrel exports

**Deliverables**:
- [ ] All 3 hero components
- [ ] TypeScript types
- [ ] Unit tests (3-5 per component)
- [ ] Storybook stories

---

### Wave 1.2: TypeScript Error Resolution (12 hours)

#### Agent: FIX-W1-003 (TypeScript Sweep)
**Task**: Fix all 43 TypeScript errors
**Duration**: 8 hours
**Files**: 16 affected files

**Error Distribution**:
| File | Errors | Type |
|------|--------|------|
| HubRegistry.ts | 5 | Import/path |
| useCognitiveLoad.ts | 4 | Hook types |
| useMobileScreenReader.ts | 3 | Hook types |
| CollapsibleNav.tsx | 4 | Component |
| ResponsiveContainer.tsx | 3 | Component |
| Mobile*.tsx | 7 | Mobile components |
| lib/mobile/*.ts | 9 | Mobile library |
| Others | 8 | Various |

**Approach**:
1. Run `npx tsc --noEmit` to capture all errors
2. Fix by category (imports → hooks → components)
3. Verify after each batch

**Deliverables**:
- [ ] Zero TypeScript errors
- [ ] Type check passes
- [ ] No new warnings

---

#### Agent: FIX-W1-004 (Error Handling Hardening)
**Task**: Fix empty catch blocks and console errors
**Duration**: 4 hours
**Files**: Various

**Tasks**:
1. Fix povSwitcher.ts empty catches (0.5h)
2. Replace console.error in error boundaries (2h)
3. Add error logging infrastructure (1.5h)

**Deliverables**:
- [ ] No empty catch blocks
- [ ] Structured error logging
- [ ] Error boundary tests

---

## Wave 2: Quality Hardening (P1) - 24 Hours

### Objective
Implement type safety, accessibility, and TODO resolution.

### Wave 2.1: Type Safety (8 hours)

#### Agent: FIX-W2-001 (Type Hardening)
**Task**: Remove `any` types from production code
**Duration**: 4 hours
**Files**: 23 occurrences

**Priority Order**:
1. PredictionPanel.tsx - return type
2. pushNotifications.ts - Uint8Array conversions
3. CameraControls.tsx - ref methods
4. Error boundaries - error types

**Deliverables**:
- [ ] Zero `any` in production
- [ ] Proper type guards
- [ ] Type coverage >95%

---

#### Agent: FIX-W2-002 (Hook & Component Fixes)
**Task**: Fix react-hooks/exhaustive-deps and @ts-expect-error
**Duration**: 4 hours
**Files**: 6 files

**Tasks**:
1. Fix useContextDetection.ts (1h)
2. Fix useRecommendations.ts (1h)
3. Fix useWebSocket.ts (1h)
4. Remove @ts-expect-error from production (1h)

**Deliverables**:
- [ ] No eslint-disable for hooks
- [ ] No @ts-expect-error in prod
- [ ] All dependencies declared

---

### Wave 2.2: Accessibility Library (10 hours)

#### Agent: FIX-W2-003 (A11y Library Implementation)
**Task**: Create comprehensive accessibility library
**Duration**: 10 hours
**Files**: `src/lib/accessibility/*`

**Components**:
1. **A11yProvider.tsx** (2h) - React Context provider
2. **useA11y.ts** (1.5h) - Main accessibility hook
3. **useScreenReader.ts** (1.5h) - Screen reader integration
4. **useKeyboardNav.ts** (1.5h) - Keyboard navigation
5. **useFocusTrap.ts** (1.5h) - Focus management
6. **useAnnounce.ts** (1h) - Live region announcements
7. **types.ts** (0.5h) - TypeScript types
8. **Tests** (1.5h) - Unit tests

**Deliverables**:
- [ ] Full A11y library (8 files)
- [ ] WCAG 2.1 AA compliance
- [ ] Unit tests (8+ tests)
- [ ] Documentation

---

### Wave 2.3: TODO Implementation (6 hours)

#### Agent: FIX-W2-004 (TODO Triage & Implementation)
**Task**: Address 15 active TODO comments
**Duration**: 6 hours

**TODO Distribution**:
| Priority | File | TODOs | Action |
|----------|------|-------|--------|
| HIGH | useExpertise.ts | 5 | Implement API integrations |
| MEDIUM | IngestionDashboard.tsx | 3 | Implement handlers |
| MEDIUM | ShareReplay.tsx | 3 | Connect APIs |
| MEDIUM | TacticalView.tsx | 3 | Complete rendering |
| LOW | Others | 1 each | Create GitHub issues |

**Deliverables**:
- [ ] Critical TODOs implemented
- [ ] Remaining TODOs ticketed
- [ ] Technical debt reduced

---

## Wave 3: Automation & Polish (P2) - 16 Hours

### Objective
Consolidate configs, add automation, expand testing.

### Wave 3.1: Configuration Consolidation (6 hours)

#### Agent: FIX-W3-001 (ESLint & Config Cleanup)
**Task**: Consolidate ESLint and improve tooling
**Duration**: 4 hours

**Tasks**:
1. Merge .eslintrc.cjs into eslint.config.js (1.5h)
2. Update pre-commit hooks (1h)
3. Add Prettier to CI (1h)
4. Configure Dependabot (0.5h)

**Deliverables**:
- [ ] Single ESLint config
- [ ] Pre-commit quality gates
- [ ] Automated dependency updates

---

#### Agent: FIX-W3-002 (Dependency Upgrade)
**Task**: Upgrade core dependencies
**Duration**: 6 hours

**Upgrades**:
| Package | From | To | Effort |
|---------|------|-----|--------|
| React | 18.2.0 | 19.0.0 | 2h |
| Vite | 5.4.21 | 6.2.0 | 1h |
| Three.js | 0.158 | 0.174 | 2h |
| Framer Motion | 10.16 | 12.5 | 1h |

**Deliverables**:
- [ ] Updated dependencies
- [ ] Compatibility verified
- [ ] Tests pass

---

### Wave 3.2: Testing Expansion (8 hours)

#### Agent: FIX-W3-003 (Test Coverage Expansion)
**Task**: Add tests for uncovered areas
**Duration**: 6 hours

**Coverage Targets**:
| Area | Tests to Add |
|------|--------------|
| Godot Simulation | 10 tests |
| WebGL/Shaders | 15 tests |
| UI Components | 20 tests |
| API Integration | 10 tests |

**Deliverables**:
- [ ] 55+ new tests
- [ ] Coverage reporting
- [ ] CI integration

---

#### Agent: FIX-W3-004 (E2E Test Consolidation)
**Task**: Consolidate duplicate E2E tests
**Duration**: 2 hours

**Tasks**:
1. Merge tests/e2e/ into e2e/ (1h)
2. Remove duplicates (0.5h)
3. Update CI paths (0.5h)

**Deliverables**:
- [ ] Single E2E location
- [ ] No duplicates
- [ ] CI updated

---

## Wave 4: Verification & Release (P0) - 8 Hours

### Objective
Verify all fixes and prepare for production.

### Wave 4.1: Comprehensive Verification (6 hours)

#### Agent: VERIFY-FINAL-001 (Full Test Suite)
**Task**: Run complete test suite
**Duration**: 2 hours

**Commands**:
```bash
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```

**Deliverables**:
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Tests: 100% pass
- [ ] Build: Success

---

#### Agent: VERIFY-FINAL-002 (Integration Testing)
**Task**: Integration and E2E testing
**Duration**: 2 hours

**Tests**:
- [ ] Hub navigation flows
- [ ] Hero component rendering
- [ ] Accessibility features
- [ ] Error handling scenarios

---

#### Agent: VERIFY-FINAL-003 (Security Audit)
**Task**: Security verification
**Duration**: 2 hours

**Tasks**:
- [ ] npm audit
- [ ] Security headers check
- [ ] CSP configuration
- [ ] Rate limiting test

---

### Wave 4.2: Documentation & Release (2 hours)

#### Agent: VERIFY-FINAL-004 (Documentation Update)
**Task**: Update all documentation
**Duration**: 1 hour

**Updates**:
- [ ] CHANGELOG.md
- [ ] Version bump
- [ ] Release notes

---

#### Agent: VERIFY-FINAL-005 (Final Sign-off)
**Task**: Foreman final review
**Duration**: 1 hour

**Checklist**:
- [ ] All P0 issues resolved
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Ready for Phase 4

---

## Agent Spawn Matrix

| Wave | Agent ID | Task | Duration | Priority |
|------|----------|------|----------|----------|
| 1.1 | FIX-W1-001 | HubRegistry fix | 2h | P0 |
| 1.1 | FIX-W1-002 | Heroes components | 6h | P0 |
| 1.2 | FIX-W1-003 | TypeScript errors | 8h | P0 |
| 1.2 | FIX-W1-004 | Error handling | 4h | P0 |
| 2.1 | FIX-W2-001 | Type hardening | 4h | P1 |
| 2.1 | FIX-W2-002 | Hook fixes | 4h | P1 |
| 2.2 | FIX-W2-003 | A11y library | 10h | P1 |
| 2.3 | FIX-W2-004 | TODO implementation | 6h | P1 |
| 3.1 | FIX-W3-001 | Config cleanup | 4h | P2 |
| 3.1 | FIX-W3-002 | Dependency upgrade | 6h | P2 |
| 3.2 | FIX-W3-003 | Test expansion | 6h | P2 |
| 3.2 | FIX-W3-004 | E2E consolidation | 2h | P2 |
| 4.1 | VERIFY-FINAL-001 | Test suite | 2h | P0 |
| 4.1 | VERIFY-FINAL-002 | Integration | 2h | P0 |
| 4.1 | VERIFY-FINAL-003 | Security | 2h | P0 |
| 4.2 | VERIFY-FINAL-004 | Documentation | 1h | P0 |
| 4.2 | VERIFY-FINAL-005 | Sign-off | 1h | P0 |

**Total Agents**: 17  
**Total Duration**: 68 hours (parallelized: ~3 weeks)

---

## Success Criteria

### Wave 1 Success
- [ ] Hub navigation works
- [ ] Heroes render correctly
- [ ] TypeScript builds clean
- [ ] No runtime errors

### Wave 2 Success
- [ ] Zero `any` types
- [ ] A11y library functional
- [ ] TODOs implemented/ticketed
- [ ] Error handling robust

### Wave 3 Success
- [ ] Single ESLint config
- [ ] Dependencies updated
- [ ] Test coverage improved
- [ ] E2E consolidated

### Wave 4 Success
- [ ] All tests pass
- [ ] Security audit clean
- [ ] Documentation updated
- [ ] Production ready

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| React 19 breaking changes | Staged rollout with feature flags |
| Type fixes reveal bugs | Incremental fixes with tests |
| TODO delays | Prioritize critical path |
| Agent coordination | Daily standups, shared channels |

---

## Communication Plan

| Frequency | Activity | Participants |
|-----------|----------|--------------|
| Daily | Standup reports | All agents |
| Mid-wave | Blocker review | TLs + Foreman |
| Wave end | Demo & sign-off | All stakeholders |
| Final | Release approval | Foreman |

---

*Plan Version: 002.000*  
*Created: 2026-03-23*  
*Ready for execution*
