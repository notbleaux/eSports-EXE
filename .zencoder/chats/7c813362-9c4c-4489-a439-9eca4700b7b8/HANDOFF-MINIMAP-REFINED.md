# Handoff: Minimap Feature Specification & Planning — REFINED

**Status:** PRD approved · Consolidated workplan created  
**Next Steps:** Step 2 (Technical Specification) → Step 3 (Planning) → Cross-Review  
**Critical Blocker:** Archival System completion (Tasks 7–9 depend on it)  
**Session Files:** Valid until 2026-03-30  

---

## Quick Start

You are executing **Steps 2–3 of the SDD workflow** for the **Minimap Feature** (Extraction Service + Frontend UI).

**Your primary reference files (read in this order):**

1. **AGENT-TASK-INSTRUCTION-2026-03-27.md** — How to execute this workflow ⭐ READ FIRST
2. **MINIMAP-FEATURE-WORKPLAN-2026-03-27.md** — Context, deliverable outlines, success criteria
3. **requirements.md** — Full PRD (reference during spec writing)
4. **CROSS-REVIEW-TEMPLATE-2026-03-27.md** — Audit framework (after spec/plan complete)
5. **ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md** — Archival blocker context (integration planning)

**Your deliverables:**
- `spec-minimap-feature.md` — Technical specification (extraction pipeline, React component, integration)
- `plan-minimap-feature.md` — Implementation plan (11 tasks, Archival blocker explicitly marked)

**Files location:** `.zencoder/chats/7c813362-9c4c-4489-a439-9eca4700b7b8/`  
**Workplan location:** `.agents/session/MINIMAP-FEATURE-WORKPLAN-2026-03-27.md`

---

## What You're Building

**Minimap Feature** — Multi-component system extracting, storing, verifying, and displaying tactical minimap frames.

**Components:**
1. **Extraction Service** — Python asyncio pipeline (FFmpeg + OpenCV) to extract frames from VOD at 1 fps
2. **Frontend Component** — React paginated frame grid with verification badges, timeline
3. **Integration Layer** — Frame upload to Archival API, pinning workflow with TeneT

**Key constraints:**
- Phase 1 MVP: Single-threaded extraction, local VOD files only
- 1 fps frame rate = ~1800 frames per 30-min match
- All frame storage delegated to Archival System (prerequisite)

**Why now:** Unblocks Frame Grid UI for ROTAS/OPERA hub. Depends on Archival System (Phase 9 parallel work).

---

## CRITICAL: Archival System Blocker

**Tasks 7–9 in your plan CANNOT start until Archival System completes.**

**Affected tasks:**
- Task 7: Integration (Extraction → Archival API)
- Task 8: Integration (Frontend → Archival API)
- Task 9: Integration (TeneT → Archival pinning)

**Mitigation strategy:**
- **Parallel execution:** Develop Tasks 1–6 while Archival completes
- **Mock integration:** Use mock Archival API for Tasks 6–7 testing
- **Swap when ready:** Replace mock with real API when Archival deployed

**Archival ETA:** Check ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md for completion date.

**If Archival delays past 2026-03-30:**
- Defer Tasks 7–9 to Phase 9 continuation
- Complete Tasks 1–6 in Phase 9
- Plan integration when Archival ready

---

## Your Workflow

### Step 2: Technical Specification

**Read first:** AGENT-TASK-INSTRUCTION-2026-03-27.md "Step 2 — Technical Specification"

**Deliverable:** `spec-minimap-feature.md` with 8 required sections:
1. Technical Context (Python extraction, React frontend, FFmpeg + OpenCV)
2. Extraction Service Architecture (VOD pipeline, segment detection, job tracking)
3. Frontend Component: MinimapFrameGrid (layout, features, pagination, filtering)
4. Data Model Integration (extraction_jobs table, Archival frame schema link, TeneT integration)
5. API Endpoints (2 extraction endpoints: create job, poll status; frame queries delegated to Archival)
6. Frontend Hooks & Components (useMinimapFrames hook, <MinimapFrameGrid /> component structure)
7. Delivery Phases (Phase 1 MVP boundaries, Phase 2/3 deferred features)
8. Verification Approach (unit/integration/E2E tests, mock vs real Archival API testing)

**Quality gates:**
- ✅ Extraction pipeline fully specified (FFmpeg, OpenCV, segment detection, deduplication)
- ✅ React component fully specified (layout, props, features, TanStack Query integration)
- ✅ Both API endpoints specified (create job, poll status)
- ✅ Archival integration points identified (upload, query, pinning workflows)
- ✅ Reference existing ROTAS/OPERA hub structure
- ✅ Async/await throughout

**Reference existing code:**
- FastAPI: `packages/shared/api/routers/` (async patterns, error handling)
- React: `apps/web/src/hub-2-rotas/` or `hub-4-opera/` (component structure, styling, hooks)
- TanStack Query: `apps/web/src/` (useQuery patterns, caching, SWR)
- Archival integration: `requirements.md` (API contracts)

**Stop after Step 2:** Report "Specification complete" before proceeding to Step 3.

---

### Step 3: Planning

**Read first:** AGENT-TASK-INSTRUCTION-2026-03-27.md "Step 3 — Planning"

**Deliverable:** `plan-minimap-feature.md` updated with 11 concrete tasks in table format:

| Task # | Title | Gate Ref | Dependencies | AC Links | Blocker |
|--------|-------|----------|--------------|----------|---|
| 1 | PostgreSQL extraction_jobs + model | [Gate 9.X] | None | Core | ✅ Ready |
| 2 | FFmpeg + OpenCV pipeline | [Gate 9.Y] | Task 1 | Core | ✅ Ready |
| ... | ... | ... | ... | ... | ... |
| 7 | Extraction → Archival upload | [Gate 9.Z] | Tasks 4, 6 | **Integration** | ⏳ BLOCKED |
| ... | ... | ... | ... | ... | ... |

**Critical elements:**
- ✅ 11 concrete tasks with gate references
- ✅ Tasks 1–6 marked READY (no Archival dependency)
- ✅ Tasks 7–9 marked BLOCKED ON ARCHIVAL with mitigation strategy
- ✅ Every task has [Gate N.M] reference
- ✅ Every task links to AC criteria
- ✅ Dependencies clearly listed
- ✅ Verification commands executable
- ✅ Critical path identified (parallel execution 1–6, sequential 7–11)

**Blocker handling:** Update plan.md with explicit blocker status table showing:
- Tasks 1–6: "✅ Ready — no Archival dependency"
- Tasks 7–9: "⏳ Blocked on Archival System completion"
- Tasks 10–11: "✅ Ready after Tasks 1–9 complete"

**Stop after Step 3:** Report "Planning complete with Archival blocker documented" before proceeding to Cross-Review.

---

## Cross-Review Process

**After both Specification and Planning complete:**

1. **Read CROSS-REVIEW-TEMPLATE-2026-03-27.md** for audit framework
2. **Run Pass 1:** Cross-review (sonnet-4-6-think) on specification
   - Receive: Strengths, Gaps, Risks, Improvements
   - Focus: Extraction correctness, React patterns, Archival integration risk
   - Action: Update spec to address High priority gaps
3. **Run Pass 2:** Cross-review (sonnet-4-6-think) on planning
   - Receive: Task order assessment, feasibility, framework compliance
   - Focus: Archival blocker management, parallel execution, critical path
   - Action: Update plan to address High priority risks
4. **Blocker contingency:** For Pass 2, explicitly ask reviewer:
   > "How should tasks 7–9 be managed if Archival System delays past 2026-03-30?"
5. **Report findings:** Summarize resolutions and contingency plans
6. **Request CODEOWNER approval:** When both passes confirm feasibility

---

## Framework Integration

You MUST apply the **2/3/5+1,2,3 governance framework:**

- **2 Auth classes:** AGENT (you) executes; CODEOWNER approves PRs + gates
- **3 Tiers:** MASTER (contracts) · PHASE (gate-linked specs/plans) · WORK SESSION (this workplan)
- **5 Pillars:** Road-Maps (gates) · Logic Trees (dependencies) · ACP (handoff) · MCP (contracts) · Notebook/TODO
- **+3 Bonus:** Hub integration (ROTAS/OPERA) · Archival dependency coordination

**In practice:**
- Every task references [Gate N.M] and lists dependencies clearly
- Archival blocker documented explicitly (Logic Trees + Risk mitigation)
- API contracts align with Archival PRD (MCP pillar)
- React patterns match existing hub structure (ROTAS/OPERA)

---

## Archival System Coordination

**Before writing your plan, check:**
- ARCHIVAL-SYSTEM-WORKPLAN-2026-03-27.md for Archival task timeline
- If Archival on track (Tasks 1–8 complete by 2026-03-30): Plan Tasks 7–9 to start immediately after
- If Archival delays: Plan mock integration for Tasks 6–7, swap real API when ready

**Parallel coordination:**
- You can develop Tasks 1–6 while Archival develops Tasks 1–8
- Task 7–9 start when Archival Task 5+ (upload endpoint) is deployed
- Use shared mock Archival API for testing Tasks 6–7

---

## Decision Framework

Make technical calls autonomously using this guidance:

| Scenario | Decision |
|----------|----------|
| VOD source (S3 vs local) | Assume local Phase 1; defer S3 to Phase 2 |
| Minimap detection (ML vs heuristics) | Assume fixed bounding box Phase 1; ML Phase 3 |
| Segment classification | Assume round timer + UI heuristics Phase 1 |
| Frontend location (ROTAS vs OPERA) | Choose based on context fit; document reasoning |
| Frame caching (Redis vs client) | Assume TanStack Query client cache Phase 1; Redis Phase 2 |
| If Archival unavailable | Plan mock API for testing; integration swap workflow |

---

## Success Criteria

✅ **Specification:**
- All 8 sections complete
- Extraction pipeline + React component fully specified
- Archival integration points identified
- Both API endpoints specified
- Reference existing ROTAS/OPERA code

✅ **Planning:**
- 11 tasks with gates, AC links, dependencies, verification commands
- Tasks 1–6 marked READY
- Tasks 7–9 marked BLOCKED ON ARCHIVAL with contingency
- Critical path explicit (parallel 1–6, then 7–11)
- Task count + blocker status summary provided

✅ **Cross-Review:**
- Both passes complete
- Archival blocker contingency validated
- Ready for CODEOWNER approval

---

## Stop Points & Reporting

**After Step 2:** "Specification complete. spec-minimap-feature.md ready for cross-review." (1–2 sentence summary)

**After Step 3:** "Planning complete. plan-minimap-feature.md ready for cross-review. Archival blocker documented with contingency plan." (task count + critical path + blocker status)

**After Cross-Review:** "Cross-review complete. spec and plan updated. Archival coordination confirmed. Ready for CODEOWNER approval." (findings summary)

---

## Files at a Glance

| File | Purpose | Location |
|------|---------|----------|
| AGENT-TASK-INSTRUCTION | How to execute (READ FIRST) | `.agents/session/` |
| MINIMAP-FEATURE-WORKPLAN | Context + deliverable outlines | `.agents/session/` |
| ARCHIVAL-SYSTEM-WORKPLAN | Blocker coordination | `.agents/session/` |
| requirements.md | Archival PRD (reference only) | `.zencoder/chats/.../` |
| spec-minimap-feature.md | Your deliverable (Step 2) | `.zencoder/chats/.../` |
| plan-minimap-feature.md | Your deliverable (Step 3) | `.zencoder/chats/.../` |
| CROSS-REVIEW-TEMPLATE | Audit framework | `.agents/session/` |
| AGENTS.md | Project patterns | Root |
| MASTER_PLAN.md § Phase 9 | Phase scope | Root |
| PHASE_GATES.md | Gate numbers | `.agents/` |
| apps/web/src/hub-2-rotas/ | ROTAS hub code | `apps/web/src/` |
| apps/web/src/hub-4-opera/ | OPERA hub code | `apps/web/src/` |

---

**Ready? Start with AGENT-TASK-INSTRUCTION-2026-03-27.md (Phase 1: Orientation section).**
