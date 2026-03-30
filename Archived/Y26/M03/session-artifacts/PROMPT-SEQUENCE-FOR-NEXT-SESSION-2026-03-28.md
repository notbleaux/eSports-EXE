[Ver001.000]

# Optimized Prompt Sequence for ZenCoder Session 5

**Purpose:** This document provides the exact sequence of prompts and instructions to deliver to your next ZenCoder session.

**Usage:** Copy each prompt in sequence and paste into the new ZenCoder chat. Do NOT deliver all prompts at once; deliver them in order and wait for agent completion before issuing the next.

---

## SEQUENCE OVERVIEW

```
Session 5 Start
├─ SETUP (Master Agent)
│  └─ Read SESSION-4-COMPLETION-SUMMARY-2026-03-28.md + NEXT-SESSION-HANDOFF-PROMPT-2026-03-28.md
│
├─ PHASE (Parallel Execution)
│  ├─ PROMPT 1-A: Spawn Archival System implementation agent
│  ├─ PROMPT 1-B: Spawn Minimap feature agent (in parallel with 1-A)
│  └─ Master Agent: Daily gate monitoring + blocker tracking
│
├─ DECISION GATE (Day 3–4, ~2026-03-31)
│  ├─ Assessment: Is Archival Task 5+ complete + API ready?
│  ├─ If YES → Issue PROMPT 2-CONDITIONAL
│  └─ If NO → Log blocker, defer Tasks 7–9
│
└─ Session 5 Close
   ├─ Verify all gates [9.1]–[9.17] passed
   ├─ Confirm 18 AC criteria implemented
   └─ Ready for Phase 9 → Phase 10 transition
```

---

## STEP 1: Master Agent Setup (You, before opening Session 5)

**Duration:** 5 minutes

Read these files to understand the full context:
1. `SESSION-4-COMPLETION-SUMMARY-2026-03-28.md` (this session's summary)
2. `NEXT-SESSION-HANDOFF-PROMPT-2026-03-28.md` (master orchestration prompt)

These provide:
- Overview of 4 sessions of planning work
- Quick-start checklist
- Gate update protocol
- Blocker decision gate logic

---

## STEP 2: PROMPT 1-A — Archival System Implementation Agent

**When to Deliver:** Beginning of Session 5 (immediately)  
**Duration:** ~6–8 hours (can parallelize Tasks 2–3, 6–7 to reduce to 6 days)  
**Success Criteria:** All 8 tasks complete, gates [9.1]–[9.8] PASSED

**Copy and paste this into ZenCoder Session 5:**

```
You are tasked with implementing the Archival System for Phase 9 of the NJZiteGeisTe Platform.

CONTEXT:
- You are a backend specialist (Python/FastAPI)
- This is a parallel execution session: You + Minimap agent run simultaneously
- All specifications, plans, stubs, and references are provided
- Your success criteria: 8 sequential tasks complete, all 18+ AC criteria met, all gates [9.1]–[9.8] PASSED

QUICK START:
1. Read attached files in order:
   - spec.md (Archival API specification) — 1096 lines, 12 endpoints
   - plan.md (Archival implementation plan) — 8 tasks, task breakdown
   - TASK-EXECUTION-STUB-2026-03-27.md (how to execute tasks)
   - VERIFICATION-CHECKLIST-STUB-2026-03-27.md (how to verify each gate)

2. Execute Tasks 1–8 sequentially, following TASK-EXECUTION-STUB protocol:
   - **Task 1:** PostgreSQL migration + SQLAlchemy models [Gate 9.1]
   - **Task 2:** Pydantic schemas + validation [Gate 9.2]
   - **Task 3:** Storage abstraction layer (Protocol + LocalBackend) [Gate 9.3]
   - **Task 4:** Archival service (deduplication, GC, migration) [Gate 9.4]
   - **Task 5:** FastAPI router (upload, query, pin, etc.) [Gate 9.5]
   - **Task 6:** GC + storage migration endpoints [Gate 9.6]
   - **Task 7:** Audit logging + Prometheus metrics [Gate 9.7]
   - **Task 8:** Integration tests (E2E workflows) [Gate 9.8]

3. After EACH task:
   - Run verification command (specified in plan.md)
   - Update PHASE_GATES.md with gate status
   - Report task completion to master agent

4. Key Framework Requirements:
   - All code async/await (no blocking I/O)
   - Every task → [Gate N.M] reference in PHASE_GATES.md
   - AC coverage mapping (every task addresses specific AC criteria)
   - Code quality: ruff, mypy, pytest all green before task completion
   - Delete stubs as you replace them with production code

PARALLELIZATION OPPORTUNITY:
- Tasks 2–3 can run in parallel (2-agent model) — reduces timeline by 1–2 hours
- Tasks 6–7 can run in parallel (2-agent model) — reduces timeline by 1 hour

EXPECTED TIMELINE:
- Sequential total: 8 days
- With parallelization: 6 days

BLOCKERS:
- If task blocked: Use TASK-EXECUTION-STUB Phase 5 (Resolve) guidance
- If unresolvable: Log in .agents/session/BLOCKERS_LOG-2026-03-28.md with root cause + decision needed

VERIFICATION:
- Follow VERIFICATION-CHECKLIST-STUB-2026-03-27.md for each gate
- All tests must pass before marking gate PASSED
- Master agent will verify gates daily in morning standup

Good luck! You have everything you need to succeed.
```

---

## STEP 3: PROMPT 1-B — Minimap Feature Implementation Agent

**When to Deliver:** Same time as PROMPT 1-A (beginning of Session 5)  
**Duration:** ~6–8 hours (Tasks 1–6 can parallelize with Archival Tasks 1–6)  
**Success Criteria:** Tasks 1–6 complete, gates [9.9]–[9.14] PASSED  

**Copy and paste this into ZenCoder Session 5 (in second chat tab or same chat):**

```
You are tasked with implementing the Minimap Feature for Phase 9 of the NJZiteGeisTe Platform.

CONTEXT:
- You are a full-stack specialist (React/TypeScript + FastAPI)
- This is a parallel execution session: You + Archival agent run simultaneously
- All specifications, plans, stubs, and mock API references are provided
- Your success criteria: Tasks 1–6 complete, gates [9.9]–[9.14] PASSED; Tasks 7–9 deferred

QUICK START:
1. Read attached files in order:
   - spec-minimap-feature.md (Minimap feature specification)
   - plan-minimap-feature.md (Minimap implementation plan)
   - TASK-EXECUTION-STUB-2026-03-27.md (how to execute tasks)
   - VERIFICATION-CHECKLIST-STUB-2026-03-27.md (how to verify gates)
   - MINIMAP-IMPLEMENTATION-STUB-2026-03-28.md (expected output structure)

2. Execute Tasks 1–6 ONLY (Tasks 7–9 are DEFERRED — do not start them):
   - **Task 1:** PostgreSQL extraction_jobs table + SQLAlchemy model [Gate 9.9]
   - **Task 2:** FFmpeg + OpenCV extraction pipeline [Gate 9.10]
   - **Task 3:** Segment type classification logic (heuristic-based) [Gate 9.11]
   - **Task 4:** FastAPI extraction endpoint + async dispatch [Gate 9.12]
   - **Task 5:** React MinimapFrameGrid component (grid, pagination, badges) [Gate 9.13]
   - **Task 6:** TanStack Query hook useMinimapFrames (with MockArchivalAPI) [Gate 9.14]

3. TASK 7–9 STATUS: ⏳ DEFERRED
   Tasks 7–9 depend on Archival System API (Archival Task 5):
   - **Task 7:** Extraction → Archival API [Gate 9.15] — Wait for Archival API
   - **Task 8:** Frontend → Archival API [Gate 9.16] — Wait for Archival API
   - **Task 9:** TeNET Pinning → Archival API [Gate 9.17] — Wait for Archival API
   
   **What to do instead:**
   - Use MockArchivalAPI in Task 6 (provided in MINIMAP-IMPLEMENTATION-STUB)
   - Keep MockArchivalAPI in place for Tasks 1–6 development
   - DO NOT start Tasks 7–9 yet
   - On Day 3–4 (~2026-03-31), Master agent will assess Archival readiness
   - If Archival ready: Master agent issues PROMPT 2-CONDITIONAL for Tasks 7–9
   - If Archival not ready: Log blocker, defer to Phase 9 continuation session

4. Key Framework Requirements:
   - Mock API location: apps/web/src/mocks/mockArchivalClient.ts
   - All code async/await (no blocking I/O)
   - React: Follow existing hub component patterns (hub-2-rotas, hub-4-opera)
   - Backend: Follow existing router patterns (packages/shared/api/routers/)
   - Every task → [Gate N.M] reference in PHASE_GATES.md
   - AC coverage: AC-01 through AC-13 (Tasks 7–9 add AC-14 through AC-17)
   - Code quality: ruff, mypy, npm run typecheck, npm run test all green

PARALLELIZATION OPPORTUNITY:
- Tasks 1–4 (backend) can parallelize with Tasks 5–6 (frontend)
- You can potentially finish Tasks 1–6 in 1 day if parallelized aggressively

EXPECTED TIMELINE:
- Sequential total: 8 hours
- With parallelization: 4–5 hours (all done by end of Day 1)

BLOCKERS:
- If task blocked: Use TASK-EXECUTION-STUB Phase 5 (Resolve) guidance
- If unresolvable: Log in .agents/session/BLOCKERS_LOG-2026-03-28.md

VERIFICATION:
- Follow VERIFICATION-CHECKLIST-STUB-2026-03-27.md for each gate [9.9]–[9.14]
- Tests must pass before marking gate PASSED
- Master agent will verify gates daily

IMPORTANT: Do NOT attempt Tasks 7–9 yet. They will be issued separately after Archival System is ready.

Good luck! You have everything you need to succeed.
```

---

## STEP 4: Master Agent Daily Checkpoint (You)

**When to Execute:** Each morning during Session 5 implementation  
**Duration:** 10–15 minutes

**Checkpoint Template:**

```
DAILY STANDUP — [DATE]

ARCHIVAL SYSTEM AGENT:
☐ Which tasks completed? [List task numbers + gates]
☐ Current blockers? [None / List]
☐ Expected completion date? [e.g., 2026-03-31]
☐ Gate updates? [Update PHASE_GATES.md with status]

MINIMAP FEATURE AGENT:
☐ Which tasks completed? [List task numbers + gates]
☐ Current blockers? [None / List]
☐ Expected completion date? [e.g., 2026-03-29]
☐ Gate updates? [Update PHASE_GATES.md with status]

DECISION GATE STATUS:
☐ Is Archival System Task 5 (FastAPI router) complete? [Yes/No/In Progress]
☐ Is Archival API deployable to staging? [Yes/No/Unknown]
☐ Estimated time until Tasks 7–9 can begin? [<24h / >24h / N/A]

NEXT ACTIONS:
☐ Continue current tasks OR
☐ Spawn PROMPT 2-CONDITIONAL for Minimap Tasks 7–9 OR
☐ Log blocker + plan mitigation
```

---

## STEP 5: PROMPT 2-CONDITIONAL — Minimap Tasks 7–9 (Triggered after Archival Ready)

**When to Deliver:** Day 3–4 of Session 5 (~2026-03-31) IF Archival System Task 5+ complete  
**Duration:** ~3–4 hours  
**Success Criteria:** Tasks 7–9 complete, gates [9.15]–[9.17] PASSED; mock → real API swap complete

**Copy and paste this only AFTER confirming Archival Task 5 is ready:**

```
CONDITIONAL PROMPT: Execute ONLY if Archival System API is ready

PREREQUISITE CHECK:
- Is Archival System Task 5 (FastAPI router) complete? [MUST be YES]
- Is Archival API deployed and reachable (http://archival-api:8005)? [MUST be YES]
- Can MockArchivalAPI be swapped for real API in <2 hours? [Expected YES]

If ANY prerequisite is NO: Do NOT execute this prompt. Log blocker in .agents/session/BLOCKERS_LOG-2026-03-28.md and defer to Phase 9 continuation session.

If ALL prerequisites are YES: Proceed below.

---

CONTEXT:
- You are the same Minimap feature agent from PROMPT 1-B
- Tasks 1–6 are now complete + gate-verified
- Now execute Tasks 7–9, which integrate with Archival System API
- Expected duration: 3–4 hours (mostly API client swap + integration tests)

QUICK START:
1. Read attached files:
   - plan-minimap-feature.md (Tasks 7–9 section)
   - ARCHIVAL-IMPLEMENTATION-STUB-2026-03-28.md (Archival API endpoints reference)
   - TASK-EXECUTION-STUB-2026-03-27.md (execution protocol)
   - VERIFICATION-CHECKLIST-STUB-2026-03-27.md (verification)

2. Execute Tasks 7–9:
   - **Task 7:** Extraction → Archival API (Frame upload) [Gate 9.15]
     - File: services/api/src/njz_api/extraction/service.py
     - Replace: MockArchivalAPI → real httpx.AsyncClient
     - Endpoint: POST http://archival-api:8005/v1/archive/frames
     - Verify: pytest tests/unit/test_extraction_to_archival.py -v

   - **Task 8:** Frontend → Archival API (Frame query) [Gate 9.16]
     - File: apps/web/src/hooks/useMinimapFrames.ts
     - Replace: MockArchivalAPI → real Archival API client
     - Endpoint: GET /v1/archive/matches/{match_id}/frames?page=N
     - Verify: npm run test -- useMinimapFrames.integration.test.ts -v

   - **Task 9:** TeNET Pinning → Archival API [Gate 9.17]
     - File: apps/web/src/components/VerificationBadge.tsx
     - Add onClick handler: POST /v1/archive/frames/{frame_id}/pin
     - Admin-only auth check
     - Verify: npm run test -- VerificationBadge.integration.test.ts -v

3. Key Steps:
   - Replace MockArchivalAPI import with real API client
   - Update endpoint URLs to match Archival API (from ARCHIVAL-IMPLEMENTATION-STUB)
   - Add integration tests (use Testcontainers if possible)
   - Verify all code quality: ruff, mypy, pytest, npm test

4. Completion:
   - Update PHASE_GATES.md with gates [9.15]–[9.17] PASSED
   - Verify all 18 AC criteria now fully met
   - Report task completion

EXPECTED TIMELINE: 3–4 hours

Good luck! This is the final step before Phase 9 → Phase 10 transition.
```

---

## STEP 6: Session 5 Close (You)

**When to Execute:** End of Session 5 (estimated 2026-04-03)  
**Duration:** 30 minutes

**Completion Checklist:**

```
✅ SESSION 5 CLOSE VERIFICATION

GATE STATUS (Update PHASE_GATES.md):
☐ All 8 Archival gates [9.1]–[9.8] marked ✅ PASSED
☐ All 6 Minimap gates [9.9]–[9.14] marked ✅ PASSED
☐ All 3 deferred Minimap gates [9.15]–[9.17] marked ✅ PASSED (or logged as deferred)

AC COVERAGE:
☐ All 18 AC criteria implemented + verified in code
☐ All AC mapped to specific tasks in plan.md + plan-minimap-feature.md

CODE QUALITY:
☐ All tests passing: pytest tests/ -v (Python)
☐ All tests passing: npm run test (JavaScript)
☐ Zero linting errors: ruff check, npm run lint
☐ Zero type errors: mypy, npm run typecheck

ARTIFACTS:
☐ All stubs deleted (replaced with production code)
☐ No STUB files remain in codebase
☐ BLOCKERS_LOG-2026-03-28.md reviewed (if any blockers logged)

DOCUMENTATION:
☐ PHASE_GATES.md updated with all gate statuses + completion dates
☐ Commit message: "feat(phase-9): Archival System + Minimap Feature complete - Gates [9.1]–[9.17] PASSED"

READINESS FOR NEXT PHASE:
☐ All Phase 9 artifacts production-ready
☐ Ready to transition Phase 9 → Phase 10
☐ Session summary documented for future reference

SESSION STATUS: ✅ COMPLETE
```

---

## Reference: File Locations

**All files are in `.agents/session/` directory:**

```
.agents/session/
├── SESSION-4-COMPLETION-SUMMARY-2026-03-28.md ← Start here
├── NEXT-SESSION-HANDOFF-PROMPT-2026-03-28.md ← Master orchestration
├── FINAL-STUB-ENHANCEMENT-AUDIT-2026-03-28.md ← Framework compliance audit
│
├── spec.md ← Archival API spec (attach to PROMPT 1-A)
├── plan.md ← Archival impl plan (attach to PROMPT 1-A)
├── spec-minimap-feature.md ← Minimap spec (attach to PROMPT 1-B)
├── plan-minimap-feature.md ← Minimap impl plan (attach to PROMPT 1-B)
│
├── TASK-EXECUTION-STUB-2026-03-27.md ← Attach to both agents
├── VERIFICATION-CHECKLIST-STUB-2026-03-27.md ← Attach to both agents
├── CROSS-REVIEW-TEMPLATE-2026-03-27.md ← Reference only
├── spec-STUB.md ← Reference only
├── plan-STUB.md ← Reference only
│
├── ARCHIVAL-IMPLEMENTATION-STUB-2026-03-28.md ← Reference + expected output
├── MINIMAP-IMPLEMENTATION-STUB-2026-03-28.md ← Reference + expected output
│
└── PROMPT-SEQUENCE-FOR-NEXT-SESSION-2026-03-28.md ← This file
```

---

## Token Optimization Tips

**To reduce context overhead in Session 5:**

1. **Use `attachedFiles` parameter:** Pass spec.md, plan.md, stubs as file paths instead of embedding
2. **Provide link to continuation:**When spawning PROMPT 2-CONDITIONAL, reference files (don't duplicate)
3. **Master agent consolidates:** Master agent reads PHASE_GATES.md (single source of truth) instead of re-reading task summaries
4. **Expected token usage:**
   - PROMPT 1-A: ~3500 tokens (includes spec.md + plan.md)
   - PROMPT 1-B: ~3500 tokens (includes spec-minimap.md + plan-minimap.md)
   - Master checkpoints: ~500 tokens each × 6 days = ~3000 tokens
   - PROMPT 2-Conditional: ~1500 tokens
   - **Total estimated:** ~11,500 tokens (vs. ~20,000 if fully monolithic)

---

## Summary

**Prompt Delivery Sequence:**

1. **Pre-Session:** You read SESSION-4-COMPLETION-SUMMARY + NEXT-SESSION-HANDOFF-PROMPT (5 min)
2. **Session Start:** Deliver PROMPT 1-A (Archival) + PROMPT 1-B (Minimap) simultaneously
3. **Daily:** Execute master agent daily checkpoint (10 min × 6 days)
4. **Day 3–4:** If Archival ready, deliver PROMPT 2-CONDITIONAL (Tasks 7–9)
5. **Session End:** Execute session close verification checklist (30 min)

**Expected Session Duration:** 6–8 days (distributed implementation)

**Success Criteria:** All 16 gates passed, 18 AC implemented, zero stubs remaining, ready for Phase 10.

---

*This prompt sequence is optimized for parallel execution and token efficiency. Deliver in order, wait for completion before issuing next prompt. Good luck with your implementation!*

---

**Created:** 2026-03-28 17:52 UTC  
**Framework:** NJZPOF v0.2  
**Status:** ✅ READY FOR DELIVERY
