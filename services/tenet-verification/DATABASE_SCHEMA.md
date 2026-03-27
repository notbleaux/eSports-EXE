# TeneT Verification Service — Database Schema

## Overview

Three SQLAlchemy ORM models with automatic table creation on startup. Database connection uses asyncpg (async PostgreSQL driver).

## Tables

### 1. verification_records

Master table for all verification results.

```sql
CREATE TABLE verification_records (
  id VARCHAR(255) PRIMARY KEY,
  entity_id VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  game VARCHAR(50) NOT NULL,
  status ENUM('ACCEPTED', 'FLAGGED', 'REJECTED', 'PENDING', 'MANUAL_OVERRIDE') NOT NULL,
  confidence_value FLOAT NOT NULL,
  confidence_breakdown JSONB NOT NULL,
  conflict_fields JSONB,
  has_conflicts BOOLEAN DEFAULT FALSE,
  rejection_reasons JSONB,
  distribution_path VARCHAR(50) NOT NULL,
  verified_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indices
  INDEX idx_entity_id (entity_id),
  INDEX idx_game (game),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
);
```

**Usage:** Store all verification attempts with full confidence breakdown and routing decisions.

**Retention:** Keep all records (for audit trail and historical analysis).

### 2. data_source_contributions

Tracks which sources contributed to each verification.

```sql
CREATE TABLE data_source_contributions (
  id VARCHAR(255) PRIMARY KEY,
  verification_id VARCHAR(255) NOT NULL REFERENCES verification_records(id),
  source_type VARCHAR(100) NOT NULL,
  trust_level VARCHAR(50) NOT NULL,
  weight FLOAT NOT NULL,
  source_confidence FLOAT NOT NULL,
  ingested_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indices
  INDEX idx_verification_id (verification_id),
  INDEX idx_created_at (created_at)
);
```

**Usage:** Audit trail showing which sources contributed to a verification decision.

**Retention:** Keep alongside `verification_records` (foregin key relationship).

### 3. review_queue

Flagged entities awaiting manual review.

```sql
CREATE TABLE review_queue (
  id VARCHAR(255) PRIMARY KEY,
  verification_id VARCHAR(255) NOT NULL UNIQUE REFERENCES verification_records(id),
  entity_id VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  game VARCHAR(50) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  confidence_value FLOAT NOT NULL,
  reviewer_id VARCHAR(255),
  review_decision VARCHAR(50),  -- ACCEPT, REJECT, NEEDS_MORE_DATA
  review_notes VARCHAR(2000),
  flagged_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,

  -- Indices
  INDEX idx_entity_id (entity_id),
  INDEX idx_game (game),
  INDEX idx_flagged_at (flagged_at),
  INDEX idx_review_decision (review_decision)
);
```

**Usage:** Queue for manual review of medium-confidence (0.70–0.89) verifications.

**Retention:** Configurable via `REVIEW_QUEUE_RETENTION_DAYS` (default: 30 days).

**Auto-cleanup Job (Phase 2):**
```sql
DELETE FROM review_queue
WHERE reviewed_at IS NOT NULL
  AND reviewed_at < NOW() - INTERVAL '30 days';
```

## Migration Plan (Alembic — Phase 2)

1. **Initial Migration:** Create all three tables
2. **Add Indices:** Performance optimization for common queries
3. **Foreign Key Constraints:** Cascade deletes on verification_records
4. **Enum Types:** PostgreSQL native ENUM for status

## Connection Configuration

```python
# From main.py startup
DATABASE_URL = "postgresql+asyncpg://user:pass@host:5432/njz_esports"

# Pool settings (free tier defaults)
- min_size: 2
- max_size: 10
- command_timeout: 60s
```

## Data Types

| Column | Type | Notes |
|--------|------|-------|
| ENUM fields | `VARCHAR(50)` | SQLAlchemy auto-converts from Python Enum |
| JSONB fields | `JSONB` | PostgreSQL JSON with indexing support |
| Timestamps | `TIMESTAMP` | UTC, no timezone info (stored as UTC) |
| Float scores | `FLOAT` (0.0–1.0) | Double precision for confidence values |

## Queries Performed

**Insert Verification:**
```python
INSERT INTO verification_records
(id, entity_id, entity_type, game, status, confidence_value, ...)
VALUES (...)
```

**Get Review Queue:**
```python
SELECT * FROM review_queue
WHERE review_decision IS NULL
ORDER BY flagged_at DESC
LIMIT 50 OFFSET 0
```

**Get Verification Status:**
```python
SELECT * FROM verification_records
WHERE entity_id = ?
ORDER BY created_at DESC LIMIT 1
```

**Submit Manual Review:**
```python
UPDATE verification_records SET status = ?, distribution_path = ? WHERE id = ?
UPDATE review_queue SET review_decision = ?, reviewer_id = ?, reviewed_at = NOW() WHERE verification_id = ?
```

## Performance Considerations

1. **Index Strategy:**
   - `entity_id`: Fast lookup of entity's verification history
   - `game`: Filtering by game
   - `created_at`: Time-series queries and retention cleanup
   - `flagged_at`: Review queue sorting

2. **Partition Strategy (Future):**
   - Partition `verification_records` by game + time for very large datasets
   - Partition `review_queue` by flagged_at for time-based cleanup

3. **Archive Strategy (Phase 3):**
   - Move reviewed items from `review_queue` to `review_archive` after 30 days
   - Keep `verification_records` indefinitely (audit trail)

## Testing

Unit tests in `tests/test_verification.py` include:
- Database connection checks
- CRUD operations for all three tables
- Foreign key constraint validation
- Index coverage verification
