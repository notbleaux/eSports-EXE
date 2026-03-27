[Ver001.000]

# Technical Specification — Minimap Archival System [STUB]

**Status:** STUB — Agent instructions integrated  
**Framework:** NJZPOF v0.2 · 2/3/5+1,2,3 compliance  
**Agent Instructions:** Follow sections marked [AGENT: ...]  
**Cross-Review Ready:** This stub is complete enough for Pass 1 audit  

---

## 1. Technical Context

[AGENT: Fill in language, dependencies, framework alignment. Reference AGENTS.md. Be specific.]

> **[ENRICHMENT — 2026-03-28]:** The canonical pattern source for this service is `services/tenet-verification/` — follow its FastAPI router structure, SQLAlchemy async engine setup, and dependency injection patterns exactly. For external storage calls (S3/R2), mirror the `CircuitBreaker` and `retry_with_backoff()` patterns from `services/legacy-compiler/`. Service port convention: tenet-verification=8001, websocket=8002, legacy-compiler=8003 → **Archival System = 8005** (minimap-extractor takes 8004). Confirm port assignment with CODEOWNER before wiring docker-compose. The `data/schemas/tenet-protocol.ts` already registers `minimap_analysis` source type — this service will feed that pipeline. Check `packages/shared/api/src/njz_api/` for the `get_db()` dependency and `Base` SQLAlchemy declarative base to reuse.

**Example structure:**

```markdown
### Language & Runtime
- Python 3.11+
- Async-first (asyncio + FastAPI)
- Type hints (mypy compatible)

### Key Dependencies
- FastAPI >= 0.104.0
- SQLAlchemy >= 2.0 (ORM)
- Pydantic >= 2.0
- httpx >= 0.25.0 (async HTTP client for S3/R2)
- boto3 >= 1.26.0 (AWS S3)

### Framework Alignment
- Follows packages/shared/api/ patterns:
  - FastAPI routers with dependency injection (see packages/shared/api/routers/players.py)
  - SQLAlchemy ORM with relationships (see packages/shared/api/models/player.py)
  - Pydantic v2 schemas with validation (see packages/shared/api/schemas/)
  - Async/await throughout (see packages/shared/api/services/)
```

---

## 2. Implementation Approach

[AGENT: Describe design patterns, async strategy, storage abstraction design.]

> **[ENRICHMENT — 2026-03-28]:** Critical design decisions to address in this section:
>
> 1. **SHA-256 deduplication ordering** — Hash must be computed from raw JPEG bytes BEFORE DB insert attempt. Flow: `receive bytes → sha256(bytes) → SELECT from archive_frames WHERE content_hash = ? → if exists return existing ID, skip storage write → else write storage + insert DB`. Never write to storage first.
> 2. **StorageBackend Protocol** — Use `typing.Protocol` (structural subtyping) not `abc.ABC` for backend interface. This avoids registration boilerplate and matches Python 3.11+ idioms.
> 3. **LocalBackend shard layout** — Store files at `{DATA_DIR}/frames/{content_hash[:2]}/{content_hash}.jpg` (2-char prefix shard) to avoid filesystem inode limits at scale.
> 4. **S3/R2 error → 503 not 500** — Storage backend unavailability must return `503 Service Unavailable` with `Retry-After: 30` header, not 500. 500 signals our bug; 503 signals external dependency failure.
> 5. **Frame metadata Redis cache** — Cache `GET /v1/archive/matches/{id}/frames` responses in Redis with TTL=300s (5 min). Key: `archive:frames:{match_id}:page:{page}`. Invalidate on any upload to that match. This matches the 5-min TanStack Query staleTime on the frontend.
> 6. **Audit log trigger strategy** — Use SQLAlchemy `@event.listens_for(ArchiveFrame, 'after_update')` to auto-create audit entries on `deleted_at` set (GC) or `is_pinned` toggle. Explicit audit entries still needed for uploads and migrations.

**Expected subsections:**
- Async/Await Strategy (no blocking I/O, httpx for HTTP, asyncpg/asyncio for DB)
- Storage Abstraction Pattern (Protocol-based design with multiple backends)
- Deduplication Strategy (SHA-256 hashing, content-addressable storage)
- Error Handling Strategy (4xx validation, 5xx backend failures, fallback behavior)
- Caching Strategy (Redis, client-side, TTL policies)

**Example approach section:**

```markdown
### Async/Await Throughout

All I/O operations (database, storage, HTTP) must use async/await:
- Database: asyncpg via SQLAlchemy async engine
- Storage: httpx for S3/R2 HTTP requests
- No blocking calls (no requests library, no synchronous file operations)
- Timeouts on all HTTP calls (default 30s, configurable)

### Storage Abstraction Layer

Protocol-based design with multiple backend implementations:

```python
# Abstract protocol
class StorageBackend(Protocol):
    async def put(self, key: str, data: bytes) -> str: ...  # return storage_url
    async def get(self, key: str) -> bytes: ...
    async def delete(self, key: str) -> None: ...
    async def exists(self, key: str) -> bool: ...

# Implementations
class LocalBackend(StorageBackend): ...  # Phase 1
class S3Backend(StorageBackend): ...     # Phase 2
class R2Backend(StorageBackend): ...     # Phase 2
```
```

---

## 3. Source Code Structure

[AGENT: Define file layout, module organization. Copy template from ARCHIVAL-SYSTEM-WORKPLAN.]

> **[ENRICHMENT — 2026-03-28]:** Before writing this section, verify the migration path: check whether `services/api/src/njz_api/migrations/` exists or if migrations live in `packages/shared/api/` (Alembic `alembic.ini` location is authoritative). Add all new models to `packages/shared/api/models/__init__.py` exports — any missing export will break `from njz_api.models import ArchiveFrame` imports across the codebase. The `archival/` module must be structured so `from njz_api.archival import router` is the only import needed in `main.py`. Include an `archival/dependencies.py` for shared FastAPI `Depends()` factories (e.g. `get_archival_service()`) — this prevents circular imports between routers and services.

**Expected directory structure:**

```
packages/shared/api/src/njz_api/archival/
├── __init__.py
├── models/
│   ├── __init__.py
│   └── archive_frames.py          # SQLAlchemy models (archive_frames, archive_manifests, archive_audit_log)
├── schemas/
│   ├── __init__.py
│   └── archive.py                 # Pydantic request/response schemas
├── routers/
│   ├── __init__.py
│   └── archive.py                 # FastAPI endpoints (/v1/archive/*, /health/storage, /metrics/archive)
├── storage/
│   ├── __init__.py
│   ├── backend.py                 # Abstract StorageBackend protocol + LocalBackend implementation
│   ├── s3_backend.py              # (Phase 2) S3Backend
│   └── r2_backend.py              # (Phase 2) R2Backend
└── services/
    ├── __init__.py
    └── archival_service.py        # Core business logic (deduplication, GC, migration)

services/api/src/njz_api/migrations/
└── 006_archive_schema.py           # Alembic migration (3 tables: archive_frames, archive_manifests, archive_audit_log)
```

[AGENT: List each file with 1–2 line responsibility. Explain imports/dependencies between modules.]

---

## 4. Data Model Integration

[AGENT: Define SQLAlchemy models with relationships, indices, constraints.]

**Expected content:**

```markdown
### Table: archive_frames

Core table for storing frame metadata and storage pointers.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique frame identifier |
| content_hash | VARCHAR(64) | NOT NULL, UNIQUE | SHA-256 hash (deduplication key) |
| match_id | UUID | FK → matches(id) ON DELETE CASCADE | Link to match |
| extraction_job_id | UUID | NOT NULL | Link to extraction job |
| frame_index | INT | NOT NULL | 0-based frame number in stream |
| stream_type | VARCHAR(10) | CHECK (IN ['A', 'B']) | Frame type (crop vs. analysis) |
| segment_type | VARCHAR(20) | CHECK (IN [...]) | Round segment (IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN) |
| timestamp_ms | BIGINT | NOT NULL | Milliseconds in VOD |
| storage_backend | VARCHAR(20) | CHECK (IN ['local', 's3', 'r2']) | Where frame is stored |
| storage_path | VARCHAR(255) | NOT NULL | Relative path or S3 key |
| storage_url | TEXT | NOT NULL | Signed URL (S3) or file:// path |
| file_size_bytes | BIGINT | NOT NULL | Frame JPEG size |
| is_pinned | BOOLEAN | NOT NULL DEFAULT FALSE | Prevent GC deletion |
| pin_reason | VARCHAR(255) | Nullable | Why frame is pinned |
| pin_expires_at | TIMESTAMP | Nullable | Pin TTL |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update |
| deleted_at | TIMESTAMP | Nullable | Soft delete (audit trail) |

**Indices (for performance):**
- `idx_archive_frames_match_id` ON match_id
- `idx_archive_frames_content_hash` ON content_hash (deduplication lookup)
- `idx_archive_frames_timestamp` ON timestamp_ms (timeline queries)
- `idx_archive_frames_pinned` ON is_pinned WHERE NOT is_pinned (GC filter)
- `idx_archive_frames_created` ON created_at DESC (recent frames)

### Table: archive_manifests

[AGENT: Define manifest table structure, purpose, indices.]

> **[ENRICHMENT — 2026-03-28]:** Recommended manifest table columns: `id UUID PK`, `match_id UUID FK→matches(id) ON DELETE CASCADE`, `extraction_job_id UUID NOT NULL`, `frame_count INT NOT NULL`, `total_size_bytes BIGINT NOT NULL`, `storage_backend VARCHAR(20) CHECK (IN ['local','s3','r2'])`, `created_at TIMESTAMP NOT NULL DEFAULT NOW()`. Indices: on `match_id` (lookup), on `extraction_job_id` (join). Purpose: one manifest per extraction job batch, contains aggregate metadata about all frames in that batch. The extraction_jobs table's `manifest_id` FK points here.

### Table: archive_audit_log

[AGENT: Define audit table structure, purpose, indices.]

> **[ENRICHMENT — 2026-03-28]:** Recommended audit log columns: `id UUID PK`, `action VARCHAR(20) CHECK (IN ['UPLOAD','PIN','UNPIN','GC_DELETE','MIGRATE','VERIFY'])`, `frame_id UUID FK→archive_frames(id) ON DELETE SET NULL` (nullable — bulk GC entries may not reference a single frame), `actor VARCHAR(100) NOT NULL` (e.g. `'service:minimap-extractor'` or `user_id`), `metadata JSONB` (action-specific detail — pin reason, GC retention_days, migration backend, etc.), `created_at TIMESTAMP NOT NULL DEFAULT NOW()`. Indices: on `action` (filter by type), on `frame_id` (frame history lookup), on `created_at DESC` (recent audit trail). No soft delete on audit log — it is immutable once written.

### SQLAlchemy Models

```python
# Example model structure (AGENT: fill in all fields, relationships, __table_args__)
class ArchiveFrame(Base):
    __tablename__ = "archive_frames"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    content_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    match_id: Mapped[UUID] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"))
    # ... other fields
    
    match: Mapped["Match"] = relationship("Match", back_populates="archive_frames")
    # ... other relationships
```
```

---

## 5. API Endpoint Design

[AGENT: Specify all 12 endpoints. Use table format for clarity. Include request/response schemas, error cases, auth.]

**Expected format:**

```markdown
### Endpoint: POST /v1/archive/frames

**Purpose:** Batch upload frame batch with deduplication  
**Auth:** Service principal or admin  

**Request Schema:**
```python
class FrameUploadRequest(BaseModel):
    frames: List[dict]  # [{ content_hash: str, jpeg_bytes: bytes, metadata: FrameMetadata }, ...]
    manifest_data: Optional[dict] = None

class FrameMetadata(BaseModel):
    match_id: UUID
    extraction_job_id: UUID
    frame_index: int
    stream_type: StreamType  # 'A' or 'B'
    segment_type: SegmentType  # IN_ROUND, BUY_PHASE, etc.
    timestamp_ms: int
    accuracy_tier: Optional[str] = "STANDARD"
    tenet_verification_id: Optional[UUID] = None
```

**Response Schema:**
```python
class FrameUploadResponse(BaseModel):
    frame_ids: List[UUID]  # newly created or deduplicated frame IDs
    manifest_id: UUID  # manifest from this batch
    duplicates_skipped: int  # how many frames were deduplicated
```

**Error Cases:**
- 400 Bad Request: Invalid metadata, missing required fields
- 409 Conflict: Duplicate content_hash detected (return existing frame_id)
- 503 Service Unavailable: Storage backend unavailable (log, return gracefully)

### Endpoint: GET /v1/archive/matches/{match_id}/frames

[AGENT: Specify query parameters (pagination, filtering), response, auth.]

### Endpoint: POST /v1/archive/frames/{frame_id}/pin

[AGENT: Specify request (reason, ttl_days), response, auth.]

### Endpoint: POST /v1/archive/frames/{frame_id}/unpin

[AGENT: Specify request, response, auth.]

### Endpoint: POST /v1/archive/gc

[AGENT: Specify request (retention_days, dry_run), response, auth.]

### Endpoint: POST /v1/archive/storage/migrate

[AGENT: Specify request (from_backend, to_backend, dry_run), response, auth.]

### Endpoint: GET /health/storage

[AGENT: Specify response (backend status, quota, usage), auth.]

### Endpoint: POST /v1/archive/storage/verify

[AGENT: Specify request (frame_ids or empty), response (verified count, failures), auth.]

### Endpoint: GET /v1/archive/audit

[AGENT: Specify query params (action, since, limit), response, auth.]

### Endpoint: GET /metrics/archive

[AGENT: Specify Prometheus metrics, auth (Prometheus scraper).]
```

---

## 6. Delivery Phases

[AGENT: Define phase boundaries, scope, deferral rationale.]

**Example structure:**

```markdown
### Phase 1 MVP (Phase 9 execution)

**Scope:**
- Core frame upload, query, pin/unpin, GC
- Local filesystem storage backend only
- PostgreSQL metadata indexing
- Basic Prometheus metrics
- Audit logging
- Unit + integration tests

**Out of Scope (Phase 2):**
- S3/R2 cloud backends
- Storage migration tooling
- Cross-region backup
- Glacier archival

### Phase 2 (Phase 10)

**Scope:**
- S3 backend implementation
- R2 backend implementation
- Storage migration API
- Advanced metrics

### Phase 3+ (Phase 11+)

**Scope:**
- Cross-region replication
- Glacier cold storage archival
- Advanced retention policies
- Performance optimization (sharding, read replicas)
```

---

## 7. Verification Approach

[AGENT: Define testing strategy, commands to run, success criteria.]

**Expected structure:**

```markdown
### Unit Tests

**Location:** `tests/unit/test_archive_*.py`

**Coverage:**
- `test_archive_schemas.py` — Pydantic validation, enums
- `test_archive_models.py` — SQLAlchemy model relationships, constraints
- `test_storage_backend.py` — StorageBackend protocol, LocalBackend implementation
- `test_archival_service.py` — Deduplication logic, GC logic

**Command:**
```bash
pytest tests/unit/test_archive_*.py -v --cov=packages/shared/api/src/njz_api/archival/
```

**Success Criteria:**
- All tests pass
- Coverage >= 80% for archival module
- No type errors (mypy)
- No linting errors (ruff)

### Integration Tests

**Location:** `tests/integration/test_archive_*.py`

**Coverage:**
- `test_archive_upload.py` — Frame upload, deduplication, manifest creation
- `test_archive_query.py` — Frame query by match, pagination
- `test_archive_gc.py` — Garbage collection, retention policies
- `test_archive_e2e.py` — Full workflow (upload → query → pin → gc)

**Command:**
```bash
pytest tests/integration/test_archive_*.py -v --postgres --redis
```

**Success Criteria:**
- All integration tests pass
- E2E workflow verified (frame lifecycle complete)
- Performance targets met (<2s upload P99, <500ms query P99)

### Lint & Type Checking

**Commands:**
```bash
ruff check packages/shared/api/src/njz_api/archival/
mypy packages/shared/api/src/njz_api/archival/ --strict
```

**Success Criteria:**
- Zero ruff violations
- Zero mypy type errors
- All imports resolved

### API Documentation

**Verification:**
```bash
# Start API server
uvicorn main:app --reload

# Check auto-generated docs
curl http://localhost:8000/v1/docs
```

**Success Criteria:**
- All 12 endpoints appear in Swagger docs
- Request/response schemas are correct
- No schema validation errors
```

---

## Framework Integration Checklist

**2/3/5+1,2,3 Compliance:**

- [ ] **2 Auth Classes:** API endpoints specify auth (AGENT, CODEOWNER, public, service principal)
- [ ] **3 Tiers:** Spec references MASTER contracts (requirements.md), defines PHASE deliverables, acknowledges WORK SESSION workplan
- [ ] **5 Pillars:** 
  - Road-Maps: Tasks linked to gates (Road-Maps)
  - Logic Trees: Task dependencies documented in plan.md
  - ACP: Handoff documented in AGENT-TASK-INSTRUCTION
  - MCP: Data model contracts aligned with requirements.md
  - Notebook/TODO: Workplan is session TODO
- [ ] **+3 Bonus:** Integration with ARCHIVE_MASTER_DOSSIER.md, FILTER_RULES.md, DOSSIER_CREATION_TEMPLATE.md noted

---

## Cross-Review Readiness

[AGENT: This stub is ready for cross-review. Pass 1 audit will check:]

✅ **Correctness** — All technical decisions sound?  
✅ **Completeness** — All 12 API endpoints specified, all tables defined, all async?  
✅ **Alignment** — Existing codebase patterns followed?  
✅ **Gaps** — Retry logic, error handling, edge cases?  
✅ **Risks** — N+1 queries, concurrent upload race conditions?  

**Cross-Review Invocation:**
After finalizing spec.md, run CROSS-REVIEW-TEMPLATE-2026-03-27.md Pass 1 with sonnet-4-6-think.

---

*This stub expires 2026-03-30. Replace with finalized spec.md after cross-review completion.*
