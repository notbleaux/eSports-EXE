[Ver001.000]

# Step 3C: Advanced Analytics & Framework Assessment
## Minimap Extraction Feature — Comprehensive Strategic Review

**Date:** 2026-03-27
**Phase:** Post-Phase 10 / Phase 11 Candidate
**Status:** DRAFT — Pending User Approval

---

## Summary

The proposed scope expansion for the Minimap Extraction Service adds **four major analytical dimensions** (advanced analytics, map zones, sight lines, verification framework) alongside **operational infrastructure** (session management, roadmap expansion, agent notifications). 

**Key Finding:** The repository already has foundational verification systems (tenet-verification confidence scoring) and operational frameworks (SESSION_LIFECYCLE.md, PHASE_GATES.md). The scope expansion is **architecturally coherent but requires careful sequencing**—the critical bottleneck is the **Unified Verification & Quality Gate System**, which must be built before analytics can be integrated into the main verification pipeline.

---

## Review 1: Strategic Architecture

### Consideration 1: Dual-Stream Verification vs. Unified Gate System

**Addition:** 
- Implement a **Quality Gate Registry** that unifies verification signals across Stream A (raw images) and Stream B (structured CV) into a single scoring interface
- Create a **Verification Checkmark System** that tags each frame/segment with explicit pass/fail/review status (extends existing VerificationRecord model)
- Design **Audit Trail Integration** linking minimap frames to TeneT verification records via `tenet_verification_id`

**Subtraction:**
- Do NOT create separate grading systems for analytics and CV outputs—these should feed the unified gate
- Avoid introducing new "confidence scoring" algorithms; reuse the existing `ConfidenceCalculator` from tenet-verification (trust weights 0.6–1.0 per source)
- Do NOT add analytics-specific database tables; store results in JSONB `analysis_confidence` field in `minimap_frames_stream_b`

**Reconciliation 1: Integration Point**
The unified gate must sit **between** Stream B output and TeneT verification submission. Frame-level confidence (CV analysis) becomes a data source feeding the entity-level confidence (match-level decision). Minimap data is a **MEDIUM trust source** (weight 0.8, existing trust tier registered in tenet-protocol.ts line 54).

**Reconciliation 2: Schema Alignment**
Extend `minimap_verification_results` table (spec.md §5) to include:
- `quality_gate_verdict` (ACCEPT | FLAG | REJECT)
- `checkmark_signals` JSONB array: `[{category: "cv_confidence", score: 0.92}, {category: "stream_agreement", score: 0.88}]`
- This mirrors `confidence_breakdown` field in tenet-verification service (README.md line 143)

**Reconciliation 3: Backwards Compatibility**
Stream A (raw JPEG crops) remains unchanged—no verification overhead. Only Stream B analytical outputs feed the quality gate. This preserves the dual-path design (Path A live, Path B verified) and avoids blocking real-time image distribution.

---

### Consideration 2: Advanced Analytics (xkill/xround/Zones) — Layered Integration

**Addition:**
- Create `analytics/` sub-module within minimap-extractor containing:
  - `xkill_detector.py` — Kill event detection (player state changes: alive→dead)
  - `xround_detector.py` — Round state tracking (buy phase → live → end)
  - `zone_analyzer.py` — Map zone classification (major/minor/instance via XY grid)
- Store analytics outputs in separate JSONB column `advanced_analytics` in `minimap_frames_stream_b` (non-blocking field)
- Design analytics as **optional enrichment**, not required for frame acceptance

**Subtraction:**
- Do NOT compute sight lines, gun recoil, or character model physics in Phase 1—these are Phase 3+ (high ML complexity)
- Avoid Markov chain state machines initially; use **deterministic event rules** based on minimap pixel changes (sprite movement, color changes)
- Do NOT add new tables for xkill/xround events; store them as arrays in `advanced_analytics` JSONB

**Reconciliation 1: Data Source Hierarchy**
Analytics outputs are **tertiary data sources** in the TeneT trust model:
- **PRIMARY (HIGH):** Structured CV detections (player dots, spike position)
- **SECONDARY (MEDIUM):** Analytics deductions (xkill inferred from position changes)
- Store both; let tenet-verification confidence scoring weight them separately

**Reconciliation 2: Event Causality**
xkill and xround detection depend on **temporal continuity**—frame-by-frame state tracking. Frame sampler (spec.md §4, `frame_sampler.py`) must preserve sequential frame indices. Analytics module processes frames in temporal order; outputs include `frame_range` (start/end indices) not individual timestamps.

**Reconciliation 3: Computational Budget**
Analytics are **post-Stream B**, executed only on flagged frames (low confidence CV) or on-demand. This prevents analytics overhead from slowing down the verification pipeline. Stream B → Flag → Analytics → TeneT = four-stage pipeline, not parallel.

---

### Consideration 3: Sight Lines & Perspective Modeling — Phase 3 Candidate

**Addition:**
- Reserve schema space for **perspective transforms**: Add `perspective_config` field to game config JSON (spec.md §4, valorant.json)
- Document **gun-level vs. player-level** modeling decision in Phase 3 spec (eye height approximation, weapon attachment points)
- Design **polar/radian coordinate system** spec: Create `data/schemas/spatial-coordinates.ts` with conversion utilities (atan2 angle, distance formulas)

**Subtraction:**
- Do NOT implement sight line tracing in Phase 1–2; this is a Phase 3+ feature (requires 3D reconstruction or camera calibration)
- Avoid physics simulation (recoil patterns, bullet spread)—that's game-specific and belongs in Godot simulation, not extraction service
- Do NOT add computer vision ML models for perspective estimation; static geometry approximations only

**Reconciliation 1: Deferred Complexity**
Document that sight lines are **schema-first, implementation-deferred**. The `spatial-coordinates.ts` file defines the types and formulas; the actual ray-casting/angle computation comes in Phase 3. This prevents over-engineering Phase 1.

**Reconciliation 2: Game-Specific Calibration**
Each game (Valorant, CS2, etc.) has different camera heights, minimap scales, and coordinate systems. The solution: **game config becomes canonical truth** (spec.md `config/games/valorant.json`). Any sight line implementation must read from config, not hardcode values.

**Reconciliation 3: Optional Enrichment, Not Core**
Like advanced analytics, sight lines are **optional** enrichment that arrives post-Stream B. If computation fails, frames are not rejected—they're flagged with `sight_line_analysis: {status: "UNAVAILABLE", reason: "phase_3_feature"}`. This prevents coupling Phase 1 delivery to Phase 3 scope.

---

## Review 2: Implementation & Operations

### Consideration 1: Session & Roadmap Management — Canonical Truth System

**Addition:**
- Create **`.agents/session/minimap-roadmap.md`** (master roadmap for the entire minimap project):
  - 5 phases: Phase 1 (dual-stream), Phase 2 (analytics), Phase 3 (sight lines), Phase 4 (ML), Phase 5 (production)
  - Each phase includes gate criteria, dependencies, estimated LOC, risk mitigation
  - References MASTER_PLAN.md Phase 11 as parent context
- Implement **Phase Expansion Protocol**: When Phase N completion reveals new requirements, document in `minimap-roadmap.md` immediately; do NOT modify MASTER_PLAN.md (only docs-agent may do that)
- Track **canonical truth documents** in `.agents/registry/minimap-truth-index.md`:
  - Lists of record: spec.md (architectural), requirements.md (user-facing), roadmap.md (internal planning)
  - Versioning: All canonical docs use `[VerMMM.mmm]` header
  - Drift detection: Weekly check—if a doc is cited in 3+ places but not in index, flag for consolidation

**Subtraction:**
- Do NOT create ad-hoc session notebooks for each sprint; use the canonical minimap-roadmap.md
- Avoid scattered PHASE_*.md files; consolidate into single roadmap document
- Do NOT add roadmap decisions to MASTER_PLAN.md after Phase 1—keep them scoped to minimap-roadmap.md (prevents merge conflicts)

**Reconciliation 1: Master Plan Integration**
The minimap-roadmap.md is a **child document** of MASTER_PLAN.md §11 (Phase 11 — Browser Extension). It adds detail to "Phase 11 Deliverable A" without modifying the parent. Link is bidirectional: MASTER_PLAN.md lines §11 points to `.agents/session/minimap-roadmap.md`; minimap-roadmap.md header states `Parent: MASTER_PLAN.md §11`.

**Reconciliation 2: Session Continuity**
End-of-session handoff writes to `.agents/session/CONTEXT_FORWARD.md` with section for minimap:
```markdown
## Minimap Extraction — Session N Handoff
- Phase 1 Stream A: 95% complete (ready for user test)
- Phase 1 Stream B: CV detection tuning in progress
- Next session: Verify cross-stream agreement scoring, submit PR
- Blockers: None
- Roadmap updates: Analytics phase moved to Phase 2 (was Phase 1.5)
```

**Reconciliation 3: Approval Workflow**
Minimap roadmap changes follow CODEOWNER_CHECKLIST.md pattern:
- Agent updates minimap-roadmap.md, opens PR
- @notbleaux reviews for scope creep (all phase additions must have clear rationale)
- Once approved, roadmap is locked until next session handoff

---

### Consideration 2: Notification & Escalation for Critical Events

**Addition:**
- Extend existing **Push Notification Service** (`packages/shared/api/src/notifications/push_service.py`) with new category:
  - `NotificationCategory.MINIMAP_QUALITY_GATE` (existing enum + new value)
  - Triggers on: verification checkmark REJECT (user alert), FLAG (analyst review), analytics anomaly (e.g., xkill detection confidence < 0.7)
- Create **`services/minimap-extractor/notifications.py`** module (mirrors pattern from legacy-compiler with circuit breaker):
  - `async def notify_quality_gate_event(job_id, verdict, checkmark_signals)` → calls Push Service
  - Implements exponential backoff if notification service unavailable (circuit breaker pattern from legacy-compiler README §"Typical Issues")
- Add **Web UI alert dashboard** (Phase 1.5): ROTAS hub gets new tab "Extraction Quality Feed" showing:
  - Real-time job status (PENDING → EXTRACTING → VERIFYING → COMPLETE)
  - Checkmark signal summary (CV confidence, stream agreement %)
  - Manual review queue (flagged frames waiting analyst action)

**Subtraction:**
- Do NOT create a separate notification service; reuse existing Push Service (avoid service proliferation)
- Avoid Slack/email integrations for Phase 1 (out of scope); Web UI dashboards sufficient
- Do NOT implement push notifications for *every* frame (spam risk); only critical verdicts and summaries

**Reconciliation 1: Existing Integration Points**
The Push Service already has:
- VAPID key management (test_push_service.py lines 26–70)
- PushSubscription ORM model (tracks browser/app subscriptions)
- NotificationLog audit trail (compliance)
Minimap just adds a new category and payload schema. No new service needed.

**Reconciliation 2: Escalation Chain**
Manual escalations follow CODEOWNER_CHECKLIST.md workflow:
1. Frame flagged by quality gate (confidence < 0.7)
2. Notification sent to analysts via Push Service
3. Analyst reviews via Web UI dashboard, submits decision
4. Decision propagates to VerificationRecord (existing tenet-verification model)
5. TeneT service routes to Path A or Path B

**Reconciliation 3: Monitoring & Ops**
Health endpoints mirror tenet-verification README §"Monitoring & Alerts":
- `GET /v1/jobs/{job_id}` includes `notification_status: {sent_at, delivery_status}`
- Metrics: count of flagged frames, analyst review time, notification delivery success rate

---

### Consideration 3: Testing & Quality Gate Validation Strategy

**Addition:**
- Create **comprehensive test suite** in `services/minimap-extractor/tests/` (mirroring tenet-verification/tests/ structure):
  - `test_quality_gate.py` — 12 test cases for verification checkmark logic
  - `test_analytics_integration.py` — 8 cases for xkill/xround/zone detection
  - `test_notification_escalation.py` — 5 cases for alert delivery
  - `test_e2e_minimap_to_tenet.py` — End-to-end: ingest → verify → notify → store
- Implement **continuous quality monitoring** via pre-commit hooks:
  - Black formatting + mypy type checking (mirrors AGENT_CONTRACT.md requirements)
  - New: `test_quality_gate_schemas.py` validates that verification checkmarks conform to canonical truth
- Build **regression test matrix** (Phase 2):
  - Template matching accuracy per game (Valorant vs. CS2)
  - Stream A/B agreement scores for known-good videos
  - Notification delivery latency (SLA: < 2s from quality gate verdict)

**Subtraction:**
- Do NOT create unit tests for each analytics function in isolation (too fine-grained); test integration with Stream B
- Avoid load testing in Phase 1 (benchmarking deferred to Phase 2)
- Do NOT test sight lines or ML models yet (Phase 3+ features not implemented)

**Reconciliation 1: Test Coverage Targets**
- Phase 1 baseline: 85% code coverage (Stream A/B extraction, verification)
- Stream B analytics: 70% coverage (optional enrichment, lower bar)
- Quality gate: 95% coverage (critical path, high bar)
- Total: ~1500 lines of test code (mirrors tenet-verification 26+ test cases)

**Reconciliation 2: Specification Validation**
Tests validate against **canonical truth schemas**:
- Frames conform to `minimap_frames_stream_b` JSONB schema (spec.md §5)
- Quality gate verdicts match `VerificationRecord.confidence_value` ranges (tenet-verification README §"Confidence Thresholds")
- Notification payloads match `NotificationCategory.MINIMAP_QUALITY_GATE` enum
If test fails due to spec drift, test PR must include spec.md update.

**Reconciliation 3: Gate Validation Before Release**
Before Phase 1 completion:
1. Smoke test on sample videos (10 videos, all tiers)
2. Manual analyst review of 5 flagged frames (confidence 0.65–0.75 range)
3. Cross-reference tenet-verification: submit 10 minimap verification payloads, validate confidence scores
4. Notification SLA check: flag 3 test frames, measure time-to-analyst-alert
All results logged in Phase 1 completion report (mirrors tenet-verification completion pattern)

---

## Part 2: Repository Framework Assessment

### A. Existing Verification Systems

**Found:**
- **TeneT Verification Service** (`services/tenet-verification/`): Weighted consensus algorithm with confidence scoring (0.0–1.0 range). Supports 10+ data sources with configurable trust levels. Thresholds: ≥0.90 ACCEPTED, 0.70–0.89 FLAGGED, <0.70 REJECTED. Database models: `VerificationRecord`, `DataSourceContribution`, `ReviewQueue`. API: `POST /v1/verify`, `GET /v1/review-queue`, `POST /v1/review/{entity_id}`.
- **Review Queue System**: Manual review dashboard for flagged entities. `ReviewQueue` ORM model tracks reviewer decisions and audit trail.
- **Data Source Registry** (`data/schemas/tenet-protocol.ts` line 54): `minimap_analysis` already registered as MEDIUM trust (weight 0.8). No schema change needed.
- **Confidence Breakdown**: Field-level confidence calculation with agreement bonus/penalty (README.md §"Confidence Algorithm").

**Gap:**
- No **frame-level checkmark system**—only entity-level (match-level) verification exists. Minimap frames need individual pass/fail/review status.
- No **quality gate verdict tagging**—existing system stores confidence scores but not explicit ACCEPT/FLAG/REJECT verdicts in the verification record itself.
- No **analytics output integration**—current system does not accept structured CV results (player dots, spike position) as first-class data sources; would need new `trust_level` and schema updates.

**Recommendation:**
1. Extend `VerificationRecord` model to include `quality_gate_verdict` ENUM field (ACCEPT | FLAG | REJECT)
2. Add new `checkmark_signals` JSONB field that stores array of `{category, score}` tuples (mirrors `confidence_breakdown` structure)
3. Register new data source `minimap_analytics` (sister to `minimap_analysis`) with trust level MEDIUM (0.7, slightly lower than raw CV due to inference step)
4. Add migration: `services/tenet-verification/migrations/` new Alembic version extending VerificationRecord
5. Update `confidence_calculator.py` to accept analytics results as additional source when computing final confidence

---

### B. Existing Roadmap/Planning

**Found:**
- **MASTER_PLAN.md**: Authoritative phase-based roadmap with 13 phases (0–13). Current status: Phase 7–10 active, Phase 11+ pending. Each phase has gate criteria and status indicators (✅ COMPLETE, 🟡 UNLOCKED, 🔒 BLOCKED). Versioned with `[Ver001.002]` header. All phases modeled as sequential milestones.
- **PHASE_GATES.md** (`.agents/`): Go/No-Go criteria per phase. Prevents agent work on locked phases. Template: gate description → required artifacts → completion signal.
- **Phase Logbooks** (`.agents/phase-logbooks/`): Historical record of each phase—decisions made, blockers encountered, handoff context.
- **AGENTS.md**: Known gaps and current project state. Updated each session when gaps are discovered.
- **Session Handoff Protocol** (`docs/ai-operations/SESSION_LIFECYCLE.md`): Stage-based lifecycle (Stage 1: Cleanup, Stage 2: Orient, Stage 3: Plan, Stage 4: Work, Stage 5: Close). Handoffs written to `.agents/session/CONTEXT_FORWARD.md`.

**Gap:**
- No **sub-project roadmaps**—all roadmapping is at MASTER_PLAN level (13 phases). Sub-features like minimap extraction cannot declare their own phase structure without modifying MASTER_PLAN.
- No **canonical truth document registry**—scattered across MASTER_PLAN.md, spec.md, requirements.md with no clear indexing system. If a user reads 3 different documents about minimap, no single source of truth is obvious.
- No **phase expansion protocol**—if Phase 1 reveals new scope, there's no formal way to document it without touching MASTER_PLAN.md. Creates version control friction.
- No **approval workflow for roadmap changes**—CODEOWNER_CHECKLIST.md covers code changes but not roadmap updates.

**Recommendation:**
1. Create `.agents/registry/minimap-truth-index.md`:
   - Single source of truth listing: spec.md (architecture), requirements.md (user-facing PRD), minimap-roadmap.md (internal phases 1–5)
   - Versioning: All three documents MUST include `[VerMMM.mmm]` header. Index tracks versions: "spec.md [Ver001.001], requirements.md [Ver000.100], roadmap.md [Ver000.000]"
   - Update rule: When any canonical doc changes, update index within same commit
2. Create `.agents/session/minimap-roadmap.md` (separate from MASTER_PLAN.md):
   - 5 phases with own gates (Phase 1: Dual-stream extraction, Phase 2: Analytics, Phase 3: Sight lines, Phase 4: ML, Phase 5: Production)
   - Each phase includes effort estimate, risk rating, dependencies
   - Links back to MASTER_PLAN.md §11 (Phase 11 Browser Extension) as parent
   - Change control: Updates require PR review by @notbleaux (add to CODEOWNER_CHECKLIST.md as "C-11.A Minimap roadmap updates")
3. Modify MASTER_PLAN.md footnote (§11): "For minimap extraction sub-phases, see `.agents/session/minimap-roadmap.md`"
4. Create new CODEOWNER checklist entry: "C-11.A | Minimap roadmap phase expansion | UNCLAIMED | — | Add to this entry when roadmap is formally adopted"

---

### C. Existing Notification/Escalation

**Found:**
- **Push Notification Service** (`packages/shared/api/src/notifications/push_service.py`): VAPID-based Web Push protocol. Supports subscription management, message delivery, and audit logging via `NotificationLog` ORM model. Tests in `test_push_service.py` (587 lines, 26+ test cases). Categories: `NotificationCategory` enum (extensible).
- **Notification Preferences** (`packages/shared/api/schemas/notifications.py`): User-level category preferences (per-user opt-in/opt-out for each category).
- **Audit Trail**: `NotificationLog` table tracks sent-at, delivery status, recipient, category.
- **Circuit Breaker Pattern** (referenced in legacy-compiler README §"Typical Issues"): External service calls wrapped with retry logic and timeout handling.
- **Health Checks**: All services have `/health` and `/ready` endpoints; monitoring infrastructure exists.

**Gap:**
- No **analyst escalation workflow**—Push Service sends to end users, not to internal analyst teams. Minimap review queue (flagged frames) has no dedicated analyst notification channel.
- No **criticality levels**—notifications are uniform; no way to mark "CRITICAL: frame quality failed entire match" vs "INFO: frame processed"
- No **approval feedback loop**—analyst reviews flagged frames but no mechanism for feedback to circle back to extraction job (no `analyst_feedback` field in `minimap_verification_results`)
- No **Slack/Discord webhook integrations**—all notifications are Web Push (browser-based). Team coordination happens outside the system.

**Recommendation:**
1. Extend `NotificationCategory` enum to include: `MINIMAP_QUALITY_GATE` (new), `MINIMAP_ANALYST_REQUIRED` (new)
2. Add `criticality_level` field to `PushMessage` schema: `CRITICAL | HIGH | NORMAL | LOW`. Update Push Service `/v1/send` endpoint to accept this field.
3. Implement **analyst escalation endpoint** in minimap-extractor:
   - `POST /v1/jobs/{job_id}/analyst-review?priority=CRITICAL` → sends notification to `ROLE:analyst` subscriber group (new concept in Push Service)
   - Requires: extend `PushSubscription` model to support `subscriber_role` field (user vs. analyst vs. admin)
4. Add **approval feedback** column to `minimap_verification_results`:
   - `analyst_feedback` JSONB: `{reviewer_id, decision, notes, feedback_category: "CV_TUNING_NEEDED" | "GOOD_QUALITY" | "NEEDS_INSPECTION", created_at}`
   - Used for continuous improvement (feedback informs config adjustments)
5. Document Push Service extension in `packages/shared/api/README.md` (add section "Analyst Escalation Workflow")
6. Post-Phase 1: Slack webhook integration (Phase 2+ feature, out of scope for Phase 1)

---

### D. Existing Session Management & Working Notebooks

**Found:**
- **Session Lifecycle Protocol** (`docs/ai-operations/SESSION_LIFECYCLE.md`): Formal 5-stage lifecycle (Cleanup, Orient, Plan, Work, Close). Mandatory before any session work.
- **Phase Logbooks** (`.agents/phase-logbooks/Phase-N-LOGBOOK.md`): Per-phase history. Content: dates, decisions, blockers, handoff context. Kept in repo indefinitely for audit trail.
- **Context Forward System** (`.agents/session/CONTEXT_FORWARD.md`): End-of-session handoff. Includes: in-progress work, open questions, next-session action items, phase expansion summary. Read at session start (Stage 2).
- **Working Notebooks** (`notebooks/` directory): Session-scoped planning docs (notebook-01 through notebook-07 exist). Typically markdown, scoped to current phase.
- **Todo Tracking**: No built-in todo system; agents use manual `# TODO` comments in code or handoff docs.

**Gap:**
- No **standardized sub-project notebook template**—minimap extraction has no canonical working doc structure. Each agent invents their own section hierarchy.
- No **todo consolidation system**—todos scattered across: code comments, notebook sections, CONTEXT_FORWARD.md, PR descriptions. No single registry.
- No **session artifact index**—when a session ends, there's no clear "here are the artifacts created in this session" list. Logbooks are manual.
- No **notification to user of session completion**—no structured output to the user (e.g., "Session 4 complete. Phase 1 readiness: 95%. Next session: finalize testing.") required by AGENT_CONTRACT.md

**Recommendation:**
1. Create **standardized sub-project notebook** template (`.agents/templates/subproject-notebook.md`):
   ```markdown
   # Minimap Extraction — Session N Working Notebook
   ## Phase & Status
   [Current phase, gate status, completion %, blockers]
   
   ## Daily Log
   [Day-by-day summary: what was done, decisions made, time spent]
   
   ## Artifacts This Session
   [List of files created/modified: spec.md v0.2, tests added, etc.]
   
   ## Open Questions
   [Items awaiting user input or design decision]
   
   ## Next Session Priorities
   [Ordered list of tasks for next session]
   ```
   
2. Implement **todo consolidation** in `.agents/session/CONTEXT_FORWARD.md`:
   - Section: "## Active TODOs"
   - Migrate all scattered todos here at session end (scan code for `TODO minimap_extraction:`, collect from PR reviews, etc.)
   - Format: `- [job_id] [priority] [owner] [description]`
   
3. Create `.agents/session/SESSION_{N}_ARTIFACTS.md` at session close:
   - Auto-generated list of all files created/modified (can parse git log)
   - Includes: line counts, test coverage, performance metrics
   - Purpose: transparency to user about "what happened this session"
   
4. Add **session completion notification** requirement to AGENT_CONTRACT.md:
   - At session close, agent writes structured completion report to stdout with:
     - Phase: X, Completion: Y%, Status: [ON_TRACK | AT_RISK | BLOCKED]
     - Files modified: N, Tests added: M, Bugs fixed: L
     - Next session recommendation: [priority task]
   - User reads this before reviewing PR

---

## Part 3: KEY Component/Dependency — Unified Quality Gate System

**Bullet Point:**
The **Unified Quality Gate System** (extending existing tenet-verification service with frame-level checkmarks) is the critical architectural dependency that must be implemented **before** analytics, sight lines, or notifications can integrate into the verification pipeline.

---

### Expansion Paragraph

The Minimap Extraction Service operates on a **dual-stream architecture**: Stream A (raw JPEGs) goes directly to storage; Stream B (structured CV analysis) is optional enrichment. Both streams must eventually feed into the TeneT Verification Service for confidence scoring and truth-layer routing (Path A live, Path B legacy).

Currently, tenet-verification operates at **entity level** (entire match: is this match data reliable?). Minimap extraction requires **frame-level verification** (is this individual frame's CV analysis reliable?). The problem: there is no existing frame-level quality gate in the system.

**Critical Dependency Chain:**
1. **Stream B outputs CV results** (player dots, spike position) → stored in `minimap_frames_stream_b` table with `analysis_confidence` score
2. **Quality gate scores the frame** → compares Stream A (JPEG entropy) vs. Stream B (CV confidence) → assigns verdict (ACCEPT/FLAG/REJECT)
3. **Verdict routes frame** → ACCEPT frames go to TeneT service as verified truth; FLAGGED frames go to analyst review queue; REJECTED frames archived as corrupted
4. **Analytics hook in** → xkill/xround detectors process only ACCEPTED frames (high-quality data); low-quality frames don't pollute analytics
5. **Notifications fire** → analyst dashboard shows flagged frames; critical failures alert team

**Without the unified gate:**
- Stream B → Notification becomes decoupled (notifications don't know if frame was accepted or rejected)
- Analytics → TeneT integration fails (analytics can't distinguish high-quality input from garbage)
- Review workflow breaks (no formal "analyst must approve this frame" contract)

**Risk if Not Addressed Early:**
- Phase 1 ships Stream A/B without quality gate → Phase 2 tries to build analytics on unreliable frames → Phase 2 analytics tests fail
- Verification service gets duplicate responsibility (match-level AND frame-level verification) → service becomes complex, hard to test
- Notifications fire for low-confidence frames that were never meant to be verified → analyst gets spammed, ignores system

**Recommended Implementation Approach:**

1. **Phase 1A (immediate):** Extend tenet-verification service
   - Add new migration: `services/tenet-verification/migrations/007_frame_level_verification.py`
   - New ORM model: `FrameLevelVerificationRecord` (frame_id FK, job_id FK, verdict ENUM, checkmark_signals JSONB)
   - New endpoint: `POST /v1/verify/frame` (accepts Stream B frame data, returns verdict + confidence)
   - New database index: `(job_id, verdict, created_at)` for analyst review queue filtering

2. **Phase 1B (integration):** Wire minimap → tenet frame-level endpoint
   - Add `submit_frame_verification()` async method to `services/minimap-extractor/tenet_client.py`
   - After Stream B completes: call `POST /v1/verify/frame` with CV results
   - Wait for verdict (synchronous, <100ms latency target)
   - Store `tenet_frame_verdict` in `minimap_verification_results`

3. **Phase 1C (validation):** Test the gate
   - Unit test: 10 frame inputs (high/low CV confidence) → check verdicts match expectations
   - Integration test: minimap job end-to-end → check that FLAGGED frames appear in tenet review-queue
   - Performance test: 1000 frames/job → verify `POST /v1/verify/frame` latency stays under 100ms per frame

**Timeline Impact:**
- Gate implementation: 1 session (8–12 hours)
- Integration: 0.5 sessions (4–6 hours)
- Testing + fixes: 1 session (8–12 hours)
- **Total: ~2 sessions before Phase 1 is "verification-complete"**

This is a **necessary prerequisite** for Phase 2 (analytics) and Phase 1.5 (notifications) to function correctly.

---

## Recommendations Summary

1. **Adopt Unified Verification Model**: Extend tenet-verification with frame-level `FrameLevelVerificationRecord` ORM model. Implement `POST /v1/verify/frame` endpoint before Phase 1 ships.

2. **Create Sub-Project Roadmap**: Establish `.agents/session/minimap-roadmap.md` as canonical truth for 5-phase structure (extraction, analytics, sight lines, ML, production). Link from MASTER_PLAN.md §11.

3. **Implement Quality Gate Registry**: Create `.agents/registry/minimap-truth-index.md` listing spec.md, requirements.md, roadmap.md as canonical docs. Enforce versioning (`[VerMMM.mmm]`). Add to CODEOWNER_CHECKLIST.md for approval.

4. **Extend Push Notification Service**: Add `MINIMAP_QUALITY_GATE` and `MINIMAP_ANALYST_REQUIRED` categories. Implement `criticality_level` field. Wire quality gate verdicts to analyst notification channel (new `ROLE:analyst` subscriber group).

5. **Build Comprehensive Test Suite**: Target 85% code coverage for Stream A/B extraction, 95% for quality gate, 70% for analytics. Mirror tenet-verification testing patterns. Include notification delivery and analyst workflow tests.

6. **Standardize Session Artifacts**: Create `.agents/templates/subproject-notebook.md` template. Implement `.agents/session/SESSION_N_ARTIFACTS.md` auto-generated artifact index. Add session completion report to AGENT_CONTRACT.md required outputs.

7. **Plan Phase 2 Expansion Carefully**: Advanced analytics (xkill/xround/zones) are non-blocking enrichments stored in JSONB `advanced_analytics` field. Sight lines are deferred to Phase 3. Do NOT couple Phase 1 to Phase 3 scope.

8. **Establish Approval Workflow**: Add "C-11.A Minimap roadmap updates" to CODEOWNER_CHECKLIST.md. Require @notbleaux sign-off before phase expansion changes are merged.

---

## Next Steps (Awaiting User Approval)

This analysis is presented for your review. Once approved, I will:

1. **Refine Assessment** — Incorporate your feedback on architectural decisions (especially frame-level verification approach and analytics layering strategy)

2. **Finalize spec.md** — Integrate full scope expansion (advanced analytics, sight lines schema, verification checkmarks, notification integration). Increment to [Ver001.002].

3. **Create 5-Phase Plan** — Develop `.agents/session/minimap-roadmap.md` with detailed gate criteria, effort estimates, and risk mitigation for Phase 1–5

4. **Prepare Implementation Roadmap** — Create `plan.md` with sprint-level breakdown for Phase 1 (Dual-Stream Extraction):
   - Sprint 1A: Quality gate framework (2–3 sessions)
   - Sprint 1B: Stream A JPEG extraction + testing (2 sessions)
   - Sprint 1C: Stream B CV analysis + cross-stream verifier (3 sessions)
   - Sprint 1D: TeneT integration + notification wiring (1–2 sessions)
   - Sprint 1E: End-to-end testing, Phase 1 gate validation (1 session)

5. **Spawn Implementation Subagents** — Once plan approved:
   - Schema-agent: extends tenet-verification frame-level models + creates spatial-coordinates.ts
   - Backend-agent: implements quality gate + analytics modules
   - Test-agent: builds comprehensive test suite
   - Ops-agent: session management, documentation, approvals
   - Parallel execution with clear handoff points

---

**Document Version:** [Ver001.000]
**Status:** DRAFT — Awaiting User Approval Before Planning Phase
**Next Review:** After user feedback on Key Dependency and architectural recommendations
