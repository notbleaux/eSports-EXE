[Ver001.002]

# CODEOWNER Checklist — NJZ eSports Platform

**Purpose:** All tasks requiring CODEOWNER approval before agents may proceed.
**Tier:** T0 — always loaded.
**Authority:** `.agents/AGENT_CONTRACT.md §CODEOWNER_APPROVAL_REQUIRED`

An agent MUST NOT begin a CODEOWNER_APPROVAL_REQUIRED task without a CLAIMED entry here confirmed by @notbleaux.

---

## Claiming Protocol

1. Agent reads this file and confirms the task is UNCLAIMED
2. Agent opens a PR adding a CLAIM comment to the relevant entry (status: PENDING_APPROVAL)
3. @notbleaux reviews the claim and approves via PR review (status: CLAIMED → ACTIVE)
4. Agent proceeds only after ACTIVE status is set

---

## CODEOWNER_APPROVAL_REQUIRED Touchpoints

### Multi-Agent Governance — Current Sprint

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-MA.1 | Multi-Agent Shared Context Framework v1.1 — review and approve `.agents/COORDINATION_PROTOCOL.md` | CLAIMED → ACTIVE | kimi-k2-6 | Approved by @notbleaux via session instruction. Testing mode for 3-agent environment (Claude × Copilot × Kimi). Friction logging active. |
| C-MA.2 | Agent Contract v1.004 — review multi-agent shared context rules | CLAIMED → ACTIVE | kimi-k2-6 | Approved by @notbleaux via session instruction. Updates Stage 2 orient sequence, adds shared context rules and prohibited actions. |
| C-MA.3 | Polyrepo Registry update — reflect active Kimi agent and current plan states | CLAIMED → ACTIVE | kimi-k2-6 | Approved by @notbleaux via session instruction. Update `polyrepo/registry/index.json` counters and plan statuses. |

### Archive Migration — Cross-Phase

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-ARCH.1 | Push `Archived/` subtree to `notbleaux/ZeSporteXte-archives` then `git rm -r Archived/` `[CRIT]` | UNCLAIMED | — | Archive repo created 2026-03-27. Migration stub in `.agents/ARCHIVE_INDEX_SCHEDULE.md`. 24h hold after approval. Irreversible. |

### Phase 7 — Repository Governance

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-7.2 | Job Board permanent deletion — 329 files `[CRIT]` PR | COMPLETED | notbleaux | Deletion complete 2026-03-27 — reference scrub complete — ready for PR merge |
| C-7.X | Visual Design Book — Phase 0-X research task claim | CLAIMED → ACTIVE | claude-sonnet-4-6 | Approved by @notbleaux 2026-03-27 via session instruction. 3-batch research: R1–R6 + S1 synthesis. Reports to `docs/superpowers/visual-design-book/reports/`. |

### Phase 8 — API Gateway and Auth

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-8.2 | Auth0 tenant configuration — requires @notbleaux credentials | UNCLAIMED | — | Agent creates setup guide, human configures |

### Phase 9 — Web App UI/UX Enhancement

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-9.19 | `packages/@njz/ui/README.md` manual review (Phase 9.19 gate) | CLAIMED → ACTIVE | claude-sonnet-4-7 | Per PR #17 commit. Full component documentation rewrite. Manual review required per PHASE_GATES.md. |
| C-9.20 | Lighthouse threshold achievement — CI gate re-enable | UNCLAIMED | — | Blocked on UI stabilization. Playwright sprint (PLN-004) may unblock. |

### Phase 12 — Content and Prediction Platform

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-12.B | Betting/Prediction UI — gambling-adjacent opt-in | UNCLAIMED | — | Deliberate feature, not default |

### Phase 13 — Production Launch

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-13.D | Production deployment — irreversible | UNCLAIMED | — | All Phase 10+11+12 gates must pass first |

### Integration Testing Infrastructure

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-INT.1 | Docker Compose test stack repair — 3+ documented bugs | UNCLAIMED | — | From PR #17 analysis: test-api command override wrong, test-db mounts alembic .py instead of .sql/.sh. Blocked; needs focused sprint. |
| C-INT.2 | Playwright E2E diagnostic + remediation sprint | CLAIMED → ACTIVE | TBD (Claude opened PR #45) | PR #45 opened. 6-step sprint plan defined. Owner: TBD (could be Kimi, human, or fresh Claude session). |

### External Service Reconciliation

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-EXT.1 | Vercel secrets configuration — `api_url`, `ws_url`, `sentry_dsn` | COMPLETED | claude-sonnet-4-7 | PR #43: removed undefined secret refs from vercel.json. Production values to be set via Vercel dashboard. |
| C-EXT.2 | Supabase frontend wiring — install @supabase/supabase-js, create client, generate TS types | UNCLAIMED | — | PR #43 updated .env.example. Full wiring deferred to separate sprint. |
| C-EXT.3 | ~148-file documentation rename sweep (eSports-EXE → ZeSporteXte) | UNCLAIMED | — | Deferred to Kimi Stage 1 per PR #43 reconciliation report. Non-functional; suitable for long-horizon task. |

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| UNCLAIMED | No agent has claimed this task |
| PENDING_APPROVAL | Agent has submitted claim PR, awaiting @notbleaux approval |
| CLAIMED → ACTIVE | @notbleaux approved — agent may proceed |
| COMPLETED | Task complete, gate passed |
| BLOCKED | External blocker (e.g. awaiting user credentials) |

