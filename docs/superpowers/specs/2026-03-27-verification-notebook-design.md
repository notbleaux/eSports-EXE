[Ver001.000]

# Design Spec: Approach 3++ Verification Notebook

**Date:** 2026-03-27 | **Status:** Approved | **Topic:** Phase 1–5 Verification + Anti-Bloat System

---

## Summary (T0 — 5 lines max)
Single-file verification notebook for NJZ platform phases 1–5. Reference-only (no gate duplication). State-machine driven. Self-compressing via promote-out rule. Archives as xCOMP_ when complete.

---

## Structure

| Section | Budget | Form |
|---|---|---|
| STATE block | 4 lines | CMPRS |
| Self-sealing meta | 5 lines | CMPRS |
| Glyph vocabulary | 8 lines | CMPRS |
| Compressed Log Page (CLP) | 50 lines max | CMPRS |
| Bloat solutions S1/S2/S3 | 30 lines | EXP |
| Phase 1–4 sections (each) | 20 lines | STD |
| Phase 5 section | 30 lines (incl. sub-task table) | STD |
| Sub-agent assessment | 20 lines | EXP |
| Distillation checklist | 10 lines | STD |

---

## State Machine (full enumeration)
DRAFT → REF_I → REF_II → REF_III → ACTIVE → P1_READ → P1_UPDATE → P1_VERIFIED → P2_READ → P2_UPDATE → P2_VERIFIED → P3_READ → P3_UPDATE → P3_VERIFIED → P4_READ → P4_UPDATE → P4_VERIFIED → P5_READ → P5_UPDATE → P5_VERIFIED → DISTILLING → COMP

---

## Key Rules
- **Reference-not-duplicate**: Phase sections reference PHASE_GATES.md gate IDs only; no repeated criteria
- **Promote-out**: Observations >2 lines must go to an authoritative doc; notebook records destination
- **Claimed-by guard**: CLAIMED field in STATE block prevents concurrent writes
- **Form triggers**: CMPRS→CLP/STATE; STD→obs/update logs; EXP→solutions/assessment only
- **Issue IDs**: P{n}-OB-{latin} for observations, P{n}-FX-{latin} for fixes
- **Archive trigger**: All gates verified + distillation complete → rename to xCOMP_

---

## Bloat Solutions
- **S1** — Canonical single-truth + reference-only policy (pre-commit fingerprint check)
- **S2** — Tiered doc classification T0/T1/T2 with `.doc-tiers.json`
- **S3** — Mandatory summary headers on all `.agents/` and `docs/` files (≤5 lines, ≤200 chars)
