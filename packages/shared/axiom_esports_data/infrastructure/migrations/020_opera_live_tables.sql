-- OPERA Live Events Tables
-- Real-time esports event streaming for OPERA hub
-- [Ver001.000]

-- ============================================
-- Live Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS opera_live_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    tournament VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('live', 'upcoming', 'finished')),
    thumbnail TEXT,
    viewers INTEGER DEFAULT 0,
    teams JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Source tracking
    data_source VARCHAR(50) DEFAULT 'pandascore',
    external_id VARCHAR(100),
    
    CONSTRAINT unique_external_id UNIQUE (data_source, external_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_opera_events_status ON opera_live_events(status);
CREATE INDEX IF NOT EXISTS idx_opera_events_tournament ON opera_live_events(tournament);
CREATE INDEX IF NOT EXISTS idx_opera_events_start_time ON opera_live_events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_opera_events_status_start ON opera_live_events(status, start_time DESC);

-- ============================================
-- Live Matches Table
-- ============================================
CREATE TABLE IF NOT EXISTS opera_live_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES opera_live_events(id) ON DELETE CASCADE,
    
    -- Team information (stored as JSON for flexibility)
    team_a JSONB NOT NULL DEFAULT '{}'::jsonb,
    team_b JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Match status
    status VARCHAR(20) NOT NULL CHECK (status IN ('live', 'upcoming', 'finished')),
    map VARCHAR(50),
    tournament VARCHAR(100) NOT NULL,
    
    -- Timing
    scheduled_start TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    eta VARCHAR(20),  -- "LIVE" or "1h 30m"
    
    -- Stream information
    stream_url TEXT,
    stream_platform VARCHAR(20),  -- 'twitch', 'youtube'
    viewers INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Source tracking
    data_source VARCHAR(50) DEFAULT 'pandascore',
    external_id VARCHAR(100),
    
    CONSTRAINT unique_match_external_id UNIQUE (data_source, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opera_matches_status ON opera_live_matches(status);
CREATE INDEX IF NOT EXISTS idx_opera_matches_tournament ON opera_live_matches(tournament);
CREATE INDEX IF NOT EXISTS idx_opera_matches_event ON opera_live_matches(event_id);
CREATE INDEX IF NOT EXISTS idx_opera_matches_status_tournament ON opera_live_matches(status, tournament);

-- ============================================
-- Chat Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS opera_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES opera_live_matches(id) ON DELETE CASCADE,
    
    -- User information
    user_name VARCHAR(100) NOT NULL,
    user_avatar TEXT,
    user_badge VARCHAR(20),  -- 'vip', 'mod', 'sub', 'founder', 'verified'
    
    -- Message content
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',  -- 'text', 'system', 'highlight'
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Moderation
    is_deleted BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    moderated_by UUID,
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- For guest users
    session_id VARCHAR(100),
    
    -- For authenticated users
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_badge CHECK (user_badge IN ('vip', 'mod', 'sub', 'founder', 'verified', NULL))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opera_chat_match ON opera_chat_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_opera_chat_timestamp ON opera_chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_opera_chat_match_time ON opera_chat_messages(match_id, timestamp DESC);

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_opera_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opera_events_updated_at
    BEFORE UPDATE ON opera_live_events
    FOR EACH ROW
    EXECUTE FUNCTION update_opera_updated_at();

CREATE TRIGGER opera_matches_updated_at
    BEFORE UPDATE ON opera_live_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_opera_updated_at();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE opera_live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE opera_live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE opera_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY opera_events_read ON opera_live_events
    FOR SELECT TO authenticated USING (true);

CREATE POLICY opera_matches_read ON opera_live_matches
    FOR SELECT TO authenticated USING (true);

CREATE POLICY opera_chat_read ON opera_chat_messages
    FOR SELECT TO authenticated USING (is_deleted = false);

-- Allow insert for chat messages (with rate limiting in application)
CREATE POLICY opera_chat_insert ON opera_chat_messages
    FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- Materialized View for Active Events
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_opera_active_events AS
SELECT 
    e.*,
    COUNT(m.id) as match_count,
    SUM(m.viewers) as total_viewers
FROM opera_live_events e
LEFT JOIN opera_live_matches m ON m.event_id = e.id
WHERE e.status IN ('live', 'upcoming')
GROUP BY e.id
ORDER BY e.start_time DESC;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_opera_active_events_id ON mv_opera_active_events(id);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE opera_live_events IS 'Live esports events for OPERA hub';
COMMENT ON TABLE opera_live_matches IS 'Live matches within events';
COMMENT ON TABLE opera_chat_messages IS 'Chat messages for live matches';

-- ============================================
-- Grant Permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE ON opera_live_events TO api_role;
GRANT SELECT, INSERT, UPDATE ON opera_live_matches TO api_role;
GRANT SELECT, INSERT ON opera_chat_messages TO api_role;

GRANT USAGE ON SEQUENCE opera_chat_messages_id_seq TO api_role;
