# Handoff Prompt: Minimap Extraction & Feature — Technical Specification & Planning

**Status:** Feature definition + Archival System prerequisite approved  
**Next Steps:** Technical Specification → Planning → Implementation  
**Review Framework:** 2/3/5+1,2,3 scheme (2 Auth Classes · 3 Tiers · 5 Pillars · +3 Bonus Improvements)

---

## Context Handoff

### Feature Definition: Minimap Extraction Service & Frontend

The **Minimap Feature** is a multi-component system enabling extraction, storage, verification, and visualization of tactical minimap frames from Valorant esports VODs.

**System Architecture:**
1. **Minimap Extraction Service** — Processes VOD videos, extracts minimap JPEG crops at 1 fps, computes segment analysis (in-round vs. buy phase)
2. **Minimap Archival System** — Stores extracted frames durably (PREREQUISITE, defined in separate handoff)
3. **TeneT Key.Links** — Verifies minimap frames against trusted sources; associates verified frames with match state
4. **Frontend Visualization** — Displays frame grid, timeline, verified segment markers (OPERA hub or ROTAS integration)

**Key Integration Points:**
- Extraction Service → Archival API (bulk frame upload, manifest retrieval)
- Archival API ← TeneT Key.Links (frame query, pinning high-confidence results)
- Archival API ← Frontend (query for display, pagination)

**Scope (Phase 9 MVP):**
- Extraction Service: Single-threaded MVP (no parallel processing), local file input, ~1000 frames/match processing
- Frontend: Minimap frame grid view (30-min match = 1800 frames at 1 fps; paginated display), integration with existing ROTAS or OPERA hub
- TeneT Integration: Frame verification workflow, pinning API calls

**Out of Scope (Phase 10+):**
- Parallel extraction workers, cloud VOD source integration
- Advanced ML-based segment detection
- Real-time streaming minimap
- Mobile responsive grid optimization

---

## Your Mission

You are executing **Steps 2–3 of the SDD workflow** for the Minimap Feature:

1. **Step 2: Technical Specification** — Define extraction service, frontend component, integration points, data flow
2. **Step 3: Planning** — Break down into concrete implementation tasks

Both steps must integrate the **2/3/5+1,2,3 review framework**:

### Framework Overview
- **2 Auth Classes:** AGENT (read/write code, mark TODOs) · CODEOWNER (approve PRs, unlock phases)
- **3 Tiers:** MASTER (project-wide canonical truth) · PHASE (phase-duration scope) · WORK SESSION (ephemeral)
- **5 Pillars:** Road-Maps · Logic Trees · ACP (Agent Coordination) · MCP (Master Context) · Notebook/TODO System
- **+3 Bonus Improvements:** Identified via cross-review, integrated into specs and plans

---

## Step 2: Technical Specification

**Deliverable:** `spec-minimap-feature.md` (same chat directory)

Create a technical specification covering:

1. **Technical Context**
   - **Extraction Service:** Python 3.11+ (asyncio-based), OpenCV for JPEG extraction, ffmpeg-python for VOD parsing
   - **Frontend:** React 18, TypeScript, Tailwind CSS, TanStack Query, Framer Motion (animation)
   - **Database:** PostgreSQL (extraction job tracking table), Redis (frame manifest cache)
   - **Dependencies:** ffmpeg (system), opencv-python, pydantic, httpx (async HTTP to Archival API)
   - **Framework alignment:** Follows NJZ patterns (see AGENTS.md, existing ROTAS/OPERA hub structure)

2. **Extraction Service Architecture**
   - Input: Local VOD file path or S3 URL (Phase 1: local only)
   - Pipeline:
     1. FFmpeg: Parse VOD metadata (duration, FPS, resolution)
     2. Frame extraction: Detect minimap region (fixed bounding box or ML-based), extract at 1 fps
     3. Segment detection: Classify each frame (IN_ROUND, BETWEEN_ROUND, HALFTIME, BUY_PHASE, UNKNOWN)
     4. Deduplication: Skip frames identical to previous (reduce noise)
     5. Batch upload: Call Archival API `POST /v1/archive/frames` with frame batch
     6. Manifest: Store extraction job metadata (job_id, match_id, frame_count, manifest_id from Archival)
   - Async execution: FastAPI endpoint `POST /v1/extraction/jobs` triggers async task
   - Job tracking: PostgreSQL table `extraction_jobs` with status (pending, running, completed, failed)

3. **Frontend Component: Minimap Frame Grid**
   - Integration point: ROTAS (leaderboard) or OPERA (tournament bracket) hub
   - View: Paginated grid of frame thumbnails (50 frames per page)
   - Features:
     - Infinite scroll or pagination controls (next/prev page)
     - Frame zoom/lightbox (click to expand full-size)
     - Segment type badges (color-coded: red=IN_ROUND, green=BUY_PHASE, gray=BETWEEN_ROUND)
     - Verification badges (checkmark = TeneT verified, pending = awaiting verification)
     - Timestamp overlay (VOD timestamp in HH:MM:SS.mmm)
   - Data flow: TanStack Query hook `useMinimapFrames(matchId, page)` → Archival API
   - Caching: 5-min cache, SWR (stale-while-revalidate) pattern

4. **Data Model & Integration**
   - **New PostgreSQL table: extraction_jobs**
     - job_id, match_id, vod_source, extraction_status, frame_count, manifest_id, created_at, completed_at
     - Index on match_id, status
   - **Archival Integration:**
     - Extraction Service calls Archival `POST /v1/archive/frames` after frame extraction
     - Frontend calls Archival `GET /v1/archive/matches/{match_id}/frames?page=1&page_size=50`
   - **TeneT Integration:**
     - After verification, TeneT calls Archival `POST /v1/archive/frames/{frame_id}/pin` with reason="VERIFIED"
     - Frontend displays pin badges on verified frames

5. **API Endpoints (Extraction Service)**
   - `POST /v1/extraction/jobs` — Start extraction job (async)
     - Request: `{ match_id: UUID, vod_source: "local" | "s3", vod_path: str }`
     - Response: `{ job_id: UUID, status: "pending" }`
   - `GET /v1/extraction/jobs/{job_id}` — Poll job status
     - Response: `{ job_id, status: "running" | "completed" | "failed", frame_count: int, manifest_id: UUID, error: Optional[str] }`
   - (Frames themselves retrieved from Archival API, not here)

6. **Frontend Component: React Hook**
   - `useMinimapFrames(matchId: string, page: number = 1)`
   - Returns: `{ frames: ArchiveFrame[], isLoading, error, hasMore, nextPage() }`
   - Calls: `GET /v1/archive/matches/{matchId}/frames?page={page}&page_size=50`

7. **Delivery Phases**
   - **Phase 1 MVP:** Single-threaded extraction (local files), frame grid display, TaneT integration
   - **Phase 2:** S3/Cloud VOD source, parallel extraction workers
   - **Phase 3:** ML-based segment detection, advanced filtering UI

8. **Verification Approach**
   - Extraction Service tests: `pytest tests/unit/test_extraction_*.py` (mock OpenCV, FFmpeg)
   - Integration test: Extract sample VOD → Archival API → Verify manifest
   - Frontend tests: `npm run test` (React component snapshot, TanStack Query mock)
   - End-to-end: Extract → Archive → Frontend display (Playwright)
   - Lint: `ruff` (Python), `eslint` (TypeScript)
   - Type check: `mypy` (Python), `npm run typecheck` (TypeScript)

**Integration with 2/3/5+1,2,3 Framework:**
- **Pillar 1 (Road-Maps):** Spec maps to Phase 9 execution road-map (PHASE_GATES.md gates 9.Y, 9.Z)
- **Pillar 4 (MCP):** Spec defines API contracts, data flow boundaries, integration sequencing
- **Pillar 6 (Success Deliverables):** Each delivery phase maps to 3×3×3 grid
- **+3 Bonus:** Leverage existing hub architecture (ROTAS/OPERA); integrate with Archival System's audit logging

---

## Step 3: Planning

**Deliverable:** Updated `plan-minimap-feature.md` with implementation tasks

Create a detailed implementation plan with:

1. **Task Breakdown** (Phase 1 MVP as concrete units)
   - **Task 1:** PostgreSQL migration + extraction_jobs model
   - **Task 2:** FFmpeg + OpenCV pipeline (frame extraction, segment detection)
   - **Task 3:** Extraction Service API endpoint + async job dispatch
   - **Task 4:** React component: MinimapFrameGrid (pagination, grid, filtering)
   - **Task 5:** TanStack Query hook: useMinimapFrames
   - **Task 6:** Integration: Extraction → Archival API (frame upload, manifest handling)
   - **Task 7:** Integration: TeneT → Archival pinning on verification
   - **Task 8:** Unit tests (extraction pipeline, API, React component)
   - **Task 9:** Integration tests (cross-component workflows)
   - **Task 10:** Documentation (extraction guide, frontend integration guide)
   - **Task 11:** Hub integration (add MinimapFrameGrid to ROTAS or OPERA hub)

2. **Task Specification Template** (for each task)
   - **Gate Reference:** Link to PHASE_GATES.md gate (e.g., [Gate 9.5])
   - **Dependencies:** List prerequisite tasks (extraction service before frontend, archival before integration)
   - **Acceptance Criteria:** Specific, measurable outcomes
   - **Verification Steps:** Commands to run (pytest, npm test, Playwright E2E)
   - **Estimated Scope:** Lines of code, components affected

3. **Critical Sequencing: Archival System First**
   - **BLOCKER:** Tasks 6–7 (Archival integration) require Archival System to be completed
   - Recommendation: Run Archival System implementation in parallel, complete before Task 6
   - If running sequentially: Archival tasks 1–8 must finish before Extraction tasks 6–7 start

4. **Integration with 2/3/5+1,2,3:**
   - Each task cross-references a PHASE gate number
   - Auth classes applied: AGENT executes, CODEOWNER approves critical PRs (Archival integration)
   - Tiers respected: MASTER contracts (Archival API, data model), PHASE specs, WORK SESSION plans
   - +3 Bonus improvements: Hub architecture integration, async patterns, test coverage

5. **Approval Gate**
   - Plan must be reviewed by CODEOWNER before Implementation
   - User input required if Archival System completion timeline affects Minimap schedule

---

## Cross-Review Integration

**After creating spec-minimap-feature.md and plan-minimap-feature.md**, initiate a **2-pass cross-review using sonnet-4-6-think**:

### Cross-Review Pass 1: Specification Audit
**Focus:** Correctness, architecture alignment, integration safety, missing details

Run:
```
Use cross-review skill with sonnet-4-6-think model to review the changes.

Review instructions: Audit the technical specification for:
1. Correctness — Are FFmpeg/OpenCV pipelines correctly specified? Are React component patterns idiomatic?
2. Architecture alignment — Does extraction service follow NJZ async patterns? Does frontend integration use existing hub structure?
3. Integration safety — Are Archival API calls properly error-handled? Is frame deduplication logic sound?
4. Completeness — Are all 2 API endpoints specified? Are segment detection rules complete?
5. Missing details — Error handling, retry logic, frame validation, React loading states?
6. Risks — Performance risks (VOD parsing bottleneck), data risks (frame loss in batch upload), integration risks (Archival unavailability)?
7. Alternatives — Were simpler extraction approaches (ffmpeg only, no OpenCV) considered?

Format review as: Strengths | Gaps | Risks | Suggested Improvements
```

### Cross-Review Pass 2: Planning Audit
**Focus:** Task decomposition, Archival dependency management, feasibility in Phase 9

Run:
```
Use cross-review skill with sonnet-4-6-think model to review the changes.

Review instructions: Audit the implementation plan for:
1. Task decomposition — Are tasks appropriately sized? Is Task 6 (Archival integration) properly scoped?
2. Dependency ordering — Are prerequisites correct (Archival before Task 6–7)? Can tasks run in parallel safely?
3. Feasibility — Can this complete in Phase 9 assuming Archival System completes? What's the critical path?
4. Risk mitigation — How are Archival integration delays mitigated? Is there a fallback if Archival delays?
5. Test coverage — Does each task include unit + integration tests? Is E2E test planned?
6. 2/3/5+1,2,3 compliance — Are framework principles (gate linkage, CODEOWNER gates, bonus improvements) applied?

Format review as: Dependency Graph | Critical Path | Feasibility Score | Mitigation Strategies
```

---

## Handoff Checklist

Before handing off to Implementation agent:

- [ ] **spec-minimap-feature.md created** with all 8 sections
- [ ] **plan-minimap-feature.md created** with 11 concrete tasks
- [ ] **Cross-review Pass 1** completed on spec; gaps and risks documented
- [ ] **Cross-review Pass 2** completed on plan; dependency graph validated
- [ ] **Archival System status clarified** (parallel vs. sequential; completion date estimate)
- [ ] **CODEOWNER approval** obtained on final plans before Implementation begins

---

## Success Criteria for This Handoff

✅ **Technical Specification:**
- FFmpeg + OpenCV extraction pipeline fully specified (frame detection, segment classification)
- Extraction Service API endpoint specified (job dispatch, async handling)
- React MinimapFrameGrid component fully specified (pagination, filtering, verification badges)
- TanStack Query hook signature and data flow defined
- Archival API integration points identified (upload, query, pinning)
- All 3 integration workflows described (Extraction→Archival, TeneT→Archival, Frontend→Archival)

✅ **Implementation Plan:**
- 11 concrete tasks with gate references, dependencies, AC links, verification steps
- Phase 1 MVP scope clearly bounded (Phase 2/3 deferred)
- Archival System dependency explicitly managed (parallel or sequential, risk mitigation)
- Cross-review findings integrated (gaps closed, risks mitigated, alternatives justified)
- Ready for independent implementation without additional clarification

✅ **Framework Integration:**
- All 5 Pillars referenced (Road-Maps, Logic Trees, ACP, MCP, Notebooks)
- 2 Auth classes applied (AGENT execution, CODEOWNER approval)
- 3 Tiers respected (MASTER contracts, PHASE specs, WORK SESSION plans)
- +3 Bonus improvements identified (hub architecture, async patterns, integration safety)

---

## Files to Reference

- **AGENTS.md** — Project overview, hub architecture (ROTAS, OPERA)
- **MASTER_PLAN.md § Phase 9** — Current phase context
- **PHASE_GATES.md** — Gate structure for linking tasks
- **apps/web/src/hub-2-rotas/** or **hub-4-opera/** — Existing hub component structure
- **docs/API_V1_DOCUMENTATION.md** — Existing API patterns
- **packages/shared/api/routers/** — FastAPI endpoint patterns
- **tests/e2e/**.spec.ts** — Playwright E2E test structure
- **HANDOFF-ARCHIVAL-SYSTEM.md** — Archival prerequisite context

---

## Critical Note: Archival System Dependency

**This feature BLOCKS on Archival System completion.** Tasks 6–7 (Archival integration) cannot begin until:
1. Archival API endpoints are deployed and tested
2. Frame storage and deduplication confirmed working
3. Archival audit logging functional

**Mitigation strategies:**
- **Parallel execution:** Develop Tasks 1–5 while Archival executes (extraction, React components, APIs)
- **Mock integration:** Use mock Archival API for Tasks 6–7 until real API ready; swap later
- **Sequential execution:** Complete Archival System fully, then execute Tasks 1–11 in order

**Recommend:** Parallel execution with mock integration, then integration swap when Archival ready.

---

**Ready to proceed to Specification step?** Confirm and this chat will spawn a subagent to execute Steps 2–3.
