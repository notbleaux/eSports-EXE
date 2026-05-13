[Ver001.000]

# Short-Term Report Expansion — Plan & PR Refinement Actions

**Date:** 2026-05-13  
**Scope:** Report-driven refinement for current phased planning sessions  
**Status:** Active (short-term execution set)

---

## Reports Reviewed for This Refinement

- `docs/reports/COMPREHENSIVE_THREE_PASS_REVIEW.md`
- `docs/reports/CRITICAL_REVIEW_RESPONSE.md`
- `docs/reviews/CONSULTANT_REPORT_REVIEW_PASS2.md`
- `docs/reviews/CONSULTANT_REPORT_REVIEW_PASS3.md`
- `docs/reviews/FINAL_ACTION_PLAN.md`
- `docs/reports/ONGOING_PLAN_MASTER_PLAN.md`

---

## Expanded Synthesis (What Needed Refinement)

1. Multiple reports identified strong architecture but incomplete execution closure for resilience, verification routing, and observability.
2. Planning language drift existed between older phase-blocked plans and current strategic continuation (NeXeZ/NuMuN + ADR-004 track).
3. Several recommendations were tactical but not normalized into one short-term, phase-linked, PR-ready task set.
4. LIVEservice protection requirements were present but fragmented across reports instead of treated as a gated delivery contract.

---

## Short-Term Actionable Task Set (5 Tasks)

| # | Task | Source Signal | Phase/Sprint Fit | Completion Signal |
|---|---|---|---|---|
| 1 | API resilience baseline (retry/backoff/circuit-breaker + endpoint rate-limit matrix) | Consultant Pass 3 + Final Action Plan | Sprint 1 / Must-Have Lane A | Failures are retried deterministically; endpoint limits documented and enforced |
| 2 | TENET verification de-stub + docs parity | Three-Pass Review + Final Action Plan | Sprint 1 / Must-Have Lane A | Verification endpoints return real confidence-tiered data and docs match implementation |
| 3 | SimRating transparency hardening (formula parity + confidence interval validation checks) | Critical Review Response + Consultant Pass 3 | Sprint 2 / Must-Have Lane A | Published formula mapping aligns with runtime behavior and CI validation checks pass |
| 4 | LIVEservice guardrail gate pack (preview gate + performance budget + rollback readiness) | Strategic continuation addendum + review feedback | Sprint 2 / Must-Have Lane A | No production promotion without guardrail checklist pass |
| 5 | PR governance refinement (ADR-lite traceability + blocker mapping section in planning PRs) | ADR-004 governance path + cross-report drift | Sprint 0/1 / Governance lane | Planning PRs include explicit blocker mapping and decision traceability |

---

## Suggestions for Immediate Execution (Per Task)

### Task 1 — API resilience baseline
- Suggestion A: implement one shared resilience pattern for all external API clients before adding client-specific edge logic.
- Suggestion B: lock per-endpoint rate limits in a single versioned config and treat changes as ADR-lite decisions.

### Task 2 — TENET verification de-stub
- Suggestion A: prioritize live match and match-by-id routes first to remove highest user-visible ambiguity.
- Suggestion B: require response contract checks in CI so docs and payload fields cannot drift.

### Task 3 — SimRating transparency hardening
- Suggestion A: add formula-component parity checks that fail CI if documented and implemented weights diverge.
- Suggestion B: publish confidence-tier thresholds next to formula definitions and reuse across API/UI.

### Task 4 — LIVEservice guardrail gate pack
- Suggestion A: enforce preview/staging checks as mandatory gate criteria for all high-impact PRs.
- Suggestion B: define a minimal rollback playbook trigger threshold tied to performance regression.

### Task 5 — PR governance refinement
- Suggestion A: require each planning PR to map updates back to approved blockers in one traceability table.
- Suggestion B: keep governance lightweight (ADR-lite) now, with deferred SATOR-style depth until later maturity gates.

---

## Decision Alignment Note

This refinement aligns with the approved strategic context:
- Unified NeXeZ/NuMuN direction
- Must-Have vs Nice-to-Have scoring model (13-question, 1–5)
- REST + PixiJS + Docker Compose baseline
- Vercel + Railway/Render deployment path
- Simplified ADR-first governance

