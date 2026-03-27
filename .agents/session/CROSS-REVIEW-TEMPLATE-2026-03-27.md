[Ver001.000]

# Cross-Review Template — Session 2026-03-27

**Tier:** WORK SESSION (expires 2026-03-30)  
**Framework:** 2-Pass audit using sonnet-4-6-think model  
**Applies to:** Archival System AND Minimap Feature specifications/plans

---

## Overview

After drafting `spec.md` + `plan.md` (or spec-minimap-feature.md + plan-minimap-feature.md), run **2 independent cross-review passes** using the sonnet-4-6-think model to validate correctness, completeness, and feasibility.

**Pass 1: Specification Audit** — Does the spec correctly solve the problem?  
**Pass 2: Planning Audit** — Will these tasks actually implement the spec?

---

## Pass 1: Specification Audit

### Trigger
Run after completing `spec.md` or `spec-minimap-feature.md`.

### Review Instructions Prompt

```
Use cross-review skill with sonnet-4-6-think model to review the changes.

Review instructions: Audit the technical specification for completeness, correctness, 
and alignment with existing codebase patterns.

FOCUS AREAS:

1. **Correctness** — Are technical designs sound?
   - Data models: SQLAlchemy relationships, constraints, indices correct?
   - API endpoints: Request/response schemas match usage patterns?
   - Async patterns: All I/O operations properly async/await?
   - Error handling: All error cases defined (4xx validation, 5xx backend failures)?

2. **Industry Standards** — Do patterns follow best practices?
   - Storage abstraction: Is Protocol-based design idiomatic?
   - API design: RESTful conventions followed (GET idempotent, POST creates, etc.)?
   - ORM usage: SQLAlchemy models include relationships, cascades, soft deletes?
   - Testing strategy: Unit vs. integration vs. E2E split sensible?

3. **Completeness** — Are all requirements addressed?
   - All AC (acceptance criteria) from PRD mentioned in spec?
   - All API endpoints (12 for Archival, 2 for Extraction) fully specified?
   - Data model constraints complete (foreign keys, indices, enums)?
   - Async pipeline fully defined (no blocking calls)?

4. **Integration Alignment** — Does spec fit existing codebase?
   - Existing FastAPI patterns followed (from packages/shared/api/routers/)?
   - SQLAlchemy model structure matches existing models/?
   - Pydantic schema style consistent with existing schemas/?
   - Testing patterns align (pytest, fixtures, mocking)?

5. **Missing Details** — What critical gaps remain?
   - Retry logic for cloud backend (S3/R2 failures, timeouts)?
   - Cascade delete strategy (frame deletion → audit log handling)?
   - Concurrent upload handling (race conditions on deduplication)?
   - Pagination cursor format (offset-based vs. keyset pagination)?

6. **Risks** — What could fail in implementation?
   - N+1 query risk: Frame queries without prefetch/join?
   - Lock contention: Concurrent GC and uploads on same match?
   - Storage backend switching: Does abstraction handle backend unavailability?
   - Frame validation: No checks for duplicate content_hash before storage?

7. **Alternatives** — Were simpler/better approaches considered?
   - Deduplication: SHA-256 full hash vs. perceptual hashing trade-off justified?
   - Storage abstraction: Why Protocol pattern vs. factory pattern or inheritance?
   - Retention: Why background GC job vs. TTL-based expiry in database?
   - Query pagination: Why offset-based vs. keyset (timestamp) pagination?

REPORT FORMAT:
- **Strengths** (2–3 items): What the spec does well
- **Gaps** (2–4 items): What's missing or unclear
- **Risks** (2–4 items): What could cause failure
- **Suggested Improvements** (2–4 items): How to strengthen the spec
```

### Response Checklist

After running Pass 1, you should have:

- [ ] **Strengths documented** — Aspects of spec that are well-designed
- [ ] **Gaps identified** — Missing details, incomplete sections
- [ ] **Risks listed** — Implementation risks and edge cases
- [ ] **Improvements suggested** — Specific refinements to strengthen spec

**Action:** If gaps or risks are High priority, update spec.md before proceeding to Pass 2.

---

## Pass 2: Planning Audit

### Trigger
Run after completing `plan.md` or `plan-minimap-feature.md` (updated from generic "Implementation" step).

### Review Instructions Prompt

```
Use cross-review skill with sonnet-4-6-think model to review the changes.

Review instructions: Audit the implementation plan for feasibility, correctness, 
and alignment with 2/3/5+1,2,3 framework.

FOCUS AREAS:

1. **Task Decomposition** — Are tasks appropriately sized?
   - Too granular? (e.g., "implement function foo" vs. "implement module X")
   - Too broad? (e.g., "implement entire API" as one task)
   - Each task achievable in ~2–4 hours by one agent?
   - Tasks represent coherent units of work (one feature, one component, one test suite)?

2. **Dependency Ordering** — Are prerequisites correct and minimal?
   - Can tasks 1–5 run in parallel (Archival/Minimap)?
   - Does Task 6 (GC) truly require Task 5 (upload) complete?
   - Any circular dependencies (A depends on B, B depends on A)?
   - Critical path identified (what's the minimum sequence to first success)?

3. **Gate Linkage** — Is each task linked to a PHASE_GATES.md gate?
   - Every task references [Gate N.M]?
   - Gate numbers are sequential and assigned (not gaps)?
   - Acceptance criteria for each task clearly reference PRD AC-01 through AC-18?
   - Gate completion is verifiable (command returns success/failure)?

4. **Feasibility** — Can this realistically complete in Phase 9?
   - Estimated scope per task (if listed) reasonable (50–500 LOC)?
   - Blockers identified (Archival prerequisite for Minimap)?
   - Mitigation strategies documented (mock APIs, parallel execution)?
   - Timeline realistic (all tasks fit in Phase 9 window)?

5. **Risk Mitigation** — How are major risks addressed?
   - Integration risks (Archival unavailability): Mitigated with mock API?
   - Performance risks (N+1 queries, slow GC): Addressed in spec before implementation?
   - Test coverage risks: E2E tests planned for cross-component workflows?
   - Rollback risks: Can implementation proceed incrementally (Phase 1 MVP, then Phase 2)?

6. **Framework Compliance** — Does plan respect 2/3/5+1,2,3?
   - Auth classes applied: AGENT executes, CODEOWNER approves critical PRs?
   - Tiers respected: MASTER contracts (data models), PHASE specs, WORK SESSION plans?
   - Pillars referenced: Gate linkage (Road-Maps), dependency graph (Logic Trees)?
   - +3 Bonus: Integration with existing archival/consolidation systems noted?

7. **Verification Strategy** — How is completion proven?
   - Pytest commands specific (not just "run tests")?
   - Lint/type checks included (`ruff check`, `mypy`, `eslint`)?
   - Integration test covers multiple tasks together?
   - E2E test covers user-facing workflow (Extraction → Archival → Frontend)?

REPORT FORMAT:
- **Task Order Assessment** (table): Which tasks can run in parallel, critical path
- **Feasibility Score**: High/Medium/Low confidence in Phase 9 completion
- **Framework Compliance**: Which pillars/tiers are well-applied, which are weak
- **Missing Safeguards** (2–4 items): What's missing to reduce risk

[FOR MINIMAP ONLY]:
- **Archival Blocker Management**: How are Tasks 7–9 (Archival integration) handled if Archival delays?
```

### Response Checklist

After running Pass 2, you should have:

- [ ] **Task order validated** — Parallel execution identified, critical path clear
- [ ] **Feasibility confirmed** — High/Medium confidence in Phase 9 completion
- [ ] **Framework compliance verified** — 2/3/5+1,2,3 principles applied
- [ ] **Safeguards documented** — Risk mitigation strategies confirmed
- [ ] **[Minimap only] Blocker strategy validated** — Mock API swap plan confirmed

**Action:** If feasibility is Low or framework compliance gaps exist, update plan.md before CODEOWNER approval.

---

## Invoking Cross-Review Skill

### Prerequisites
- Spec.md and/or Plan.md already drafted and saved
- Ready to run formal audit (not during initial drafting)
- All major sections complete (not partial/WIP)

### How to Run

1. **For Specification Audit (Pass 1):**
   - Trigger: After spec.md complete
   - Invoke: Use cross-review skill (sonnet-4-6-think) with Pass 1 prompt
   - Input: Copy spec.md content into prompt as context
   - Output: Strengths, Gaps, Risks, Improvements

2. **For Planning Audit (Pass 2):**
   - Trigger: After plan.md complete
   - Invoke: Use cross-review skill (sonnet-4-6-think) with Pass 2 prompt
   - Input: Copy plan.md content (tasks table) into prompt
   - Output: Task order assessment, feasibility score, framework compliance

### Expected Turnaround
- ~3–5 min per pass
- Total cross-review: 6–10 min for both passes

---

## Incorporating Findings

### If Pass 1 (Spec) Identifies Major Gaps

**High Priority (block implementation):**
- Missing API endpoint definitions
- Incomplete data model (missing columns, relationships)
- Unspecified error handling for critical failures
- Unclear integration points

**Action:** Update spec.md before proceeding to Step 3 Planning.

### If Pass 2 (Plan) Identifies Major Risks

**High Priority (block implementation):**
- Circular dependencies between tasks
- Archival blocker not mitigated (Minimap)
- No clear verification command for task completion
- Framework non-compliance (missing gate linkage)

**Action:** Update plan.md before requesting CODEOWNER approval.

### If Both Passes Report Issues

**Sequence:**
1. Fix spec.md issues from Pass 1
2. Re-run Pass 1 on updated spec (quick verification)
3. Fix plan.md issues from Pass 2
4. Re-run Pass 2 on updated plan (quick verification)
5. Request CODEOWNER approval when both passes report minimal/no issues

---

## Approval Gate

**Before Implementation begins:**

- [ ] Pass 1 report received (Specification audit)
- [ ] Pass 1 findings incorporated into spec.md
- [ ] Pass 2 report received (Planning audit)
- [ ] Pass 2 findings incorporated into plan.md
- [ ] CODEOWNER approval obtained on final spec.md and plan.md
- [ ] No open issues flagged in either pass (or explicitly documented as deferred)

**Note:** "No open issues" does not mean zero findings — it means all findings have been addressed, documented, or explicitly deferred to a later phase.

---

## Success Criteria for Cross-Review

✅ **Process:**
- Both passes completed
- Findings documented in clear tables/lists
- Recommendations incorporated (or explicitly noted as deferred)

✅ **Output:**
- Spec.md strengthened with all High priority gaps closed
- Plan.md validated for feasibility and framework compliance
- Ready for CODEOWNER approval

✅ **Confidence:**
- Reviewer (sonnet-4-6-think) reports High confidence in feasibility
- No unmitigated blockers remain
- Implementation can proceed without additional clarification

---

*This template expires 2026-03-30. Reusable for all SDD workflows in Phase 9.*
