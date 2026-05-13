# ADR-004: NeXeZ Strategic Continuation, Delivery Scoring, and Governance Path

**Status:** Accepted  
**Date:** 2026-05-13  
**Deciders:** Elijah Bleaux (AB), Architecture Track  
**Technical Story:** Post-current-state continuation alignment for NeXeZ/NuMuN strategy

---

## Context and Problem Statement

The project required a unified strategic continuation update after current state, including polyrepo readiness expectations, an explicit prioritization model, confirmed stack/deployment direction, and governance simplification. Existing documents captured parts of this but not as one coherent, traceable decision set.

## Decision Drivers

- Need for a single strategic direction for NeXeZ / NuMuN command-center evolution
- Need to prioritize portfolio execution without degrading LIVEservice performance
- Need to lock stack/deployment choices for near-term implementation planning
- Need to reduce architectural drift through a simplified ADR-first process

## Considered Options

- Keep current plans as-is and interpret updates informally
- Produce ad-hoc sprint notes without architectural codification
- Codify approved decisions in a unified ADR + plan/roadmap/repo-structure alignment set

## Decision Outcome

Chosen option: **Codify approved decisions in a unified ADR + alignment set**.

The following are now official:

1. **Unified Platform Direction:** Build toward NeXeZ / NAIOH-OSS-CCP (**Nexus AI Orchestration Hub — Operations Systems and Services Command Center Platform**), a NuMuN-aligned command-center model, via sequential staged delivery.
2. **Prioritization Model:** Use a required 13-question, 1–5 scoring framework to classify and sequence Must-Haves and Nice-to-Haves.
3. **Stack/Deployment Baseline:** REST + PixiJS + Docker Compose; deployment path is Vercel + Railway/Render.
4. **Governance Path:** Simplified ADR-first governance now, with later SATOR-inspired refinement after incubation/maturation.

### Positive Consequences

- Strategic decisions become explicit and auditable across core planning documents
- Sprint planning can be tied directly to approved blockers and delivery outcomes
- Polyrepo-readiness can progress without forcing premature repository splits
- LIVEservice safety controls are front-loaded in planning

### Negative Consequences

- Additional documentation overhead for each strategic update
- Requires strict cross-doc upkeep to avoid future divergence

## Pros and Cons of the Options

### Informal interpretation only
- Good, because minimal immediate overhead
- Bad, because high drift risk and poor traceability

### Ad-hoc sprint notes only
- Good, because fast to draft
- Bad, because architecture/governance signals remain fragmented

### Unified ADR + alignment set
- Good, because creates a single decision spine across docs
- Good, because enables measurable governance and execution gates
- Bad, because needs disciplined maintenance

## Links

- [Master Plan](../master-plan/master-plan.md)
- [Roadmap](../roadmap/roadmap.md)
- [Repo Structure Decision](../architecture/REPO_STRUCTURE_DECISION.md)
- [NeXeZ Alignment Matrix](../architecture/NEXEZ_POLYREPO_ALIGNMENT_MATRIX.md)

## Notes

This ADR supplements (does not invalidate) existing ADR-001 through ADR-003.  
It standardizes continuation execution and governance interpretation for the approved strategic context.
