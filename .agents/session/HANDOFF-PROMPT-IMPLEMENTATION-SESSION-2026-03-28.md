[Ver001.000]

# Phase 9 Implementation Session — Handoff Prompts & Orchestration

**Date Prepared:** 2026-03-28  
**Valid For:** Next ZenCoder chat session (begins ~2026-03-28/29)  
**Session Duration:** ~3 days (until 2026-03-31)  
**Framework:** NJZPOF v0.2 · 2/3/5+1,2,3 · Parallel dual-feature execution

---

## Session Overview

**Two features to implement in parallel:**
1. **Archival System** (prerequisite blocker for Minimap)
2. **Minimap Feature** (blocked on Archival for Tasks 7–9)

**Strategy:**
- Spawn 2 subagents in parallel (one per feature)
- Archival agent: Execute Tasks 1–8 (Gates 9.1–9.8) sequentially
- Minimap agent: Execute Tasks 1–6 (Gates 9.9–9.14) in parallel, then defer Tasks 7–9 until Archival ready
- Master agent orchestrates gate updates + blocker management

**Expected outcome:**
- Archival System: 6–8 days (all 8 tasks complete)
- Minimap Feature: Tasks 1–6 complete by day 3–4, Tasks 7–9 deferred until Archival ready (~2026-03-31)
- All code committed, tests green, CODEOWNER approved

---

## Sequence of Handoff Prompts

**PROMPT 1 (ARCHIVAL):** Spawn at session start → Implement Archival System Tasks 1–8  
**PROMPT 2 (MINIMAP):** Spawn at session start → Implement Minimap Feature Tasks 1–6  
**DECISION GATE (Day 3–4):** Assess Archival readiness; greenlight Minimap Tasks 7–9 or defer  
**PROMPT 3 (MINIMAP CONTINUATION):** If Archival ready, spawn for Tasks 7–9; else plan Phase 9 continuation

---

## PROMPT 1: Archival System Implementation Agent

```
SESSION: Phase 9 Implementation — Archival System
AGENT ROLE: Implementation Agent (Coding)
FEATURE: Minimap Archival System (prerequisite blocker)
TASK ALLOCATION: Tasks 1–8 ([Gate 9.1]–[Gate 9.8])
FRAMEWORK: NJZPOF v0.2 · 2/3/5+1,2,3 compliance

═════════════════════════════════════════════════════════

# Your Mission

Implement the complete Minimap Archival System (backend only, no frontend). 

**Deliverables:**
- 8 concrete implementation tasks, each verified and gate-marked PASSED
- All 18 acceptance criteria addressed and verified
- FastAPI service with 12 endpoints, PostgreSQL backend, async-first architecture
- Test suite with >80% coverage, all linting/type checks passing
- Production-ready code committed to main branch

**Timeline:** 6–8 days  
**Critical Path:** Task 1 → Task 4 → Task 5 → Task 8

═════════════════════════════════════════════════════════

# Quick Start (5 minutes)

## Step 1: Read Orientation Docs (in order)

1. **AGENT-TASK-INSTRUCTION-2026-03-27.md** — Master instruction set
   - Read: Sections "Your Role", "Phase 2: Step 2 — Technical Specification" through "Phase 3: Step 3 — Planning"
   - Time: 15 minutes
   - Purpose: Understand the SDD workflow and your role in Steps 4 (Implementation)

2. **ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md** — Your feature context
   - Read: Entire document (feature overview, requirements summary, file references)
   - Time: 10 minutes
   - Purpose: Understand what you're building and why

3. **spec.md** (from prior session) — Technical specification
   - Read: All 7 sections (context, approach, structure, data model, API, phases, verification)
   - Time: 20 minutes
   - Purpose: Understand HOW to implement (patterns, design decisions)

4. **plan.md** (from prior session) — Implementation plan
   - Read: Task table + your assigned tasks (Tasks 1–8, Gates 9.1–9.8)
   - Time: 10 minutes
   - Purpose: Understand WHAT to build (task sequence, dependencies, acceptance criteria)

**Total orientation time:** ~55 minutes

## Step 2: Confirm Prerequisites

Before starting Task 1, verify:

```bash
# Are you in the project root?
pwd  # should show /path/to/eSports-EXE

# Do you have the required tools?
python --version  # should be 3.11+
pip show fastapi sqlalchemy pydantic  # all must be installed
which alembic  # Alembic must be available

# Can you reach the database?
psql -U postgres -c "SELECT 1"  # successful connection

# Can you run tests?
pytest --version  # should show pytest X.Y.Z
```

If any check fails: **STOP and report blocker to master agent**

## Step 3: Get Task Execution Ready

Download and familiarize yourself with:
- **TASK-EXECUTION-STUB-2026-03-27.md** — Your task execution protocol
- **VERIFICATION-CHECKLIST-STUB-2026-03-27.md** — Your verification protocol

These are your "how-to" guides for implementing and validating each task.

## Step 4: Start Task 1

Begin immediately with Task 1 (PostgreSQL migration + SQLAlchemy models).

```
Next step: Execute TASK 1
Gate reference: [Gate 9.1]
Entry point: Read plan.md § Task 1 (PostgreSQL migration...)
Execute: Follow TASK-EXECUTION-STUB phases 1–7
Complete: When VERIFICATION-CHECKLIST shows all green
Report: Update plan.md Task 1 status + notify master agent
```

═════════════════════════════════════════════════════════

# Task Execution Protocol

## For Each Task (1–8)

```
1. READ (5 min)
   └─ Open plan.md, locate Task N
   └─ Read full task details (purpose, approach, files)
   └─ Read corresponding spec.md section
   └─ Check dependencies: Are prerequisite tasks PASSED?

2. SETUP (5 min)
   └─ Create files (touch packages/shared/api/.../file.py)
   └─ Update imports (__init__.py exports)
   └─ Verify imports resolve (python -c "from njz_api import ...")

3. IMPLEMENT (1–2 hours)
   └─ Write code following spec.md patterns
   └─ Use AGENTS.md code style conventions
   └─ Reference existing packages/shared/api/ code for patterns
   └─ No hardcoded secrets; use environment variables
   └─ No blocking I/O (all async)

4. VERIFY (10 min)
   └─ Run verification command (copy from plan.md)
   └─ Capture output
   └─ Cross-check against VERIFICATION-CHECKLIST-STUB

5. RESOLVE (varies)
   └─ If verification PASSED: Continue to step 6
   └─ If verification FAILED: Fix code, re-run verification
   └─ Repeat until all green

6. CLEANUP (5 min)
   └─ Delete any STUB files created for this task
   └─ Verify production files in place
   └─ Ensure no broken imports

7. REPORT (5 min)
   └─ Log completion: "✅ Task 1 COMPLETE"
   └─ Include verification output
   └─ Notify master agent
```

═════════════════════════════════════════════════════════

# Blocker & Assumption Management

## If Blocked

```
BLOCKED: Task N depends on Task M, which is not yet PASSED
└─ Check plan.md: Is Task M dependency actually required?
└─ Check PHASE_GATES.md: What's Task M current status?
└─ If Task M still PENDING: Skip Task N, proceed to next unblocked task
└─ If Task M PASSED but imports broken: Debug + escalate to master agent
└─ Log blocker with timestamp + reason for master agent
```

## If Assumption Needed

```
ASSUMPTION: spec.md says "X" but doesn't detail "Y"
└─ Document assumption in code comment:
   # ASSUMPTION: Using offset-based pagination; cursor-based deferred to Phase 2
   # Reason: MVP simplicity; re-evaluate if query P99 < 500ms target not met
└─ Add task note: "Assumption documented in code"
└─ Master agent may ask for clarification; be ready to explain
```

═════════════════════════════════════════════════════════

# Success Criteria

✅ **Session Complete when:**

- [ ] All 8 tasks implemented (Task 1 → Task 8)
- [ ] All 18 acceptance criteria verified and passing
- [ ] All verification commands return green (pytest, ruff, mypy)
- [ ] Code coverage >= 80% for archival module
- [ ] No type errors (mypy --strict clean)
- [ ] No linting violations (ruff clean)
- [ ] All gates [9.1]–[9.8] marked ✅ PASSED in PHASE_GATES.md
- [ ] plan.md updated with task completion status
- [ ] Code committed to main branch (or PR ready)
- [ ] CODEOWNER approval obtained for PR

═════════════════════════════════════════════════════════

# Key File Locations

| File | Purpose | Location |
|------|---------|----------|
| spec.md | Your design reference | `.zencoder/chats/7c813362-.../spec.md` |
| plan.md | Your task list | `.zencoder/chats/7c813362-.../plan.md` |
| TASK-EXECUTION-STUB | Your execution guide | `.agents/session/TASK-EXECUTION-STUB-...` |
| VERIFICATION-CHECKLIST-STUB | Your validation guide | `.agents/session/VERIFICATION-CHECKLIST-STUB-...` |
| AGENTS.md | Code patterns + conventions | Root directory |
| PHASE_GATES.md | Gate status (read & update) | `.agents/` |
| packages/shared/api/ | Where to implement | Source code |

═════════════════════════════════════════════════════════

# Questions?

If you get stuck:

1. **Is spec.md unclear?** → Document assumption, proceed
2. **Does verification fail?** → Use VERIFICATION-CHECKLIST failure triage
3. **Is a task blocked?** → Log blocker, skip to next task
4. **Is something not in spec.md or plan.md?** → Escalate to master agent

Master agent is available for guidance but autonomy is expected.

═════════════════════════════════════════════════════════

# Begin Now

**Next action:** Read AGENT-TASK-INSTRUCTION-2026-03-27.md § "Your Role"

You have all the context you need. Start Task 1 implementation immediately.

Good luck! 🚀
```

---

## PROMPT 2: Minimap Feature Implementation Agent

```
SESSION: Phase 9 Implementation — Minimap Feature (Backend + Frontend)
AGENT ROLE: Implementation Agent (Full-Stack)
FEATURE: Minimap Extraction Service + Frontend UI
TASK ALLOCATION: Tasks 1–6 ([Gate 9.9]–[Gate 9.14]) immediately; Tasks 7–9 deferred
FRAMEWORK: NJZPOF v0.2 · 2/3/5+1,2,3 compliance
BLOCKER: Tasks 7–9 depend on Archival System (parallel track, not your blocker)

═════════════════════════════════════════════════════════

# Your Mission

Implement the Minimap Extraction Service (backend) and Frame Grid UI (frontend) 
with mock Archival API integration. Your work unblocks ROTAS/OPERA hub UI features.

**Deliverables (Phase 1):**
- Tasks 1–6: Extraction pipeline, React UI, TanStack Query hook (all with mock Archival)
- All extraction + UI acceptance criteria verified
- Test suite: backend + frontend tests >80% coverage
- Mock Archival API sufficient for dev/test
- Production-ready code committed

**Deliverables (Phase 2, deferred):**
- Tasks 7–9: Real Archival API integration (when Archival System complete)

**Timeline:** Tasks 1–6 = 3–4 days; Tasks 7–9 deferred until Archival ready (~2026-03-31)  
**Critical Path:** Task 1 → Task 2 → Task 4 → Task 5

**CRITICAL BLOCKER:** Tasks 7–9 require Archival API endpoints to be deployed + tested.
Mitigation: Use MockArchivalAPI (in-memory) for Tasks 1–6; swap real API when Archival ready (<2 hours).
See TASK-EXECUTION-STUB § "Blocker & Assumption Management" for mitigation strategy.

═════════════════════════════════════════════════════════

# Quick Start (5 minutes)

## Step 1: Read Orientation Docs (in order)

1. **AGENT-TASK-INSTRUCTION-2026-03-27.md** — Master instruction set
   - Read: Full document
   - Time: 20 minutes
   - Purpose: Understand SDD workflow + full-stack implementation expectations

2. **MINIMAP-FEATURE-WORKPLAN-2026-03-27.md** — Your feature context
   - Read: Entire document (pay attention to CRITICAL BLOCKER section)
   - Time: 15 minutes
   - Purpose: Understand feature scope + blocker mitigation strategy

3. **spec-minimap-feature.md** (from prior session) — Technical specification
   - Read: All 8 sections (context, extraction service, React component, data model, API, hooks/components, phases, verification)
   - Time: 25 minutes
   - Purpose: Understand extraction pipeline + React component design

4. **plan-minimap-feature.md** (from prior session, GATES CORRECTED) — Implementation plan
   - Read: Task table + your assigned tasks (Tasks 1–6, Gates 9.9–9.14)
   - Time: 15 minutes
   - Purpose: Understand task sequence, dependencies, blocker status

**Total orientation time:** ~75 minutes

## Step 2: Confirm Prerequisites

Before starting Task 1, verify:

```bash
# Project root?
pwd  # should show /path/to/eSports-EXE

# Backend tools?
python --version  # 3.11+
pip show fastapi opencv-python ffmpeg-python  # all installed

# Frontend tools?
node --version  # 18+
npm list react tailwindcss  # all present
pnpm --version  # or npm/yarn

# Database?
psql -U postgres -c "SELECT 1"  # connection works

# Tests?
pytest --version  # pytest available
npm run test  # React tests available
```

If any check fails: **STOP and report to master agent**

## Step 3: Understand the Blocker

**Critical constraint:**
- Tasks 7–9 (Extraction → Archival integration) depend on Archival API being deployed
- Archival System agent is running in parallel (same session)
- Archival estimated completion: ~2026-03-31 (3–4 days)
- **Your decision:** Proceed with Tasks 1–6 using MockArchivalAPI now

**Mock Archival Strategy:**
```python
# In tasks/extraction/mock_archival_client.py
class MockArchivalAPI:
    async def upload_frames(self, frames: List[bytes]) -> str:
        # In-memory store, return manifest_id
        return f"manifest_{time.time()}"
    
    async def query_frames(self, match_id: UUID, page: int):
        # Return mock frame list
        return [{"id": ..., "content_hash": ..., "timestamp_ms": ...}]

# Use this until real Archival API ready, then:
# - Replace MockArchivalAPI instantiation with httpx client to real API
# - Change 1 import, swap <2 hours complete
# - All other code unchanged
```

See TASK-EXECUTION-STUB § "Blocker & Assumption Management" for full strategy.

## Step 4: Start Task 1

Begin immediately with Task 1 (PostgreSQL extraction_jobs table).

```
Next step: Execute TASK 1
Gate reference: [Gate 9.9]
Entry point: Read plan-minimap-feature.md § Task 1
Execute: Follow TASK-EXECUTION-STUB phases 1–7
Complete: When VERIFICATION-CHECKLIST shows all green
Report: Update plan-minimap-feature.md + notify master agent
```

═════════════════════════════════════════════════════════

# Task Execution Protocol

## For Each Task (1–6)

Follow the same 7-phase protocol as Archival agent:

```
1. READ (spec.md + plan.md)
2. SETUP (files + imports)
3. IMPLEMENT (code following patterns)
4. VERIFY (run verification command)
5. RESOLVE (fix failures)
6. CLEANUP (delete STUB files)
7. REPORT (log completion)
```

**Special note for Tasks 5–6 (Frontend):**
- Follow React 18 + TypeScript + Tailwind patterns from apps/web/src/hub-*/ directories
- Use TanStack Query hooks pattern from existing codebase (usePlayers, useTeams, etc.)
- Mock data setup should mirror Archival response shape exactly (easier swap later)

═════════════════════════════════════════════════════════

# Blocker Decision Gate (Day 3–4)

**On or before 2026-03-31 (Day 3–4 of session):**

Master agent will check:
- [ ] Archival System Tasks 5–6 (Archival API endpoints) PASSED?
- [ ] Can you deploy Archival API to test environment?
- [ ] Are endpoints available at http://localhost:8000/v1/archive/? (if local) or staging URL?

**If YES (Archival ready):**
→ Master agent will notify you: "Archival API READY for integration"  
→ Receive PROMPT 3 (Minimap Tasks 7–9 continuation)  
→ Swap mock → real API (1–2 hours) + proceed with Tasks 7–9

**If NO (Archival delayed):**
→ Master agent will notify you: "Archival API not ready; defer Tasks 7–9"  
→ Continue polish on Tasks 1–6 (expand tests, optimize performance, add edge cases)  
→ Plan Phase 9 continuation session for Tasks 7–9 (after Archival complete)

═════════════════════════════════════════════════════════

# Success Criteria

✅ **By End of Session:**

- [ ] Tasks 1–6 implemented + verified (all green)
- [ ] All extraction + UI acceptance criteria passing
- [ ] Backend tests >80% coverage
- [ ] Frontend snapshot tests passing
- [ ] React component TanStack Query integration verified
- [ ] Mock Archival API working in-memory
- [ ] All gates [9.9]–[9.14] marked ✅ PASSED
- [ ] Code ready for PR + CODEOWNER approval

**IF Archival ready by 2026-03-31:**
- [ ] ALSO complete Tasks 7–9 (per PROMPT 3)
- [ ] Swap mock → real API, all integration tests passing
- [ ] All gates [9.15]–[9.17] marked ✅ PASSED

**IF Archival delayed past 2026-03-31:**
- [ ] Document blockers + mitigation in session log
- [ ] Plan Phase 9 continuation for Tasks 7–9
- [ ] Ensure Tasks 1–6 are production-ready (no rework needed)

═════════════════════════════════════════════════════════

# Key File Locations

| File | Purpose | Location |
|------|---------|----------|
| spec-minimap-feature.md | Your design reference | `.zencoder/chats/.../spec-minimap-feature.md` |
| plan-minimap-feature.md | Your task list | `.zencoder/chats/.../plan-minimap-feature.md` |
| TASK-EXECUTION-STUB | Your execution guide | `.agents/session/TASK-EXECUTION-STUB-...` |
| VERIFICATION-CHECKLIST-STUB | Your validation guide | `.agents/session/VERIFICATION-CHECKLIST-STUB-...` |
| apps/web/src/hub-2-rotas/ | Existing ROTAS hub code (reference) | Source |
| apps/web/src/hub-4-opera/ | Existing OPERA hub code (reference) | Source |
| packages/shared/api/ | Backend extraction service | Source |

═════════════════════════════════════════════════════════

# Questions?

Same troubleshooting as Archival agent (see above).

Additional:
- **Mock Archival API design unclear?** → Reference packages/shared/api/services/ mocking patterns
- **React component structure unclear?** → Reference apps/web/src/components/ existing components
- **TanStack Query hook not sure?** → Reference apps/web/src/hooks/usePlayer* existing hooks

═════════════════════════════════════════════════════════

# Begin Now

**Next action:** Read AGENT-TASK-INSTRUCTION-2026-03-27.md § "Your Role"

You have all context. Start Task 1 immediately.

Let's ship it! 🚀
```

---

## PROMPT 3: Minimap Feature — Tasks 7–9 Continuation (conditional, if Archival ready)

```
[This prompt is generated by master agent if/when Archival System API is deployment-ready]

SESSION: Phase 9 Continuation — Minimap Feature Tasks 7–9
AGENT ROLE: Implementation Agent (Full-Stack)
FEATURE: Minimap Extraction + Archival Integration
TASK ALLOCATION: Tasks 7–9 ([Gate 9.15]–[Gate 9.17])
PREREQUISITE: Archival System (all tasks) COMPLETE + API deployed to staging
FRAMEWORK: NJZPOF v0.2

═════════════════════════════════════════════════════════

# Blocker Resolution: Tasks 7–9 Now Unblocked

Archival System is COMPLETE. API endpoints are deployed and tested:
- ✅ POST /v1/archive/frames (batch upload)
- ✅ GET /v1/archive/matches/{match_id}/frames (query)
- ✅ POST /v1/archive/frames/{id}/pin (pinning)

**Your mission:** Replace mock Archival API with real API, implement storage + pinning workflows.

**Timeline:** 1–2 days for Tasks 7–9

# Quick Task Execution

Each task is straightforward:

### Task 7: Extraction → Archival API (frame upload)
- Replace MockArchivalAPI with real httpx client
- POST requests to real Archival endpoints
- Handle 409 Conflict (duplicate hashes), 503 Service Unavailable
- Verify workflow end-to-end

### Task 8: Frontend → Archival API (frame query)
- Replace mock data fetch with real Archival queries
- Implement pagination (offset-based)
- Add loading/error states in React
- Verify TanStack Query cache invalidation

### Task 9: TeneT → Archival pinning
- Add verification badge component
- POST /v1/archive/frames/{id}/pin on verify action
- Handle pin success/failure in UI
- E2E test: verify → pin → badge update

# Mock → Real Swap Checklist

```bash
# 1. Find mock import
grep -r "MockArchivalAPI" apps/web/src/ packages/shared/api/

# 2. Create real client (if not exists)
# packages/shared/api/services/archival_client.py
# async def upload_frames(frames: List[bytes], manifest_data: dict) -> str:
#     async with httpx.AsyncClient() as client:
#         return await client.post("http://archival-api:8005/v1/archive/frames", json=manifest_data)

# 3. Replace mock with real
# - File: packages/shared/api/routers/extraction.py
# - Change: from njz_api.archival_client import upload_frames  # instead of mock
# - Change: manifest_id = await upload_frames(frames, metadata)

# 4. Test swap
pytest tests/integration/test_minimap_archival_integration.py -v

# 5. Update frontend
# File: apps/web/src/hooks/useMinimapFrames.ts
# Change: const frames = await mockArchivalApi.query(...)
# To:     const response = await fetch(`/v1/extraction/jobs/${jobId}/frames`)

# 6. Verify all green
npm run test
npm run typecheck
```

# Begin Task 7

Read plan-minimap-feature.md § Task 7 and start execution.

═════════════════════════════════════════════════════════
```

---

## Master Agent: Session Orchestration Checklist

```markdown
# Master Agent — Session Orchestration (Self-Check)

## Pre-Session
- [ ] Both prompts distributed to agents
- [ ] Both agents have access to all referenced files/stubs
- [ ] Archival agent confirmed prerequisites met
- [ ] Minimap agent confirmed prerequisites met + understands blocker mitigation

## Daily Checkpoints (Every ~12 hours)
- [ ] Archival agent: Which gates have passed? Update PHASE_GATES.md
- [ ] Minimap agent: Which gates have passed? Update PHASE_GATES.md
- [ ] Any blockers reported? Escalate or unblock
- [ ] Any assumptions documented? Flag for CODEOWNER review

## Blocker Decision Gate (Day 3–4, ~2026-03-31)
- [ ] Archival Tasks 5–6 (API endpoints) status?
- [ ] Can Archival API be deployed to staging/test environment?
- [ ] Decision: Issue PROMPT 3 (Tasks 7–9) or defer to Phase 9 continuation?

## Session Close
- [ ] All passed gates logged in PHASE_GATES.md
- [ ] All code committed (or PRs ready)
- [ ] CODEOWNER approvals obtained
- [ ] Session log created (CONTEXT_FORWARD.md for next session)
- [ ] Stubs to be archived or deleted per DOSSIER_CREATION_TEMPLATE

## Success Criteria
- [ ] Archival System: 8/8 tasks complete (Gates 9.1–9.8 all ✅)
- [ ] Minimap Feature: Tasks 1–6 complete (Gates 9.9–9.14 all ✅)
- [ ] Minimap Tasks 7–9: Complete IF Archival ready (Gates 9.15–9.17)
- [ ] All code green: pytest, ruff, mypy, npm test
- [ ] CODEOWNER approval: Both PRs merged or approved
```

---

## Quick Reference: Stub File Descriptions

| Stub | When to Use | Key Content |
|------|---|---|
| AGENT-TASK-INSTRUCTION | Session start — orientation | Full SDD workflow + role expectations |
| ARCHIVAL/MINIMAP-WORKPLAN | Session start — feature context | Feature overview, requirements, file refs |
| spec.md / spec-minimap-feature.md | While implementing | Design patterns, API specs, data models |
| plan.md / plan-minimap-feature.md | Task planning | Task sequence, dependencies, AC links, verification |
| TASK-EXECUTION-STUB | For each task (1–N) | 7-phase execution lifecycle |
| VERIFICATION-CHECKLIST-STUB | After task complete | Gate validation, pre-checks, sign-off |
| CROSS-REVIEW-TEMPLATE | After spec/plan done (not applicable here) | Pass 1–2 audit criteria |

---

*Handoff prepared 2026-03-28. Valid until end of Phase 9 (2026-03-31 estimated).*
