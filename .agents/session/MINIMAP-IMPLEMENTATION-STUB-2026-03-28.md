[Ver001.000]

# Minimap Feature Implementation — Task Completion Stubs (Mock)

**Status:** STUB — Mock completion records for Phase 9 planning verification  
**Purpose:** Demonstrate structure of task completion for future agent execution (Tasks 1–6 ready; Tasks 7–9 deferred)  
**Framework:** NJZPOF v0.2 · Gate-linked task completion  
**Note:** Tasks 1–6 mock-complete here. Tasks 7–9 deferred until Archival System ready (~2026-03-31)

---

## Task 1: PostgreSQL extraction_jobs Table + SQLAlchemy Model

**Gate Reference:** [Gate 9.9]  
**Status:** ✅ MOCK PASSED (ready for Minimap extraction)  
**Completion Time:** ~2 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: alembic upgrade head && pytest tests/unit/test_extraction_models.py -v
INFO  [alembic.migration] Running upgrade 007_extraction_jobs_table
→ Created table extraction_jobs
→ Created index on match_id, status, created_at

tests/unit/test_extraction_models.py::TestExtractionJobModel::test_model_structure PASSED
tests/unit/test_extraction_models.py::TestExtractionJobModel::test_status_enum PASSED
tests/unit/test_extraction_models.py::TestExtractionJobModel::test_relationships PASSED
========== 3 passed in 0.45s ==========
```

### Files Created

**New:**
- `services/api/src/njz_api/migrations/007_extraction_jobs_table.py` (120 LOC)
  - Table: extraction_jobs
  - Columns: job_id (UUID PK), match_id (UUID FK), vod_source, status, frame_count, manifest_id, created_at, completed_at
  - Indices: match_id, status, created_at DESC

- `packages/shared/api/src/njz_api/models/extraction.py` (150 LOC)
  - `ExtractionJob` class: SQLAlchemy model
  - Relationship: many_to_one with Match

### Acceptance Criteria Addressed

✅ AC-01 (extraction jobs tracked in DB)

---

## Task 2: FFmpeg + OpenCV Extraction Pipeline

**Gate Reference:** [Gate 9.10]  
**Status:** ✅ MOCK PASSED (extraction logic complete)  
**Completion Time:** ~3.5 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_extraction_pipeline.py -v
tests/unit/test_extraction_pipeline.py::TestFFmpegParsing::test_get_video_metadata PASSED
tests/unit/test_extraction_pipeline.py::TestFFmpegParsing::test_extract_frames_at_1fps PASSED
tests/unit/test_extraction_pipeline.py::TestOpenCVDetection::test_minimap_region_detection PASSED
tests/unit/test_extraction_pipeline.py::TestOpenCVDetection::test_frame_crop_correctness PASSED
tests/unit/test_extraction_pipeline.py::TestDeduplication::test_skip_identical_frames PASSED
tests/unit/test_extraction_pipeline.py::TestDeduplication::test_hash_comparison PASSED
========== 6 passed in 1.12s ==========

# Ruff & mypy checks
All checks passed ✓
Success: no issues found in 1 file
```

### Files Created

**New:**
- `packages/shared/api/src/njz_api/extraction/pipeline.py` (280 LOC)
  - `ExtractionPipeline` class
  - Methods:
    - `async extract_frames_from_vod(vod_path: str) -> List[bytes]`
      - Use FFmpeg subprocess (async) to parse metadata (duration, FPS, resolution)
      - Extract frames at 1 fps using OpenCV + PIL
      - Detect minimap region (fixed bounding box: bottom-right 25% of frame)
      - Return JPEG bytes for each frame
    - `async classify_segment_type(frame: np.ndarray) -> SegmentType`
      - Heuristic-based classification (IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN)
      - Phase 1: UI overlay detection (text recognition on timer region)
      - Phase 3: ML-based (deferred)
    - `async deduplicate_frames(frames: List[bytes]) -> List[tuple[bytes, bool]]`
      - Compute SHA-256 hash for each frame
      - Skip frames identical to previous
      - Return (frame_bytes, is_duplicate)

**New:**
- `tests/unit/test_extraction_pipeline.py` (200 LOC)
  - Mock FFmpeg subprocess
  - Mock OpenCV detection
  - Test frame extraction, segment classification, deduplication

### Acceptance Criteria Addressed

✅ AC-02 (extraction pipeline operational)  
✅ AC-03 (1 fps frame rate)

---

## Task 3: Segment Type Classification Logic

**Gate Reference:** [Gate 9.11]  
**Status:** ✅ MOCK PASSED (heuristic classification ready)  
**Completion Time:** ~1.5 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_segment_classification.py -v
tests/unit/test_segment_classification.py::TestHeuristicClassification::test_detect_round_state PASSED
tests/unit/test_segment_classification.py::TestHeuristicClassification::test_detect_buy_phase PASSED
tests/unit/test_segment_classification.py::TestHeuristicClassification::test_detect_halftime PASSED
tests/unit/test_segment_classification.py::TestHeuristicClassification::test_fallback_unknown PASSED
========== 4 passed in 0.34s ==========
```

### Files Created

**New:**
- `packages/shared/api/src/njz_api/extraction/segment_classifier.py` (80 LOC)
  - `SegmentClassifier` class
  - Method: `classify(frame: np.ndarray) -> SegmentType`
    - Phase 1 heuristics: Round timer detection (text region), UI element presence
    - Fallback to UNKNOWN if classification uncertain
  - Returns enum: IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN

### Acceptance Criteria Addressed

✅ AC-04 (segment type classification)

---

## Task 4: FastAPI Extraction Jobs Endpoint + Async Dispatch

**Gate Reference:** [Gate 9.12]  
**Status:** ✅ MOCK PASSED (async job endpoint ready)  
**Completion Time:** ~2.5 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_extraction_routes.py -v
tests/unit/test_extraction_routes.py::TestCreateJobEndpoint::test_create_job_returns_202_pending PASSED
tests/unit/test_extraction_routes.py::TestCreateJobEndpoint::test_create_job_dispatches_async_task PASSED
tests/unit/test_extraction_routes.py::TestStatusEndpoint::test_get_job_status PASSED
tests/unit/test_extraction_routes.py::TestStatusEndpoint::test_get_nonexistent_job_returns_404 PASSED
========== 4 passed in 0.56s ==========

# FastAPI docs verification
curl http://localhost:8000/v1/docs
→ Confirms POST /v1/extraction/jobs and GET /v1/extraction/jobs/{job_id}
```

### Files Created

**New:**
- `packages/shared/api/routers/extraction.py` (200 LOC)
  - **POST /v1/extraction/jobs** — Create extraction job
    - Request: { match_id, vod_source, vod_path }
    - Response: { job_id, status: "pending" }
    - Background task: asyncio.create_task() to extract frames
  - **GET /v1/extraction/jobs/{job_id}** — Poll job status
    - Response: { job_id, status, frame_count, manifest_id, error (if failed) }
  - Error: 400 (invalid request), 404 (not found), 503 (backend failure)

### Acceptance Criteria Addressed

✅ AC-05 (async job dispatch)  
✅ AC-06 (job status polling)

---

## Task 5: React MinimapFrameGrid Component (with Mock Data)

**Gate Reference:** [Gate 9.13]  
**Status:** ✅ MOCK PASSED (component ready for mock integration)  
**Completion Time:** ~2.5 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: npm run test -- MinimapFrameGrid -v
 PASS  apps/web/src/components/MinimapFrameGrid.test.tsx
  MinimapFrameGrid
    ✓ renders grid with frames
    ✓ renders pagination controls
    ✓ handles next/prev page clicks
    ✓ displays segment type badges
    ✓ displays verification badges
    ✓ renders zoom/lightbox on frame click
    ✓ shows loading state while fetching
    ✓ shows error state on fetch failure

Tests:  8 passed, 8 total
Snapshots: 1 written

# Type check
npm run typecheck
Success: no type errors in apps/web/
```

### Files Created

**New:**
- `apps/web/src/components/MinimapFrameGrid.tsx` (280 LOC)
  - Props: matchId (UUID), showVerificationBadges (bool)
  - State: frames (from useMinimapFrames hook), currentPage, zoom state
  - Render:
    - Grid layout (50 frames/page, responsive columns)
    - FrameThumbnail child components (frame, segment badge, verification badge)
    - Pagination controls (prev, page indicator, next)
    - Lightbox modal on thumbnail click
  - Styles: Tailwind CSS (responsive, dark mode support)

- `apps/web/src/components/FrameThumbnail.tsx` (120 LOC)
  - Props: frame object, onZoom callback
  - Render: Thumbnail, timestamp overlay, segment badge, verification badge
  - Click handler: Trigger lightbox

- `apps/web/src/components/SegmentTypeBadge.tsx` (50 LOC)
  - Props: segmentType enum
  - Render: Colored badge (IN_ROUND=red, BUY_PHASE=green, HALFTIME=gray, etc.)

- `apps/web/src/components/VerificationBadge.tsx` (40 LOC)
  - Props: isPinned bool, onClick handler
  - Render: Checkmark icon if pinned, pending icon if not
  - Styling: Green if pinned, gray if pending

**New:**
- `apps/web/src/components/MinimapFrameGrid.test.tsx` (180 LOC)
  - Snapshot test: grid renders correctly
  - Unit tests: pagination, badges, lightbox, loading/error states
  - Mock data: 50 frame fixtures

### Acceptance Criteria Addressed

✅ AC-07 (React component)  
✅ AC-08 (pagination UI)  
✅ AC-09 (segment badges)  
✅ AC-10 (verification badges)

---

## Task 6: TanStack Query Hook useMinimapFrames (with Mock API)

**Gate Reference:** [Gate 9.14]  
**Status:** ✅ MOCK PASSED (hook ready with mock Archival integration)  
**Completion Time:** ~2 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: npm run test -- useMinimapFrames -v
 PASS  apps/web/src/hooks/useMinimapFrames.test.ts
  useMinimapFrames
    ✓ fetches frames on mount
    ✓ caches frames for 5 minutes
    ✓ refetches on page change
    ✓ handles API error gracefully
    ✓ returns correct pagination state
    ✓ invalidates cache on manual refetch

Tests:  6 passed, 6 total

# Type check
npm run typecheck
Success: no type errors
```

### Files Created

**New:**
- `apps/web/src/hooks/useMinimapFrames.ts` (120 LOC)
  - Hook: `useMinimapFrames(matchId: UUID, page: number)`
  - Uses TanStack Query v5:
    - `useQuery()` to fetch frames
    - Query key: `["minimap-frames", matchId, page]`
    - Stale time: 5 minutes
    - Retry: 3 times on failure
  - Returns: { frames, isLoading, error, hasMore, goToNextPage(), goToPrevPage() }
  - Data source (Phase 1): MockArchivalAPI
    ```typescript
    const mockArchivalAPI = {
      async queryFrames(matchId: UUID, page: number) {
        return {
          frames: generateMockFrames(matchId, page),
          hasMore: page < 10,
          nextPageToken: page + 1
        }
      }
    }
    ```

- `apps/web/src/mocks/mockArchivalClient.ts` (80 LOC)
  - `MockArchivalAPI` class
  - Methods:
    - `async uploadFrames(frames: bytes[], metadata)` → returns manifest_id
    - `async queryFrames(match_id, page)` → returns mock frame list
    - `async pinFrame(frame_id, reason)` → returns frame with is_pinned=true
  - In-memory store (no external API calls)
  - Will be swapped to real httpx client when Archival ready

**New:**
- `apps/web/src/hooks/useMinimapFrames.test.ts` (100 LOC)
  - Mock TanStack Query
  - Test: fetch, cache, refetch, error handling

### Acceptance Criteria Addressed

✅ AC-11 (TanStack Query hook)  
✅ AC-12 (data fetching)  
✅ AC-13 (mock API integration Phase 1)

---

## BLOCKER STATUS: Tasks 7–9 Deferred

**Gate References:** [Gate 9.15], [Gate 9.16], [Gate 9.17]  
**Status:** ⏳ BLOCKED ON ARCHIVAL SYSTEM API  
**Blocker:** Tasks 7–9 require Archival System API endpoints (POST /v1/archive/frames, GET /v1/archive/matches/{id}/frames, POST /v1/archive/frames/{id}/pin)

### Task 7: Extraction → Archival API (Frame Upload)

**Deferred until:** Archival System Tasks 5+ complete and API deployed (~2026-03-31)

**What needs to happen:**
- Replace MockArchivalAPI instantiation with real httpx.AsyncClient
- POST frames to Archival endpoint: `POST http://archival-api:8005/v1/archive/frames`
- Handle response: 200 → extract manifest_id, 409 → skip duplicates, 503 → retry
- Update extraction_service.py to use real Archival API

**Estimated duration:** ~1 hour (mock → real swap)

### Task 8: Frontend → Archival API (Frame Query)

**Deferred until:** Archival System Task 5+ complete (~2026-03-31)

**What needs to happen:**
- Replace MockArchivalAPI.queryFrames with real Archival GET endpoint
- Change: `GET http://archival-api:8005/v1/archive/matches/{match_id}/frames?page=N`
- Update useMinimapFrames hook to use real Archival API
- TanStack Query cache invalidation on frame upload

**Estimated duration:** ~1 hour (mock → real swap)

### Task 9: TeneT → Archival Pinning (Verification Badges)

**Deferred until:** Archival System Task 5+ complete (~2026-03-31)

**What needs to happen:**
- Add onClick handler to VerificationBadge component
- POST to Archival pinning endpoint: `POST /v1/archive/frames/{frame_id}/pin`
- Admin-only access (auth check)
- Update UI: show success/error toast
- Update frame state: is_pinned=true

**Estimated duration:** ~1.5 hours (new feature)

---

## Summary: Tasks 1–6 Mock-Complete, Tasks 7–9 Ready for Deferred Execution

| Task | Gate | Status | AC Addressed | LOC |
|------|------|--------|---|---|
| 1 | 9.9 | ✅ MOCK | AC-01 | 270 |
| 2 | 9.10 | ✅ MOCK | AC-02, AC-03 | 280 |
| 3 | 9.11 | ✅ MOCK | AC-04 | 80 |
| 4 | 9.12 | ✅ MOCK | AC-05, AC-06 | 200 |
| 5 | 9.13 | ✅ MOCK | AC-07, AC-08, AC-09, AC-10 | 490 |
| 6 | 9.14 | ✅ MOCK | AC-11, AC-12, AC-13 | 200 |
| 7 | 9.15 | ⏳ DEFERRED | AC-02 (Archival integration) | ~80 |
| 8 | 9.16 | ⏳ DEFERRED | AC-11, AC-12 (Archival integration) | ~60 |
| 9 | 9.17 | ⏳ DEFERRED | AC-10 (Verification workflow) | ~90 |
| **TOTAL (1–6)** | — | **✅ MOCK** | **AC-01 through AC-13** | **~1520** |

---

## Blocker Decision Gate: ~2026-03-31 (Day 3–4 of Implementation Session)

**Master agent will assess:**
1. Are Archival System Tasks 5–6 (API endpoints) complete?
2. Is Archival API deployed to staging/test environment?
3. Can Minimap agent swap mock → real in <2 hours?

**If YES:**
→ Issue continuation prompt for Tasks 7–9  
→ Minimap agent swaps mock API + completes Tasks 7–9  
→ All gates [9.9]–[9.17] marked ✅ PASSED

**If NO:**
→ Log blocker  
→ Plan Phase 9 continuation session  
→ Tasks 1–6 remain production-ready (no rework needed)

---

## Notes for Future Agent Implementation

1. **Mock API location:** `apps/web/src/mocks/mockArchivalClient.ts` (easy to find/swap)
2. **Mock → Real swap:** Change 1 import line in useMinimapFrames.ts + extraction_service.py
3. **Test fixtures:** Mock frames in `apps/web/src/__fixtures__/mockFrames.ts`
4. **Frontend patterns:** Follow existing hub components (apps/web/src/hub-2-rotas/, hub-4-opera/)
5. **Backend patterns:** Follow existing routers (packages/shared/api/routers/)
6. **Async enforcement:** All extraction operations async (no blocking I/O)
7. **Test coverage:** React snapshot tests + unit tests for hooks, FastAPI route tests

---

*This stub document demonstrates the expected structure and completion pattern for Phase 9 Minimap Feature implementation (Tasks 1–6 ready; Tasks 7–9 deferred with blocker management). Use as template for actual agent execution.*
