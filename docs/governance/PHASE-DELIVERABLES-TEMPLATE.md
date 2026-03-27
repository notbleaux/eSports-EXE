[Ver001.000]

# Phase Deliverables Template — NJZ eSports Platform

**Purpose:** 3×3×3 success deliverables framework for each phase. Defines what Done looks like at three fidelity levels across three quality groups.
**Tier:** T1 — create a copy per phase in `.agents/session-workplans/Phase-N/phase-deliverables.md`
**Phase Sequencing:** Active from Phase 9 (current phase). Create `Phase-9/phase-deliverables.md` at Phase 9 session start. Not deferred to Phase 10.
**Authority:** `MASTER_PLAN.md §12` · `SESSION_LIFECYCLE.md Stage 3`
**Framework:** NJZPOF v0.2
**Seal Date:** [Created: YYYY-MM-DD Phase N-Start]

---

## 3×3×3 Framework Overview

```
3 Groups × 3 Degrees of Fidelity × 3 Conditions = 27 Deliverables per Phase

Groups:
  G1 — Core Functionality      (the phase builds and works)
  G2 — Framework Compliance    (the phase follows NJZPOF and project conventions)
  G3 — Quality & Resilience    (the phase is robust and maintainable)

Degrees of Fidelity:
  D1 — Gate Minimum            (gate PASSES — baseline acceptance)
  D2 — Quality Standard        (production-ready — what SHOULD be true)
  D3 — Excellence              (exceeds standard — aspirational, not required)

Conditions (per cell):
  C1 — Technical MUST HAVE     (observable, measurable, verifiable by command)
  C2 — Framework Principle     (satisfies NJZPOF structural requirement)
  C3 — Project Vision          (advances the NJZ eSports platform goal)
```

### Priority Stratification

| Priority | Cells | Rule |
|----------|-------|------|
| **MUST** | All G1-D1 cells (3 items) | Session cannot close without all 3 ✅ |
| **SHOULD** | G2-D2, G3-D2 (6 items) | Target for every session; log if skipped |
| **NICE-TO-HAVE** | All D3 cells (9 items) | Complete if time allows; no session-close obligation |

---

## Deliverables Table Template

**Phase:** N — [Phase Name]
**Session Mapping:** Each deliverable maps to one or more session TODO items (gate refs).
**Failure Thresholds:** Defined per cell — the specific condition that marks the deliverable FAILED.

| Group | Fidelity | C1: Technical MUST HAVE | C2: Framework Principle | C3: Project Vision | Priority | Failure Threshold | Gate Ref | Session |
|-------|----------|------------------------|------------------------|-------------------|----------|------------------|----------|---------|
| **G1** | D1 | [measurable tech requirement] | [NJZPOF rule this satisfies] | [platform goal this advances] | **MUST** | [specific condition = FAIL] | N.X | [date] |
| **G1** | D2 | [quality bar — production-ready tech] | [framework compliance standard] | [vision alignment at quality level] | **SHOULD** | [condition = FAIL] | N.X | [date] |
| **G1** | D3 | [excellence bar — exceeds standard] | [framework principle at highest level] | [vision alignment at excellence] | NICE | [condition = FAIL] | N.X | [date] |
| **G2** | D1 | [framework baseline compliance tech] | [minimum NJZPOF conformance] | [convention adoption] | **MUST** | [condition = FAIL] | N.X | [date] |
| **G2** | D2 | [framework quality compliance tech] | [full NJZPOF conformance] | [convention mastery] | **SHOULD** | [condition = FAIL] | N.X | [date] |
| **G2** | D3 | [framework excellence tech] | [NJZPOF extension/contribution] | [convention leadership] | NICE | [condition = FAIL] | N.X | [date] |
| **G3** | D1 | [resilience baseline tech] | [minimum quality gate] | [stability for platform] | **MUST** | [condition = FAIL] | N.X | [date] |
| **G3** | D2 | [resilience quality tech] | [quality standard gate] | [quality for platform growth] | **SHOULD** | [condition = FAIL] | N.X | [date] |
| **G3** | D3 | [resilience excellence tech] | [quality excellence gate] | [quality for platform longevity] | NICE | [condition = FAIL] | N.X | [date] |

---

## Failure Threshold Guidelines

A failure threshold must be **specific and verifiable**. Examples of good vs. bad thresholds:

| ❌ Bad (vague) | ✅ Good (specific) |
|--------------|------------------|
| "Tests don't pass" | "`pnpm test:unit` exits non-zero" |
| "Code is messy" | "ESLint reports > 0 errors on changed files" |
| "Documentation is incomplete" | "Gate N.X has no entry in PHASE_GATES.md" |
| "Framework not followed" | "Session TODO has items without gate refs" |
| "Not production ready" | "TypeScript strict mode reports errors in new files" |

---

## Session Mapping Rules

Each deliverable's `Session` column records **which session date completed it**.

- D1 deliverables for a gate are completed in the **same session as the gate**
- D2 deliverables may be spread across multiple sessions if gate work is large
- D3 deliverables are optional — leave blank if not completed

When a session TODO item is marked `[x]`, also update this table's `Session` column for the corresponding deliverable.

---

## Example: Phase 8 Deliverables (Auth0 Integration)

**Phase:** 8 — Authentication (Auth0)
**Seal Date:** [Created: TBD Phase 8-Start — blocked on C-8.1]
**Prerequisite:** USER_INPUT_REQUIRED C-8.1 (Auth0 tenant setup) — UNCLAIMED

| Group | Fidelity | C1: Technical MUST HAVE | C2: Framework Principle | C3: Project Vision | Priority | Failure Threshold | Gate Ref | Session |
|-------|----------|------------------------|------------------------|-------------------|----------|------------------|----------|---------|
| **G1** | D1 | Auth0 SDK installed; login/logout routes functional; JWT validated on API | AGENT_CONTRACT domain boundary respected — infra domain owns auth config | User can authenticate to access platform features | **MUST** | Login route returns 4xx; JWT not validated on protected endpoint | 8.1 | — |
| **G1** | D2 | Token refresh working; protected routes redirect unauthenticated users | PHASE_GATES.md gate 8.1 marked PASSED with verification command | Auth flow matches NJZ eSports brand experience | **SHOULD** | Token refresh fails after expiry; protected route accessible without auth | 8.2 | — |
| **G1** | D3 | Social login (Discord/Twitch) configured; MFA available | ADR written for auth provider choice | Single-click login from eSports platform entry points | NICE | — | 8.3 | — |
| **G2** | D1 | Auth secrets in environment variables only; no keys in code | AGENT_CONTRACT: no secrets committed; pre-commit hook blocks | Security baseline for production deployment | **MUST** | `detect-secrets` pre-commit hook fires on any auth file | 8.1 | — |
| **G2** | D2 | Auth module has unit tests; E2E test covers login flow | Tests written per CLAUDE.md test-alongside-code requirement | Reliable auth prevents user churn | **SHOULD** | `pnpm test:unit` fails on auth module | 8.2 | — |
| **G2** | D3 | Auth0 Actions configured for user role mapping to platform roles | SCHEMA_REGISTRY.md updated with UserRole type | Role-based feature access (Pro/Community/Analytics tiers) | NICE | — | 8.4 | — |
| **G3** | D1 | TypeScript strict; no `any` in auth module | CLAUDE.md: strict mode, no new `any` without comment | Auth errors caught at compile time | **MUST** | `pnpm run typecheck` reports errors in auth files | 8.1 | — |
| **G3** | D2 | Error states handled: token expired, invalid, network failure | Drift check: CONTEXT_FORWARD updated with auth config decisions | Users receive clear error messages on auth failure | **SHOULD** | Auth error shows blank page or unhandled exception | 8.2 | — |
| **G3** | D3 | Auth module README; failure modes documented | ARCHIVE_MASTER_DOSSIER updated if auth ADRs are created | Auth system understandable by future agents without reading code | NICE | — | 8.5 | — |

---

## Phase Deliverables File Location

Each phase gets its own instance of this template:

```
.agents/session-workplans/Phase-N/phase-deliverables.md
```

Create this file at Phase N-Start (when first gate begins). Seal with creation date.
Session TODO items reference deliverables via: `→ Maps to Phase Deliverable: [G1-D1]`
