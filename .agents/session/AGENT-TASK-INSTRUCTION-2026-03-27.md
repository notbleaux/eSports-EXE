[Ver001.000]

# Agent Task Instructions — Session 2026-03-27 to 2026-03-30

**Tier:** WORK SESSION  
**Valid Until:** 2026-03-30T23:59:59Z  
**Audience:** Subagents executing Specification and Planning steps  
**Framework:** 2/3/5+1,2,3 scheme (Archival System and Minimap Feature)

---

## Your Role

You are a **Specification & Planning Agent** for either:
1. **Archival System** (ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md), OR
2. **Minimap Feature** (MINIMAP-FEATURE-WORKPLAN-2026-03-27.md)

**Your job:** Execute Steps 2–3 of the SDD workflow with full autonomy, using the workplan file as your primary reference.

---

## Step-by-Step Instructions

### Phase 1: Orientation

1. **Read your workplan file:**
   - If Archival: Read `ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md`
   - If Minimap: Read `MINIMAP-FEATURE-WORKPLAN-2026-03-27.md`

2. **Identify deliverables:**
   - **Specification deliverable:** spec.md or spec-minimap-feature.md
   - **Planning deliverable:** plan.md or plan-minimap-feature.md
   - **Output location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/` (same directory as requirements.md)

3. **Review context files:**
   - **requirements.md** — Full PRD for your feature
   - **AGENTS.md** — Project patterns and conventions
   - **MASTER_PLAN.md § Phase 9** — Current phase scope
   - **PHASE_GATES.md** — Gate numbering system you'll reference

4. **Confirm scope:**
   - You are executing Steps 2–3 only (Specification & Planning)
   - Step 4 (Implementation) happens afterward
   - Do NOT implement code during this session
   - Do NOT update gate status in PHASE_GATES.md (that's the master agent's job)

---

### Phase 2: Step 2 — Technical Specification

**Deliverable:** spec.md (or spec-minimap-feature.md)

**You must write:**

1. **Technical Context** (1 section)
   - Language, dependencies, framework (reference AGENTS.md)
   - No hand-waving; be specific (e.g., "Python 3.11+, FastAPI async, SQLAlchemy ORM")

2. **Implementation Approach** (1 section)
   - Design patterns you'll use
   - Reference existing code in codebase (link to files)
   - Async/await strategy, error handling strategy

3. **Source Code Structure** (1 section)
   - Directory layout (copy from workplan, don't guess)
   - File names and responsibilities
   - Module organization (what imports what)

4. **Data Model Integration** (1 section)
   - SQLAlchemy models (with relationships, indices, cascades)
   - Copy table structure from PRD (section 4)
   - Define indices for performance (query bottlenecks)
   - Specify soft delete strategy if applicable

5. **API Endpoint Design** (1 section)
   - All endpoints from requirements.md, fully specified:
     - Request schema (Pydantic)
     - Response schema (Pydantic)
     - Error cases (4xx, 5xx with explanations)
     - Auth requirements (public, admin, service principal)
   - Use table format for clarity

6. **Delivery Phases** (1 section)
   - Phase 1 MVP scope (explicitly bounded)
   - Phase 2 and Phase 3 deferred features
   - Reason for each phase boundary (MVP vs. nice-to-have)

7. **Verification Approach** (1 section)
   - Unit test strategy (what to test, not full test code)
   - Integration test strategy (cross-component workflows)
   - Lint/type/doc commands to run
   - E2E test coverage (for Minimap: Extraction→Archival→Frontend)

**Quality gates for Specification:**
- ✅ All 7 sections complete and substantial (not stubs)
- ✅ Every API endpoint from requirements.md mentioned at least once
- ✅ Reference 2–3 existing codebase files (show you understand patterns)
- ✅ Data model includes indices and constraints (not just columns)
- ✅ No hand-waving (every technical claim has a "why" and "how")
- ✅ Async/await applied throughout (no blocking I/O)

**Where to find examples:**
- FastAPI endpoints: `packages/shared/api/routers/players.py`, `packages/shared/api/routers/matches.py`
- SQLAlchemy models: `packages/shared/api/models/player.py`, `packages/shared/api/models/match.py`
- Pydantic schemas: `packages/shared/api/schemas/player.py`
- Async patterns: `packages/shared/api/services/` (async functions with httpx, asyncpg)

**Stop after Step 2:** Do NOT proceed to Step 3 until Specification is complete and you're ready for cross-review.

---

### Phase 3: Step 3 — Planning

**Deliverable:** plan.md (or plan-minimap-feature.md)

**You must write:**

1. **Task List** (table format, minimum 8 tasks for Archival, 11 for Minimap)
   - Each row: Task #, Title, Gate Ref, Dependencies, AC Links, Verification Command

2. **Gate References** (CRITICAL)
   - Every task references [Gate N.M] from PHASE_GATES.md
   - Format: [Gate 9.1], [Gate 9.2], etc.
   - If gate doesn't exist in PHASE_GATES.md, create it (consult master agent if unclear)
   - Gates must be sequential with no gaps

3. **Acceptance Criteria Links** (CRITICAL)
   - Every task links to specific AC criteria from requirements.md
   - Format: AC-01, AC-02, etc.
   - Example: Task 1 addresses "AC-01" + "AC-06"
   - All 18 AC criteria must be addressed by at least one task

4. **Dependencies** (CRITICAL)
   - Every task lists what must complete first
   - Format: "None" or "Task 1" or "Tasks 1–3"
   - Do NOT create circular dependencies
   - Identify parallel execution opportunities (tasks with no dependencies can run together)

5. **Verification Command** (CRITICAL)
   - Every task has a specific, executable command
   - Format: `pytest tests/integration/test_archive_frames.py` (not "run tests")
   - Command must be copy-pasteable and run without clarification
   - Example: `pytest tests/unit/test_archive_schemas.py && ruff check packages/shared/api/src/njz_api/archival/`

6. **Blocker Status** [Minimap only]
   - Mark Tasks 7–9 as "BLOCKED ON ARCHIVAL"
   - Mitigation: Mock Archival API for Tasks 6–7 testing; swap real API when ready
   - ETA: Check ARCHIVAL-SYSTEM-WORKPLAN for Archival completion date

**Quality gates for Plan:**
- ✅ Every task has [Gate N.M] reference
- ✅ Every task links to AC criteria (AC-XX format)
- ✅ Every task has dependencies listed (None or Task X)
- ✅ Every task has executable verification command (not generic "test it")
- ✅ All 18 AC criteria covered by at least one task
- ✅ [Minimap only] Archival blocker explicitly marked and mitigated
- ✅ Critical path visible (parallel execution identified)

**Where to find gate numbers:**
- Existing gates: `.agents/PHASE_GATES.md` (look for Phase 9 section)
- New gates: Coordinate with master agent (but don't block on this; create and flag if needed)

**Task scope guidance (rule of thumb):**
- Too small: "Add validate() function" — combine with related tasks
- Too large: "Implement entire FastAPI router" — break into upload, query, pin, gc
- Right size: "Implement FrameUpload endpoint + validation tests" — coherent unit

**Stop after Step 3:** Do NOT proceed to Implementation until Planning is complete and cross-reviewed.

---

## Cross-Review Process

**After completing both Specification and Planning:**

1. **Read CROSS-REVIEW-TEMPLATE-2026-03-27.md** for audit framework

2. **Run Pass 1 (Specification Audit):**
   - Use cross-review skill with sonnet-4-6-think
   - Follow Pass 1 prompt in template
   - Receive: Strengths, Gaps, Risks, Improvements
   - Action: Update spec.md to address High priority gaps

3. **Run Pass 2 (Planning Audit):**
   - Use cross-review skill with sonnet-4-6-think
   - Follow Pass 2 prompt in template
   - Receive: Task order assessment, feasibility score, framework compliance
   - Action: Update plan.md to address High priority risks or framework issues

4. **Incorporate findings:**
   - Are gaps/risks addressed? Mark resolved
   - Are improvements applied? Integrate into spec/plan
   - Are deferred items documented? Explain why Phase 2

5. **Flag for CODEOWNER approval:**
   - Return both files (spec.md, plan.md) to master agent
   - Include summary of cross-review findings and resolutions
   - Wait for explicit approval before Implementation

---

## Framework Integration: 2/3/5+1,2,3

You MUST apply the project's governance framework throughout:

### 2 Auth Classes
- **AGENT** (you): Read/write code, create/update spec/plan, run tests, mark TODOs, create PRs
- **CODEOWNER**: Approve critical PRs (like final spec/plan), unlock phases

**Your job:** Produce spec/plan that CODEOWNER can confidently approve.

### 3 Tiers (Simplified from 4)
- **MASTER:** Contracts, data models, API boundaries (from requirements.md)
- **PHASE:** Gate-linked specs and plans (this workplan)
- **WORK SESSION:** Ephemeral notes, cross-review findings (this session only)

**Your job:** Reference MASTER contracts in spec, link all tasks to PHASE gates in plan.

### 5 Pillars

| Pillar | Your Responsibility |
|--------|---------------------|
| **Road-Maps** | Link every task to a PHASE_GATES.md gate number |
| **Logic Trees** | Document task dependencies clearly (no circular deps) |
| **ACP (Agent Coordination)** | Coordinate with Archival agent if Minimap; use shared files |
| **MCP (Master Context)** | Reference MASTER contracts (data model, API boundaries) |
| **Notebook/TODO** | Track your progress; this workplan IS your TODO |

### +3 Bonus Improvements
- **.doc-registry.json:** Reference archive query routing (Minimap context lookup)
- **DOSSIER_CREATION_TEMPLATE.md:** Archive your session findings in Phase 9 closure
- **FILTER_RULES.md:** Use tag-based filtering to reference related archived work

---

## Decision Framework: When to Ask vs. Assume

**You have autonomy to make technical decisions.** Use this framework:

### If spec/plan is unclear on a detail:

| Scenario | Decision |
|----------|----------|
| API error handling (500 vs 503 for S3 failure) | Check requirements.md; assume reasonable default if not specified |
| Data model column (nullable vs. required) | Assume required unless PRD says optional |
| Task scope (one big task vs. three small) | Size for ~2–4 hour implementation (not too granular, not too broad) |
| Integration order (A then B, or B then A) | Assume minimal dependencies; document why if order matters |
| Test framework (pytest vs. unittest) | Follow existing codebase (check packages/shared/api/tests/) |

**If you're stuck:** Document the assumption in your spec/plan and note for cross-review. Don't block yourself.

---

## File Locations & Navigation

| File | Purpose | Location | When to Read |
|------|---------|----------|---|
| Your Workplan | Context + deliverable outline | `.agents/session/` | Start here |
| requirements.md | Full PRD (approved) | `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/` | Reference during spec |
| AGENTS.md | Project patterns, code style | Root directory | Reference for patterns |
| MASTER_PLAN.md § Phase 9 | Phase scope + context | Root directory | Reference for phase scope |
| PHASE_GATES.md | Gate numbering, current status | `.agents/` | Reference for gate numbers |
| packages/shared/api/ | Example code (FastAPI, SQLAlchemy, Pydantic) | `packages/shared/api/` | Reference for patterns |
| CROSS-REVIEW-TEMPLATE | Audit framework | `.agents/session/` | Use after spec/plan complete |

---

## Communication Checkpoints

**You should report back to the master agent:**

1. **After Step 2 (Specification complete):**
   - "Specification complete. spec.md ready for cross-review."
   - Include 1–2 sentence summary of key design decisions

2. **After Step 3 (Planning complete):**
   - "Planning complete. plan.md ready for cross-review."
   - Include task count and critical path summary

3. **After Cross-Review (findings incorporated):**
   - "Cross-review complete. spec.md and plan.md updated."
   - Summary of findings and resolutions
   - Any items deferred to Phase 2 with justification

4. **Ready for CODEOWNER approval:**
   - "Files ready for CODEOWNER approval. No unresolved issues."
   - Or flag remaining issues (acceptable and documented)

---

## Success Criteria for Your Work

✅ **Specification (spec.md):**
- All 7 sections complete
- Every API endpoint from requirements.md mentioned
- Reference 2+ existing codebase patterns
- Data model includes indices, constraints, relationships
- Async/await throughout (no blocking I/O)

✅ **Planning (plan.md):**
- 8+ tasks (Archival) or 11+ tasks (Minimap)
- Every task has [Gate N.M] reference
- Every task links to AC criteria
- Every task has dependencies listed
- Every task has executable verification command
- All 18 AC criteria addressed
- [Minimap] Archival blocker mitigated

✅ **Cross-Review:**
- Both passes completed
- Findings documented
- High priority gaps/risks addressed
- Ready for CODEOWNER approval

---

## Tips for Success

1. **Reference, don't invent:** Copy code patterns from existing codebase, don't design from scratch
2. **Be specific:** "Use Pydantic v2 with Field validators" beats "add validation"
3. **Link everything:** Every task to a gate, every task to AC criteria, every gate to a verification command
4. **Identify critical path:** Mark tasks that block others; show parallel execution opportunities
5. **Use templates:** Copy table/section structure from workplan; fill in details
6. **Assume reasonably:** Make technical calls and document assumptions for cross-review
7. **Stop at boundaries:** Spec stops before implementation; plan stops before code

---

## Questions?

**You have full autonomy.** If clarification needed mid-spec/plan:
- Document the question in your work
- Flag it for cross-review
- Do not block yourself waiting for an answer

Example note in spec.md:
```
**ASSUMPTION (Q for cross-review):** Using offset-based pagination for frame queries 
(cursor-based pagination deferred to Phase 2 optimization). Reasoning: MVP simplicity; 
re-evaluate if query performance <500ms P99 target is not met.
```

---

*This instruction set expires 2026-03-30. Follow AGENT_CONTRACT.md and MASTER_PLAN.md for updates.*
