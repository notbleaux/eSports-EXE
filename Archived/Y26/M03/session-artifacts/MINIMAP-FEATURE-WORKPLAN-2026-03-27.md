[Ver001.000]

# Minimap Feature Work Plan — Session 2026-03-27 to 2026-03-30

**Tier:** WORK SESSION  
**Valid Until:** 2026-03-30T23:59:59Z  
**Created:** 2026-03-27  
**Step Number:** 2–3 (Technical Specification & Planning)  
**Feature:** Minimap Extraction Service & Frontend (depends on Archival System)  
**Prerequisites:** Archival System completion (see CRITICAL BLOCKER below)

---

## Executive Summary

You are executing **Step 2 (Technical Specification)** and **Step 3 (Planning)** of the SDD workflow for the **Minimap Feature** (Extraction Service + Frontend UI).

**What it is:** A multi-component system that extracts tactical minimap frames from Valorant VODs, stores them durably, verifies frames with TeneT, and displays them in the frontend.

**Components:**
1. **Extraction Service** — Python asyncio pipeline (FFmpeg + OpenCV) to extract frames from VOD
2. **Frontend Component** — React paginated frame grid with verification badges
3. **Integration layer** — Frame upload to Archival API, pinning workflow with TeneT

**Why now:** Unblocks Frame Grid UI for ROTAS/OPERA hub. Requires Archival System to be complete (blockers on Tasks 6–7).

**Your outputs:**
1. **spec-minimap-feature.md** — Technical specification (extraction pipeline, React component, integration)
2. **plan-minimap-feature.md** — Detailed implementation plan (11 tasks, dependency graph showing Archival blocker)
3. **Cross-review report** — 2-pass audit (Specification + Planning + dependency management)

---

## Feature Definition

### High-Level Architecture
```
VOD File (Valorant game recording)
  ↓ [Extraction Service Pipeline]
  ├─ FFmpeg: Parse VOD metadata
  ├─ OpenCV: Detect minimap region, extract JPEG crops at 1 fps
  ├─ Segment classification: IN_ROUND vs. BUY_PHASE vs. HALFTIME
  └─ Deduplication: Skip identical frames
      ↓ [Batch upload to Archival API]
      Archival System: Store frames durably, deduplicate, return manifest
      ↓ [Frontend queries Archival]
      React MinimapFrameGrid: Display paginated frames with verification badges
```

### Integration Points
- **Extraction → Archival:** `POST /v1/archive/frames` (batch upload)
- **Frontend → Archival:** `GET /v1/archive/matches/{match_id}/frames` (query, pagination)
- **TeneT → Archival:** `POST /v1/archive/frames/{id}/pin` (pinning verified frames)

### Key Constraints
- **Phase 1 MVP:** Single-threaded extraction (no parallel workers), local VOD files only
- **Frame rate:** 1 fps = ~1800 frames/30-min match
- **Storage:** Archival System handles durability (not Extraction Service responsibility)

---

## CRITICAL BLOCKER: Archival System Dependency

**Tasks 6–7 (Archival integration) CANNOT start until:**
1. Archival API endpoints are deployed and tested
2. Frame storage and deduplication confirmed working
3. Query and pinning endpoints functional

**Your mitigation strategy:**
- **Parallel execution:** Develop Tasks 1–5 (extraction, React components, APIs) while Archival completes
- **Mock integration:** Use mock Archival API for Tasks 6–7 testing; swap real API when ready
- **Sequential fallback:** If Archival delays beyond 2026-03-30, defer Tasks 6–7 to Phase 9 continuation

**Coordination note:** Check ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md for Archival ETA. If past 2026-03-30, plan for mock → real swap.

---

## Step 2: Technical Specification Deliverable

**File location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/spec-minimap-feature.md`

**Sections required:**

1. **Technical Context** (language, deps, framework alignment)
   - **Backend:** Python 3.11+, asyncio, FastAPI
   - **Frontend:** React 18, TypeScript, Tailwind, TanStack Query
   - **Media:** FFmpeg (system), opencv-python, ffmpeg-python
   - **Database:** PostgreSQL (extraction_jobs), Redis (frame manifest cache)
   - **Align with:** AGENTS.md patterns, existing ROTAS/OPERA hub structure

2. **Extraction Service Architecture**
   - Input: Local VOD file path (Phase 1 only)
   - Pipeline stages:
     1. FFmpeg metadata parsing (duration, FPS, resolution)
     2. Minimap region detection (fixed bounding box or ML-based)
     3. Frame extraction at 1 fps
     4. Segment type classification (IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN)
     5. Deduplication (skip frames identical to previous)
     6. Batch upload to Archival API
   - Job tracking: PostgreSQL extraction_jobs table
   - Async execution: FastAPI endpoint `POST /v1/extraction/jobs` → async background task

3. **Frontend Component: MinimapFrameGrid**
   - Integration: ROTAS hub or OPERA hub (specify which)
   - Layout: Paginated grid (50 frames/page)
   - Features:
     - Pagination controls (next/prev, page indicator)
     - Frame zoom/lightbox (click thumbnail → fullscreen)
     - Segment type badges (color: red=IN_ROUND, green=BUY_PHASE, gray=BETWEEN)
     - Verification badges (checkmark=verified, pending=awaiting)
     - Timestamp overlay (VOD time in HH:MM:SS.mmm)
   - Data flow: React hook `useMinimapFrames(matchId, page)` → Archival API
   - Caching: 5-min cache, SWR pattern via TanStack Query

4. **Data Model Integration**
   - **New table: extraction_jobs**
     - Columns: job_id, match_id, vod_source, status, frame_count, manifest_id, created_at, completed_at
     - Indices: match_id, status
   - **Archival integration:**
     - Frame uploads use ArchiveFrame schema (from Archival System PRD)
     - Frame queries use FrameQueryResponse with pagination
   - **TeneT integration:**
     - Pinning API uses `POST /v1/archive/frames/{id}/pin` from Archival

5. **API Endpoints (Extraction Service)**
   - `POST /v1/extraction/jobs` — Start job (async)
     - Request: `{ match_id: UUID, vod_source: "local", vod_path: str }`
     - Response: `{ job_id: UUID, status: "pending" }`
   - `GET /v1/extraction/jobs/{job_id}` — Poll status
     - Response: `{ job_id, status, frame_count, manifest_id, error }`

6. **Frontend Hooks & Components**
   - Hook: `useMinimapFrames(matchId, page)`
     - Returns: `{ frames, isLoading, error, hasMore, nextPage() }`
   - Component: `<MinimapFrameGrid matchId={matchId} />`
     - Props: matchId, showVerificationBadges (optional)
     - Child: `<FrameThumbnail frame={frame} onZoom={handler} />`

7. **Delivery Phases**
   - **Phase 1 MVP:** Single-threaded extraction, frame grid, TeneT integration
   - **Phase 2:** S3/cloud VOD sources, parallel extraction workers
   - **Phase 3:** ML-based segment detection, advanced filtering

8. **Verification Approach**
   - Backend tests: `pytest tests/unit/test_extraction_*.py`, `pytest tests/integration/test_extraction_*.py`
   - Frontend tests: `npm run test` (React snapshot, TanStack Query mock)
   - E2E: `npx playwright test` (extract → archive → frontend display)
   - Lint/Type: `ruff`, `mypy`, `eslint`, `npm run typecheck`

---

## Step 3: Planning Deliverable

**File location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/plan-minimap-feature.md` (new)

**11 tasks with dependency graph:**

| Task # | Title | Gate Ref | Dependencies | AC Links | Blocker Status |
|--------|-------|----------|--------------|----------|---|
| 1 | PostgreSQL extraction_jobs table + SQLAlchemy model | [Gate 9.1] | None | Core | ✅ Ready |
| 2 | FFmpeg + OpenCV extraction pipeline | [Gate 9.2] | Task 1 | Core | ✅ Ready |
| 3 | Segment type classification logic | [Gate 9.3] | Task 2 | Core | ✅ Ready |
| 4 | FastAPI extraction jobs endpoint + async dispatch | [Gate 9.4] | Tasks 1–3 | Core | ✅ Ready |
| 5 | React MinimapFrameGrid component (mock data) | [Gate 9.5] | None | UI | ✅ Ready |
| 6 | TanStack Query hook: useMinimapFrames (mock Archival) | [Gate 9.6] | Task 5 | UI | ✅ Ready (mock) |
| 7 | Integration: Extraction → Archival API (frame upload) | [Gate 9.7] | Tasks 4, 6 | **Integration** | ⏳ **BLOCKED ON ARCHIVAL** |
| 8 | Integration: Frontend → Archival API (frame query) | [Gate 9.8] | Tasks 5, 6 | **Integration** | ⏳ **BLOCKED ON ARCHIVAL** |
| 9 | Integration: TeneT → Archival pinning workflow | [Gate 9.9] | Tasks 5, 7 | **Integration** | ⏳ **BLOCKED ON ARCHIVAL** |
| 10 | Unit + integration tests (all components) | [Gate 9.10] | Tasks 1–9 | Quality | ⏳ Depends on 7–9 |
| 11 | Hub integration (add MinimapFrameGrid to ROTAS/OPERA) | [Gate 9.11] | Tasks 5, 8 | Quality | ✅ Ready (after Task 8) |

**Task Details Template:**

Each task includes:
- **Gate reference:** PHASE_GATES.md gate (e.g., Gate 9.1)
- **Acceptance Criteria:** Which PRD/spec criteria this task addresses
- **Verification command:** Specific pytest/npm test command
- **Estimated scope:** Lines of code, files
- **Blocker status:** READY vs. BLOCKED ON ARCHIVAL

**Blocker management:**
- Tasks 1–6: Can run in parallel while Archival completes
- Tasks 7–9: Cannot start until Archival API endpoints are tested
- Mitigation: Task 6 uses mock Archival API; swap real API when Archival ready

---

## Integration with 2/3/5+1,2,3 Framework

### Framework Context
- **2 Auth Classes:** AGENT (you execute) · CODEOWNER (approves critical PRs)
- **3 Tiers:** MASTER (contracts) · PHASE (gate-linked specs) · WORK SESSION (this plan)
- **5 Pillars:** Road-Maps · Logic Trees · ACP · MCP · Notebook/TODO
- **+3 Bonus:** Integration with Archival System components

### Your Responsibility
- **Spec section:** Define extraction pipeline, React component, Archival integration points
- **Planning section:** Link tasks to gates; clearly mark Archival blockers
- **Dependency graph:** Make critical path explicit (Tasks 1–5 parallel, then wait for Archival, then 7–9)
- **Cross-review:** 2-pass audit with focus on integration risk (Archival dependency timing)

---

## Cross-Review Process

**After spec-minimap-feature.md and plan-minimap-feature.md are drafted:**

1. **Read CROSS-REVIEW-TEMPLATE-2026-03-27.md** for audit checklists
2. **Run Pass 1:** Specification audit (extraction pipeline correctness, React patterns, Archival integration)
3. **Run Pass 2:** Planning audit (task decomposition, Archival blocker management, feasibility)
4. **Incorporate findings:** Close gaps, mitigate blocker risks, document contingencies
5. **Request CODEOWNER approval:** Before Implementation begins

---

## Archival System Coordination

**Check ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md for:**
- Archival estimated completion date
- If past 2026-03-30: Plan mock → real API swap timeline
- If on track: Confirm Task 6–7 can start simultaneously with Archival Task 5–6

**File references:**
- requirements.md — Archival PRD
- spec.md — Archival specification
- plan.md — Archival implementation plan

---

## File References

| File | Purpose | Location |
|------|---------|----------|
| spec-minimap-feature.md | Your deliverable (Step 2) | `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/` |
| plan-minimap-feature.md | Your deliverable (Step 3) | `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/` |
| ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md | Archival dependency context | `.agents/session/` |
| requirements.md | Archival PRD (reference only) | `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/` |
| AGENTS.md | Project overview, hub structure | Root directory |
| MASTER_PLAN.md § Phase 9 | Current phase context | Root directory |
| PHASE_GATES.md | Gate structure | `.agents/` |
| apps/web/src/hub-2-rotas/ or hub-4-opera/ | Existing hub code to integrate with | `apps/web/src/` |
| CROSS-REVIEW-TEMPLATE-2026-03-27.md | Audit framework | `.agents/session/` |
| AGENT-TASK-INSTRUCTION-2026-03-27.md | How to use this workplan | `.agents/session/` |

---

## Success Criteria for This Session

✅ **Specification (spec-minimap-feature.md):**
- Extraction pipeline fully specified (FFmpeg, OpenCV, segment detection, deduplication)
- React MinimapFrameGrid component fully specified (layout, features, props)
- useMinimapFrames hook signature and data flow defined
- Both API endpoints specified (job creation, status polling)
- All 3 integration workflows described (Extraction→Archival, Frontend→Archival, TeneT→Archival)
- Archival API dependencies clearly identified

✅ **Planning (plan-minimap-feature.md):**
- 11 concrete tasks with gate references and dependencies
- Archival blocker clearly marked on Tasks 7–9
- Parallel execution strategy for Tasks 1–6 documented
- Contingency plan for Archival delays (mock → real API swap)
- Verification commands specific and executable
- Ready for independent implementation

✅ **Cross-Review Report:**
- Specification audit complete (extraction correctness, integration risk)
- Planning audit complete (dependency graph, blocker management)
- Findings integrated (no unresolved dependencies)
- CODEOWNER approval obtained

---

## Decision Framework: When to Ask vs. Assume

| Scenario | Decision |
|----------|----------|
| VOD source (S3, local file, HTTP stream) | Assume local file Phase 1; defer S3 to Phase 2 |
| Minimap region (fixed bounding box vs. ML detection) | Assume fixed bounding box (50% of frame, bottom-right) Phase 1; ML Phase 3 |
| Segment detection (classical CV vs. ML) | Assume round timer + UI overlay heuristics Phase 1 |
| Frontend location (ROTAS vs. OPERA hub) | Ask user; recommend ROTAS (leaderboard context makes sense) |
| Frame caching (Redis vs. TanStack only) | Assume TanStack Query 5-min client cache Phase 1; Redis Phase 2 |
| Parallel extraction workers | Defer to Phase 2 (out of MVP) |

---

## Stop Points

**After Step 2 (Specification):** Present spec-minimap-feature.md to user for review before proceeding to Step 3.  
**After Step 3 (Planning):** Present plan-minimap-feature.md to user for review before Implementation begins.  
**Archival blocker:** If Archival not complete by 2026-03-30, confirm mock API swap contingency with user.

---

*This document expires 2026-03-30. After this date, re-read MASTER_PLAN.md for current phase context.*
