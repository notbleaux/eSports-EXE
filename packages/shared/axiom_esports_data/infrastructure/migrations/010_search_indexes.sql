-- Migration 010: Search Indexes for Full-Text Search
-- Adds PostgreSQL full-text search capabilities for players, teams, and matches
-- [Ver001.000]

-- ============================================
-- EXTENSION SETUP
-- ============================================

-- Enable pg_trgm for trigram-based pattern matching (fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- PLAYERS TABLE SEARCH INDEXES
-- ============================================

-- Add search vector column for players table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE players ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create index on search vector
CREATE INDEX IF NOT EXISTS idx_players_search_vector ON players USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_players_name_trgm ON players USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_players_real_name_trgm ON players USING GIN(real_name gin_trgm_ops);

-- ============================================
-- TEAMS TABLE SEARCH INDEXES
-- ============================================

-- Add search vector column for teams table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE teams ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create index on search vector
CREATE INDEX IF NOT EXISTS idx_teams_search_vector ON teams USING GIN(search_vector);

-- Create trigram index for team name fuzzy matching
CREATE INDEX IF NOT EXISTS idx_teams_name_trgm ON teams USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_teams_tag_trgm ON teams USING GIN(tag gin_trgm_ops);

-- ============================================
-- MATCHES TABLE SEARCH INDEXES
-- ============================================

-- Add search vector column for matches table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matches' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE matches ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create index on search vector
CREATE INDEX IF NOT EXISTS idx_matches_search_vector ON matches USING GIN(search_vector);

-- Create trigram index for team names in matches
CREATE INDEX IF NOT EXISTS idx_matches_team_a_trgm ON matches USING GIN(team_a_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_matches_team_b_trgm ON matches USING GIN(team_b_name gin_trgm_ops);

-- ============================================
-- PLAYER_PERFORMANCE SEARCH INDEXES (for match context)
-- ============================================

-- Trigram indexes for player name searches in performance records
CREATE INDEX IF NOT EXISTS idx_player_performance_name_trgm ON player_performance USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_player_performance_team_trgm ON player_performance USING GIN(team gin_trgm_ops);

-- ============================================
-- SEARCH VECTOR UPDATE FUNCTIONS
-- ============================================

-- Function to update player search vector
CREATE OR REPLACE FUNCTION update_player_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.real_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.nationality, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_update_player_search_vector ON players;

-- Create trigger for automatic search vector update
CREATE TRIGGER trigger_update_player_search_vector
    BEFORE INSERT OR UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_player_search_vector();

-- Function to update team search vector
CREATE OR REPLACE FUNCTION update_team_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.tag, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.region, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_team_search_vector ON teams;

-- Create trigger for team search vector
CREATE TRIGGER trigger_update_team_search_vector
    BEFORE INSERT OR UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_team_search_vector();

-- Function to update match search vector
-- Note: Uses team names since tournament name requires JOIN
CREATE OR REPLACE FUNCTION update_match_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.team_a_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.team_b_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.region, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_match_search_vector ON matches;

-- Create trigger for match search vector
CREATE TRIGGER trigger_update_match_search_vector
    BEFORE INSERT OR UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_match_search_vector();

-- ============================================
-- INITIAL POPULATION OF SEARCH VECTORS
-- ============================================

-- Update existing player records
UPDATE players SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(real_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(nationality, '')), 'C')
WHERE search_vector IS NULL;

-- Update existing team records
UPDATE teams SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(tag, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(region, '')), 'C')
WHERE search_vector IS NULL;

-- Update existing match records  
UPDATE matches SET search_vector = 
    setweight(to_tsvector('english', COALESCE(team_a_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(team_b_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(region, '')), 'B')
WHERE search_vector IS NULL;

-- ============================================
-- SEARCH STATISTICS TABLE (for query optimization)
-- ============================================

CREATE TABLE IF NOT EXISTS search_statistics (
    stat_id             BIGSERIAL PRIMARY KEY,
    query_hash          VARCHAR(64) NOT NULL,
    query_text          VARCHAR(255) NOT NULL,
    result_count        INTEGER NOT NULL,
    execution_ms        INTEGER NOT NULL,
    search_type         VARCHAR(20) NOT NULL CHECK (search_type IN ('players', 'teams', 'matches', 'all')),
    performed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_ip_hash      VARCHAR(64)  -- Hashed IP for rate limiting analysis
);

-- Index for query pattern analysis
CREATE INDEX IF NOT EXISTS idx_search_stats_query_hash ON search_statistics(query_hash);
CREATE INDEX IF NOT EXISTS idx_search_stats_performed_at ON search_statistics(performed_at);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON EXTENSION pg_trgm IS 'Support for similarity of text using trigram matching';
COMMENT ON TABLE search_statistics IS 'Tracks search query performance and patterns for optimization';
