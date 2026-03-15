-- [Ver001.000]
-- VLR Enhancement Migration: Derived Metrics Support
-- ================================================
-- Adds columns and indexes for SimRating, RAR, and other calculated metrics

-- Add missing columns to player_performance (if not exists)
DO $$
BEGIN
    -- Economy metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='player_performance' AND column_name='economy_rating') THEN
        ALTER TABLE player_performance ADD COLUMN economy_rating NUMERIC(6,2);
        COMMENT ON COLUMN player_performance.economy_rating IS 'Damage efficiency per credit spent';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='player_performance' AND column_name='adjusted_kill_value') THEN
        ALTER TABLE player_performance ADD COLUMN adjusted_kill_value NUMERIC(8,4);
        COMMENT ON COLUMN player_performance.adjusted_kill_value IS 'Economy-context adjusted kills';
    END IF;

    -- Career metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='player_performance' AND column_name='career_stage') THEN
        ALTER TABLE player_performance ADD COLUMN career_stage VARCHAR(20);
        COMMENT ON COLUMN player_performance.career_stage IS 'rising, peak, or declining';
    END IF;

    -- Ensure role column exists for RAR calculation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='player_performance' AND column_name='role') THEN
        ALTER TABLE player_performance ADD COLUMN role VARCHAR(30);
        COMMENT ON COLUMN player_performance.role IS 'Combat role: Duelist, Controller, Initiator, Sentinel';
    END IF;

    -- Ensure region column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='player_performance' AND column_name='region') THEN
        ALTER TABLE player_performance ADD COLUMN region VARCHAR(20);
        COMMENT ON COLUMN player_performance.region IS 'Geographic region: Americas, EMEA, Pacific, China';
    END IF;
END $$;

-- Update existing records with inferred roles from agents
UPDATE player_performance
SET role = CASE LOWER(agent)
    -- Duelists
    WHEN 'jett' THEN 'Duelist'
    WHEN 'phoenix' THEN 'Duelist'
    WHEN 'reyna' THEN 'Duelist'
    WHEN 'raze' THEN 'Duelist'
    WHEN 'yoru' THEN 'Duelist'
    WHEN 'neon' THEN 'Duelist'
    WHEN 'iso' THEN 'Duelist'
    WHEN 'waylay' THEN 'Duelist'
    -- Sentinels
    WHEN 'sage' THEN 'Sentinel'
    WHEN 'cypher' THEN 'Sentinel'
    WHEN 'killjoy' THEN 'Sentinel'
    WHEN 'chamber' THEN 'Sentinel'
    WHEN 'deadlock' THEN 'Sentinel'
    WHEN 'vyse' THEN 'Sentinel'
    -- Controllers
    WHEN 'brimstone' THEN 'Controller'
    WHEN 'omen' THEN 'Controller'
    WHEN 'viper' THEN 'Controller'
    WHEN 'astra' THEN 'Controller'
    WHEN 'harbor' THEN 'Controller'
    WHEN 'clove' THEN 'Controller'
    -- Initiators
    WHEN 'sova' THEN 'Initiator'
    WHEN 'breach' THEN 'Initiator'
    WHEN 'skye' THEN 'Initiator'
    WHEN 'kayo' THEN 'Initiator'
    WHEN 'fade' THEN 'Initiator'
    WHEN 'gekko' THEN 'Initiator'
    WHEN 'tejo' THEN 'Initiator'
    ELSE role
END
WHERE role IS NULL AND agent IS NOT NULL;

-- Update existing records with inferred regions from teams
UPDATE player_performance
SET region = CASE 
    -- Americas
    WHEN team IN ('SEN', 'NRG', 'C9', '100T', 'EG', 'LOUD', 'FUR', 'MIBR', 'LEV', 'KRU', 'G2', 
                  'Sentinels', 'NRG Esports', 'Cloud9', '100 Thieves', 'Evil Geniuses', 
                  'FURIA', 'Leviatán', 'KRÜ Esports') THEN 'Americas'
    -- EMEA
    WHEN team IN ('FNC', 'NAVI', 'VIT', 'TL', 'KC', 'BBL', 'FUT', 'TH', 'GX', 'M8', 'APK',
                  'Fnatic', 'Natus Vincere', 'Team Vitality', 'Team Liquid', 
                  'Karmine Corp', 'Team Heretics', 'Gentle Mates', 'Apeks') THEN 'EMEA'
    -- Pacific
    WHEN team IN ('PRX', 'DRX', 'T1', 'GEN', 'TS', 'RRQ', 'TLN', 'ZETA', 'DFM', 'GE', 'BLD',
                  'Paper Rex', 'Team Secret', 'Rex Regum Qeon', 'Talon Esports',
                  'ZETA DIVISION', 'DetonatioN FocusMe', 'Global Esports', 'Bleed Esports') THEN 'Pacific'
    -- China
    WHEN team IN ('EDG', 'FPX', 'BLG', 'TE', 'DRG', 'AG', 'JDG', 'WOL', 'TYL', 'TEC', 'XLG',
                  'EDward Gaming', 'FunPlus Phoenix', 'Bilibili Gaming', 
                  'Trace Esports', 'Dragon Ranger Gaming', 'All Gamers',
                  'JD Gaming', 'Wolves Esports', 'TYLOO', 'Titan Esports Club') THEN 'China'
    ELSE region
END
WHERE region IS NULL AND team IS NOT NULL;

-- Create materialized view for top players by SimRating
DROP MATERIALIZED VIEW IF EXISTS mv_top_players_simrating;

CREATE MATERIALIZED VIEW mv_top_players_simrating AS
SELECT 
    player_id,
    name,
    team,
    region,
    role,
    AVG(acs) as avg_acs,
    AVG(adr) as avg_adr,
    AVG(kast_pct) as avg_kast,
    AVG(headshot_pct) as avg_hs_pct,
    AVG(sim_rating) as avg_sim_rating,
    AVG(rar_score) as avg_rar,
    MODE() WITHIN GROUP (ORDER BY investment_grade) as investment_grade,
    COUNT(*) as matches_played,
    MAX(realworld_time) as last_match_date
FROM player_performance
WHERE sim_rating IS NOT NULL OR acs IS NOT NULL
GROUP BY player_id, name, team, region, role
HAVING COUNT(*) >= 10
ORDER BY avg_sim_rating DESC NULLS LAST;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_mv_top_simrating_player ON mv_top_players_simrating(player_id);
CREATE INDEX idx_mv_top_simrating_rating ON mv_top_players_simrating(avg_sim_rating DESC);
CREATE INDEX idx_mv_top_simrating_region ON mv_top_players_simrating(region);
CREATE INDEX idx_mv_top_simrating_role ON mv_top_players_simrating(role);

-- Create materialized view for RAR leaders
DROP MATERIALIZED VIEW IF EXISTS mv_top_players_rar;

CREATE MATERIALIZED VIEW mv_top_players_rar AS
SELECT 
    player_id,
    name,
    team,
    region,
    role,
    AVG(rar_score) as avg_rar,
    AVG(role_adjusted_value) as avg_rav,
    AVG(replacement_level) as avg_rl,
    MODE() WITHIN GROUP (ORDER BY investment_grade) as investment_grade,
    COUNT(*) as matches_played
FROM player_performance
WHERE rar_score IS NOT NULL
GROUP BY player_id, name, team, region, role
HAVING COUNT(*) >= 10
ORDER BY avg_rar DESC NULLS LAST;

CREATE UNIQUE INDEX idx_mv_top_rar_player ON mv_top_players_rar(player_id);
CREATE INDEX idx_mv_top_rar_score ON mv_top_players_rar(avg_rar DESC);

-- Function to refresh materialized views (for cron/job scheduling)
CREATE OR REPLACE FUNCTION refresh_sator_leaderboards()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_players_simrating;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_players_rar;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON MATERIALIZED VIEW mv_top_players_simrating IS 
    'Top players ranked by SimRating. Refresh with: SELECT refresh_sator_leaderboards();';

COMMENT ON MATERIALIZED VIEW mv_top_players_rar IS 
    'Top players ranked by Role Adjusted Rating. Refresh with: SELECT refresh_sator_leaderboards();';

-- Stats
SELECT 'Migration 019 complete' as status,
       COUNT(*) as total_records,
       COUNT(sim_rating) as with_simrating,
       COUNT(rar_score) as with_rar,
       COUNT(role) as with_role,
       COUNT(region) as with_region
FROM player_performance;
