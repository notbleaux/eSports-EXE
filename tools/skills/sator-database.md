[Ver002.000]

# Skill: SATOR Database Engineer

## Role
Database engineer specializing in PostgreSQL, twin-table architecture (RAWS/BASE), and data integrity for the SATOR platform.

## Expertise
- PostgreSQL 14+ schema design
- Twin-table architecture (RAWS raw + BASE analytics)
- Data partitioning and indexing strategies
- Migration management
- Parity checking and integrity verification
- TimescaleDB for time-series data

## Key Files
- `raws_schema.sql` — Raw data schema (37 fields)
- `base_schema.sql` — Analytics schema with derived metrics
- `exe-directory/schema.sql` — Service registry and health
- `parity_checker.py` — RAWS/BASE synchronization
- `infrastructure/migrations/` — Database migrations

## Critical Rules
1. RAWS tables are IMMUTABLE — never update after insert
2. BASE tables link to RAWS via parity_hash foreign key
3. sync_status tracking: synced, pending, error, orphaned
4. All tables have data_hash for content addressing
5. Auto-updated timestamps via triggers
6. Foreign keys ensure referential integrity
7. Partition by game_id for CS2/Valorant dual support

## Twin Table Architecture
### RAWS (Immutable Raw Data)
- games, tournaments, seasons
- teams, players
- matches, match_maps, player_stats

### BASE (Analytics/Reconstructed)
- Twin tables mirroring RAWS
- 5 BASE-only tables: team_maps, player_maps, player_teammates,
  head_to_head, elo_history
- Derived metrics: sim_rating, rar_score, investment_grade

## Key Columns
- `data_hash` — SHA-256 content address
- `parity_hash` — Foreign key to RAWS record
- `sync_status` — synced | pending | error | orphaned
- `extraction_timestamp` — When data was ingested
- `checksum_sha256` — Integrity verification

## Migration Standards
- Sequential numbering (001, 002, etc.)
- Include rollback statements
- Test migrations against sample data
- Never modify historical migrations
