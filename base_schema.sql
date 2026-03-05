-- BASE (Basic Analytics Stats Engine) - Derived Analytics Tables
-- SATOR-eXe-ROTAS Database Schema
-- SQLite Prototype
-- This file contains the ANALYTICS EXTENSION tables (computed, derived metrics)
-- Each table mirrors a RAWS table with the same primary key

-- ============================================
-- Twin-Table Philosophy
-- ============================================
-- RAWS = Source of truth, immutable reference data
-- BASE = Derived analytics, computed metrics, aggregates
-- Never write to BASE without corresponding RAWS entry
-- Parity checks ensure synchronization

-- ============================================
-- Tournament Analytics (BASE twin of raws_tournaments)
-- ============================================

CREATE TABLE base_tournaments (
    tournament_id   TEXT PRIMARY KEY REFERENCES raws_tournaments(tournament_id),
    
    -- Derived metrics
    total_matches   INTEGER DEFAULT 0,
    completed_matches INTEGER DEFAULT 0,
    total_teams     INTEGER DEFAULT 0,
    total_players   INTEGER DEFAULT 0,
    
    -- Viewership estimates
    peak_viewers    INTEGER,
    avg_viewers     INTEGER,
    hours_watched   INTEGER,
    
    -- Prize distribution analytics
    prize_per_team  REAL,
    prize_per_player REAL,
    
    -- Upset metrics (lower tier beating higher tier)
    upset_count     INTEGER DEFAULT 0,
    upset_percentage REAL,
    
    -- Tournament intensity
    avg_match_duration_minutes INTEGER,
    overtime_match_count INTEGER DEFAULT 0,
    
    -- Computed rating
    tournament_impact_score REAL,  -- Algorithmic tournament importance
    
    -- Parity & Sync
    parity_hash     TEXT NOT NULL,  -- Hash of linked RAWS record
    last_synced     DATETIME NOT NULL,
    sync_status     TEXT DEFAULT 'synced',  -- 'synced', 'pending', 'error', 'orphaned'
    sync_error      TEXT,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_base_tournaments_sync ON base_tournaments(sync_status, last_synced);

-- ============================================
-- Season Analytics (BASE twin of raws_seasons)
-- ============================================

CREATE TABLE base_seasons (
    season_id       TEXT PRIMARY KEY REFERENCES raws_seasons(season_id),
    
    -- Participation
    team_count      INTEGER DEFAULT 0,
    match_count     INTEGER DEFAULT 0,
    map_count       INTEGER DEFAULT 0,
    
    -- Competition metrics
    avg_rounds_per_map REAL,
    most_picked_map TEXT,
    most_banned_map TEXT,
    
    -- Performance distribution
    top_scorer_id   TEXT REFERENCES raws_players(player_id),
    top_team_id     TEXT REFERENCES raws_teams(team_id),
    
    -- Meta analysis
    role_distribution TEXT,  -- JSON: {'awp': 15%, 'rifler': 45%, ...}
    
    -- Parity
    parity_hash     TEXT NOT NULL,
    last_synced     DATETIME NOT NULL,
    sync_status     TEXT DEFAULT 'synced',
    sync_error      TEXT,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Team Analytics (BASE twin of raws_teams)
-- ============================================

CREATE TABLE base_teams (
    team_id         TEXT PRIMARY KEY REFERENCES raws_teams(team_id),
    
    -- Career totals
    matches_played  INTEGER DEFAULT 0,
    matches_won     INTEGER DEFAULT 0,
    matches_lost    INTEGER DEFAULT 0,
    win_rate        REAL,
    
    maps_played     INTEGER DEFAULT 0,
    maps_won        INTEGER DEFAULT 0,
    map_win_rate    REAL,
    
    -- Series performance
    series_played   INTEGER DEFAULT 0,
    series_won      INTEGER DEFAULT 0,
    series_win_rate REAL,
    
    -- Round statistics
    rounds_played   INTEGER DEFAULT 0,
    rounds_won      INTEGER DEFAULT 0,
    round_win_rate  REAL,
    
    -- Side performance (CS2)
    ct_rounds_played INTEGER DEFAULT 0,
    ct_rounds_won   INTEGER DEFAULT 0,
    ct_win_rate     REAL,
    t_rounds_played INTEGER DEFAULT 0,
    t_rounds_won    INTEGER DEFAULT 0,
    t_win_rate      REAL,
    
    -- Rank history
    highest_rank    INTEGER,
    lowest_rank     INTEGER,
    avg_rank        REAL,
    current_streak  INTEGER DEFAULT 0,  -- Positive = win streak, negative = loss streak
    longest_win_streak INTEGER DEFAULT 0,
    longest_loss_streak INTEGER DEFAULT 0,
    
    -- Map pool strength
    best_map        TEXT,
    best_map_win_rate REAL,
    worst_map       TEXT,
    worst_map_win_rate REAL,
    map_pool_depth  INTEGER,  -- Number of maps with >40% win rate
    
    -- Versus tier performance
    vs_tier1_win_rate REAL,
    vs_tier2_win_rate REAL,
    vs_tier3_win_rate REAL,
    
    -- Recent form (last 30 days)
    form_last_5     TEXT,  -- 'WWLWL'
    form_last_10    TEXT,
    form_rating     REAL,  -- Computed form score
    
    -- Economic efficiency
    avg_spent_per_round REAL,
    efficiency_rating REAL,  -- Wins per dollar spent
    
    -- Player roster analytics
    roster_size     INTEGER,
    avg_player_age  REAL,
    core_stability_months INTEGER,  -- Months core 3 have been together
    
    -- All-time rankings
    all_time_peak   INTEGER,
    hltv_points     REAL,
    
    -- Parity
    parity_hash     TEXT NOT NULL,
    last_synced     DATETIME NOT NULL,
    sync_status     TEXT DEFAULT 'synced',
    sync_error      TEXT,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_base_teams_rank ON base_teams(all_time_peak);
CREATE INDEX idx_base_teams_sync ON base_teams(sync_status);

-- Team map-specific stats
CREATE TABLE base_team_maps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id         TEXT NOT NULL REFERENCES raws_teams(team_id),
    map_name        TEXT NOT NULL,
    game_id         TEXT NOT NULL,
    
    -- Performance on this map
    times_played    INTEGER DEFAULT 0,
    wins            INTEGER DEFAULT 0,
    losses          INTEGER DEFAULT 0,
    win_rate        REAL,
    
    -- Side breakdown
    ct_rounds_played INTEGER DEFAULT 0,
    ct_rounds_won   INTEGER DEFAULT 0,
    ct_win_rate     REAL,
    t_rounds_played INTEGER DEFAULT 0,
    t_rounds_won    INTEGER DEFAULT 0,
    t_win_rate      REAL,
    
    -- Trends
    last_played     DATE,
    recent_form     TEXT,  -- Last 5 on this map
    
    -- Rating
    map_rating      REAL,  -- Comparative strength on this map
    
    parity_hash     TEXT,
    last_synced     DATETIME NOT NULL,
    
    UNIQUE(team_id, map_name)
);

CREATE INDEX idx_base_team_maps_team ON base_team_maps(team_id);
CREATE INDEX idx_base_team_maps_map ON base_team_maps(map_name);

-- ============================================
-- Player Analytics (BASE twin of raws_players)
-- ============================================

CREATE TABLE base_players (
    player_id       TEXT PRIMARY KEY REFERENCES raws_players(player_id),
    
    -- Career totals
    matches_played  INTEGER DEFAULT 0,
    maps_played     INTEGER DEFAULT 0,
    rounds_played   INTEGER DEFAULT 0,
    
    -- Combat totals
    total_kills     INTEGER DEFAULT 0,
    total_deaths    INTEGER DEFAULT 0,
    total_assists   INTEGER DEFAULT 0,
    total_damage    INTEGER DEFAULT 0,
    
    -- Derived ratios
    kdr             REAL,  -- Kill/Death Ratio
    kpr             REAL,  -- Kills Per Round
    dpr             REAL,  -- Deaths Per Round
    apr             REAL,  -- Assists Per Round
    adr             REAL,  -- Average Damage per Round
    
    -- Headshot metrics
    total_headshots INTEGER DEFAULT 0,
    headshot_percentage REAL,
    
    -- Impact metrics
    impact_rating   REAL,  -- HLTV-style impact
    opening_success_rate REAL,
    clutches_won    INTEGER DEFAULT 0,
    clutch_success_rate REAL,
    
    -- Consistency
    rating_avg      REAL,
    rating_std_dev  REAL,  -- Lower = more consistent
    rating_best     REAL,
    rating_worst    REAL,
    
    -- Round contributions
    kast_percentage REAL,  -- Kill Assist Survive Trade %
    mvp_count       INTEGER DEFAULT 0,
    
    -- Multi-kill career totals
    _2k_total       INTEGER DEFAULT 0,
    _3k_total       INTEGER DEFAULT 0,
    _4k_total       INTEGER DEFAULT 0,
    _5k_total       INTEGER DEFAULT 0,  -- Aces
    
    -- Role-specific metrics
    awp_kills_total INTEGER DEFAULT 0,
    awp_kpr         REAL,
    entry_success_rate REAL,
    support_rounds_won INTEGER DEFAULT 0,
    
    -- Versus statistics
    vs_top20_rating REAL,  -- Performance vs top 20 teams
    vs_top10_rating REAL,
    vs_top5_rating  REAL,
    big_match_rating REAL,  -- Performance in important matches
    
    -- Recent form
    form_last_5_rating REAL,
    form_last_10_rating REAL,
    form_last_20_rating REAL,
    form_trend      TEXT,  -- 'improving', 'declining', 'stable'
    
    -- Career progression
    debut_date      DATE,
    years_active    REAL,
    teams_played_for INTEGER DEFAULT 0,
    
    -- Peak performance
    best_map        TEXT,
    best_map_rating REAL,
    worst_map       TEXT,
    worst_map_rating REAL,
    
    -- Team contribution
    team_win_contrib REAL,  -- Win rate when player plays vs when benched
    
    -- Advanced HLTV-style rating components
    kill_rating     REAL,
    survival_rating REAL,
    damage_rating   REAL,
    
    -- Parity
    parity_hash     TEXT NOT NULL,
    last_synced     DATETIME NOT NULL,
    sync_status     TEXT DEFAULT 'synced',
    sync_error      TEXT,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_base_players_rating ON base_players(rating_avg);
CREATE INDEX idx_base_players_sync ON base_players(sync_status);

-- Player map-specific stats
CREATE TABLE base_player_maps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id       TEXT NOT NULL REFERENCES raws_players(player_id),
    map_name        TEXT NOT NULL,
    game_id         TEXT NOT NULL,
    
    times_played    INTEGER DEFAULT 0,
    total_kills     INTEGER DEFAULT 0,
    total_deaths    INTEGER DEFAULT 0,
    kdr             REAL,
    kpr             REAL,
    adr             REAL,
    rating_avg      REAL,
    
    -- Map-specific role performance
    awp_kpr         REAL,
    entry_success   REAL,
    
    parity_hash     TEXT,
    last_synced     DATETIME NOT NULL,
    
    UNIQUE(player_id, map_name)
);

CREATE INDEX idx_base_player_maps_player ON base_player_maps(player_id);
CREATE INDEX idx_base_player_maps_map ON base_player_maps(map_name);

-- Player teammates analysis (synergy metrics)
CREATE TABLE base_player_teammates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id       TEXT NOT NULL REFERENCES raws_players(player_id),
    teammate_id     TEXT NOT NULL REFERENCES raws_players(player_id),
    
    -- Time together
    months_together INTEGER DEFAULT 0,
    matches_together INTEGER DEFAULT 0,
    
    -- Performance together
    win_rate_together REAL,
    avg_team_rating_together REAL,
    
    -- Individual boost/debuff
    player_rating_with REAL,  -- This player's rating with teammate
    player_rating_without REAL,  -- This player's rating without teammate
    synergy_score   REAL,  -- Positive = better together
    
    parity_hash     TEXT,
    last_synced     DATETIME NOT NULL,
    
    UNIQUE(player_id, teammate_id)
);

CREATE INDEX idx_base_player_teammates_player ON base_player_teammates(player_id);

-- ============================================
-- Match Analytics (BASE twin of raws_matches)
-- ============================================

CREATE TABLE base_matches (
    match_id        TEXT PRIMARY KEY REFERENCES raws_matches(match_id),
    
    -- Pre-match predictions (at time of match)
    predicted_winner_id TEXT,
    prediction_confidence REAL,
    
    -- Post-match analysis
    upset_flag      BOOLEAN DEFAULT 0,
    quality_rating  REAL,  -- Match entertainment/quality score
    
    -- Performance vs expectation
    team_a_performance_vs_expected REAL,
    team_b_performance_vs_expected REAL,
    
    -- Key moments
    comeback_flag   BOOLEAN DEFAULT 0,  -- Large deficit overcome
    comeback_from_round INTEGER,  -- Round deficit overcome from
    
    -- Statistical anomalies
    statistical_outliers TEXT,  -- JSON array of unusual performances
    
    -- Pace analysis
    avg_round_duration_seconds INTEGER,
    pace_rating     TEXT,  -- 'slow', 'medium', 'fast'
    
    -- Economy analysis
    eco_round_efficiency_a REAL,
    eco_round_efficiency_b REAL,
    force_buy_success_a REAL,
    force_buy_success_b REAL,
    
    -- Clutch analysis
    total_clutches  INTEGER DEFAULT 0,
    clutch_impact_score REAL,
    
    -- Rating distribution
    highest_rating_player_id TEXT,
    lowest_rating_player_id TEXT,
    rating_spread   REAL,  -- Difference between best and worst
    
    -- Team stats aggregates (from player stats)
    team_a_combined_rating REAL,
    team_b_combined_rating REAL,
    
    -- Head-to-head history at time of match
    h2h_wins_a      INTEGER,
    h2h_wins_b      INTEGER,
    
    -- Parity
    parity_hash     TEXT NOT NULL,
    last_synced     DATETIME NOT NULL,
    sync_status     TEXT DEFAULT 'synced',
    sync_error      TEXT,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_base_matches_sync ON base_matches(sync_status);

-- ============================================
-- Match Map Analytics (BASE twin of raws_match_maps)
-- ============================================

CREATE TABLE base_match_maps (
    map_id          TEXT PRIMARY KEY REFERENCES raws_match_maps(map_id),
    
    -- Statistical summary
    total_kills     INTEGER DEFAULT 0,
    total_deaths    INTEGER DEFAULT 0,
    avg_round_time_seconds INTEGER,
    
    -- Side balance
    ct_round_win_rate REAL,
    t_round_win_rate REAL,
    side_balance_rating REAL,  -- 0.5 = perfect balance
    
    -- Economy flow
    full_buy_rounds INTEGER DEFAULT 0,
    eco_rounds      INTEGER DEFAULT 0,
    force_buy_rounds INTEGER DEFAULT 0,
    
    -- Action density
    kills_per_round_avg REAL,
    action_rating   REAL,  -- How action-packed the map was
    
    -- Comeback analysis
    largest_lead_a  INTEGER,
    largest_lead_b  INTEGER,
    lead_changes    INTEGER DEFAULT 0,
    
    -- Player of the map
    top_player_id   TEXT REFERENCES raws_players(player_id),
    top_player_rating REAL,
    
    -- Parity
    parity_hash     TEXT NOT NULL,
    last_synced     DATETIME NOT NULL,
    sync_status     TEXT DEFAULT 'synced',
    sync_error      TEXT,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Player Stats Analytics (BASE twin of raws_player_stats)
-- ============================================

CREATE TABLE base_player_stats (
    stat_id         TEXT PRIMARY KEY REFERENCES raws_player_stats(stat_id),
    
    -- Derived metrics from raw stats
    kdr             REAL,
    kpr             REAL,
    dpr             REAL,
    impact          REAL,  -- HLTV-style impact calculation
    
    -- Consistency within this match
    round_consistency REAL,  -- Variance in performance across rounds
    
    -- Clutch analysis
    clutch_attempts INTEGER DEFAULT 0,
    clutch_success  REAL,  -- Success rate
    
    -- Opening impact
    opening_success REAL,  -- Opening kill %
    opening_impact  REAL,  -- Weighted by importance
    
    -- Multikill impact
    multi_kill_impact REAL,
    
    -- Versus team rating (performance vs opponent strength)
    opponent_adjusted_rating REAL,
    
    -- Comparison to player's average
    vs_career_avg_kdr REAL,  -- Positive = above average
    vs_career_avg_rating REAL,
    
    -- Role performance
    role_fulfilled  REAL,  -- How well they performed their role
    
    -- Clutch impact score
    clutch_impact_score REAL,
    
    -- Trade efficiency
    trade_kills     INTEGER DEFAULT 0,
    trade_deaths    INTEGER DEFAULT 0,
    trade_efficiency REAL,
    
    -- Parity
    parity_hash     TEXT NOT NULL,
    last_synced     DATETIME NOT NULL,
    sync_status     TEXT DEFAULT 'synced',
    sync_error      TEXT,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Team Stats Analytics (BASE twin of raws_team_stats)
-- ============================================

CREATE TABLE base_team_stats (
    stat_id         TEXT PRIMARY KEY REFERENCES raws_team_stats(stat_id),
    
    -- Derived efficiency metrics
    kill_efficiency REAL,  -- Kills per round / expected kills
    economic_efficiency REAL,  -- Rounds won / money spent ratio
    
    -- Round type success rates
    pistol_win_rate REAL,
    gun_round_win_rate REAL,
    eco_win_rate    REAL,
    force_win_rate  REAL,
    
    -- Momentum metrics
    streak_potential REAL,  -- Ability to win consecutive rounds
    recovery_rate   REAL,  -- Ability to win after losing streak
    
    -- Coordination metrics
    trade_efficiency REAL,
    flash_assist_rate REAL,  -- CS: flashes leading to kills
    
    -- Site control (CS)
    a_site_hold_rate REAL,
    b_site_hold_rate REAL,
    
    -- Parity
    parity_hash     TEXT NOT NULL,
    last_synced     DATETIME NOT NULL,
    sync_status     TEXT DEFAULT 'synced',
    sync_error      TEXT,
    
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Cross-Entity Analytics (Not in RAWS)
-- ============================================

-- Head-to-head records (computed)
CREATE TABLE base_head_to_head (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_a_type   TEXT NOT NULL,  -- 'team', 'player'
    entity_a_id     TEXT NOT NULL,
    entity_b_type   TEXT NOT NULL,
    entity_b_id     TEXT NOT NULL,
    game_id         TEXT NOT NULL,
    
    -- Match history
    matches_played  INTEGER DEFAULT 0,
    a_wins          INTEGER DEFAULT 0,
    b_wins          INTEGER DEFAULT 0,
    draws           INTEGER DEFAULT 0,
    
    -- Map history
    maps_played     INTEGER DEFAULT 0,
    a_map_wins      INTEGER DEFAULT 0,
    b_map_wins      INTEGER DEFAULT 0,
    
    -- Recent form
    last_match_date DATE,
    current_streak  INTEGER DEFAULT 0,  -- Positive = A winning streak
    
    -- Performance
    avg_map_diff    REAL,  -- Average round differential
    closest_match   TEXT REFERENCES raws_matches(match_id),
    most_lopsided   TEXT REFERENCES raws_matches(match_id),
    
    -- Elo ratings at various times
    peak_elo_a      REAL,
    peak_elo_b      REAL,
    
    last_calculated DATETIME NOT NULL,
    
    UNIQUE(entity_a_type, entity_a_id, entity_b_type, entity_b_id, game_id)
);

CREATE INDEX idx_h2h_a ON base_head_to_head(entity_a_type, entity_a_id);
CREATE INDEX idx_h2h_b ON base_head_to_head(entity_b_type, entity_b_id);

-- Elo ratings history (time-series)
CREATE TABLE base_elo_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type     TEXT NOT NULL,  -- 'team', 'player'
    entity_id       TEXT NOT NULL,
    game_id         TEXT NOT NULL,
    
    match_id        TEXT REFERENCES raws_matches(match_id),
    
    elo_before      REAL NOT NULL,
    elo_after       REAL NOT NULL,
    elo_change      REAL NOT NULL,
    
    rank_before     INTEGER,
    rank_after      INTEGER,
    
    recorded_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_elo_entity ON base_elo_history(entity_type, entity_id, game_id);
CREATE INDEX idx_elo_match ON base_elo_history(match_id);

-- ============================================
-- Views for Common Analytics Queries
-- ============================================

-- Player leaderboard
CREATE VIEW v_player_leaderboard AS
SELECT 
    p.player_id,
    p.player_name,
    p.country,
    p.current_team_id,
    t.team_name,
    bp.matches_played,
    bp.rating_avg,
    bp.kdr,
    bp.adr,
    bp.kpr,
    bp.impact_rating,
    bp.headshot_percentage,
    bp.form_last_10_rating
FROM raws_players p
JOIN base_players bp ON p.player_id = bp.player_id
LEFT JOIN raws_teams t ON p.current_team_id = t.team_id
WHERE bp.matches_played >= 10  -- Minimum sample size
ORDER BY bp.rating_avg DESC;

-- Team rankings
CREATE VIEW v_team_rankings AS
SELECT 
    t.team_id,
    t.team_name,
    t.team_short,
    t.region,
    bt.matches_played,
    bt.win_rate,
    bt.map_win_rate,
    bt.current_streak,
    bt.form_rating,
    bt.map_pool_depth,
    bt.vs_tier1_win_rate
FROM raws_teams t
JOIN base_teams bt ON t.team_id = bt.team_id
WHERE bt.matches_played >= 5
ORDER BY bt.form_rating DESC NULLS LAST;

-- Match quality leaderboard
CREATE VIEW v_best_matches AS
SELECT 
    m.match_id,
    m.match_date,
    t1.team_name as team_a,
    t2.team_name as team_b,
    m.team_a_score,
    m.team_b_score,
    bm.quality_rating,
    bm.upset_flag,
    bm.comeback_flag,
    raws.tournament_name
FROM raws_matches m
JOIN base_matches bm ON m.match_id = bm.match_id
JOIN raws_teams t1 ON m.team_a_id = t1.team_id
JOIN raws_teams t2 ON m.team_b_id = t2.team_id
JOIN raws_tournaments raws ON m.tournament_id = raws.tournament_id
WHERE m.status = 'completed'
ORDER BY bm.quality_rating DESC NULLS LAST;

-- Sync status overview
CREATE VIEW v_sync_status AS
SELECT 
    'tournaments' as table_name,
    COUNT(*) as total,
    SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced,
    SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END) as errors,
    SUM(CASE WHEN sync_status = 'orphaned' THEN 1 ELSE 0 END) as orphaned
FROM base_tournaments
UNION ALL
SELECT 
    'teams' as table_name,
    COUNT(*),
    SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'orphaned' THEN 1 ELSE 0 END)
FROM base_teams
UNION ALL
SELECT 
    'players' as table_name,
    COUNT(*),
    SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'orphaned' THEN 1 ELSE 0 END)
FROM base_players
UNION ALL
SELECT 
    'matches' as table_name,
    COUNT(*),
    SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sync_status = 'orphaned' THEN 1 ELSE 0 END)
FROM base_matches;
