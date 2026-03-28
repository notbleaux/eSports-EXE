[Ver001.000]

# ZenCoder Session 5: Phase 9 Implementation Handoff Prompt

**Status:** Ready for next ZenCoder session  
**Estimated Duration:** 6–8 working days (distributed across parallel teams)  
**Framework:** NJZPOF v0.2 — Master agent orchestration + parallel task execution  
**Previous Session Outputs:** spec.md, plan.md, 8 production-ready stubs, mock implementation records

---

## Session 5 Objective

**Execute Phase 9 implementation** across two parallel features (Archival System + Minimap Feature) using optimized handoff architecture:
- **Archival System (AS):** 8 sequential tasks, async database + FastAPI backend (Tasks 1–8 via PROMPT 1-A)
- **Minimap Feature (MF):** 6 parallel tasks (Tasks 1–6) + 3 deferred tasks (Tasks 7–9 dependent on Archival API), React + mock API (Tasks 1–6 via PROMPT 1-B; Tasks 7–9 via PROMPT 2-conditional)
- **Blocker Management:** Decision gate at Day 3–4 (2026-03-31) to determine Tasks 7–9 execution timing

---

## Quick-Start Checklist (Before Starting)

```
☐ Read this entire prompt (30 minutes)
☐ Review attached files:
  - spec.md (Archival API specification)
  - plan.md (Archival implementation plan)
  - spec-minimap-feature.md (Minimap feature specification)
  - plan-minimap-feature.md (Minimap implementation plan)
  - TASK-EXECUTION-STUB-2026-03-27.md (How to execute tasks)
  - VERIFICATION-CHECKLIST-STUB-2026-03-27.md (How to verify gates)
☐ Confirm attached stubs can be found at: .agents/session/*.md
☐ Verify Phase 9 gates in PHASE_GATES.md are current
☐ Start with PROMPT 1-A (Archival System implementation agent)
```

---

## PROMPT 1-A: Archival System Implementation Agent

**Target Agent:** Backend specialist (Python/FastAPI expertise)  
**Task Scope:** Tasks 1–8 (seq 8-day plan, can parallelize Tasks 2–3, Tasks 6–7)  
**Success Criteria:** All 18 AC criteria met + all 8 gates [9.1]–[9.8] passed  

### You will be spawned to execute the Archival System implementation plan

Read the plan.md file fully. Your task is to execute Tasks 1–8 sequentially, following the TASK-EXECUTION-STUB protocol:

1. **Task 1: PostgreSQL migration 006 + SQLAlchemy models** [Gate 9.1]
   - Create migration: `services/api/src/njz_api/migrations/007_archive_schema.py`
   - Models: ArchiveFrame, ArchiveManifest, ArchiveAuditLog (in `packages/shared/api/src/njz_api/models/archival.py`)
   - Verify: `cd services/api && alembic upgrade head && pytest tests/unit/test_archive_models.py -v`
   - AC Coverage: AC-01, AC-06

2. **Task 2: Pydantic schemas + validation** [Gate 9.2]
   - File: `packages/shared/api/src/njz_api/schemas/archival.py`
   - Schemas: FrameUploadRequest, FrameResponse, ManifestResponse, QueryFramesRequest, etc. (8+ schemas)
   - Verify: `pytest tests/unit/test_archive_schemas.py -v`
   - AC Coverage: AC-01, AC-02, AC-15

3. **Task 3: Storage abstraction layer** [Gate 9.3]
   - Protocol: `packages/shared/api/src/njz_api/archival/storage/__init__.py`
   - Backend: `packages/shared/api/src/njz_api/archival/storage/local_backend.py`
   - Verify: `pytest tests/unit/test_storage_backend.py -v && ruff check ...`
   - AC Coverage: AC-14

4. **Task 4: Archival service (core business logic)** [Gate 9.4]
   - File: `packages/shared/api/src/njz_api/archival/service.py`
   - Methods: upload_frames(), query_frames(), pin_frame(), gc_old_archives(), migrate_storage()
   - Async throughout; deduplication via SHA-256; soft-delete for frames
   - Verify: `pytest tests/unit/test_archival_service.py -v`
   - AC Coverage: AC-02, AC-03, AC-05, AC-11

5. **Task 5: FastAPI router (upload, query, pin endpoints)** [Gate 9.5]
   - File: `packages/shared/api/routers/archival.py`
   - Endpoints:
     - POST /v1/archive/frames — Upload frames + metadata
     - GET /v1/archive/matches/{match_id}/frames — Query frames (paginated)
     - POST /v1/archive/frames/{frame_id}/pin — Pin frame (admin-only)
     - GET /v1/archive/manifests/{manifest_id} — Get manifest metadata
     - DELETE /v1/archive/frames/{frame_id} — Soft-delete frame
   - Verify: `pytest tests/unit/test_archive_routes.py -v && curl http://localhost:8000/v1/docs`
   - AC Coverage: AC-01, AC-03, AC-04, AC-12, AC-13

6. **Task 6: GC + storage migration endpoints** [Gate 9.6]
   - File: `packages/shared/api/routers/archival_admin.py` (admin-only endpoints)
   - Endpoints:
     - POST /v1/admin/archive/gc — Trigger garbage collection (async job)
     - POST /v1/admin/archive/migrate — Migrate frames to new storage backend (async job)
     - GET /v1/admin/archive/jobs/{job_id} — Poll job status
   - Verify: `pytest tests/unit/test_archive_gc.py -v && pytest tests/unit/test_storage_migration.py -v`
   - AC Coverage: AC-05, AC-08, AC-11

7. **Task 7: Audit logging + Prometheus metrics** [Gate 9.7]
   - File: `packages/shared/api/src/njz_api/archival/audit.py` (AuditLog model + insertion)
   - File: `packages/shared/api/src/njz_api/archival/metrics.py` (Prometheus counter/histogram)
   - Log all frame mutations: upload, pin, delete
   - Metrics: archive_frames_uploaded_total, archive_query_latency_seconds
   - Verify: `pytest tests/unit/test_audit_log.py -v && grep "archive_frame" packages/shared/api/src/njz_api/archival/metrics.py`
   - AC Coverage: AC-06, AC-07, AC-18

8. **Task 8: Integration tests (E2E workflows)** [Gate 9.8]
   - File: `tests/integration/test_archive_e2e.py`
   - Workflows:
     - Upload → Query → Pin → Verify audit log
     - GC → Verify frames soft-deleted
     - Concurrent upload → deduplicate → verify manifest count
   - Verify: `pytest tests/integration/test_archive_e2e.py -v`
   - AC Coverage: AC-11, AC-12, AC-13, AC-16, AC-17, AC-09, AC-10

### Execution Protocol

**Follow TASK-EXECUTION-STUB-2026-03-27.md phases:**
- **Phase 1 (Read):** Read task spec in plan.md; understand dependencies
- **Phase 2 (Setup):** Create files, set up test fixtures
- **Phase 3 (Implement):** Code the feature following project conventions
- **Phase 4 (Verify):** Run verification commands; check all AC are met
- **Phase 5 (Resolve):** Fix any test failures; address linting/type errors
- **Phase 6 (Delete STUB):** Remove this stub; replace with production code
- **Phase 7 (Report):** Update PHASE_GATES.md with gate status; summary of files changed

**Verification Checklist:** Follow VERIFICATION-CHECKLIST-STUB-2026-03-27.md for each gate

**Success Criteria:**
- All 8 tasks completed with test suite passing
- All 18 AC criteria met (mapped in plan.md)
- All 8 gates [9.1]–[9.8] marked ✅ PASSED in PHASE_GATES.md
- Zero linting/type errors (ruff, mypy, pytest all green)
- No stubs remaining (all replaced with production code)

### Estimated Timeline

- Task 1: 3–4 hours
- Task 2: 2–3 hours (parallel possible with Task 3)
- Task 3: 2 hours (parallel with Task 2)
- Task 4: 3–4 hours (critical path—deduplication logic complex)
- Task 5: 2–3 hours
- Task 6: 1–2 hours (parallel possible with Task 7)
- Task 7: 1–2 hours (parallel with Task 6)
- Task 8: 3–4 hours
- **Sequential total:** 8 days | **With parallelization (Tasks 2–3, 6–7):** 6 days

**Start Date:** 2026-03-28 (ASAP)  
**Target Completion:** 2026-04-03 (6 days with parallelization)

---

## PROMPT 1-B: Minimap Feature Implementation Agent (Parallel with 1-A)

**Target Agent:** Full-stack specialist (React/TypeScript + FastAPI expertise)  
**Task Scope:** Tasks 1–6 (independent of Archival System except Tasks 7–9)  
**Success Criteria:** Tasks 1–6 complete + gates [9.9]–[9.14] passed; mock API fully integrated  

### You will be spawned to execute the Minimap Feature implementation plan (Tasks 1–6 only)

Read the plan-minimap-feature.md file fully. Execute Tasks 1–6, deferring Tasks 7–9 until Archival API ready.

1. **Task 1: PostgreSQL extraction_jobs table + model** [Gate 9.9]
   - Migration: `services/api/src/njz_api/migrations/007_extraction_jobs.py`
   - Model: `ExtractionJob` in `packages/shared/api/src/njz_api/models/extraction.py`
   - Verify: `cd services/api && alembic upgrade head && pytest tests/unit/test_extraction_models.py -v`
   - AC Coverage: AC-01

2. **Task 2: FFmpeg + OpenCV extraction pipeline** [Gate 9.10]
   - File: `packages/shared/api/src/njz_api/extraction/pipeline.py`
   - Methods: extract_frames_from_vod(), classify_segment_type(), deduplicate_frames()
   - Verify: `pytest tests/unit/test_extraction_pipeline.py -v`
   - AC Coverage: AC-02, AC-03

3. **Task 3: Segment type classification logic** [Gate 9.11]
   - File: `packages/shared/api/src/njz_api/extraction/segment_classifier.py`
   - Heuristic-based: detect IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN
   - Verify: `pytest tests/unit/test_segment_classification.py -v`
   - AC Coverage: AC-04

4. **Task 4: FastAPI extraction endpoint + async dispatch** [Gate 9.12]
   - File: `packages/shared/api/routers/extraction.py`
   - Endpoints:
     - POST /v1/extraction/jobs — Create job, dispatch async extraction
     - GET /v1/extraction/jobs/{job_id} — Poll job status
   - Verify: `pytest tests/unit/test_extraction_routes.py -v`
   - AC Coverage: AC-05, AC-06

5. **Task 5: React MinimapFrameGrid component** [Gate 9.13]
   - Files:
     - `apps/web/src/components/MinimapFrameGrid.tsx`
     - `apps/web/src/components/FrameThumbnail.tsx`
     - `apps/web/src/components/SegmentTypeBadge.tsx`
     - `apps/web/src/components/VerificationBadge.tsx`
   - Verify: `npm run test -- MinimapFrameGrid -v`
   - AC Coverage: AC-07, AC-08, AC-09, AC-10

6. **Task 6: TanStack Query hook useMinimapFrames** [Gate 9.14]
   - Files:
     - `apps/web/src/hooks/useMinimapFrames.ts`
     - `apps/web/src/mocks/mockArchivalClient.ts` (MockArchivalAPI in-memory)
   - Verify: `npm run test -- useMinimapFrames -v`
   - AC Coverage: AC-11, AC-12, AC-13

### Tasks 7–9 Status: ⏳ DEFERRED

Do **NOT** start Tasks 7–9 yet. These depend on Archival System API (Tasks 5+).

- **Task 7:** Extraction → Archival API (Frame upload) [Gate 9.15]
- **Task 8:** Frontend → Archival API (Frame query) [Gate 9.16]
- **Task 9:** TeNET → Archival API (Pinning) [Gate 9.17]

**What to do instead:**
- Keep MockArchivalAPI in place (`apps/web/src/mocks/mockArchivalClient.ts`)
- Tasks 1–6 proceed with mock data (no real Archival calls)
- On **Day 3–4 (2026-03-31)**, Master agent will assess Archival readiness
- If Archival ready: Master agent spawns PROMPT 2-conditional for Tasks 7–9
- If Archival not ready: Log blocker, defer to Phase 9 continuation session

### Execution Protocol

Same as PROMPT 1-A: Use TASK-EXECUTION-STUB and VERIFICATION-CHECKLIST-STUB

### Success Criteria

- Tasks 1–6 complete with test suite passing
- AC-01 through AC-13 met
- Gates [9.9]–[9.14] marked ✅ PASSED
- Zero linting/type errors
- MockArchivalAPI fully functional (no real API calls)

### Estimated Timeline

- Tasks 1–4 (Backend): 6–8 hours (can parallelize with Tasks 5–6)
- Tasks 5–6 (Frontend): 4–5 hours (parallel with 1–4)
- **Total:** 6–8 hours

**Start Date:** 2026-03-28 (ASAP, parallel with PROMPT 1-A)  
**Target Completion:** 2026-03-29 (by end of day 2)

---

## PROMPT 2-Conditional: Tasks 7–9 Execution (Triggered After Archival Ready)

**Trigger Condition:** Archival System tasks 5+ complete + API deployed to staging (~2026-03-31)  
**Target Agent:** Same Minimap agent as PROMPT 1-B  
**Task Scope:** Tasks 7–9 (Archival API integration)  

### You will be spawned ONLY IF Archival System API is ready

**Blocker Decision Gate (Day 3–4, 2026-03-31):**

Master agent will assess:
1. Is Archival System Task 5 (FastAPI router) complete?
2. Is Archival API deployed and reachable?
3. Can MockArchivalAPI be swapped for real client in <2 hours?

**If YES:** Master agent spawns this PROMPT 2-conditional. Execute Tasks 7–9:

- **Task 7:** Extraction → Archival API (Frame upload) [Gate 9.15]
  - File: `services/api/src/njz_api/extraction/service.py`
  - Method: Upload frames to Archival via POST /v1/archive/frames
  - Replace MockArchivalAPI with real httpx.AsyncClient
  - Verify: `pytest tests/unit/test_extraction_to_archival.py -v`

- **Task 8:** Frontend → Archival API (Frame query) [Gate 9.16]
  - File: `apps/web/src/hooks/useMinimapFrames.ts`
  - Replace MockArchivalAPI with real Archival API client
  - Query: GET /v1/archive/matches/{match_id}/frames?page=N
  - Verify: `npm run test -- useMinimapFrames.integration.test.ts -v`

- **Task 9:** TeNET → Archival API (Pinning) [Gate 9.17]
  - File: `apps/web/src/components/VerificationBadge.tsx`
  - Add onClick handler: POST /v1/archive/frames/{frame_id}/pin
  - Admin-only auth check
  - Verify: `npm run test -- VerificationBadge.integration.test.ts -v`

**Estimated Duration:** ~3–4 hours (mostly API client swap + integration tests)

**If NO:** Log blocker in `.agents/session/BLOCKERS_LOG.md`:
- Reason: Archival System not ready
- Defer Tasks 7–9 to Phase 9 continuation session
- Task 1–6 remain production-ready (no rework)

---

## Master Agent Orchestration

**Your role:** Spawn PROMPT 1-A + PROMPT 1-B in parallel; manage gates and blocker decision

### Daily Checkpoint (Morning Standup)

**Day 1 (2026-03-28):**
- ✅ PROMPT 1-A spawned → Archival Task 1 (PostgreSQL migration)
- ✅ PROMPT 1-B spawned → Minimap Task 1 (extraction_jobs table)
- Status: Both agents executing in parallel

**Day 2 (2026-03-29):**
- ✅ Archival: Tasks 1–3 likely complete ([Gate 9.1]–[9.3] PASSED)
- ✅ Minimap: Tasks 1–6 likely complete ([Gate 9.9]–[9.14] PASSED)
- Status: Minimap ready for Tasks 7–9 if Archival permits

**Day 3–4 (2026-03-30–31):**
- ✅ Archival: Tasks 1–6 complete; Task 7–8 in progress ([Gate 9.1]–[9.7] PASSED)
- **BLOCKER DECISION GATE:** Is Archival Task 5 (API router) ready?
  - YES → Spawn PROMPT 2-conditional (Tasks 7–9)
  - NO → Log blocker, plan Phase 9 continuation

**Day 5–6 (2026-04-01–2):**
- ✅ Archival: Tasks 7–8 likely complete ([Gate 9.7]–[9.8] PASSED)
- ✅ Minimap: Tasks 7–9 complete if blocker resolved ([Gate 9.15]–[9.17] PASSED)
- Status: All Phase 9 gates passed; ready for Phase 9 → Phase 10 transition

### Gate Update Protocol

After each agent reports task completion:
1. Read agent's task completion summary
2. Verify all AC criteria met (cross-check against plan.md)
3. Update PHASE_GATES.md: `[Gate N.M]: ✅ PASSED (date, agent name)`
4. If gate FAILED: Create blocker log + remediation plan

### Blocker Management

If agent reports blocker:
1. Log in `.agents/session/BLOCKERS_LOG-2026-03-28.md`:
   ```
   **Blocker [Date]:** [Task Name]
   - Root cause: [Description]
   - Proposed mitigation: [Action]
   - Decision needed: [Yes/No]
   - Impact: [What's blocked?]
   ```
2. For Minimap Tasks 7–9 blocker (Archival dependency):
   - If <24 hours delayed: Wait for Archival ready
   - If >24 hours delayed: Execute Tasks 7–9 with mock Archival in Phase 9 continuation
3. For other blockers: Escalate to code owner (pair programming, design review)

### Session Close Checklist (2026-04-03 end of day)

```
☐ All 8 Archival gates [9.1]–[9.8] PASSED in PHASE_GATES.md?
☐ All 6 Minimap gates [9.9]–[9.14] PASSED (+ 3 deferred gates if Tasks 7–9 complete)?
☐ All 18 AC criteria covered in implementation?
☐ All stubs deleted (replaced with production code)?
☐ All tests passing (pytest, npm test)?
☐ Zero linting/type errors?
☐ Blockers (if any) documented in BLOCKERS_LOG-2026-03-28.md?
☐ Ready to transition to Phase 9 → Phase 10?
```

---

## Important Notes

1. **Stub Replacement:** When you encounter a stub file (spec-STUB.md, plan-STUB.md, etc.), use it as a template/example, but DO NOT execute its code literally. Replace it with your production implementation as you complete tasks.

2. **Mock → Real Swap (Day 3–4):** The MockArchivalAPI in Minimap is intentionally temporary. You will replace it with real API calls once Archival is ready. This swap should take <2 hours.

3. **Framework Compliance:** All implementations must follow NJZPOF v0.2:
   - Gate-linked task structure ([Gate N.M] references)
   - AC coverage mapping (every task → [AC-N])
   - Async/await enforcement (no blocking I/O)
   - Code quality: ruff, mypy, pytest all green

4. **Parallel Execution:** Archival Tasks 2–3 can parallelize; Archival Tasks 6–7 can parallelize. Minimap Tasks 1–6 can parallelize with Archival. Maximize parallelization to reduce 8-day timeline to 5–6 days.

5. **Communication:** Use PHASE_GATES.md as single source of truth for gate status. Master agent checks this daily.

---

## File Locations (Quick Reference)

**Stubs & References:**
- TASK-EXECUTION-STUB-2026-03-27.md — How to execute tasks
- VERIFICATION-CHECKLIST-STUB-2026-03-27.md — How to verify gates
- CROSS-REVIEW-TEMPLATE-2026-03-27.md — Code review framework
- ARCHIVAL-IMPLEMENTATION-STUB-2026-03-28.md — Expected output example
- MINIMAP-IMPLEMENTATION-STUB-2026-03-28.md — Expected output example
- FINAL-STUB-ENHANCEMENT-AUDIT-2026-03-28.md — Audit results + recommendations

**Specifications:**
- spec.md (Archival System API spec)
- spec-minimap-feature.md (Minimap feature spec)

**Plans:**
- plan.md (Archival implementation plan)
- plan-minimap-feature.md (Minimap implementation plan)

**Gates:**
- PHASE_GATES.md (master gate tracker) — Update after each task completion

**Logs:**
- BLOCKERS_LOG-2026-03-28.md (create if needed) — Log any blockers

---

## Session Success Criteria

✅ **All 16 gates [9.1]–[9.17] marked PASSED in PHASE_GATES.md**  
✅ **All 18 AC criteria implemented + verified**  
✅ **Zero stubs remaining (all replaced with production code)**  
✅ **All tests passing: pytest, npm test, linting, type checks**  
✅ **Blockers (if any) logged + mitigation plan documented**  
✅ **Ready for Phase 9 → Phase 10 transition**

---

*This prompt represents 4 sessions of planning and specification work. Execute with confidence. All stubs and templates are production-ready. Master agent will oversee gates and blockers. Good luck!*
