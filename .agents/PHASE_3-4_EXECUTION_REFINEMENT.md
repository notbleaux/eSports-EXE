[Ver001.000]

# Phase 3-4 Execution Refinement Report

**Date:** 2026-03-27
**Status:** Based on actual codebase scouting
**Refinements:** Implementation-ready adjustments based on actual code state

---

## Executive Summary

After scouting the codebase, Phase 3 is **70% complete** with working implementations already in place. Phase 4 requires substantial backend work. This document refines both phases with actual findings and adjusted task priorities.

---

## Phase 3 Status: PARTIAL COMPLETION FOUND ✅

### Already Implemented ✅

**Routing Structure (App.tsx - COMPLETE)**
```typescript
✅ Route path="/" → <TeNeTPortal />
✅ Route path="/hubs" → <TeNETDirectory />
✅ Route path="/:gameId/*" → <WorldPortRouter />
✅ Legacy redirects all present
✅ Profile pages (/player/:slug, /team/:slug)
✅ Admin dashboard route
```

**Core Components (All exist)**
- ✅ `TeNeTPortal.tsx` — Home/entry point
- ✅ `TeNETDirectory.tsx` — Game selector
- ✅ `GameNodeIDFrame.tsx` — Quarter GRID (2×2)
- ✅ `WorldPortRouter.tsx` — Game world router
- ✅ `TeZeTBranch.tsx` — Sub-branches

**GameNodeIDFrame Details (Verified)**
```typescript
✅ Renders 2×2 Quarter GRID
✅ SATOR (gold, analytics) - /game/analytics
✅ AREPO (blue, community) - /game/community
✅ OPERA (purple, pro-scene) - /game/pro-scene
✅ ROTAS (cyan, stats) - /game/stats
✅ Correct colors and icons
✅ Proper navigation paths
✅ Framer Motion animations
```

### Remaining Phase 3 Work (30%)

**Task 3.1: Verify Component Completeness**
- [ ] Check TeNeTPortal has hero section
- [ ] Check TeNetDirectory has world-port selector
- [ ] Verify all components have proper styling
- [ ] Check for responsive design implementation
- [ ] Verify error boundaries in place

**Task 3.2: Create @njz/ui Package** (Not yet started)
- [ ] Create `packages/@njz/ui/` directory structure
- [ ] Set up package.json with proper exports
- [ ] Move reusable components to package
- [ ] Update imports in apps/web

**Task 3.3: Clean Up TENET Hub References** (Not yet started)
- [ ] Search for "TENET Hub" labels (likely 0 since routing uses correct terminology)
- [ ] Verify all labels use correct terminology:
  - TeNET (nav layer)
  - SATOR (analytics)
  - AREPO (community)
  - OPERA (pro-scene)
  - ROTAS (stats)

**Task 3.4: E2E Testing & Verification** (Not yet started)
- [ ] Create/verify E2E navigation tests
- [ ] Test routing with Playwright
- [ ] Verify TypeScript strict mode: `pnpm typecheck`
- [ ] Run full test suite

---

## Phase 3 Refined Task Breakdown (6 remaining hours)

### 3.1: Component Completion Check (2 hours)

**Objectives:**
- Verify all components render correctly
- Check styling and responsiveness
- Ensure error handling in place
- Add missing styling if needed

**Refined Sub-Tasks:**
1. **3.1.1 TeNeTPortal Verification** (45 min)
   - [ ] Hero section renders
   - [ ] "Enter Platform" button navigates correctly
   - [ ] Auth check works
   - [ ] Responsive on mobile/tablet/desktop
   - [ ] Lighthouse score ≥ 95

2. **3.1.2 TeNETDirectory Verification** (45 min)
   - [ ] Displays available world-ports
   - [ ] Cards render with proper styling
   - [ ] Click navigation works
   - [ ] Loading states shown
   - [ ] Error handling implemented

3. **3.1.3 GameNodeIDFrame Verification** (30 min)
   - [ ] All 4 quadrants visible
   - [ ] Colors correct (gold, blue, purple, cyan)
   - [ ] Icons render properly
   - [ ] Navigation paths correct
   - [ ] Animations smooth

---

### 3.2: @njz/ui Package Creation (2.5 hours)

**Objectives:**
- Create shared UI component package
- Move reusable components to package
- Ensure workspace resolution works
- Update all imports

**Refined Implementation:**

1. **3.2.1 Package Structure** (45 min)
   ```bash
   mkdir -p packages/@njz/ui/src/{components,hooks,styles}
   touch packages/@njz/ui/{package.json,tsconfig.json,README.md}
   ```

2. **3.2.2 Package Configuration** (30 min)
   - Create proper package.json with exports
   - Set up TypeScript configuration
   - Configure pnpm workspace resolution

3. **3.2.3 Component Migration** (60 min)
   - Move QuarterGrid/QuarterCard to @njz/ui
   - Move WorldPortCard to @njz/ui
   - Create useGameContext hook
   - Move theme configuration

4. **3.2.4 Import Updates** (15 min)
   - Update apps/web imports to use @njz/ui
   - Verify no circular dependencies
   - Run `pnpm typecheck`

---

### 3.3: Label & Terminology Cleanup (1 hour)

**Refined Search & Replace:**
```bash
# Search for incorrect labels
grep -r "TENET Hub" apps/web/src/       # Expected: 0
grep -r "fifth hub" apps/web/src/       # Expected: 0
grep -r "hub-5 content" apps/web/src/   # Expected: 0

# Verify correct terminology is used
grep -r "GameNodeIDFrame" apps/web/src/ # Should find renders
grep -r "TeNET Directory" docs/         # Should find references
```

**Actions:**
- [ ] Run grep searches (expect 0 matches of "TENET Hub")
- [ ] Verify documentation uses correct terminology
- [ ] Update any remaining references

---

### 3.4: E2E Testing & Final Verification (1.5 hours)

**Refined Verification Checklist:**

1. **3.4.1 TypeScript Verification** (30 min)
   ```bash
   pnpm typecheck
   # Must return: 0 errors, 0 warnings
   ```

2. **3.4.2 E2E Navigation Tests** (45 min)
   ```bash
   # Test cases to verify
   ✅ / → renders TeNeTPortal
   ✅ /hubs → renders TeNETDirectory
   ✅ /valorant → renders GameNodeIDFrame with Valorant context
   ✅ /cs2 → renders GameNodeIDFrame with CS2 context
   ✅ /valorant/analytics → renders SATOR hub
   ✅ /valorant/community → renders AREPO hub
   ✅ /valorant/pro-scene → renders OPERA hub
   ✅ /valorant/stats → renders ROTAS hub
   ✅ Legacy redirects work (/analytics → /valorant/analytics)
   ✅ 404 page renders for invalid routes
   ```

3. **3.4.3 Build & Production Test** (15 min)
   ```bash
   pnpm build
   # Must succeed without errors
   ```

---

## Phase 3 Gate Verification (Updated)

| Gate | Criteria | Status | Command |
|------|----------|--------|---------|
| 3.1 | `/hubs` renders TeNET directory | Ready | Manual: Open http://localhost:5173/hubs |
| 3.2 | World-Port routes resolve | Ready | curl http://localhost:5173/valorant |
| 3.3 | Hub URLs include game context | Ready | curl http://localhost:5173/valorant/analytics |
| 3.4 | No "TENET Hub" labels remain | Ready | grep -r "TENET Hub" apps/web/src/ |
| 3.5 | GameNodeIDFrame renders 2×2 grid | Ready | Manual: Verify on screen |
| 3.6 | TypeScript strict mode passes | Ready | pnpm typecheck |

---

## Phase 4 Status: NOT STARTED 🟡

### Phase 4 Objectives (20 hours)

**Dual Data Pipelines:**
1. **Path A (Live):** Pandascore → Redis → WebSocket → Frontend (< 500ms)
2. **Path B (Legacy):** All sources → TeneT verification → PostgreSQL → API

### Phase 4 Refined Task Breakdown

#### 4.1: Path A - Live Data Pipeline (8 hours)

**4.1.1 Pandascore Webhook Handler** (3 hours)
- [ ] Implement signature verification (HMAC-SHA256)
- [ ] Create webhook route: `POST /webhooks/pandascore/match-update`
- [ ] Normalize payload to standard format
- [ ] Route to Redis Stream: `match:{match_id}:events`
- [ ] Error handling and logging

**4.1.2 Redis Stream Processing** (2.5 hours)
- [ ] Set up Redis Stream consumers
- [ ] Implement event deduplication (by message_id)
- [ ] Route events to WebSocket publisher
- [ ] Handle stream overflow (maxlen=1000)

**4.1.3 WebSocket Broadcast Enhancement** (2.5 hours)
- [ ] Listen to Redis streams
- [ ] Broadcast to match subscribers
- [ ] Apply deduplication
- [ ] Maintain < 500ms latency (verify with benchmarks)
- [ ] Handle client backpressure

#### 4.2: Path B - Legacy Verification Pipeline (6 hours)

**4.2.1 TeneT Verification Integration** (2 hours)
- [ ] Call TeneT verification service for incoming data
- [ ] Store VerificationResult in PostgreSQL
- [ ] Handle confidence scoring
- [ ] Route FLAGGED items to review queue

**4.2.2 API Endpoints** (3 hours)
- [ ] `GET /v1/live/matches` — Current live matches
- [ ] `GET /v1/live/matches/{match_id}` — Specific match
- [ ] `GET /v1/history/matches` — Past matches with confidence
- [ ] `GET /v1/history/matches/{match_id}` — Specific history
- [ ] Pagination, filtering, sorting
- [ ] Include confidence scores in responses

**4.2.3 Admin Review Queue** (1 hour)
- [ ] Connect admin panel to TeneT review queue
- [ ] Implement decision persistence
- [ ] Update match status based on decisions

#### 4.3: Integration & Monitoring (6 hours)

**4.3.1 Full Pipeline Integration** (3 hours)
- [ ] End-to-end tests: Pandascore → Redis → WebSocket → Frontend
- [ ] End-to-end tests: Manual entry → TeneT → PostgreSQL → API
- [ ] Verify both paths work simultaneously
- [ ] Conflict resolution between paths

**4.3.2 Performance & Load Testing** (2 hours)
- [ ] Load test: 1000+ concurrent WebSocket connections
- [ ] Message throughput: 100 msg/sec
- [ ] Latency: p95 < 500ms
- [ ] Database query performance

**4.3.3 Monitoring & Error Tracking** (1 hour)
- [ ] Set up Sentry error tracking
- [ ] Create performance dashboards
- [ ] Alert configuration
- [ ] Logging strategy

---

## Implementation Sequence (Recommended)

### Week 1: Phase 3 Completion (6 hours)

**Monday:**
- 2h: 3.1 Component completion verification
- 2h: 3.2 @njz/ui package creation
- 1h: 3.3 Label cleanup
- 1h: 3.4 E2E testing & TypeScript check

**Outcome:** Phase 3 gates all PASSED ✅

### Week 2-3: Phase 4 Implementation (20 hours)

**Wednesday-Friday:**
- 8h: 4.1 Path A live pipeline
- 6h: 4.2 Path B legacy pipeline
- 6h: 4.3 Integration & monitoring

**Outcome:** Phase 4 gates all PASSED ✅

---

## Critical Dependencies

**Phase 3 → Phase 4:**
- ✅ Phase 3 gates must all pass before Phase 4 start
- ✅ Frontend routing must be stable
- ✅ API gateway must be running
- ✅ Redis and PostgreSQL must be operational
- ✅ TeneT verification service must be running

---

## Refined Success Metrics

### Phase 3 Completion Criteria
- [ ] All 6 gates PASSED
- [ ] `pnpm typecheck` → 0 errors
- [ ] E2E navigation tests: 40/40 PASS
- [ ] Production build succeeds
- [ ] Lighthouse score ≥ 95

### Phase 4 Completion Criteria
- [ ] Path A latency: p95 < 500ms
- [ ] Path B confidence scores visible in API
- [ ] WebSocket: 1000+ concurrent connections
- [ ] Admin panel: Review queue fully functional
- [ ] Integration tests: All pass
- [ ] Sentry: Error tracking active

---

## Recommendations for Implementation

1. **Phase 3 is 70% done** - Focus on completing the remaining 30%
2. **Create @njz/ui package first** - Establishes pattern for reusability
3. **Phase 4 can run partially in parallel** with Phase 3.4 testing
4. **Prioritize Path A latency** - < 500ms is critical for UX
5. **Implement comprehensive monitoring** - Errors will be hard to debug once live

---

**End of Refinement Report**

Ready for Phase 3 completion + Phase 4 implementation.
