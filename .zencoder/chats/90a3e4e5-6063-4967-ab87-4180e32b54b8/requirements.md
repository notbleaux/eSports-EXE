[Ver001.000]

# Product Requirements Document — Phase 9 Features
## Minimap Archival System + Minimap Extraction Feature

**Status:** DRAFT — Awaiting User Confirmation  
**Phase:** 9 (Web App UI/UX Enhancement — concurrent with Phase 8)  
**Framework:** NJZPOF v0.2  
**Created:** 2026-03-28  
**Author:** ZenCoder Agent (Step 1: Requirements)  
**Previous Planning:** Sessions 1–4 (see `.agents/session/SESSION-4-COMPLETION-SUMMARY-2026-03-28.md`)

---

## Executive Summary

This PRD covers two inter-dependent Phase 9 features for the NJZiteGeisTe Platform:

1. **Minimap Archival System (AS)** — A content-addressed storage and lifecycle management platform for minimap JPEG frames extracted from Valorant VODs. Provides deduplication, retention policies, frame pinning, audit logging, and multi-backend storage.

2. **Minimap Feature (MF)** — An end-to-end pipeline that extracts tactical minimap frames from Valorant VODs, archives them durably, and displays them to users in the frontend with verification status badges.

**Dependency:** MF Tasks 7–9 (Archival API integration) are blocked on AS Tasks 5+. MF Tasks 1–6 can proceed in parallel with AS.

---

## Current State Assessment

### What Already Exists

Based on codebase inspection, the following work from earlier Phase 9 sessions is already in place:

| Artifact | Location | Status |
|----------|----------|--------|
| `extraction_jobs` SQL table | `packages/shared/api/migrations/020_extraction_jobs.sql` | EXISTS |
| `archive_manifests` SQL table | `packages/shared/api/migrations/020_extraction_jobs.sql` | EXISTS |
| `archive_frames` SQL table | `packages/shared/api/migrations/020_extraction_jobs.sql` | EXISTS |
| `ExtractionJob` SQLAlchemy model | `packages/shared/api/src/sator/extraction_job.py` | EXISTS |
| `ExtractionJobSchema` Pydantic schemas | `packages/shared/api/src/sator/extraction_schemas.py` | EXISTS |
| Existing unit tests (models/schemas) | `packages/shared/api/tests/unit/` | EXISTS |

### What Remains to Be Built

The following components are **not yet implemented** and are in scope for this PRD:

**Archival System:**
- `ArchiveFrame`, `ArchiveManifest`, `ArchiveAuditLog` SQLAlchemy ORM models (separate from migration SQL)
- Storage abstraction layer (`LocalBackend`, future `S3Backend`)
- Archival service business logic (deduplication SHA-256, GC, pinning)
- FastAPI router: 12 endpoints (`/v1/archive/...`)
- Admin endpoints (GC trigger, storage migration, job status)
- Audit logging + Prometheus metrics
- Integration tests

**Minimap Feature:**
- FFmpeg + OpenCV frame extraction pipeline
- Segment type classification logic (heuristic-based)
- FastAPI extraction jobs endpoint + async dispatch
- React `MinimapFrameGrid` component
- `useMinimapFrames` TanStack Query hook
- Integration layers (Extraction -> Archival, Frontend -> Archival, TeneT pinning)

### Gate Discrepancy Note

The session planning documents (Sessions 1-4) define gates `[9.1]-[9.17]` for these features. However, the actual `PHASE_GATES.md` Phase 9 section defines only 3 gates (9.1: design tokens, 9.2: UI docs, 9.3: Lighthouse/WCAG). The implementation plan should reconcile this.

**Assumption:** New gates `[9.4]-[9.19]` will be added to `PHASE_GATES.md` for AS and MF features (leaving 9.1-9.3 for the UI/UX track).

---

## Feature 1: Minimap Archival System (AS)

### 1.1 Problem Statement

Minimap frames extracted from Valorant VODs currently have no durable storage mechanism. Without archival infrastructure, the Minimap Feature cannot reliably store, retrieve, deduplicate, or lifecycle-manage the thousands of frames generated per match (~1,800 frames per 30-minute match at 1 fps).

### 1.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-AS-01 | As an admin, I can upload batches of minimap frames with metadata so they are stored durably with deduplication | P0 |
| US-AS-02 | As a frontend developer, I can query frames for a specific match with pagination so I can display them in the UI | P0 |
| US-AS-03 | As an admin, I can pin a frame so it is preserved indefinitely and not garbage collected | P1 |
| US-AS-04 | As an admin, I can trigger garbage collection so old unpinned frames are cleaned up | P1 |
| US-AS-05 | As a platform operator, I can view an audit log of all frame mutations so I can trace changes | P1 |
| US-AS-06 | As a developer, I can view Prometheus metrics for archive operations so I can monitor system health | P2 |
| US-AS-07 | As an admin, I can migrate frames between storage backends so I can evolve infrastructure | P2 |

### 1.3 Functional Requirements

#### 1.3.1 Frame Upload

- **FR-AS-01:** `POST /v1/archive/frames` accepts a batch of frames (up to 1,000 per request) with metadata: `frame_index`, `segment_type`, `timestamp_ms`, `content_hash` (SHA-256), `jpeg_data` (base64), `match_id`, `manifest_id`
- **FR-AS-02:** System deduplicates frames via SHA-256 hash. Duplicate uploads return `HTTP 200` with the existing frame ID (not `409 Conflict`)
- **FR-AS-03:** System stores frames in the configured storage backend (Phase 1: local filesystem)
- **FR-AS-04:** System associates frames with an `ArchiveManifest` record linked to an `ExtractionJob`
- **FR-AS-05:** Upload operation is fully async

#### 1.3.2 Frame Query

- **FR-AS-06:** `GET /v1/archive/matches/{match_id}/frames` returns paginated frames (50/page default, 200 max)
- **FR-AS-07:** Query supports filters: `segment_type`, `is_pinned`, `page`, `page_size`
- **FR-AS-08:** Response includes: `frame_id`, `frame_index`, `segment_type`, `timestamp_ms`, `is_pinned`, `storage_url`, `jpeg_size_bytes`, `created_at`
- **FR-AS-09:** Response includes pagination metadata: `total`, `page`, `page_size`, `has_more`

#### 1.3.3 Frame Pinning

- **FR-AS-10:** `POST /v1/archive/frames/{frame_id}/pin` marks a frame as pinned (admin-only, JWT required)
- **FR-AS-11:** `DELETE /v1/archive/frames/{frame_id}/pin` unpins a frame (admin-only)
- **FR-AS-12:** Pinned frames are excluded from garbage collection

#### 1.3.4 Frame Deletion (Soft-Delete)

- **FR-AS-13:** `DELETE /v1/archive/frames/{frame_id}` soft-deletes a frame by setting `deleted_at` timestamp
- **FR-AS-14:** Soft-deleted frames are excluded from query results by default
- **FR-AS-15:** `GET /v1/archive/frames/{frame_id}` returns `HTTP 404` for soft-deleted frames

#### 1.3.5 Manifest Management

- **FR-AS-16:** `GET /v1/archive/manifests/{manifest_id}` returns manifest metadata: `total_frames`, `unique_frames`, `storage_size_bytes`, `dedup_ratio`, `created_at`, `archived_at`

#### 1.3.6 Garbage Collection

- **FR-AS-17:** `POST /v1/admin/archive/gc` triggers async GC job (admin-only)
- **FR-AS-18:** GC supports `dry_run=true` parameter to preview deletions without executing
- **FR-AS-19:** GC deletes frames where: `is_pinned = false` AND `created_at < NOW() - retention_days` (default: 90 days)
- **FR-AS-20:** GC returns job ID for status polling
- **FR-AS-21:** `GET /v1/admin/archive/jobs/{job_id}` returns async job status and result

#### 1.3.7 Storage Migration (Admin)

- **FR-AS-22:** `POST /v1/admin/archive/migrate` triggers async migration of frames to a new storage backend (admin-only)
- **FR-AS-23:** Migration copies frames to the new backend before deleting from old (copy-then-delete)
- **FR-AS-24:** Migration progress trackable via job status endpoint

#### 1.3.8 Audit Logging

- **FR-AS-25:** All frame mutations (upload, pin, unpin, delete) are logged to `archive_audit_log` table
- **FR-AS-26:** Audit log includes: `frame_id`, `action`, `performed_by`, `timestamp`, `metadata` (JSON)
- **FR-AS-27:** `GET /v1/archive/audit` returns paginated audit log (admin-only)

#### 1.3.9 Storage Health

- **FR-AS-28:** `GET /health/storage` returns storage backend health status
- **FR-AS-29:** `POST /v1/archive/storage/verify` verifies integrity of stored frames (re-hash vs `content_hash`)

#### 1.3.10 Metrics

- **FR-AS-30:** Prometheus counter: `archive_frames_uploaded_total`
- **FR-AS-31:** Prometheus histogram: `archive_query_latency_seconds`
- **FR-AS-32:** Metrics exposed via existing `/metrics` endpoint

### 1.4 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AS-01 | Frame upload throughput | 1,000 frames/min |
| NFR-AS-02 | Batch upload latency (1,000 frames) | < 2s P99 |
| NFR-AS-03 | Frame query latency (10K metadata) | < 500ms P99 |
| NFR-AS-04 | All I/O is non-blocking async | 100% async/await |
| NFR-AS-05 | Code quality gate | ruff, mypy, pytest all green |

### 1.5 Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-01 | `POST /v1/archive/frames` stores frames and returns manifest | `pytest tests/unit/test_archive_routes.py::test_upload` |
| AC-02 | Deduplication: uploading same frame twice returns existing ID | `pytest tests/unit/test_archival_service.py::test_dedup` |
| AC-03 | `GET /v1/archive/matches/{id}/frames` returns paginated results | `pytest tests/unit/test_archive_routes.py::test_query` |
| AC-04 | `POST /v1/archive/frames/{id}/pin` pins frame; GC skips it | `pytest tests/unit/test_archival_service.py::test_pin_gc` |
| AC-05 | `POST /v1/admin/archive/gc` deletes frames older than retention period | `pytest tests/unit/test_archive_gc.py` |
| AC-06 | All mutations logged to `archive_audit_log` | `pytest tests/unit/test_audit_log.py` |
| AC-07 | Prometheus metrics increment on upload and query | Metrics endpoint assertion |
| AC-08 | `POST /v1/admin/archive/migrate` copies and swaps backends | `pytest tests/unit/test_storage_migration.py` |
| AC-09 | Integration: Upload -> Query -> Verify round trip passes | `pytest tests/integration/test_archive_e2e.py::test_round_trip` |
| AC-10 | Integration: GC deletes stale frames, preserves pinned | `pytest tests/integration/test_archive_e2e.py::test_gc_pinned` |
| AC-11 | Integration: Concurrent upload deduplication | `pytest tests/integration/test_archive_e2e.py::test_concurrent_dedup` |
| AC-12 | `DELETE /v1/archive/frames/{id}` soft-deletes; 404 on subsequent GET | `pytest tests/unit/test_archive_routes.py::test_soft_delete` |
| AC-13 | `GET /v1/archive/manifests/{id}` returns manifest metadata | `pytest tests/unit/test_archive_routes.py::test_manifest` |
| AC-14 | Storage backend abstraction: LocalBackend works end-to-end | `pytest tests/unit/test_storage_backend.py` |
| AC-15 | Pydantic schemas validate all request/response shapes | `pytest tests/unit/test_archive_schemas.py` |
| AC-16 | Upload 500 frames, query all, result count matches | Integration test |
| AC-17 | `dry_run=true` GC returns candidates without deleting | `pytest tests/unit/test_archive_gc.py::test_dry_run` |
| AC-18 | `/metrics` includes `archive_frames_uploaded_total` | Metrics endpoint check |

### 1.6 Out of Scope (Phase 1 MVP)

- S3 and Cloudflare R2 storage backends (Phase 2)
- Cross-region backup (Phase 3)
- Glacier archival (Phase 3)
- Scheduled GC cron (Phase 2 — manual trigger only in Phase 1)
- Perceptual hash deduplication (Phase 3 — SHA-256 only in Phase 1)
- Frame streaming (chunked upload) — batch only in Phase 1

---

## Feature 2: Minimap Extraction Feature (MF)

### 2.1 Problem Statement

There is no pipeline to extract minimap frames from Valorant VODs and display them in the platform frontend. The Minimap Feature builds this end-to-end pipeline: extraction -> archival -> frontend display with tactical segment context and TeneT verification.

### 2.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-MF-01 | As an admin, I can submit a VOD file path to trigger minimap frame extraction so frames are extracted and stored | P0 |
| US-MF-02 | As an admin, I can poll the extraction job status so I know when extraction is complete | P0 |
| US-MF-03 | As a user, I can view a paginated grid of minimap frames for a match so I can review tactical moments | P0 |
| US-MF-04 | As a user, I can see the segment type (IN_ROUND, BUY_PHASE, etc.) for each frame so I understand game context | P1 |
| US-MF-05 | As a user, I can see verification badges on TeneT-confirmed frames so I know which frames are authoritative | P1 |
| US-MF-06 | As a user, I can click a frame to view it fullscreen so I can examine tactical details | P1 |
| US-MF-07 | As an admin, I can pin a frame via the TeneT verification workflow so it is preserved for analysis | P2 |

### 2.3 Functional Requirements

#### 2.3.1 Extraction Pipeline (Backend)

- **FR-MF-01:** System accepts local VOD file paths (Phase 1 MVP only — S3/HTTP deferred to Phase 2)
- **FR-MF-02:** Pipeline stages (sequential):
  1. FFmpeg metadata parsing (duration, FPS, resolution)
  2. Minimap region extraction via fixed bounding box (bottom-right quadrant)
  3. Frame extraction at 1 fps
  4. Segment type classification (heuristic-based: IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN)
  5. Frame deduplication (SHA-256, skip identical consecutive frames)
  6. Batch upload to Archival API (`POST /v1/archive/frames`)
- **FR-MF-03:** All pipeline stages are async (no blocking I/O)
- **FR-MF-04:** Pipeline writes job progress to `extraction_jobs` table (model already exists)
- **FR-MF-05:** On error: job status -> `failed`, `error_message` populated

#### 2.3.2 Extraction API Endpoints

- **FR-MF-06:** `POST /v1/extraction/jobs` creates extraction job, dispatches async background task
  - Request: `{ match_id: UUID, vod_source: "local", vod_path: str }`
  - Response: `{ job_id: UUID, status: "pending" }`
- **FR-MF-07:** `GET /v1/extraction/jobs/{job_id}` polls job status
  - Response: `{ job_id, status, frame_count, manifest_id, error, created_at, completed_at }`

#### 2.3.3 Segment Classification

- **FR-MF-08:** Classifier detects segment type using round timer and UI overlay heuristics (no ML in Phase 1)
- **FR-MF-09:** Classification output is one of: `IN_ROUND`, `BUY_PHASE`, `HALFTIME`, `BETWEEN_ROUND`, `UNKNOWN`
- **FR-MF-10:** Frames classified as `UNKNOWN` are still stored (not discarded)

#### 2.3.4 Frontend: MinimapFrameGrid Component

- **FR-MF-11:** `<MinimapFrameGrid matchId={matchId} />` renders paginated grid of 50 frames per page
- **FR-MF-12:** Each grid cell shows: thumbnail, segment type badge (color-coded), timestamp overlay, verification badge
- **FR-MF-13:** Segment type badge colors: `IN_ROUND` -> red, `BUY_PHASE` -> green, `HALFTIME` -> yellow, `BETWEEN_ROUND` -> gray, `UNKNOWN` -> white/muted
- **FR-MF-14:** Verification badge: checkmark if `is_pinned = true`, pending indicator otherwise
- **FR-MF-15:** Timestamp overlay: VOD time in `HH:MM:SS.mmm` format
- **FR-MF-16:** Clicking a frame opens fullscreen lightbox with full-resolution view
- **FR-MF-17:** Pagination controls: Previous/Next buttons + page indicator (`Page N of M`)
- **FR-MF-18:** Component placed in **ROTAS hub** (`apps/web/src/hub-2-rotas/`) — assumption; confirm via Q3
- **FR-MF-19:** Component gracefully handles loading, empty, and error states

#### 2.3.5 Frontend: useMinimapFrames Hook

- **FR-MF-20:** `useMinimapFrames(matchId, page)` fetches frame data via TanStack Query
- **FR-MF-21:** Hook return signature: `{ frames, isLoading, error, hasMore, nextPage, prevPage, totalPages }`
- **FR-MF-22:** Cache TTL: 5 minutes (TanStack Query stale time)
- **FR-MF-23:** Phase 1 MVP: Uses `MockArchivalAPI` (in-memory); swapped for real Archival API in Tasks 7–8

#### 2.3.6 Integration: Extraction -> Archival (Task 7 — Deferred)

- **FR-MF-24:** Extraction pipeline uploads frames to Archival API (`POST /v1/archive/frames`) in batches of 100
- **FR-MF-25:** On Archival upload failure: log error, mark job `failed`, preserve already-uploaded frames

#### 2.3.7 Integration: Frontend -> Archival (Task 8 — Deferred)

- **FR-MF-26:** `useMinimapFrames` hook swaps `MockArchivalAPI` for real Archival client (`GET /v1/archive/matches/{id}/frames`)
- **FR-MF-27:** Hook supports page-by-page lazy loading (not all frames at once)

#### 2.3.8 Integration: TeneT Pinning (Task 9 — Deferred)

- **FR-MF-28:** `VerificationBadge` component (admin-only): clicking badge triggers `POST /v1/archive/frames/{id}/pin`
- **FR-MF-29:** Pin action requires authenticated admin JWT; non-admins see read-only badge
- **FR-MF-30:** Optimistic UI update: badge updates immediately on click, reverts on API error

### 2.4 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-MF-01 | Extraction throughput (Phase 1 single-thread) | ~100 frames/min |
| NFR-MF-02 | Frame grid render (50 thumbnails) | < 200ms (client-side) |
| NFR-MF-03 | All backend I/O async | 100% async/await |
| NFR-MF-04 | React: follows hub-2-rotas component conventions | hub-2-rotas patterns |
| NFR-MF-05 | Code quality gate | ruff, mypy, pytest, npm test, typecheck all green |

### 2.5 Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-01 | `extraction_jobs` ORM model + Pydantic schemas functional (already exists — regression check) | `pytest tests/unit/test_extraction_models.py` |
| AC-02 | FFmpeg parses VOD metadata (duration, FPS) correctly | `pytest tests/unit/test_extraction_pipeline.py::test_metadata` |
| AC-03 | OpenCV extracts frames at 1 fps from a sample VOD | `pytest tests/unit/test_extraction_pipeline.py::test_extract` |
| AC-04 | Segment classifier correctly identifies IN_ROUND and BUY_PHASE in test frames | `pytest tests/unit/test_segment_classification.py` |
| AC-05 | `POST /v1/extraction/jobs` creates job record and returns job_id | `pytest tests/unit/test_extraction_routes.py::test_create_job` |
| AC-06 | `GET /v1/extraction/jobs/{job_id}` returns current status with correct fields | `pytest tests/unit/test_extraction_routes.py::test_poll_status` |
| AC-07 | `MinimapFrameGrid` renders 50 thumbnails with segment type badges | `npm run test -- MinimapFrameGrid` |
| AC-08 | Pagination controls navigate between pages correctly | `npm run test -- MinimapFrameGrid::pagination` |
| AC-09 | Frame lightbox opens on click | `npm run test -- FrameThumbnail::lightbox` |
| AC-10 | Verification badge shows checkmark for pinned frames | `npm run test -- VerificationBadge` |
| AC-11 | `useMinimapFrames` hook returns frames with loading/error states | `npm run test -- useMinimapFrames` |
| AC-12 | MockArchivalAPI returns correct paginated structure | `npm run test -- mockArchivalClient` |
| AC-13 | Hook correctly increments page on `nextPage()` call | `npm run test -- useMinimapFrames::pagination` |
| AC-14 | Extraction pipeline uploads frames to Archival API (real) | Integration test after Task 7 |
| AC-15 | `useMinimapFrames` fetches from real Archival API with correct pagination | Integration test after Task 8 |
| AC-16 | Admin click on VerificationBadge pins frame via Archival API | Integration test after Task 9 |
| AC-17 | Non-admin user sees read-only VerificationBadge | `npm run test -- VerificationBadge::non-admin` |

### 2.6 Out of Scope (Phase 1 MVP)

- S3 or HTTP VOD sources (local only)
- Parallel extraction workers (single-thread only)
- ML-based segment detection (heuristic only)
- Configurable frame rate (1 fps fixed)
- ML-based minimap region detection (fixed bounding box only)
- Client-side Redis frame caching (TanStack Query only)

---

## Technical Context

### Technology Stack (per AGENTS.md)

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+, FastAPI async, SQLAlchemy ORM, Alembic |
| Schemas | Pydantic v2 |
| HTTP client (internal) | httpx (async) |
| Storage | Local filesystem (Phase 1), boto3/S3 (Phase 2) |
| Media processing | FFmpeg (system), opencv-python, ffmpeg-python |
| Frontend | React 18, TypeScript, Tailwind CSS |
| Data fetching | TanStack Query v5 |
| Test (Python) | pytest, ruff, mypy |
| Test (JS) | Vitest, Playwright |
| Package manager | pnpm workspaces |

### Proposed File Structure

**Backend (Archival System) — new files:**
```
packages/shared/api/
├── src/sator/
│   ├── archival_models.py       — ArchiveFrame, ArchiveManifest, ArchiveAuditLog ORM
│   ├── archival_schemas.py      — Pydantic request/response schemas
│   ├── archival_service.py      — Business logic (dedup, GC, pinning)
│   └── storage/
│       ├── __init__.py          — StorageBackend Protocol (abstract interface)
│       └── local_backend.py     — LocalStorageBackend implementation
├── routers/
│   ├── archival.py              — Frame endpoints (/v1/archive/...)
│   └── archival_admin.py        — GC + migration endpoints (/v1/admin/archive/...)
└── tests/
    ├── unit/test_archive_*.py
    └── integration/test_archive_e2e.py
```

**Backend (Minimap Feature) — new files:**
```
packages/shared/api/
├── src/sator/
│   ├── extraction_pipeline.py   — FFmpeg + OpenCV pipeline
│   └── segment_classifier.py    — Heuristic segment type detection
└── routers/
    └── extraction.py             — Job endpoints (/v1/extraction/...)
```

**Frontend — new files:**
```
apps/web/src/
├── hub-2-rotas/components/
│   ├── MinimapFrameGrid.tsx
│   ├── FrameThumbnail.tsx
│   ├── SegmentTypeBadge.tsx
│   └── VerificationBadge.tsx
├── hooks/
│   └── useMinimapFrames.ts
└── mocks/
    └── mockArchivalClient.ts
```

---

## Dependency Map

```
AS Task 1: DB ORM models (archival_models.py)
    |
    +-- AS Task 2: Pydantic schemas (archival_schemas.py)
    +-- AS Task 3: Storage abstraction (storage/)
            |
            +-- AS Task 4: Archival service (archival_service.py)
                    |
                    +-- AS Task 5: FastAPI router (archival.py)
                            |
                            +-- AS Task 6: Admin endpoints (archival_admin.py)
                            +-- AS Task 7: Audit + Metrics
                                    |
                                    +-- AS Task 8: Integration tests

MF Tasks 1-6: PARALLEL with AS (independent)
    MF Task 1: ExtractionJob ORM (EXISTS - verify regression)
    MF Task 2: FFmpeg pipeline (extraction_pipeline.py)
    MF Task 3: Segment classifier (segment_classifier.py)
    MF Task 4: Extraction API (extraction.py router)
    MF Task 5: MinimapFrameGrid component
    MF Task 6: useMinimapFrames hook + MockArchivalAPI

    [DECISION GATE: Day 3-4 ~ 2026-03-31]
    If AS Task 5+ complete:
        MF Task 7: Extraction -> real Archival API
        MF Task 8: Frontend -> real Archival API
        MF Task 9: TeneT pinning via Archival API
    Else: defer MF Tasks 7-9 to continuation session
```

---

## Phase 9 Gate Additions

The following new gates should be added to `PHASE_GATES.md` Phase 9 section:

| Gate | Feature | Criteria |
|------|---------|----------|
| 9.4 | AS | SQLAlchemy ORM models (archival_models.py) pass unit tests |
| 9.5 | AS | Pydantic schemas validated (archival_schemas.py) |
| 9.6 | AS | LocalStorageBackend operational |
| 9.7 | AS | Archival service (dedup, GC, pinning) unit tested |
| 9.8 | AS | FastAPI router (12 endpoints) unit tested |
| 9.9 | AS | Admin endpoints (GC + migration) unit tested |
| 9.10 | AS | Audit logging + Prometheus metrics wired and tested |
| 9.11 | AS | Integration tests passing (E2E workflows) |
| 9.12 | MF | FFmpeg + OpenCV extraction pipeline unit tested |
| 9.13 | MF | Segment classifier unit tested |
| 9.14 | MF | Extraction API endpoints unit tested |
| 9.15 | MF | MinimapFrameGrid component unit tested |
| 9.16 | MF | useMinimapFrames hook + MockArchivalAPI unit tested |
| 9.17 | MF | Extraction -> Archival API integration complete (or deferred) |
| 9.18 | MF | Frontend -> Archival API integration complete (or deferred) |
| 9.19 | MF | TeneT pinning integration complete (or deferred) |

---

## Clarifying Questions

The following questions are open. **If not answered, stated assumptions will be used.**

### Q1: Archival System namespace
**Question:** Should AS models/schemas/service live in `src/sator/` (matching existing pattern for extraction_job.py) or in a new `src/njz_api/archival/` namespace (as session workplans specify)?  
**Assumption:** Use `src/sator/` for consistency.

### Q2: ArchiveFrame ORM file placement
**Question:** Should `ArchiveFrame`, `ArchiveManifest`, `ArchiveAuditLog` ORM models go in a new `src/sator/archival_models.py` or added to the existing `src/sator/extraction_job.py`?  
**Assumption:** Separate `archival_models.py` for clean separation.

### Q3: Minimap hub integration target
**Question:** Should `MinimapFrameGrid` be added to the ROTAS hub (`hub-2-rotas/`) or the OPERA hub (`hub-4-opera/`)?  
**Assumption:** ROTAS hub — match-level tactical analysis context aligns with the leaderboard and match history.

### Q4: Frame upload authentication
**Question:** Does `POST /v1/archive/frames` require admin JWT, or is it an internal service-to-service call (extraction pipeline to archival)?  
**Assumption:** Service-to-service (no user JWT — uses internal API key or trusted network). Query endpoint (`GET`) is public.

### Q5: Alembic vs raw SQL migrations
**Question:** The existing Phase 9 migration is a raw SQL file (`020_extraction_jobs.sql`). Should new AS ORM additions use Alembic Python migrations (matching services/api pattern) or continue with raw SQL?  
**Assumption:** Raw SQL (matching the existing pattern in `packages/shared/api/migrations/`).

---

## Sign-Off Checklist

```
[ ] Feature 1 (Archival System) scope is correct
[ ] Feature 2 (Minimap Feature) scope is correct
[ ] Acceptance criteria are complete and testable
[ ] Out-of-scope items correctly identified
[ ] Technical stack and file locations are correct
[ ] Dependency structure (MF Tasks 7-9 blocked on AS Task 5+) is understood
[ ] Clarifying questions Q1-Q5 are answered or assumptions confirmed
[ ] Ready to proceed to Technical Specification (Step 2)
```

---

*PRD created by ZenCoder Session 5 Step 1 agent. Awaiting user confirmation before proceeding to spec.md (Step 2).*
