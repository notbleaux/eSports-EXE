[Ver001.000]

# Technical Specification — Minimap Extraction Service & Frontend [STUB]

**Status:** STUB — Agent instructions integrated  
**Framework:** NJZPOF v0.2 · 2/3/5+1,2,3 compliance  
**Agent Instructions:** Follow sections marked [AGENT: ...]  
**Cross-Review Ready:** This stub is complete enough for Pass 1 audit  
**Critical Blocker:** Archival System integration (Tasks 7–9 depend on Archival API)  

---

## 1. Technical Context

[AGENT: Fill in backend (Python, FFmpeg, OpenCV) and frontend (React, TypeScript, TanStack Query) context.]

**Example structure:**

```markdown
### Backend: Extraction Service

- Python 3.11+ with asyncio
- FFmpeg (system) for VOD parsing
- OpenCV (cv2) for minimap region detection
- FastAPI for job management endpoints
- asyncio.Task for background extraction jobs

### Frontend: React Component

- React 18 with TypeScript
- TanStack Query v5 (data fetching, caching)
- Tailwind CSS for styling
- Framer Motion for animations (optional Phase 2)

### Integration
- Backend → Archival API: httpx async client (POST /v1/archive/frames)
- Frontend → Archival API: TanStack Query (GET /v1/archive/matches/{match_id}/frames)
- Frontend → TeneT: Display pins/verification badges (read-only from Archival)
```

---

## 2. Extraction Service Architecture

[AGENT: Describe FFmpeg + OpenCV pipeline, job tracking, async execution.]

**Expected subsections:**
- VOD Processing Pipeline (FFmpeg metadata → frame extraction → segment detection → deduplication → upload)
- Segment Type Classification (heuristics for detecting round segments)
- Async Job Dispatch (FastAPI endpoint triggers background task)
- Job Tracking (PostgreSQL extraction_jobs table with status polling)

**Example:**

```markdown
### Frame Extraction Pipeline

1. **FFmpeg Metadata Parsing**
   - Input: VOD file path
   - Extract: duration, FPS, resolution
   - Error handling: Handle corrupted/invalid VOD files gracefully

2. **Minimap Region Detection**
   - Phase 1: Fixed bounding box (bottom-right 25% of frame)
   - Phase 3: ML-based detection (separate model)
   - Output: Crop JPEG, ~100–200 KB per frame

3. **Frame Extraction at 1 fps**
   - Calculate frame count = duration_ms / 1000
   - Skip frames (ffmpeg -vf fps=1)
   - Parallel extraction optional (Phase 2)

4. **Segment Type Classification**
   - Phase 1: Round timer detection + UI overlay heuristics
   - Look for: Timer text, round state indicators
   - Fallback: Classify as UNKNOWN if confidence < threshold

5. **Deduplication**
   - Skip frames identical to previous frame (frame skip logic)
   - Reduce noise/compression artifacts

6. **Batch Upload**
   - Call Archival API: POST /v1/archive/frames
   - Handle retries, failures gracefully
   - Update extraction_jobs status
```

---

## 3. Frontend Component: MinimapFrameGrid

[AGENT: Describe React component structure, pagination, features, data flow.]

**Expected subsections:**
- Component Architecture (MinimapFrameGrid parent, FrameThumbnail child, layout)
- Data Flow (TanStack Query hook → Archival API → paginated frames)
- Pagination & Filtering (page size 50, filters by segment type)
- UI Features (zoom lightbox, verification badges, timestamps, segment badges)

**Example:**

```markdown
### Component Structure

```
<MinimapFrameGrid matchId={matchId} />
  ├─ Header
  │  ├─ Pagination controls (prev/next, page indicator)
  │  └─ Filter controls (segment type, verification status)
  └─ FrameGrid
     ├─ <FrameThumbnail /> (50 per page)
     │  ├─ Image (JPEG from Archival storage_url)
     │  ├─ Segment badge (color-coded: red=IN_ROUND, green=BUY_PHASE)
     │  ├─ Verification badge (checkmark=verified, pending=awaiting)
     │  └─ Timestamp overlay (HH:MM:SS.mmm)
     └─ Loading spinner (while frames loading)
```

### Data Flow

```
User selects match → MinimapFrameGrid(matchId)
  ↓
useMinimapFrames(matchId, page=1) hook
  ↓
TanStack Query: GET /v1/archive/matches/{matchId}/frames?page=1&page_size=50
  ↓
Archival API returns: { frames: [...], total_count: 1800, page: 1, page_size: 50, has_more: true }
  ↓
Component renders 50 FrameThumbnail components
  ↓
User clicks next → page=2 → re-fetch
```

### Pagination & Filtering

- Offset-based pagination (page, page_size)
- Filter query params: segment_type, verification_status
- Infinite scroll or next/prev buttons (TBD based on UX)
- Client-side caching: 5-min cache via TanStack Query
```

---

## 4. Data Model Integration

[AGENT: Define extraction_jobs table, Archival frame schema integration, TeneT workflow.]

**Expected content:**

```markdown
### Table: extraction_jobs

Tracks extraction job metadata and status.

| Column | Type | Purpose |
|--------|------|---------|
| job_id | UUID | PK, unique job identifier |
| match_id | UUID | FK → matches(id) |
| vod_source | VARCHAR | 'local' (Phase 1), 's3' (Phase 2) |
| vod_path | TEXT | Path to VOD file or S3 URL |
| status | VARCHAR | 'pending', 'running', 'completed', 'failed' |
| frame_count | INT | Total frames extracted |
| manifest_id | UUID | FK → Archival manifest |
| created_at | TIMESTAMP | Job start time |
| completed_at | TIMESTAMP | Job completion time |
| error_message | TEXT | Failure reason (if status='failed') |

**Indices:**
- `idx_extraction_jobs_match_id` (for "get frames for this match")
- `idx_extraction_jobs_status` (for "get running jobs")
- `idx_extraction_jobs_created` DESC (for "recent jobs")

### Integration with Archival

- Extraction Service uploads frames → Archival API: POST /v1/archive/frames
- Archival returns: manifest_id → stored in extraction_jobs.manifest_id
- Frontend queries frames → Archival API: GET /v1/archive/matches/{match_id}/frames
- Frames contain Archival metadata: storage_url, is_pinned, created_at

### TeneT Integration

- TeneT verifies frames post-extraction
- On high confidence: calls Archival API POST /v1/archive/frames/{frame_id}/pin
- Frontend displays pin badges (checkmark on FrameThumbnail)
```

---

## 5. API Endpoints (Extraction Service)

[AGENT: Specify 2 endpoints. Request/response schemas, async execution, error handling.]

**Expected content:**

```markdown
### Endpoint: POST /v1/extraction/jobs

**Purpose:** Trigger async frame extraction from VOD  
**Auth:** Service principal (from Minimap Extraction Service) or admin  

**Request Schema:**
```python
class ExtractionJobRequest(BaseModel):
    match_id: UUID
    vod_source: Literal["local", "s3"]  # Phase 1: local only
    vod_path: str  # local: /path/to/vod.mp4, s3: s3://bucket/key
```

**Response Schema:**
```python
class ExtractionJobResponse(BaseModel):
    job_id: UUID
    status: Literal["pending", "running"]
    created_at: datetime
```

**Error Cases:**
- 400 Bad Request: Invalid vod_path
- 404 Not Found: Match doesn't exist
- 503 Service Unavailable: FFmpeg unavailable
- Async task dispatched immediately; polling for status via GET endpoint

### Endpoint: GET /v1/extraction/jobs/{job_id}

**Purpose:** Poll job status (async progress tracking)  
**Auth:** Service principal or admin  

**Response Schema:**
```python
class ExtractionJobStatusResponse(BaseModel):
    job_id: UUID
    match_id: UUID
    status: Literal["pending", "running", "completed", "failed"]
    frame_count: Optional[int]  # populated when completed
    manifest_id: Optional[UUID]  # populated when completed
    error_message: Optional[str]  # populated when failed
    completed_at: Optional[datetime]
```

**Error Cases:**
- 404 Not Found: Job doesn't exist
```

---

## 6. Frontend Hooks & Components

[AGENT: Specify React hook signature, component props, integration with TanStack Query.]

**Expected content:**

```markdown
### Hook: useMinimapFrames

```typescript
interface MinimapFrame {
  id: UUID;
  match_id: UUID;
  storage_url: string;
  segment_type: "IN_ROUND" | "BUY_PHASE" | "HALFTIME" | "BETWEEN_ROUND" | "UNKNOWN";
  timestamp_ms: number;
  is_pinned: boolean;
  created_at: DateTime;
}

function useMinimapFrames(matchId: string, page: number = 1) {
  // TanStack Query hook
  // GET /v1/archive/matches/{matchId}/frames?page={page}&page_size=50
  // Return { frames, isLoading, error, hasMore, nextPage }
}
```

**Caching Strategy:**
- Stale time: 5 minutes (SWR pattern)
- Cache key: `[['minimap-frames', matchId, page]]`
- Invalidation: Manual via `queryClient.invalidateQueries(['minimap-frames'])`

### Component: MinimapFrameGrid

```typescript
interface MinimapFrameGridProps {
  matchId: string;
  showVerificationBadges?: boolean;  // default true
  pageSize?: number;  // default 50
}

function MinimapFrameGrid({ matchId, showVerificationBadges = true }: MinimapFrameGridProps) {
  // Manage pagination state (page, pageSize)
  // Call useMinimapFrames(matchId, page)
  // Render FrameThumbnail for each frame
  // Pagination controls
}
```

### Component: FrameThumbnail

```typescript
interface FrameThumbnailProps {
  frame: MinimapFrame;
  onZoom?: (frame: MinimapFrame) => void;
}

function FrameThumbnail({ frame, onZoom }: FrameThumbnailProps) {
  // Display: <img src={frame.storage_url} />
  // Segment badge: colored label based on segment_type
  // Verification badge: checkmark if is_pinned, pending otherwise
  // Timestamp: overlay at bottom (HH:MM:SS.mmm from timestamp_ms)
  // Click: open lightbox (onZoom callback)
}
```

---

## 7. Delivery Phases

[AGENT: Define scope boundaries (extraction pipeline, React component, integration).]

**Example structure:**

```markdown
### Phase 1 MVP (Phase 9 execution)

**Scope:**
- Single-threaded extraction pipeline (no parallel workers)
- Local VOD files only (no S3)
- Fixed minimap region detection (bounding box)
- Segment classification: heuristics-based (no ML)
- Frame upload to Archival API
- React frame grid component (50 frames/page)
- TaneT pinning workflow (display badges)
- Async job tracking (PostgreSQL extraction_jobs)

**Out of Scope:**
- Parallel extraction workers
- Cloud VOD sources (S3, HTTP)
- ML-based minimap/segment detection
- Advanced filtering/search
- Mobile optimization

### Phase 2 (Phase 10)

**Scope:**
- Parallel extraction workers
- S3/cloud VOD support
- Advanced job management (retries, cancellation)
- ML-based minimap detection

### Phase 3+ (Phase 11+)

**Scope:**
- Real-time streaming extraction
- Advanced ML segment detection
- Mobile responsive UI
- Performance optimization
```

---

## 8. Verification Approach

[AGENT: Define testing strategy (extraction pipeline, React component, E2E), commands to run.]

**Expected structure:**

```markdown
### Unit Tests: Extraction Service

**Location:** `tests/unit/test_extraction_*.py`

**Coverage:**
- `test_extraction_models.py` — extraction_jobs model, relationships
- `test_extraction_pipeline.py` — FFmpeg mock, segment classification logic
- `test_extraction_routes.py` — Job creation, status polling endpoints

**Command:**
```bash
pytest tests/unit/test_extraction_*.py -v
```

### Unit Tests: React Component

**Location:** `apps/web/src/__tests__/MinimapFrameGrid.test.tsx`

**Coverage:**
- Component renders with mock data
- Pagination controls work
- TanStack Query integration
- Segment badges display correctly
- Verification badges display correctly

**Command:**
```bash
npm run test -- MinimapFrameGrid.test.tsx
```

### Integration Tests

**Location:** `tests/integration/test_minimap_*.py`

**Coverage:**
- Full extraction workflow (VOD → frames → Archival upload)
- Frame query & display (Frontend → Archival API → grid render)
- TeneT pinning workflow (verify → pin → display updated badge)

**Command:**
```bash
pytest tests/integration/test_minimap_extraction_e2e.py -v
```

### E2E Tests (Playwright)

**Location:** `tests/e2e/minimap-extraction.spec.ts`

**Coverage:**
- User starts extraction job
- Job completes
- Frames appear in frontend grid
- User clicks frame zoom
- Verified frames show badges

**Command:**
```bash
npx playwright test tests/e2e/minimap-extraction.spec.ts
```

### Verification Commands (All)

```bash
# Python: unit + integration
pytest tests/unit/test_extraction_*.py tests/integration/test_minimap_*.py -v

# React: component tests
npm run test -- MinimapFrameGrid.test.tsx

# E2E: full workflow
npx playwright test minimap-extraction.spec.ts

# Type check
mypy packages/shared/api/src/njz_api/extraction/
npm run typecheck

# Lint
ruff check packages/shared/api/src/njz_api/extraction/
npm run lint
```
```

---

## Critical Blocker: Archival System Integration

[AGENT: Document Archival dependency explicitly.]

```markdown
### Archival Blocker Status

Tasks 7–9 (Archival integration) cannot start until:
- ✅ Archival API POST /v1/archive/frames endpoint deployed + tested
- ✅ Archival API GET /v1/archive/matches/{match_id}/frames endpoint deployed + tested
- ✅ Archival pinning workflow (POST /v1/archive/frames/{id}/pin) deployed + tested

### Mitigation Strategy

**Option A (Recommended):** Mock Archival API for Tasks 1–6 development
- Create mock ArchivalAPI class (in-memory storage, returns UUIDs)
- Tasks 1–6 pass with mock API
- When Archival ready: replace mock → real API, run integration tests

**Option B:** Wait for Archival completion
- Development paused until Archival ready
- Risk: Timeline impact if Archival delays

### Archival ETA

Check ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md for target completion date.
Current assumption: _____ (CODEOWNER to provide)

### Contingency

If Archival delays past 2026-03-30:
- Complete Tasks 1–6 with mock API by end of Phase 9
- Defer Tasks 7–9 to Phase 9 continuation
- Swap mock → real API when Archival ready (should take <2 hours)
```

---

## Framework Integration Checklist

**2/3/5+1,2,3 Compliance:**

- [ ] **Extraction Service:** FastAPI async patterns, SQLAlchemy models, Pydantic schemas
- [ ] **Frontend Component:** React hooks (TanStack Query), TypeScript, existing hub structure
- [ ] **Archival Integration:** Explicit blocker documentation, mitigation strategy
- [ ] **Gate Linkage:** Tasks linked to PHASE_GATES.md gates (to be created during planning)
- [ ] **Framework Pillars:**
  - Road-Maps: Gate linkage (pending planning)
  - Logic Trees: Dependency on Archival System documented
  - ACP: Handoff documented in AGENT-TASK-INSTRUCTION
  - MCP: Archival API contracts documented (from Archival PRD)
  - Notebook/TODO: Workplan is session TODO

---

## Cross-Review Readiness

[AGENT: This stub is ready for cross-review. Pass 1 audit will check:]

✅ **Correctness** — Extraction pipeline sound? React patterns idiomatic?  
✅ **Completeness** — Both API endpoints specified? Hook signature clear? Component structure defined?  
✅ **Integration Safety** — Archival integration properly mocked/managed?  
✅ **Framework Alignment** — Hub structure (ROTAS/OPERA) followed? Archival blocker documented?  
✅ **Risks** — What could delay Archival? What's the contingency?  

**Cross-Review Invocation:**
After finalizing spec-minimap-feature.md, run CROSS-REVIEW-TEMPLATE-2026-03-27.md Pass 1 with sonnet-4-6-think.

---

*This stub expires 2026-03-30. Replace with finalized spec-minimap-feature.md after cross-review completion.*
