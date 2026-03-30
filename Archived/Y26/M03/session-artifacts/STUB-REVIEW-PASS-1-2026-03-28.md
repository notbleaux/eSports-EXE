[Ver001.000]

# Stub Infrastructure Review — Pass 1: Initial Audit

**Date:** 2026-03-28  
**Reviewer:** Master Agent (cross-review framework)  
**Cycle:** 2/3/5+1,2,3 Revision Pass 1 of 2  
**Scope:** Audit existing stubs (spec-STUB.md, plan-STUB.md) against framework criteria

---

## Audit Findings

### spec-STUB.md Audit

**Strengths:**
- ✅ All 7 sections present (context, approach, structure, data model, API, phases, verification)
- ✅ [ENRICHMENT] blocks added for agent guidance (deduplication ordering, Protocol vs ABC, storage sharding, error handling, caching, audit triggers)
- ✅ Specific examples provided (FrameUploadRequest schema, endpoint error cases)
- ✅ Technology alignment explicit (FastAPI, SQLAlchemy, Pydantic v2)
- ✅ Async/await emphasis throughout
- ✅ Framework references clear (AGENTS.md patterns, existing codebase linkage)

**Gaps Identified:**
- ⚠️ **Section 2 Enrichment:** Mentions `services/tenet-verification/` as canonical pattern but no cross-reference to whether this pattern exists. Recommend conditional: "IF tenet-verification exists, follow its structure; ELSE reference packages/shared/api/routers/players.py"
- ⚠️ **Section 3:** Database migration path ambiguous — "verify migration path" instruction assumes agent knows where migrations live. Recommend explicit: "Migrations live in `packages/shared/api/migrations/` (Alembic `alembic.ini` location authoritative)"
- ⚠️ **Section 4:** Data model shows example SQLAlchemy syntax but no guidance on:
  - Relationship cascade behavior on archive_frames → matches deletion
  - How soft-delete (deleted_at) interacts with audit log triggers
  - Whether ArchiveFrame needs back_populates to Match or optional
- ⚠️ **Section 5:** 12 endpoints documented but missing:
  - Explicit error response structure (should all 4xx/5xx errors return same shape?)
  - Rate limiting strategy (per-client? per-match?)
  - Concurrent request handling (are duplicate POSTs idempotent?)
- ⚠️ **Section 7:** Verification approach mentions `/v1/docs` but doesn't specify how to validate response schema compliance (only Swagger visibility checked, not actual structure)

**Risks:**
- **MEDIUM:** Agent may implement migration logic in wrong location if path ambiguity not resolved
- **LOW:** Async/await patterns are well-emphasized; risk of blocking I/O is minimal
- **LOW:** Framework pattern references are specific enough to follow

**Recommendations for Refinement:**
1. **Conditional pattern reference:** Replace "follows `services/tenet-verification/`" with "IF exists ELSE fallback to `packages/shared/api/routers/`"
2. **Explicit migration location:** Add: "Alembic directory: `packages/shared/api/migrations/`. All models added to `packages/shared/api/models/__init__.py` exports."
3. **Soft-delete audit integration:** Clarify: "SQLAlchemy event listener on `ArchiveFrame.after_update` for `deleted_at` column → triggers AUTO audit entry (no explicit write needed for GC)"
4. **Error response shape:** Define unified error schema: `{ error: string, code: string, timestamp: ISO8601, trace_id?: string }` (if not already standardized in AGENTS.md)
5. **Rate limiting scope:** Specify: "Rate limiting per extraction service principal, not per-user" (if MVP doesn't rate-limit, explicitly defer to Phase 2)

**Rating:** ✅ **PASS WITH NOTES** — Sufficient clarity for agent execution with minor refinements to resolve path/migration ambiguities

---

### plan-STUB.md Audit

**Strengths:**
- ✅ 8 concrete tasks with clear titles and gate references [9.1]–[9.8]
- ✅ Task table shows dependencies, AC links, verification commands
- ✅ Task detail template is comprehensive (gate ref, status, purpose, AC, dependencies, approach, files, scope, verification, edge cases)
- ✅ Critical path analysis present (dependency graph, sequential/parallel opportunities identified)
- ✅ Framework integration checklist provided (gates, AC, dependencies, auth, pillars)
- ✅ Approval gate explicitly defined (tasks must be fully specified before implementation)
- ✅ Cross-review readiness documented

**Gaps Identified:**
- ⚠️ **Task table:** Estimated scope is provided but no time estimate per task (rule of thumb: 1 LOC per hour, but with testing overhead ~0.5–1 LOC/hour suggests Tasks 4–8 could be 1–2 days each)
- ⚠️ **Dependencies in table vs. detail:** Task dependencies listed in two places (table and detail section). Recommend single source of truth: define in table only, cross-reference in detail
- ⚠️ **Gate status column:** Plan shows no way to track gate status during implementation. Recommend: "After verification command passes, update PHASE_GATES.md [Gate N.M] to ✅ PASSED"
- ⚠️ **Blocker handling:** Plan assumes all tasks can be executed sequentially. For Minimap feature (not Archival), this matters (Tasks 7–9 blocked on Archival). Archival plan doesn't document blocker mitigation (if any external dependency exists)
- ⚠️ **AC coverage validation:** Claims "all 18 AC addressed" but no explicit mapping table. AC-01 through AC-18 are mentioned in task links, but no summary table proving 18/18 coverage
- ⚠️ **Integration test isolation:** Task 8 (integration tests) depends on Tasks 1–7, but if Task 6 (GC routes) has a critical bug, does Task 8 need to be re-run? Recommend: "Task 8 can re-run independently if earlier tasks are fixed; verification command must have retry logic"

**Risks:**
- **MEDIUM:** No AC coverage validation table — agent could miss AC coverage during execution
- **MEDIUM:** Gate status tracking not automated — requires manual PHASE_GATES.md updates that could be forgotten
- **LOW:** Task dependencies are clear enough to execute in correct order

**Recommendations for Refinement:**
1. **AC Coverage Table:** Add after task table: "| AC # | Task(s) | Status | Notes |" matrix showing AC-01 through AC-18, which task(s) address it, and current status
2. **Gate Status Tracking:** Add instruction: "After verification command succeeds, immediately run: `echo '- [x] [Gate N.M] Task N' >> .agents/PHASE_GATES.md Phase 9 section` (or manual update if preferred)"
3. **Time Estimates:** Add time column (e.g., "Task 1: ~1 day", "Task 4: ~2 days") based on LOC estimates and test coverage overhead
4. **Integration Test Independence:** Clarify: "Task 8 fixture setup must be idempotent; re-running Task 8 after fixing Task 6 does not require re-running Tasks 1–5"
5. **Blocker Documentation (Archival-specific):** If Archival has external dependencies (e.g., S3 availability), explicitly list them in plan overview

**Rating:** ✅ **PASS WITH NOTES** — Task structure is sound; needs AC coverage matrix and gate tracking clarification for agent execution

---

## Stub Coverage Assessment

**Current Stub Set (as of 2026-03-28):**
1. AGENT-TASK-INSTRUCTION-2026-03-27.md — ✅ Instruction stub (existing, covers Steps 2–3)
2. ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md — ✅ Workplan stub (existing, covers setup + section refs)
3. MINIMAP-FEATURE-WORKPLAN-2026-03-27.md — ✅ Workplan stub (existing, covers setup + section refs)
4. spec-STUB.md — ✅ Specification template (existing, 7 sections with enrichment)
5. spec-minimap-STUB.md — ⚠️ **Minimap spec stub** (assumed to exist, not reviewed here)
6. plan-STUB.md — ✅ Planning template (existing, 8 tasks + critical path)
7. plan-minimap-STUB.md — ⚠️ **Minimap plan stub** (assumed to exist, not reviewed here)
8. CROSS-REVIEW-TEMPLATE-2026-03-27.md — ❌ **MISSING** (referenced in instructions but not found)

**Missing Stubs Identified:**
- ❌ **TASK-EXECUTION-STUB.md** — For when implementation agents execute individual tasks. Should define:
  - Task start/completion logging format
  - How to handle mid-task interruption (checkpoint format)
  - How to report blockers vs. errors
  - File write/edit conventions
  - When to delete STUB and create production file
- ❌ **INTEGRATION-TEST-STUB.md** — For agents writing integration/E2E tests. Should define:
  - Test file naming convention (test_archive_*.py)
  - Mock data setup pattern
  - Database fixture lifecycle (setup → test → teardown)
  - Assertion pattern (error cases, success cases, edge cases)
- ❌ **CODE-COMPONENT-STUB.md** — For individual code file implementations (model, schema, service, router). Should define:
  - File header format (docstring, version, imports)
  - Code structure template (class/function signature)
  - Type hint patterns (Protocol vs ABC, Mapped vs Column, etc.)
  - Error handling pattern (exception hierarchy)
- ❌ **VERIFICATION-CHECKLIST-STUB.md** — For gate completion validation. Should define:
  - Command execution checklist (which tests, which linters)
  - Expected output format (pytest green, ruff clean, mypy clear)
  - How to log verification results
  - What to do if verification fails (rollback vs. fix)

**Additional Meta-Stubs Needed:**
- ❌ **HANDOFF-SUMMARY-STUB.md** — For inter-session coordination. Should define:
  - What to record at session end (which gates passed, which deferred)
  - How to format for next session agent to read
  - Dossier creation trigger (when to archive work session docs)
- ❌ **BLOCKER-RECOVERY-STUB.md** — For when tasks are blocked (e.g., Minimap on Archival). Should define:
  - How to mock a blocked dependency
  - How to track mock vs. real swap deadlines
  - How to verify mock→real swap safety
- ❌ **CONTEXT-FORWARD-STUB.md** — For multi-session continuity (already referenced in NJZPOF but not templated). Should define:
  - Fields to populate (last session date, phase status, gate marks, INTERRUPTED_AT)
  - Freshness check (when to re-verify against live PHASE_GATES.md)
  - How long to keep (7-day expiry + renewal)

---

## Pass 1 Verdict

**Overall Status:** ✅ **INFRASTRUCTURE PARTIALLY COMPLETE**

**Completeness:**
- 4/7 primary stubs present (STUB.md templates + workplans)
- 3/7 workplans assumed present (spec-minimap-STUB, plan-minimap-STUB, CROSS-REVIEW-TEMPLATE)
- 0/6 secondary stubs present (task-execution, integration-test, code-component, verification-checklist, handoff-summary, blocker-recovery, context-forward)

**Quality:**
- Primary stubs (spec-STUB.md, plan-STUB.md): PASS WITH NOTES
- Workplan stubs: PASS (existing, assume coverage complete)
- Missing stubs: Need creation for Phase 9 implementation efficiency

**Action for Pass 2:**
1. Verify minimap-specific STUBS exist (spec-minimap-STUB.md, plan-minimap-STUB.md)
2. Create CROSS-REVIEW-TEMPLATE-2026-03-27.md (referenced but missing)
3. Create secondary stubs for task execution, testing, code components, verification, handoff
4. Refine primary stubs per "Recommendations for Refinement" above
5. Package all into optimized handoff prompts for next session

---

*Pass 1 complete. Proceed to Pass 2: Enhanced Stub Creation & Handoff Prompt Generation.*
