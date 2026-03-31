# eSports-EXE Documentation

## Welcome to the Knowledge Base

This directory contains all project documentation, organized to prevent Design Drift and Architecture Drift.

## Quick Navigation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [Master Plan](./master-plan/master-plan.md) | Single source of truth | Before making any architectural decision |
| [ADRs](./adrs/) | Architecture decision history | When considering changes to existing systems |
| [Design System](./design-system/) | UI/UX guidelines | When building or modifying UI components |
| [API Contracts](./api-contracts/) | Backend API specifications | When integrating frontend and backend |
| [Roadmap](./roadmap/) | Development timeline | When planning sprints or milestones |

## Documentation Philosophy

### Write It Down
If it's not documented, it doesn't exist. Decisions made in chat or meetings must be captured in ADRs.

### Living Documents
Documentation evolves with the code. Every PR that changes architecture must update relevant docs.

### Single Source of Truth
The Master Plan is the ultimate authority. When conflicts arise, the Master Plan resolves them.

## For New Team Members

Start here:
1. Read the [Master Plan](./master-plan/master-plan.md)
2. Review [ADR-001: TENET Architecture](./adrs/adr-001-tenet-architecture.md)
3. Explore the [Design System](./design-system/)
4. Check the current [Roadmap](./roadmap/roadmap.md)

## For Decision Makers

Before proposing changes:
1. Check if an ADR already exists on this topic
2. Review the [Governance Model](./master-plan/master-plan.md#7-governance-model)
3. Create a new ADR using the [template](./adrs/adr-template.md)
4. Submit for appropriate tier review

## Maintenance

**Last Updated:** 2026-03-31  
**Maintainer:** Project Architecture Team  
**Review Cycle:** Monthly

---

*When in doubt, consult the [Master Plan](./master-plan/master-plan.md).*
