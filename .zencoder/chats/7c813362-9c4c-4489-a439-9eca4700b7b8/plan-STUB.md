[Ver001.000]

# Implementation Plan — Minimap Archival System [STUB]

**Status:** STUB — Agent task instructions integrated  
**Framework:** NJZPOF v0.2 · 2/3/5+1,2,3 compliance  
**Agent Instructions:** Replace placeholder tasks with concrete implementation tasks  
**Cross-Review Ready:** This stub is complete enough for Pass 2 audit  

---

## Overview

[AGENT: Provide 1–2 sentence summary of implementation strategy and critical path.]

**Example:**

Phase 1 MVP implementation: 8 sequential tasks spanning PostgreSQL schema creation → FastAPI routing → test suite. Tasks 1–3 (schema, models, schemas) can be parallelized if needed. Critical path: Task 1 → Task 4 → Task 5 → Task 8. All tasks gate-linked and AC-verified.

---

## Task Breakdown

[AGENT: Replace this table with 8 concrete implementation tasks. Follow structure exactly.]

| Task # | Title | Gate Ref | Dependencies | AC Links | Verification Command | Scope |
|--------|-------|----------|--------------|----------|---|---|
| 1 | PostgreSQL migration 006 + SQLAlchemy models | [Gate 9.1] | None | AC-01, AC-06 | `alembic upgrade head && pytest tests/unit/test_archive_models.py -v` | ~250 LOC (3 models + indices) |
| 2 | Pydantic schemas + validation tests | [Gate 9.2] | Task 1 | AC-01, AC-02 | `pytest tests/unit/test_archive_schemas.py -v` | ~180 LOC (8 schemas) |
| 3 | Storage abstraction layer (Protocol + LocalBackend) | [Gate 9.3] | Task 1 | AC-14 | `pytest tests/unit/test_storage_backend.py -v` | ~200 LOC (Protocol + 1 impl) |
| 4 | Archival service (deduplication, GC, migration) | [Gate 9.4] | Tasks 1–3 | AC-02, AC-03, AC-05 | `pytest tests/unit/test_archival_service.py -v` | ~300 LOC |
| 5 | FastAPI router: frame endpoints (upload, query, pin) | [Gate 9.5] | Tasks 1–4 | AC-01, AC-03, AC-04 | `pytest tests/unit/test_archive_routes.py -v && curl http://localhost:8000/v1/docs` | ~250 LOC (5 endpoints) |
| 6 | GC + storage migration endpoints | [Gate 9.6] | Task 5 | AC-05, AC-08, AC-11 | `pytest tests/unit/test_archive_gc.py -v && pytest tests/unit/test_storage_migration.py -v` | ~150 LOC (3 endpoints) |
| 7 | Audit logging + Prometheus metrics | [Gate 9.7] | Tasks 5–6 | AC-06, AC-18 | `pytest tests/unit/test_audit_log.py -v && grep archive_frame_count /metrics` | ~100 LOC |
| 8 | Integration tests (cross-component workflows) | [Gate 9.8] | Tasks 1–7 | AC-11, AC-12, AC-13, AC-15, AC-16, AC-17 | `pytest tests/integration/test_archive_e2e.py -v` | ~400 LOC (E2E test suite) |

---

## Task Details Template

[AGENT: For each task above, expand with full specification using this template:]

### Task N: [Title]

**Gate Reference:** [Gate N.M] — Update PHASE_GATES.md after completion  
**Status:** PENDING (mark PASSED after verification command succeeds)

**Purpose:**  
[AGENT: 1–2 sentence description. What does this task deliver?]

**Acceptance Criteria Addressed:**  
[AGENT: List AC numbers (AC-01, AC-02, etc.) this task fulfills]

**Dependencies:**  
[AGENT: List task numbers that must complete first. Format: "None" or "Task X" or "Tasks X, Y, Z"]

**Implementation Approach:**  
[AGENT: Describe HOW to implement. Reference existing codebase patterns. Provide pseudocode or structure outline.]

**Files Affected:**  
[AGENT: List files created/modified. Example: "packages/shared/api/models/archive_frames.py (new, 250 LOC)"]

**Estimated Scope:**  
[AGENT: Lines of code, complexity estimate (simple/medium/complex)]

**Verification Command:**  
[AGENT: Specific, executable command that proves task completion. Must be copy-pasteable. Example: `pytest tests/unit/test_archive_models.py -v && ruff check packages/shared/api/models/archive_frames.py`]

**Edge Cases & Error Handling:**  
[AGENT: What could go wrong? How is it handled?]

**Example:**

```markdown
### Task 1: PostgreSQL migration 006 + SQLAlchemy models

**Gate Reference:** [Gate 9.1]  
**Status:** PENDING

**Purpose:**  
Create database schema (3 tables: archive_frames, archive_manifests, archive_audit_log) and SQLAlchemy ORM models. This is the foundation for all subsequent archival tasks.

**Acceptance Criteria Addressed:**  
AC-01 (frames persisted to PostgreSQL), AC-06 (mutations logged to audit_log)

**Dependencies:**  
None (can start immediately)

**Implementation Approach:**  
1. Create Alembic migration file: `services/api/src/njz_api/migrations/006_archive_schema.py`
2. Define migration up() with CREATE TABLE statements (copy from requirements.md section 4.1)
3. Create SQLAlchemy models in `packages/shared/api/models/archive_frames.py`:
   - `ArchiveFrame` model with relationships to `Match`, `User`
   - `ArchiveManifest` model with FK to `ArchiveFrame` array
   - `ArchiveAuditLog` model
4. Add indices for performance (match_id, content_hash, timestamp_ms, is_pinned, created_at DESC)
5. Configure cascade delete (frame deletion → audit entry created)
6. Run migration and verify tables exist

**Files Affected:**  
- `services/api/src/njz_api/migrations/006_archive_schema.py` (new, ~150 LOC)
- `packages/shared/api/models/archive_frames.py` (new, ~250 LOC)
- `packages/shared/api/models/__init__.py` (modified, +imports)

**Estimated Scope:**  
~400 LOC, Medium complexity (SQLAlchemy relationships, FK constraints, indices)

**Verification Command:**  
```bash
cd services/api/
alembic upgrade head
pytest tests/unit/test_archive_models.py::TestArchiveFrameModel -v
pytest tests/unit/test_archive_models.py::TestArchiveManifestModel -v
pytest tests/unit/test_archive_models.py::TestArchiveAuditLog -v
ruff check packages/shared/api/models/archive_frames.py
mypy packages/shared/api/models/archive_frames.py --strict
```

**Edge Cases & Error Handling:**  
- Migration idempotency: Migration must be safe to run multiple times (use `if not exists`)
- Cascade delete: Verify that deleting a match cascades to archive_frames (test with CASCADE constraint)
- Index creation: Large tables may slow down index creation (consider CONCURRENTLY flag)

**Success Criteria:**  
✅ `alembic upgrade head` runs without error  
✅ All three tables exist in PostgreSQL with correct columns/constraints  
✅ Indices created successfully (verify with `\d archive_frames` in psql)  
✅ SQLAlchemy models load without errors (`from njz_api.models import ArchiveFrame`)  
✅ Unit tests pass (`pytest -v` returns all green)  
✅ No type errors (`mypy --strict` returns clean)  
✅ No linting errors (`ruff check` returns clean)
```

---

## Critical Path Analysis

[AGENT: Identify which tasks block others. What's the minimum sequence to first success?]

**Example:**

```markdown
### Dependency Graph

Task 1 (Schema)
  ↓
Task 2 (Schemas) ← Task 3 (Storage) ← parallel
  ↓                      ↓
  └─→ Task 4 (Service) ←─┘
        ↓
      Task 5 (Routes)
        ↓
      Task 6 (GC routes)
        ↓
      Task 7 (Metrics)
        ↓
      Task 8 (Integration tests)

### Critical Path (minimum sequence)
Task 1 → Task 4 → Task 5 → Task 8 (8 days minimum, assuming 1 day per task)

### Parallel Execution Opportunities
Tasks 2 & 3 can run in parallel with Task 1 (after schema available)
Tasks 6 & 7 can run in parallel after Task 5 complete

### Total Estimated Time
Sequential execution: 8 days
Parallel execution (2 agents): 6–7 days (Tasks 2–3 parallel, Tasks 6–7 parallel)
```

---

## Framework Integration Checklist

**2/3/5+1,2,3 Compliance:**

- [ ] **Every task has [Gate N.M] reference** (Road-Maps pillar)
- [ ] **Every task links to AC criteria** (AC-01 through AC-18 all addressed)
- [ ] **Dependencies documented clearly** (no circular deps, critical path identified)
- [ ] **Gate completion is objectively verifiable** (verification command returns pass/fail)
- [ ] **Auth classes applied** (AGENT executes, CODEOWNER approves critical PRs)
- [ ] **Framework pillars referenced:**
  - Road-Maps: Gate linkage ✅
  - Logic Trees: Dependency graph ✅
  - ACP: Handoff documented ✅
  - MCP: Data model contracts from requirements.md ✅
  - Notebook/TODO: This plan IS session TODO ✅

---

## Approval Gate

**Before Implementation begins:**

- [ ] **All 8 tasks fully specified** (task details template expanded for each)
- [ ] **Critical path identified** (minimum sequence documented)
- [ ] **No circular dependencies** (reviewed by cross-review Pass 2)
- [ ] **Framework compliance verified** (2/3/5+1,2,3 checklist completed)
- [ ] **CODEOWNER approval obtained** (sign-off before agents start coding)

---

## Cross-Review Readiness

[AGENT: This stub is ready for cross-review. Pass 2 audit will check:]

✅ **Task decomposition** — Are tasks appropriately sized (not too granular, not too broad)?  
✅ **Dependency ordering** — Are prerequisites correct? Any circular dependencies?  
✅ **Gate linkage** — Every task has [Gate N.M]? Gates are sequential?  
✅ **Feasibility** — Can all 8 tasks complete in Phase 9?  
✅ **Framework compliance** — Are 2/3/5+1,2,3 principles applied throughout?  

**Cross-Review Invocation:**
After finalizing plan.md, run CROSS-REVIEW-TEMPLATE-2026-03-27.md Pass 2 with sonnet-4-6-think.

---

## Success Criteria Summary

✅ **Plan completeness:**
- 8 concrete tasks with gate refs
- Every task links to AC criteria
- Dependencies clearly listed
- Verification commands executable
- All 18 AC addressed by at least one task
- Critical path identified
- Framework compliance verified

✅ **Ready for Implementation:**
- No ambiguity (agents can start coding immediately)
- No unresolved gates (gates exist in PHASE_GATES.md)
- No unresolved blockers
- CODEOWNER approval obtained

---

*This stub expires 2026-03-30. Replace with finalized plan.md after cross-review completion.*
