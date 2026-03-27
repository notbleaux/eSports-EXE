[Ver001.000]

# Product Requirements Document — Minimap Archival System

**Project:** NJZ eSports Platform  
**Feature:** Minimap Archival System  
**Prerequisite for:** Minimap Extraction Service (video analysis features)  
**Status:** Requirements Phase  
**Created:** 2026-03-27  
**Last Updated:** 2026-03-27

---

## Executive Summary

The **Minimap Archival System** is a content-addressed storage and lifecycle management platform for esports video frame sequences extracted by the Minimap Extraction Service. It provides unified storage abstraction (local/S3/R2), intelligent deduplication, retention policies, and audit trails. This system is a critical prerequisite enabling the Minimap Extraction Service to reliably process, store, and manage extracted frame artifacts at scale.

---

## 1. Feature Overview

### 1.1 Purpose

Provide a robust, auditable, scalable storage and lifecycle management layer for minimap frame sequences and associated metadata extracted from esports VODs. Enable the Minimap Extraction Service to:
- Store extracted minimap crops and manifests durably
- Deduplicate content via content-addressable storage (CAS)
- Enforce retention and cleanup policies
- Track frame lineage and verification state
- Support multi-region/multi-cloud deployments

### 1.2 Scope

**In Scope:**
- Content-addressable frame storage (JPEG crops, manifests, metadata)
- Multi-backend abstraction (local filesystem, AWS S3, Cloudflare R2)
- Metadata indexing and lifecycle management (PostgreSQL)
- Retention and garbage collection policies
- Frame pinning (prevent deletion for important matches)
- Audit logging and versioning
- Health checks and storage metrics

**Out of Scope:**
- Video transcoding or re-encoding
- Real-time streaming of frame sequences (handled by Minimap Extraction Service)
- Computer vision analysis (belongs to Minimap Extraction Service)
- TeneT verification logic (belongs to TeneT Key.Links service)
- Compression beyond JPEG (may be future optimization)

---

## 2. User Stories & Use Cases

### 2.1 Use Case: Extract and Archive Minimap Frames

**Actor:** Minimap Extraction Service  
**Flow:**
1. Extraction service processes Valorant VOD
2. Extracts minimap crops at 1 fps (frames A and B)
3. Calls Archival API: `POST /v1/archive/frames` with frame batch
4. Archival system computes content hash, checks for duplicates
5. Stores JPEG crops to backend storage (S3/local)
6. Writes frame metadata to PostgreSQL
7. Returns manifest with archive IDs and storage locations
8. Extraction service links manifest to extraction job

**Outcome:** Frame data persisted durably, deduplicated, indexed for query.

### 2.2 Use Case: Query Archived Frames by Match

**Actor:** Frontend/Dashboard, TeneT Key.Links Service  
**Flow:**
1. Query API: `GET /v1/archive/matches/{match_id}/frames`
2. Returns paginated list of frame metadata, sorted by timestamp
3. Includes storage URLs, content hashes, stream type (A/B), and verification status
4. Supports filtering by segment type, tier, or confidence

**Outcome:** Easy retrieval and visualization of archived frames for a match.

### 2.3 Use Case: Pin Frames to Prevent Deletion

**Actor:** TeneT Key.Links Service  
**Flow:**
1. After verification completes, TeneT marks high-confidence frames as "pinned"
2. Calls API: `POST /v1/archive/frames/{frame_id}/pin` with reason and ttl
3. Archival system updates frame metadata, skips in garbage collection
4. Audit log records who/when/why frame was pinned

**Outcome:** Frames retained indefinitely (or until TTL) for historical queries and re-analysis.

### 2.4 Use Case: Cleanup Old Frames

**Actor:** Garbage Collection Job (cron)  
**Flow:**
1. Job runs daily: `POST /v1/archive/gc` with retention_days param
2. Queries unpinned frames older than retention_days
3. Deletes frame JPEG/manifest from backend storage
4. Removes metadata from PostgreSQL
5. Returns deletion summary and metrics
6. Logs to audit trail

**Outcome:** Storage cost controlled, old data automatically cleaned.

### 2.5 Use Case: Migrate Frames Between Storage Backends

**Actor:** Operations/Admin  
**Flow:**
1. Initiate migration: `POST /v1/archive/storage/migrate?from=s3&to=r2`
2. Job streams frames from source backend to destination
3. Verifies content hash matches original
4. Updates metadata pointer to new location
5. Deletes from source (after verification)
6. Returns migration status and metrics

**Outcome:** Seamless cloud provider changes without data loss.

---

## 3. Core Requirements

### 3.1 Functional Requirements (FR)

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| **FR-01** | Content-addressed storage with SHA-256 hashing | Critical | Prevent duplicate frame storage; enable deduplication |
| **FR-02** | Multi-backend abstraction (local, S3, R2) | Critical | Support dev (local) and prod (cloud) deployments |
| **FR-03** | Frame metadata persistence (PostgreSQL) | Critical | Index frames by match, segment, timestamp, verification state |
| **FR-04** | Batch frame upload endpoint | High | `POST /v1/archive/frames` accepts up to 1000 frames in single request |
| **FR-05** | Frame query by match ID | High | `GET /v1/archive/matches/{match_id}/frames` with pagination |
| **FR-06** | Frame pinning mechanism | High | `POST /v1/archive/frames/{id}/pin` prevents GC deletion |
| **FR-07** | Retention policy enforcement | High | Configurable TTL per frame or batch; default 90 days for unpinned |
| **FR-08** | Garbage collection API | High | `POST /v1/archive/gc` with configurable retention days |
| **FR-09** | Storage health checks | Medium | `GET /health/storage` verifies backend connectivity and quotas |
| **FR-10** | Audit logging for all mutations | Medium | Track frame creation, pinning, deletion with actor/timestamp/reason |
| **FR-11** | Storage migration tooling | Medium | Migrate frames between backends without downtime |
| **FR-12** | Manifest versioning | Medium | Support schema evolution; track manifest format version |

### 3.2 Non-Functional Requirements (NFR)

| ID | Requirement | Priority | Target | Notes |
|---|---|---|---|---|
| **NFR-01** | Throughput (frame ingest) | High | 1000 frames/min on 2 vCPU | Batch writes to reduce overhead |
| **NFR-02** | Latency (upload response) | High | <2s for batch upload (P99) | Includes S3 PUT; async manifest write OK |
| **NFR-03** | Storage efficiency | High | <50 MB per match (1 fps, 30-min match) | JPEG compression tuned; deduplication helps |
| **NFR-04** | Availability | High | 99.5% uptime | Graceful S3 failures; fallback to local temp |
| **NFR-05** | Durability | Critical | 11-9s (99.999999999%) | Use S3 versioning + cross-region backup (future) |
| **NFR-06** | Query latency (metadata) | Medium | <500ms for 10K frames (P99) | Index on match_id, timestamp; pagination limit 100 |
| **NFR-07** | GC throughput | Medium | 10K frames/hour | Async, non-blocking; can be slow |
| **NFR-08** | Cost | Medium | <$100/month storage (initial) | Optimize compression; archive cold frames to Glacier (future) |

---

## 4. Data Model

### 4.1 PostgreSQL Schema (Migration 006)

```sql
-- Archive frames table
CREATE TABLE archive_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  extraction_job_id UUID NOT NULL,
  frame_index INT NOT NULL,  -- 0-based frame number in stream
  stream_type VARCHAR(10) NOT NULL CHECK (stream_type IN ('A', 'B')),  -- A=crop, B=analysis
  segment_type VARCHAR(20) NOT NULL CHECK (segment_type IN (
    'IN_ROUND', 'BETWEEN_ROUND', 'HALFTIME', 'BUY_PHASE', 'UNKNOWN'
  )),
  timestamp_ms BIGINT NOT NULL,  -- milliseconds in VOD
  storage_backend VARCHAR(20) NOT NULL CHECK (storage_backend IN ('local', 's3', 'r2')),
  storage_path VARCHAR(255) NOT NULL,  -- relative path or S3 key
  storage_url TEXT NOT NULL,  -- signed URL (S3) or file:// path
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(20) NOT NULL DEFAULT 'image/jpeg',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  pin_reason VARCHAR(255),
  pin_expires_at TIMESTAMP,
  tenet_verification_id UUID,  -- link to TeneT result
  accuracy_tier VARCHAR(20) CHECK (accuracy_tier IN ('STANDARD', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP  -- soft delete for audit trail
);

CREATE INDEX idx_archive_frames_match_id ON archive_frames(match_id);
CREATE INDEX idx_archive_frames_content_hash ON archive_frames(content_hash);
CREATE INDEX idx_archive_frames_timestamp ON archive_frames(timestamp_ms);
CREATE INDEX idx_archive_frames_pinned ON archive_frames(is_pinned) WHERE NOT is_pinned;
CREATE INDEX idx_archive_frames_created ON archive_frames(created_at DESC);

-- Archive manifests (one per extraction batch)
CREATE TABLE archive_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_job_id UUID NOT NULL UNIQUE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  frame_count INT NOT NULL,
  frame_ids TEXT[] NOT NULL,  -- array of frame UUIDs
  manifest_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  content_hash VARCHAR(64),  -- hash of manifest JSON
  storage_path VARCHAR(255),  -- where manifest.json is stored
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_archive_manifests_match_id ON archive_manifests(match_id);

-- Audit trail for archival operations
CREATE TABLE archive_audit_log (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,  -- 'create', 'pin', 'unpin', 'delete', 'migrate'
  frame_id UUID REFERENCES archive_frames(id),
  manifest_id UUID REFERENCES archive_manifests(id),
  actor_id UUID REFERENCES users(id),  -- admin/service principal
  old_value JSONB,
  new_value JSONB,
  reason VARCHAR(255),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET
);

CREATE INDEX idx_archive_audit_log_frame_id ON archive_audit_log(frame_id);
CREATE INDEX idx_archive_audit_log_timestamp ON archive_audit_log(timestamp DESC);
```

### 4.2 Pydantic Schemas (Python)

```python
# archival/schemas.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class StreamType(str, Enum):
    A = "A"
    B = "B"

class SegmentType(str, Enum):
    IN_ROUND = "IN_ROUND"
    BETWEEN_ROUND = "BETWEEN_ROUND"
    HALFTIME = "HALFTIME"
    BUY_PHASE = "BUY_PHASE"
    UNKNOWN = "UNKNOWN"

class StorageBackend(str, Enum):
    LOCAL = "local"
    S3 = "s3"
    R2 = "r2"

class FrameMetadata(BaseModel):
    match_id: str
    extraction_job_id: str
    frame_index: int
    stream_type: StreamType
    segment_type: SegmentType
    timestamp_ms: int
    accuracy_tier: Optional[str] = "STANDARD"
    tenet_verification_id: Optional[str] = None

class FrameUploadRequest(BaseModel):
    frames: List[dict]  # list of (content_hash, jpeg_bytes, metadata)
    manifest_data: Optional[dict] = None

class ArchiveFrame(BaseModel):
    id: str
    content_hash: str
    match_id: str
    frame_index: int
    stream_type: StreamType
    segment_type: SegmentType
    timestamp_ms: int
    storage_url: str
    file_size_bytes: int
    is_pinned: bool
    created_at: datetime

class FrameQueryResponse(BaseModel):
    frames: List[ArchiveFrame]
    total_count: int
    page: int
    page_size: int
```

---

## 5. API Endpoints

### 5.1 Frame Management

**POST /v1/archive/frames** — Upload frame batch  
- **Request:** `FrameUploadRequest` with up to 1000 frames
- **Response:** `{ frame_ids: [str], manifest_id: str, duplicates_skipped: int }`
- **Auth:** Service principal or admin

**GET /v1/archive/matches/{match_id}/frames** — Query frames by match  
- **Params:** `?page=1&page_size=100&segment_type=IN_ROUND&stream_type=A`
- **Response:** `FrameQueryResponse`
- **Auth:** Public (read-only)

**GET /v1/archive/frames/{frame_id}** — Get single frame metadata  
- **Response:** `ArchiveFrame`
- **Auth:** Public

**POST /v1/archive/frames/{frame_id}/pin** — Pin frame (prevent GC)  
- **Request:** `{ reason: str, ttl_days: Optional[int] }`
- **Response:** `{ pinned_at: datetime, expires_at: Optional[datetime] }`
- **Auth:** Service principal (TeneT) or admin

**POST /v1/archive/frames/{frame_id}/unpin** — Remove pin  
- **Response:** `{ unpinned_at: datetime }`
- **Auth:** Service principal or admin

### 5.2 Garbage Collection

**POST /v1/archive/gc** — Run garbage collection  
- **Request:** `{ retention_days: int = 90, dry_run: bool = False }`
- **Response:** `{ deleted_count: int, freed_bytes: int, duration_ms: int }`
- **Auth:** Admin only

### 5.3 Storage Operations

**GET /health/storage** — Check storage backend health  
- **Response:** `{ backend: str, status: str, quota_bytes: int, used_bytes: int }`
- **Auth:** Public

**POST /v1/archive/storage/migrate** — Migrate frames between backends  
- **Request:** `{ from_backend: str, to_backend: str, dry_run: bool = False }`
- **Response:** `{ migrated_count: int, failed_count: int, duration_ms: int }`
- **Auth:** Admin only

**POST /v1/archive/storage/verify** — Verify frame integrity (checksum)  
- **Request:** `{ frame_ids: Optional[List[str]] }` (empty = all)
- **Response:** `{ verified_count: int, checksum_failures: int }`
- **Auth:** Admin only

### 5.4 Audit & Metrics

**GET /v1/archive/audit** — Query audit log  
- **Params:** `?action=delete&since=2026-03-20&limit=100`
- **Response:** `{ logs: [AuditEntry], total_count: int }`
- **Auth:** Admin only

**GET /metrics/archive** — Prometheus metrics  
- **Metrics:** `archive_frame_count`, `archive_storage_bytes`, `archive_gc_duration_ms`, `archive_upload_latency_p99`
- **Auth:** Prometheus scraper

---

## 6. Acceptance Criteria

### 6.1 Functional Acceptance

- [ ] **AC-01:** Frames uploaded via `POST /v1/archive/frames` are persisted to backend storage and indexed in PostgreSQL
- [ ] **AC-02:** Duplicate frames (same content hash) are detected; only stored once; metadata linked correctly
- [ ] **AC-03:** Frames can be queried by match via `GET /v1/archive/matches/{match_id}/frames` with correct pagination
- [ ] **AC-04:** Pinned frames are excluded from garbage collection runs
- [ ] **AC-05:** Unpinned frames older than retention_days are deleted by GC job
- [ ] **AC-06:** All mutations (create, pin, delete) are logged to audit trail with actor, timestamp, reason
- [ ] **AC-07:** Storage health check detects backend failures and returns appropriate status

### 6.2 Performance Acceptance

- [ ] **AC-08:** Batch upload of 1000 frames completes in <2 seconds (P99) on 2 vCPU
- [ ] **AC-09:** Query for 10K match frames returns in <500ms (P99) with index usage
- [ ] **AC-10:** GC job processes 10K frames in <1 hour without blocking API

### 6.3 Integration Acceptance

- [ ] **AC-11:** Minimap Extraction Service can upload frames and receive manifest IDs
- [ ] **AC-12:** TeneT Key.Links can query frames and pin high-confidence results
- [ ] **AC-13:** Frontend can query and display archived frame grid for a match
- [ ] **AC-14:** Storage backend abstraction allows seamless switching between local/S3/R2

### 6.4 Quality Acceptance

- [ ] **AC-15:** All code follows project conventions (black, ruff, mypy passing)
- [ ] **AC-16:** Integration tests cover all major workflows (upload, query, pin, gc, migrate)
- [ ] **AC-17:** E2E test verifies Extraction Service → Archival → TeneT flow
- [ ] **AC-18:** Prometheus metrics exported; storage graphs visible in monitoring dashboard

---

## 7. Assumptions & Constraints

### 7.1 Assumptions

1. **Frame Size:** Minimap crops ~100-200 KB as JPEG; full 30-minute match ~50-100 MB storage
2. **Retention Policy:** Default 90 days for unpinned frames; pinned indefinitely until manual unpin or TTL
3. **Deduplication Value:** ~10-20% of frames are duplicates (halftime, replays); CAS saves significant storage
4. **Concurrent Uploads:** Peak load ~100 frames/sec (e.g., 10 parallel extraction jobs, 10 fps each)
5. **Query Patterns:** Frontend queries 1 match at a time; TeneT queries in batches post-analysis
6. **Storage Backend:** S3 preferred for production; R2 as fallback/alternative; local for dev

### 7.2 Constraints

- **Database:** PostgreSQL 15+ (soft delete via `deleted_at` for audit trail)
- **Storage:** AWS S3 or Cloudflare R2 (not GCS; not Azure Blob — can add later)
- **Budget:** <$1000/month for 1 year of frame data at full scale (optimization may be needed)
- **Latency:** S3 PUTs add ~300-500ms; async options explored in Phase 2

---

## 8. Dependencies & Relationships

### 8.1 Dependency on Archival System

**Minimap Extraction Service** depends on Archival System for:
- Durable frame storage with deduplication (Phase 1 MVP)
- Manifest generation and linking (Phase 2)
- S3/R2 backend support (Phase 3)
- Garbage collection integration (Phase 4)

### 8.2 Dependency Chain

```
Minimap Extraction Service
  ↓ (stores frames via)
Minimap Archival System
  ↓ (verified by + linked to)
TeneT Key.Links Service
  ↓ (pins frames + queries metadata)
Frontend Dashboard
```

### 8.3 Related Systems

- **PostgreSQL:** Metadata storage and indexing
- **S3/R2:** Frame JPEG storage
- **Redis:** Optional—frame metadata buffering (future optimization)
- **Prometheus:** Metrics export (storage size, GC performance)
- **Audit Trail:** Integration with global platform audit system

---

## 9. Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Frame ingest throughput** | 1000 frames/min | Supports parallel extraction jobs |
| **P99 upload latency** | <2s | User-facing Minimap Extraction job progress |
| **Deduplication ratio** | >10% | Storage cost savings |
| **Query latency (10K frames)** | <500ms | Dashboard responsiveness |
| **GC duration (10K frames)** | <1 hour | Non-blocking background job |
| **Storage cost** | <$100/month | Reasonable cloud budget |
| **Data durability** | 11-9s | S3 inherent guarantees |
| **Audit log completeness** | 100% of mutations | Compliance and forensics |

---

## 10. Out-of-Scope / Future

- **Compression beyond JPEG:** Investigate AVIF or WebP for frontend display (Phase 2+)
- **Cold storage archival:** Move frames >1 year old to Glacier/Deep Archive (Phase 3+)
- **Frame CDN caching:** Front archived frames with CloudFlare CDN (Phase 4+)
- **Frame versioning:** Track different encodings of same source frame (future)
- **Blockchain audit trail:** Immutable ledger for compliance (post-launch)
- **Cross-region replication:** Automatic backup to secondary region (Phase 2+)

---

## 11. Deliverables

### Phase 1 (MVP)
1. PostgreSQL migration (`006_archival_system.py`)
2. Pydantic schemas (`archival/schemas.py`)
3. FastAPI router with core endpoints (`archival/routers/frames.py`)
4. Storage abstraction layer (`archival/storage/base.py`, `local.py`)
5. Unit tests (`tests/unit/test_archival_*.py`)
6. Integration test (E2E upload → query → delete)

### Phase 2+
1. S3/R2 backend implementation
2. Garbage collection job
3. Storage migration tooling
4. Audit logging
5. Prometheus metrics
6. Frontend integration

---

## 12. Questions for Clarification

**None at this time.** The requirements are derived from the Minimap Extraction Service plan and project conventions. Reasonable assumptions made based on typical frame storage needs.

---

## Sign-Off

**Prepared by:** Zencoder (AI Agent)  
**Date:** 2026-03-27  
**Status:** Ready for Technical Specification  
**Next Step:** Await user confirmation before proceeding to spec.md
