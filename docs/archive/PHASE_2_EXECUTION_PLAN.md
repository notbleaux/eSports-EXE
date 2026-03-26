[Ver001.000]

# Phase 2 Execution Plan — Fine-Tuned
**Date:** 2026-03-22  
**Status:** APPROVED FOR EXECUTION

---

## 🎯 Phase 2 Review & Learnings from Phase 1

### What Worked Well
1. **Parallel sub-agent execution** — 8 agents completed work efficiently
2. **Filesystem-based JLB** — Simple, no coordination failures
3. **Worker infrastructure** — Created ahead of integration
4. **Build succeeds** — 10.82s compile time

### Adjustments for Phase 2
1. **Integration > Creation** — Workers exist, now integrate into UI
2. **Bundle size priority** — Three.js (998KB) needs lazy loading
3. **Incremental TypeScript fixes** — ~200 errors, fix during work
4. **Test as we build** — Verify each integration step

---

## 📋 Phase 2 Workstreams (Revised)

### Workstream A: Web Workers Integration (Days 1-2)
**Goal:** Connect workers to actual SATOR/ROTAS hubs

| Task | Priority | Effort | Agent |
|------|----------|--------|-------|
| Integrate Grid Worker into SATOR hub | 🔴 P0 | 4h | Agent A1 |
| Integrate ML Worker into prediction components | 🔴 P0 | 4h | Agent A2 |
| Integrate Analytics Worker into stats | 🟡 P1 | 3h | Agent A3 |
| Add Worker Pool management | 🟡 P1 | 2h | Agent A1 |

### Workstream B: Virtual Scrolling (Days 2-3)
**Goal:** Implement @tanstack/react-virtual for large lists

| Task | Priority | Effort | Agent |
|------|----------|--------|-------|
| Create VirtualPlayerGrid component | 🔴 P0 | 4h | Agent B1 |
| Connect Grid Worker to virtual scroll | 🔴 P0 | 3h | Agent B1 |
| Optimize row rendering with memo | 🟡 P1 | 2h | Agent B2 |
| Test with 1000+ players | 🟢 P2 | 2h | Agent B2 |

### Workstream C: PWA & Service Worker (Days 3-4)
**Goal:** Offline capability, installable app

| Task | Priority | Effort | Agent |
|------|----------|--------|-------|
| Create service-worker.ts | 🔴 P0 | 3h | Agent C1 |
| Configure Vite PWA plugin | 🔴 P0 | 2h | Agent C1 |
| Add offline fallback pages | 🟡 P1 | 2h | Agent C2 |
| Test offline functionality | 🟢 P2 | 2h | Agent C2 |

### Workstream D: Bundle Optimization (Days 4-5)
**Goal:** Reduce initial bundle from ~2MB to <500KB

| Task | Priority | Effort | Agent |
|------|----------|--------|-------|
| Lazy load Three.js | 🔴 P0 | 3h | Agent D1 |
| Code split by route | 🔴 P0 | 3h | Agent D1 |
| Dynamic import ML models | 🟡 P1 | 2h | Agent D2 |
| Analyze and optimize chunks | 🟢 P2 | 2h | Agent D2 |

---

## 🎛️ Sub-Agent Organization

### Agent Assignments

| Agent | Workstream | Primary Skills | Coordination |
|-------|------------|----------------|--------------|
| **Agent A1** | Web Workers (Grid) | sator-react-frontend, sator-sator-square | Foreman check-in: EOD Day 1 |
| **Agent A2** | Web Workers (ML) | sator-react-frontend, sator-analytics | Foreman check-in: EOD Day 1 |
| **Agent A3** | Web Workers (Analytics) | sator-react-frontend, sator-analytics | Foreman check-in: EOD Day 1 |
| **Agent B1** | Virtual Scrolling | sator-react-frontend, web-performance | Foreman check-in: EOD Day 2 |
| **Agent B2** | Virtual Scrolling (test) | sator-react-frontend, testing | Foreman check-in: EOD Day 2 |
| **Agent C1** | PWA Core | sator-react-frontend, sator-deployment | Foreman check-in: EOD Day 3 |
| **Agent C2** | PWA Testing | sator-react-frontend, testing | Foreman check-in: EOD Day 3 |
| **Agent D1** | Bundle (Routes) | sator-react-frontend, build-tools | Foreman check-in: EOD Day 4 |
| **Agent D2** | Bundle (ML) | sator-react-frontend, sator-analytics | Foreman check-in: EOD Day 4 |

### Foreman Role
- **Morning:** Distribute tasks, check blockers
- **Mid-day:** Review PRs, resolve conflicts
- **EOD:** Verify completions, update TODOs

---

## ✅ Phase 2 Success Criteria (Revised)

| Criterion | Baseline | Target | Verification |
|-----------|----------|--------|--------------|
| Grid FPS | ~45 | 60 | Chrome DevTools |
| Initial Bundle | 1.9MB | <500KB | vite-bundle-visualizer |
| Workers Active | 0 | 3 | Network tab |
| Offline Capable | ❌ | ✅ | Lighthouse PWA audit |
| Virtual Scroll | ❌ | ✅ | 1000+ rows smooth |
| Test Coverage | ~30% | >50% | Vitest report |

---

## 🚀 Execution Sequence

### Day 1: Worker Integration
```
Morning:  Agent A1, A2, A3 start worker integration
Mid-day:  Foreman reviews initial implementations
EOD:      Verify workers connect, check-in with agents
```

### Day 2: Virtual Scrolling
```
Morning:  Agent B1 creates VirtualPlayerGrid
Mid-day:  Connect Grid Worker to virtual scroll
EOD:      Test with 1000 players
```

### Day 3: PWA Foundation
```
Morning:  Agent C1 creates service worker
Mid-day:  Configure Vite PWA
EOD:      Test offline capability
```

### Day 4: Bundle Optimization
```
Morning:  Agent D1 lazy loads Three.js
Mid-day:  Code split routes
EOD:      Analyze bundle, verify <500KB initial
```

### Day 5: Integration & Testing
```
Morning:  All agents fix integration issues
Mid-day:  Run full test suite
EOD:      Phase 2 complete, verify all targets
```

---

## 📝 Two-Way Handshake Protocol

### For Each Sub-Agent Task:

1. **Start:** Agent reports to foreman with plan
2. **Mid-point:** Agent shows progress, foreman reviews
3. **Complete:** 
   - Agent creates PR/files
   - Foreman reviews ACTUAL code
   - Verification tests run
   - Agent updates TODO checklist
   - Foreman approves merge

### Blocker Escalation:
```
Agent hits blocker → Report to .job-board/04_BLOCKS/ → 
Foreman reviews within 1h → Reassign or resolve → 
Update playbook with solution
```

---

## 🎯 Final Pre-Flight Check

- [x] Build succeeds (10.82s)
- [x] Workers created (3 workers)
- [x] Test framework ready (Vitest)
- [x] JLB operational
- [x] Skills updated (v2.1.0)
- [x] Agents assigned
- [x] Success criteria defined

**STATUS: READY FOR PHASE 2 EXECUTION**

---

*Plan approved. Proceeding to execution.*
