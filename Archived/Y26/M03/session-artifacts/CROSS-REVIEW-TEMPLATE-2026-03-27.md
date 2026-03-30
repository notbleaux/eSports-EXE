[Ver001.000]

# Cross-Review Framework & Template — Phase 9

**Tier:** WORK SESSION  
**Valid Until:** 2026-03-30T23:59:59Z  
**Framework:** NJZPOF v0.2 · 2/3/5+1,2,3 compliance  
**Audience:** Cross-review subagents using sonnet-4-6-think model

---

## Overview

This template provides a two-pass cross-review framework for auditing Technical Specifications (Pass 1) and Implementation Plans (Pass 2) against framework criteria.

**Key principle:** Cross-review is READ-ONLY and advisory. Reviewers do not edit or execute code. They identify gaps, risks, and improvements. Agents decide what to fix.

---

## Pass 1: Technical Specification Audit

**Trigger:** After spec.md or spec-minimap-feature.md is drafted (Step 2 complete)

**Deliverable:** spec.md (to be reviewed)

**Audit Criteria** (using 2/3/5+1,2,3 framework):

### Correctness Dimension

- [ ] **Technical facts accurate** — Does the spec correctly describe FastAPI, SQLAlchemy, async patterns, etc.?
- [ ] **Code examples valid** — Would the Pydantic schema, SQLAlchemy model, API endpoint actually work as written?
- [ ] **Existing codebase references valid** — Do cited patterns (e.g., packages/shared/api/routers/players.py) actually exist and match the description?
- [ ] **Dependencies exist** — Are all required packages (FastAPI, SQLAlchemy, Pydantic) specified with correct versions?

### Completeness Dimension

- [ ] **All 7 sections present** — Context, Approach, Structure, Data Model, API, Phases, Verification
- [ ] **All endpoints covered** — Every API endpoint from requirements.md mentioned at least once
- [ ] **All acceptance criteria referenced** — AC-01 through AC-18 (or appropriate range) each explicitly mentioned
- [ ] **Data model complete** — All tables, columns, indices, constraints defined (not left as "[AGENT: fill in]")
- [ ] **Verification strategy clear** — Tests, linters, type checkers, E2E all specified

### Industry Standards Dimension

- [ ] **Async/await applied throughout** — No blocking I/O (no requests library, no sync file ops, no time.sleep)
- [ ] **Error handling explicit** — 4xx and 5xx cases mapped to specific error conditions
- [ ] **Security patterns applied** — Auth requirements documented, sensitive data (JWT) not logged, secrets not hardcoded
- [ ] **Performance considerations** — Indices defined for query bottlenecks, caching strategy documented, pagination specified
- [ ] **Testing strategy sound** — Unit, integration, E2E coverage defined with realistic assertions

### Integration Dimension

- [ ] **Framework compliance** — Spec aligns with 2/3/5+1,2,3 principles (gates referenced, tiers respected, pillars applied)
- [ ] **Existing patterns followed** — Spec mirrors code style from AGENTS.md + existing packages/shared/api/
- [ ] **Cross-component handoff clear** — Integration points with other services (e.g., Archival → Minimap) documented
- [ ] **MASTER contracts honored** — Data model matches requirements.md exactly, API boundaries respected

### Gaps & Risks

- [ ] **Missing details** — What's not covered that should be? (e.g., retry logic, timeout values, monitoring)
- [ ] **Design risks** — Are there potential failure modes? (e.g., race conditions, cascade delete issues)
- [ ] **Dependency risks** — Does spec assume external services (S3, TeneT) that might not be ready?
- [ ] **Phase boundary clarity** — MVP vs. Phase 2+ scope explicitly bounded? Or could agent accidentally implement Phase 2 features?

### Alternatives Assessed

- [ ] **Storage abstraction choice** — Why Protocol vs. ABC? Is this explained?
- [ ] **Pagination strategy** — Offset-based vs. cursor-based? Rationale documented?
- [ ] **Caching layer** — Redis vs. in-memory vs. client-side only? Tradeoffs discussed?
- [ ] **Data deduplication approach** — SHA-256 full hash vs. perceptual? Why this choice?

---

## Pass 2: Implementation Plan Audit

**Trigger:** After plan.md or plan-minimap-feature.md is drafted (Step 3 complete)

**Deliverable:** plan.md (to be reviewed)

**Audit Criteria** (using 2/3/5+1,2,3 framework):

### Task Decomposition

- [ ] **Appropriate granularity** — Tasks are sized for ~1–2 day implementation (not 1-hour micro-tasks, not 5-day epics)
- [ ] **Coherent units** — Each task delivers a complete, testable piece (not half-implemented features)
- [ ] **No overlap** — Tasks don't duplicate work; clear boundaries between them
- [ ] **Completeness** — All work from spec.md mapped to at least one task; nothing left unimplemented

### Dependency Ordering

- [ ] **Acyclic graph** — No circular dependencies (Task A depends on B depends on A)
- [ ] **Minimal prerequisites** — Each task only depends on what it truly needs (not over-constrained)
- [ ] **Critical path identified** — Longest sequential chain clearly marked
- [ ] **Parallel opportunities** — Tasks that can run in parallel explicitly noted (for multi-agent execution)

### Gate Linkage

- [ ] **Every task has [Gate N.M]** — PHASE_GATES.md gate number referenced for each task
- [ ] **Gates sequential** — No gaps in numbering; gates are in ascending order
- [ ] **Gate uniqueness** — No two tasks share a gate number
- [ ] **Gate existence** — All referenced gates actually exist in PHASE_GATES.md (or flagged as new)

### Acceptance Criteria Mapping

- [ ] **All AC addressed** — AC-01 through AC-18 (or correct range) each linked to at least one task
- [ ] **No redundant AC** — No AC addressed by every task; AC are appropriately distributed
- [ ] **AC description clarity** — Each task's AC link explains what that AC means in task context

### Verification Commands

- [ ] **All commands executable** — Can copy-paste each verification command into bash and run (not pseudocode)
- [ ] **Commands complete** — Include all necessary flags (e.g., `-v` for pytest verbose, `--strict` for mypy)
- [ ] **Commands deterministic** — Return same pass/fail every time (not flaky)
- [ ] **Clear pass/fail** — Expected output documented (e.g., "pytest returns ✅ all tests pass")

### Feasibility

- [ ] **Timeline realistic** — Can all tasks complete within Phase 9 timeframe (2026-03-27 to 2026-03-30)?
- [ ] **Resource availability** — Do tasks require unavailable resources? (e.g., S3 availability for Phase 1 MVP)
- [ ] **Skill match** — Can agents executing these tasks reasonably do the work? (not asking for ML model training in Phase 1)
- [ ] **Blocker management** — Are blockers (e.g., Minimap blocked on Archival) explicitly documented with mitigation?

### Framework Compliance

- [ ] **2 Auth Classes** — AGENT (executes) vs. CODEOWNER (approves) roles clear
- [ ] **3 Tiers** — MASTER (contracts) vs. PHASE (gates) vs. WORK SESSION (tasks) properly separated
- [ ] **5 Pillars:**
  - Road-Maps: Gate references ✅
  - Logic Trees: Dependencies documented ✅
  - ACP: Handoff format clear ✅
  - MCP: Data model from MASTER references ✅
  - Notebook/TODO: Session tracking enabled ✅
- [ ] **+3 Bonus:** .doc-registry, dossier, filter rules referenced (if applicable)

### Missing Details & Risks

- [ ] **Technical risks** — What could go wrong? (e.g., migration rollback, cascade delete issues)
- [ ] **Timeline risks** — Which tasks are on the critical path? What if they slip?
- [ ] **Integration risks** — Are there cross-feature dependencies? (e.g., Minimap on Archival)
- [ ] **Testing risks** — Are integration tests sufficient? Are edge cases covered?

### Suggested Improvements

- [ ] **Task consolidation** — Any tasks that should be merged (too granular)?
- [ ] **Task splitting** — Any tasks that should be split (too broad)?
- [ ] **Sequence optimization** — Any tasks that could be parallelized for speed?
- [ ] **Verification strengthening** — Are verification commands comprehensive enough?

---

## Cross-Review Invocation Template

Use this prompt when spawning a cross-review subagent:

```
You are a code review agent. Review the spec/plan below using the cross-review framework.

MODEL: sonnet-4-6-think (or user-specified)

SPEC/PLAN TO REVIEW:
[Full spec.md or plan.md pasted here]

AUDIT CRITERIA:
[Insert Pass 1 or Pass 2 criteria checklist above]

FRAMEWORK REFERENCE:
2/3/5+1,2,3: 2 auth classes · 3 tiers · 5 pillars · +3 bonus

REVIEW OUTPUT FORMAT:
1. **Correctness** — Issues with technical accuracy
2. **Completeness** — Missing sections, endpoints, AC
3. **Standards** — Code quality, security, performance alignment
4. **Integration** — Cross-component fit, framework compliance
5. **Gaps & Risks** — MEDIUM/LOW severity issues
6. **Alternatives** — Were design choices justified?
7. **Suggested Improvements** — NICE-TO-HAVE enhancements
8. **VERDICT** — PASS / PASS WITH NOTES / NEEDS REVISION

Provide findings in this exact format. Do not edit files or execute commands.
```

---

## Response Processing

After cross-review returns findings:

### If VERDICT = PASS
✅ Proceed to next step (Step 3 for specs, Step 4 implementation for plans)

### If VERDICT = PASS WITH NOTES
⚠️ Review findings, incorporate high-priority notes, re-submit if major items added

### If VERDICT = NEEDS REVISION
❌ Address findings, update spec/plan, re-submit for review

---

## Framework Integration

**Tier:** This template is WORK SESSION tier (expires 2026-03-30)

**Related Files:**
- AGENT-TASK-INSTRUCTION-2026-03-27.md — Instruction framework
- ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md — Archival workplan
- MINIMAP-FEATURE-WORKPLAN-2026-03-27.md — Minimap workplan
- spec.md, plan.md — Archival spec/plan (to be reviewed)
- spec-minimap-feature.md, plan-minimap-feature.md — Minimap spec/plan (to be reviewed)

**PHASE_GATES.md Integration:**
After cross-review PASS (either verdict), update PHASE_GATES.md:
- Phase 9, Steps 2–3 status → ✅ SPECIFICATION COMPLETE
- Link to spec.md and plan.md in gate metadata

---

*This template expires 2026-03-30. After this date, re-read MASTER_PLAN.md for current phase context.*
