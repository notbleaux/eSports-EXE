[Ver002.000]

# ADR-001: Adoption of Twin-Table Architecture (RAWS/BASE)

## Status
- **Accepted** (2024-01-15)

## Context
The SATOR platform needs to maintain raw extraction data integrity while enabling flexible analytics processing. We need an architecture that:
1. Preserves immutable raw data for auditability
2. Allows iterative analytics improvements without re-extraction
3. Provides clear lineage between raw and processed data
4. Supports dual-game ecosystem (Valorant + CS2)

## Decision
We will implement a twin-table architecture with:
- **RAWS tables**: Immutable raw extraction data
- **BASE tables**: Analytics-processed data with foreign keys to RAWS
- **Parity hash**: Content-addressed linkage between twins
- **Sync status tracking**: synced, pending, error, orphaned

## Consequences

### Positive
- Clear data lineage and audit trail
- Analytics can be reprocessed without re-extraction
- Parallel support for multiple games
- Content addressing enables deduplication

### Negative
- Increased storage requirements (~2x)
- More complex queries requiring joins
- Need for parity checking infrastructure

## Alternatives Considered

### Single Table with Versions
- Rejected: Would complicate queries and lose clear separation of concerns

### Data Lake Approach
- Rejected: Overkill for current scale; relational model fits access patterns better

## References
- `raws_schema.sql` — Raw schema definition
- `base_schema.sql` — BASE schema definition
- `parity_checker.py` — Sync verification implementation

---
*Created: 2024-01-15*
*Author: Data Architecture Team*
