[Ver001.000]

# Technical Specification — Phase 9: Minimap Archival System + Minimap Feature

**Status:** DRAFT — Awaiting User Confirmation  
**Phase:** 9  
**Framework:** NJZPOF v0.2  
**Created:** 2026-03-28  
**Author:** ZenCoder Agent (Step 2: Technical Specification)  
**PRD Source:** `.zencoder/chats/90a3e4e5-6063-4967-ab87-4180e32b54b8/requirements.md`

---

## 1. Technical Context

### 1.1 Language Versions and Runtime

| Layer | Version | Notes |
|-------|---------|-------|
| Python | 3.11+ | Confirmed in `pyproject.toml` and `AGENTS.md` |
| FastAPI | ≥0.115.0 | Existing `requirements.txt` |
| SQLAlchemy | 2.x async | Existing patterns in `src/sator/extraction_job.py` |
| Pydantic | v2.5+ | Existing `requirements.txt`; `BaseModel` pattern in use |
| React | 18 | Existing frontend |
| TypeScript | 5.9+ | Existing frontend |
| Node.js | 18+ | Per `AGENTS.md` |
| PostgreSQL | 15+ | Per `AGENTS.md` |

### 1.2 New Dependencies to Add

**Backend (`packages/shared/api/requirements.txt`):**

```
# Frame extraction pipeline
ffmpeg-python>=0.2.0
opencv-python>=4.8.0
aiofiles>=23.2.0
pillow>=10.0.0

# Metrics
prometheus_client>=0.19.0
```

> **Note:** `prometheus_client` is already imported in `main.py` with a `try/except` guard — this makes the guard condition always-true after install.

**Frontend (`apps/web/package.json`):** No new dependencies required. All frontend components use existing Tailwind, Framer Motion, Lucide icons, and TanStack Query v5.

### 1.3 Existing Infrastructure Confirmed Present

- `src/sator/extraction_job.py` — `ExtractionJob`, `ArchiveManifest`, `ArchiveFrame` ORM models (complete)
- `src/sator/extraction_schemas.py` — `ExtractionJobRequest`, `ExtractionJobResponse`, `ExtractionJobStatus`, `FrameData`, `FrameUploadPayload`, `ArchiveFrameResponse`, `FrameQueryResponse` (complete)
- `migrations/020_extraction_jobs.sql` — `extraction_jobs`, `archive_manifests`, `archive_frames` tables + indexes (complete)
- `packages/shared/api/tests/unit/test_extraction_models.py` — unit tests for ORM models
- `packages/shared/api/tests/unit/test_extraction_schemas.py` — unit tests for Pydantic schemas
- Auth pattern: `get_current_user` from `src.auth.auth_utils` + `_require_admin(current_user)` pattern in `routers/admin.py`
- Router mount pattern: `from routers.xxx import router as xxx_router` + `app.include_router(xxx_router, prefix="/v1")` in `main.py`
- DB injection: `db: AsyncSession = Depends(get_db)` from `database.py`

---

## 2. Architecture Decisions

### 2.1 Namespace

All new backend files live under **`src/sator/`** for consistency with existing extraction infrastructure (per confirmed answer Q1).

### 2.2 ORM Separation

New Archival System ORM models go in a **separate** `src/sator/archival_models.py` file (per confirmed answer Q2). The existing `src/sator/extraction_job.py` already defines `ExtractionJob`, `ArchiveManifest`, and `ArchiveFrame` — these are not duplicated; `archival_models.py` provides the additional `ArchiveAuditLog` model only.

> **Reconciliation:** The existing `ArchiveManifest` and `ArchiveFrame` in `extraction_job.py` satisfy the ORM requirement. `archival_models.py` adds only `ArchiveAuditLog`. Existing models are imported where needed via `from src.sator.extraction_job import ArchiveManifest, ArchiveFrame`.

### 2.3 Migration Numbering

Next raw SQL migration: **`021_archive_audit_log.sql`** (matching `020_extraction_jobs.sql` pattern). Also adds `deleted_at` column to `archive_frames` via `ALTER TABLE`.

### 2.4 Service-to-Service Auth for Frame Uploads

Automated frame uploads (extraction pipeline → archival API) use a **shared service secret** header (`X-Service-Token`) validated against environment variable `ARCHIVAL_SERVICE_SECRET`. No user JWT required for automated uploads.

User approval is required only for **CANONICAL frame promotion** — after the Dual Recording handshake verification cycle confirms the Base frame.

### 2.5 OPERA Split-Tooling Principle

OPERA Advanced MapGrid and OPERA Moderate MapGrid are **two separate component trees** — no shared render functions, no conditional rendering within the same component. Each is independently mounted/lazy-loaded. Users switch between them without buffering delays.

---

## 3. Source Code Structure — New and Modified Files

### 3.1 Backend — New Files

```
packages/shared/api/
├── migrations/
│   └── 021_archive_audit_log.sql          [NEW] ArchiveAuditLog table + deleted_at column
│
├── src/sator/
│   ├── archival_models.py                  [NEW] ArchiveAuditLog ORM model only
│   ├── archival_schemas.py                 [NEW] Archival API Pydantic schemas
│   ├── archival_service.py                 [NEW] Business logic: dedup, GC, pinning, audit
│   ├── archival_metrics.py                 [NEW] Prometheus counters/histograms
│   ├── dual_recording_service.py           [NEW] Phase 1 stub for handshake verification
│   ├── storage/
│   │   ├── __init__.py                     [NEW] StorageBackend Protocol export
│   │   ├── local_backend.py                [NEW] LocalStorageBackend (aiofiles)
│   │   └── s3_backend.py                   [NEW] Phase 2 stub (NotImplementedError)
│   ├── extraction_pipeline.py              [NEW] FFmpeg + OpenCV pipeline
│   └── segment_classifier.py               [NEW] Heuristic segment type detector
│
└── routers/
    ├── archive.py                          [NEW] /v1/archive/* endpoints (9 endpoints)
    ├── archive_admin.py                    [NEW] /v1/admin/archive/* endpoints (3 endpoints)
    └── extraction.py                       [NEW] /v1/extraction/* endpoints (2 endpoints)
```

### 3.2 Backend — Modified Files

| File | Change |
|------|--------|
| `main.py` | Import + mount 3 new routers: `archive`, `archive_admin`, `extraction` |
| `requirements.txt` | Add `ffmpeg-python`, `opencv-python`, `aiofiles`, `pillow`, `prometheus_client` |

### 3.3 Frontend — New Files

```
apps/web/src/
├── hub-1-sator/components/
│   └── MinimapReviewPanel.tsx              [NEW] SATOR: read-only, max 1/4 screen, 3x3 grid
│
├── hub-2-rotas/components/MinimapFrameGrid/
│   ├── index.tsx                           [NEW] ROTAS: full modular grid (3 modes)
│   ├── FrameThumbnail.tsx                  [NEW] Single frame cell with badge overlays
│   ├── SegmentTypeBadge.tsx                [NEW] Color-coded segment type pill
│   ├── VerificationBadge.tsx               [NEW] Pinned/pending indicator + admin pin action
│   ├── MinimapLightbox.tsx                 [NEW] Fullscreen frame viewer (keyboard nav)
│   └── MinimapModeSelector.tsx             [NEW] Simulation / xSimulation / VOD Review tabs
│
├── hub-4-opera/components/
│   ├── LiveMap/
│   │   ├── AdvancedLiveMapGrid.tsx         [NEW] OPERA Advanced: Live MapGrid + ROTAS Lens
│   │   └── ModerateLiveMapGrid.tsx         [NEW] OPERA Moderate: mobile-optimized (9:16)
│   ├── MontageReel/
│   │   └── MontageReelPlayer.tsx           [NEW] MontageFile cycling during ad breaks
│   └── HighlightReel/
│       └── HighlightReelContainer.tsx      [NEW] Ad-break reel scheduler + weekly rotation
│
├── hooks/
│   ├── useMinimapFrames.ts                 [NEW] TanStack Query hook (page-by-page, mock→real)
│   └── useRotasLens.ts                     [NEW] OPERA→ROTAS Lens WebSocket integration
│
└── mocks/
    └── mockArchivalClient.ts               [NEW] In-memory mock Archival API for Phase 1
```

### 3.4 Frontend — Modified Files

| File | Change |
|------|--------|
| `hub-1-sator/index.jsx` | Import + render `<MinimapReviewPanel>` in review section |
| `hub-2-rotas/index.jsx` | Import + render `<MinimapFrameGrid>` in VOD/simulation section |
| `hub-4-opera/index.tsx` | Add "Map" tab; lazy-load `AdvancedLiveMapGrid` or `ModerateLiveMapGrid` |

### 3.5 Test Files — New

```
packages/shared/api/tests/
├── unit/
│   ├── test_archive_models.py
│   ├── test_archive_schemas.py
│   ├── test_archival_service.py
│   ├── test_storage_backend.py
│   ├── test_archive_routes.py
│   ├── test_archive_gc.py
│   ├── test_audit_log.py
│   ├── test_extraction_pipeline.py
│   ├── test_segment_classification.py
│   └── test_extraction_routes.py
└── integration/
    └── test_archive_e2e.py
```

---

## 4. Data Model Changes

### 4.1 New SQL: `021_archive_audit_log.sql`

```sql
-- [Ver001.000]
-- Archive Audit Log + archive_frames extension

-- Add soft-delete column to existing archive_frames
ALTER TABLE archive_frames
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_archive_frames_deleted_at
    ON archive_frames(deleted_at) WHERE deleted_at IS NULL;

-- Audit log table (immutable)
CREATE TABLE IF NOT EXISTS archive_audit_log (
    log_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frame_id     UUID REFERENCES archive_frames(frame_id) ON DELETE SET NULL,
    action       VARCHAR(50) NOT NULL
                     CHECK (action IN ('upload','pin','unpin','delete','gc_delete','migrate','promote')),
    performed_by VARCHAR(255),
    auth_type    VARCHAR(50)
                     CHECK (auth_type IN ('user_jwt', 'service_token', 'system')),
    metadata     JSONB,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_frame_id   ON archive_audit_log(frame_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action     ON archive_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON archive_audit_log(created_at DESC);

COMMENT ON TABLE archive_audit_log IS 'Immutable audit trail for all archive frame mutations';
```

### 4.2 New ORM: `src/sator/archival_models.py`

Only `ArchiveAuditLog` is new. All other models already exist in `extraction_job.py`.

```python
class ArchiveAuditLog(Base):
    __tablename__ = "archive_audit_log"

    log_id        = Column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    frame_id      = Column(PG_UUID(as_uuid=True), ForeignKey("archive_frames.frame_id", ondelete="SET NULL"), nullable=True)
    action        = Column(String(50), nullable=False)
    performed_by  = Column(String(255), nullable=True)
    auth_type     = Column(String(50), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at    = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
```

### 4.3 AccuracyTier Lifecycle (existing enum extended semantically)

The `AccuracyTier` enum already exists in `extraction_job.py`:
- `STANDARD` — single recording, unverified; subject to 90-day GC
- `HIGH` — dual recording matched; 365-day GC retention
- `VERIFIED` — TeneT consensus pinned; GC exempt (`is_pinned=True` always)

---

## 5. API Contracts

### 5.1 Archival System Endpoints (`routers/archive.py`)

`prefix="/v1/archive"`, `tags=["archive"]`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/frames` | Service token | Batch upload (max 1,000 frames) |
| `GET` | `/matches/{match_id}/frames` | Public | Paginated frame query (50/page default) |
| `GET` | `/frames/{frame_id}` | Public | Single frame metadata; 404 if deleted |
| `DELETE` | `/frames/{frame_id}` | Admin JWT | Soft-delete (sets `deleted_at`) |
| `POST` | `/frames/{frame_id}/pin` | Admin JWT | Pin frame (TeneT verification) |
| `DELETE` | `/frames/{frame_id}/pin` | Admin JWT | Unpin frame |
| `POST` | `/frames/{frame_id}/promote` | Admin JWT | Promote to CANONICAL (Dual Recording) |
| `GET` | `/manifests/{manifest_id}` | Public | Manifest metadata |
| `GET` | `/audit` | Admin JWT | Paginated audit log |
| `POST` | `/storage/verify` | Admin JWT | Re-hash integrity check |

### 5.2 Archive Admin Endpoints (`routers/archive_admin.py`)

`prefix="/v1/admin/archive"`, `tags=["archive-admin"]`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/gc` | Admin JWT | Trigger GC (`dry_run` param) |
| `GET` | `/jobs/{job_id}` | Admin JWT | Poll async job status |
| `POST` | `/migrate` | Admin JWT | Trigger storage backend migration |

### 5.3 Extraction Endpoints (`routers/extraction.py`)

`prefix="/v1/extraction"`, `tags=["extraction"]`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/jobs` | Admin JWT | Create extraction job; dispatch background task |
| `GET` | `/jobs/{job_id}` | Admin JWT | Poll job status |

### 5.4 New Pydantic Schemas (`src/sator/archival_schemas.py`)

Extending (not replacing) existing `extraction_schemas.py`:

```python
class FrameUploadItem(BaseModel):
    frame_index: int
    segment_type: str
    timestamp_ms: int
    content_hash: str               # SHA-256 hex
    jpeg_data: str                  # base64-encoded JPEG bytes
    match_id: UUID
    manifest_id: UUID

class BatchFrameUploadRequest(BaseModel):
    frames: List[FrameUploadItem] = Field(..., max_length=1000)
    extraction_job_id: UUID

class BatchFrameUploadResponse(BaseModel):
    manifest_id: UUID
    frames_stored: int
    duplicates_skipped: int
    storage_size_bytes: int

class PinRequest(BaseModel):
    reason: str
    canonical_tier: str = "VERIFIED"

class GCRequest(BaseModel):
    retention_days: int = Field(default=90, ge=1)
    dry_run: bool = False

class AsyncJobStatus(BaseModel):
    job_id: UUID
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

class AuditLogEntry(BaseModel):
    log_id: UUID
    frame_id: Optional[UUID]
    action: str
    performed_by: Optional[str]
    auth_type: Optional[str]
    metadata: Optional[dict]
    created_at: datetime
```

---

## 6. Dual Recording Handshake Verification Cycle

### 6.1 Workflow

```
Raw A submitted               Raw B submitted
(extraction run 1)            (extraction run 2)
        │                           │
        └──────────► DualRecordingService ◄──┘
                            │
              Compare: SHA-256 + pixel diff
                            │
              ┌─────────────┴────────────┐
              │                          │
          MATCH                      MISMATCH
    (diff < threshold)           (frames disagree)
              │                          │
       Base Frame Created          Flagged for admin review
       AccuracyTier = HIGH         No automatic promotion
              │
       Admin Approval Queue
       POST /v1/archive/frames/{id}/promote
              │
       Admin approves (per framework guidelines)
              │
       AccuracyTier → VERIFIED
       is_pinned = true
       action = 'promote' logged → archive_audit_log
```

### 6.2 Implementation

**`src/sator/dual_recording_service.py`** (Phase 1 stub):

```python
class HandshakeResult(str, Enum):
    MATCH = "match"
    MISMATCH = "mismatch"
    PENDING = "pending"

class DualRecordingService:
    async def submit_recording(self, frame_id: UUID, slot: Literal["A", "B"]) -> UUID:
        """Register a recording. Returns verification_session_id."""

    async def check_handshake(self, session_id: UUID) -> HandshakeResult:
        """Compare A vs B. Phase 1: always returns MATCH (stub)."""

    async def promote_to_canonical(self, frame_id: UUID, admin_user_id: str, db: AsyncSession) -> ArchiveFrame:
        """
        Admin approval:
        - Sets accuracy_tier = VERIFIED
        - Sets is_pinned = True
        - Sets pinned_by = admin_user_id
        - Logs action='promote' to archive_audit_log
        """
```

Phase 2: `check_handshake` performs actual pixel comparison via OpenCV.

### 6.3 Approval Endpoint

`POST /v1/archive/frames/{frame_id}/promote` (Admin JWT required):
- Request: `{ "reason": str, "session_id": UUID }`
- Response: Updated `ArchiveFrameResponse` with `accuracy_tier="VERIFIED"`, `is_pinned=True`
- Side effect: Writes `ArchiveAuditLog` entry with `action="promote"`, `auth_type="user_jwt"`

---

## 7. Storage Abstraction Layer

### 7.1 StorageBackend Protocol (`src/sator/storage/__init__.py`)

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class StorageBackend(Protocol):
    async def put(self, key: str, data: bytes) -> str: ...   # returns storage_url
    async def get(self, key: str) -> bytes: ...
    async def delete(self, key: str) -> None: ...
    async def exists(self, key: str) -> bool: ...
    async def health_check(self) -> bool: ...
```

### 7.2 LocalStorageBackend (`src/sator/storage/local_backend.py`)

- Path pattern: `{ARCHIVE_LOCAL_DATA_DIR}/frames/{hash[:2]}/{hash[2:4]}/{hash}.jpg`
- Environment variable: `ARCHIVE_LOCAL_DATA_DIR` (default: `./data/archive_frames`)
- Async I/O via `aiofiles`
- `put()` creates parent dirs if missing via `asyncio.get_event_loop().run_in_executor`
- `health_check()`: verify dir exists + writable test file

### 7.3 S3Backend stub (`src/sator/storage/s3_backend.py`)

Protocol-compliant; all methods raise `NotImplementedError("S3 backend available in Phase 2")`.

---

## 8. Frontend Implementation Approach

### 8.1 SATOR Hub — MinimapReviewPanel

**Constraints:**
- Read-only (no pin/admin actions exposed)
- Max 1/4 screen width inside SATOR grid layout
- 3×3 thumbnail grid (9 frames), page 0 only
- Segment badge visible; verification badge visible (read-only, no click handler)
- Click → `MinimapLightbox` fullscreen

```tsx
interface MinimapReviewPanelProps {
  matchId: string;
  className?: string;
}
```

### 8.2 ROTAS Hub — MinimapFrameGrid (Full Modular)

Three distinct modes via `MinimapModeSelector`:

| Mode | Description | Controls |
|------|-------------|----------|
| `simulation` | Frames linked to simulation tick; hover shows sim overlay | Tick scrubber |
| `xSimulation` | Side-by-side diff of two match timelines | `secondaryMatchId` required |
| `vod-review` | Standard 50-frame paginated review | Full pagination + admin badge |

```tsx
type MinimapMode = 'simulation' | 'xSimulation' | 'vod-review';

interface MinimapFrameGridProps {
  matchId: string;
  mode: MinimapMode;
  isAdmin?: boolean;
  secondaryMatchId?: string;  // xSimulation only
}
```

**VerificationBadge admin action (in `vod-review` mode only):**
- Admin click → `POST /v1/archive/frames/{frame_id}/pin`
- Optimistic UI: badge updates immediately, reverts on error
- Non-admin: badge is read-only

### 8.3 OPERA Advanced — AdvancedLiveMapGrid

**ROTAS Lens Integration Contract:**

OPERA Advanced does NOT render ROTAS Lens directly. It uses `useRotasLens(matchId, lensTypes)` hook which:
1. Connects to existing `/ws/lens-updates` WebSocket (from `src/rotas/map_routes.py`)
2. Sends `LensDataRequest` payload
3. Receives structured `LensOverlayData`
4. OPERA renders overlay on top of its live minimap grid

```tsx
interface AdvancedLiveMapGridProps {
  matchId: string;
  streamUrl?: string;
  enabledLenses?: string[];          // LensType values from map_routes.py
  onRotasLensRequest?: (data: LensOverlayData) => void;
}
```

`onRotasLensRequest` emits events that OPERA sidebar uses to display ROTAS-sourced analytics (economy, tension, etc.), supporting the supplementary/complementary hub content generation pattern.

### 8.4 OPERA Moderate — ModerateLiveMapGrid

**Key distinctions from Advanced (no shared functions):**
- Vertical layout (9:16 aspect ratio)
- Swipe gestures via existing `useTouchGesture` hook
- Icon-only segment badges (no text labels)
- Max 1 lens overlay (3-option picker)
- Auto-hide controls (3s inactivity timeout)
- No `useRotasLens` import — entirely independent

```tsx
interface ModerateLiveMapGridProps {
  matchId: string;
  aspectRatio?: '9:16' | '4:3' | '16:9';
  autoHideControls?: boolean;
}
```

### 8.5 OPERA Highlight Reels — MontageReelPlayer

```ts
interface MontageFile {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  game: 'valorant' | 'cs2';
  weekNumber: number;
  scheduledAt: string;  // ISO8601
}
```

- Phase 1 MVP: hardcoded `mockMontageSchedule` (5 entries)
- Phase 2: fetches from `GET /v1/opera/montage/schedule`
- Auto-plays; loops weekly set; integrates with `EsportsCalendar.tsx` for schedule context
- Ad-break scheduling: `HighlightReelContainer` reads game calendar events to determine reel insertion points

### 8.6 useMinimapFrames Hook

```ts
function useMinimapFrames(
  matchId: string,
  initialPage?: number,    // default 0
  pageSize?: number        // default 50
): {
  frames: ArchiveFrameResponse[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  totalPages: number;
  currentPage: number;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  refetch: () => void;
}
```

- Phase 1: `MockArchivalAPI` from `mocks/mockArchivalClient.ts`
- Phase 2 (Task E2): swap `MockArchivalAPI` with real `GET /v1/archive/matches/{id}/frames`
- TanStack Query key: `["minimap-frames", matchId, page, pageSize]`
- Stale time: 5 minutes; retry: 3

### 8.7 useRotasLens Hook

```ts
function useRotasLens(
  matchId: string,
  lensTypes: string[]
): {
  overlayData: LensOverlayData | null;
  isConnected: boolean;
  requestLensUpdate: (region?: BoundingBox) => void;
}
```

- Uses existing `useWebSocket` hook to connect to `/ws/lens-updates`
- Sends `LensDataRequest` JSON (from existing `map_routes.py` Pydantic model)
- Returns structured lens overlay for `AdvancedLiveMapGrid` rendering

---

## 9. Archival Service Logic Summary

### 9.1 Deduplication

On each frame in `BatchFrameUploadRequest`:
1. Query `archive_frames` by `content_hash`
2. If found: increment `duplicates_skipped`, skip storage
3. If not found: `storage.put(content_hash, jpeg_bytes)` → insert `ArchiveFrame` → log audit

### 9.2 Garbage Collection

```python
cutoff = utcnow() - timedelta(days=retention_days)
candidates = frames WHERE is_pinned=False AND created_at < cutoff AND accuracy_tier='STANDARD'
if dry_run: return count
else: storage.delete(hash); frame.deleted_at = utcnow(); log audit(action='gc_delete')
```

HIGH-tier frames use 365-day cutoff hardcoded. VERIFIED frames are never candidates.

### 9.3 Prometheus Metrics (`src/sator/archival_metrics.py`)

```python
archive_frames_uploaded_total    = Counter(..., labelnames=["segment_type"])
archive_frames_deduplicated_total = Counter(...)
archive_frames_deleted_total     = Counter(..., labelnames=["reason"])
archive_query_latency_seconds    = Histogram(...)
archive_storage_bytes            = Gauge(...)
```

Exposed via existing `/metrics` endpoint in `main.py`.

---

## 10. Extraction Pipeline

### 10.1 Pipeline Stages (`src/sator/extraction_pipeline.py`)

```python
class ExtractionPipeline:
    async def run(self, job: ExtractionJob, db: AsyncSession) -> None:
        # 1. Set status → RUNNING
        # 2. ffmpeg-python: parse metadata (duration_ms, fps, resolution)
        # 3. OpenCV VideoCapture at 1fps: extract JPEG frames
        # 4. Crop minimap region: bottom-right 25% bounding box
        # 5. SegmentClassifier.classify() per frame
        # 6. SHA-256 deduplication: skip consecutive identical frames
        # 7. BatchFrameUploadRequest to ArchivalService (batches of 100)
        # 8. Set status → COMPLETED; update frame_count, manifest_id
        # On any exception: Set status → FAILED, error_message = str(exc)
```

### 10.2 Segment Classifier (`src/sator/segment_classifier.py`)

OpenCV color analysis only — no Tesseract, no ML:
- Extract timer region (fixed box: top-center for 1920×1080; scaled for other resolutions)
- `BUY_PHASE`: orange/yellow hue cluster (HSV: H 15–40, S>100, V>100)
- `HALFTIME`: detect score display pattern (symmetric score layout pixel analysis)
- `IN_ROUND`: timer region present, not BUY_PHASE/HALFTIME pattern
- `BETWEEN_ROUND`: brief black frame or transition detection
- `UNKNOWN`: fallback

---

## 11. Delivery Phases

| Phase | Milestone | Duration | Gate |
|-------|-----------|----------|------|
| A | Archival Backend (migration → routers → integration tests) | ~3 days | 9.4–9.7 |
| B | Extraction Pipeline Backend | ~2 days | 9.8–9.9 |
| C | Frontend Core Components (hooks, SATOR, ROTAS grid) | ~2 days | 9.10–9.11 |
| D | OPERA Split Tools (Advanced + Moderate + Reels) | ~2 days | 9.12–9.13 |
| E | Integration Wiring (extraction → archival; frontend → archival; admin pinning) | ~1 day | 9.14 |

**Total estimated:** ~10 working days  
**Parallelizable:** Phase A and Phase C can run concurrently after C1 mock is ready.

---

## 12. Verification Approach

### 12.1 Backend Commands (from `packages/shared/api/`)

```bash
# Lint all new files
ruff check src/sator/ routers/archive.py routers/archive_admin.py routers/extraction.py

# Type check
mypy src/sator/archival_models.py src/sator/archival_service.py \
     src/sator/storage/ routers/archive.py --strict

# Unit tests
pytest tests/unit/ -v --cov=src/sator/ --cov=routers/ --cov-report=term-missing

# Integration tests
pytest tests/integration/test_archive_e2e.py -v
```

### 12.2 Frontend Commands (from `apps/web/`)

```bash
pnpm run typecheck
pnpm run lint
pnpm run test -- --testPathPattern="Minimap|useMinimapFrames|VerificationBadge|SegmentTypeBadge|LiveMapGrid|MontageReel"
pnpm run build
```

### 12.3 Gate Mapping for `PHASE_GATES.md`

New gates for Phase 9 (to be added, not replacing existing 9.1–9.3):

| Gate | Description | Verification | Status |
|------|-------------|--------------|--------|
| 9.4 | Migration 021 + ArchiveAuditLog ORM | `pytest tests/unit/test_archive_models.py` | Pending |
| 9.5 | Storage abstraction (Protocol + LocalBackend) | `pytest tests/unit/test_storage_backend.py` | Pending |
| 9.6 | Archival service (dedup, GC, pinning) | `pytest tests/unit/test_archival_service.py` | Pending |
| 9.7 | Archive routers + integration E2E | `pytest tests/integration/test_archive_e2e.py` | Pending |
| 9.8 | Extraction pipeline (FFmpeg + OpenCV) | `pytest tests/unit/test_extraction_pipeline.py` | Pending |
| 9.9 | Extraction router (job create + poll) | `pytest tests/unit/test_extraction_routes.py` | Pending |
| 9.10 | Shared React components (badges, thumbnail, lightbox) | `pnpm test -- SegmentTypeBadge VerificationBadge` | Pending |
| 9.11 | ROTAS grid + SATOR panel | `pnpm test -- MinimapFrameGrid MinimapReviewPanel` | Pending |
| 9.12 | OPERA Advanced LiveMapGrid + ROTAS Lens | `pnpm test -- AdvancedLiveMapGrid useRotasLens` | Pending |
| 9.13 | OPERA Moderate + MontageReelPlayer | `pnpm test -- ModerateLiveMapGrid MontageReelPlayer` | Pending |
| 9.14 | Full integration wiring + build | `pytest integration && pnpm run build` | Pending |

---

## 13. Implementation Notes for Executing Agent

1. **Do not re-implement existing ORM models.** `ExtractionJob`, `ArchiveManifest`, `ArchiveFrame` are complete in `src/sator/extraction_job.py`. Import only.
2. **`deleted_at` column** on `archive_frames`: added via `ALTER TABLE` in migration `021`. Filter in all queries: `WHERE deleted_at IS NULL`.
3. **Admin auth pattern:** Follow `routers/admin.py` exactly: `_require_admin(current_user: TokenData)` helper before any admin action.
4. **Service token auth:** New `_require_service_token(request: Request)` helper — reads `X-Service-Token`, compares to `os.getenv("ARCHIVAL_SERVICE_SECRET")`. Used only on `POST /v1/archive/frames`.
5. **MockArchivalAPI factory:** Phase 1 `useMinimapFrames` checks `import.meta.env.VITE_USE_MOCK_ARCHIVAL === 'true'` and swaps client. No hook signature change required.
6. **OPERA isolation:** `AdvancedLiveMapGrid` and `ModerateLiveMapGrid` must never import from each other. Shared types via `hub-4-opera/types.ts` only.
7. **Segment classifier:** OpenCV HSV analysis only. No Tesseract, no `pytesseract`, no ML model. OpenCV + Pillow sufficient.
8. **Metrics pattern:** Follow existing `try: from prometheus_client import ...` guard already in `main.py`. No change to startup guard needed after installing `prometheus_client`.
9. **Dual recording Phase 1:** `dual_recording_service.py` is a full stub. `check_handshake()` returns `HandshakeResult.MATCH` always. Phase 2 implements pixel comparison. Do not block the promotion endpoint on Phase 1 stub behavior.
10. **ROTAS Lens in OPERA:** OPERA Advanced does not own lens rendering logic. It only calls `useRotasLens` hook and renders the returned `LensOverlayData` as a CSS overlay. All lens computation stays in ROTAS `map_routes.py`.

---

## 14. Open Questions

None. All 5 pre-confirmation questions were resolved before this specification was written. Spec is complete for implementation hand-off to Phase A.
