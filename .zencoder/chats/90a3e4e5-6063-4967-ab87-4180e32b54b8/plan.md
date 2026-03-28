# Full SDD workflow

## Workflow Steps

### [x] Step: Requirements

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\90a3e4e5-6063-4967-ab87-4180e32b54b8/requirements.md`.

**Stop here.** Present the PRD to the user and wait for their confirmation before proceeding.

### [x] Step: Technical Specification

Create a technical specification based on the PRD in `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\90a3e4e5-6063-4967-ab87-4180e32b54b8/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\90a3e4e5-6063-4967-ab87-4180e32b54b8/spec.md` with:

- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

**Stop here.** Present the technical specification to the user and wait for their confirmation before proceeding.

### [x] Step: Planning ✅

Create a detailed implementation plan based on `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\90a3e4e5-6063-4967-ab87-4180e32b54b8/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Save to `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\90a3e4e5-6063-4967-ab87-4180e32b54b8/plan.md`.

**Stop here.** Present the implementation plan to the user and wait for their confirmation before proceeding.

---

## Implementation Plan

Spec source: `spec.md` | PRD source: `requirements.md`
Phases: A (Archival Backend) → B (Extraction Backend) → C (Frontend Core) → D (OPERA Split Tools) → E (Integration Wiring)
Parallelisable: Phase A and Phase C/C1 can start concurrently once C1 mock is scaffolded.

---

### PHASE A — Archival System Backend (~3 days | Gates 9.4–9.7)

---

### [ ] Step: A1 — SQL Migration 021 (archive_audit_log + deleted_at)

**Spec ref:** §4.1 | **Gate:** 9.4

**Files:**
- `packages/shared/api/migrations/021_archive_audit_log.sql` [NEW]

**What to implement:**
- `ALTER TABLE archive_frames ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`
- `ALTER TABLE archive_frames ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending_review', 'approved', 'rejected'))` *(Rec 1.1)*
- Sparse index on `deleted_at WHERE deleted_at IS NULL`
- `CREATE TABLE archive_audit_log` with columns: `log_id UUID PK`, `frame_id UUID FK→archive_frames ON DELETE SET NULL`, `action VARCHAR(50) CHECK (upload|pin|unpin|delete|gc_delete|migrate|promote|reject)`, `performed_by VARCHAR(255)`, `auth_type VARCHAR(50) CHECK (user_jwt|service_token|system)`, `metadata JSONB`, `created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`
- Three indexes: `idx_audit_log_frame_id`, `idx_audit_log_action`, `idx_audit_log_created_at DESC`
- COMMENT ON TABLE
- `CREATE TABLE recording_sessions` *(Rec 1.1 / Rec 2.3)*: `session_id UUID PK DEFAULT gen_random_uuid()`, `frame_id UUID FK→archive_frames ON DELETE CASCADE`, `slot_a_hash VARCHAR(64)`, `slot_b_hash VARCHAR(64)`, `slot_a_submitted_at TIMESTAMP`, `slot_b_submitted_at TIMESTAMP`, `result VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (result IN ('pending','match','mismatch'))`, `promoted_at TIMESTAMP`
- `UNIQUE (frame_id)` constraint on `recording_sessions` (one session per frame)
- Index: `idx_recording_sessions_frame_id ON recording_sessions(frame_id)`

**Pattern:** Match style of `migrations/020_extraction_jobs.sql` exactly (raw SQL, no Alembic).

**Verification:**
```bash
cd packages/shared/api
# Apply to local dev DB (requires running docker-compose up -d db)
psql $DATABASE_URL -f migrations/021_archive_audit_log.sql
# Confirm columns exist
psql $DATABASE_URL -c "\d archive_frames" | grep deleted_at
psql $DATABASE_URL -c "\d archive_audit_log"
```

---

### [ ] Step: A2 — ArchiveAuditLog ORM Model

**Spec ref:** §4.2, §2.2 | **Gate:** 9.4

**Files:**
- `packages/shared/api/src/sator/archival_models.py` [NEW]

**What to implement:**
- Import `Base` from existing database module (match pattern in `extraction_job.py`)
- `ArchiveAuditLog` SQLAlchemy model with all columns from §4.2
- Column name `metadata_json` (mapped to JSONB) to avoid shadowing Python `metadata`
- Do NOT re-define `ExtractionJob`, `ArchiveManifest`, `ArchiveFrame` — they already exist in `extraction_job.py`
- Add `from src.sator.archival_models import ArchiveAuditLog` to any relevant `__init__.py`

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_archive_models.py -v
ruff check src/sator/archival_models.py
mypy src/sator/archival_models.py --ignore-missing-imports
```

Write `tests/unit/test_archive_models.py` covering:
- `ArchiveAuditLog` instantiation with valid values
- `action` enum enforcement (valid + invalid values)
- `auth_type` enum enforcement
- Relationship to `archive_frames` (FK nullable on delete)

---

### [ ] Step: A3 — Archival Pydantic Schemas

**Spec ref:** §5.4 | **Gate:** 9.4 (schemas arm)

**Files:**
- `packages/shared/api/src/sator/archival_schemas.py` [NEW]

**What to implement (all from spec §5.4):**
- `FrameUploadItem` — frame_index, segment_type, timestamp_ms, content_hash, jpeg_data (base64), match_id, manifest_id
- `BatchFrameUploadRequest` — `frames: List[FrameUploadItem] = Field(..., max_length=1000)`, `extraction_job_id: UUID`
- `BatchFrameUploadResponse` — manifest_id, frames_stored, duplicates_skipped, storage_size_bytes
- `PinRequest` — reason, canonical_tier (default "VERIFIED")
- `GCRequest` — retention_days (default 90, ge=1), dry_run (default False)
- `AsyncJobStatus` — job_id, status, result, error, created_at, completed_at
- `AuditLogEntry` — all fields from §5.4
- `FrameQueryResponse` — wraps list of existing `ArchiveFrameResponse` + pagination: total, page, page_size, has_more
- **Extend** `ArchiveFrameResponse` (from `extraction_schemas.py`) with `recording_status: Literal['pending', 'matched', 'mismatched'] | None = None` and `status: Literal['pending_review', 'approved', 'rejected'] = 'approved'` *(Rec 2.3 / Rec 1.1)* — add to `archival_schemas.py` as a subclass or patch note; do NOT modify `extraction_schemas.py` directly; re-export the extended version as `ArchiveFrameResponseV2` from `archival_schemas.py`

**Pattern:** Match Pydantic v2 style from `extraction_schemas.py` (`model_config = ConfigDict(from_attributes=True)`).

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_archive_schemas.py -v
ruff check src/sator/archival_schemas.py
mypy src/sator/archival_schemas.py --ignore-missing-imports
```

Write `tests/unit/test_archive_schemas.py` covering:
- Valid `BatchFrameUploadRequest` with 1 and 1,000 frames
- Rejection of >1,000 frames in batch
- Valid and invalid `GCRequest` (retention_days < 1 must fail)
- `AuditLogEntry` round-trip serialisation

---

### [ ] Step: A4 — Storage Abstraction Layer (Protocol + LocalBackend + S3 Stub)

**Spec ref:** §7 | **Gate:** 9.5

**Files:**
- `packages/shared/api/src/sator/storage/__init__.py` [NEW]
- `packages/shared/api/src/sator/storage/local_backend.py` [NEW]
- `packages/shared/api/src/sator/storage/s3_backend.py` [NEW]

**What to implement:**

`__init__.py` — `StorageBackend` Protocol (runtime_checkable) with: `put(key, data) -> str`, `get(key) -> bytes`, `delete(key) -> None`, `exists(key) -> bool`, `health_check() -> StorageHealthStatus`; define `StorageHealthStatus` dataclass here and export from `__init__.py` *(Rec 2.1)*

`local_backend.py` — `LocalStorageBackend`:
- Env var `ARCHIVE_LOCAL_DATA_DIR` (default `./data/archive_frames`)
- Path pattern: `{dir}/frames/{hash[:2]}/{hash[2:4]}/{hash}.jpg`
- All I/O via `aiofiles`; mkdir via `asyncio.get_event_loop().run_in_executor`
- `put()`: skip write if file already exists (content-addressed)
- `health_check()`: returns `StorageHealthStatus` dataclass `{ accessible: bool, writeable: bool, path: str, error: str | None }` *(Rec 2.1)*; verify dir exists + attempt write of `.health` test file; set `writeable=False` + `error=str(exc)` on failure instead of raising
- `delete()`: `Path.unlink(missing_ok=True)` via executor

`s3_backend.py` — `S3StorageBackend` stub: all methods raise `NotImplementedError("S3 backend available in Phase 2")`

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_storage_backend.py -v
ruff check src/sator/storage/
mypy src/sator/storage/ --ignore-missing-imports
```

Write `tests/unit/test_storage_backend.py` covering:
- `put()` stores file at correct sharded path
- `get()` retrieves stored bytes
- `delete()` removes file; `missing_ok` — no error on double-delete
- `exists()` returns True/False correctly
- `health_check()` returns `StorageHealthStatus(accessible=True, writeable=True, ...)` for valid dir *(Rec 2.1)*
- `health_check()` returns `StorageHealthStatus(accessible=True, writeable=False, error="...")` when write fails
- `put()` on duplicate key returns existing URL (idempotent)
- `S3StorageBackend` raises `NotImplementedError`

---

### [ ] Step: A5 — Archival Service Business Logic

**Spec ref:** §9 | **Gate:** 9.6

**Files:**
- `packages/shared/api/src/sator/archival_service.py` [NEW]

**What to implement:**

`ArchivalService` (async class, injected with `db: AsyncSession` and `storage: StorageBackend`):

- `upload_batch(request: BatchFrameUploadRequest, performed_by: str, auth_type: str) -> BatchFrameUploadResponse`
  - Per frame: query `archive_frames` by `content_hash`; if found → skip + inc `duplicates_skipped`; else → `storage.put()` → insert `ArchiveFrame` → append audit log entry (action=`upload`)
  - Bulk-insert audit log after batch completes

- `get_frames(match_id: UUID, segment_type=None, is_pinned=None, page=0, page_size=50) -> FrameQueryResponse`
  - Filter `WHERE deleted_at IS NULL`; paginate; return with `has_more` and `total`

- `pin_frame(frame_id: UUID, request: PinRequest, admin_user: str) -> ArchiveFrame`
  - Set `is_pinned=True`, `pinned_by=admin_user`, `accuracy_tier=VERIFIED` if canonical_tier="VERIFIED"
  - Write audit log (action=`pin`, auth_type=`user_jwt`)

- `unpin_frame(frame_id: UUID, admin_user: str) -> ArchiveFrame`
  - Set `is_pinned=False`, clear `pinned_by`; audit log (action=`unpin`)

- `soft_delete_frame(frame_id: UUID, admin_user: str) -> None`
  - Set `deleted_at=utcnow()`; audit log (action=`delete`)

- `run_gc(request: GCRequest, performed_by: str) -> AsyncJobStatus`
  - GC rules per spec §9.2: STANDARD tier < cutoff; HIGH tier < 365-day cutoff; VERIFIED → never
  - `dry_run=True`: return count only, no mutations
  - `dry_run=False`: `storage.delete()` + `deleted_at=utcnow()` + audit log (action=`gc_delete`)

- `get_audit_log(page=0, page_size=50) -> list[AuditLogEntry]`

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_archival_service.py -v
ruff check src/sator/archival_service.py
mypy src/sator/archival_service.py --ignore-missing-imports
```

Write `tests/unit/test_archival_service.py` covering:
- `upload_batch`: happy path (N frames stored, 0 dupes)
- `upload_batch`: dedup — same content_hash uploaded twice, `duplicates_skipped=1`
- `pin_frame`: sets is_pinned, writes audit log entry with action=`pin`
- GC: deletes STANDARD frames older than cutoff
- GC: skips pinned (is_pinned=True) frames
- GC: dry_run=True returns candidates without mutating DB
- `soft_delete_frame`: sets deleted_at; subsequent `get_frames` excludes it

---

### [ ] Step: A6 — Prometheus Metrics Module

**Spec ref:** §9.3 | **Gate:** 9.6 (metrics arm)

**Files:**
- `packages/shared/api/src/sator/archival_metrics.py` [NEW]

**What to implement:**
```python
archive_frames_uploaded_total     = Counter("archive_frames_uploaded_total", ..., labelnames=["segment_type"])
archive_frames_deduplicated_total = Counter("archive_frames_deduplicated_total", ...)
archive_frames_deleted_total      = Counter("archive_frames_deleted_total", ..., labelnames=["reason"])
archive_query_latency_seconds     = Histogram("archive_query_latency_seconds", ...)
archive_storage_bytes             = Gauge("archive_storage_bytes", ...)
```

- Wrap with `try: from prometheus_client import Counter, Histogram, Gauge` guard (match existing `main.py` pattern)
- If prometheus_client unavailable: define no-op stub classes so imports never fail
- Import and call metrics from `archival_service.py` at the appropriate points

**Verification:**
```bash
cd packages/shared/api
python -c "from src.sator.archival_metrics import archive_frames_uploaded_total; print('OK')"
ruff check src/sator/archival_metrics.py
```

---

### [ ] Step: A7 — Dual Recording Handshake Service Stub

**Spec ref:** §6 | **Gate:** 9.6 (dual-recording arm)

**Files:**
- `packages/shared/api/src/sator/dual_recording_service.py` [NEW]

**What to implement:**
```python
class HandshakeResult(str, Enum):
    MATCH = "match"
    MISMATCH = "mismatch"
    PENDING = "pending"

class DualRecordingService:
    async def submit_recording(self, frame_id: UUID, slot: Literal["A", "B"], db: AsyncSession) -> UUID:
        """
        Register recording slot A or B. Returns verification_session_id (= recording_sessions.session_id).
        Persists to recording_sessions table via INSERT … ON CONFLICT (frame_id) DO UPDATE
        SET slot_b_hash = excluded.slot_b_hash, slot_b_submitted_at = now()
        (Rec 1.1 / Rec 2.3 — no longer in-memory)
        """

    async def check_handshake(self, session_id: UUID, db: AsyncSession) -> HandshakeResult:
        """
        Phase 1: reads recording_sessions row by session_id; sets result='match', returns MATCH.
        Phase 2 (future): pixel comparison via OpenCV before setting result.
        (Rec 2.3 — reads from DB, sets result column)
        """

    async def promote_to_canonical(self, frame_id: UUID, admin_user_id: str, db: AsyncSession) -> ArchiveFrame:
        """
        Admin approval (status transition: pending_review → approved):
        - Sets archive_frames.status = 'approved' (Rec 1.1)
        - Sets accuracy_tier = VERIFIED, is_pinned = True, pinned_by = admin_user_id
        - Writes ArchiveAuditLog entry: action='promote', auth_type='user_jwt'
        - Returns updated ArchiveFrame
        """

    async def reject_frame(self, frame_id: UUID, admin_user_id: str, db: AsyncSession) -> ArchiveFrame:
        """
        Admin rejection (Rec 1.1):
        - Sets archive_frames.status = 'rejected'
        - Writes ArchiveAuditLog entry: action='reject', auth_type='user_jwt', performed_by=admin_user_id
        - Returns updated ArchiveFrame
        """
```

Phase 1: `check_handshake` reads from `recording_sessions`, auto-sets `result='match'`, returns MATCH. `promote_to_canonical` and `reject_frame` perform real DB mutations + audit log. (Rec 1.1 / Rec 2.3)

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_archival_service.py -k "dual_recording or promote" -v
ruff check src/sator/dual_recording_service.py
mypy src/sator/dual_recording_service.py --ignore-missing-imports
```

---

### [ ] Step: A8 — Archive FastAPI Router (9 Endpoints)

**Spec ref:** §5.1 | **Gate:** 9.7

**Files:**
- `packages/shared/api/routers/archive.py` [NEW]

**Endpoints to implement (`prefix="/v1/archive"`, `tags=["archive"]`):**

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/frames` | `_require_service_token` | Batch upload → `archival_service.upload_batch` |
| GET | `/matches/{match_id}/frames` | Public | Paginated query → `archival_service.get_frames` |
| GET | `/frames/{frame_id}` | Public | Single frame; 404 if `deleted_at IS NOT NULL` |
| DELETE | `/frames/{frame_id}` | `_require_admin` | Soft-delete → `archival_service.soft_delete_frame` |
| POST | `/frames/{frame_id}/pin` | `_require_admin` | Pin → `archival_service.pin_frame` |
| DELETE | `/frames/{frame_id}/pin` | `_require_admin` | Unpin → `archival_service.unpin_frame` |
| POST | `/frames/{frame_id}/promote` | `_require_admin` | Promote to CANONICAL → `dual_recording_service.promote_to_canonical` |
| GET | `/manifests/{manifest_id}` | Public | Manifest metadata |
| GET | `/audit` | `_require_admin` | Paginated audit log |
| POST | `/storage/verify` | `_require_admin` | Re-hash integrity check |
| GET | `/health` | Public | Storage health check *(Rec 2.1)*: returns `{ storage_backend: str, data_dir_accessible: bool, data_dir_writeable: bool, data_dir_path: str, frame_count: int, storage_bytes: int, last_gc_run: str \| null, storage_error: str \| null }` — calls `storage.health_check()` + DB count query |

**Auth helpers (new in `routers/archive.py` or shared `auth_utils.py`):**
- `_require_admin(current_user)` — import from `routers/admin.py` pattern
- `_require_service_token(request: Request)` — reads `X-Service-Token` header, compares to `os.getenv("ARCHIVAL_SERVICE_SECRET")`, raises `HTTP 401` on mismatch

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_archive_routes.py -v
ruff check routers/archive.py
mypy routers/archive.py --ignore-missing-imports
```

Write `tests/unit/test_archive_routes.py` covering:
- `POST /frames`: valid payload → 200 with `BatchFrameUploadResponse`
- `POST /frames`: missing/invalid service token → 401
- `POST /frames`: duplicate frames return existing IDs with `duplicates_skipped > 0`
- `GET /matches/{id}/frames`: returns paginated list
- `DELETE /frames/{id}`: soft-deletes; subsequent GET returns 404
- `POST /frames/{id}/pin`: pins frame; non-admin → 403
- `POST /frames/{id}/promote`: sets VERIFIED tier; returns updated frame
- `GET /audit`: returns paginated audit entries; non-admin → 403
- `GET /health`: 200 with storage backend name, `data_dir_accessible=true`, `frame_count` as int *(Rec 2.1)*

---

### [ ] Step: A8.5 — Admin Review Queue Endpoints

**Spec ref:** Rec 1.1 | **Gate:** 9.7

**Files:**
- `packages/shared/api/routers/archive_admin.py` [MODIFIED — add to this file]

**Endpoints (`prefix="/v1/admin/archive"`, `tags=["archive-admin"]`):**

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/review-queue` | `_require_admin` | Paginated `archive_frames WHERE status = 'pending_review'`; query params: `page=0`, `page_size=50` |
| GET | `/recording-sessions` | `_require_admin` | Paginated `recording_sessions`; query params: `page=0`, `page_size=50`, optional `frame_id` filter |

**What to implement:**
- Both return standard `{ items: list, total: int, page: int, page_size: int, has_more: bool }` envelope
- `review-queue` returns `ArchiveFrameResponseV2` list (includes `status`, `recording_status` fields)
- `recording-sessions` returns rows with: `session_id`, `frame_id`, `slot_a_hash`, `slot_b_hash`, `result`, `slot_a_submitted_at`, `slot_b_submitted_at`, `promoted_at`
- Both endpoints require admin JWT; non-admin → 403

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_archive_admin_routes.py -k "review_queue or recording_sessions" -v
ruff check routers/archive_admin.py
mypy routers/archive_admin.py --ignore-missing-imports
```

Write tests in `tests/unit/test_archive_admin_routes.py` covering:
- `test_review_queue_returns_pending_frames`: insert 3 `pending_review` frames + 2 `approved` → endpoint returns 3
- `test_review_queue_non_admin_403`: no admin JWT → 403
- `test_recording_sessions_paginated`: 10 sessions, page_size=5 → `has_more=true`
- `test_recording_sessions_filter_by_frame_id`: filter returns only matching session

---

### [ ] Step: A9 — Archive Admin Router (3 Endpoints)

**Spec ref:** §5.2 | **Gate:** 9.7

**Files:**
- `packages/shared/api/routers/archive_admin.py` [NEW]

**Endpoints (`prefix="/v1/admin/archive"`, `tags=["archive-admin"]`):**

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/gc` | `_require_admin` | Trigger GC async job → `archival_service.run_gc` |
| GET | `/jobs/{job_id}` | `_require_admin` | Poll `AsyncJobStatus` by job_id (in-memory store or DB) |
| POST | `/migrate` | `_require_admin` | Trigger storage backend migration (stub in Phase 1) |

GC job dispatch: use `asyncio.create_task` (background, non-blocking). Store job result in module-level `dict[UUID, AsyncJobStatus]` for Phase 1 (no Redis/DB persistence needed yet).

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_archive_admin_routes.py -v
ruff check routers/archive_admin.py
mypy routers/archive_admin.py --ignore-missing-imports
```

---

### [ ] Step: A10 — Wire Routers into main.py + Update requirements.txt

**Spec ref:** §3.2 | **Gate:** 9.7

**Files modified:**
- `packages/shared/api/main.py`
- `packages/shared/api/requirements.txt`

**main.py:** Add three router imports and `app.include_router()` calls:
```python
from routers.archive import router as archive_router
from routers.archive_admin import router as archive_admin_router
from routers.extraction import router as extraction_router

app.include_router(archive_router, prefix="/v1")
app.include_router(archive_admin_router, prefix="/v1")
app.include_router(extraction_router, prefix="/v1")
```

Add storage gauge warm-up in `lifespan` startup (alongside existing `warm_leaderboard_cache`): *(Rec 2.1)*
```python
asyncio.create_task(archival_service.update_storage_gauge())
```
`update_storage_gauge()` must be implemented in `archival_service.py`: queries `SUM(jpeg_size_bytes)` from `archive_frames WHERE deleted_at IS NULL` and calls `archive_storage_bytes.set(result)` (Prometheus gauge from `archival_metrics.py`).

**requirements.txt:** Add (only if not already present):
```
ffmpeg-python>=0.2.0
opencv-python>=4.8.0
aiofiles>=23.2.0
pillow>=10.0.0
prometheus_client>=0.19.0
```

**Verification:**
```bash
cd packages/shared/api
pip install -r requirements.txt
python -c "from main import app; print('Routers wired OK')"
uvicorn main:app --port 8000 &
curl http://localhost:8000/docs | grep -q "archive"
kill %1
```

---

### [ ] Step: A10.5 — OPERA Montage Schedule API

**Spec ref:** Rec 1.2 | **Gate:** 9.7

**Files:**
- `packages/shared/api/routers/opera.py` [NEW]
- `packages/@njz/types/src/legacy-data.ts` [MODIFIED — add `MontageScheduleEntry`]

**Backend — `routers/opera.py` (`prefix="/v1/opera"`, `tags=["opera"]`):**

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/montage-schedule` | Public | Returns `list[MontageScheduleEntry]`; query param `week: int = current_week` |
| POST | `/admin/opera/montage-schedule` | `_require_admin` | Stub — returns `HTTP 501 {"detail": "Available in Phase 2"}` |

Phase 1: `GET /v1/opera/montage-schedule` returns hardcoded 5-entry list; entries vary by `week` param (mod 5 rotation).

**`MontageScheduleEntry` type** (add to `packages/@njz/types/src/legacy-data.ts`):
```typescript
export interface MontageScheduleEntry {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  game: 'valorant' | 'cs2';
  weekNumber: number;
  scheduledAt: string;
  validFrom: string;
  validUntil: string;
  adBreakAfterMatchId?: string;
}
```

Wire router in `main.py`:
```python
from routers.opera import router as opera_router
app.include_router(opera_router, prefix="/v1")
```

**Verification:**
```bash
cd packages/shared/api
uvicorn main:app --port 8000 &
curl "http://localhost:8000/v1/opera/montage-schedule?week=1"
# Expect: 200 JSON array with 5 entries, each has id/title/videoUrl/weekNumber fields
kill %1
ruff check routers/opera.py
mypy routers/opera.py --ignore-missing-imports
```

---

### [ ] Step: A11 — Archive Integration Tests

**Spec ref:** §12.1, PRD AC-09 to AC-11 | **Gate:** 9.7

**Files:**
- `packages/shared/api/tests/integration/test_archive_e2e.py` [NEW]

**Test scenarios:**
- `test_round_trip`: upload 10 frames → query by match_id → verify count and fields
- `test_deduplication`: upload same frame twice → `duplicates_skipped=1`
- `test_concurrent_dedup`: asyncio.gather 5 concurrent uploads of same hash → only 1 stored
- `test_gc_pinned`: upload N frames; pin 2; run GC (retention_days=0) → pinned frames survive, unpinned deleted
- `test_soft_delete_excludes_from_query`: delete frame → `GET /frames/{id}` returns 404; not in list query
- `test_audit_log_populated`: after upload+pin+delete → audit log has 3 entries for that frame

Use `pytest-asyncio` fixtures + `AsyncClient` (httpx) against `TestClient(app)`.

**Verification:**
```bash
cd packages/shared/api
pytest tests/integration/test_archive_e2e.py -v --tb=short
```

---

### PHASE B — Extraction Pipeline Backend (~2 days | Gates 9.8–9.9)

---

### [ ] Step: B1 — Extraction Pipeline (FFmpeg + OpenCV)

**Spec ref:** §10.1 | **Gate:** 9.8

**Files:**
- `packages/shared/api/src/sator/extraction_pipeline.py` [NEW]

**What to implement (`ExtractionPipeline` async class):**

```python
async def run(self, job: ExtractionJob, db: AsyncSession) -> None
```

Stages (sequential, all async):
1. Update `job.status = "running"`, commit
2. `ffmpeg.probe(job.vod_path)` → extract `duration_ms`, `fps`, `resolution_w`, `resolution_h`; store in job metadata
3. OpenCV `VideoCapture` at 1 fps: iterate frames, crop bottom-right 25% bounding box (`x: W*0.75, y: H*0.75, w: W*0.25, h: H*0.25`)
4. Encode each crop as JPEG bytes (`cv2.imencode('.jpg', crop)`)
5. `SegmentClassifier.classify(frame_bgr)` → segment_type string
6. SHA-256 deduplication: skip if identical to previous frame hash
7. Accumulate into batch of 100; call `ArchivalService.upload_batch()` per batch
8. On completion: `job.status = "completed"`, `job.frame_count = total_stored`, `job.manifest_id = last_manifest_id`
9. On any exception: `job.status = "failed"`, `job.error_message = str(exc)`, commit

OpenCV loop must use `asyncio.get_event_loop().run_in_executor` for blocking VideoCapture calls (no blocking I/O on event loop).

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_extraction_pipeline.py -v
ruff check src/sator/extraction_pipeline.py
mypy src/sator/extraction_pipeline.py --ignore-missing-imports
```

Write `tests/unit/test_extraction_pipeline.py` covering (use mock VOD / patch cv2):
- `test_metadata_parsed`: `ffmpeg.probe` called; job metadata updated
- `test_frame_extracted_at_1fps`: VideoCapture mock yields 30 frames → pipeline calls extract 30 times
- `test_minimap_crop_applied`: crop bounding box verified against frame dimensions
- `test_consecutive_dedup_skipped`: two identical consecutive SHA-256 frames → second skipped
- `test_batch_upload_called`: 150 frames → archival upload called twice (batches of 100)
- `test_job_status_failed_on_exception`: ffmpeg.probe raises → job.status = "failed"

---

### [ ] Step: B2 — Segment Classifier

**Spec ref:** §10.2 | **Gate:** 9.8

**Files:**
- `packages/shared/api/src/sator/segment_classifier.py` [NEW]

**What to implement:**

```python
class SegmentClassifier:
    def classify(self, frame_bgr: np.ndarray) -> str:
        """Returns one of: IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN"""
```

OpenCV HSV analysis only (no Tesseract, no ML, no pytesseract):
- Extract timer region: fixed box top-center (scaled from 1920×1080 reference)
- `BUY_PHASE`: HSV H∈[15,40], S>100, V>100 cluster in timer region
- `HALFTIME`: pixel analysis for symmetric score layout (centre-split symmetry heuristic)
- `BETWEEN_ROUND`: mean brightness of full frame < 20 (near-black transition)
- `IN_ROUND`: timer region present, no BUY_PHASE/HALFTIME/BETWEEN_ROUND pattern
- `UNKNOWN`: default fallback if none match

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_segment_classification.py -v
ruff check src/sator/segment_classifier.py
mypy src/sator/segment_classifier.py --ignore-missing-imports
```

Write `tests/unit/test_segment_classification.py` covering (use synthetic test frames via `np.zeros`/`np.ones` + color fill):
- `test_classify_buy_phase`: orange-filled timer region → `BUY_PHASE`
- `test_classify_between_round`: near-black frame → `BETWEEN_ROUND`
- `test_classify_unknown`: empty grey frame → `UNKNOWN`
- `test_classify_returns_string`: result is always one of the 5 valid strings

---

### [ ] Step: B3 — Extraction FastAPI Router

**Spec ref:** §5.3 | **Gate:** 9.9

**Files:**
- `packages/shared/api/routers/extraction.py` [NEW]

**Endpoints (`prefix="/v1/extraction"`, `tags=["extraction"]`):**

`POST /jobs` (Admin JWT required):
- Request body: `{ match_id: UUID, vod_source: "local", vod_path: str }`
- Creates `ExtractionJob` record (status=`pending`)
- `asyncio.create_task(pipeline.run(job, db))` — non-blocking dispatch
- Response: `{ job_id: UUID, status: "pending" }`

`GET /jobs/{job_id}` (Admin JWT required):
- Returns: `{ job_id, status, frame_count, manifest_id, error_message, created_at, completed_at }`
- 404 if job not found

**Verification:**
```bash
cd packages/shared/api
pytest tests/unit/test_extraction_routes.py -v
ruff check routers/extraction.py
mypy routers/extraction.py --ignore-missing-imports
```

Write `tests/unit/test_extraction_routes.py` covering:
- `test_create_job`: valid payload → 202, job record created, background task dispatched
- `test_create_job_non_admin`: no admin JWT → 403
- `test_poll_status_pending`: returns `status="pending"` immediately after create
- `test_poll_status_404`: unknown job_id → 404

---

### PHASE C — Frontend Core Components (~2 days | Gates 9.10–9.11)

---

### [ ] Step: C1 — Mock Archival Client

**Spec ref:** §8.6, §13 note 5 | **Gate:** 9.10

**Files:**
- `apps/web/src/mocks/mockArchivalClient.ts` [NEW]

**What to implement:**
- `MockArchivalAPI` class with `getFrames(matchId, page, pageSize)` method
- Returns realistic in-memory paginated `ArchiveFrameResponse[]` (50 synthetic entries per page, 3 pages max)
- Generates frame entries with: `frame_id` (uuid), `frame_index`, `segment_type` (cycling through all 5), `timestamp_ms`, `is_pinned` (occasional), `storage_url` (placeholder `/mock/frames/{hash}.jpg`), `jpeg_size_bytes`, `created_at`
- `VITE_USE_MOCK_ARCHIVAL` env flag check: export `getArchivalClient()` factory that returns mock or real client based on flag
- Export `MockArchivalAPI` and `getArchivalClient`

**Verification:**
```bash
cd apps/web
pnpm run test -- mockArchivalClient
pnpm run typecheck
```

---

### [ ] Step: C2 — useMinimapFrames Hook

**Spec ref:** §8.6 | **Gate:** 9.10

**Files:**
- `apps/web/src/hooks/useMinimapFrames.ts` [NEW]

**What to implement:**
- TanStack Query v5 hook wrapping `getArchivalClient().getFrames(matchId, page, pageSize)`
- Query key: `["minimap-frames", matchId, page, pageSize]`
- Stale time: 5 minutes; retry: 3
- Return shape (spec §8.6): `{ frames, isLoading, error, hasMore, totalPages, currentPage, goToNextPage, goToPrevPage, refetch, pendingReviewCount }` *(Rec 1.1)*
- `goToNextPage()` / `goToPrevPage()` use `useState` for `currentPage`; clamp to `[0, totalPages-1]`
- `pendingReviewCount`: derived from current page's `frames` — count of items where `frame.status === 'pending_review'`; computed via `useMemo`

**Verification:**
```bash
cd apps/web
pnpm run test -- useMinimapFrames
pnpm run typecheck
```

Write tests covering:
- Returns frames from mock client on initial render
- `goToNextPage()` increments `currentPage`
- `hasMore` false on last page
- Loading state during fetch
- `pendingReviewCount` equals count of `status === 'pending_review'` frames in mock response *(Rec 1.1)*

---

### [ ] Step: C2.5 — useMinimapFramesPair Hook + SecondaryMatchSelector

**Spec ref:** Rec 1.3 | **Gate:** 9.10

**Files:**
- `apps/web/src/hooks/useMinimapFramesPair.ts` [NEW]
- `apps/web/src/hub-2-rotas/components/MinimapFrameGrid/SecondaryMatchSelector.tsx` [NEW]
- `apps/web/src/hub-2-rotas/components/MinimapFrameGrid/MinimapDiffWipe.tsx` [NEW]

**`useMinimapFramesPair(primaryMatchId, secondaryMatchId, pageSize)`:**
- Runs two `useMinimapFrames` calls internally (primary + secondary)
- Returns `{ primary, secondary, syncedPage, syncPage() }`
- `syncPage(n)`: advances both to page `n`; secondary clamped to `min(n, secondary.totalPages - 1)` — no error thrown when secondary exhausted
- "Frames exhausted" flag: `secondaryExhausted: boolean` — true when `syncedPage >= secondary.totalPages`

**`SecondaryMatchSelector`** (`hub-2-rotas/components/MinimapFrameGrid/SecondaryMatchSelector.tsx`):
- Dropdown populated from `useMatches()` hook (existing TanStack Query hook)
- Props: `onSelect: (matchId: string) => void`, `currentMatchId?: string`
- Tailwind: match existing hub select/dropdown styling
- Renders `"Select a match to compare"` placeholder when no selection

**`MinimapDiffWipe`** (`hub-2-rotas/components/MinimapFrameGrid/MinimapDiffWipe.tsx`):
- Two children rendered side-by-side in a 50/50 split layout
- CSS `clip-path` vertical drag-handle wipe: `<div>` with draggable divider line
- Props: `left: ReactNode`, `right: ReactNode`, `initialSplit?: number` (default 50)
- `onDrag`: updates `clipPath` via `useState(splitPercent)` → `clip-path: inset(0 ${100-split}% 0 0)` on right panel
- "Frames exhausted" overlay: when `secondaryExhausted=true`, right panel shows `<div className="...overlay">Frames exhausted</div>`

**Verification:**
```bash
cd apps/web
pnpm run test -- useMinimapFramesPair SecondaryMatchSelector MinimapDiffWipe
pnpm run typecheck
```

Write tests covering:
- `useMinimapFramesPair`: `syncPage(3)` updates both primary and secondary page
- `useMinimapFramesPair`: secondary clamped when `syncedPage >= secondary.totalPages` → `secondaryExhausted=true`
- `SecondaryMatchSelector`: renders match list from `useMatches`; `onSelect` called on change
- `MinimapDiffWipe`: renders left and right children; drag updates split percentage

---

### [ ] Step: C3 — Shared Minimap Sub-Components

**Spec ref:** §3.3 (FrameThumbnail, SegmentTypeBadge, VerificationBadge, MinimapLightbox, MinimapModeSelector) | **Gate:** 9.10

**Files (all in `apps/web/src/hub-2-rotas/components/MinimapFrameGrid/`):**
- `FrameThumbnail.tsx` [NEW]
- `SegmentTypeBadge.tsx` [NEW]
- `VerificationBadge.tsx` [NEW]
- `MinimapLightbox.tsx` [NEW]
- `MinimapModeSelector.tsx` [NEW]

**SegmentTypeBadge:** Color-coded pill per spec §2.3.4:
- `IN_ROUND` → red (`bg-red-500`)
- `BUY_PHASE` → green (`bg-green-500`)
- `HALFTIME` → yellow (`bg-yellow-500`)
- `BETWEEN_ROUND` → gray (`bg-gray-500`)
- `UNKNOWN` → muted (`bg-gray-200 text-gray-600`)

**VerificationBadge:** *(Rec 1.1 / Rec 2.3)* — THREE states:
- **`approved`** (`is_pinned=true` OR `frame.status === 'approved'`): `CheckCircle2` icon, `text-teal-400`
- **`pending_review`** (`frame.status === 'pending_review'`): amber animated spinner (`animate-spin`), `text-amber-400`; tooltip "Awaiting admin review"
- **`rejected`/unpinned** (`frame.status === 'rejected'` OR `is_pinned=false`): gray placeholder icon, `text-gray-400`
- Props: `is_pinned: boolean`, `status: 'pending_review' | 'approved' | 'rejected'`, `recordingStatus: 'pending' | 'matched' | 'mismatched' | null`, `onPin?: () => void`
- `recordingStatus` surfaced as a small secondary indicator below badge: `matched` → small green dot, `pending` → amber dot, `mismatched` → red dot, `null` → nothing
- `onPin?: () => void` prop (optional — only passed in admin+vod-review mode); no-op if undefined

**FrameThumbnail:**
- `<img src={frame.storage_url} />` + `SegmentTypeBadge` overlay (bottom-left) + `VerificationBadge` overlay (top-right)
- Timestamp overlay bottom-right in `HH:MM:SS.mmm`
- `onClick` → open `MinimapLightbox`
- Tailwind: `relative overflow-hidden rounded-md cursor-pointer hover:ring-2 ring-teal-400`

**MinimapLightbox:**
- Fullscreen modal (`fixed inset-0 z-50 bg-black/90`)
- Shows full-res `<img>`, frame metadata, segment badge, verification badge
- Keyboard nav: `ArrowLeft`/`ArrowRight` cycles frames in current page; `Escape` closes
- Uses `useEffect` to bind/unbind keyboard events

**MinimapModeSelector:**
- Tab bar: `simulation | xSimulation | vod-review`
- Props: `mode: MinimapMode`, `onModeChange: (mode: MinimapMode) => void`
- Tailwind tab styling matching existing hub tab patterns

**Verification:**
```bash
cd apps/web
pnpm run test -- SegmentTypeBadge VerificationBadge FrameThumbnail MinimapLightbox MinimapModeSelector
pnpm run typecheck
```

Write tests for `VerificationBadge` covering *(Rec 1.1)*:
- `status='approved'` renders `CheckCircle2` with `text-teal-400`
- `status='pending_review'` renders spinner with `text-amber-400`
- `status='rejected'` renders gray icon
- `recordingStatus='matched'` renders green secondary dot
- `recordingStatus='mismatched'` renders red secondary dot

---

### [ ] Step: C4 — SATOR MinimapReviewPanel

**Spec ref:** §8.1 | **Gate:** 9.11

**Files:**
- `apps/web/src/hub-1-sator/components/MinimapReviewPanel.tsx` [NEW]
- `apps/web/src/hub-1-sator/index.jsx` [MODIFIED]

**MinimapReviewPanel constraints (read-only, 3×3 grid, page 0 only):**
- `useMinimapFrames(matchId, 0, 9)` — 9 frames max
- `max-w-[25%]` container (max 1/4 screen width inside SATOR grid)
- 3×3 CSS grid of `FrameThumbnail` (read-only: no `onPin` prop passed to `VerificationBadge`)
- `MinimapLightbox` opens on click (frames = all 9 in panel)
- No pagination controls; no `MinimapModeSelector`
- Loading: 3×3 skeleton grid (`animate-pulse bg-gray-700 rounded-md`)
- Empty: `<p className="text-gray-500 text-sm">No minimap frames available</p>`

**hub-1-sator/index.jsx:** Import and render `<MinimapReviewPanel matchId={selectedMatchId} />` in the review/analysis section. Use existing `selectedMatchId` state or mock `"mock-match-001"` if no live match selected.

**Verification:**
```bash
cd apps/web
pnpm run test -- MinimapReviewPanel
pnpm run typecheck
pnpm run lint
```

---

### [ ] Step: C5 — ROTAS MinimapFrameGrid (Full Modular, 3 Modes)

**Spec ref:** §8.2 | **Gate:** 9.11

**Files:**
- `apps/web/src/hub-2-rotas/components/MinimapFrameGrid/index.tsx` [NEW]
- `apps/web/src/hub-2-rotas/index.jsx` [MODIFIED]

**MinimapFrameGrid — 3 modes (`MinimapMode = 'simulation' | 'xSimulation' | 'vod-review'`):**

All modes share: `useMinimapFrames(matchId, page, 50)`, `MinimapModeSelector`, 5-col CSS grid of `FrameThumbnail`.

`simulation` mode:
- Hover on frame shows sim overlay div (tick number, simulated economy state)
- Tick scrubber: `<input type="range" min={0} max={frames.length-1} />` below grid

`xSimulation` mode *(Rec 1.3)*:
- Uses `useMinimapFramesPair(matchId, secondaryMatchId, 50)` — NOT two separate `useMinimapFrames` calls
- If `secondaryMatchId` not provided: render `<SecondaryMatchSelector onSelect={setSecondaryMatchId} />` instead of grid
- Renders `<MinimapDiffWipe left={<grid of primary frames>} right={<grid of secondary frames>} secondaryExhausted={pair.secondaryExhausted} />` in 50/50 layout
- Sync pagination via `pair.syncPage()` — single "Next Page" control advances both
- "Frames exhausted" overlay handled by `MinimapDiffWipe` when `pair.secondaryExhausted=true`

`vod-review` mode (full features):
- Full pagination controls (Previous / Next / `Page N of M`)
- `VerificationBadge` receives `onPin` callback when `isAdmin=true` → `POST /v1/archive/frames/{id}/pin` via `useMinimapFrames.refetch()` after optimistic update (Phase E wires real API; Phase C uses mock)

**hub-2-rotas/index.jsx:** Import and render `<MinimapFrameGrid matchId={...} mode="vod-review" isAdmin={false} />` in the VOD/simulation analysis section.

**Verification:**
```bash
cd apps/web
pnpm run test -- MinimapFrameGrid
pnpm run typecheck
pnpm run lint
```

---

### PHASE D — OPERA Split Tools (~2 days | Gates 9.12–9.13)

---

### [ ] Step: D1 — useRotasLens Hook

**Spec ref:** §8.7 | **Gate:** 9.12

**Files:**
- `apps/web/src/hooks/useRotasLens.ts` [NEW]

**What to implement:**
- Uses existing `useWebSocket` hook (or equivalent) to connect to `/ws/lens-updates`
- On connect: sends `LensDataRequest` JSON `{ matchId, lensTypes }` (match shape from `map_routes.py`)
- On message: parses `LensOverlayData` response; stores in `useState`
- `requestLensUpdate(region?: BoundingBox)`: sends updated request with optional region crop
- Return: `{ overlayData: LensOverlayData | null, isConnected: boolean, requestLensUpdate }`
- Graceful disconnect on unmount (`useEffect` cleanup)

Types: import `LensOverlayData`, `LensDataRequest`, `BoundingBox` from `@njz/types` or define locally in `hub-4-opera/types.ts` (OPERA isolation boundary — no import from ROTAS components).

**Verification:**
```bash
cd apps/web
pnpm run test -- useRotasLens
pnpm run typecheck
```

---

### [ ] Step: D2 — OPERA AdvancedLiveMapGrid

**Spec ref:** §8.3, §2.5 | **Gate:** 9.12

**Files:**
- `apps/web/src/hub-4-opera/components/LiveMap/AdvancedLiveMapGrid.tsx` [NEW]
- `apps/web/src/hub-4-opera/types.ts` [NEW if not exists]

**What to implement:**
- Props: `{ matchId: string, streamUrl?: string, enabledLenses?: string[], onRotasLensRequest?: (data: LensOverlayData) => void }`
- Uses `useRotasLens(matchId, enabledLenses ?? [])` for overlay data
- Main grid: `useMinimapFrames(matchId)` frames displayed in 4-col grid
- ROTAS Lens overlay: when `overlayData` present, renders as semi-transparent CSS overlay `<div>` on top of grid (position absolute, pointer-events-none)
- `onRotasLensRequest` emits `overlayData` to parent OPERA sidebar for economy/tension display
- Lens controls: multi-select checkbox list of available lens types (from `enabledLenses`)
- Does NOT import from `ModerateLiveMapGrid` or any ROTAS component

**Verification:**
```bash
cd apps/web
pnpm run test -- AdvancedLiveMapGrid
pnpm run typecheck
pnpm run lint
```

---

### [ ] Step: D3 — OPERA ModerateLiveMapGrid (Mobile-Optimised, Independent)

**Spec ref:** §8.4 | **Gate:** 9.13

**Files:**
- `apps/web/src/hub-4-opera/components/LiveMap/ModerateLiveMapGrid.tsx` [NEW]

**Key distinctions from Advanced (zero shared render logic):**
- Props: `{ matchId: string, aspectRatio?: '9:16' | '4:3' | '16:9', autoHideControls?: boolean }`
- Default aspect ratio: `9:16` vertical layout (`aspect-[9/16]`)
- Swipe gestures: use existing `useTouchGesture` hook for prev/next page
- Icon-only segment badges: no text labels (just `SegmentTypeBadge` in icon-only mode via `iconOnly` prop)
- Single lens picker: `<select>` with max 3 options; no multi-select
- Auto-hide controls: `setTimeout(3000)` on any interaction → hide controls `<div className="opacity-0 transition-opacity">`; touch resets timer
- No `useRotasLens` import — entirely standalone
- No import from `AdvancedLiveMapGrid`

**Verification:**
```bash
cd apps/web
pnpm run test -- ModerateLiveMapGrid
pnpm run typecheck
pnpm run lint
```

---

### [ ] Step: D4 — MontageReelPlayer + MontageFile Types

**Spec ref:** §8.5 | **Gate:** 9.13

**Files:**
- `apps/web/src/hub-4-opera/components/MontageReel/MontageReelPlayer.tsx` [NEW]

**What to implement:**

`MontageFile` interface (define in `hub-4-opera/types.ts`):
```ts
interface MontageFile {
  id: string; title: string; videoUrl: string; thumbnailUrl: string;
  durationSeconds: number; game: 'valorant' | 'cs2';
  weekNumber: number; scheduledAt: string;
}
```

`MontageReelPlayer` component:
- Phase 1: hardcoded `mockMontageSchedule` — 5 `MontageFile` entries (mixed valorant/cs2, varying durations)
- `<video>` element with `autoPlay muted loop` cycling through weekly set
- On video `onEnded`: advance to next file in schedule (wraps around)
- Game filter prop: `game?: 'valorant' | 'cs2'` filters schedule
- Progress indicator: shows current title + week number
- Thumbnail shown while video loading

**Verification:**
```bash
cd apps/web
pnpm run test -- MontageReelPlayer
pnpm run typecheck
```

---

### [ ] Step: D5 — HighlightReelContainer (Ad-Break Scheduler + Weekly Rotation)

**Spec ref:** §8.5 | **Gate:** 9.13

**Files:**
- `apps/web/src/hub-4-opera/components/HighlightReel/HighlightReelContainer.tsx` [NEW]
- `apps/web/src/hub-4-opera/hooks/useAdBreakWindows.ts` [NEW] *(Rec 1.2)*

**What to implement:**

`useAdBreakWindows(game: 'valorant' | 'cs2')` hook (`hub-4-opera/hooks/useAdBreakWindows.ts`) *(Rec 1.2)*:
- Reads calendar event intervals from existing `EsportsCalendar.tsx` context (import calendar context provider from OPERA hub)
- Returns `{ windows: Array<{ startsAt: string, endsAt: string }> }` — time intervals between matches where ads can be shown
- Uses `useMemo` to compute gaps between back-to-back calendar events

`HighlightReelContainer`:
- Fetches schedule via `useQuery(["montage-schedule", weekNumber], () => apiFetch("/opera/montage-schedule?week=" + weekNumber))` *(Rec 1.2)* — real API from A10.5; falls back to `mockMontageSchedule` if `VITE_USE_MOCK_ARCHIVAL=true`
- Consumes `useAdBreakWindows(game)` to get `windows[]`; renders `<MontageReelPlayer>` only when `Date.now()` falls inside any window interval *(Rec 1.2)*
- Outside all windows: renders `null` or a placeholder "Coming up next" banner
- `adBreakIntervalMinutes` prop (default: 30) — minimum gap threshold for window inclusion
- Weekly rotation: `weekNumber` derived from `Math.floor(Date.now() / (7 * 86400000))`, passed to `MontageReelPlayer`
- `game` filter passed through from parent OPERA hub

**Verification:**
```bash
cd apps/web
pnpm run test -- HighlightReelContainer useAdBreakWindows
pnpm run typecheck
```

---

### [ ] Step: D6 — Wire OPERA Hub "Map" Tab + Lazy-Load Both Grids

**Spec ref:** §3.4, §2.5 (OPERA split-tooling principle) | **Gate:** 9.12–9.13

**Files modified:**
- `apps/web/src/hub-4-opera/index.tsx` [MODIFIED]

**Files:**
- `apps/web/src/hub-4-opera/index.tsx` [MODIFIED]
- `apps/web/src/hub-4-opera/hooks/useOperaMapPreference.ts` [NEW] *(Rec 2.2)*

**What to implement:**

`useOperaMapPreference()` hook (`hub-4-opera/hooks/useOperaMapPreference.ts`) *(Rec 2.2)*:
- Reads/writes `localStorage("opera_map_preference")` → `'advanced' | 'moderate'`
- Returns `{ preference, setPreference }`; default: detect device width < 768px → `'moderate'`, else `'advanced'` (device-detection as fallback only, not primary driver)

`hub-4-opera/index.tsx`:
- Add "Map" tab to OPERA hub navigation (alongside existing tabs)
- `React.lazy()` import for `AdvancedLiveMapGrid` and `ModerateLiveMapGrid` (separate lazy chunks — never co-imported) *(Rec 2.2)*
- **Route structure** *(Rec 2.2 — replaces viewport-conditional)*:
  - `<Route path="map/advanced" element={<Suspense fallback={<SkeletonMapGrid />}><AdvancedLiveMapGrid /></Suspense>} />`
  - `<Route path="map/moderate" element={<Suspense fallback={<SkeletonMapGrid />}><ModerateLiveMapGrid /></Suspense>} />`
  - `<Route path="map" element={<Navigate to={`map/${preference}`} replace />} />` (reads `useOperaMapPreference()`)
- "Switch to Advanced / Switch to Mobile View" toggle button in OPERA hub nav bar — calls `setPreference(...)` and `navigate(...)` *(Rec 2.2)*
- `onRotasLensRequest` wired to OPERA sidebar state for economy/tension analytics display
- `<HighlightReelContainer>` remains at layout level (persistent across both routes — NOT inside map tab) *(Rec 2.2)*

**Verification:**
```bash
cd apps/web
pnpm run typecheck
pnpm run lint
pnpm run build
```

---

### PHASE E — Integration Wiring (~1 day | Gate 9.14)

---

### [ ] Step: E1 — Wire Extraction Pipeline → Real Archival API

**Spec ref:** §6.3 (FR-MF-24, FR-MF-25) | **Gate:** 9.14

**Files modified:**
- `packages/shared/api/src/sator/extraction_pipeline.py`

**What to implement:**
- Replace any stub/direct DB insert with call to `ArchivalService.upload_batch()` for each batch of 100 frames
- On `upload_batch` failure: log at ERROR level with `job_id` context; set `job.status = "failed"`; preserve already-uploaded frames (do not rollback prior batches)
- Add `manifest_id` tracking: each batch returns `BatchFrameUploadResponse.manifest_id`; final manifest_id stored on `ExtractionJob`
- Verify `POST /v1/archive/frames` is called with correct `X-Service-Token` header (httpx async client)

**Verification:**
```bash
cd packages/shared/api
pytest tests/integration/test_archive_e2e.py -k "extraction" -v
pytest tests/unit/test_extraction_pipeline.py -v
```

---

### [ ] Step: E2 — Swap useMinimapFrames Mock → Real Archival API

**Spec ref:** §8.6, §13 note 5 | **Gate:** 9.14

**Files modified:**
- `apps/web/src/mocks/mockArchivalClient.ts` [add real client implementation]
- `apps/web/src/hooks/useMinimapFrames.ts` [update factory usage]

**What to implement:**
- Add `RealArchivalClient` class alongside `MockArchivalAPI`:
  - `getFrames(matchId, page, pageSize)` → `apiFetch(\`/archive/matches/${matchId}/frames?page=${page}&page_size=${pageSize}\`)`
  - Returns `FrameQueryResponse` (matches Pydantic schema from `archival_schemas.py`)
- `getArchivalClient()` factory: if `import.meta.env.VITE_USE_MOCK_ARCHIVAL === 'true'` → `MockArchivalAPI`; else → `RealArchivalClient`
- No change to `useMinimapFrames` hook signature — transparent swap

**Verification:**
```bash
cd apps/web
pnpm run test -- useMinimapFrames mockArchivalClient
pnpm run typecheck
pnpm run build
```

---

### [ ] Step: E3 — Admin TeneT Pinning via VerificationBadge

**Spec ref:** §8.2, §5.1 POST /frames/{id}/pin | **Gate:** 9.14

**Files modified:**
- `apps/web/src/hub-2-rotas/components/MinimapFrameGrid/VerificationBadge.tsx`
- `apps/web/src/hub-2-rotas/components/MinimapFrameGrid/index.tsx`

**What to implement:**
- `VerificationBadge`: when `onPin` prop provided and `is_pinned=false`:
  - `onClick` → call `onPin()` immediately (optimistic: set local `isPinned=true` via `useState`)
  - On API error: revert `isPinned` to false, show toast/error indicator
- `MinimapFrameGrid` (vod-review mode, `isAdmin=true`):
  - Per-frame `onPin` callback: `() => apiFetch(\`/archive/frames/${frame.frame_id}/pin\`, { method: 'POST', body: { reason: 'admin-pin', canonical_tier: 'VERIFIED' } })`
  - On success: `refetch()` to refresh frame list with updated `is_pinned=true`
- Non-admin (`isAdmin=false`): `onPin` undefined — badge is read-only (no click handler, no cursor-pointer)
- `SATOR MinimapReviewPanel`: never passes `onPin` (always read-only regardless of admin state)

**Verification:**
```bash
cd apps/web
pnpm run test -- VerificationBadge MinimapFrameGrid
pnpm run typecheck
pnpm run lint
pnpm run build
```

---

### [ ] Step: E4 — Final Build Verification + PHASE_GATES.md Update

**Spec ref:** §12, §12.3 | **Gate:** 9.14

**What to do:**

1. Run full backend verification suite:
```bash
cd packages/shared/api
ruff check src/sator/ routers/archive.py routers/archive_admin.py routers/extraction.py
mypy src/sator/archival_models.py src/sator/archival_service.py src/sator/storage/ routers/archive.py --ignore-missing-imports
pytest tests/unit/ -v --tb=short
pytest tests/integration/test_archive_e2e.py -v --tb=short
```

2. Run full frontend verification suite:
```bash
cd apps/web
pnpm run typecheck
pnpm run lint
pnpm run test -- --testPathPattern="Minimap|useMinimapFrames|VerificationBadge|SegmentTypeBadge|LiveMapGrid|MontageReel|HighlightReel|useRotasLens"
pnpm run build
```

3. Update `PHASE_GATES.md`:
- Add gates 9.4–9.14 to Phase 9 section (per spec §12.3 gate mapping table)
- Mark each gate PASSED with verification evidence and date

**Verification:**
```
All ruff, mypy, pytest, pnpm typecheck, pnpm lint, pnpm build exit 0.
PHASE_GATES.md Phase 9 gates 9.4–9.14 all show PASSED.
```

---

## Implementation Summary

| Phase | Steps | Gates |
|-------|-------|-------|
| A — Archival Backend | A1–A11 (11 steps) | 9.4–9.7 |
| B — Extraction Backend | B1–B3 (3 steps) | 9.8–9.9 |
| C — Frontend Core | C1–C5 (5 steps) | 9.10–9.11 |
| D — OPERA Split Tools | D1–D6 (6 steps) | 9.12–9.13 |
| E — Integration Wiring | E1–E4 (4 steps) | 9.14 |
| **Total** | **29 steps** | **9.4–9.14** |

**Parallel execution note:** Phase A and Step C1 (mock client) can start concurrently. C2–C5 depend on C1 only. D1–D6 depend on C2 (useMinimapFrames). E1–E3 depend on all Phase A + Phase C/D.
