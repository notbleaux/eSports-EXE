# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant architectural decisions made in the NJZiteGeisTe Platform.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help teams:
- Understand why decisions were made
- Onboard new team members faster
- Avoid revisiting decisions without context
- Document technical debt and trade-offs

## ADR Index

| # | Title | Status | Date |
|---|-------|--------|------|
| [001](001-godot-vs-web-simulation.md) | Godot vs Web-Based Simulation | ✅ Accepted | 2024-01-15 |
| [002](002-postgresql-vs-timescaledb.md) | PostgreSQL vs TimescaleDB | ✅ Accepted | 2024-02-01 |
| [003](003-monorepo-vs-multirepo.md) | Monorepo vs Multi-Repository | ✅ Accepted | 2024-01-20 |
| [004](004-react-vue-frontend.md) | React vs Vue Frontend Framework | ✅ Accepted | 2024-01-10 |
| [005](005-fastapi-vs-flask-django.md) | FastAPI vs Flask vs Django | ✅ Accepted | 2024-01-05 |

## ADR Template

When creating a new ADR, use this format:

```markdown
# ADR XXX: Title

## Status
- Proposed
- Accepted
- Deprecated
- Superseded by [ADR YYY](yyy-new-decision.md)

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing or have agreed to implement?

## Consequences
What becomes easier or more difficult to do because of this change?

### Positive
- Benefit 1
- Benefit 2

### Negative
- Trade-off 1
- Trade-off 2

## Alternatives Considered

### Option A: Description
Why it was rejected.

### Option B: Description
Why it was rejected.

## References
- Links to related documents
- External resources

---

*Decision Date: YYYY-MM-DD*
*Decision Maker: Team/Person*
*Last Reviewed: YYYY-MM-DD*
```

## Review Schedule

ADRs are reviewed:
- **Quarterly** for active decisions
- **Immediately** when related technology changes
- **Annually** for all decisions (archival of deprecated)

---

*ADR Index Version: 001.000*  
*Last Updated: 2026-03-30*
