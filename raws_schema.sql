-- RAWS (Reference Analytics Web Stats) - Raw Data Tables
-- SATOR-eXe-ROTAS Database Schema
-- SQLite Prototype - Counter-Strike Focus with Valorant Extensibility
-- This file contains the STATIC REFERENCE tables (raw, immutable data)

-- ============================================
-- Core Reference Tables (Game-Agnostic)
-- ============================================

CREATE TABLE raws_games (
    game_id         TEXT PRIMARY KEY,
    game_name       TEXT NOT NULL,
    game_short      TEXT NOT NULL,  -- 'cs2', 'valorant', etc.
    developer       TEXT,
    release_date    DATE,
    is_active       BOOLEAN DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO raws_games (game_id, game_name, game_short, developer, release_date, is_active) VALUES
('cs2', 'Counter-Strike 2', 'cs2', 'Valve', '2023-09-27', 1),
('val', 'Valorant', 'val', 'Riot Games', '2020-06-02', 0);  -- Extensible

-- ============================================
-- Tournament Structure
-- ============================================

CREATE TABLE raws_tournaments (
    tournament_id   TEXT PRIMARY KEY,
    tournament_name TEXT NOT NULL,
    game_id         TEXT NOT NULL REFERENCES raws_games(game_id),
    organizer       TEXT,
    region          TEXT,  -- 'global', 'eu', 'na', 'asia', etc.
    tier            INTEGER,  -- 1 (S-Tier), 2 (A-Tier), 3 (B-Tier)
    prize_pool_usd  INTEGER,
    start_date      DATE,
    end_date        DATE,
    location        TEXT,
    online          BOOLEAN DEFAULT 0,
    lan             BOOLEAN DEFAULT 1,
    
    -- Parity tracking (even in raw tables for cross-system sync)
    data_hash       TEXT,  -- Hash of core data fields
    source_url      TEXT,
    source_name     TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tournaments_game ON raws_tournaments(game_id);
CREATE INDEX idx_tournaments_dates ON raws_tournaments(start_date, end_date);

CREATE TABLE raws_seasons (
    season_id       TEXT PRIMARY KEY,
    tournament_id   TEXT NOT NULL REFERENCES raws_tournaments(tournament_id),
    season_name     TEXT NOT NULL,  -- '2024', 'Spring 2024', 'Stage 1'
    season_number   INTEGER,
    phase           TEXT,  -- 'group', 'playoffs', 'finals'
    start_date      DATE,
    end_date        DATE,
    
    data_hash       TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seasons_tournament ON raws_seasons(tournament_id);

-- ============================================
-- Entity Tables (Teams & Players)
-- ============================================

CREATE TABLE raws_teams (
    team_id         TEXT PRIMARY KEY,
    team_name       TEXT NOT NULL,
    team_short      TEXT NOT NULL,  -- Tag like 'NAVI', 'G2'
    game_id         TEXT NOT NULL REFERENCES raws_games(game_id),
    region          TEXT,
    country         TEXT,
    founded_date    DATE,
    disbanded_date  DATE,
    logo_url        TEXT,
    
    -- CS-specific (nullable for Valorant compatibility)
    hltv_id         INTEGER,
    hltv_rank       INTEGER,
    
    -- Valorant-specific (future use)
    vlr_id          INTEGER,
    vlr_rank        INTEGER,
    
    data_hash       TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_game ON raws_teams(game_id);
CREATE INDEX idx_teams_short ON raws_teams(team_short);

CREATE TABLE raws_players (
    player_id       TEXT PRIMARY KEY,
    player_name     TEXT NOT NULL,  -- Current gamertag
    real_name       TEXT,
    game_id         TEXT NOT NULL REFERENCES raws_games(game_id),
    country         TEXT,
    nationality     TEXT,
    region          TEXT,
    birth_date      DATE,
    
    -- Role classification (game-agnostic with game-specific values)
    primary_role    TEXT,  -- CS: 'awp', 'rifler', 'igl', 'support', 'entry'
                           -- Valorant: 'duelist', 'controller', 'sentinel', 'initiator'
    
    -- Platform IDs
    steam_id64      TEXT,  -- CS2
    hltv_id         INTEGER,
    faceit_id       TEXT,
    
    -- Valorant (future)
    riot_puuid      TEXT,
    vlr_id          INTEGER,
    
    -- Current team reference (not enforced FK, players change teams)
    current_team_id TEXT REFERENCES raws_teams(team_id),
    
    data_hash       TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_game ON raws_players(game_id);
CREATE INDEX idx_players_team ON raws_players(current_team_id);
CREATE INDEX idx_players_country ON raws_players(country);

-- Player-team history (many-to-many with time periods)
CREATE TABLE raws_player_teams (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id       TEXT NOT NULL REFERENCES raws_players(player_id),
    team_id         TEXT NOT NULL REFERENCES raws_teams(team_id),
    join_date       DATE,
    leave_date      DATE,
    is_substitute   BOOLEAN DEFAULT 0,
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_teams_player ON raws_player_teams(player_id);
CREATE INDEX idx_player_teams_team ON raws_player_teams(team_id);
CREATE INDEX idx_player_teams_dates ON raws_player_teams(join_date, leave_date);

-- ============================================
-- Match Data (The Core Event)
-- ============================================

CREATE TABLE raws_matches (
    match_id        TEXT PRIMARY KEY,
    game_id         TEXT NOT NULL REFERENCES raws_games(game_id),
    season_id       TEXT REFERENCES raws_seasons(season_id),
    tournament_id   TEXT REFERENCES raws_tournaments(tournament_id),
    
    -- Teams
    team_a_id       TEXT NOT NULL REFERENCES raws_teams(team_id),
    team_b_id       TEXT NOT NULL REFERENCES raws_teams(team_id),
    
    -- Result (NULL if upcoming)
    winner_id       TEXT REFERENCES raws_teams(team_id),
    team_a_score    INTEGER,
    team_b_score    INTEGER,
    
    -- Match metadata
    match_date      DATETIME,
    scheduled_date  DATETIME,  -- For upcoming matches
    best_of         INTEGER DEFAULT 3,  -- 1, 3, or 5
    
    -- Location/Venue
    venue           TEXT,
    stream_url      TEXT,
    demo_url        TEXT,
    vod_url         TEXT,
    
    -- Status
    status          TEXT DEFAULT 'scheduled',  -- 'scheduled', 'live', 'completed', 'postponed', 'cancelled'
    
    -- Source tracking
    hltv_match_id   INTEGER,
    
    -- Parity
    data_hash       TEXT,
    source_url      TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_game ON raws_matches(game_id);
CREATE INDEX idx_matches_tournament ON raws_matches(tournament_id);
CREATE INDEX idx_matches_season ON raws_matches(season_id);
CREATE INDEX idx_matches_date ON raws_matches(match_date);
CREATE INDEX idx_matches_teams ON raws_matches(team_a_id, team_b_id);
CREATE INDEX idx_matches_status ON raws_matches(status);

-- Match maps (for multi-map series like BO3)
CREATE TABLE raws_match_maps (
    map_id          TEXT PRIMARY KEY,
    match_id        TEXT NOT NULL REFERENCES raws_matches(match_id),
    map_number      INTEGER NOT NULL,
    
    -- CS2: 'de_dust2', 'de_mirage', etc.
    -- Valorant: 'Haven', 'Bind', etc.
    map_name        TEXT NOT NULL,
    
    -- Picks/bans info
    picked_by       TEXT REFERENCES raws_teams(team_id),
    banned_by       TEXT REFERENCES raws_teams(team_id),
    
    -- Result
    team_a_score    INTEGER,
    team_b_score    INTEGER,
    winner_id       TEXT REFERENCES raws_teams(team_id),
    
    -- Overtime
    overtime_count  INTEGER DEFAULT 0,
    
    -- Duration
    duration_seconds INTEGER,
    
    started_at      DATETIME,
    ended_at        DATETIME,
    
    data_hash       TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_match_maps_match ON raws_match_maps(match_id);
CREATE INDEX idx_match_maps_map ON raws_match_maps(map_name);

-- ============================================
-- Player Statistics (Per Match/Map)
-- ============================================

CREATE TABLE raws_player_stats (
    stat_id         TEXT PRIMARY KEY,
    match_id        TEXT NOT NULL REFERENCES raws_matches(match_id),
    map_id          TEXT REFERENCES raws_match_maps(map_id),  -- NULL if match-level only
    player_id       TEXT NOT NULL REFERENCES raws_players(player_id),
    team_id         TEXT NOT NULL REFERENCES raws_teams(team_id),  -- Team they played for
    
    -- Core combat stats
    kills           INTEGER DEFAULT 0,
    deaths          INTEGER DEFAULT 0,
    assists         INTEGER DEFAULT 0,
    
    -- Damage
    damage          INTEGER DEFAULT 0,
    damage_taken    INTEGER DEFAULT 0,
    
    -- CS2 Specific Stats
    headshots       INTEGER DEFAULT 0,
    
    -- Rounds
    rounds_played   INTEGER DEFAULT 0,
    rounds_won      INTEGER DEFAULT 0,
    
    -- KAST (Kill Assist Survive Trade) - CS metric
    kast_rounds     INTEGER DEFAULT 0,
    
    -- Opening duels
    opening_kills   INTEGER DEFAULT 0,
    opening_deaths  INTEGER DEFAULT 0,
    
    -- Multi-kills
    _1k             INTEGER DEFAULT 0,
    _2k             INTEGER DEFAULT 0,
    _3k             INTEGER DEFAULT 0,
    _4k             INTEGER DEFAULT 0,
    _5k             INTEGER DEFAULT 0,
    
    -- Clutch situations
    _1v1_won        INTEGER DEFAULT 0,
    _1v2_won        INTEGER DEFAULT 0,
    _1v3_won        INTEGER DEFAULT 0,
    _1v4_won        INTEGER DEFAULT 0,
    _1v5_won        INTEGER DEFAULT 0,
    _1v1_attempts   INTEGER DEFAULT 0,
    _1v2_attempts   INTEGER DEFAULT 0,
    _1v3_attempts   INTEGER DEFAULT 0,
    _1v4_attempts   INTEGER DEFAULT 0,
    _1v5_attempts   INTEGER DEFAULT 0,
    
    -- Economy
    adr             REAL,  -- Average Damage per Round
    kpr             REAL,  -- Kills per Round
    dpr             REAL,  -- Deaths per Round
    
    -- Rating (HLTV 2.0)
    rating          REAL,
    
    -- Flags
    mvp             BOOLEAN DEFAULT 0,
    
    -- Data integrity
    data_hash       TEXT,
    source_verified BOOLEAN DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_stats_match ON raws_player_stats(match_id);
CREATE INDEX idx_player_stats_map ON raws_player_stats(map_id);
CREATE INDEX idx_player_stats_player ON raws_player_stats(player_id);
CREATE INDEX idx_player_stats_team ON raws_player_stats(team_id);
CREATE INDEX idx_player_stats_match_player ON raws_player_stats(match_id, player_id);

-- ============================================
-- Team Statistics (Per Match/Map)
-- ============================================

CREATE TABLE raws_team_stats (
    stat_id         TEXT PRIMARY KEY,
    match_id        TEXT NOT NULL REFERENCES raws_matches(match_id),
    map_id          TEXT REFERENCES raws_match_maps(map_id),  -- NULL if match-level
    team_id         TEXT NOT NULL REFERENCES raws_teams(team_id),
    opponent_id     TEXT REFERENCES raws_teams(team_id),
    
    -- Side played (CS2: 'ct' or 't', Valorant: 'defense' or 'attack')
    side            TEXT,
    
    -- Score
    rounds_won      INTEGER DEFAULT 0,
    rounds_lost     INTEGER DEFAULT 0,
    
    -- Round outcomes
    pistol_won_ct   INTEGER DEFAULT 0,
    pistol_won_t    INTEGER DEFAULT 0,
    gun_won_ct      INTEGER DEFAULT 0,
    gun_won_t       INTEGER DEFAULT 0,
    eco_won_ct      INTEGER DEFAULT 0,  -- Won against full buy on eco
    eco_won_t       INTEGER DEFAULT 0,
    force_won_ct    INTEGER DEFAULT 0,  -- Won on force buy
    force_won_t     INTEGER DEFAULT 0,
    
    -- Team performance
    total_kills     INTEGER DEFAULT 0,
    total_deaths    INTEGER DEFAULT 0,
    total_assists   INTEGER DEFAULT 0,
    total_damage    INTEGER DEFAULT 0,
    
    -- Bomb/site stats (CS2)
    bombs_planted   INTEGER DEFAULT 0,
    bombs_defused   INTEGER DEFAULT 0,
    bomb_exploded   INTEGER DEFAULT 0,
    
    -- Entry stats
    entry_wins      INTEGER DEFAULT 0,
    entry_losses    INTEGER DEFAULT 0,
    
    -- Economy
    total_spent     INTEGER DEFAULT 0,  -- Total money spent
    avg_team_money  INTEGER DEFAULT 0,  -- Average team economy
    
    -- Extensible JSON for game-specific stats
    extra_stats     TEXT,  -- JSON blob for future expansion
    
    data_hash       TEXT,
    source_verified BOOLEAN DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_stats_match ON raws_team_stats(match_id);
CREATE INDEX idx_team_stats_map ON raws_team_stats(map_id);
CREATE INDEX idx_team_stats_team ON raws_team_stats(team_id);

-- ============================================
-- Data Integrity Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER raws_tournaments_updated AFTER UPDATE ON raws_tournaments
BEGIN
    UPDATE raws_tournaments SET updated_at = CURRENT_TIMESTAMP WHERE tournament_id = NEW.tournament_id;
END;

CREATE TRIGGER raws_seasons_updated AFTER UPDATE ON raws_seasons
BEGIN
    UPDATE raws_seasons SET updated_at = CURRENT_TIMESTAMP WHERE season_id = NEW.season_id;
END;

CREATE TRIGGER raws_teams_updated AFTER UPDATE ON raws_teams
BEGIN
    UPDATE raws_teams SET updated_at = CURRENT_TIMESTAMP WHERE team_id = NEW.team_id;
END;

CREATE TRIGGER raws_players_updated AFTER UPDATE ON raws_players
BEGIN
    UPDATE raws_players SET updated_at = CURRENT_TIMESTAMP WHERE player_id = NEW.player_id;
END;

CREATE TRIGGER raws_matches_updated AFTER UPDATE ON raws_matches
BEGIN
    UPDATE raws_matches SET updated_at = CURRENT_TIMESTAMP WHERE match_id = NEW.match_id;
END;

CREATE TRIGGER raws_match_maps_updated AFTER UPDATE ON raws_match_maps
BEGIN
    UPDATE raws_match_maps SET updated_at = CURRENT_TIMESTAMP WHERE map_id = NEW.map_id;
END;

CREATE TRIGGER raws_player_stats_updated AFTER UPDATE ON raws_player_stats
BEGIN
    UPDATE raws_player_stats SET updated_at = CURRENT_TIMESTAMP WHERE stat_id = NEW.stat_id;
END;

CREATE TRIGGER raws_team_stats_updated AFTER UPDATE ON raws_team_stats
BEGIN
    UPDATE raws_team_stats SET updated_at = CURRENT_TIMESTAMP WHERE stat_id = NEW.stat_id;
END;

-- ============================================
-- Views for Common Queries
-- ============================================

-- Active tournaments
CREATE VIEW v_active_tournaments AS
SELECT t.*, g.game_name
FROM raws_tournaments t
JOIN raws_games g ON t.game_id = g.game_id
WHERE t.end_date >= date('now') OR t.end_date IS NULL;

-- Recent matches with team names
CREATE VIEW v_recent_matches AS
SELECT 
    m.*,
    ta.team_name as team_a_name,
    tb.team_name as team_b_name,
    tw.team_name as winner_name
FROM raws_matches m
JOIN raws_teams ta ON m.team_a_id = ta.team_id
JOIN raws_teams tb ON m.team_b_id = tb.team_id
LEFT JOIN raws_teams tw ON m.winner_id = tw.team_id
ORDER BY m.match_date DESC;

-- Player career stats summary (raw aggregation)
CREATE VIEW v_player_career_raw AS
SELECT 
    p.player_id,
    p.player_name,
    p.country,
    p.primary_role,
    COUNT(DISTINCT ps.match_id) as matches_played,
    COUNT(DISTINCT ps.map_id) as maps_played,
    SUM(ps.kills) as total_kills,
    SUM(ps.deaths) as total_deaths,
    SUM(ps.assists) as total_assists,
    SUM(ps.damage) as total_damage,
    SUM(ps.rounds_played) as total_rounds,
    AVG(ps.rating) as avg_rating,
    MAX(ps.kills) as best_kills
FROM raws_players p
LEFT JOIN raws_player_stats ps ON p.player_id = ps.player_id
GROUP BY p.player_id, p.player_name, p.country, p.primary_role;
