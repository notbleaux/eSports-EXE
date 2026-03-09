[Ver002.000]

# RAWS-BASE Twin-Table Architecture
## SATOR-eXe-ROTAS Documentation

### Overview

RAWS (Reference Analytics Web Stats) and BASE (Basic Analytics Stats Engine) implement a **twin-table architecture** designed for esports analytics at scale. This design separates immutable reference data from derived analytics while maintaining strict data integrity.

---

## Core Philosophy

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   External Sources          RAWS Layer         BASE Layer   │
│   (HLTV, VLR, etc.)      (Reference Data)   (Analytics)    │
│         │                       │                 │         │
│         │  scrape/ingest        │                 │         │
│         └──────────────────────►│                 │         │
│                                 │  trigger        │         │
│                                 ├────────────────►│         │
│                                 │  compute        │         │
│                                 │                 │         │
│         ◄───────────────────────┴─────────────────┘         │
│              API / Query Layer                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The RAWS Layer (Immutable Reference)

**Purpose**: Store raw, immutable data from external sources

**Characteristics**:
- Data is append-only (historical records never change)
- Records represent ground truth from authoritative sources
- Contains factual, observed data only
- Minimal computation; data as-ingested
- `data_hash` field for integrity verification

**Example Data**:
- Match scores as reported by HLTV
- Player kill/death counts from demos
- Tournament dates and prize pools
- Team roster assignments with dates

### The BASE Layer (Derived Analytics)

**Purpose**: Store computed, derived metrics and aggregations

**Characteristics**:
- Data is computed from RAWS records
- Can be regenerated (derived, not source)
- Contains ratings, trends, predictions, aggregates
- Complex calculations: Elo ratings, form metrics, head-to-head
- `parity_hash` links to parent RAWS record

**Example Data**:
- Player career KDR, ADR, HLTV ratings
- Team Elo ratings and rank history
- Head-to-head win rates
- Form trends and performance vs expectation

---

## Why Twin Tables?

### 1. Data Integrity

```sql
-- Foreign key ensures BASE cannot exist without RAWS
CREATE TABLE base_players (
    player_id TEXT PRIMARY KEY REFERENCES raws_players(player_id),
    ...
);
```

Every BASE record **must** have a corresponding RAWS record. This prevents:
- Phantom analytics on non-existent players
- Orphaned statistics after data deletion
- Inconsistent state between raw and derived data

### 2. Independent Scaling

| Aspect | RAWS | BASE |
|--------|------|------|
| Write Frequency | Low (match end) | High (continuous updates) |
| Query Pattern | Point lookups | Aggregations, analytics |
| Cache Strategy | Long-term | Rebuild on demand |
| Backup Priority | Critical (source) | Regenerable |

### 3. Audit Trail

Because RAWS is immutable:
- Disputed results can be verified against original source
- Analytics bugs can be fixed by recomputing BASE
- Data lineage is preserved

### 4. Multi-Game Extensibility

Both layers designed with `game_id` column:
- CS2 and Valorant share same schema
- Game-specific fields are nullable
- Analytics engines can be game-specific

---

## Parity Checking

### The Parity Hash

Each record has a content hash for integrity:

```python
# RAWS table stores data_hash
raws_data = {
    'player_id': 's1mple',
    'player_name': 's1mple',
    'kills': 23,
    'deaths': 12
}
raws_hash = sha256(sorted_json(raws_data))

# BASE table stores parity_hash (must match)
base_record.parity_hash = raws_hash
```

### Sync Status Tracking

BASE tables track synchronization state:

| Status | Meaning | Action |
|--------|---------|--------|
| `synced` | HASH matches, all good | None |
| `pending` | Waiting for computation | Process |
| `error` | Computation failed | Investigate |
| `orphaned` | RAWS record deleted | Cleanup |

---

## Table Reference

### Core Twin Pairs

| RAWS Table | BASE Table | Primary Key | Description |
|------------|------------|-------------|-------------|
| `raws_tournaments` | `base_tournaments` | `tournament_id` | Tournament metadata |
| `raws_seasons` | `base_seasons` | `season_id` | Tournament phases |
| `raws_teams` | `base_teams` | `team_id` | Team information |
| `raws_players` | `base_players` | `player_id` | Player profiles |
| `raws_matches` | `base_matches` | `match_id` | Match results |
| `raws_match_maps` | `base_match_maps` | `map_id` | Individual map results |
| `raws_player_stats` | `base_player_stats` | `stat_id` | Per-match player stats |
| `raws_team_stats` | `base_team_stats` | `stat_id` | Per-match team stats |

### BASE-Only Tables

These have no RAWS twin (pure analytics):

| Table | Purpose |
|-------|---------|
| `base_team_maps` | Team performance by map |
| `base_player_maps` | Player performance by map |
| `base_player_teammates` | Player synergy metrics |
| `base_head_to_head` | Cross-entity H2H records |
| `base_elo_history` | Elo rating time-series |

---

## Usage Patterns

### Querying Raw Data

```sql
-- Get match results (from RAWS)
SELECT 
    m.match_id,
    t1.team_name as team_a,
    t2.team_name as team_b,
    m.team_a_score,
    m.team_b_score
FROM raws_matches m
JOIN raws_teams t1 ON m.team_a_id = t1.team_id
JOIN raws_teams t2 ON m.team_b_id = t2.team_id
WHERE m.match_date > date('now', '-7 days');
```

### Querying Analytics

```sql
-- Get player ratings (from BASE)
SELECT 
    p.player_name,
    bp.rating_avg,
    bp.kdr,
    bp.form_last_10_rating
FROM base_players bp
JOIN raws_players p ON bp.player_id = p.player_id
WHERE bp.matches_played > 20
ORDER BY bp.rating_avg DESC
LIMIT 10;
```

### Checking Sync Status

```sql
-- Overview of sync health
SELECT * FROM v_sync_status;

-- Specific orphaned records
SELECT b.* 
FROM base_players b
LEFT JOIN raws_players r ON b.player_id = r.player_id
WHERE r.player_id IS NULL;
```

---

## Operational Procedures

### Adding New Data

1. **Insert into RAWS** first
2. Compute `data_hash` for RAWS record
3. **Insert into BASE** with matching `parity_hash`
4. Run parity check to verify

```python
# Pseudocode
with transaction():
    insert_raws('raws_players', player_data)
    hash = compute_hash(player_data)
    update_raws_hash('raws_players', player_id, hash)
    
    analytics = compute_player_analytics(player_id)
    insert_base('base_players', {
        'player_id': player_id,
        'parity_hash': hash,
        **analytics
    })
```

### Updating Analytics

BASE records can be recomputed at any time:

```python
# Regenerate player analytics
def refresh_player_analytics(player_id):
    raws = get_raws('raws_players', player_id)
    stats = aggregate_player_stats(player_id)
    
    update_base('base_players', player_id, {
        'parity_hash': raws.data_hash,
        'last_synced': now(),
        **compute_analytics(stats)
    })
```

### Handling Data Corrections

If source data was wrong:

1. Update RAWS record (with audit log)
2. Recompute `data_hash`
3. Cascade update to all dependent BASE records
4. Recompute analytics

---

## Migration Path

### SQLite → PostgreSQL

The schema is designed for easy migration:

1. **Data Types**: SQLite `TEXT` → PostgreSQL `TEXT`/`VARCHAR`
2. **JSON Fields**: SQLite `TEXT` → PostgreSQL `JSONB`
3. **Foreign Keys**: Add `ON DELETE CASCADE` in PG
4. **Indexes**: Recreate for query patterns
5. **Views**: Compatible syntax

### Scaling Considerations

| Scale | RAWS Strategy | BASE Strategy |
|-------|--------------|---------------|
| < 1M matches | Single SQLite | Same DB |
| < 10M matches | PostgreSQL | Same DB |
| < 100M matches | PostgreSQL | Read replicas |
| > 100M matches | Sharded by game | Dedicated analytics DB |

---

## Implementation Notes

### Counter-Strike Specifics

- Maps: `de_dust2`, `de_mirage`, `de_inferno`, etc.
- Sides: `ct` (Counter-Terrorist), `t` (Terrorist)
- Roles: `awp`, `rifler`, `igl`, `support`, `entry`
- Stats: ADR, KAST, HLTV Rating 2.0

### Valorant Extensibility

- Maps: `Haven`, `Bind`, `Split`, `Ascent`, etc.
- Sides: `defense`, `attack`
- Roles: `duelist`, `controller`, `sentinel`, `initiator`
- Stats: ACS (Average Combat Score), KDA

Common fields support both; game-specific fields are nullable.

---

## Summary

The twin-table architecture provides:

1. **Integrity**: Foreign keys + parity hashes prevent data drift
2. **Clarity**: Separation between fact (RAWS) and analysis (BASE)
3. **Flexibility**: BASE can be regenerated, RAWS is preserved
4. **Scalability**: Independent optimization paths
5. **Extensibility**: Game-agnostic core with game-specific extensions

Run `python parity_checker.py --check` regularly to ensure data health.
