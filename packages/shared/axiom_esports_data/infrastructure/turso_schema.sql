-- Turso Edge Database Schema — Component C of TRINITY + OPERA Architecture
-- SQLite-compatible schema for Turso edge deployment
-- 
-- This schema creates:
--   - player_performance_edge: Optimized edge cache of player performance data
--   - sync_checkpoint: Tracks last successful sync for resume capability
--
-- Usage:
--   turso db create sator-edge
--   turso db shell sator-edge < turso_schema.sql

-- =====================================================
-- Player Performance Edge Table
-- Optimized subset of player_performance for edge caching
-- =====================================================

CREATE TABLE IF NOT EXISTS player_performance_edge (
    -- Primary key from PostgreSQL (for UPSERT conflict resolution)
    record_id           INTEGER PRIMARY KEY,
    
    -- Identity (5 fields) - Essential for filtering and display
    player_id           TEXT NOT NULL,
    name                TEXT NOT NULL,
    team                TEXT,
    region              TEXT,
    role                TEXT,  -- Entry, IGL, Controller, Initiator, Sentinel
    
    -- Performance metrics (5 fields) - Core stats
    kills               INTEGER,
    deaths              INTEGER,
    acs                 REAL,  -- NUMERIC in SQLite
    adr                 REAL,
    kast_pct            REAL,  -- 0.00 to 100.00
    
    -- RAR Metrics (2 fields) - Investment analytics
    rar_score           REAL,
    investment_grade    TEXT,  -- A+, A, B, C, D
    
    -- Extended performance (5 fields) - Detailed metrics
    headshot_pct        REAL,
    first_blood         INTEGER,
    clutch_wins         INTEGER,
    agent               TEXT,
    
    -- Match context (4 fields) - Query filters
    match_id            TEXT NOT NULL,
    map_name            TEXT,
    tournament          TEXT,
    realworld_time      TEXT NOT NULL,  -- ISO 8601 timestamp
    
    -- Analytics (1 field) - SimRating for quick access
    sim_rating          REAL,
    
    -- Data provenance (2 fields) - Source tracking
    data_source         TEXT,   -- vlr_gg, liquipedia, hltv, grid
    extraction_timestamp TEXT,
    
    -- Sync metadata (1 field) - When this record was synced
    synced_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- Indexes for Common Query Patterns
-- Optimized for edge query performance
-- =====================================================

-- Primary lookup: Player history by time
CREATE INDEX IF NOT EXISTS idx_edge_player_time
    ON player_performance_edge (player_id, realworld_time DESC);

-- Match lookups
CREATE INDEX IF NOT EXISTS idx_edge_match
    ON player_performance_edge (match_id);

-- Team and region filtering
CREATE INDEX IF NOT EXISTS idx_edge_team_region
    ON player_performance_edge (team, region, realworld_time DESC);

-- Role-based analytics
CREATE INDEX IF NOT EXISTS idx_edge_role
    ON player_performance_edge (role, realworld_time DESC);

-- Investment grade filtering
CREATE INDEX IF NOT EXISTS idx_edge_investment
    ON player_performance_edge (investment_grade, rar_score DESC);

-- Time-based queries (for cleanup and time-range filters)
CREATE INDEX IF NOT EXISTS idx_edge_time
    ON player_performance_edge (realworld_time);

-- Map-based analytics
CREATE INDEX IF NOT EXISTS idx_edge_map
    ON player_performance_edge (map_name, realworld_time DESC);

-- =====================================================
-- Sync Checkpoint Table
-- Tracks synchronization state for resume capability
-- =====================================================

CREATE TABLE IF NOT EXISTS sync_checkpoint (
    checkpoint_id       INTEGER PRIMARY KEY DEFAULT 1,
    last_sync_at        TEXT NOT NULL,      -- ISO 8601 timestamp
    last_record_id      INTEGER DEFAULT 0,  -- Last synced record_id
    records_synced      INTEGER DEFAULT 0,  -- Cumulative count
    sync_version        INTEGER DEFAULT 1,  -- Incremented on each update
    updated_at          TEXT NOT NULL       -- ISO 8601 timestamp
);

-- Ensure only one checkpoint row exists
CREATE TRIGGER IF NOT EXISTS enforce_single_checkpoint
    BEFORE INSERT ON sync_checkpoint
    WHEN (SELECT COUNT(*) FROM sync_checkpoint) >= 1
BEGIN
    SELECT RAISE(ABORT, 'Only one checkpoint row allowed');
END;

-- Initialize checkpoint if not exists
INSERT OR IGNORE INTO sync_checkpoint (
    checkpoint_id, last_sync_at, last_record_id, records_synced, updated_at
) VALUES (1, '1970-01-01T00:00:00Z', 0, 0, datetime('now'));

-- =====================================================
-- Views for Common Queries
-- Simplified access patterns for edge consumers
-- =====================================================

-- Latest player stats view (most recent record per player)
CREATE VIEW IF NOT EXISTS v_edge_player_latest AS
SELECT 
    p.*
FROM player_performance_edge p
INNER JOIN (
    SELECT player_id, MAX(realworld_time) as max_time
    FROM player_performance_edge
    GROUP BY player_id
) latest ON p.player_id = latest.player_id AND p.realworld_time = latest.max_time;

-- Player career summary (aggregated stats)
CREATE VIEW IF NOT EXISTS v_edge_player_summary AS
SELECT 
    player_id,
    name,
    team,
    region,
    role,
    COUNT(*) as matches_played,
    ROUND(AVG(kills), 2) as avg_kills,
    ROUND(AVG(deaths), 2) as avg_deaths,
    ROUND(AVG(acs), 2) as avg_acs,
    ROUND(AVG(adr), 2) as avg_adr,
    ROUND(AVG(kast_pct), 2) as avg_kast_pct,
    ROUND(AVG(rar_score), 4) as avg_rar_score,
    MAX(investment_grade) as best_grade,  -- A+ > A > B > C > D
    ROUND(AVG(sim_rating), 4) as avg_sim_rating,
    MAX(realworld_time) as last_match_at
FROM player_performance_edge
GROUP BY player_id, name, team, region, role;

-- Map performance view
CREATE VIEW IF NOT EXISTS v_edge_map_performance AS
SELECT 
    map_name,
    COUNT(*) as matches_played,
    COUNT(DISTINCT player_id) as unique_players,
    ROUND(AVG(acs), 2) as avg_acs,
    ROUND(AVG(adr), 2) as avg_adr,
    MAX(realworld_time) as last_played_at
FROM player_performance_edge
WHERE map_name IS NOT NULL
GROUP BY map_name;

-- Recent high performers (last 30 days)
CREATE VIEW IF NOT EXISTS v_edge_recent_performers AS
SELECT 
    player_id,
    name,
    team,
    role,
    COUNT(*) as recent_matches,
    ROUND(AVG(acs), 2) as recent_avg_acs,
    ROUND(AVG(rar_score), 4) as recent_avg_rar,
    MAX(investment_grade) as recent_best_grade
FROM player_performance_edge
WHERE realworld_time >= datetime('now', '-30 days')
GROUP BY player_id, name, team, role
HAVING COUNT(*) >= 3  -- At least 3 matches
ORDER BY recent_avg_rar DESC;

-- =====================================================
-- Comments (as SQLite notes in comments)
-- =====================================================

-- Table: player_performance_edge
-- Purpose: Edge cache of player performance metrics from PostgreSQL
-- Sync Direction: PostgreSQL → Turso (one-way)
-- Retention: 18 months (enforced by application cleanup)
-- Primary Key: record_id (matches PostgreSQL bigserial)
-- Sync Strategy: UPSERT on conflict

-- Table: sync_checkpoint
-- Purpose: Tracks last successful sync for resume capability
-- Rows: Exactly 1 (enforced by trigger)
-- Updated: After each successful sync batch

-- =====================================================
-- Cleanup Helper (manual execution)
-- Delete records older than 18 months
-- =====================================================

-- DELETE FROM player_performance_edge 
-- WHERE realworld_time < datetime('now', '-18 months');

-- VACUUM;  -- Reclaim space after large deletions
