[Ver001.000]

# Archival System Work Plan — Session 2026-03-27 to 2026-03-30

**Tier:** WORK SESSION  
**Valid Until:** 2026-03-30T23:59:59Z  
**Created:** 2026-03-27  
**Step Number:** 2–3 (Technical Specification & Planning)  
**Feature:** Minimap Archival System (prerequisite for Minimap Extraction Service)  
**PRD Location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/requirements.md`

---

## Executive Summary

You are executing **Step 2 (Technical Specification)** and **Step 3 (Planning)** of the SDD workflow for the **Minimap Archival System**.

**What it is:** A content-addressed storage + lifecycle management platform for minimap JPEG frames extracted from Valorant VODs. Supports deduplication, retention policies, frame pinning, audit logging, and multi-backend storage (local, S3, R2).

**Why now:** This system is a prerequisite blocker for Minimap Feature tasks 6–7 (Archival integration). Completing this in Phase 9 unblocks frontend and TeneT integration work.

**Your outputs:**
1. **spec.md** — Technical specification (code structure, API endpoints, data models, integration points)
2. **plan.md** — Detailed implementation plan (8+ tasks with gate references, dependencies, AC links)
3. **Cross-review report** — 2-pass audit (Specification correctness, Planning feasibility)

---

## Requirements Summary (from PRD)

### Scope
- **3 PostgreSQL tables:** archive_frames, archive_manifests, archive_audit_log
- **12 API endpoints:** Upload, query, pin/unpin, GC, storage ops, health, audit, metrics
- **Multi-backend abstraction:** Local, S3, R2
- **Pydantic schemas** with enums (StreamType, SegmentType, StorageBackend)
- **Content-addressable storage:** SHA-256 hashing + deduplication
- **Retention policies:** 90-day default for unpinned frames; pinning prevents GC deletion

### Key Constraints
- **Throughput:** 1000 frames/min target
- **Upload latency:** <2s P99 for batch (1000 frames)
- **Query latency:** <500ms P99 for 10K frame metadata retrieval
- **Durability:** 11-9s (S3 versioning + cross-region backup Phase 2+)

### Success Criteria (18 AC)
- AC-01 through AC-18 in requirements.md define functional, performance, integration, quality acceptance
- Your spec and plan must address all 18 criteria explicitly

---

## Step 2: Technical Specification Deliverable

**File location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/spec.md`

**Sections required:**

1. **Technical Context** (language, deps, framework alignment)
   - Python 3.11+, FastAPI async, SQLAlchemy ORM, Alembic migrations
   - Pydantic v2, httpx (async HTTP), boto3 (S3)
   - Align with AGENTS.md patterns

2. **Implementation Approach** (async design, storage abstraction, code patterns)
   - Reference existing patterns from packages/shared/api/
   - Protocol-based storage backends (abstract base, LocalBackend, S3Backend, R2Backend)
   - Async/await throughout

3. **Source Code Structure** (file layout, module organization)
   ```
   packages/shared/api/src/njz_api/archival/
   ├── models/archive_frames.py
   ├── schemas/archive.py
   ├── routers/archive.py
   ├── storage/backend.py
   └── services/archival_service.py
   ```

4. **Data Model Integration** (SQLAlchemy + relationships, indices, constraints)
   - Define all 3 tables (from PRD section 4.1)
   - Include indices for performance (match_id, content_hash, timestamp, pinned)
   - Soft delete strategy (deleted_at column)

5. **API Endpoint Design** (all 12 endpoints, request/response, error cases)
   - Upload: POST /v1/archive/frames (request, response, error 409 on duplicate)
   - Query: GET /v1/archive/matches/{match_id}/frames (pagination, filters)
   - Pin/Unpin: POST /v1/archive/frames/{id}/pin|unpin
   - GC: POST /v1/archive/gc (dry_run support)
   - Storage migration: POST /v1/archive/storage/migrate
   - Health: GET /health/storage
   - Verify integrity: POST /v1/archive/storage/verify
   - Audit log: GET /v1/archive/audit
   - Metrics: GET /metrics/archive

6. **Delivery Phases** (scope boundaries)
   - **Phase 1 MVP:** Core (upload, query, pin, GC) + local backend only
   - **Phase 2:** S3, R2 backends + migration
   - **Phase 3:** Cross-region backup, Glacier archival

7. **Verification Approach** (test strategy + commands)
   - Unit: `pytest tests/unit/test_archive_*.py`
   - Integration: `pytest tests/integration/test_archive_*.py`
   - Lint: `ruff check packages/shared/api/src/njz_api/archival/`
   - Type: `mypy packages/shared/api/src/njz_api/archival/`
   - API docs: FastAPI auto-docs at `/v1/docs`

---

## Step 3: Planning Deliverable

**File location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/plan.md` (updated)

**Replace the generic "Implementation" step with:**

| Task # | Title | Gate Ref | Dependencies | AC Links | Verification |
|--------|-------|----------|--------------|----------|--------------|
| 1 | PostgreSQL migration 006 + SQLAlchemy models | [Gate 9.1] | None | AC-01, AC-06 | `alembic upgrade head && pytest test_archive_models.py` |
| 2 | Pydantic schemas + validation tests | [Gate 9.2] | Task 1 | AC-01, AC-02 | `pytest test_archive_schemas.py` |
| 3 | Storage abstraction layer (Protocol + LocalBackend) | [Gate 9.3] | Task 1 | AC-14 | `pytest test_storage_backend.py` |
| 4 | Archival service (deduplication, indexing) | [Gate 9.4] | Tasks 1–3 | AC-02, AC-03 | `pytest test_archival_service.py` |
| 5 | FastAPI router: frame endpoints (upload, query, pin) | [Gate 9.5] | Tasks 1–4 | AC-01, AC-03, AC-04 | `pytest test_archive_routes.py && curl http://localhost:8000/v1/docs` |
| 6 | GC + storage migration endpoints | [Gate 9.6] | Task 5 | AC-05, AC-08 | `pytest test_archive_gc.py && pytest test_storage_migration.py` |
| 7 | Audit logging + Prometheus metrics | [Gate 9.7] | Tasks 5–6 | AC-06, AC-18 | `pytest test_audit_log.py && grep archive_frame_count metrics` |
| 8 | Integration tests (cross-component workflows) | [Gate 9.8] | Tasks 1–7 | AC-11, AC-12, AC-13 | `pytest tests/integration/test_archive_e2e.py` |

**Each task must include:**
- **Gate reference:** Links to PHASE_GATES.md gate (e.g., Gate 9.1)
- **Dependencies:** What must complete first
- **AC links:** Which acceptance criteria this task addresses
- **Verification command:** Specific pytest command or curl call
- **Estimated scope:** Lines of code, files affected

---

## Integration with 2/3/5+1,2,3 Framework

### Framework Context
- **2 Auth Classes:** AGENT (you execute) · CODEOWNER (approves critical PRs)
- **3 Tiers:** MASTER (canonical contracts) · PHASE (gate-linked specs) · WORK SESSION (this plan)
- **5 Pillars:** Road-Maps (gates) · Logic Trees (dependencies) · ACP (handoff) · MCP (data contracts) · Notebook/TODO
- **+3 Bonus:** .doc-registry.json · DOSSIER_CREATION_TEMPLATE.md · FILTER_RULES.md

### Your Responsibility
- **Spec section:** Align with MASTER contracts (AGENTS.md patterns, existing codebase)
- **Planning section:** Link every task to a gate number (PHASE tier)
- **Gate linkage:** Completing a task without updating its gate = incomplete
- **Cross-review:** After drafting spec/plan, run 2-pass review using CROSS-REVIEW-TEMPLATE-2026-03-27.md

---

## Cross-Review Process

**After spec.md and plan.md are drafted:**

1. **Read CROSS-REVIEW-TEMPLATE-2026-03-27.md** for audit checklists
2. **Run Pass 1:** Specification audit (correctness, completeness, integration)
3. **Run Pass 2:** Planning audit (task decomposition, feasibility, gate linkage)
4. **Incorporate findings:** Close gaps, mitigate risks, document assumptions
5. **Request CODEOWNER approval:** Before Implementation begins

---

## File References

| File | Purpose | Location |
|------|---------|----------|
| requirements.md | Full PRD (approved) | `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/` |
| spec.md | Your deliverable (Step 2) | `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/` |
| plan.md | Your deliverable (Step 3) | `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/` |
| AGENTS.md | Project overview, code style | Root directory |
| MASTER_PLAN.md § Phase 9 | Current phase context | Root directory |
| PHASE_GATES.md | Gate structure | `.agents/` |
| packages/shared/api/ | FastAPI patterns to follow | `packages/shared/api/` |
| CROSS-REVIEW-TEMPLATE-2026-03-27.md | Audit framework | `.agents/session/` |
| AGENT-TASK-INSTRUCTION-2026-03-27.md | How to use this workplan | `.agents/session/` |

---

## Success Criteria for This Session

✅ **Specification (spec.md):**
- All 7 sections complete
- All 12 API endpoints fully specified (request, response, errors, auth)
- SQLAlchemy models with relationships, indices, constraints defined
- Storage abstraction layer design explained (Protocol pattern)
- Async/await patterns applied throughout
- Alembic migration 006 structure detailed

✅ **Planning (plan.md):**
- 8 concrete tasks with gate references
- Each task linked to AC criteria
- Dependencies correctly ordered
- Verification commands are specific and executable
- Phase 1 MVP scope clearly bounded
- Ready for independent implementation without clarification

✅ **Cross-Review Report:**
- Specification audit complete (gaps identified, risks documented)
- Planning audit complete (feasibility confirmed, gate linkage validated)
- Findings integrated into spec/plan (no open issues)
- CODEOWNER approval obtained

---

## Decision Framework: When to Ask vs. Assume

| Scenario | Decision |
|----------|----------|
| API endpoint error handling details (500 vs. 503 for S3 failure) | Assume 503 with fallback to local temp storage |
| Frame deduplication strategy (full hash vs. perceptual) | Assume SHA-256 full hash (specified in PRD) |
| Retention GC frequency (daily, weekly, manual) | Assume manual via `POST /v1/archive/gc` endpoint; cron job Phase 2 |
| S3 retry logic (exponential backoff, max retries) | Assume httpx defaults; specify in code |
| Multi-region backup timeline | Defer to Phase 2 (out of Phase 1 MVP) |

---

## Stop Points

**After Step 2 (Specification):** Present spec.md to user for review before proceeding to Step 3.  
**After Step 3 (Planning):** Present plan.md to user for review before Implementation begins.  
**Cross-review:** Submit findings to user; wait for approval before finalizing.

---

*This document expires 2026-03-30. After this date, re-read MASTER_PLAN.md for current phase context.*
