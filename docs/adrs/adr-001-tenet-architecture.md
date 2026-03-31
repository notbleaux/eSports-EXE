# ADR-001: TENET Four-HUB Architecture

**Status:** Accepted  
**Date:** 2026-03-31  
**Deciders:** Elijah Bleaux, Kimi  
**Technical Story:** Project foundation architecture

---

## Context and Problem Statement

eSports-EXE aims to be a comprehensive esports analytics platform covering multiple games (starting with Valorant and CS2). The challenge is organizing features in a way that:
1. Scales across different games
2. Serves different user types (casual fans, analysts, professionals)
3. Prevents feature bloat and UI clutter
4. Maintains clear separation of concerns

## Decision Drivers

- Need for cross-game unification
- Different user expertise levels require different interfaces
- Community features must be separate from data features
- Analytics must build upon raw stats, not duplicate them

## Considered Options

### Option 1: Monolithic Dashboard
Single page with all features, filterable by game.

### Option 2: Game-Specific Silos
Separate applications for each game.

### Option 3: TENET Four-HUB Architecture
Meta-layer with four specialized HUBs serving different purposes.

## Decision Outcome

Chosen option: **TENET Four-HUB Architecture**

The architecture consists of:
- **TENET** (Meta-layer): WorldHUBs database connecting everything
- **tenet** (Game layer): Game-specific instances
- **tezet** (HUB layer): Four specialized HUBs within each game
  - **ROTAS**: Stats Reference (raw data)
  - **SATOR**: Advanced Analytics (insights, predictions)
  - **OPERA**: Pro Scene Information (tournaments, matches)
  - **AREPO**: Community (forums, engagement)

### Positive Consequences

- Clear separation of concerns
- Each HUB can evolve independently
- Users navigate by intent, not game
- Natural progressive disclosure (casual → expert)
- Cross-game analytics become possible

### Negative Consequences

- More complex initial setup
- Need for clear boundaries to prevent coupling
- Requires discipline to maintain separation

## Pros and Cons of the Options

### Monolithic Dashboard
- Good: Simple to implement initially
- Bad: Becomes cluttered as features grow
- Bad: Hard to serve different user types
- Bad: No clear organization principle

### Game-Specific Silos
- Good: Clear per-game organization
- Bad: Duplicates infrastructure
- Bad: Prevents cross-game analytics
- Bad: Users must switch contexts

### TENET Architecture
- Good: Scales across games
- Good: Serves different user types
- Good: Clear feature organization
- Good: Enables unique cross-game features
- Bad: Requires more upfront design

## Links

- [Master Plan](../master-plan/master-plan.md)
- [Repository Audit](../../memory/REPOSITORY_AUDIT_2026-03-30.md)

## Notes

The name "TENET" references the Sator Square, a palindrome with historical significance. The HUB names (ROTAS, SATOR, OPERA, AREPO) are the other words in the square, creating a cohesive naming system.
