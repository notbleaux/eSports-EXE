[Ver001.000]

# Phase 3: Frontend Architecture

**Phase ID:** PL-P3  
**Status:** 🔄 Planning Complete → Ready for Execution  
**Duration:** 3 weeks (April 1-21, 2026)  
**Owner:** @dev  
**Success Criteria:** 5/5 gates complete  

---

## 1. Executive Summary

### 1.1 Conceptual Goal
Transform `hub-5-tenet` from a "5th content hub" misconception into the **TeNET Navigation Layer** - a topological routing system that enables seamless game-world traversal.

### 1.2 Key Deliverables
| Deliverable | Description | Owner |
|-------------|-------------|-------|
| TeNeT Portal | Entry point with auth, onboarding | @dev |
| TeNET Directory | Game selector (World-Port chooser) | @dev |
| GameNodeIDFrame | 2×2 quarter navigation grid | @dev |
| TeZeT Branch Selector | Breadcrumb + tab navigation | @dev |
| @njz/ui Package | Shared component library | @dev |

### 1.3 Success Metrics
- [ ] Zero "TENET Hub" references in codebase
- [ ] 2×2 quarter grid renders on all game pages
- [ ] Navigation latency < 100ms
- [ ] Lighthouse accessibility score ≥ 95
- [ ] TypeScript strict mode: 0 errors

---

## 2. Phase Structure

### 2.1 Gate Configuration

| Gate | Criteria | Verification |
|------|----------|--------------|
| **3.1** | TeNET Portal exists and loads | `curl /` returns portal |
| **3.2** | World-Port routes resolve | `/valorant`, `/cs2` accessible |
| **3.3** | Hub routes include game context | `/valorant/analytics` shows Valorant |
| **3.4** | No TENET Hub labels remain | `grep -r "TENET Hub"` → 0 matches |
| **3.5** | GameNodeIDFrame renders 2×2 grid | Playwright test passes |
| **3.6** | TypeScript strict mode passes | `pnpm typecheck` → 0 errors |

### 2.2 Milestones

```
Week 1: Navigation Layer (Apr 1-7)
├── Day 1-2: TeNeT Portal
├── Day 3-4: TeNET Directory
└── Day 5-7: GameNodeIDFrame

Week 2: Component Library (Apr 8-14)
├── Day 8-10: @njz/ui Package Setup
├── Day 11-12: Component Migration
└── Day 13-14: Integration & Testing

Week 3: Polish & Verification (Apr 15-21)
├── Day 15-17: TeZeT Branch Selector
├── Day 18-19: Cleanup & Optimization
├── Day 20: Final Testing
└── Day 21: Phase Gate Review
```

---

## 3. Sub-Plans

### 3.1 Sub-Plan Index

| ID | Name | Duration | Status | Link |
|----|------|----------|--------|------|
| SP-P3-001 | TeNET Navigation Layer | 1 week | 🔄 Ready | [SP-P3-001.md](./SP-P3-001.md) |
| SP-P3-002 | @njz/ui Component Library | 1 week | 📋 Planned | [SP-P3-002.md](./SP-P3-002.md) |
| SP-P3-003 | GameNodeIDFrame Implementation | 1 week | 🔄 In Progress | [SP-P3-003.md](./SP-P3-003.md) |

### 3.2 Sub-Plan Dependencies

```
SP-P3-001 (Navigation Layer)
    ├── SP-P3-003 (GameNodeIDFrame) ── depends on ──┐
    └── SP-P3-002 (Component Library) ── provides ──┘
```

---

## 4. Resource Allocation

### 4.1 Team Structure

| Role | Responsibility | Allocation |
|------|----------------|------------|
| Frontend Lead | Architecture, integration | 100% |
| UI Developer | Component implementation | 100% |
| QA Engineer | Testing, accessibility | 50% |

### 4.2 Skills Required

- **sator-react-frontend**: React 18, TypeScript, Tailwind
- **sator-end-to-end**: Integration testing
- **design-systems**: Component library patterns
- **web-accessibility**: WCAG 2.1 AA compliance

---

## 5. Risk Management

### 5.1 Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking route changes | Medium | High | Maintain redirect table |
| Component library complexity | Low | Medium | Incremental migration |
| Accessibility gaps | Medium | Medium | Automated a11y testing |
| Performance degradation | Low | High | Bundle monitoring |

### 5.2 Contingency Plans

- **Route Conflicts:** Maintain backward-compatible redirects for 30 days
- **Build Failures:** Feature flag new components
- **Scope Creep:** Defer non-critical items to Phase 4

---

## 6. Integration Points

### 6.1 Upstream Dependencies

| Dependency | Phase | Status |
|------------|-------|--------|
| Type schemas | P1 | ✅ Complete |
| Auth system | P2 | ✅ Complete |
| API contracts | P2 | ✅ Complete |

### 6.2 Downstream Impact

| Consumer | Phase | Impact |
|----------|-------|--------|
| Path A/B Pipeline | P4 | Uses new routing |
| Ecosystem Expansion | P5 | Depends on @njz/ui |
| Production Hardening | P6 | Tests new architecture |

---

## 7. Definition of Done

### 7.1 Phase Complete When

- [ ] All 6 gates verified ✅
- [ ] Sub-plans SP-P3-001, 002, 003 complete
- [ ] Code review passed
- [ ] E2E tests passing (40/40)
- [ ] Documentation updated
- [ ] Phase retrospective completed

### 7.2 Handoff Criteria

- [ ] @njz/ui package published
- [ ] Migration guide written
- [ ] Breaking changes documented
- [ ] Phase 4 can begin immediately

---

## 8. Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| Phase Template | Template used | [phase-template.md](../templates/phase-template.md) |
| P3 Alignment | Backlog alignment | [P3-alignment.md](../phase/P3-alignment.md) |
| GameNodeIDFrame Spec | Implementation spec | [SPEC-TD-P3-001](../specs/SPEC-TD-P3-001-GameNodeIDFrame.md) |
| S-Extraction-001 | Current sprint | [S-Extraction-001](../sprints/S-Extraction-001-plan.md) |

---

## 9. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.000 | 2026-04-02 | Initial Phase 3 plan using framework template |

---

*Phase 3 Plan Complete - Ready for Execution*
