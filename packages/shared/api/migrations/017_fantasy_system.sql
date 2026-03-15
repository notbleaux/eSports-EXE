-- [Ver001.000]
-- Fantasy eSports System Migration
-- ================================
-- Online fantasy game for Valorant and CS2

-- Fantasy leagues
CREATE TABLE IF NOT EXISTS fantasy_leagues (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game VARCHAR(20) CHECK (game IN ('valorant', 'cs2')),
    league_type VARCHAR(20) CHECK (league_type IN ('public', 'private', 'premium')),
    max_teams INTEGER DEFAULT 10 CHECK (max_teams BETWEEN 2 AND 50),
    roster_size INTEGER DEFAULT 5,
    salary_cap INTEGER DEFAULT 100000, -- Virtual currency for draft
    draft_type VARCHAR(20) CHECK (draft_type IN ('snake', 'auction', 'pick_em')),
    draft_status VARCHAR(20) DEFAULT 'pending' CHECK (draft_status IN ('pending', 'in_progress', 'completed')),
    season_start_date DATE,
    season_end_date DATE,
    entry_fee_tokens INTEGER DEFAULT 0,
    prize_pool_tokens INTEGER DEFAULT 0,
    scoring_rules JSON, -- Custom scoring configuration
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fantasy teams (user rosters)
CREATE TABLE IF NOT EXISTS fantasy_teams (
    id VARCHAR(50) PRIMARY KEY,
    league_id VARCHAR(50) NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    owner_id VARCHAR(50) NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    team_logo_url TEXT,
    total_points INTEGER DEFAULT 0,
    weekly_points INTEGER DEFAULT 0,
    rank_position INTEGER,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    streak VARCHAR(10), -- W3, L2, D1, etc.
    budget_remaining INTEGER, -- For auction drafts
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, owner_id)
);

-- Fantasy roster spots (team composition)
CREATE TABLE IF NOT EXISTS fantasy_rosters (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    player_id VARCHAR(50) NOT NULL, -- Reference to SATOR player_id
    player_name VARCHAR(100) NOT NULL,
    player_role VARCHAR(50), -- Duelist, Controller, Entry, AWPer, etc.
    team_tag VARCHAR(50), -- SEN, FNC, NAVI, etc.
    acquisition_type VARCHAR(20) CHECK (acquisition_type IN ('draft', 'waiver', 'trade', 'free_agent')),
    draft_round INTEGER,
    draft_pick INTEGER,
    purchase_price INTEGER, -- For auction drafts
    is_captain BOOLEAN DEFAULT FALSE,
    is_vice_captain BOOLEAN DEFAULT FALSE,
    is_starter BOOLEAN DEFAULT TRUE,
    is_bench BOOLEAN DEFAULT FALSE,
    week_acquired INTEGER DEFAULT 1,
    week_dropped INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fantasy scoring periods (weekly)
CREATE TABLE IF NOT EXISTS fantasy_scoring_periods (
    id SERIAL PRIMARY KEY,
    league_id VARCHAR(50) NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_playoffs BOOLEAN DEFAULT FALSE,
    is_finals BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, week_number)
);

-- Fantasy player scores (weekly performance)
CREATE TABLE IF NOT EXISTS fantasy_player_scores (
    id SERIAL PRIMARY KEY,
    scoring_period_id INTEGER NOT NULL REFERENCES fantasy_scoring_periods(id) ON DELETE CASCADE,
    player_id VARCHAR(50) NOT NULL,
    fantasy_team_id VARCHAR(50) REFERENCES fantasy_teams(id),
    game VARCHAR(20) CHECK (game IN ('valorant', 'cs2')),
    
    -- Match participation
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    maps_played INTEGER DEFAULT 0,
    rounds_played INTEGER DEFAULT 0,
    
    -- Combat stats (Valorant + CS2 common)
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    kd_ratio DECIMAL(4,2),
    kast DECIMAL(5,2), -- Kill Assist Survive Trade %
    
    -- CS2 specific
    headshots INTEGER DEFAULT 0,
    headshot_pct DECIMAL(5,2),
    awp_kills INTEGER DEFAULT 0,
    entry_kills INTEGER DEFAULT 0,
    entry_deaths INTEGER DEFAULT 0,
    clutch_attempts INTEGER DEFAULT 0,
    clutch_wins INTEGER DEFAULT 0,
    
    -- Valorant specific
    aces INTEGER DEFAULT 0,
    first_bloods INTEGER DEFAULT 0,
    plants INTEGER DEFAULT 0,
    defuses INTEGER DEFAULT 0,
    ult_kills INTEGER DEFAULT 0,
    
    -- Derived fantasy points
    fantasy_points DECIMAL(8,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(scoring_period_id, player_id)
);

-- Fantasy matchups (head-to-head)
CREATE TABLE IF NOT EXISTS fantasy_matchups (
    id SERIAL PRIMARY KEY,
    league_id VARCHAR(50) NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    team_a_id VARCHAR(50) NOT NULL REFERENCES fantasy_teams(id),
    team_b_id VARCHAR(50) NOT NULL REFERENCES fantasy_teams(id),
    team_a_points DECIMAL(8,2) DEFAULT 0,
    team_b_points DECIMAL(8,2) DEFAULT 0,
    winner_id VARCHAR(50) REFERENCES fantasy_teams(id),
    is_tie BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waiver wire claims
CREATE TABLE IF NOT EXISTS fantasy_waiver_claims (
    id SERIAL PRIMARY KEY,
    league_id VARCHAR(50) NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    team_id VARCHAR(50) NOT NULL REFERENCES fantasy_teams(id),
    player_to_add VARCHAR(50) NOT NULL,
    player_to_drop VARCHAR(50),
    claim_priority INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'awarded', 'denied')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades between teams
CREATE TABLE IF NOT EXISTS fantasy_trades (
    id VARCHAR(50) PRIMARY KEY,
    league_id VARCHAR(50) NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
    proposing_team_id VARCHAR(50) NOT NULL REFERENCES fantasy_teams(id),
    receiving_team_id VARCHAR(50) NOT NULL REFERENCES fantasy_teams(id),
    proposed_players JSON, -- Array of player_ids
    received_players JSON, -- Array of player_ids
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

-- Fantasy transactions log
CREATE TABLE IF NOT EXISTS fantasy_transactions (
    id SERIAL PRIMARY KEY,
    league_id VARCHAR(50) NOT NULL REFERENCES fantasy_leagues(id),
    team_id VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('draft', 'add', 'drop', 'trade', 'waiver', 'activate', 'bench')),
    player_id VARCHAR(50),
    player_name VARCHAR(100),
    details JSON,
    week_number INTEGER,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default scoring rules
CREATE TABLE IF NOT EXISTS fantasy_scoring_defaults (
    id SERIAL PRIMARY KEY,
    game VARCHAR(20) CHECK (game IN ('valorant', 'cs2')),
    stat_category VARCHAR(50) NOT NULL,
    stat_name VARCHAR(50) NOT NULL,
    points_per_unit DECIMAL(5,2) NOT NULL,
    description TEXT,
    UNIQUE(game, stat_name)
);

-- Indexes
CREATE INDEX idx_fantasy_leagues_game ON fantasy_leagues(game);
CREATE INDEX idx_fantasy_leagues_type ON fantasy_leagues(league_type);
CREATE INDEX idx_fantasy_teams_league ON fantasy_teams(league_id);
CREATE INDEX idx_fantasy_teams_owner ON fantasy_teams(owner_id);
CREATE INDEX idx_fantasy_rosters_team ON fantasy_rosters(team_id);
CREATE INDEX idx_fantasy_rosters_player ON fantasy_rosters(player_id);
CREATE INDEX idx_fantasy_scores_period ON fantasy_player_scores(scoring_period_id);
CREATE INDEX idx_fantasy_scores_player ON fantasy_player_scores(player_id);
CREATE INDEX idx_fantasy_matchups_week ON fantasy_matchups(week_number);

-- Seed default scoring rules for Valorant
INSERT INTO fantasy_scoring_defaults (game, stat_category, stat_name, points_per_unit, description) VALUES
('valorant', 'combat', 'kill', 1.0, '1 point per kill'),
('valorant', 'combat', 'death', -0.5, '-0.5 points per death'),
('valorant', 'combat', 'assist', 0.5, '0.5 points per assist'),
('valorant', 'special', 'ace', 5.0, '5 bonus points for ace'),
('valorant', 'special', 'first_blood', 2.0, '2 points for first kill of round'),
('valorant', 'objective', 'plant', 1.0, '1 point for spike plant'),
('valorant', 'objective', 'defuse', 2.0, '2 points for spike defuse'),
('valorant', 'performance', 'match_win', 3.0, '3 bonus points for match win')
ON CONFLICT DO NOTHING;

-- Seed default scoring rules for CS2
INSERT INTO fantasy_scoring_defaults (game, stat_category, stat_name, points_per_unit, description) VALUES
('cs2', 'combat', 'kill', 1.0, '1 point per kill'),
('cs2', 'combat', 'death', -0.5, '-0.5 points per death'),
('cs2', 'combat', 'assist', 0.5, '0.5 points per assist'),
('cs2', 'combat', 'headshot', 0.5, '0.5 bonus points for headshot kill'),
('cs2', 'special', 'awp_kill', 1.5, '1.5 points for AWP kill'),
('cs2', 'special', 'entry_kill', 2.0, '2 points for opening kill'),
('cs2', 'special', 'clutch_win', 3.0, '3 points for winning clutch'),
('cs2', 'performance', 'match_win', 3.0, '3 bonus points for match win')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE fantasy_leagues IS 'Fantasy leagues for Valorant and CS2';
COMMENT ON TABLE fantasy_teams IS 'User fantasy teams/rosters';
COMMENT ON TABLE fantasy_rosters IS 'Individual roster spots with player assignments';
COMMENT ON TABLE fantasy_scoring_periods IS 'Weekly scoring periods';
COMMENT ON TABLE fantasy_player_scores IS 'Weekly player performance and fantasy points';
