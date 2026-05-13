# ADR-004: NeXeZ Continuation and Polyrepo Alignment

**Status:** Accepted  
**Date:** 2026-05-13  
**Deciders:** Elijah Bleaux, Platform Team  
**Technical Story:** Post-approval continuation plan for NeXeZ webapp/website alignment

---

## Context and Problem Statement

The platform requires a continuation strategy that keeps current delivery stable while aligning toward the NeXeZ command-center model and long-term polyrepo integration readiness. Existing planning artifacts needed an explicit decision record for sprint sequencing, prioritization, deployment posture, and governance.

## Decision Drivers

- Preserve production continuity while scaling architecture
- Keep repositories integration-ready for future versioning paths
- Prioritize must-have outcomes before optional expansion
- Standardize deployment and runtime topology
- Reduce decision overhead with lightweight governance

## Considered Options

### Option 1: Continue Existing Phase Plan Without Strategic Overlay
Keep current roadmap unchanged and rely on ad hoc interpretation.

### Option 2: Full Immediate Re-architecture
Pause feature flow and redesign all layers at once.

### Option 3: Structured Continuation Overlay (Chosen)
Apply a sprint-based continuation track with explicit decisions and governance checks.

## Decision Outcome

Chosen option: **Structured Continuation Overlay**

The following four blocking decisions are accepted:

1. **Unified Platform Direction**  
   Build toward a hybridized NeXeZ operations system and services command center with sequential staged execution.

2. **Prioritization Model**  
   Use a 13-question, 1–5 scoring rubric to classify Must Haves vs Nice to Haves.  
   Must Haves are completed in the first portfolio wave before mini turbo-repo expansion.

3. **Technical/Deployment Posture**  
   Standardize on REST, PixiJS, Docker Compose, and deployment target strategy Vercel + Railway/Render.

4. **Governance Model**  
   Use a simplified ADR process now, with later SATOR-inspired refinement in an incubation track.

### Positive Consequences

- Clear early sprint delivery targets and measurable outcomes
- Better cross-repository contract and deployment consistency
- Lower coordination risk across webapp, website, and services
- Faster decisions through lightweight ADR process

### Negative Consequences

- Additional governance overhead in early sprints
- Requires disciplined artifact updates to avoid drift
- Nice-to-have items may be delayed by first-wave must-have gating

## Pros and Cons of the Options

### Continue Without Overlay
- Good: No process changes
- Bad: High ambiguity and drift risk
- Bad: Weak integration-readiness guarantees

### Full Immediate Re-architecture
- Good: Potentially cleaner long-term architecture
- Bad: High short-term delivery disruption
- Bad: Elevated production risk

### Structured Continuation Overlay
- Good: Preserves delivery continuity while improving alignment
- Good: Enables phased integration with explicit checkpoints
- Good: Compatible with existing roadmap and ADR practices
- Bad: Requires strict sprint discipline

## Links

- [Master Plan](../master-plan/master-plan.md)
- [Roadmap](../roadmap/roadmap.md)
- [ADR-002: React + FastAPI Tech Stack](./adr-002-tech-stack.md)

## Notes

This ADR records strategic direction and sequencing. Implementation details continue through sprint plans, repository checklists, and standard pull request review gates.
