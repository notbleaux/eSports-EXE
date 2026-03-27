[Ver001.000]

# Implementation Plan — Minimap Extraction Service & Frontend [STUB]

**Status:** STUB — Agent task instructions integrated  
**Framework:** NJZPOF v0.2 · 2/3/5+1,2,3 compliance  
**Agent Instructions:** Replace placeholder tasks with concrete implementation tasks  
**Critical Blocker:** Tasks 7–9 depend on Archival System completion  
**Cross-Review Ready:** This stub is complete enough for Pass 2 audit  

---

## Overview

[AGENT: Provide 1–2 sentence summary of implementation strategy, parallel execution (1–6 while Archival develops), blocker management (Tasks 7–9).]

**Example:**

Phase 1 MVP implementation: 11 tasks spanning extraction pipeline (Tasks 1–3) → FastAPI job endpoints (Tasks 4) → React components (Tasks 5–6) → Archival integration (Tasks 7–9, BLOCKED) → testing & hub integration (Tasks 10–11). Tasks 1–6 can execute in parallel with Archival System development using mock API. Tasks 7–9 start when Archival API ready. Critical path: Task 1 → Task 4 → Task 5 → Task 11.

---

## Task Breakdown

[AGENT: Replace this table with 11 concrete implementation tasks. Clearly mark Archival blocker status.]

| Task # | Title | Gate Ref | Dependencies | AC Links | Verification Command | Blocker |
|--------|-------|----------|--------------|----------|---|---|
| 1 | PostgreSQL extraction_jobs table + SQLAlchemy model | [Gate 9.1] | None | Core | `pytest tests/unit/test_extraction_models.py -v` | ✅ Ready |
| 2 | FFmpeg + OpenCV extraction pipeline | [Gate 9.2] | Task 1 | Core | `pytest tests/unit/test_extraction_pipeline.py -v` | ✅ Ready |
| 3 | Segment type classification logic | [Gate 9.3] | Task 2 | Core | `pytest tests/unit/test_segment_classification.py -v` | ✅ Ready |
| 4 | FastAPI extraction jobs endpoints + async dispatch | [Gate 9.4] | Tasks 1–3 | Core | `pytest tests/unit/test_extraction_routes.py -v && curl http://localhost:8000/v1/docs` | ✅ Ready |
| 5 | React MinimapFrameGrid component (mock Archival data) | [Gate 9.5] | None | UI | `npm run test -- MinimapFrameGrid.test.tsx && npm run lint` | ✅ Ready |
| 6 | TanStack Query hook: useMinimapFrames (mock Archival API) | [Gate 9.6] | Task 5 | UI | `npm run test -- useMinimapFrames.test.ts && npm run typecheck` | ✅ Ready |
| 7 | Integration: Extraction Service → Archival API (frame upload) | [Gate 9.7] | Tasks 4, 6 | **Integration** | `pytest tests/integration/test_extraction_archival_upload.py -v` | ⏳ **BLOCKED ON ARCHIVAL** |
| 8 | Integration: Frontend → Archival API (frame query + real data) | [Gate 9.8] | Tasks 5, 6 | **Integration** | `npm run test -- MinimapFrameGrid.integration.test.tsx` | ⏳ **BLOCKED ON ARCHIVAL** |
| 9 | Integration: TeneT → Archival pinning workflow (verification badges) | [Gate 9.9] | Tasks 5, 7 | **Integration** | `npm run test -- VerificationBadge.integration.test.tsx && pytest test_tenet_pinning.py` | ⏳ **BLOCKED ON ARCHIVAL** |
| 10 | Unit + integration tests (all components) | [Gate 9.10] | Tasks 1–9 | Quality | `pytest tests/unit/test_*.py tests/integration/test_*.py -v && npm run test` | ✅ Ready after 1–9 |
| 11 | Hub integration (add MinimapFrameGrid to ROTAS or OPERA) | [Gate 9.11] | Tasks 5, 8 | Quality | `npm run build && npx playwright test minimap-hub-integration.spec.ts` | ✅ Ready after Task 8 |

---

## Blocker Status Legend

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Ready | No dependencies on Archival System | Start immediately |
| ⏳ BLOCKED | Depends on Archival API endpoints | Wait for Archival or use mock |
| ⏳ Ready after 1–9 | Depends on prior tasks | Start after prerequisites |

---

## Task Details Template

[AGENT: For each task above, expand with full specification using this template:]

### Task N: [Title]

**Gate Reference:** [Gate N.M]  
**Status:** PENDING (mark PASSED after verification command succeeds)  
**Blocker Status:** [✅ Ready / ⏳ BLOCKED]

**Purpose:**  
[AGENT: 1–2 sentence description. What does this task deliver?]

**Acceptance Criteria Addressed:**  
[AGENT: List AC numbers (AC-01, AC-02, etc.)]

**Dependencies:**  
[AGENT: List task numbers. Format: "None" or "Task X" or "Tasks X, Y, Z"]

**Implementation Approach:**  
[AGENT: Describe HOW. Reference existing codebase. Pseudocode or structure outline.]

**Files Affected:**  
[AGENT: List files created/modified with LOC estimates]

**Estimated Scope:**  
[AGENT: Lines of code, complexity]

**Verification Command:**  
[AGENT: Specific, executable command (copy-pasteable)]

**Edge Cases & Error Handling:**  
[AGENT: What could go wrong? Fallback strategies?]

**Example:**

```markdown
### Task 4: FastAPI Extraction Jobs Endpoints + Async Dispatch

**Gate Reference:** [Gate 9.4]  
**Status:** PENDING  
**Blocker Status:** ✅ Ready

**Purpose:**  
Create FastAPI endpoints for job creation and status polling. Trigger async frame extraction tasks. Foundation for job management and frontend integration.

**Acceptance Criteria Addressed:**  
Core extraction workflow

**Dependencies:**  
Tasks 1–3 (database schema, pipeline, classification)

**Implementation Approach:**  
1. Create `packages/shared/api/routers/extraction.py`
2. Implement endpoints:
   - POST /v1/extraction/jobs (create job, dispatch async task)
   - GET /v1/extraction/jobs/{job_id} (poll status)
3. Use asyncio.create_task() to dispatch extraction pipeline
4. Update extraction_jobs status as pipeline progresses (pending → running → completed)
5. Handle errors: return 503 if extraction fails, log reason

**Files Affected:**  
- `packages/shared/api/routers/extraction.py` (new, ~200 LOC)
- `packages/shared/api/services/extraction_service.py` (new, ~150 LOC for async dispatch)
- `packages/shared/api/main.py` (modified, +import router)

**Estimated Scope:**  
~350 LOC, Medium complexity

**Verification Command:**  
```bash
pytest tests/unit/test_extraction_routes.py -v
curl -X POST http://localhost:8000/v1/extraction/jobs \
  -H "Content-Type: application/json" \
  -d '{"match_id": "...", "vod_source": "local", "vod_path": "/tmp/test.mp4"}'
curl http://localhost:8000/v1/docs  # Verify endpoints in Swagger
ruff check packages/shared/api/routers/extraction.py
mypy packages/shared/api/routers/extraction.py --strict
```

**Edge Cases & Error Handling:**  
- Invalid VOD path: 400 Bad Request with clear error
- Extraction crashes: 503 Service Unavailable, log error to extraction_jobs.error_message
- Async task dispatch: ensure task is created, not blocking request
- Concurrent jobs: multiple extractions on same match allowed (separate job_ids)
```

---

## Critical Path Analysis

[AGENT: Identify which tasks block others. Show parallel execution opportunities.]

**Example:**

```markdown
### Dependency Graph

Task 1 (extraction_jobs table)
  ├─ Task 2 (FFmpeg pipeline)
  │  └─ Task 3 (Segment classification)
  │     └─ Task 4 (FastAPI endpoints)
  │        └─ Task 7 (Archival upload integration) ⏳ BLOCKED
  │
  └─ Task 5 (React component) [PARALLEL with 2–4]
     └─ Task 6 (TanStack Query hook) [PARALLEL with 5]
        ├─ Task 8 (Archival query integration) ⏳ BLOCKED
        └─ Task 11 (Hub integration) [after Task 8]

  Task 9 (TeneT pinning) ⏳ BLOCKED [depends on Tasks 5, 7]
  Task 10 (All tests) [depends on 1–9]

### Critical Path (Sequential Minimum)
Task 1 → Task 4 → Task 10 (5 days minimum)

### Parallel Execution (Recommended)
- Tasks 1–3: Extraction pipeline (serial, 3 days)
- Tasks 5–6: React component (parallel with 1–3, 2 days)
- Task 4: Endpoints (1 day, after Task 3)
- Tasks 7–9: Archival integration (BLOCKED, wait for Archival ~2 days)
- Task 10: All tests (1 day, after Tasks 1–9)
- Task 11: Hub integration (1 day, after Task 8)

**Total with Archival on time:** 8–9 days (parallel execution)  
**Total if Archival delays:** Tasks 1–6 complete (6 days), defer 7–9 (contingency swap when Archival ready)
```

---

## Blocker Mitigation Strategy

[AGENT: Document how to handle Archival System blocking Tasks 7–9.]

```markdown
### Immediate Action: Mock Archival API

**Before Tasks 7–9 start**, create mock implementation:

```python
# tests/mocks/mock_archival_api.py
class MockArchivalAPI:
    async def upload_frames(self, frames: List[dict]) -> dict:
        return {
            "frame_ids": [str(uuid4()) for _ in frames],
            "manifest_id": str(uuid4()),
            "duplicates_skipped": 0
        }
    
    async def query_frames(self, match_id: str, page: int) -> dict:
        return {
            "frames": [
                {
                    "id": str(uuid4()),
                    "storage_url": "mock://image.jpg",
                    "timestamp_ms": 1000 * i,
                    "segment_type": "IN_ROUND",
                    "is_pinned": False,
                }
                for i in range(50)
            ],
            "total_count": 1800,
            "page": page,
            "page_size": 50,
            "has_more": page < 36
        }
```

**Tasks 5–6 Development with Mock:**
- Frontend uses mock ArchivalAPI for frame display
- Tests pass with mock data
- React components fully tested

**Task 7–9 Swap Strategy:**
1. When Archival API ready: replace mock → real implementation in extraction_service.py
2. Verify frame upload works: POST /v1/archive/frames succeeds
3. Verify frame query works: GET /v1/archive/matches/{match_id}/frames succeeds
4. Swap mock ArchivalAPI → real httpx client in useMinimapFrames hook
5. Re-run integration tests (should pass identically)

**Estimated swap time:** <2 hours (find & replace, test)

### Archival ETA

**Target completion for Archival System:** _________________ (CODEOWNER to provide)

**If on time (by 2026-03-29):**
- Complete Tasks 1–6 with mock (2026-03-28)
- Swap Tasks 7–9 real API (2026-03-29 afternoon)
- Full integration testing (2026-03-30)

**If delayed (past 2026-03-30):**
- Complete Tasks 1–6 with mock by 2026-03-30 (end of Phase 9)
- Defer Tasks 7–9 to Phase 9 continuation session
- Swap when Archival ready
- Integration testing in continuation session
```

---

## Framework Integration Checklist

**2/3/5+1,2,3 Compliance:**

- [ ] **Every task has [Gate N.M] reference**
- [ ] **Every task links to AC criteria**
- [ ] **Blocker status clearly marked** (✅ Ready vs. ⏳ BLOCKED)
- [ ] **Mitigation strategy documented** (mock API swap)
- [ ] **Dependencies documented clearly** (no circular deps, critical path identified)
- [ ] **Parallel execution opportunities identified** (Tasks 1–6 parallel)
- [ ] **Framework pillars referenced:**
  - Road-Maps: Gate linkage ✅
  - Logic Trees: Dependency graph + blocker management ✅
  - ACP: Handoff documented ✅
  - MCP: Archival contracts respected ✅
  - Notebook/TODO: This plan IS session TODO ✅

---

## Approval Gate

**Before Implementation begins:**

- [ ] **All 11 tasks fully specified**
- [ ] **Blocker status clear** (Tasks 7–9 marked BLOCKED with mitigation)
- [ ] **Mock API strategy confirmed** (for Tasks 5–6 testing)
- [ ] **Archival ETA provided** (by CODEOWNER)
- [ ] **Critical path identified**
- [ ] **Framework compliance verified**
- [ ] **CODEOWNER approval obtained**

---

## Cross-Review Readiness

[AGENT: This stub is ready for cross-review. Pass 2 audit will check:]

✅ **Task decomposition** — Appropriately sized?  
✅ **Dependency ordering** — Prerequisites correct? Circular deps?  
✅ **Gate linkage** — Every task has [Gate N.M]?  
✅ **Blocker management** — Archival dependency properly handled? Mock API strategy sound?  
✅ **Feasibility** — Can all 11 tasks complete in Phase 9 (with Archival blocker)?  
✅ **Framework compliance** — 2/3/5+1,2,3 principles applied?  

**Cross-Review Invocation:**
After finalizing plan-minimap-feature.md, run CROSS-REVIEW-TEMPLATE-2026-03-27.md Pass 2 with sonnet-4-6-think.

---

## Success Criteria Summary

✅ **Plan completeness:**
- 11 concrete tasks with gate refs
- Every task links to AC criteria
- Blocker status clearly marked
- Verification commands executable
- Critical path identified
- Parallel execution opportunities identified
- Mock API mitigation strategy documented

✅ **Ready for Implementation:**
- No ambiguity (agents can start immediately)
- No unresolved gates
- Archival blocker managed (mock API + swap strategy)
- CODEOWNER approval obtained

---

*This stub expires 2026-03-30. Replace with finalized plan-minimap-feature.md after cross-review completion.*
