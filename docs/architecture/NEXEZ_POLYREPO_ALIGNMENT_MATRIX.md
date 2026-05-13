[Ver001.000]

# NeXeZ Polyrepo Alignment Matrix

**Version:** 1.0.0  
**Date:** 2026-05-13  
**Scope:** Strategic alignment only (no feature implementation)  
**Authority:** Approved continuation decisions from Elijah Bleaux (AB)

---

## Purpose

This matrix cross-references current architecture/planning documents and resolves strategic drift so future monorepo-to-polyrepo evolution remains integration-safe, without breaking service contracts or forcing large refactors.

---

## Decision Traceability (4 Blocking Decisions)

| Blocking Decision | Canonical Interpretation | Primary Artifact(s) |
|---|---|---|
| 1) Unified platform direction | NeXeZ / NuMuN command-center target with sequential staged implementation | `docs/adrs/adr-004-nexez-strategy-and-delivery-governance.md`, `docs/master-plan/master-plan.md` |
| 2) Must-have vs nice-to-have framework | 13-question 1–5 scoring model with lane-based execution | `docs/adrs/adr-004-nexez-strategy-and-delivery-governance.md`, `docs/roadmap/roadmap.md` |
| 3) Stack/deployment confirmation | REST + PixiJS + Docker Compose; deploy via Vercel + Railway/Render | `docs/adrs/adr-004-nexez-strategy-and-delivery-governance.md`, `docs/master-plan/master-plan.md` |
| 4) Simplified ADR-first governance | Simplified ADR now, SATOR-inspired refinement later | `docs/adrs/adr-004-nexez-strategy-and-delivery-governance.md`, `docs/master-plan/master-plan.md` |

---

## Cross-Document Consistency Audit

| Area | Prior Drift / Risk | Resolution Implemented |
|---|---|---|
| Repo strategy wording | Monorepo decisions existed without explicit polyrepo-readiness continuation language | Added “monorepo-now, polyrepo-ready” strategy addendum and extraction-readiness checkpoints |
| Early sprint continuation | Existing roadmap phases lacked approved Sprint 0–3 continuation framing | Added Strategic Continuation Sprint Track (Sprint 0–3) with exits/checkpoints |
| Prioritization framework | Must-have/nice-to-have scoring method not formally standardized | Added 13-question 1–5 scoring framework and lane routing |
| Deployment wording | Existing hosting mentions not explicitly tied to approved Vercel + Railway/Render path | Added explicit deployment confirmation in ADR and master plan addendum |
| Governance pathway | ADR process documented, but no explicit simplified-now/SATOR-later path | Added governance refinement path in ADR and master plan |
| LIVEservice stability | General quality gates existed, but no explicit live-service guardrail set for this continuation | Added rollout isolation, preview validation gates, budgets, and release cadence controls |

---

## Repository Structure Alignment State

| Dimension | Current State | Target State | Integration Safety Rule |
|---|---|---|---|
| Code hosting model | Single monorepo | Polyrepo-ready boundaries with controlled extraction triggers | No split until triggers + package/version/CI prerequisites are met |
| Shared contracts | Workspace-local shared packages | Stable cross-repo contracts | Keep schema/API contracts versioned and backward-compatible |
| Deployment topology | Frontend + backend separated by platform | Same topology with clearer platform mapping | Keep preview/staging validation mandatory before production rollout |

---

## Alignment Exit Criteria

- [ ] ADR-004 accepted and referenced in roadmap/master plan  
- [ ] Sprint 0–3 continuation track published with measurable exits  
- [ ] Must-have/nice-to-have scoring template adopted for planning decisions  
- [ ] Monorepo-now/polyrepo-ready language harmonized across architecture docs  
- [ ] LIVEservice stability guardrails documented and linked to release process
