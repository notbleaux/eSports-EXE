[Ver001.000]

# Implementation Plan — Minimap Archival System

**Status:** COMPLETE (Step 3: Planning)  
**Framework:** NJZPOF v0.2 · 2/3/5+1,2,3 compliance  
**Target:** 8 sequential tasks, Phase 1 MVP scope  
**Phase:** Phase 9 (Archival System prerequisite)  
**Created:** 2026-03-27

---

## Overview

Phase 1 MVP implementation: 8 sequential tasks spanning PostgreSQL schema creation (Task 1) → FastAPI routing (Task 5) → integration tests (Task 8). Tasks 1–3 (schema, Pydantic schemas, storage abstraction) can be parallelized if needed. Critical path: Task 1 → Task 4 → Task 5 → Task 8 (minimum 6 days sequential, 4–5 days with 2-agent parallelization on Tasks 2–3 and 6–7). All tasks gate-linked to Phase 9 Archival subsystem gates ([Gate 9.1]–[Gate 9.8]) and AC-verified against all 18 acceptance criteria.

---

## Task Breakdown

| Task # | Title | Gate Ref | Dependencies | AC Links | Verification Command | Scope |
|--------|-------|----------|--------------|----------|---|---|
| 1 | PostgreSQL migration 006 + SQLAlchemy models | [Gate 9.1] | None | AC-01, AC-06 | `cd services/api/ && alembic upgrade head && pytest tests/unit/test_archive_models.py -v` | ~400 LOC (3 models + indices + relationships) |
| 2 | Pydantic schemas + validation tests | [Gate 9.2] | Task 1 | AC-01, AC-02, AC-15 | `pytest tests/unit/test_archive_schemas.py -v` | ~200 LOC (8+ Pydantic schemas + Field validators) |
| 3 | Storage abstraction layer (Protocol + LocalBackend) | [Gate 9.3] | Task 1 | AC-14 | `pytest tests/unit/test_storage_backend.py -v && ruff check packages/shared/api/src/njz_api/archival/storage/` | ~250 LOC (Protocol + LocalBackend implementation) |
| 4 | Archival service (deduplication, GC, migration) | [Gate 9.4] | Tasks 1–3 | AC-02, AC-03, AC-05, AC-11 | `pytest tests/unit/test_archival_service.py -v` | ~350 LOC (core business logic, async) |
| 5 | FastAPI router: frame endpoints (upload, query, pin) | [Gate 9.5] | Tasks 1–4 | AC-01, AC-03, AC-04, AC-12, AC-13 | `pytest tests/unit/test_archive_routes.py -v && curl http://localhost:8000/v1/docs` | ~300 LOC (5 main endpoints + error handling) |
| 6 | GC + storage migration endpoints | [Gate 9.6] | Task 5 | AC-05, AC-08, AC-11 | `pytest tests/unit/test_archive_gc.py -v && pytest tests/unit/test_storage_migration.py -v` | ~180 LOC (3 endpoints + async jobs) |
| 7 | Audit logging + Prometheus metrics | [Gate 9.7] | Tasks 5–6 | AC-06, AC-07, AC-18 | `pytest tests/unit/test_audit_log.py -v && grep "archive_frame" packages/shared/api/src/njz_api/archival/metrics.py` | ~150 LOC (audit, metrics exporter) |
| 8 | Integration tests (cross-component workflows) | [Gate 9.8] | Tasks 1–7 | AC-11, AC-12, AC-13, AC-16, AC-17, AC-09, AC-10 | `pytest tests/integration/test_archive_e2e.py -v` | ~450 LOC (E2E test suite, workflow validation) |

---

## Task Details

### Task 1: PostgreSQL migration 006 + SQLAlchemy models

**Gate Reference:** [Gate 9.1]  
**Status:** PENDING (mark PASSED after verification command succeeds)

**Purpose:**  
Create database schema (3 tables: archive_frames, archive_manifests, archive_audit_log) and SQLAlchemy ORM models with relationships, indices, and constraints. This is the foundation for all subsequent archival tasks and enables data persistence.

**Acceptance Criteria Addressed:**  
AC-01 (frames persisted to PostgreSQL), AC-06 (mutations logged to audit_log)

**Dependencies:**  
None (can start immediately)

**Implementation Approach:**

1. Create Alembic migration file: `services/api/src/njz_api/migrations/006_archive_schema.py`
   - Copy table definitions from requirements.md section 4.1 (archive_frames, archive_manifests, archive_audit_log)
   - Add indices for performance (match_id, content_hash, timestamp_ms, is_pinned, created_at DESC)
   - Add FK constraints with ON DELETE CASCADE to matches(id)
   - Use `if not exists` pattern for idempotency

2. Create SQLAlchemy models in `packages/shared/api/src/njz_api/archival/models/archive.py`:
   - `ArchiveFrame` model: 25 columns, relationships to Match, ArchiveManifest, ArchiveAuditLog
   - `ArchiveManifest` model: 8 columns, relationship to array of ArchiveFrames
   - `ArchiveAuditLog` model: 8 columns, relationships to ArchiveFrame and ArchiveManifest (nullable)
   - Define `__table_args__` with indices and constraints
   - Use `BIGINT` for file_size_bytes, TIMESTAMP with DEFAULT NOW() for created_at

3. Update `packages/shared/api/src/njz_api/models/__init__.py` to export new models

4. Run migration and verify tables exist with correct schema

**Files Affected:**  
- `services/api/src/njz_api/migrations/006_archive_schema.py` (new, ~180 LOC)
- `packages/shared/api/src/njz_api/archival/models/archive.py` (new, ~220 LOC)
- `packages/shared/api/src/njz_api/models/__init__.py` (modified, +3 imports)

**Estimated Scope:**  
~400 LOC, Medium complexity (SQLAlchemy relationships, FK constraints, indices, async engine config)

**Verification Command:**  
```bash
cd services/api/
alembic upgrade head
pytest tests/unit/test_archive_models.py::TestArchiveFrameModel -v
pytest tests/unit/test_archive_models.py::TestArchiveManifestModel -v
pytest tests/unit/test_archive_models.py::TestArchiveAuditLog -v
ruff check packages/shared/api/src/njz_api/archival/
mypy packages/shared/api/src/njz_api/archival/models/archive.py --strict
```

**Edge Cases & Error Handling:**
- Migration idempotency: Use `if not exists` pattern; safe to re-run
- Cascade delete: Deleting a match cascades to archive_frames (test with CASCADE constraint)
- Index creation: Large existing tables may slow down index creation (consider CONCURRENTLY flag post-migration)
- Soft delete: deleted_at column preserved for audit trail; no actual deletion
- UUID generation: Use `DEFAULT gen_random_uuid()` for all id columns

**Success Criteria:**  
✅ `alembic upgrade head` runs without error  
✅ All three tables exist in PostgreSQL with correct columns/constraints  
✅ Indices created successfully (verify with psql `\d archive_frames`)  
✅ SQLAlchemy models import without errors (`from njz_api.archival.models import ArchiveFrame`)  
✅ Unit tests pass (pytest returns all green)  
✅ No type errors (mypy --strict returns clean)  
✅ No linting errors (ruff check returns clean)

---

### Task 2: Pydantic schemas + validation tests

**Gate Reference:** [Gate 9.2]  
**Status:** PENDING

**Purpose:**  
Create Pydantic v2 schemas for request/response validation, including enums (StreamType, SegmentType, StorageBackend) and Field validators. Ensures type-safe API contracts and prevents invalid data from reaching business logic.

**Acceptance Criteria Addressed:**  
AC-01 (frames with valid metadata), AC-02 (deduplication detection requires valid hash format), AC-15 (code style compliance)

**Dependencies:**  
Task 1 (SQLAlchemy models provide reference for field names/types)

**Implementation Approach:**

1. Create `packages/shared/api/src/njz_api/archival/schemas/archive.py` with 8+ Pydantic models:
   - **Enums:** StreamType (A, B), SegmentType (IN_ROUND, BETWEEN_ROUND, HALFTIME, BUY_PHASE, UNKNOWN), StorageBackend (local, s3, r2), AuditAction (UPLOAD, PIN, UNPIN, GC_DELETE, MIGRATE, VERIFY)
   - **Frame models:** FrameMetadata (input), ArchiveFrame (output), FrameQueryResponse (paginated list)
   - **Request models:** FrameUploadRequest (batch, up to 1000 frames), PinRequest (reason, ttl_days), GCRequest (retention_days, dry_run)
   - **Response models:** FrameUploadResponse (frame_ids, manifest_id, duplicates_skipped), GCResponse (deleted_count, freed_bytes, duration_ms)

2. Add Field validators:
   - `content_hash`: must be 64 hex chars (SHA-256 validation)
   - `frame_index`: must be >= 0
   - `timestamp_ms`: must be > 0
   - `retention_days`: must be > 0
   - `file_size_bytes`: must be > 0
   - Batch size: up to 1000 frames per upload

3. Create test file `tests/unit/test_archive_schemas.py`:
   - Test valid schema creation for each type
   - Test validation failures (invalid hash format, negative numbers, etc.)
   - Test enum serialization/deserialization
   - Test JSON schema export for API documentation

**Files Affected:**  
- `packages/shared/api/src/njz_api/archival/schemas/archive.py` (new, ~200 LOC)
- `packages/shared/api/src/njz_api/archival/schemas/__init__.py` (new, export all schemas)
- `tests/unit/test_archive_schemas.py` (new, ~150 LOC)

**Estimated Scope:**  
~200 LOC, Low-Medium complexity (straightforward Pydantic v2 patterns)

**Verification Command:**  
```bash
pytest tests/unit/test_archive_schemas.py -v
ruff check packages/shared/api/src/njz_api/archival/schemas/
mypy packages/shared/api/src/njz_api/archival/schemas/archive.py --strict
```

**Edge Cases & Error Handling:**
- Invalid content_hash: Catch in Pydantic validator before database insert
- Large batch: Validate batch size <= 1000 in request schema
- NULL/None fields: Mark optional fields with `Optional[T] = None`
- Enum mismatches: Pydantic enforces enum membership automatically
- Timestamp validation: Ensure timestamp_ms > 0 and reasonable bounds (e.g., < current time + 1 second)

**Success Criteria:**  
✅ All 8+ schemas importable without errors  
✅ Unit tests pass (pytest returns all green)  
✅ Validation tests cover valid + invalid cases  
✅ Enum serialization works (test JSON roundtrip)  
✅ No type errors (mypy --strict returns clean)  
✅ No linting errors (ruff check returns clean)

---

### Task 3: Storage abstraction layer (Protocol + LocalBackend)

**Gate Reference:** [Gate 9.3]  
**Status:** PENDING

**Purpose:**  
Implement `StorageBackend` Protocol (abstract interface) and `LocalBackend` implementation for Phase 1 MVP. Enables swappable storage backends (S3, R2 in Phase 2) without changing archival service logic.

**Acceptance Criteria Addressed:**  
AC-14 (storage backend abstraction allows seamless switching)

**Dependencies:**  
Task 1 (models needed to understand data structures, though storage layer is independent)

**Implementation Approach:**

1. Create `packages/shared/api/src/njz_api/archival/storage/backend.py`:
   - Define `StorageBackend` Protocol with `@runtime_checkable` decorator:
     - `async def put(key: str, data: bytes) -> str` — store frame, return storage_url
     - `async def get(key: str) -> bytes` — retrieve frame bytes
     - `async def delete(key: str) -> None` — soft or hard delete
     - `async def exists(key: str) -> bool` — metadata-only check
     - `async def health_check() -> dict` — return {status, quota_bytes, used_bytes}
   
2. Implement `LocalBackend` class:
   - Constructor: `__init__(data_dir: str)`
   - Sharding: `{data_dir}/frames/{content_hash[:2]}/{content_hash}.jpg` (2-char prefix avoids inode limits)
   - Use `aiofiles` for async file I/O
   - Auto-create shard directories on first write
   - `put()`: Write JPEG bytes to disk, return `file://{absolute_path}`
   - `get()`: Read bytes from disk, raise 404 if missing
   - `delete()`: Remove file (idempotent)
   - `exists()`: Check file existence (fast, metadata-only)
   - `health_check()`: Check disk space via `os.statvfs()`

3. Create test file `tests/unit/test_storage_backend.py`:
   - Test LocalBackend implementation (put, get, delete, exists, health_check)
   - Test protocol conformance (verify duck typing)
   - Test sharding behavior (verify 2-char prefix creates correct directory)
   - Test idempotency (delete non-existent file should not error)
   - Test concurrent operations (multiple puts to same shard)

4. Stub S3Backend and R2Backend in Phase 2 files (pass statement only)

**Files Affected:**  
- `packages/shared/api/src/njz_api/archival/storage/backend.py` (new, ~200 LOC Protocol + LocalBackend)
- `packages/shared/api/src/njz_api/archival/storage/__init__.py` (new, export StorageBackend, LocalBackend)
- `tests/unit/test_storage_backend.py` (new, ~150 LOC)

**Estimated Scope:**  
~250 LOC, Medium complexity (async I/O, filesystem sharding, protocol patterns)

**Verification Command:**  
```bash
pytest tests/unit/test_storage_backend.py -v
ruff check packages/shared/api/src/njz_api/archival/storage/
mypy packages/shared/api/src/njz_api/archival/storage/backend.py --strict
```

**Edge Cases & Error Handling:**
- Directory creation: Use `Path.mkdir(parents=True, exist_ok=True)` for safe creation
- Concurrent writes: sharding prevents collisions
- Disk full: Catch `OSError` from `aiofiles.open()`, return 503 error
- File permissions: Ensure data_dir is writable; catch permission errors
- Symbolic links: Security consideration—disallow symlinks in data_dir (check `is_symlink()`)

**Success Criteria:**  
✅ LocalBackend put/get/delete/exists/health_check all async and functional  
✅ Sharding creates correct subdirectories (test creates files in hash[:2] folder)  
✅ Protocol conformance verified (duck typing works for future S3Backend)  
✅ Unit tests pass (pytest returns all green)  
✅ No type errors (mypy --strict returns clean)  
✅ No linting errors (ruff check returns clean)

---

### Task 4: Archival service (deduplication, GC, migration)

**Gate Reference:** [Gate 9.4]  
**Status:** PENDING

**Purpose:**  
Implement `ArchivalService` class with core business logic: deduplication (SHA-256 lookup), garbage collection (retention policy enforcement), frame validation, and storage migration framework. Bridges data models, storage backends, and API routers.

**Acceptance Criteria Addressed:**  
AC-02 (duplicate detection via content hash), AC-03 (frame indexing), AC-05 (GC retention policy), AC-11 (extraction service integration)

**Dependencies:**  
Tasks 1–3 (models, schemas, storage backends)

**Implementation Approach:**

1. Create `packages/shared/api/src/njz_api/archival/services/archival_service.py`:
   - Constructor: `__init__(db: AsyncSession, storage_backend: StorageBackend)`
   - **Deduplication flow:**
     - `async def upload_frames(frames: List[dict], manifest_data: dict) -> UploadResponse`
     - For each frame:
       - Compute SHA-256 hash of JPEG bytes
       - Query `SELECT id FROM archive_frames WHERE content_hash = ?`
       - If exists: Skip storage write, record as duplicate
       - Else: Write to storage backend, INSERT to archive_frames, record manifest entry
     - Return UploadResponse with frame_ids, manifest_id, duplicate_count
   
   - **Query logic:**
     - `async def query_frames(match_id: UUID, page: int, page_size: int, filters: dict) -> FrameQueryResponse`
     - Use indices on match_id, timestamp_ms for fast retrieval
     - Apply optional filters (segment_type, stream_type, accuracy_tier)
     - Paginate with OFFSET/LIMIT
   
   - **Pin/Unpin:**
     - `async def pin_frame(frame_id: UUID, reason: str, ttl_days: Optional[int]) -> PinResponse`
     - Set is_pinned = true, pin_reason, pin_expires_at
     - Log to audit_log with actor='service:archival'
   
   - **Garbage Collection:**
     - `async def run_gc(retention_days: int, dry_run: bool = False) -> GCResponse`
     - Query unpinned frames older than retention_days: `SELECT id FROM archive_frames WHERE is_pinned = false AND created_at < NOW() - INTERVAL '${retention_days} days'`
     - For each frame:
       - Delete from storage backend
       - Soft delete in database (set deleted_at = NOW())
       - Record audit log entry
     - Return GCResponse with deleted_count, freed_bytes, duration_ms
   
   - **Storage migration:**
     - `async def migrate_frames(from_backend: str, to_backend: str, dry_run: bool = False) -> MigrationResponse`
     - Query frames stored in from_backend
     - For each frame:
       - Fetch from source backend
       - Verify content_hash matches original
       - Store in destination backend
       - Update storage_backend, storage_path, storage_url columns
       - Delete from source backend (after verification)
     - Return MigrationResponse with migrated_count, failed_count, duration_ms

2. Create test file `tests/unit/test_archival_service.py`:
   - Test deduplication (same hash → skip storage write)
   - Test query with pagination and filters
   - Test pin/unpin lifecycle
   - Test GC with retention_days cutoff
   - Test dry_run mode (no actual deletions)
   - Test error cases (storage backend down, corrupt hash, etc.)

**Files Affected:**  
- `packages/shared/api/src/njz_api/archival/services/archival_service.py` (new, ~350 LOC)
- `packages/shared/api/src/njz_api/archival/services/__init__.py` (new, export ArchivalService)
- `tests/unit/test_archival_service.py` (new, ~200 LOC)

**Estimated Scope:**  
~350 LOC, Medium-High complexity (async/await, deduplication logic, GC retention calculation)

**Verification Command:**  
```bash
pytest tests/unit/test_archival_service.py -v
ruff check packages/shared/api/src/njz_api/archival/services/
mypy packages/shared/api/src/njz_api/archival/services/archival_service.py --strict
```

**Edge Cases & Error Handling:**
- Content hash collision: SHA-256 collision is negligible; log as anomaly if detected
- Storage backend failure during upload: Rollback database transaction, return 503
- Partial GC failure: Continue processing remaining frames; log errors; return partial success status
- Missing frame in destination during migration: Retry up to 3 times, then mark as failed
- Pin TTL expiration: Implement separate cron job (Phase 2) to auto-unpin expired frames

**Success Criteria:**  
✅ Deduplication verified (same hash returns existing frame_id)  
✅ Query returns correct paginated results with filters applied  
✅ Pin/unpin updates database and audit log correctly  
✅ GC deletes only unpinned, old frames (respects pin + retention_days)  
✅ GC dry_run mode does not delete anything  
✅ Migration preserves content_hash and updates all pointers  
✅ Unit tests pass (pytest returns all green)  
✅ No type errors (mypy --strict returns clean)  
✅ No linting errors (ruff check returns clean)

---

### Task 5: FastAPI router: frame endpoints (upload, query, pin)

**Gate Reference:** [Gate 9.5]  
**Status:** PENDING

**Purpose:**  
Implement 5 main FastAPI endpoints for frame management: POST /v1/archive/frames (upload), GET /v1/archive/matches/{id}/frames (query), GET /v1/archive/frames/{id} (single frame), POST /v1/archive/frames/{id}/pin (pin), POST /v1/archive/frames/{id}/unpin (unpin). Binds HTTP layer to archival service business logic.

**Acceptance Criteria Addressed:**  
AC-01 (upload endpoint), AC-03 (query endpoint), AC-04 (pin prevents GC), AC-12 (TeneT integration), AC-13 (frontend access)

**Dependencies:**  
Tasks 1–4 (models, schemas, service)

**Implementation Approach:**

1. Create `packages/shared/api/src/njz_api/archival/routers/archive.py`:
   - **POST /v1/archive/frames** (upload batch):
     - Request: FrameUploadRequest (frames batch, manifest_data)
     - Response: FrameUploadResponse (frame_ids, manifest_id, duplicates_skipped)
     - Auth: Service principal or admin only
     - Error: 409 if frame already exists (return existing frame_id), 400 if validation fails, 503 if storage down
   
   - **GET /v1/archive/matches/{match_id}/frames** (query by match):
     - Query params: page, page_size, segment_type, stream_type, accuracy_tier (all optional)
     - Response: FrameQueryResponse (frames list, total_count, page, page_size)
     - Auth: Public (read-only)
     - Error: 404 if match not found, 400 if invalid pagination
   
   - **GET /v1/archive/frames/{frame_id}** (single frame):
     - Response: ArchiveFrame (full metadata)
     - Auth: Public
     - Error: 404 if frame not found
   
   - **POST /v1/archive/frames/{frame_id}/pin** (pin frame):
     - Request: PinRequest (reason, ttl_days)
     - Response: PinResponse (pinned_at, expires_at)
     - Auth: Service principal or admin
     - Error: 404 if frame not found, 403 if insufficient permissions
   
   - **POST /v1/archive/frames/{frame_id}/unpin** (unpin frame):
     - Response: UnpinResponse (unpinned_at)
     - Auth: Service principal or admin
     - Error: 404 if frame not found

2. Use FastAPI dependency injection:
   - `Depends(get_db)` for AsyncSession
   - `Depends(get_archival_service)` for ArchivalService instance
   - `Depends(get_current_user)` for auth (optional for public endpoints)

3. Create `packages/shared/api/src/njz_api/archival/dependencies.py`:
   - Define `get_archival_service(db: AsyncSession = Depends(get_db), storage = Depends(get_storage_backend)) -> ArchivalService`
   - Define `get_storage_backend() -> StorageBackend` (returns LocalBackend for Phase 1)

4. Create test file `tests/unit/test_archive_routes.py`:
   - Test each endpoint with valid/invalid inputs
   - Test auth enforcement (public vs. admin-only)
   - Test error responses (404, 409, 503, etc.)
   - Test pagination behavior
   - Test OpenAPI documentation generation

5. Register router in `main.py`:
   ```python
   from njz_api.archival.routers import router as archival_router
   app.include_router(archival_router, prefix="/v1/archive", tags=["archival"])
   ```

**Files Affected:**  
- `packages/shared/api/src/njz_api/archival/routers/archive.py` (new, ~300 LOC)
- `packages/shared/api/src/njz_api/archival/routers/__init__.py` (new, export router)
- `packages/shared/api/src/njz_api/archival/dependencies.py` (new, ~80 LOC)
- `packages/shared/api/src/njz_api/main.py` (modified, +2 lines to register router)
- `tests/unit/test_archive_routes.py` (new, ~200 LOC)

**Estimated Scope:**  
~300 LOC, Medium complexity (FastAPI route definitions, dependency injection, error handling)

**Verification Command:**  
```bash
pytest tests/unit/test_archive_routes.py -v
ruff check packages/shared/api/src/njz_api/archival/routers/
mypy packages/shared/api/src/njz_api/archival/routers/archive.py --strict
curl http://localhost:8000/v1/docs  # Verify OpenAPI available
```

**Edge Cases & Error Handling:**
- Duplicate upload (409): Return existing frame_id, allow idempotent retries
- Invalid content_hash format (400): Pydantic validator catches before route handler
- Storage backend down (503): Return with Retry-After header
- Unauthorized access (403): Return 403 Forbidden with error message
- Not found (404): Return 404 with frame_id in error message for debugging
- Rate limiting: May be enforced by API gateway (Phase 8); not implemented in routes

**Success Criteria:**  
✅ All 5 endpoints respond with correct status codes  
✅ Auth enforcement verified (public vs. admin-only)  
✅ Pagination works (page, page_size, total_count correct)  
✅ Filters applied correctly (segment_type, stream_type, etc.)  
✅ Error responses include helpful error messages  
✅ OpenAPI documentation auto-generated at /v1/docs  
✅ Unit tests pass (pytest returns all green)  
✅ No type errors (mypy --strict returns clean)  
✅ No linting errors (ruff check returns clean)

---

### Task 6: GC + storage migration endpoints

**Gate Reference:** [Gate 9.6]  
**Status:** PENDING

**Purpose:**  
Implement 3 additional FastAPI endpoints for garbage collection, storage management, and health checks: POST /v1/archive/gc (garbage collection job), POST /v1/archive/storage/migrate (backend migration), GET /health/storage (health check). Enables operational control over frame lifecycle and storage backend transitions.

**Acceptance Criteria Addressed:**  
AC-05 (GC deletion of old frames), AC-08 (upload latency, GC must not block), AC-11 (extraction service integration)

**Dependencies:**  
Task 5 (routes already set up)

**Implementation Approach:**

1. Create/extend `packages/shared/api/src/njz_api/archival/routers/archive.py` with 3 additional endpoints:
   - **POST /v1/archive/gc** (garbage collection job):
     - Request: GCRequest (retention_days, dry_run)
     - Response: GCResponse (deleted_count, freed_bytes, duration_ms)
     - Auth: Admin only
     - Behavior: Run archival_service.run_gc(), return metrics
     - Error: 403 if insufficient permissions, 503 if storage backend down
   
   - **POST /v1/archive/storage/migrate** (storage migration):
     - Request: MigrationRequest (from_backend, to_backend, dry_run)
     - Response: MigrationResponse (migrated_count, failed_count, duration_ms)
     - Auth: Admin only
     - Behavior: Run archival_service.migrate_frames(), return metrics
     - Error: 403, 503 same as above
   
   - **GET /health/storage** (storage health check):
     - Response: StorageHealthResponse (backend, status, quota_bytes, used_bytes)
     - Auth: Public
     - Behavior: Call storage_backend.health_check()
     - Error: 503 if backend is down

2. Create corresponding Pydantic schemas in `schemas/archive.py`:
   - GCRequest, GCResponse
   - MigrationRequest, MigrationResponse
   - StorageHealthResponse

3. Create test file `tests/unit/test_archive_gc.py` and `tests/unit/test_storage_migration.py`:
   - Test GC with various retention_days values
   - Test GC dry_run mode (no deletions)
   - Test migration from local to S3 (Phase 2; stub for Phase 1)
   - Test health check response format
   - Test auth enforcement

4. **Important:** Implement GC as async background job:
   - Don't block HTTP response; return 202 Accepted immediately
   - Use `asyncio.create_task()` to queue GC job
   - Return job ID in response; client can poll /v1/archive/gc/{job_id} for status (Phase 2)

**Files Affected:**  
- `packages/shared/api/src/njz_api/archival/routers/archive.py` (modified, +80 LOC)
- `packages/shared/api/src/njz_api/archival/schemas/archive.py` (modified, +5 schemas)
- `tests/unit/test_archive_gc.py` (new, ~120 LOC)
- `tests/unit/test_storage_migration.py` (new, ~100 LOC)

**Estimated Scope:**  
~180 LOC, Medium complexity (async job handling, health check logic)

**Verification Command:**  
```bash
pytest tests/unit/test_archive_gc.py -v && pytest tests/unit/test_storage_migration.py -v
ruff check packages/shared/api/src/njz_api/archival/
mypy packages/shared/api/src/njz_api/archival/routers/archive.py --strict
```

**Edge Cases & Error Handling:**
- GC with retention_days = 0: Should delete all unpinned frames (test this edge case)
- Migration with invalid backend name: Validate backend name in request schema
- Storage backend change during migration: Graceful retry (Phase 2)
- Disk full during GC: Stop GC, log error, return 503
- Health check on offline backend: Return status='degraded', quota_bytes=0

**Success Criteria:**  
✅ GC endpoint executes job asynchronously (returns 202 quickly)  
✅ GC dry_run mode verified (no actual deletions)  
✅ Migration endpoint available (stub for Phase 2)  
✅ Health check returns correct format with backend status  
✅ Auth enforcement verified (admin-only for GC/migration)  
✅ Unit tests pass (pytest returns all green)  
✅ No type errors (mypy --strict returns clean)  
✅ No linting errors (ruff check returns clean)

---

### Task 7: Audit logging + Prometheus metrics

**Gate Reference:** [Gate 9.7]  
**Status:** PENDING

**Purpose:**  
Implement audit logging for all frame mutations (upload, pin, delete, migrate) and export Prometheus metrics for monitoring (frame count, storage bytes, GC duration, upload latency P99). Enables observability and compliance auditing.

**Acceptance Criteria Addressed:**  
AC-06 (audit trail for all mutations), AC-18 (Prometheus metrics exported)

**Dependencies:**  
Tasks 5–6 (endpoints already logging actions via archival service)

**Implementation Approach:**

1. Create `packages/shared/api/src/njz_api/archival/audit.py`:
   - Define `async def log_audit(db: AsyncSession, action: str, frame_id: UUID, actor: str, metadata: dict, reason: str)`
   - Called from ArchivalService for every mutation (upload, pin, unpin, gc_delete, migrate, verify)
   - Writes to archive_audit_log table
   - Include timestamp, actor identifier (e.g., 'service:minimap-extractor', 'admin:user-123')

2. Create `packages/shared/api/src/njz_api/archival/metrics.py`:
   - Define Prometheus metrics:
     - `archive_frame_count` (gauge): Total frames in archive
     - `archive_storage_bytes` (gauge): Total bytes stored (all backends)
     - `archive_gc_duration_ms` (histogram): GC job duration in milliseconds
     - `archive_upload_latency_ms` (histogram): Upload endpoint latency (P50, P95, P99)
     - `archive_frames_pinned` (gauge): Count of pinned frames
     - `archive_gc_deleted_total` (counter): Total frames deleted by GC
   
   - Create endpoint `/metrics/archive` that exports metrics in Prometheus format
   - Wire metrics into archival service (increment counters on mutations, record latencies)

3. Create test file `tests/unit/test_audit_log.py`:
   - Test audit log entries created for each action (upload, pin, unpin, gc_delete)
   - Test actor field populated correctly
   - Test metadata JSON serialization
   - Verify audit log is immutable (no updates/deletes)

4. Create separate test for metrics:
   - Test metrics endpoint returns Prometheus format
   - Test metric values reflect correct state (frame count, bytes, etc.)
   - Test histogram latency recording

5. Wire audit logging into archival service:
   - Call `log_audit()` after each mutation (in addition to database writes)
   - Wrap mutation endpoints with metrics tracking (latency histograms)
   - Ensure audit logging doesn't block endpoint responses (async, fire-and-forget)

**Files Affected:**  
- `packages/shared/api/src/njz_api/archival/audit.py` (new, ~80 LOC)
- `packages/shared/api/src/njz_api/archival/metrics.py` (new, ~120 LOC)
- `packages/shared/api/src/njz_api/archival/services/archival_service.py` (modified, +log_audit calls)
- `packages/shared/api/src/njz_api/main.py` (modified, +metrics endpoint)
- `tests/unit/test_audit_log.py` (new, ~100 LOC)

**Estimated Scope:**  
~150 LOC, Low complexity (audit logging, metrics export)

**Verification Command:**  
```bash
pytest tests/unit/test_audit_log.py -v
grep "archive_frame_count\|archive_storage_bytes" packages/shared/api/src/njz_api/archival/metrics.py
curl http://localhost:8000/metrics/archive  # Verify Prometheus format
ruff check packages/shared/api/src/njz_api/archival/audit.py packages/shared/api/src/njz_api/archival/metrics.py
mypy packages/shared/api/src/njz_api/archival/audit.py --strict
```

**Edge Cases & Error Handling:**
- Audit log insertion fails: Log error but don't block mutation (audit is secondary)
- Metrics update fails: Catch exception, continue (metrics are observability, not blocking)
- Sensitive data in audit log: Ensure actor/reason fields don't expose user passwords or API keys
- Large metadata JSON: Serialize cleanly without truncation; use JSONB for proper indexing

**Success Criteria:**  
✅ Audit log entries created for all mutations (upload, pin, delete, migrate)  
✅ Actor field populated (service principal or admin user ID)  
✅ Metadata includes action-specific details (pin_reason, gc_retention_days, etc.)  
✅ Prometheus metrics exported at /metrics/archive in correct format  
✅ Metrics correctly reflect state (frame_count, storage_bytes)  
✅ Latency histograms record endpoint response times  
✅ Unit tests pass (pytest returns all green)  
✅ No type errors (mypy --strict returns clean)  
✅ No linting errors (ruff check returns clean)

---

### Task 8: Integration tests (cross-component workflows)

**Gate Reference:** [Gate 9.8]  
**Status:** PENDING

**Purpose:**  
Create comprehensive E2E integration test suite covering full workflows: extract → archive → query → pin → GC, plus error paths. Verifies all components work together and acceptance criteria are met.

**Acceptance Criteria Addressed:**  
AC-11 (extraction service integration), AC-12 (TeneT integration), AC-13 (frontend access), AC-16 (integration test coverage), AC-17 (E2E test verification), AC-09 (query latency), AC-10 (GC throughput)

**Dependencies:**  
Tasks 1–7 (all components complete)

**Implementation Approach:**

1. Create `tests/integration/test_archive_e2e.py` with 6–8 test scenarios:
   - **Scenario 1: Happy path (upload → query → pin → gc)**
     - Extraction service uploads 100 frames for match M1
     - Verify frames stored in PostgreSQL
     - Verify frames queryable by match_id
     - Verify manifest created
     - Pin top-10 frames via TeneT
     - Run GC with retention_days=0
     - Verify only pinned frames remain
   
   - **Scenario 2: Deduplication**
     - Upload 100 frames
     - Upload same 100 frames again
     - Verify duplicates detected (second upload returns existing frame_ids)
     - Verify manifest created only once
   
   - **Scenario 3: Query with filters**
     - Upload frames with mixed segment_types (IN_ROUND, HALFTIME, BUY_PHASE)
     - Query with segment_type=IN_ROUND filter
     - Verify only IN_ROUND frames returned
   
   - **Scenario 4: Pagination**
     - Upload 500 frames
     - Query with page_size=100
     - Verify total_count=500, page=1 returns 100 frames
     - Verify page=2 returns correct offset
   
   - **Scenario 5: GC retention policy**
     - Upload frames at T=0
     - Advance clock (mock time) to T=95 days
     - Run GC with retention_days=90
     - Verify frames deleted
     - Verify audit log entry created
   
   - **Scenario 6: Error paths**
     - Upload invalid content_hash (not 64 hex chars) → expect 400
     - Query non-existent match_id → expect 404
     - Pin without auth → expect 401
   
   - **Scenario 7: Storage health check**
     - Call /health/storage endpoint
     - Verify response includes backend, status, quota_bytes, used_bytes
   
   - **Scenario 8: Concurrent uploads**
     - Spawn 10 concurrent upload tasks
     - Verify all complete within 2s (P99 latency target)
     - Verify frame counts correct (no race conditions)

2. Use PostgreSQL in-memory test database (pytest fixture):
   - Create test database for each test
   - Run migrations (alembic upgrade head)
   - Cleanup after test (drop schema)

3. Use LocalBackend with temp directory for storage:
   - `tempfile.TemporaryDirectory()` for each test
   - Clean up after test

4. Create helper fixtures:
   - `test_db`: AsyncSession with test database
   - `test_storage`: LocalBackend with temp directory
   - `test_service`: ArchivalService instance
   - `test_client`: FastAPI TestClient

5. Performance validation:
   - Measure upload latency for 1000 frames → ensure <2s (AC-08)
   - Measure query latency for 10K frames → ensure <500ms (AC-09)
   - Measure GC throughput for 10K frames → ensure <1 hour (AC-10)

**Files Affected:**  
- `tests/integration/test_archive_e2e.py` (new, ~450 LOC)
- `tests/conftest.py` (modified, +fixtures for archival)

**Estimated Scope:**  
~450 LOC, Medium-High complexity (E2E setup, async fixtures, performance measurement)

**Verification Command:**  
```bash
pytest tests/integration/test_archive_e2e.py -v
pytest tests/integration/test_archive_e2e.py -v -k "performance" --tb=short  # Run only perf tests
```

**Edge Cases & Error Handling:**
- Test database setup timeout: Increase fixture timeout if needed
- Temp directory cleanup fails: Use `pytest.mark.skipif` if disk is full
- Concurrent test isolation: Ensure each test gets unique database (xfail if isolation fails)
- Performance test flakiness: Re-run if latency exceeds threshold by <10% (document as known flake)

**Success Criteria:**  
✅ All 8 scenarios pass (upload → query → pin → gc workflow verified)  
✅ Deduplication verified (duplicate upload returns existing frame_id)  
✅ Filters applied correctly (segment_type, stream_type, accuracy_tier)  
✅ Pagination offsets correct (page 1, 2, etc.)  
✅ GC respects retention policy (deletes old, not pinned)  
✅ Error paths return correct status codes (400, 401, 404)  
✅ Health check returns valid response format  
✅ Concurrent upload <2s P99 latency (AC-08)  
✅ Query <500ms P99 latency (AC-09)  
✅ GC <1 hour for 10K frames (AC-10)  
✅ Integration tests pass (pytest returns all green)  
✅ No flaky tests (pass consistently on re-run)

---

## Critical Path Analysis

### Dependency Graph

```
Task 1 (PostgreSQL schema)
  ↓
  ├─→ Task 2 (Pydantic schemas) ──────────┐
  ├─→ Task 3 (Storage backend) ──────────┤
  └────────────────────────────────────────┤
                                            ↓
                                   Task 4 (Service)
                                            ↓
                                   Task 5 (Routes)
                                            ↓
  ┌─────────────────────────────────────────┘
  ├─→ Task 6 (GC + migration endpoints)────────────────┐
  └─→ Task 7 (Audit + metrics) ─────────────────────────┤
                                                         ↓
                                              Task 8 (Integration tests)
```

### Critical Path (Minimum Sequence)

**Sequential:** Task 1 → Task 4 → Task 5 → Task 8
**Minimum days:** ~8 days (assuming 1 day per task)

### Parallel Execution Opportunities

- **Tasks 2–3 can run in parallel with Task 1** (after schema available, ~2 days → 1 day with 2 agents)
- **Tasks 6–7 can run in parallel after Task 5** (2 days → 1 day with 2 agents)

### Total Estimated Time

- **Sequential execution:** 8 days
- **Parallel execution (2 agents):** 6–7 days
  - Day 1: Task 1
  - Days 2–3: Tasks 2–3 parallel (after Task 1)
  - Day 4: Task 4
  - Day 5: Task 5
  - Days 6–7: Tasks 6–7 parallel (after Task 5)
  - Day 8: Task 8

**Bottleneck:** Task 1 (schema creation) blocks everything; Task 4 (service) blocks all downstream routes

---

## Framework Integration Checklist

**2/3/5+1,2,3 Compliance:**

- [x] **Every task has [Gate N.M] reference** (Tasks 1–8 map to Gates 9.1–9.8) — Road-Maps pillar
- [x] **Every task links to AC criteria** (AC-01 through AC-18 all addressed across 8 tasks) — MASTER contracts
- [x] **Dependencies documented clearly** (no circular deps, critical path identified) — Logic Trees pillar
- [x] **Gate completion is objectively verifiable** (verification commands are specific, executable, copy-pasteable) — Road-Maps pillar
- [x] **Auth classes applied** (AGENT executes tasks, CODEOWNER approves final plan before impl) — 2 Auth Classes
- [x] **Framework pillars referenced:**
  - **Road-Maps:** Gate linkage ✅ (all 8 tasks linked to Gates 9.1–9.8)
  - **Logic Trees:** Dependency graph ✅ (critical path identified, no circular deps)
  - **ACP:** Handoff documented ✅ (cross-service integration points noted)
  - **MCP:** Data model contracts from requirements.md ✅ (all 3 tables, 12 endpoints, 18 ACs)
  - **Notebook/TODO:** This plan IS session TODO ✅ (task-by-task tracking)

---

## Approval Gate

**Before Implementation begins:**

- [x] **All 8 tasks fully specified** (task details template expanded for each) — COMPLETE
- [x] **Critical path identified** (minimum sequence documented) — COMPLETE
- [x] **No circular dependencies** (reviewed by dependency graph) — CLEAN
- [x] **Framework compliance verified** (2/3/5+1,2,3 checklist completed) — VERIFIED
- [ ] **CODEOWNER approval obtained** (sign-off before agents start coding) — PENDING

---

## Cross-Review Readiness

This plan is ready for Pass 2 audit. Cross-review will check:

✅ **Task decomposition** — Are tasks appropriately sized? (not too granular, not too broad)  
✅ **Dependency ordering** — Are prerequisites correct? Any circular dependencies?  
✅ **Gate linkage** — Every task has [Gate N.M]? Gates are sequential?  
✅ **Feasibility** — Can all 8 tasks complete in Phase 9? (Yes, 6–8 days)  
✅ **Framework compliance** — Are 2/3/5+1,2,3 principles applied throughout?  

**Cross-Review Invocation:**  
After finalizing plan.md, run CROSS-REVIEW-TEMPLATE-2026-03-27.md Pass 2 with specified model.

---

## Success Criteria Summary

✅ **Plan completeness:**
- 8 concrete tasks with gate refs [Gate 9.1]–[Gate 9.8]
- Every task links to AC criteria (AC-01 through AC-18 all addressed)
- Dependencies clearly listed (no circular deps)
- Verification commands executable (copy-pasteable, specific)
- All 18 AC addressed by at least one task
- Critical path identified (Task 1 → Task 4 → Task 5 → Task 8)
- Framework compliance verified (2/3/5+1,2,3 applied)

✅ **Ready for Implementation:**
- No ambiguity (agents can start coding immediately)
- No unresolved gates (Gates 9.1–9.8 created in plan; added to PHASE_GATES.md during implementation)
- No unresolved blockers
- CODEOWNER approval obtained (or explicitly deferred)

---

*This plan expires after Phase 9 completion (2026-04-30). For Phase 10+ planning, refer to MASTER_PLAN.md.*
