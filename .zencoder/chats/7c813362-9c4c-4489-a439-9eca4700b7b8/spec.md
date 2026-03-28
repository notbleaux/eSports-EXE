[Ver001.000]

# Technical Specification — Minimap Archival System

**Status:** COMPLETE  
**Framework:** NJZPOF v0.2 · 2/3/5+1,2,3 compliance  
**Target:** Python 3.11+ FastAPI backend, PostgreSQL, multi-cloud storage  
**Phase:** Phase 9 MVP (local storage + core endpoints)

---

## 1. Technical Context

### Language & Runtime
- **Python:** 3.11+ (async-first, type hints, mypy-compatible)
- **Async Framework:** FastAPI 0.104.0+ with asyncio
- **Type System:** Full type hints with mypy strict mode

### Key Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | >= 0.104.0 | REST API framework, async handlers |
| **SQLAlchemy** | >= 2.0 | ORM with async engine (sqlalchemy[asyncio]) |
| **Pydantic** | >= 2.0 | Request/response schema validation |
| **asyncpg** | >= 0.29.0 | Async PostgreSQL driver (via SQLAlchemy) |
| **httpx** | >= 0.25.0 | Async HTTP client for S3/R2 (Phase 2) |
| **boto3** | >= 1.26.0 | AWS S3 client (Phase 2; httpx wrapper in Phase 1) |
| **redis** | >= 5.0.0 | Optional async Redis client (aioredis) for frame metadata cache |
| **alembic** | >= 1.12.0 | Database migrations |
| **pytest** | >= 7.4.0 | Testing framework |
| **pytest-asyncio** | >= 0.21.0 | Async test support |
| **ruff** | >= 0.1.0 | Linting and formatting |

### Framework Alignment

The Archival System follows established patterns from `packages/shared/api/`:

1. **FastAPI Routers:** Modular endpoint organization (see [./packages/shared/api/routers/players.py](./packages/shared/api/routers/players.py))
   - Dependency injection via `Depends(get_db())`
   - Request/response models from Pydantic schemas
   - OpenAPI documentation auto-generated

2. **SQLAlchemy ORM:** Async-aware models with relationships (see [./packages/shared/api/models/player.py](./packages/shared/api/models/player.py))
   - Mapped types for type safety
   - ForeignKey relationships with cascading behavior
   - Custom `__table_args__` for indices and constraints

3. **Pydantic v2 Schemas:** Strict validation with Field descriptors (see [./packages/shared/api/schemas/](./packages/shared/api/schemas/))
   - Enum support for StreamType, SegmentType, StorageBackend
   - Optional fields with defaults (None, "STANDARD")
   - Custom validators for business logic

4. **Async/Await Throughout:**
   - No blocking I/O (all database calls via `async with AsyncSession`)
   - HTTP requests via httpx async client
   - Background tasks via `asyncio.create_task()`

### Service Port Assignment
- **Archival System API:** Port 8005 (reserved)
- **Minimap Extractor:** Port 8004
- **TeneT Verification:** Port 8001
- **WebSocket:** Port 8002

---

## 2. Implementation Approach

### Async/Await Strategy

All I/O operations use async/await with zero blocking calls:

1. **Database:** SQLAlchemy async engine with asyncpg
   - Connection pooling via AsyncSession
   - Query operations return coroutines
   - Transaction scopes managed via context managers

2. **Storage Backend:** Protocol-based abstraction with async methods
   - `async def put(key: str, data: bytes) -> str` — returns storage URL
   - `async def get(key: str) -> bytes` — returns frame data
   - `async def delete(key: str) -> None` — soft or hard delete
   - `async def exists(key: str) -> bool` — metadata-only check

3. **HTTP Calls:** httpx async client for external APIs
   - Configurable timeouts (default 30s, S3 PUT 60s)
   - Retry logic with exponential backoff (Phase 2+)
   - Connection pooling via persistent client

### Storage Abstraction Layer

**Design Pattern:** `typing.Protocol` (structural subtyping) — avoids ABC registration boilerplate and matches Python 3.11+ idioms.

```python
# services/archival_service.py
from typing import Protocol, runtime_checkable

@runtime_checkable
class StorageBackend(Protocol):
    """Abstract interface for frame storage backends."""
    
    async def put(self, key: str, data: bytes) -> str:
        """Store frame bytes. Return: storage_url (file:// or S3 signed URL)"""
        ...
    
    async def get(self, key: str) -> bytes:
        """Retrieve frame bytes."""
        ...
    
    async def delete(self, key: str) -> None:
        """Delete frame from backend (idempotent)."""
        ...
    
    async def exists(self, key: str) -> bool:
        """Check if frame exists (fast path, metadata only)."""
        ...
    
    async def health_check(self) -> dict:
        """Return backend status: {status: 'ok'|'degraded'|'failed', quota_bytes: int, used_bytes: int}"""
        ...
```

**Phase 1 Implementation (LocalBackend):**
- Shard layout: `{DATA_DIR}/frames/{content_hash[:2]}/{content_hash}.jpg`
  - 2-char prefix sharding avoids filesystem inode limits at scale (>1M files)
  - Enables concurrent file operations across multiple shard directories
- File writes via aiofiles (async I/O)
- Directory structure auto-created on first use
- `storage_url` format: `file://{absolute_path}` for local, `s3://{bucket}/{key}` for Phase 2

**Phase 2 Implementations (deferred):**
- `S3Backend`: Uses boto3 async wrapper or httpx for HTTPS PUTs
- `R2Backend`: Identical interface, Cloudflare S3-compatible API

### Deduplication Strategy

**Critical ordering:** Hash computation happens BEFORE database insert attempt.

```
Flow:
1. Receive raw JPEG bytes + metadata
2. Compute content_hash = SHA-256(jpeg_bytes)
3. SELECT FROM archive_frames WHERE content_hash = ?
4. If exists: Return existing frame_id (skip storage write)
5. Else: Write to storage backend → INSERT into archive_frames
```

**Why this ordering:**
- Storage writes are expensive and non-transactional
- Database lookups are atomic, fast, and cheap
- Prevents orphaned files if upload crashes mid-way
- Supports idempotent uploads (retry-safe)

**Hash algorithm:** SHA-256 (64 hex chars) — standard, proven, no collisions in practice.

### Error Handling Strategy

| Error Type | HTTP Status | Behavior |
|-----------|-----------|----------|
| **Validation errors** | 400 Bad Request | Pydantic validation fails (missing fields, type mismatch) |
| **Duplicate frame** | 409 Conflict | Content hash exists; return existing frame_id (idempotent) |
| **Storage unavailable** | 503 Service Unavailable | Backend S3/local storage down; return `Retry-After: 30` header |
| **Database error** | 500 Internal Server Error | Query execution failed (connection pool exhausted, query syntax) |
| **Not found** | 404 Not Found | Frame ID doesn't exist |
| **Unauthorized** | 401 Unauthorized | Missing/invalid JWT token |
| **Forbidden** | 403 Forbidden | User lacks admin role (e.g., for GC endpoint) |

**Key distinction:** 503 signals external dependency failure (recoverable by client); 500 signals our bug.

### Caching Strategy

**Redis metadata cache** (if Redis enabled) for frame list queries:
- Key format: `archive:frames:{match_id}:page:{page_num}`
- TTL: 300 seconds (5 minutes, matches frontend TanStack Query staleTime)
- Cache invalidation: On any frame upload to that match_id, delete all pages for that match
- Fallback: If Redis unavailable, queries hit PostgreSQL directly (no error)

**Client-side caching** (frontend):
- TanStack Query with staleTime=300s
- Automatic refetch on tab focus
- Manual refetch button for immediate updates

### Audit Logging Strategy

**Event-driven approach via SQLAlchemy listeners:**

```python
from sqlalchemy import event

@event.listens_for(ArchiveFrame, 'after_update')
async def audit_frame_update(mapper, connection, target):
    """Auto-log when is_pinned or deleted_at changes."""
    # Log to archive_audit_log
```

**Explicit audit entries for:**
- Frame upload (create)
- Pin/unpin operations
- Garbage collection deletions
- Storage migrations

**Audit log columns:**
- `action` — 'UPLOAD', 'PIN', 'UNPIN', 'GC_DELETE', 'MIGRATE', 'VERIFY'
- `frame_id` — FK to archive_frames (nullable for bulk GC)
- `actor` — e.g., 'service:minimap-extractor', 'admin:user-123'
- `metadata` — JSONB with action-specific details (pin reason, GC retention days, migration backend)
- `created_at` — Immutable timestamp (no soft delete on audit log)

---

## 3. Source Code Structure

### Directory Layout

```
packages/shared/api/src/njz_api/
├── archival/
│   ├── __init__.py                  # Export router: from .routers import router
│   ├── dependencies.py              # Shared FastAPI Depends() factories
│   ├── models/
│   │   ├── __init__.py             # Export: ArchiveFrame, ArchiveManifest, ArchiveAuditLog
│   │   └── archive.py              # SQLAlchemy ORM models (3 classes)
│   ├── schemas/
│   │   ├── __init__.py             # Export all Pydantic models
│   │   └── archive.py              # Pydantic request/response schemas (12+ classes)
│   ├── routers/
│   │   ├── __init__.py             # Export APIRouter
│   │   └── archive.py              # 12 FastAPI endpoints
│   ├── storage/
│   │   ├── __init__.py             # Export StorageBackend, LocalBackend
│   │   ├── backend.py              # Protocol, LocalBackend Phase 1
│   │   ├── s3_backend.py           # S3Backend (Phase 2, stub with pass)
│   │   └── r2_backend.py           # R2Backend (Phase 2, stub with pass)
│   └── services/
│       ├── __init__.py             # Export ArchivalService
│       └── archival_service.py     # Core business logic

services/api/src/njz_api/migrations/
├── 006_archive_schema.py            # Alembic migration (create 3 tables + indices)

tests/
├── unit/
│   ├── test_archive_schemas.py      # Pydantic validation, enums
│   ├── test_archive_models.py       # SQLAlchemy relationships, constraints
│   ├── test_storage_backend.py      # Protocol conformance, LocalBackend
│   └── test_archival_service.py     # Deduplication, GC, validation logic
├── integration/
│   ├── test_archive_upload.py       # Frame upload, deduplication, manifest creation
│   ├── test_archive_query.py        # Frame query by match, pagination
│   ├── test_archive_pin.py          # Pin/unpin lifecycle
│   ├── test_archive_gc.py           # Garbage collection retention policies
│   ├── test_archive_audit.py        # Audit log completeness
│   └── test_archive_e2e.py          # Full workflow: upload → query → pin → gc
```

### Module Organization

**Imports pattern:**

```python
# In main.py (app initialization)
from njz_api.archival import router as archival_router
app.include_router(archival_router, prefix="/v1/archive", tags=["archival"])

# In routers/archive.py
from njz_api.archival.dependencies import get_archival_service, get_db
from njz_api.archival.schemas import FrameUploadRequest, FrameUploadResponse
from njz_api.archival.models import ArchiveFrame

# In services/archival_service.py
from njz_api.archival.storage import StorageBackend, LocalBackend
from njz_api.archival.models import ArchiveFrame, ArchiveManifest

# In storage/backend.py
from typing import Protocol, runtime_checkable
```

**Circular import prevention:**
- `dependencies.py` imports models and services (singleton factory)
- `routers/` depends on dependencies (never import services directly)
- `services/` depends on models and storage (never import routers)
- `storage/` is standalone protocol + implementations

### File Responsibilities

| File | Responsibility |
|------|-----------------|
| `models/archive.py` | 3 SQLAlchemy models + relationships + indices |
| `schemas/archive.py` | 12+ Pydantic models (requests, responses, enums) |
| `services/archival_service.py` | Deduplication, GC, validation; business logic |
| `storage/backend.py` | StorageBackend protocol + LocalBackend (file I/O) |
| `storage/s3_backend.py` | S3Backend stub (Phase 2) |
| `routers/archive.py` | 12 FastAPI endpoints; request/response binding |
| `dependencies.py` | FastAPI dependency factories (get_db, get_storage_backend, get_archival_service) |

---

## 4. Data Model Integration

### Table: archive_frames

Core table for storing frame metadata and storage pointers.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK, default=uuid4 | Unique frame identifier |
| `content_hash` | VARCHAR(64) | NOT NULL, UNIQUE | SHA-256 hash for deduplication |
| `match_id` | UUID | NOT NULL, FK→matches(id) ON DELETE CASCADE | Link to match |
| `extraction_job_id` | UUID | NOT NULL | Link to extraction job batch |
| `frame_index` | INT | NOT NULL | 0-based frame number in stream |
| `stream_type` | VARCHAR(10) | NOT NULL, CHECK (IN ['A', 'B']) | A=minimap crop, B=analysis |
| `segment_type` | VARCHAR(20) | NOT NULL, CHECK (IN [...]) | IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN |
| `timestamp_ms` | BIGINT | NOT NULL | Milliseconds in VOD |
| `storage_backend` | VARCHAR(20) | NOT NULL, CHECK (IN ['local','s3','r2']) | Where frame is stored |
| `storage_path` | VARCHAR(255) | NOT NULL | Relative path or S3 key |
| `storage_url` | TEXT | NOT NULL | Signed URL (S3) or file:// path |
| `file_size_bytes` | BIGINT | NOT NULL | Frame JPEG size |
| `mime_type` | VARCHAR(20) | NOT NULL, DEFAULT='image/jpeg' | Content type |
| `is_pinned` | BOOLEAN | NOT NULL, DEFAULT=FALSE | Prevent GC deletion |
| `pin_reason` | VARCHAR(255) | NULLABLE | Why frame is pinned |
| `pin_expires_at` | TIMESTAMP | NULLABLE | Pin TTL (NULL = indefinite) |
| `tenet_verification_id` | UUID | NULLABLE | Link to TeneT verification result |
| `accuracy_tier` | VARCHAR(20) | CHECK (IN ['STANDARD', 'MEDIUM', 'HIGH']) | Extraction quality tier |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Last update |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete (audit trail) |

**Indices (for performance):**
- `idx_archive_frames_match_id` ON `match_id` — Match-based queries
- `idx_archive_frames_content_hash` ON `content_hash` — Deduplication lookup
- `idx_archive_frames_timestamp` ON `timestamp_ms` — Timeline filtering
- `idx_archive_frames_pinned` ON `is_pinned` WHERE `NOT is_pinned` — GC filtering (only unpinned)
- `idx_archive_frames_created` ON `created_at DESC` — Recent frames

**Compound index (Phase 2+):**
- `idx_archive_frames_match_timestamp` ON `(match_id, timestamp_ms)` — Optimize `GET /v1/archive/matches/{id}/frames?...` queries

### Table: archive_manifests

Aggregate metadata for extraction job batches (one manifest per batch).

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK, default=uuid4 | Unique manifest identifier |
| `extraction_job_id` | UUID | NOT NULL, UNIQUE | Link to extraction job (1:1) |
| `match_id` | UUID | NOT NULL, FK→matches(id) ON DELETE CASCADE | Link to match |
| `frame_count` | INT | NOT NULL | Total frames in batch |
| `frame_ids` | TEXT[] | NOT NULL | PostgreSQL array of frame UUIDs |
| `manifest_version` | VARCHAR(10) | NOT NULL, DEFAULT='1.0' | Schema version for evolution |
| `content_hash` | VARCHAR(64) | NULLABLE | Hash of manifest JSON (Phase 2) |
| `storage_path` | VARCHAR(255) | NULLABLE | Where manifest.json stored (Phase 2) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Last update |

**Indices:**
- `idx_archive_manifests_match_id` ON `match_id` — Match manifest lookup
- `idx_archive_manifests_extraction_job_id` ON `extraction_job_id` — Extraction job lookup (unique)

### Table: archive_audit_log

Immutable audit trail for all archival operations.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | BIGSERIAL | PK | Audit log sequence number |
| `action` | VARCHAR(50) | NOT NULL, CHECK (IN [...]) | UPLOAD, PIN, UNPIN, GC_DELETE, MIGRATE, VERIFY |
| `frame_id` | UUID | NULLABLE, FK→archive_frames(id) ON DELETE SET NULL | Affected frame (nullable for bulk ops) |
| `manifest_id` | UUID | NULLABLE, FK→archive_manifests(id) ON DELETE SET NULL | Affected manifest |
| `actor` | VARCHAR(100) | NOT NULL | Who performed action (e.g., 'service:minimap-extractor') |
| `metadata` | JSONB | NULLABLE | Action-specific detail: {pin_reason, gc_retention_days, migration_backend, ...} |
| `reason` | VARCHAR(255) | NULLABLE | Admin-provided reason for action |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Immutable creation time |
| `ip_address` | INET | NULLABLE | Source IP (if HTTP request) |

**Indices:**
- `idx_archive_audit_log_action` ON `action` — Filter by action type
- `idx_archive_audit_log_frame_id` ON `frame_id` — Frame history lookup
- `idx_archive_audit_log_timestamp` ON `timestamp DESC` — Recent audit entries

**No soft delete on audit log** — it is immutable.

### SQLAlchemy Models

```python
# models/archive.py
from sqlalchemy import ForeignKey, Index, String, Integer, LargeBinary, TIMESTAMP, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from datetime import datetime
from uuid import UUID as PyUUID, uuid4

class ArchiveFrame(Base):
    __tablename__ = "archive_frames"
    
    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    content_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    match_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )
    extraction_job_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    frame_index: Mapped[int] = mapped_column(Integer, nullable=False)
    stream_type: Mapped[str] = mapped_column(String(10), nullable=False)  # 'A' or 'B'
    segment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    timestamp_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_backend: Mapped[str] = mapped_column(String(20), nullable=False)  # local, s3, r2
    storage_path: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(20), nullable=False, default="image/jpeg")
    is_pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pin_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pin_expires_at: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    tenet_verification_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    accuracy_tier: Mapped[str | None] = mapped_column(String(20), nullable=True, default="STANDARD")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    
    match: Mapped["Match"] = relationship("Match", back_populates="archive_frames")
    audit_logs: Mapped[list["ArchiveAuditLog"]] = relationship(
        "ArchiveAuditLog", back_populates="frame", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("idx_archive_frames_match_id", "match_id"),
        Index("idx_archive_frames_content_hash", "content_hash"),
        Index("idx_archive_frames_timestamp", "timestamp_ms"),
        Index("idx_archive_frames_pinned", "is_pinned", postgresql_where=~is_pinned),
        Index("idx_archive_frames_created", "created_at", mysql_length={"created_at": None}, postgresql_using="btree"),
    )

class ArchiveManifest(Base):
    __tablename__ = "archive_manifests"
    
    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    extraction_job_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True)
    match_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )
    frame_count: Mapped[int] = mapped_column(Integer, nullable=False)
    frame_ids: Mapped[list[PyUUID]] = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=False)
    manifest_version: Mapped[str] = mapped_column(String(10), nullable=False, default="1.0")
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    storage_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    match: Mapped["Match"] = relationship("Match", back_populates="archive_manifests")
    audit_logs: Mapped[list["ArchiveAuditLog"]] = relationship(
        "ArchiveAuditLog", back_populates="manifest", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("idx_archive_manifests_match_id", "match_id"),
        Index("idx_archive_manifests_extraction_job_id", "extraction_job_id"),
    )

class ArchiveAuditLog(Base):
    __tablename__ = "archive_audit_log"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    frame_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("archive_frames.id", ondelete="SET NULL"), nullable=True
    )
    manifest_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("archive_manifests.id", ondelete="SET NULL"), nullable=True
    )
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)  # IPv4 or IPv6
    
    frame: Mapped["ArchiveFrame | None"] = relationship("ArchiveFrame", back_populates="audit_logs")
    manifest: Mapped["ArchiveManifest | None"] = relationship("ArchiveManifest", back_populates="audit_logs")
    
    __table_args__ = (
        Index("idx_archive_audit_log_action", "action"),
        Index("idx_archive_audit_log_frame_id", "frame_id"),
        Index("idx_archive_audit_log_timestamp", "timestamp", mysql_length={"timestamp": None}, postgresql_using="btree"),
    )
```

---

## 5. API Endpoint Design

All 12 endpoints fully specified with request/response schemas, error cases, and auth requirements.

### Endpoint: POST /v1/archive/frames

**Purpose:** Batch upload frame batch with SHA-256 deduplication  
**Auth:** Service principal (`service:minimap-extractor`) or admin  
**Rate Limit:** 100 requests/min per service principal

**Request Schema:**
```python
class FrameMetadata(BaseModel):
    match_id: UUID
    extraction_job_id: UUID
    frame_index: int
    stream_type: Literal["A", "B"]
    segment_type: Literal["IN_ROUND", "BETWEEN_ROUND", "HALFTIME", "BUY_PHASE", "UNKNOWN"]
    timestamp_ms: int
    accuracy_tier: Optional[str] = "STANDARD"
    tenet_verification_id: Optional[UUID] = None

class FrameUploadRequest(BaseModel):
    frames: List[dict]  # [{ "content_hash": "sha256hex", "jpeg_bytes": b64string, "metadata": FrameMetadata }, ...]
    manifest_data: Optional[dict] = None

class FrameUploadResponse(BaseModel):
    frame_ids: List[UUID]  # newly created or deduplicated frame IDs
    manifest_id: UUID
    duplicates_skipped: int  # count of frames that already existed
    storage_backend: str
```

**Response (200 OK):**
- `frame_ids` — List of frame UUIDs (existing or newly created)
- `manifest_id` — Manifest UUID for this batch
- `duplicates_skipped` — Count of frames deduplicated (0 to len(frames))
- `storage_backend` — Where frames were stored ("local" for Phase 1)

**Error Cases:**
- **400 Bad Request:** Invalid metadata (missing fields, type mismatch, frame_index < 0)
- **409 Conflict:** Duplicate extraction_job_id for same match (batch already uploaded)
- **503 Service Unavailable:** Storage backend unavailable; return `Retry-After: 30` header
- **500 Internal Server Error:** Database error (query execution failure)

**Performance Target:** < 2s P99 for 1000 frames (~100-200 KB total)

---

### Endpoint: GET /v1/archive/matches/{match_id}/frames

**Purpose:** Query archived frames for a match with pagination and filtering  
**Auth:** Public (read-only)  
**Cache:** Redis (TTL=300s) if enabled

**Query Parameters:**
- `page` (int, default=1) — Page number (1-indexed)
- `page_size` (int, default=100, max=1000) — Frames per page
- `segment_type` (string, optional) — Filter by segment (IN_ROUND, etc.)
- `stream_type` (string, optional) — Filter by type (A or B)
- `pinned_only` (bool, default=false) — Only return pinned frames

**Response Schema:**
```python
class ArchiveFrameResponse(BaseModel):
    id: UUID
    content_hash: str
    frame_index: int
    stream_type: str
    segment_type: str
    timestamp_ms: int
    storage_url: str
    file_size_bytes: int
    is_pinned: bool
    pin_reason: Optional[str]
    created_at: datetime

class FrameQueryResponse(BaseModel):
    frames: List[ArchiveFrameResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
```

**Response (200 OK):**
- `frames` — List of frame metadata (no JPEG bytes)
- `total_count` — Total matching frames across all pages
- `page`, `page_size` — Pagination metadata
- `has_next` — Whether another page exists

**Error Cases:**
- **400 Bad Request:** Invalid page_size (>1000) or invalid segment_type enum
- **404 Not Found:** Match doesn't exist
- **500 Internal Server Error:** Database query failure

**Performance Target:** < 500ms P99 for 10K frames with index usage

---

### Endpoint: GET /v1/archive/frames/{frame_id}

**Purpose:** Retrieve single frame metadata  
**Auth:** Public

**Response Schema:**
```python
class ArchiveFrameDetailResponse(BaseModel):
    id: UUID
    content_hash: str
    match_id: UUID
    extraction_job_id: UUID
    frame_index: int
    stream_type: str
    segment_type: str
    timestamp_ms: int
    storage_backend: str
    storage_url: str
    file_size_bytes: int
    is_pinned: bool
    pin_reason: Optional[str]
    pin_expires_at: Optional[datetime]
    tenet_verification_id: Optional[UUID]
    accuracy_tier: str
    created_at: datetime
```

**Error Cases:**
- **404 Not Found:** Frame doesn't exist or was deleted (soft)

---

### Endpoint: POST /v1/archive/frames/{frame_id}/pin

**Purpose:** Pin frame to prevent garbage collection  
**Auth:** Service principal (TeneT) or admin

**Request Schema:**
```python
class FramePinRequest(BaseModel):
    reason: str  # required: why this frame is important
    ttl_days: Optional[int] = None  # optional: pin TTL (None = indefinite)
```

**Response Schema:**
```python
class FramePinResponse(BaseModel):
    frame_id: UUID
    is_pinned: bool
    pin_reason: str
    pin_expires_at: Optional[datetime]
    pinned_at: datetime
```

**Error Cases:**
- **400 Bad Request:** Missing reason, ttl_days < 0
- **404 Not Found:** Frame doesn't exist
- **409 Conflict:** Frame already pinned (return current pin metadata, not error)

---

### Endpoint: POST /v1/archive/frames/{frame_id}/unpin

**Purpose:** Remove pin from frame, allowing garbage collection  
**Auth:** Service principal or admin

**Request Schema:**
```python
class FrameUnpinRequest(BaseModel):
    reason: Optional[str] = None  # why unpin (for audit)
```

**Response Schema:**
```python
class FrameUnpinResponse(BaseModel):
    frame_id: UUID
    is_pinned: bool
    unpinned_at: datetime
```

**Error Cases:**
- **404 Not Found:** Frame doesn't exist
- **409 Conflict:** Frame not pinned (return 409, not 404)

---

### Endpoint: POST /v1/archive/gc

**Purpose:** Run garbage collection to delete old unpinned frames  
**Auth:** Admin only

**Request Schema:**
```python
class GarbageCollectionRequest(BaseModel):
    retention_days: int = 90  # frames older than this + unpinned = deleted
    dry_run: bool = False  # if True, simulate deletion without actual delete
```

**Response Schema:**
```python
class GarbageCollectionResponse(BaseModel):
    deleted_count: int
    freed_bytes: int
    duration_ms: float
    dry_run: bool  # true if this was a simulation
    log_entries: List[str]  # audit trail messages
```

**Error Cases:**
- **400 Bad Request:** retention_days < 0
- **503 Service Unavailable:** Storage backend unavailable

---

### Endpoint: POST /v1/archive/storage/migrate

**Purpose:** Migrate frames between storage backends (Phase 2+)  
**Auth:** Admin only

**Request Schema:**
```python
class StorageMigrationRequest(BaseModel):
    from_backend: str  # 'local', 's3', 'r2'
    to_backend: str
    dry_run: bool = False
    batch_size: int = 100  # how many frames per batch
```

**Response Schema:**
```python
class StorageMigrationResponse(BaseModel):
    migrated_count: int
    failed_count: int
    duration_ms: float
    dry_run: bool
    error_details: List[dict]  # [{ frame_id, error_message }, ...]
```

**Error Cases:**
- **400 Bad Request:** Invalid backend names
- **503 Service Unavailable:** Source or destination backend unavailable
- **501 Not Implemented:** S3/R2 backends not available in Phase 1

---

### Endpoint: GET /health/storage

**Purpose:** Health check for storage backends  
**Auth:** Public

**Response Schema:**
```python
class StorageHealthResponse(BaseModel):
    backend: str
    status: str  # 'ok', 'degraded', 'failed'
    quota_bytes: Optional[int]  # total available space
    used_bytes: int
    available_bytes: int
    error_message: Optional[str]  # if status != 'ok'
```

**Response (200 OK / 503):**
- `status='ok'` → returns 200
- `status='failed'` → returns 503

---

### Endpoint: POST /v1/archive/storage/verify

**Purpose:** Verify frame integrity by checksum  
**Auth:** Admin only

**Request Schema:**
```python
class StorageVerifyRequest(BaseModel):
    frame_ids: Optional[List[UUID]] = None  # None = verify all frames
```

**Response Schema:**
```python
class StorageVerifyResponse(BaseModel):
    verified_count: int
    checksum_failures: int
    failed_frames: List[dict]  # [{ frame_id, expected_hash, actual_hash }, ...]
    duration_ms: float
```

**Error Cases:**
- **400 Bad Request:** Invalid frame IDs
- **503 Service Unavailable:** Storage backend unavailable

---

### Endpoint: GET /v1/archive/audit

**Purpose:** Query audit log for compliance and forensics  
**Auth:** Admin only

**Query Parameters:**
- `action` (string, optional) — Filter by action (UPLOAD, PIN, GC_DELETE, etc.)
- `since` (ISO 8601 date, optional) — Audit entries >= this timestamp
- `limit` (int, default=100, max=1000) — Entries per page
- `offset` (int, default=0) — Pagination offset

**Response Schema:**
```python
class AuditEntry(BaseModel):
    id: int
    action: str
    frame_id: Optional[UUID]
    actor: str
    metadata: Optional[dict]
    timestamp: datetime

class AuditLogResponse(BaseModel):
    logs: List[AuditEntry]
    total_count: int
    limit: int
    offset: int
```

**Error Cases:**
- **400 Bad Request:** Invalid action enum or timestamp format

---

### Endpoint: GET /metrics/archive

**Purpose:** Prometheus metrics export  
**Auth:** Prometheus scraper (IP whitelist or bearer token)

**Metrics Exported:**
```
archive_frame_count{status="active"} 12500
archive_frame_count{status="deleted"} 500
archive_storage_bytes{backend="local"} 5000000000
archive_gc_duration_seconds 120.5
archive_upload_latency_p99_ms 1850
archive_query_latency_p99_ms 450
archive_deduplication_ratio 0.15
archive_audit_log_entries 50000
```

---

## 6. Delivery Phases

### Phase 1 MVP (Phase 9 execution — this session)

**Scope:**
- PostgreSQL migration 006 (3 tables: archive_frames, archive_manifests, archive_audit_log)
- Pydantic schemas (all enums, request/response models)
- FastAPI router (12 endpoints as specified above)
- LocalBackend storage (filesystem sharding)
- Deduplication via SHA-256 hashing
- Frame pinning mechanism
- Basic garbage collection (unpinned frames older than N days)
- Audit logging (SQLAlchemy event listeners + explicit entries)
- Health check for local storage
- Prometheus metrics export
- Unit tests (schemas, models, storage backend, business logic)
- Integration tests (upload → query → pin → gc workflows)

**Out of Scope (Phase 2+):**
- S3/R2 cloud backends (will stub with `NotImplementedError`)
- Storage migration tooling (POST /v1/archive/storage/migrate)
- Cross-region backup
- Glacier cold archival
- Frame versioning or compression beyond JPEG
- Blockchain audit trail

### Phase 2 (Phase 10, dependent on Phase 1 completion)

**Scope:**
- S3Backend implementation (httpx async wrapper for boto3)
- R2Backend implementation (Cloudflare S3-compatible)
- Storage migration API and tooling
- Advanced Prometheus metrics (migration progress, backend latency)
- Redis caching for frame list queries (optional)

**Why defer:**
- MVP requires local storage only (no external credentials)
- S3/R2 dependencies increase complexity and testing surface
- Cloud backend integration can happen after core system proves stable

### Phase 3 (Phase 11+)

**Scope:**
- Cross-region replication (S3 copy to secondary region)
- Glacier cold storage archival (move frames >1 year old to Deep Archive)
- Performance optimizations (connection pooling, batch queries)
- Cost reporting and optimization

---

## 7. Verification Approach

### Unit Tests

**Location:** `tests/unit/test_archive_*.py`

**Coverage:**

1. **test_archive_schemas.py**
   - Pydantic enum validation (StreamType, SegmentType, StorageBackend)
   - Request schema validation (required fields, type coercion, max length)
   - Response schema generation
   - Invalid input rejection (400 Bad Request)

2. **test_archive_models.py**
   - SQLAlchemy model relationships (ArchiveFrame → Match, ArchiveManifest → Match)
   - Cascade behavior (delete match → delete frames)
   - Index creation and constraints
   - Soft delete via `deleted_at`

3. **test_storage_backend.py**
   - StorageBackend Protocol conformance
   - LocalBackend file I/O (put, get, delete, exists)
   - Shard directory creation (2-char prefix)
   - Storage URL format (file:// paths)
   - Error handling (file not found, permission denied)

4. **test_archival_service.py**
   - SHA-256 deduplication logic
   - Content hash computation
   - Idempotent uploads (same bytes uploaded twice)
   - Garbage collection retention policy
   - Audit log entry generation

**Command:**
```bash
pytest tests/unit/test_archive_*.py -v --cov=packages/shared/api/src/njz_api/archival/ --cov-report=term-missing
```

**Success Criteria:**
- All tests pass
- Coverage >= 80% for archival module
- No type errors (mypy)
- No linting errors (ruff)

### Integration Tests

**Location:** `tests/integration/test_archive_*.py`

**Coverage:**

1. **test_archive_upload.py**
   - `POST /v1/archive/frames` request/response
   - Deduplication (upload same frame twice, check duplicates_skipped)
   - Manifest creation with correct frame_ids
   - Database transactionality (all or nothing)

2. **test_archive_query.py**
   - `GET /v1/archive/matches/{match_id}/frames` pagination
   - Filter by segment_type and stream_type
   - Sorting by timestamp
   - Correct response schema

3. **test_archive_pin.py**
   - `POST /v1/archive/frames/{id}/pin` with reason and TTL
   - Pin expiration (datetime logic)
   - `POST /v1/archive/frames/{id}/unpin`
   - Audit log entries for pin/unpin

4. **test_archive_gc.py**
   - `POST /v1/archive/gc` with retention_days
   - Pinned frames NOT deleted
   - Unpinned frames older than retention_days ARE deleted
   - Storage backend files deleted (no orphans)
   - Audit log entries for deletions
   - Dry-run mode (no actual deletions)

5. **test_archive_audit.py**
   - `GET /v1/archive/audit` returns all mutations
   - Filtering by action type
   - Filtering by timestamp
   - Correct response schema

6. **test_archive_e2e.py**
   - Full workflow: upload → query → pin → gc
   - Frame lifecycle validation
   - Database and storage consistency

**Command:**
```bash
pytest tests/integration/test_archive_*.py -v --postgres --redis --enable-network-calls
```

**Success Criteria:**
- All integration tests pass
- E2E workflow verified (frame lifecycle complete)
- Performance targets met:
  - Upload: < 2s P99 for 1000 frames
  - Query: < 500ms P99 for 10K frames
  - GC: < 1 hour for 10K frames

### Lint & Type Checking

**Commands:**
```bash
ruff check packages/shared/api/src/njz_api/archival/ --fix
mypy packages/shared/api/src/njz_api/archival/ --strict --no-implicit-optional
black packages/shared/api/src/njz_api/archival/ --check
```

**Success Criteria:**
- Zero ruff violations
- Zero mypy type errors
- All imports resolved
- Code formatted to project standards

### API Documentation

**Verification:**
```bash
# Start API server
cd packages/shared/api
uvicorn main:app --reload --port 8000

# Check auto-generated docs in browser
curl http://localhost:8000/v1/docs
```

**Success Criteria:**
- All 12 endpoints appear in Swagger UI
- Request/response schemas display correctly
- Error codes documented (400, 404, 409, 503)
- No schema validation warnings

### E2E Test Coverage (via Playwright)

**Location:** `tests/e2e/archival.spec.ts` (frontend/API integration)

**Coverage:**
1. Extraction Service uploads frames
2. Frontend queries and displays frame grid
3. TeneT marks frames as verified + pins them
4. GC runs and skips pinned frames
5. Verification dashboard shows audit trail

---

## Acceptance Criteria Mapping

This specification addresses all 18 AC criteria from requirements.md:

| AC | Description | Spec Section |
|----|-----------|----------|
| **AC-01** | Frames uploaded via `POST /v1/archive/frames` persisted and indexed | Section 5 (endpoint), Section 4 (models) |
| **AC-02** | Duplicate frames detected, stored once, metadata linked | Section 2 (deduplication strategy) |
| **AC-03** | Frames queried by match via `GET /v1/archive/matches/{id}/frames` with pagination | Section 5 (endpoint) |
| **AC-04** | Pinned frames excluded from GC | Section 5 (GC endpoint), Section 2 (audit logging) |
| **AC-05** | Unpinned frames older than retention_days deleted by GC | Section 5 (GC endpoint) |
| **AC-06** | All mutations logged to audit trail with actor/timestamp | Section 2 (audit logging), Section 4 (audit table) |
| **AC-07** | Storage health check detects failures, returns status | Section 5 (health check endpoint) |
| **AC-08** | Batch upload <2s P99 for 1000 frames | Section 2 (async I/O), Section 7 (performance targets) |
| **AC-09** | Query <500ms P99 for 10K frames | Section 4 (indices), Section 7 (performance targets) |
| **AC-10** | GC processes 10K frames in <1 hour | Section 5 (GC endpoint), Section 7 (performance targets) |
| **AC-11** | Minimap Extraction Service integration | Section 5 (upload endpoint), Section 8 (dependencies) |
| **AC-12** | TeneT Key.Links integration (query, pin) | Section 5 (query, pin endpoints) |
| **AC-13** | Frontend frame grid display | Section 5 (query endpoint response format) |
| **AC-14** | Storage backend abstraction (local/S3/R2) | Section 2 (storage abstraction pattern), Section 3 (backend files) |
| **AC-15** | Code style compliance (black, ruff, mypy) | Section 7 (lint/type checking) |
| **AC-16** | Integration tests for major workflows | Section 7 (integration tests) |
| **AC-17** | E2E test Extraction → Archival → TeneT | Section 7 (E2E test coverage) |
| **AC-18** | Prometheus metrics exported | Section 5 (metrics endpoint), Section 7 (verification) |

---

## Framework Integration Checklist

### 2 Auth Classes
- ✅ **AGENT (you):** Create spec, implement code, run tests, mark TODOs
- ✅ **CODEOWNER:** Approve spec/plan before Implementation starts

### 3 Tiers
- ✅ **MASTER:** Data contracts from requirements.md (3 tables, 12 endpoints)
- ✅ **PHASE:** Gate-linked spec (Gates 9.1–9.8 referenced in plan.md)
- ✅ **WORK SESSION:** This spec document (ephemeral, expires 2026-03-30)

### 5 Pillars
- ✅ **Road-Maps:** Every task in plan.md will reference [Gate N.M]
- ✅ **Logic Trees:** Task dependencies clearly documented in plan.md
- ✅ **ACP:** Coordination with other agents (Minimap Extraction, TeneT) via API contracts
- ✅ **MCP:** MASTER contracts (data model, API boundaries) fully specified here
- ✅ **Notebook/TODO:** This workplan is the TODO; implementation tasks in plan.md

### +3 Bonus Features (deferred to plan.md cross-review)
- ℹ️ **.doc-registry.json:** Archive query routing (can implement if needed)
- ℹ️ **DOSSIER_CREATION_TEMPLATE.md:** Session findings archive (Phase 9 closure)
- ℹ️ **FILTER_RULES.md:** Tag-based filtering for archived work (optional)

---

## Assumptions & Notes for Cross-Review

1. **Assumption (A1):** S3/R2 retry logic will use httpx defaults with exponential backoff (Phase 2). Specification assumes successful storage writes complete within timeout windows.

2. **Assumption (A2):** Redis caching is optional (defaults to disabled). If enabled, cache invalidation on upload is synchronous (atomic transaction). If Redis unavailable, queries fall back to PostgreSQL.

3. **Assumption (A3):** Frame deduplication uses full SHA-256 hash (64 hex chars) to avoid collisions. No perceptual hashing or CBIR required for MVP.

4. **Assumption (A4):** Garbage collection is manual via `POST /v1/archive/gc` endpoint in Phase 1. Phase 2 may add cron-based automatic GC.

5. **Assumption (A5):** Soft delete via `deleted_at` column preserves audit trail and supports undelete in future (not Phase 1 feature).

6. **Question (Q1):** Should `pin_expires_at` be enforced by a background job to auto-unpin expired frames? Or should frontend check expiry on read? Recommend Phase 2 background job; Phase 1 assumes manual check.

---

*This specification is complete and ready for cross-review (Pass 1: Specification Audit).*
