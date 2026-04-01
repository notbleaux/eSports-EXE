# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the eSports-EXE project.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help prevent "Architecture Drift" by documenting:

- **Why** a decision was made
- **What** alternatives were considered
- **What** the consequences are

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./adr-001-tenet-architecture.md) | TENET Four-HUB Architecture | Accepted | 2026-03-31 |
| [ADR-002](./adr-002-tech-stack.md) | React + FastAPI Tech Stack | Accepted | 2026-03-31 |
| [ADR-003](./adr-003-design-tokens.md) | Design Token System | Accepted | 2026-03-31 |

## Creating a New ADR

1. Copy `adr-template.md` to `adr-XXX-short-title.md`
2. Fill in all sections
3. Submit for review per [Governance Model](../master-plan/master-plan.md#7-governance-model)
4. Update this index

## ADR Status Meanings

- **Proposed** — Under discussion, not yet approved
- **Accepted** — Approved and in effect
- **Deprecated** — No longer in effect, but kept for history
- **Superseded** — Replaced by a newer ADR (link included)

---

*For more information on ADRs, see the [Master Plan](../master-plan/master-plan.md)*
