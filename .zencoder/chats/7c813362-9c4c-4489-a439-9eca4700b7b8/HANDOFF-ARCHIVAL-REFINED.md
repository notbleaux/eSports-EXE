# Handoff: Archival System Specification & Planning — REFINED

**Status:** PRD approved · Consolidated workplan created  
**Next Steps:** Step 2 (Technical Specification) → Step 3 (Planning) → Cross-Review  
**Session Files:** Valid until 2026-03-30  

---

## Quick Start

You are executing **Steps 2–3 of the SDD workflow** for the **Minimap Archival System**.

**Your primary reference files (read in this order):**

1. **AGENT-TASK-INSTRUCTION-2026-03-27.md** — How to execute this workflow ⭐ READ FIRST
2. **ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md** — Context, deliverable outlines, success criteria
3. **requirements.md** — Full PRD (reference during spec writing)
4. **CROSS-REVIEW-TEMPLATE-2026-03-27.md** — Audit framework (after spec/plan complete)

**Your deliverables:**
- `spec.md` — Technical specification (7 sections, all API endpoints defined)
- `plan.md` — Implementation plan (8+ tasks with gate refs, AC links, verification commands)

**Files location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/`  
**Workplan location:** `.agents/session/ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md`

---

## What You're Building

**Minimap Archival System** — Content-addressed storage + lifecycle management for minimap JPEG frames.

**Key features:**
- SHA-256 hashing + automatic deduplication
- Multi-backend abstraction (local, S3, R2)
- 90-day default retention with garbage collection
- Frame pinning to preserve verified matches
- Audit logging + Prometheus metrics
- 12 API endpoints, 3 PostgreSQL tables, async throughout

**Why now:** Prerequisite blocker for Minimap Extraction Service (frontend + TeneT integration). Phase 9 execution.

---

## Your Workflow

### Step 2: Technical Specification

**Read first:** AGENT-TASK-INSTRUCTION-2026-03-27.md "Step 2 — Technical Specification"

**Deliverable:** `spec.md` with 7 required sections:
1. Technical Context (Python, FastAPI, SQLAlchemy, PostgreSQL)
2. Implementation Approach (async design, storage abstraction, code patterns)
3. Source Code Structure (file layout, module organization)
4. Data Model Integration (SQLAlchemy models, indices, constraints)
5. API Endpoint Design (all 12 endpoints, request/response, error cases)
6. Delivery Phases (Phase 1 MVP boundaries)
7. Verification Approach (unit/integration/E2E tests, lint/type checks)

**Quality gates:**
- ✅ All 7 sections complete (not stubs)
- ✅ Every API endpoint from requirements.md mentioned
- ✅ Reference existing codebase patterns (2+ files)
- ✅ Data model includes indices + constraints
- ✅ Async/await throughout
- ✅ No hand-waving (every claim has "why" and "how")

**Reference existing code:**
- FastAPI routers: `packages/shared/api/routers/players.py`
- SQLAlchemy models: `packages/shared/api/models/player.py`
- Pydantic schemas: `packages/shared/api/schemas/`
- Async patterns: `packages/shared/api/services/`

**Stop after Step 2:** Report "Specification complete" before proceeding to Step 3.

---

### Step 3: Planning

**Read first:** AGENT-TASK-INSTRUCTION-2026-03-27.md "Step 3 — Planning"

**Deliverable:** `plan.md` updated with 8+ concrete implementation tasks in table format:

| Task # | Title | Gate Ref | Dependencies | AC Links | Verification |
|--------|-------|----------|--------------|----------|---|
| 1 | PostgreSQL migration + SQLAlchemy | [Gate 9.1] | None | AC-01, AC-06 | `pytest test_archive_models.py` |
| ... | ... | ... | ... | ... | ... |

**Critical elements:**
- ✅ Every task has [Gate N.M] reference (PHASE_GATES.md)
- ✅ Every task links to AC criteria (AC-01 through AC-18)
- ✅ Every task lists dependencies (None or Task X)
- ✅ Every task has executable verification command
- ✅ All 18 AC criteria addressed by at least one task
- ✅ Task scope appropriate (~2–4 hour implementation units)

**Gate numbering:** Check PHASE_GATES.md for existing Phase 9 gates; create new ones if needed.

**Reference for task sizing:** AGENT-TASK-INSTRUCTION "Task Scope Guidance"

**Stop after Step 3:** Report "Planning complete" before proceeding to Cross-Review.

---

## Cross-Review Process

**After both Specification and Planning complete:**

1. **Read CROSS-REVIEW-TEMPLATE-2026-03-27.md** for audit framework
2. **Run Pass 1:** Cross-review skill (sonnet-4-6-think) on specification
   - Receive: Strengths, Gaps, Risks, Improvements
   - Action: Update spec.md to address High priority gaps
3. **Run Pass 2:** Cross-review skill (sonnet-4-6-think) on planning
   - Receive: Task order assessment, feasibility, framework compliance
   - Action: Update plan.md to address High priority risks
4. **Report findings:** Summarize resolutions and deferred items
5. **Request CODEOWNER approval:** When both passes report minimal/no issues

---

## Framework Integration

You MUST apply the **2/3/5+1,2,3 governance framework:**

- **2 Auth classes:** AGENT (you) executes; CODEOWNER approves critical PRs
- **3 Tiers:** MASTER (contracts) · PHASE (gate-linked specs/plans) · WORK SESSION (this workplan)
- **5 Pillars:** Road-Maps (gates) · Logic Trees (dependencies) · ACP (handoff) · MCP (contracts) · Notebook/TODO
- **+3 Bonus:** .doc-registry.json · DOSSIER_CREATION_TEMPLATE.md · FILTER_RULES.md integration

**In practice:**
- Every task references [Gate N.M] from PHASE_GATES.md (Road-Maps pillar)
- Task dependencies documented clearly (Logic Trees pillar)
- API contracts align with MASTER requirements.md (MCP pillar)

---

## Decision Framework

Make technical calls autonomously using this guidance:

| Scenario | Decision |
|----------|----------|
| Error handling (500 vs 503 for S3 failure) | Check requirements.md; assume reasonable default |
| Data model (nullable vs required) | Assume required unless PRD says optional |
| Task scope | Size for ~2–4 hour implementation |
| Test framework | Follow existing codebase (pytest, not unittest) |
| If stuck | Document assumption in spec/plan; flag for cross-review |

---

## Success Criteria

✅ **Specification:** 7 sections, all API endpoints, references to existing patterns, indices/constraints defined, async throughout, executable commands

✅ **Planning:** 8+ tasks, gate references, AC links, dependencies, verification commands, all 18 AC addressed

✅ **Cross-Review:** Both passes complete, findings addressed, ready for CODEOWNER approval

---

## Stop Points & Reporting

**After Step 2:** "Specification complete. spec.md ready for cross-review." (1–2 sentence summary)

**After Step 3:** "Planning complete. plan.md ready for cross-review." (task count + critical path summary)

**After Cross-Review:** "Cross-review complete. spec.md and plan.md updated. Ready for CODEOWNER approval." (findings summary)

---

## Files at a Glance

| File | Purpose | Location |
|------|---------|----------|
| AGENT-TASK-INSTRUCTION | How to execute (READ FIRST) | `.agents/session/` |
| ARCHIVAL-SYSTEM-WORKPLAN | Context + deliverable outlines | `.agents/session/` |
| requirements.md | Full PRD | `.zencoder/chats/.../` |
| CROSS-REVIEW-TEMPLATE | Audit framework | `.agents/session/` |
| AGENTS.md | Project patterns | Root |
| PHASE_GATES.md | Gate numbers | `.agents/` |
| packages/shared/api/ | Code examples | `packages/shared/api/` |

---

**Ready? Start with AGENT-TASK-INSTRUCTION-2026-03-27.md (Phase 1: Orientation section).**
