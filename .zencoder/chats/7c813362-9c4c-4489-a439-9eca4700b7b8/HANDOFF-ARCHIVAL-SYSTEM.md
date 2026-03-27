# Handoff Prompt: Minimap Archival System — Technical Specification & Planning

**Status:** PRD Approved (requirements.md)  
**Next Steps:** Technical Specification → Planning → Implementation  
**Review Framework:** 2/3/5+1,2,3 scheme (2 Auth Classes · 3 Tiers · 5 Pillars · +3 Bonus Improvements)

---

## Context Handoff

### PRD Summary
The **Minimap Archival System** is a content-addressed storage and lifecycle management platform for minimap frame sequences extracted from esports VODs. It serves as a critical prerequisite for Minimap Extraction Service and TeneT Key.Links integration.

**Key features:**
- Content-addressable storage (SHA-256), automatic deduplication (~10-20% savings)
- Multi-backend abstraction (local, AWS S3, Cloudflare R2)
- Retention policies with garbage collection (default 90 days)
- Frame pinning to preserve high-confidence matches
- Audit logging and Prometheus metrics
- PostgreSQL metadata indexing, FastAPI async endpoints

**Scope:**
- 3 PostgreSQL tables (archive_frames, archive_manifests, archive_audit_log)
- 12 API endpoints (upload, query, pin/unpin, GC, migration, health, audit, metrics)
- Pydantic schemas with enums
- Multi-backend storage abstraction layer
- Unit + integration tests

**Key Constraints:**
- Target: 1000 frames/min throughput, <2s P99 batch upload, <500ms P99 query
- 11-9s durability requirement (S3 versioning + cross-region backup future phase)
- 18 acceptance criteria (functional, performance, integration, quality)

**PRD Location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/requirements.md`

---

## Your Mission

You are executing **Steps 2–3 of the SDD workflow** for the Minimap Archival System:

1. **Step 2: Technical Specification** — Define implementation approach, code structure, integration points, delivery phases
2. **Step 3: Planning** — Break down into concrete implementation tasks with verification steps

Both steps must integrate the **2/3/5+1,2,3 review framework**:

### Framework Overview
- **2 Auth Classes:** AGENT (read/write code, mark TODOs) · CODEOWNER (approve PRs, unlock phases)
- **3 Tiers:** MASTER (project-wide canonical truth) · PHASE (phase-duration scope) · WORK SESSION (ephemeral)
- **5 Pillars:** Road-Maps · Logic Trees · ACP (Agent Coordination) · MCP (Master Context) · Notebook/TODO System
- **+3 Bonus Improvements:** Identified via cross-review, integrated into specs and plans

---

## Step 2: Technical Specification

**Deliverable:** `spec.md` (same chat directory)

Create a technical specification covering:

1. **Technical Context**
   - Language: Python 3.11+ (FastAPI async backend)
   - Database: PostgreSQL 15+ (SQLAlchemy ORM, Alembic migrations)
   - Dependencies: Pydantic v2, httpx (async HTTP client), boto3 (S3), cryptography (hashing)
   - Framework alignment: Follow NJZ eSports Platform patterns (see AGENTS.md)

2. **Implementation Approach**
   - Reference existing code patterns from:
     - `packages/shared/api/` (FastAPI routers, Pydantic schemas)
     - `packages/shared/api/models/` (SQLAlchemy models, migrations)
     - `packages/shared/api/routers/` (async endpoint patterns)
   - Storage abstraction: Protocol-based design (LocalBackend, S3Backend, R2Backend)
   - Async/await throughout (no blocking I/O)

3. **Source Code Structure**
   - `packages/shared/api/src/njz_api/archival/`
     - `models/archive_frames.py` — SQLAlchemy models
     - `schemas/archive.py` — Pydantic request/response schemas
     - `routers/archive.py` — FastAPI endpoints
     - `storage/backend.py` — Storage abstraction + implementations
     - `services/archival_service.py` — Core business logic
   - `services/api/src/njz_api/migrations/` — Alembic migration 006_archive_schema.py
   - `tests/integration/test_archive_*.py` — Integration tests
   - `tests/unit/test_archive_*.py` — Unit tests

4. **Data Model Integration**
   - Schema: PostgreSQL migration 006 (3 tables as defined in PRD)
   - SQLAlchemy models with relationships to existing Match, User models
   - Indexes for query performance (match_id, content_hash, timestamp, pinned)

5. **API Endpoint Design**
   - Async FastAPI routes with dependency injection
   - Request/response validation via Pydantic
   - Error handling: 400 (validation), 404 (not found), 409 (duplicate), 503 (backend unavailable)
   - Prometheus instrumentation for latency, throughput

6. **Delivery Phases**
   - **Phase 1 MVP:** Core upload, query, pin, GC with local storage backend
   - **Phase 2:** S3/R2 backend implementation, storage migration
   - **Phase 3:** Cross-region backup, Glacier archival for cold frames

7. **Verification Approach**
   - Unit tests: `pytest tests/unit/test_archive_*.py`
   - Integration tests: `pytest tests/integration/test_archive_*.py`
   - Lint: `ruff check packages/shared/api/src/njz_api/archival/`
   - Type check: `mypy packages/shared/api/src/njz_api/archival/`
   - API docs validation: FastAPI auto-generated docs at `/v1/docs`

**Integration with 2/3/5+1,2,3 Framework:**
- **Pillar 1 (Road-Maps):** Technical spec maps to Phase 9 execution road-map (PHASE_GATES.md gate 9.X)
- **Pillar 4 (MCP):** Spec defines data model contracts and integration boundaries
- **Pillar 6 (Success Deliverables):** Each delivery phase maps to 3×3×3 grid (G1–G3, D1–D3)
- **+3 Bonus:** Integration with existing archive systems (ARCHIVE_MASTER_DOSSIER.md, FILTER_RULES.md, DOSSIER_CREATION_TEMPLATE.md)

---

## Step 3: Planning

**Deliverable:** Updated `plan.md` with implementation tasks (replace generic Implementation step)

Create a detailed implementation plan with:

1. **Task Breakdown** (Phase 1 MVP as concrete units)
   - **Task 1:** PostgreSQL migration + SQLAlchemy models
   - **Task 2:** Pydantic schemas + validation tests
   - **Task 3:** Storage abstraction layer (Protocol + LocalBackend)
   - **Task 4:** Archival service (deduplication, metadata indexing)
   - **Task 5:** FastAPI router endpoints (upload, query, pin/unpin, GC)
   - **Task 6:** Audit logging + Prometheus metrics
   - **Task 7:** Integration tests (cross-component workflows)
   - **Task 8:** Documentation (API, storage backend extension guide)

2. **Task Specification Template** (for each task)
   - **Gate Reference:** Link to PHASE_GATES.md gate (e.g., [Gate 9.3])
   - **Dependencies:** List prerequisite tasks
   - **Acceptance Criteria:** Reference PRD AC-01 through AC-18
   - **Verification Steps:** Specific commands (pytest, ruff, mypy)
   - **Estimated Scope:** Lines of code, files affected

3. **Integration with 2/3/5+1,2,3:**
   - Each task cross-references a PHASE gate number
   - Tasks grouped by Pillar (framework compliance, data models, endpoints, testing)
   - Success deliverables (G1–G3) mapped to tasks
   - +3 Bonus improvements noted (e.g., "integrate with existing ARCHIVE_MASTER_DOSSIER.md")

4. **Approval Gate**
   - Plan must be reviewed by CODEOWNER before proceeding to Implementation
   - User input required on task prioritization if scope exceeds Phase 9 capacity

---

## Cross-Review Integration

**After creating spec.md and plan.md**, initiate a **2-pass cross-review using sonnet-4-6-think**:

### Cross-Review Pass 1: Specification Audit
**Focus:** Correctness, industry standards, completeness, integration with existing codebase

Run:
```
Use cross-review skill with sonnet-4-6-think model to review the changes.

Review instructions: Audit the technical specification for:
1. Correctness — Are SQLAlchemy models, Pydantic schemas, API endpoints correctly designed?
2. Industry standards — Does storage abstraction follow best practices (Protocol-based, async/await, error handling)?
3. Completeness — Are all 12 API endpoints fully specified? Are data model constraints complete?
4. Integration — Does spec align with existing NJZ codebase patterns (FastAPI, SQLAlchemy, async)?
5. Missing details — Are there gaps in error handling, validation, or edge cases?
6. Risks — Performance risks (N+1 queries), security risks (auth/audit gaps), operational risks (GC blocking)
7. Alternatives — Were simpler storage abstractions or query patterns considered and rejected?

Format review as: Strengths | Gaps | Risks | Suggested Improvements (each section, 2–3 items)
```

### Cross-Review Pass 2: Planning Audit
**Focus:** Task decomposition, gate linkage, feasibility, risk mitigation

Run:
```
Use cross-review skill with sonnet-4-6-think model to review the changes.

Review instructions: Audit the implementation plan for:
1. Task decomposition — Are tasks appropriately sized (not too granular, not too broad)?
2. Gate linkage — Is each task linked to a gate number? Can completion be verified objectively?
3. Feasibility — Can this be implemented in Phase 9? Are dependencies correctly ordered?
4. Risk mitigation — Are integration risks (Extraction Service, TeneT, Frontend) addressed upfront?
5. Test coverage — Does each task include clear acceptance criteria and verification commands?
6. 2/3/5+1,2,3 compliance — Are framework principles (auth, tiers, pillars, bonus improvements) applied?

Format review as: Task Order Assessment | Feasibility Score | Framework Compliance | Missing Safeguards
```

---

## Handoff Checklist

Before handing off to Implementation agent:

- [ ] **spec.md created** with all 7 sections
- [ ] **plan.md updated** with Phase 1 implementation tasks (replaces generic Implementation step)
- [ ] **Cross-review Pass 1** completed on spec.md; gaps and risks documented
- [ ] **Cross-review Pass 2** completed on plan.md; feasibility and compliance validated
- [ ] **CODEOWNER approval** obtained on final plan.md before Implementation begins

---

## Success Criteria for This Handoff

✅ **Technical Specification:**
- All 12 API endpoints fully specified (request/response, validation, error cases)
- SQLAlchemy models with relationships, indices, cascade rules defined
- Storage abstraction layer design with Protocol pattern explained
- Async/await patterns applied consistently
- Alembic migration 006 structure defined

✅ **Implementation Plan:**
- 8+ concrete tasks, each with gate reference, dependencies, AC links, verification steps
- Phase 1 MVP scope clearly bounded (Phase 2/3 deferred)
- Cross-review findings integrated (gaps closed, risks mitigated, alternatives justified)
- Ready for independent implementation by subagent without additional clarification

✅ **Framework Integration:**
- All 5 Pillars referenced (Road-Maps, Logic Trees, ACP, MCP, Notebooks)
- 2 Auth classes applied (AGENT execution, CODEOWNER approval gates)
- 3 Tiers respected (MASTER contracts, PHASE specs, WORK SESSION plans)
- +3 Bonus improvements identified and integrated

---

## Files to Reference

- **AGENTS.md** — Project overview, code style, tech stack
- **MASTER_PLAN.md § Phase 9** — Current phase context
- **PHASE_GATES.md** — Gate structure for linking tasks
- **CODEOWNER_CHECKLIST.md** — What requires CODEOWNER approval
- **docs/API_V1_DOCUMENTATION.md** — Existing API patterns
- **packages/shared/api/models/** — SQLAlchemy model examples
- **packages/shared/api/routers/** — FastAPI endpoint patterns
- **tests/integration/** — Integration test structure

---

**Ready to proceed to Specification step?** Confirm and this chat will spawn a subagent to execute Steps 2–3.
