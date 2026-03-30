[Ver001.000]

# Archival System Implementation — Task Completion Stubs (Mock)

**Status:** STUB — Mock completion records for Phase 9 planning verification  
**Purpose:** Demonstrate structure of task completion for future agent execution  
**Framework:** NJZPOF v0.2 · Gate-linked task completion  
**Note:** This is a TEMPLATE for what completed tasks would show. Actual implementation follows same structure.

---

## Task 1: PostgreSQL Migration 006 + SQLAlchemy Models

**Gate Reference:** [Gate 9.1]  
**Status:** ✅ MOCK PASSED (structure verified)  
**Completion Time:** ~4 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: cd services/api/ && alembic upgrade head
$ alembic upgrade head
INFO  [alembic.migration] Context impl PostgreSQLImpl with table alembic_version
INFO  [alembic.migration] Will assume transactional DDL.
INFO  [alembic.migration] Running upgrade ... 006_archive_schema
→ Created table archive_frames
→ Created table archive_manifests
→ Created table archive_audit_log
→ Created 5 indices on archive_frames (match_id, content_hash, timestamp_ms, is_pinned, created_at DESC)
INFO  [alembic.migration] Running upgrade complete

# Command: pytest tests/unit/test_archive_models.py -v
tests/unit/test_archive_models.py::TestArchiveFrameModel::test_model_structure PASSED
tests/unit/test_archive_models.py::TestArchiveFrameModel::test_relationships PASSED
tests/unit/test_archive_models.py::TestArchiveFrameModel::test_cascade_delete PASSED
tests/unit/test_archive_models.py::TestArchiveManifestModel::test_model_structure PASSED
tests/unit/test_archive_models.py::TestArchiveAuditLog::test_audit_logging_on_delete PASSED
========== 5 passed in 1.23s ==========

# Command: mypy packages/shared/api/src/njz_api/archival/models/archive.py --strict
Success: no issues found in 1 file
```

### Files Created/Modified

**New:**
- `services/api/src/njz_api/migrations/006_archive_schema.py` (180 LOC)
  - 3 table CREATE statements (archive_frames, archive_manifests, archive_audit_log)
  - 5 indices for performance (match_id, content_hash, timestamp_ms, is_pinned, created_at)
  - FK constraints with ON DELETE CASCADE to matches(id)

- `packages/shared/api/src/njz_api/archival/models/archive.py` (220 LOC)
  - `ArchiveFrame` class: 25 columns, relationships, __table_args__ with indices
  - `ArchiveManifest` class: 8 columns, FK to ArchiveFrame array
  - `ArchiveAuditLog` class: 8 columns, immutable audit trail

**Modified:**
- `packages/shared/api/src/njz_api/models/__init__.py` (added 3 imports)

### Acceptance Criteria Addressed

✅ AC-01 (frames persisted to PostgreSQL) — ArchiveFrame model with DB storage  
✅ AC-06 (mutations logged to audit_log) — ArchiveAuditLog table with triggers

### Notes for Future Agent

- Migration uses `if not exists` pattern for idempotency
- UUID generation via `DEFAULT gen_random_uuid()`
- Soft delete via `deleted_at` column (no actual deletion)
- Cascade delete: Removing match → removes archive_frames automatically

---

## Task 2: Pydantic Schemas + Validation Tests

**Gate Reference:** [Gate 9.2]  
**Status:** ✅ MOCK PASSED  
**Completion Time:** ~2 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_archive_schemas.py -v
tests/unit/test_archive_schemas.py::TestFrameUploadRequest::test_valid_payload PASSED
tests/unit/test_archive_schemas.py::TestFrameUploadRequest::test_missing_required_field PASSED
tests/unit/test_archive_schemas.py::TestFrameUploadResponse::test_response_serialization PASSED
tests/unit/test_archive_schemas.py::TestFrameQueryResponse::test_pagination_fields PASSED
tests/unit/test_archive_schemas.py::TestPinRequest::test_ttl_validation PASSED
tests/unit/test_archive_schemas.py::TestErrorResponse::test_error_structure PASSED
========== 6 passed in 0.45s ==========

# Ruff check output
All checks passed ✓
```

### Files Created

**New:**
- `packages/shared/api/src/njz_api/archival/schemas/archive.py` (200 LOC)
  - `FrameUploadRequest` (frames array, manifest_data optional)
  - `FrameUploadResponse` (frame_ids, manifest_id, duplicates_skipped)
  - `FrameQueryResponse` (frames paginated, has_more, next_page_token)
  - `PinRequest` (reason, ttl_days)
  - `GCRequest` (retention_days, dry_run)
  - `StorageMigrateRequest` (from_backend, to_backend, dry_run)
  - `ErrorResponse` (error, code, timestamp, trace_id)
  - Pydantic v2 with Field validators for all constraints

### Acceptance Criteria Addressed

✅ AC-01 (request/response schemas defined)  
✅ AC-02 (validation rules enforced via Pydantic)  
✅ AC-15 (error response structure standardized)

---

## Task 3: Storage Abstraction Layer (Protocol + LocalBackend)

**Gate Reference:** [Gate 9.3]  
**Status:** ✅ MOCK PASSED  
**Completion Time:** ~2.5 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_storage_backend.py -v
tests/unit/test_storage_backend.py::TestStorageBackendProtocol::test_protocol_compliance PASSED
tests/unit/test_storage_backend.py::TestLocalBackend::test_put_stores_file PASSED
tests/unit/test_storage_backend.py::TestLocalBackend::test_get_retrieves_file PASSED
tests/unit/test_storage_backend.py::TestLocalBackend::test_delete_removes_file PASSED
tests/unit/test_storage_backend.py::TestLocalBackend::test_shard_layout_correctness PASSED
tests/unit/test_storage_backend.py::TestLocalBackend::test_concurrent_writes_safe PASSED
========== 6 passed in 0.78s ==========

# Ruff check
All checks passed ✓
```

### Files Created

**New:**
- `packages/shared/api/src/njz_api/archival/storage/backend.py` (250 LOC)
  - `StorageBackend` Protocol (abstract interface, no ABC inheritance)
    - Methods: `async put(key, data)`, `async get(key)`, `async delete(key)`, `async exists(key)`
  - `LocalBackend` implementation
    - File storage at `{DATA_DIR}/frames/{hash[:2]}/{hash}.jpg` (2-char shard)
    - Async file operations via aiofiles
    - Error handling: OSError → 503 Service Unavailable response

**New:**
- `tests/unit/test_storage_backend.py` (150 LOC)
  - Tests for Protocol compliance
  - Tests for LocalBackend put/get/delete/exists
  - Concurrency safety tests
  - Shard layout verification

### Acceptance Criteria Addressed

✅ AC-14 (multi-backend abstraction design)

### Notes for Future Agent

- Protocol-based (not ABC) follows Python 3.11+ idioms
- Shard layout prevents inode exhaustion at scale
- S3/R2 backends deferred to Phase 2 (stub structure only needed)

---

## Task 4: Archival Service (Deduplication, GC, Migration)

**Gate Reference:** [Gate 9.4]  
**Status:** ✅ MOCK PASSED  
**Completion Time:** ~3.5 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_archival_service.py -v
tests/unit/test_archival_service.py::TestDeduplication::test_sha256_hash_computed_before_insert PASSED
tests/unit/test_archival_service.py::TestDeduplication::test_duplicate_frame_returns_existing_id PASSED
tests/unit/test_archival_service.py::TestDeduplication::test_409_conflict_on_duplicate PASSED
tests/unit/test_archival_service.py::TestGarbageCollection::test_gc_deletes_unpinned_frames PASSED
tests/unit/test_archival_service.py::TestGarbageCollection::test_gc_respects_pin_ttl PASSED
tests/unit/test_archival_service.py::TestGarbageCollection::test_gc_respects_is_pinned_flag PASSED
tests/unit/test_archival_service.py::TestMigration::test_migrate_frames_to_new_backend PASSED
========== 7 passed in 1.45s ==========
```

### Files Created

**New:**
- `packages/shared/api/src/njz_api/archival/services/archival_service.py` (350 LOC)
  - `ArchivalService` class (dependency: storage_backend, db_session)
  - Methods:
    - `async upload_frames(frames, metadata)` — SHA-256 dedup, content-addressed storage
    - `async query_frames(match_id, page)` — Pagination, Redis cache invalidation
    - `async pin_frame(frame_id, reason, ttl_days)` — Update is_pinned flag
    - `async unpin_frame(frame_id)` — Clear pinning
    - `async gc_unpinned_frames(retention_days, dry_run)` — Delete old unpinned frames
    - `async migrate_frames(from_backend, to_backend, dry_run)` — Storage migration
  - Error handling: 409 Conflict on duplicate hash, 503 on backend failure
  - All async/await (no blocking I/O)

### Acceptance Criteria Addressed

✅ AC-02 (deduplication logic)  
✅ AC-03 (content-addressed storage)  
✅ AC-05 (garbage collection with retention policies)  
✅ AC-11 (async operations)

---

## Task 5: FastAPI Router — Frame Endpoints (Upload, Query, Pin)

**Gate Reference:** [Gate 9.5]  
**Status:** ✅ MOCK PASSED  
**Completion Time:** ~3 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_archive_routes.py -v
tests/unit/test_archive_routes.py::TestUploadEndpoint::test_upload_returns_200_on_success PASSED
tests/unit/test_archive_routes.py::TestUploadEndpoint::test_upload_returns_409_on_duplicate PASSED
tests/unit/test_archive_routes.py::TestUploadEndpoint::test_upload_returns_503_on_backend_failure PASSED
tests/unit/test_archive_routes.py::TestQueryEndpoint::test_query_returns_paginated_frames PASSED
tests/unit/test_archive_routes.py::TestQueryEndpoint::test_query_pagination_next_token PASSED
tests/unit/test_archive_routes.py::TestPinEndpoint::test_pin_returns_200_on_success PASSED
tests/unit/test_archive_routes.py::TestPinEndpoint::test_pin_returns_404_on_missing_frame PASSED
========== 7 passed in 1.23s ==========

# FastAPI docs check
curl http://localhost:8000/v1/docs
→ Lists all endpoints: POST /v1/archive/frames, GET /v1/archive/matches/{match_id}/frames, etc.
```

### Files Created

**New:**
- `packages/shared/api/routers/archive.py` (300 LOC)
  - `router = APIRouter(prefix="/v1/archive", tags=["archive"])`
  - **POST /v1/archive/frames** — Upload batch frames
    - Request: FrameUploadRequest
    - Response: FrameUploadResponse
    - Error: 400 (invalid), 409 (duplicate), 503 (storage unavailable)
  - **GET /v1/archive/matches/{match_id}/frames** — Query frames by match
    - Params: page (default 0), limit (default 50)
    - Response: FrameQueryResponse
    - Redis cache: 5-min TTL
  - **POST /v1/archive/frames/{frame_id}/pin** — Pin frame
    - Request: PinRequest
    - Response: Frame with is_pinned=true
  - **POST /v1/archive/frames/{frame_id}/unpin** — Unpin frame
  - All endpoints: Auth check (admin or service principal), error handling
  - Logging: INFO on success, ERROR on failure with context

### Integration with Main FastAPI App

```python
# In main.py
from njz_api.routers import archive
app.include_router(archive.router)
```

### Acceptance Criteria Addressed

✅ AC-01 (upload endpoint)  
✅ AC-03 (query endpoint with pagination)  
✅ AC-04 (pin/unpin endpoints)  
✅ AC-12 (error responses)  
✅ AC-13 (auth requirements)

---

## Task 6: GC + Storage Migration Endpoints

**Gate Reference:** [Gate 9.6]  
**Status:** ✅ MOCK PASSED  
**Completion Time:** ~2 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_archive_gc.py -v && pytest tests/unit/test_storage_migration.py -v
tests/unit/test_archive_gc.py::TestGCEndpoint::test_gc_dry_run_returns_count PASSED
tests/unit/test_archive_gc.py::TestGCEndpoint::test_gc_execute_deletes_frames PASSED
tests/unit/test_archive_gc.py::TestGCEndpoint::test_gc_respects_retention_days PASSED
tests/unit/test_storage_migration.py::TestMigrationEndpoint::test_migration_status_check PASSED
tests/unit/test_storage_migration.py::TestMigrationEndpoint::test_migration_async_job PASSED
========== 5 passed in 0.89s ==========
```

### Files Created

**Modified:**
- `packages/shared/api/routers/archive.py` (added 180 LOC)
  - **POST /v1/archive/gc** — Garbage collection
    - Request: GCRequest (retention_days=90, dry_run=False)
    - Response: { deleted_count, deleted_size_bytes }
    - Async background job (doesn't block)
  - **POST /v1/archive/storage/migrate** — Storage migration
    - Request: StorageMigrateRequest (from_backend, to_backend, dry_run)
    - Response: { job_id, status, progress }
    - Async background job with progress tracking

### Acceptance Criteria Addressed

✅ AC-05 (GC endpoint)  
✅ AC-08 (retention policies)  
✅ AC-11 (async operations)

---

## Task 7: Audit Logging + Prometheus Metrics

**Gate Reference:** [Gate 9.7]  
**Status:** ✅ MOCK PASSED  
**Completion Time:** ~1.5 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/unit/test_audit_log.py -v
tests/unit/test_audit_log.py::TestAuditLogTrigger::test_upload_creates_audit_entry PASSED
tests/unit/test_audit_log.py::TestAuditLogTrigger::test_pin_creates_audit_entry PASSED
tests/unit/test_audit_log.py::TestAuditLogTrigger::test_gc_creates_audit_entries PASSED
========== 3 passed in 0.34s ==========

# Command: grep "archive_frame" packages/shared/api/src/njz_api/archival/metrics.py
archive_frames_uploaded_total = Counter('archive_frames_uploaded_total', ...)
archive_frames_deduplicated_total = Counter('archive_frames_deduplicated_total', ...)
archive_frames_deleted_total = Counter('archive_frames_deleted_total', ...)
archive_storage_bytes_total = Gauge('archive_storage_bytes_total', ...)
```

### Files Created

**New:**
- `packages/shared/api/src/njz_api/archival/metrics.py` (100 LOC)
  - Prometheus metrics: Counters (uploaded, deduplicated, deleted), Gauges (storage usage)
  - Integrated with archival_service methods
  - Endpoint: GET /metrics/archive (Prometheus scraper)

**Modified:**
- `packages/shared/api/src/njz_api/archival/services/archival_service.py` (added 50 LOC)
  - SQLAlchemy event listeners on ArchiveFrame `after_insert`, `after_update` (deleted_at)
  - Auto-create ArchiveAuditLog entries on mutations
  - Log format: action, actor, frame_id, metadata (JSON)

### Acceptance Criteria Addressed

✅ AC-06 (audit logging)  
✅ AC-07 (audit log immutability)  
✅ AC-18 (metrics)

---

## Task 8: Integration Tests (Cross-Component Workflows)

**Gate Reference:** [Gate 9.8]  
**Status:** ✅ MOCK PASSED  
**Completion Time:** ~4 hours (estimated)

### Verification Evidence (Mock)

```bash
# Command: pytest tests/integration/test_archive_e2e.py -v
tests/integration/test_archive_e2e.py::TestUploadQueryWorkflow::test_upload_query_paginate PASSED
tests/integration/test_archive_e2e.py::TestUploadQueryWorkflow::test_upload_deduplication_skips_duplicate PASSED
tests/integration/test_archive_e2e.py::TestPinGCWorkflow::test_pin_prevents_gc_deletion PASSED
tests/integration/test_archive_e2e.py::TestPinGCWorkflow::test_pin_ttl_expiry_allows_gc PASSED
tests/integration/test_archive_e2e.py::TestMigrationWorkflow::test_migrate_frames_to_new_backend PASSED
tests/integration/test_archive_e2e.py::TestAuditTrail::test_all_mutations_logged PASSED
tests/integration/test_archive_e2e.py::TestErrorHandling::test_409_on_duplicate_hash PASSED
tests/integration/test_archive_e2e.py::TestErrorHandling::test_503_on_storage_failure PASSED
========== 8 passed in 2.34s ==========

# Coverage report
Name                                                        Stmts   Miss  Cover
njz_api/archival/__init__.py                                  2      0   100%
njz_api/archival/services/archival_service.py               350      8    97%
njz_api/archival/routers/archive.py                         300      5    98%
njz_api/archival/models/archive.py                          220      0   100%
njz_api/archival/schemas/archive.py                         200      0   100%
njz_api/archival/storage/backend.py                         250      3    98%
---
TOTAL                                                      1520     16    99%
```

### Files Created

**New:**
- `tests/integration/test_archive_e2e.py` (450 LOC)
  - Fixtures: PostgreSQL test database, LocalBackend test storage
  - Workflows:
    - Upload → Query → Paginate (full cycle)
    - Deduplication (same hash → returns existing ID)
    - Pin → GC (pinned frames survive GC)
    - Pin TTL expiry (frames cleaned after TTL)
    - Storage migration (frames accessible after backend swap)
    - Audit trail (all mutations logged)
    - Error cases (409 duplicate, 503 storage failure)
  - Assertions: Response codes, data integrity, audit log entries, metrics

### Acceptance Criteria Addressed

✅ AC-09 (E2E workflow verification)  
✅ AC-10 (deduplication workflow)  
✅ AC-11 (async operations)  
✅ AC-12 (error handling)  
✅ AC-13 (auth enforcement)  
✅ AC-16 (data integrity)  
✅ AC-17 (audit trail)

---

## Summary: All Tasks Mock-Complete

| Task | Gate | Status | AC Addressed | LOC |
|------|------|--------|---|---|
| 1 | 9.1 | ✅ MOCK | AC-01, AC-06 | 400 |
| 2 | 9.2 | ✅ MOCK | AC-01, AC-02, AC-15 | 200 |
| 3 | 9.3 | ✅ MOCK | AC-14 | 250 |
| 4 | 9.4 | ✅ MOCK | AC-02, AC-03, AC-05, AC-11 | 350 |
| 5 | 9.5 | ✅ MOCK | AC-01, AC-03, AC-04, AC-12, AC-13 | 300 |
| 6 | 9.6 | ✅ MOCK | AC-05, AC-08, AC-11 | 180 |
| 7 | 9.7 | ✅ MOCK | AC-06, AC-07, AC-18 | 150 |
| 8 | 9.8 | ✅ MOCK | AC-09, AC-10, AC-11, AC-12, AC-13, AC-16, AC-17 | 450 |
| **TOTAL** | — | **✅ MOCK** | **All 18 AC** | **~2280** |

---

## Notes for Future Agent Implementation

1. **Migration path:** Use `services/api/src/njz_api/migrations/` (Alembic location)
2. **Async enforcement:** All I/O via asyncio (no `requests` library, use `httpx`)
3. **Error handling:** Status codes map to specific error conditions (400, 409, 503)
4. **Verification:** Each task verification command is copy-pasteable from plan.md
5. **Code style:** Follow AGENTS.md conventions + existing packages/shared/api/ patterns
6. **Test coverage:** Aim for >80% overall; >95% for critical paths (dedup, GC, audit)
7. **Framework compliance:** All gates must be updated in PHASE_GATES.md upon completion

---

*This stub document demonstrates the expected structure and completion pattern for Phase 9 Archival System implementation. Use as template for actual agent execution.*
