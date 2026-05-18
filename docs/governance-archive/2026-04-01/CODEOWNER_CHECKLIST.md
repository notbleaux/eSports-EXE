[Ver001.001]

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

### Archive Migration — Cross-Phase

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-ARCH.1 | Push `Archived/` subtree to `notbleaux/eSports-EXE-archives` then `git rm -r Archived/` `[CRIT]` | UNCLAIMED | — | Archive repo created 2026-03-27. Migration stub in `.agents/ARCHIVE_INDEX_SCHEDULE.md`. 24h hold after approval. Irreversible. |

### Phase 7 — Repository Governance

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-7.2 | Job Board permanent deletion — 329 files `[CRIT]` PR | COMPLETED | notbleaux | Deletion complete 2026-03-27 — reference scrub complete — ready for PR merge |
| C-7.X | Visual Design Book — Phase 0-X research task claim | CLAIMED → ACTIVE | claude-sonnet-4-6 | Approved by @notbleaux 2026-03-27 via session instruction. 3-batch research: R1–R6 + S1 synthesis. Reports to `docs/superpowers/visual-design-book/reports/`. |

### Phase 8 — API Gateway and Auth

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-8.2 | Auth0 tenant configuration — requires @notbleaux credentials | UNCLAIMED | — | Agent creates setup guide, human configures |

### Phase 12 — Content and Prediction Platform

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-12.B | Betting/Prediction UI — gambling-adjacent opt-in | UNCLAIMED | — | Deliberate feature, not default |

### Phase 13 — Production Launch

| ID | Task | Status | Agent | Notes |
|----|------|--------|-------|-------|
| C-13.D | Production deployment — irreversible | UNCLAIMED | — | All Phase 10+11+12 gates must pass first |

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| UNCLAIMED | No agent has claimed this task |
| PENDING_APPROVAL | Agent has submitted claim PR, awaiting @notbleaux approval |
| CLAIMED → ACTIVE | @notbleaux approved — agent may proceed |
| COMPLETED | Task complete, gate passed |
| BLOCKED | External blocker (e.g. awaiting user credentials) |
