[Ver004.000]

# TODO — Libre-X-eSport 4NJZ4 TENET Platform

**Last Updated:** 2026-03-22  
**Status:** 🚧 PHASE 3-2: IMPLEMENTATION (Update & Edit Pass)  
**Next Milestone:** Performance Architecture (60fps grid, PWA, virtual scrolling)

---

## 📋 Executive Summary

The Libre-X-eSport 4NJZ4 TENET Platform is at a **critical transition point** between Phase 1 completion and Phase 2 execution.

| Metric | Status |
|--------|--------|
| **Phase 1 (Foundation)** | ✅ COMPLETE |
| **Phase 0 (Restructure)** | ✅ COMPLETE |
| **Critical Blockers** | 🔴 IN PROGRESS |
| **Phase 2 Readiness** | 🟡 Ready after blockers |

**Dual-Track Framework:**
- **Track A:** AI Governance (6-8 weeks) — Agent coordination, documentation
- **Track B:** Technical Implementation (20+ weeks) — Performance, simulation, ML

---

## 🔴 CRITICAL BLOCKERS — RESOLVE FIRST (Week 0)

**Must complete before any Phase 2 work. Estimated effort: 15 hours (2-3 days)**

### Testing Framework Setup
- [ ] **Install Testing Dependencies**
  - [ ] Verify Vitest is installed: `npm list vitest`
  - [ ] Verify testing libraries: `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
  - **Effort:** 30m | **Owner:** Frontend Lead

- [ ] **Create Vitest Configuration**
  - [ ] Create `apps/website-v2/vitest.config.js`
  - [ ] Configure React plugin, jsdom environment
  - [ ] Setup coverage reporting
  - **Effort:** 1h | **Owner:** Frontend Lead
  - **File:** `apps/website-v2/vitest.config.js`

- [ ] **Create Test Setup File**
  - [ ] Create `apps/website-v2/src/test/setup.js`
  - [ ] Configure testing-library/jest-dom imports
  - [ ] Setup global test utilities
  - **Effort:** 30m | **Owner:** Frontend Lead
  - **File:** `apps/website-v2/src/test/setup.js`

- [ ] **Verify Test Execution**
  - [ ] Run `npm run test` — should execute without error
  - [ ] Run `npm run test:coverage` — should generate report
  - **Effort:** 15m | **Owner:** Frontend Lead

### ESLint Configuration
- [ ] **Verify ESLint Dependencies**
  - [ ] Check `eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks` installed
  - [ ] Verify `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` installed
  - **Effort:** 15m | **Owner:** Frontend Lead

- [ ] **Create/Update ESLint Config**
  - [ ] Create `apps/website-v2/.eslintrc.cjs` or verify `eslint.config.js`
  - [ ] Configure React hooks rules
  - [ ] Configure TypeScript parser
  - **Effort:** 1h | **Owner:** Frontend Lead
  - **File:** `apps/website-v2/.eslintrc.cjs`

- [ ] **Verify Lint Execution**
  - [ ] Run `npm run lint` — should execute without error
  - [ ] Fix any existing lint errors
  - **Effort:** 30m | **Owner:** Frontend Lead

### Cleanup & Dependencies
- [ ] **Remove Duplicate Database File**
  - [ ] Delete `packages/shared/axiom-esports-data/api/src/db_implemented.py`
  - [ ] Verify build still succeeds
  - **Effort:** 5m | **Owner:** Backend Lead

- [ ] **Install Phase 2 Dependencies**
  - [ ] Verify `@tanstack/react-virtual` installed
  - [ ] Verify `scheduler` installed
  - **Effort:** 5m | **Owner:** Frontend Lead

- [ ] **Final Verification**
  - [ ] `npm run build` succeeds
  - [ ] `npm run test` executes
  - [ ] `npm run lint` passes
  - **Effort:** 15m | **Owner:** Frontend Lead

---

## ✅ Phase 1: Foundation (COMPLETE)

All Phase 1 deliverables are complete and verified.

### Frontend Components (Complete)
| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| DraggablePanel (optimized) | `apps/website-v2/src/components/grid/` | ✅ | React.memo, useCallback, useMemo |
| PanelSkeleton | `apps/website-v2/src/components/grid/` | ✅ | Shimmer loading, a11y |
| PanelErrorBoundary | `apps/website-v2/src/components/grid/` | ✅ | Per-panel isolation, retry |
| QuaternaryGrid (optimized) | `apps/website-v2/src/components/` | ✅ | Individual Zustand selectors |

### Backend Components (Complete)
| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| DB Layer (db.py) | `packages/shared/axiom-esports-data/api/src/` | ✅ | 11 query functions, asyncpg |
| Build verification | `apps/website-v2/dist/` | ✅ | 5.52s build, 6 chunks |

### Performance Improvements Achieved
- ✅ Estimated FPS improvement: +22% (~45fps → ~55fps)
- ✅ Re-render prevention: 7-field comparison in React.memo
- ✅ Store subscription: Granular selectors
- ✅ Event handler stability: useCallback wrappers

---

## 🚧 Phase 2: Performance Architecture (IN PROGRESS)

**Timeline:** Weeks 1-2 (12 days)  
**Goal:** 60fps grid, PWA capabilities, virtual scrolling, <300KB bundle  
**Starts After:** Critical blockers resolved

### Week 1: Core Performance (40 hours)

#### Day 1-2: Web Worker Canvas System
- [ ] **Worker Setup**
  - [ ] Create `apps/website-v2/src/workers/grid.worker.ts`
  - [ ] Implement OffscreenCanvas message handling
  - [ ] Add TypeScript types for worker messages
  - **Effort:** 8h | **Owner:** Frontend Lead

- [ ] **Canvas Rendering**
  - [ ] Implement OffscreenCanvas rendering
  - [ ] Create hybrid DOM/Canvas mode
  - [ ] Add feature detection for OffscreenCanvas
  - **Effort:** 8h | **Owner:** Frontend Lead

#### Day 3: Virtual Scrolling
- [ ] **TanStack Virtual Integration**
  - [ ] Create `VirtualGrid.tsx` component
  - [ ] Implement row/column virtualization
  - [ ] Add overscan configuration
  - **Effort:** 8h | **Owner:** Frontend Lead
  - **File:** `apps/website-v2/src/components/grid/VirtualGrid.tsx`

#### Day 4: State Management Optimization
- [ ] **Store Splitting**
  - [ ] Split Zustand store: Static/Dynamic/Ephemeral
  - [ ] Implement state synchronization
  - [ ] Add selective persistence
  - **Effort:** 6h | **Owner:** Frontend Lead

#### Day 5: Integration & Testing
- [ ] **Hybrid Mode Integration**
  - [ ] Combine DOM and Canvas rendering
  - [ ] Implement automatic fallback
  - [ ] Add performance monitoring
  - **Effort:** 6h | **Owner:** Frontend Lead

- [ ] **Week 1 Verification**
  - [ ] FPS benchmark: target 60fps with 50 panels
  - [ ] Memory usage: <150MB for 50 panels
  - [ ] Cross-browser compatibility check
  - **Effort:** 4h | **Owner:** QA Engineer

### Week 2: PWA & Polish (34 hours)

#### Day 1: Service Worker
- [ ] **PWA Foundation**
  - [ ] Create `apps/website-v2/src/service-worker.ts`
  - [ ] Implement offline capability
  - [ ] Add cache strategies (Cache First, Network First)
  - **Effort:** 8h | **Owner:** Frontend Lead

#### Day 2: Code Splitting
- [ ] **Route-Based Lazy Loading**
  - [ ] Implement React.lazy for routes
  - [ ] Add Suspense boundaries
  - [ ] Create loading fallbacks
  - **Effort:** 6h | **Owner:** Frontend Lead

#### Day 3: Bundle Optimization
- [ ] **Size Reduction**
  - [ ] Analyze bundle with webpack-bundle-analyzer
  - [ ] Target: <300KB initial bundle
  - [ ] Split Three.js into separate chunk
  - **Effort:** 6h | **Owner:** Frontend Lead

#### Day 4: Testing & Coverage
- [ ] **Test Suite**
  - [ ] Write unit tests for grid components (>80% coverage)
  - [ ] Write integration tests for virtual scrolling
  - [ ] Add performance benchmarks
  - **Effort:** 6h | **Owner:** QA Engineer

#### Day 5: Documentation
- [ ] **Documentation Updates**
  - [ ] Update API documentation
  - [ ] Create performance runbook
  - [ ] Document PWA features
  - **Effort:** 8h | **Owner:** Tech Writer + Frontend Lead

### Phase 2 Success Criteria

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Grid FPS | ~45 | 60 | Chrome DevTools |
| Panel Capacity | ~20 | 50 | UI test |
| Bundle Size | ~530KB | <300KB | webpack-analyzer |
| Test Coverage | 0% | >80% | Vitest coverage |
| Lighthouse | ~75 | >90 | Lighthouse CI |
| Memory (50 panels) | ~250MB | <150MB | Chrome Memory |

---

## 📅 Phase 3: Advanced Features (PLANNED)

**Timeline:** Weeks 3-8 (6 weeks)  
**Status:** Planning phase — details TBD

### Week 3-4: ML Integration
- [ ] **TensorFlow.js Integration**
  - [ ] Implement SimRating prediction model
  - [ ] Add real-time inference
  - [ ] Create model versioning system

- [ ] **Analytics Dashboard**
  - [ ] Advanced filtering capabilities
  - [ ] Custom metric calculations
  - [ ] Export functionality

### Week 5-6: Simulation Enhancements
- [ ] **ROTAS Simulation Improvements**
  - [ ] Enhanced tactical scenarios
  - [ ] Replay analysis tools
  - [ ] Visualization improvements

### Week 7-8: Platform Expansion
- [ ] **CS2 Support**
  - [ ] Data model extensions
  - [ ] CS2-specific metrics
  - [ ] Cross-game analytics

---

## 🤖 Track A: AI Governance (PARALLEL)

**Duration:** 6-8 weeks  
**Runs parallel to Track B**  
**Focus:** Agent coordination, documentation, code organization

### Week 0: Foundation (with Phase 2 blockers)
- [ ] **Agent Registry Setup**
  - [ ] Create `.agents/registry/sator-frontend-001.json`
  - [ ] Validate against schema
  - [ ] Document registry structure
  - **Effort:** 4h | **Owner:** AI Coordinator

### Week 1: Governance Implementation
- [ ] **Lock System**
  - [ ] Create `acquire-lock.js` utility
  - [ ] Create `release-lock.js` utility
  - [ ] Add lock timeout handling
  - **Effort:** 4h | **Owner:** AI Coordinator

- [ ] **Quality Gates**
  - [ ] Configure pre-commit hooks
  - [ ] Add automated checks
  - [ ] Document quality standards
  - **Effort:** 4h | **Owner:** AI Coordinator

### Week 2: Audit & Monitoring
- [ ] **Audit System**
  - [ ] Implement change logging
  - [ ] Create audit trail viewer
  - [ ] Add conflict detection
  - **Effort:** 4h | **Owner:** AI Coordinator

- [ ] **Integration**
  - [ ] Connect governance to CI/CD
  - [ ] Add agent conflict resolution
  - [ ] Document operational procedures
  - **Effort:** 4h | **Owner:** AI Coordinator

### Ongoing: Agent Management
- [ ] **Agent Registration**
  - [ ] Register new agents as needed
  - [ ] Update agent manifests
  - [ ] Maintain skill documentation

---

## 🔧 Track B: Technical Implementation (PARALLEL)

**Duration:** 20+ weeks  
**Runs parallel to Track A**  
**Focus:** Performance, simulation, ML features

### Phase 2 (Weeks 1-2): See "Phase 2: Performance Architecture" above

### Phase 3 (Weeks 3-8): Advanced Features
- [ ] WebSocket real-time updates
- [ ] Advanced caching strategies
- [ ] Database query optimization
- [ ] API rate limiting enhancements

### Phase 4 (Weeks 9-14): Scale & Polish
- [ ] Load testing at scale
- [ ] CDN integration
- [ ] Advanced monitoring
- [ ] Disaster recovery procedures

### Phase 5 (Weeks 15-20): Expansion
- [ ] CS2 full integration
- [ ] Tournament prediction system
- [ ] Community features
- [ ] Mobile app (PWA enhancements)

---

## 📊 Quick Reference

### Essential Commands

```bash
# Development
npm run dev:web          # Start frontend dev server
npm run dev:api          # Start API dev server
npm run setup            # Initial local setup

# Build & Test
cd apps/website-v2
npm run build            # Production build
npm run test             # Run tests
npm run test:coverage    # Run tests with coverage
npm run lint             # Run ESLint
npm run typecheck        # TypeScript check

# Docker
docker-compose up -d db redis    # Start database services
docker-compose down              # Stop services

# E2E Tests
npx playwright test      # Run Playwright tests
```

### Critical File Paths

| Resource | Path |
|----------|------|
| Frontend App | `apps/website-v2/` |
| API Backend | `packages/shared/api/` |
| Data Pipeline | `packages/shared/axiom-esports-data/` |
| Master Plans | `docs/implementation/` |
| Root Axioms | `ROOT_AXIOMS/` |
| Agent Governance | `.agents/governance/` |
| Agent Registry | `.agents/registry/` |
| Tests | `tests/` |

### Key Configuration Files

| File | Purpose |
|------|---------|
| `apps/website-v2/vitest.config.js` | Test configuration (TO CREATE) |
| `apps/website-v2/.eslintrc.cjs` | Linting rules (TO CREATE/VERIFY) |
| `apps/website-v2/src/test/setup.js` | Test setup (TO CREATE) |
| `vercel.json` | Vercel deployment config |
| `infrastructure/render.yaml` | Render deployment config |
| `docker-compose.yml` | Local development services |

---

## ⚠️ Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Web Worker browser incompatibility | Medium | High | Fallback to main thread | Frontend Lead |
| R2 | Testing setup complexity | Low | Medium | Detailed guide provided | Frontend Lead |
| R3 | Scope creep in Phase 2 | High | Medium | Strict milestone gates | PM |
| R4 | Performance targets not met | Medium | High | Early prototyping | Frontend Lead |
| R5 | Resource availability | Medium | Medium | Buffer time allocated | PM |

---

## 📈 Production Readiness

### Current Score: 5.8/10

| Category | Score | Target |
|----------|-------|--------|
| Code Quality | 7/10 | 8/10 |
| Infrastructure | 3/10 | 8/10 |
| Documentation | 8/10 | 9/10 |
| Testing | 5/10 | 9/10 |
| Monitoring | 6/10 | 8/10 |

### Blockers to Production
- [ ] Resume Supabase (87 days until deletion risk)
- [ ] Fix Render deployment
- [ ] Complete testing framework
- [ ] Resolve ESLint configuration
- [ ] Re-enable CI/CD workflows

---

## 📝 Document Version History

| Version | Date | Changes |
|---------|------|---------|
| [Ver004.000] | 2026-03-22 | Initial comprehensive TODO |

---

**Next Actions:**
1. Resolve Critical Blockers (Week 0)
2. Begin Phase 2 Performance work
3. Track A governance implementation
4. Weekly progress reviews

*For detailed implementation guidance, see `docs/MASTER_PLAN_KIMICODE_CURRENT.md`*
