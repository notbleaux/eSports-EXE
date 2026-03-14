-- ============================================================================
-- OPERA Schema: Tournament Metadata Satellite
-- TiDB MySQL-Compatible Database Schema
-- TRINITY + OPERA Architecture — Component D
-- ============================================================================
-- Purpose:
--   Tournament metadata management for esports analytics platform.
--   Stores tournament definitions, schedules, patches, teams, and circuits
--   with cross-reference support for SATOR analytics linkage.
--
-- Target Database: TiDB (MySQL-compatible distributed database)
-- Character Set: utf8mb4
-- Engine: InnoDB (TiDB uses TiKV, but accepts InnoDB syntax)
-- ============================================================================

-- Set default character set
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- TABLE 1: opera_tournaments
-- Purpose: Tournament definitions and lifecycle management
-- ============================================================================
CREATE TABLE IF NOT EXISTS opera_tournaments (
    tournament_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
                        COMMENT 'Unique tournament identifier',
    
    name                VARCHAR(200) NOT NULL
                        COMMENT 'Tournament display name (e.g., "VCT 2026 Masters Tokyo")',
    
    tier                ENUM('Champions', 'Masters', 'Lock In', 'Challenger', 'Premier', 'Qualifier', 'Showmatch')
                        DEFAULT 'Premier'
                        COMMENT 'Tournament tier classification',
    
    game                VARCHAR(50) DEFAULT 'Valorant'
                        COMMENT 'Game name: Valorant, CS2, etc.',
    
    region              VARCHAR(50)
                        COMMENT 'Region code: NA, EMEA, APAC, BR, LATAM, KR, CN, International',
    
    organizer           VARCHAR(100)
                        COMMENT 'Tournament organizer (e.g., Riot Games, ESL, BLAST)',
    
    prize_pool_usd      BIGINT UNSIGNED
                        COMMENT 'Total prize pool in USD',
    
    start_date          DATE
                        COMMENT 'Tournament start date',
    
    end_date            DATE
                        COMMENT 'Tournament end date',
    
    status              ENUM('upcoming', 'ongoing', 'completed', 'cancelled', 'postponed')
                        DEFAULT 'upcoming'
                        COMMENT 'Tournament lifecycle status',
    
    sator_cross_ref     VARCHAR(100)
                        COMMENT 'Cross-reference to SATOR analytics tournament ID',
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        COMMENT 'Record creation timestamp',
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        COMMENT 'Last modification timestamp',
    
    -- Constraints
    CONSTRAINT chk_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    
    -- Indexes
    INDEX idx_tournament_status (status),
    INDEX idx_tournament_tier (tier),
    INDEX idx_tournament_game (game),
    INDEX idx_tournament_region (region),
    INDEX idx_tournament_dates (start_date, end_date),
    INDEX idx_tournament_sator (sator_cross_ref),
    INDEX idx_tournament_created (created_at DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tournament definitions and metadata for OPERA satellite';

-- ============================================================================
-- TABLE 2: opera_schedules
-- Purpose: Match scheduling and status tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS opera_schedules (
    schedule_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
                        COMMENT 'Unique schedule entry identifier',
    
    tournament_id       BIGINT UNSIGNED NOT NULL
                        COMMENT 'Parent tournament reference',
    
    match_id            VARCHAR(50) NOT NULL
                        COMMENT 'Unique match identifier (external)',
    
    round_name          VARCHAR(100)
                        COMMENT 'Round/group name (e.g., "Quarterfinals", "Group A")',
    
    team_a_id           BIGINT UNSIGNED
                        COMMENT 'Team A reference (foreign key to opera_teams)',
    
    team_b_id           BIGINT UNSIGNED
                        COMMENT 'Team B reference (foreign key to opera_teams)',
    
    team_a_score        SMALLINT UNSIGNED DEFAULT 0
                        COMMENT 'Team A score (updated post-match)',
    
    team_b_score        SMALLINT UNSIGNED DEFAULT 0
                        COMMENT 'Team B score (updated post-match)',
    
    winner_team_id      BIGINT UNSIGNED
                        COMMENT 'Winner team reference (foreign key to opera_teams)',
    
    scheduled_at        TIMESTAMP NULL
                        COMMENT 'Scheduled match start time (UTC)',
    
    duration_minutes    SMALLINT UNSIGNED
                        COMMENT 'Match duration in minutes (post-match)',
    
    stream_url          VARCHAR(500)
                        COMMENT 'Primary stream URL',
    
    status              ENUM('scheduled', 'live', 'completed', 'postponed', 'cancelled', 'forfeited')
                        DEFAULT 'scheduled'
                        COMMENT 'Match status',
    
    sator_match_ref     VARCHAR(100)
                        COMMENT 'Cross-reference to SATOR analytics match ID',
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        COMMENT 'Record creation timestamp',
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        COMMENT 'Last modification timestamp',
    
    -- Foreign Keys
    CONSTRAINT fk_schedule_tournament 
        FOREIGN KEY (tournament_id) REFERENCES opera_tournaments(tournament_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_schedule_team_a 
        FOREIGN KEY (team_a_id) REFERENCES opera_teams(team_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    CONSTRAINT fk_schedule_team_b 
        FOREIGN KEY (team_b_id) REFERENCES opera_teams(team_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    CONSTRAINT fk_schedule_winner 
        FOREIGN KEY (winner_team_id) REFERENCES opera_teams(team_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT uq_match_id UNIQUE (match_id),
    
    -- Indexes
    INDEX idx_schedule_tournament (tournament_id),
    INDEX idx_schedule_status (status),
    INDEX idx_schedule_time (scheduled_at),
    INDEX idx_schedule_teams (team_a_id, team_b_id),
    INDEX idx_schedule_sator (sator_match_ref),
    INDEX idx_schedule_updated (updated_at DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Match schedules and results for tournaments';

-- ============================================================================
-- TABLE 3: opera_patches
-- Purpose: Game patch version tracking for meta analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS opera_patches (
    patch_id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
                        COMMENT 'Unique patch identifier',
    
    version             VARCHAR(20) NOT NULL
                        COMMENT 'Patch version (e.g., "8.11", "8.11.1")',
    
    game                VARCHAR(50) DEFAULT 'Valorant'
                        COMMENT 'Game name',
    
    patch_type          ENUM('major', 'minor', 'hotfix', 'beta')
                        DEFAULT 'minor'
                        COMMENT 'Type of patch release',
    
    release_date        DATE
                        COMMENT 'Official release date',
    
    notes_url           VARCHAR(500)
                        COMMENT 'URL to official patch notes',
    
    summary             TEXT
                        COMMENT 'Brief summary of key changes',
    
    is_active_competitive BOOLEAN DEFAULT FALSE
                        COMMENT 'Whether patch is active in competitive play',
    
    sator_meta_ref      VARCHAR(100)
                        COMMENT 'Cross-reference to SATOR meta analysis',
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        COMMENT 'Record creation timestamp',
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        COMMENT 'Last modification timestamp',
    
    -- Constraints
    CONSTRAINT uq_patch_version_game UNIQUE (version, game),
    
    -- Indexes
    INDEX idx_patch_game (game),
    INDEX idx_patch_type (patch_type),
    INDEX idx_patch_release (release_date DESC),
    INDEX idx_patch_active (is_active_competitive),
    INDEX idx_patch_sator (sator_meta_ref),
    INDEX idx_patch_updated (updated_at DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Game patch versions for tournament and meta tracking';

-- ============================================================================
-- TABLE 4: opera_teams
-- Purpose: Team registry and metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS opera_teams (
    team_id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
                        COMMENT 'Unique team identifier',
    
    name                VARCHAR(100) NOT NULL
                        COMMENT 'Team display name',
    
    tag                 VARCHAR(10)
                        COMMENT 'Short tag/abbreviation (e.g., "SEN", "FNC")',
    
    region              VARCHAR(50)
                        COMMENT 'Team home region',
    
    logo_url            VARCHAR(500)
                        COMMENT 'Team logo image URL',
    
    website             VARCHAR(200)
                        COMMENT 'Official team website',
    
    social_media        JSON
                        COMMENT 'Social media links (Twitter, YouTube, etc.)',
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        COMMENT 'Record creation timestamp',
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        COMMENT 'Last modification timestamp',
    
    -- Constraints
    CONSTRAINT uq_team_name UNIQUE (name),
    
    -- Indexes
    INDEX idx_team_region (region),
    INDEX idx_team_tag (tag),
    INDEX idx_team_updated (updated_at DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Esports teams registry';

-- ============================================================================
-- TABLE 5: opera_team_rosters
-- Purpose: Team roster history and player assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS opera_team_rosters (
    roster_id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
                        COMMENT 'Unique roster entry identifier',
    
    team_id             BIGINT UNSIGNED NOT NULL
                        COMMENT 'Team reference',
    
    player_id           VARCHAR(50) NOT NULL
                        COMMENT 'Player identifier (external reference)',
    
    player_name         VARCHAR(100) NOT NULL
                        COMMENT 'Player display name',
    
    role                VARCHAR(30)
                        COMMENT 'Player role: IGL, Entry, Controller, Initiator, Sentinel, Flex',
    
    is_active           BOOLEAN DEFAULT TRUE
                        COMMENT 'Whether player is currently on active roster',
    
    joined_at           DATE
                        COMMENT 'Date player joined roster',
    
    departed_at         DATE
                        COMMENT 'Date player left roster (NULL if still active)',
    
    sator_player_ref    VARCHAR(100)
                        COMMENT 'Cross-reference to SATOR analytics player ID',
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        COMMENT 'Record creation timestamp',
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        COMMENT 'Last modification timestamp',
    
    -- Foreign Keys
    CONSTRAINT fk_roster_team 
        FOREIGN KEY (team_id) REFERENCES opera_teams(team_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Indexes
    INDEX idx_roster_team (team_id),
    INDEX idx_roster_player (player_id),
    INDEX idx_roster_active (is_active),
    INDEX idx_roster_dates (joined_at, departed_at),
    INDEX idx_roster_sator (sator_player_ref),
    INDEX idx_roster_updated (updated_at DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Team roster history with player assignments';

-- ============================================================================
-- TABLE 6: opera_circuits
-- Purpose: Circuit/league definitions (VCT, Challengers, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS opera_circuits (
    circuit_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
                        COMMENT 'Unique circuit identifier',
    
    name                VARCHAR(100) NOT NULL
                        COMMENT 'Circuit display name',
    
    circuit_type        ENUM('franchise', 'qualifier', 'open', 'academy', 'womens', 'mixed')
                        DEFAULT 'open'
                        COMMENT 'Type of circuit structure',
    
    game                VARCHAR(50) DEFAULT 'Valorant'
                        COMMENT 'Game name',
    
    region              VARCHAR(50)
                        COMMENT 'Circuit region',
    
    season              VARCHAR(20)
                        COMMENT 'Season identifier (e.g., "2026")',
    
    split               VARCHAR(20)
                        COMMENT 'Split within season (e.g., "Split 1", "Split 2")',
    
    start_date          DATE
                        COMMENT 'Circuit season start date',
    
    end_date            DATE
                        COMMENT 'Circuit season end date',
    
    is_active           BOOLEAN DEFAULT TRUE
                        COMMENT 'Whether circuit is currently active',
    
    sator_circuit_ref   VARCHAR(100)
                        COMMENT 'Cross-reference to SATOR analytics circuit ID',
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        COMMENT 'Record creation timestamp',
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        COMMENT 'Last modification timestamp',
    
    -- Constraints
    CONSTRAINT uq_circuit_name_season UNIQUE (name, season, split),
    
    -- Indexes
    INDEX idx_circuit_type (circuit_type),
    INDEX idx_circuit_region (region),
    INDEX idx_circuit_season (season),
    INDEX idx_circuit_active (is_active),
    INDEX idx_circuit_dates (start_date, end_date),
    INDEX idx_circuit_sator (sator_circuit_ref),
    INDEX idx_circuit_updated (updated_at DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Esports circuits and league definitions';

-- ============================================================================
-- TABLE 7: opera_circuit_standings
-- Purpose: Circuit leaderboard and team standings
-- ============================================================================
CREATE TABLE IF NOT EXISTS opera_circuit_standings (
    standing_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
                        COMMENT 'Unique standing entry identifier',
    
    circuit_id          BIGINT UNSIGNED NOT NULL
                        COMMENT 'Circuit reference',
    
    team_id             BIGINT UNSIGNED NOT NULL
                        COMMENT 'Team reference',
    
    position            SMALLINT UNSIGNED
                        COMMENT 'Current position in standings',
    
    points              DECIMAL(10, 2) DEFAULT 0
                        COMMENT 'Total circuit points',
    
    wins                SMALLINT UNSIGNED DEFAULT 0
                        COMMENT 'Number of wins',
    
    losses              SMALLINT UNSIGNED DEFAULT 0
                        COMMENT 'Number of losses',
    
    draws               SMALLINT UNSIGNED DEFAULT 0
                        COMMENT 'Number of draws',
    
    maps_won            SMALLINT UNSIGNED DEFAULT 0
                        COMMENT 'Total maps won',
    
    maps_lost           SMALLINT UNSIGNED DEFAULT 0
                        COMMENT 'Total maps lost',
    
    round_diff          SMALLINT DEFAULT 0
                        COMMENT 'Round differential',
    
    form_history        VARCHAR(10)
                        COMMENT 'Recent form (e.g., "WWDLW") - last 5 matches',
    
    is_qualified        BOOLEAN DEFAULT FALSE
                        COMMENT 'Whether team has qualified for next stage',
    
    is_eliminated       BOOLEAN DEFAULT FALSE
                        COMMENT 'Whether team is eliminated',
    
    sator_standing_ref  VARCHAR(100)
                        COMMENT 'Cross-reference to SATOR analytics standing data',
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        COMMENT 'Record creation timestamp',
    
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        COMMENT 'Last modification timestamp',
    
    -- Foreign Keys
    CONSTRAINT fk_standing_circuit 
        FOREIGN KEY (circuit_id) REFERENCES opera_circuits(circuit_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_standing_team 
        FOREIGN KEY (team_id) REFERENCES opera_teams(team_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT uq_circuit_team UNIQUE (circuit_id, team_id),
    
    -- Indexes
    INDEX idx_standing_circuit (circuit_id),
    INDEX idx_standing_team (team_id),
    INDEX idx_standing_position (position),
    INDEX idx_standing_points (points DESC),
    INDEX idx_standing_qualified (is_qualified),
    INDEX idx_standing_sator (sator_standing_ref),
    INDEX idx_standing_updated (updated_at DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Circuit standings and team leaderboards';

-- ============================================================================
-- TABLE 8: opera_sync_log
-- Purpose: Audit log for SATOR synchronization operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS opera_sync_log (
    sync_id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
                        COMMENT 'Unique sync log entry identifier',
    
    sync_type           VARCHAR(50) NOT NULL
                        COMMENT 'Type of sync: tournament_sync, schedule_sync, patch_sync, etc.',
    
    source_system       VARCHAR(50) NOT NULL
                        COMMENT 'Source system (SATOR, external_api, manual, etc.)',
    
    records_processed   INT UNSIGNED DEFAULT 0
                        COMMENT 'Total records processed in sync',
    
    records_created     INT UNSIGNED DEFAULT 0
                        COMMENT 'New records created',
    
    records_updated     INT UNSIGNED DEFAULT 0
                        COMMENT 'Existing records updated',
    
    records_failed      INT UNSIGNED DEFAULT 0
                        COMMENT 'Records that failed to sync',
    
    errors              TEXT
                        COMMENT 'Error messages if any',
    
    sync_duration_ms    INT UNSIGNED
                        COMMENT 'Sync operation duration in milliseconds',
    
    synced_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        COMMENT 'Sync operation timestamp',
    
    synced_by           VARCHAR(100) DEFAULT 'system'
                        COMMENT 'User or system that initiated sync',
    
    -- Indexes
    INDEX idx_sync_type (sync_type),
    INDEX idx_sync_source (source_system),
    INDEX idx_sync_time (synced_at DESC),
    INDEX idx_sync_type_time (sync_type, synced_at DESC)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for data synchronization operations';

-- ============================================================================
-- ADDITIONAL INDEXES FOR CROSS-REFERENCE QUERIES
-- ============================================================================

-- Composite index for SATOR linkage queries
CREATE INDEX idx_tournament_sator_lookup 
    ON opera_tournaments(sator_cross_ref, status);

-- Composite index for match lookups with tournament context
CREATE INDEX idx_schedule_tournament_match 
    ON opera_schedules(tournament_id, match_id, status);

-- Index for active roster queries
CREATE INDEX idx_roster_active_team 
    ON opera_team_rosters(team_id, is_active, joined_at DESC);

-- Index for circuit leaderboard queries
CREATE INDEX idx_standings_leaderboard 
    ON opera_circuit_standings(circuit_id, position, points DESC);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active tournaments with match counts
CREATE OR REPLACE VIEW v_active_tournaments AS
SELECT 
    t.tournament_id,
    t.name,
    t.tier,
    t.game,
    t.region,
    t.status,
    t.start_date,
    t.end_date,
    COUNT(s.schedule_id) as total_matches,
    SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completed_matches,
    SUM(CASE WHEN s.status = 'live' THEN 1 ELSE 0 END) as live_matches,
    SUM(CASE WHEN s.status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_matches
FROM opera_tournaments t
LEFT JOIN opera_schedules s ON t.tournament_id = s.tournament_id
WHERE t.status IN ('upcoming', 'ongoing')
GROUP BY t.tournament_id, t.name, t.tier, t.game, t.region, t.status, t.start_date, t.end_date
ORDER BY t.start_date DESC;

-- View: Upcoming matches with team details
CREATE OR REPLACE VIEW v_upcoming_matches AS
SELECT 
    s.schedule_id,
    s.match_id,
    s.round_name,
    s.scheduled_at,
    s.stream_url,
    s.status,
    t.tournament_id,
    t.name as tournament_name,
    t.tier as tournament_tier,
    ta.team_id as team_a_id,
    ta.name as team_a_name,
    ta.tag as team_a_tag,
    tb.team_id as team_b_id,
    tb.name as team_b_name,
    tb.tag as team_b_tag
FROM opera_schedules s
JOIN opera_tournaments t ON s.tournament_id = t.tournament_id
LEFT JOIN opera_teams ta ON s.team_a_id = ta.team_id
LEFT JOIN opera_teams tb ON s.team_b_id = tb.team_id
WHERE s.status IN ('scheduled', 'live')
ORDER BY s.scheduled_at ASC;

-- View: Current circuit standings with team details
CREATE OR REPLACE VIEW v_current_standings AS
SELECT 
    cs.standing_id,
    c.circuit_id,
    c.name as circuit_name,
    c.season,
    c.split,
    c.region,
    t.team_id,
    t.name as team_name,
    t.tag as team_tag,
    cs.position,
    cs.points,
    cs.wins,
    cs.losses,
    cs.draws,
    cs.maps_won,
    cs.maps_lost,
    cs.round_diff,
    cs.form_history,
    cs.is_qualified,
    cs.is_eliminated
FROM opera_circuit_standings cs
JOIN opera_circuits c ON cs.circuit_id = c.circuit_id
JOIN opera_teams t ON cs.team_id = t.team_id
WHERE c.is_active = TRUE
ORDER BY c.name, cs.position ASC;

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

DELIMITER //

-- Trigger: Log tournament updates
CREATE TRIGGER trg_tournament_update_log
AFTER UPDATE ON opera_tournaments
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO opera_sync_log (
            sync_type, source_system, records_processed, 
            records_updated, synced_by, errors
        ) VALUES (
            'tournament_status_change', 
            'OPERA_INTERNAL', 
            1, 
            1,
            'trigger',
            CONCAT('Status changed from ', OLD.status, ' to ', NEW.status)
        );
    END IF;
END//

-- Trigger: Log schedule status changes
CREATE TRIGGER trg_schedule_status_log
AFTER UPDATE ON opera_schedules
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO opera_sync_log (
            sync_type, source_system, records_processed, 
            records_updated, synced_by, errors
        ) VALUES (
            'match_status_change', 
            'OPERA_INTERNAL', 
            1, 
            1,
            'trigger',
            CONCAT('Match ', NEW.match_id, ': ', OLD.status, ' -> ', NEW.status)
        );
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed: Sample tournaments
INSERT INTO opera_tournaments (
    name, tier, game, region, organizer, prize_pool_usd,
    start_date, end_date, status
) VALUES 
(
    'VCT 2026 Masters Tokyo',
    'Masters',
    'Valorant',
    'International',
    'Riot Games',
    1000000,
    '2026-06-01',
    '2026-06-14',
    'upcoming'
),
(
    'VCT 2026 Champions Seoul',
    'Champions',
    'Valorant',
    'International',
    'Riot Games',
    2500000,
    '2026-08-01',
    '2026-08-24',
    'upcoming'
),
(
    'VCT 2026 Americas Stage 1',
    'Challenger',
    'Valorant',
    'NA',
    'Riot Games',
    500000,
    '2026-01-15',
    '2026-03-15',
    'ongoing'
)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- Seed: Sample patches
INSERT INTO opera_patches (
    version, game, patch_type, release_date, 
    is_active_competitive, summary
) VALUES 
(
    '8.11',
    'Valorant',
    'major',
    '2026-01-10',
    TRUE,
    'New agent Clove, map changes, weapon balance updates'
),
(
    '8.10',
    'Valorant',
    'minor',
    '2025-12-15',
    FALSE,
    'Bug fixes and minor agent adjustments'
),
(
    '8.09',
    'Valorant',
    'minor',
    '2025-11-20',
    FALSE,
    'Quality of life improvements'
)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- ============================================================================
-- RESTORE SETTINGS
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- COMMENTS ON SCHEMA
-- ============================================================================

-- Table comments are included inline above
-- Additional documentation:
-- 
-- opera_tournaments: Master table for all tournament definitions.
--   Links to SATOR analytics via sator_cross_ref field.
--
-- opera_schedules: Match schedules within tournaments.
--   Supports live match tracking and result recording.
--   Foreign keys reference tournaments and teams.
--
-- opera_patches: Game version tracking.
--   Used for meta analysis and tournament patch validation.
--
-- opera_teams: Team registry.
--   Stores team metadata and social media links (JSON).
--
-- opera_team_rosters: Historical roster tracking.
--   Tracks player join/depart dates and roles.
--
-- opera_circuits: Circuit/league definitions.
--   Supports franchise, open, and qualifier circuits.
--
-- opera_circuit_standings: Dynamic standings table.
--   Updated throughout circuit seasons.
--
-- opera_sync_log: Audit trail for all data syncs.
--   Tracks SATOR synchronization and internal changes.
