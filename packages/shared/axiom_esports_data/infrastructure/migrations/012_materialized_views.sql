-- Migration 012: Materialized Views for ROTAS Analytics
-- Component B of TRINITY + OPERA Architecture
-- Provides pre-aggregated analytics for high-performance queries

-- =====================================================
-- 1. Enable pg_cron Extension for Automated Refreshes (if available)
-- =====================================================
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension not available, automated refresh schedules will not be created';
END $$;

-- =====================================================
-- 2. Add tournament_id Column to player_performance
-- For linking to OPERA tournament system
-- =====================================================
ALTER TABLE player_performance 
    ADD COLUMN IF NOT EXISTS tournament_id VARCHAR(100);

-- Create index for OPERA linkage queries
CREATE INDEX IF NOT EXISTS idx_player_performance_tournament_time 
    ON player_performance (tournament_id, realworld_time DESC);

COMMENT ON COLUMN player_performance.tournament_id IS 
    'Reference to OPERA tournament system for cross-platform analytics';

-- =====================================================
-- 3. Daily Player Stats Materialized View
-- 180-day rolling window of aggregated player statistics
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS mv_daily_player_stats CASCADE;

CREATE MATERIALIZED VIEW mv_daily_player_stats AS
SELECT 
    -- Primary identifiers
    player_id,
    name,
    DATE(realworld_time) AS stat_date,
    
    -- Match aggregation
    COUNT(DISTINCT match_id) AS matches_played,
    COUNT(DISTINCT map_name) AS maps_played,
    
    -- Core performance averages
    ROUND(AVG(COALESCE(acs, 0))::NUMERIC, 2) AS avg_acs,
    ROUND(AVG(COALESCE(adr, 0))::NUMERIC, 2) AS avg_adr,
    ROUND(AVG(COALESCE(kast_pct, 0))::NUMERIC, 2) AS avg_kast,
    
    -- KDR calculation with null safety
    ROUND(
        CASE 
            WHEN SUM(COALESCE(deaths, 0)) = 0 THEN SUM(COALESCE(kills, 0))::NUMERIC
            ELSE SUM(COALESCE(kills, 0))::NUMERIC / SUM(COALESCE(deaths, 0))::NUMERIC
        END, 
        2
    ) AS kdr,
    
    -- Totals
    SUM(COALESCE(kills, 0)) AS total_kills,
    SUM(COALESCE(deaths, 0)) AS total_deaths,
    SUM(COALESCE(first_blood, 0)) AS total_first_bloods,
    SUM(COALESCE(clutch_wins, 0)) AS total_clutch_wins,
    
    -- Advanced metrics
    ROUND(AVG(COALESCE(headshot_pct, 0))::NUMERIC, 2) AS avg_headshot_pct,
    ROUND(AVG(COALESCE(economy_rating, 0))::NUMERIC, 2) AS avg_economy_rating,
    ROUND(AVG(COALESCE(adjusted_kill_value, 0))::NUMERIC, 4) AS avg_adjusted_kill_value,
    ROUND(AVG(COALESCE(sim_rating, 0))::NUMERIC, 4) AS avg_sim_rating,
    ROUND(AVG(COALESCE(rar_score, 0))::NUMERIC, 4) AS avg_rar_score,
    
    -- Best performance tracking
    MAX(acs) AS peak_acs,
    MAX(kills) AS peak_kills,
    
    -- Agent diversity
    COUNT(DISTINCT agent) AS agents_used,
    MODE() WITHIN GROUP (ORDER BY agent) AS primary_agent,
    
    -- Context
    team,
    region,
    role,
    
    -- Metadata
    MAX(realworld_time) AS last_updated,
    COUNT(*) AS record_count

FROM player_performance
WHERE realworld_time >= NOW() - INTERVAL '180 days'
GROUP BY 
    player_id,
    name,
    DATE(realworld_time),
    team,
    region,
    role;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_daily_player_stats_pk 
    ON mv_daily_player_stats (player_id, stat_date);

-- Team and region indexes for filtering
CREATE INDEX idx_mv_daily_player_stats_team 
    ON mv_daily_player_stats (team, stat_date DESC) 
    WHERE team IS NOT NULL;

CREATE INDEX idx_mv_daily_player_stats_region 
    ON mv_daily_player_stats (region, stat_date DESC) 
    WHERE region IS NOT NULL;

CREATE INDEX idx_mv_daily_player_stats_date 
    ON mv_daily_player_stats (stat_date DESC);

CREATE INDEX idx_mv_daily_player_stats_rating 
    ON mv_daily_player_stats (avg_sim_rating DESC, stat_date DESC) 
    WHERE avg_sim_rating > 0;

COMMENT ON MATERIALIZED VIEW mv_daily_player_stats IS 
    'Daily aggregated player statistics for ROTAS Analytics - 180 day rolling window';

-- =====================================================
-- 4. Weekly Team Rankings Materialized View
-- Regional and global team rankings with RANK()
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS mv_weekly_team_rankings CASCADE;

CREATE MATERIALIZED VIEW mv_weekly_team_rankings AS
WITH weekly_stats AS (
    SELECT 
        team,
        region,
        DATE_TRUNC('week', realworld_time)::DATE AS week_start,
        
        -- Match results (win/loss inference from performance)
        COUNT(DISTINCT match_id) AS matches_played,
        
        -- Team aggregate stats
        ROUND(AVG(COALESCE(acs, 0))::NUMERIC, 2) AS team_avg_acs,
        ROUND(AVG(COALESCE(adr, 0))::NUMERIC, 2) AS team_avg_adr,
        ROUND(AVG(COALESCE(kast_pct, 0))::NUMERIC, 2) AS team_avg_kast,
        
        -- Collective KDR
        ROUND(
            CASE 
                WHEN SUM(COALESCE(deaths, 0)) = 0 THEN SUM(COALESCE(kills, 0))::NUMERIC
                ELSE SUM(COALESCE(kills, 0))::NUMERIC / SUM(COALESCE(deaths, 0))::NUMERIC
            END, 
            2
        ) AS team_kdr,
        
        -- Team totals
        SUM(COALESCE(kills, 0)) AS total_kills,
        SUM(COALESCE(deaths, 0)) AS total_deaths,
        SUM(COALESCE(first_blood, 0)) AS total_first_bloods,
        SUM(COALESCE(clutch_wins, 0)) AS total_clutch_wins,
        
        -- Roster size
        COUNT(DISTINCT player_id) AS roster_size,
        
        -- Best player (by ACS)
        MAX(acs) AS roster_peak_acs,
        
        -- SimRating aggregate
        ROUND(AVG(COALESCE(sim_rating, 0))::NUMERIC, 4) AS team_avg_sim_rating,
        
        -- Tournaments played
        COUNT(DISTINCT tournament) AS tournaments_count,
        COUNT(DISTINCT tournament_id) AS opera_linked_tournaments
        
    FROM player_performance
    WHERE team IS NOT NULL
      AND realworld_time >= NOW() - INTERVAL '365 days'
    GROUP BY 
        team,
        region,
        DATE_TRUNC('week', realworld_time)::DATE
)
SELECT 
    team,
    region,
    week_start,
    
    -- Match stats
    matches_played,
    
    -- Performance metrics
    team_avg_acs,
    team_avg_adr,
    team_avg_kast,
    team_kdr,
    total_kills,
    total_deaths,
    total_first_bloods,
    total_clutch_wins,
    
    -- Roster info
    roster_size,
    roster_peak_acs,
    team_avg_sim_rating,
    
    -- Tournament activity
    tournaments_count,
    opera_linked_tournaments,
    
    -- Regional ranking
    RANK() OVER (
        PARTITION BY region, week_start 
        ORDER BY team_avg_sim_rating DESC NULLS LAST
    ) AS regional_rank,
    
    -- Global ranking
    RANK() OVER (
        PARTITION BY week_start 
        ORDER BY team_avg_sim_rating DESC NULLS LAST
    ) AS global_rank,
    
    -- Performance tier (based on SimRating)
    CASE 
        WHEN team_avg_sim_rating >= 1.2 THEN 'S'
        WHEN team_avg_sim_rating >= 1.0 THEN 'A'
        WHEN team_avg_sim_rating >= 0.8 THEN 'B'
        WHEN team_avg_sim_rating >= 0.6 THEN 'C'
        ELSE 'D'
    END AS performance_tier,
    
    -- Last update
    NOW() AS last_updated

FROM weekly_stats;

-- Unique index for CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_weekly_team_rankings_pk 
    ON mv_weekly_team_rankings (team, week_start);

-- Ranking indexes
CREATE INDEX idx_mv_weekly_team_rankings_regional 
    ON mv_weekly_team_rankings (region, week_start DESC, regional_rank);

CREATE INDEX idx_mv_weekly_team_rankings_global 
    ON mv_weekly_team_rankings (week_start DESC, global_rank);

CREATE INDEX idx_mv_weekly_team_rankings_tier 
    ON mv_weekly_team_rankings (performance_tier, week_start DESC);

COMMENT ON MATERIALIZED VIEW mv_weekly_team_rankings IS 
    'Weekly team rankings with regional and global RANK() for ROTAS Analytics';

-- =====================================================
-- 5. Tournament Summaries Materialized View
-- OPERA-linked tournament-level aggregation
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS mv_tournament_summaries CASCADE;

CREATE MATERIALIZED VIEW mv_tournament_summaries AS
SELECT 
    -- Tournament identifiers
    COALESCE(tournament_id, tournament) AS tournament_key,
    tournament AS tournament_name,
    tournament_id AS opera_tournament_id,
    
    -- Date range
    MIN(realworld_time)::DATE AS start_date,
    MAX(realworld_time)::DATE AS end_date,
    
    -- Match/Map counts
    COUNT(DISTINCT match_id) AS total_matches,
    COUNT(DISTINCT map_name) AS total_maps,
    
    -- Player participation
    COUNT(DISTINCT player_id) AS unique_players,
    COUNT(DISTINCT team) AS unique_teams,
    
    -- Regional distribution
    COUNT(DISTINCT region) AS regions_represented,
    MODE() WITHIN GROUP (ORDER BY region) AS primary_region,
    
    -- Performance averages (tournament-wide)
    ROUND(AVG(COALESCE(acs, 0))::NUMERIC, 2) AS tournament_avg_acs,
    ROUND(AVG(COALESCE(adr, 0))::NUMERIC, 2) AS tournament_avg_adr,
    ROUND(AVG(COALESCE(kast_pct, 0))::NUMERIC, 2) AS tournament_avg_kast,
    
    -- Tournament KDR
    ROUND(
        CASE 
            WHEN SUM(COALESCE(deaths, 0)) = 0 THEN SUM(COALESCE(kills, 0))::NUMERIC
            ELSE SUM(COALESCE(kills, 0))::NUMERIC / SUM(COALESCE(deaths, 0))::NUMERIC
        END, 
        2
    ) AS tournament_kdr,
    
    -- Standout performances
    MAX(acs) AS tournament_record_acs,
    MAX(kills) AS tournament_record_kills,
    MAX(clutch_wins) AS tournament_record_clutches,
    
    -- Top performer (by ACS average)
    (
        SELECT name 
        FROM player_performance pp2 
        WHERE pp2.tournament = pp.tournament 
        GROUP BY name 
        ORDER BY AVG(acs) DESC 
        LIMIT 1
    ) AS mvp_candidate,
    
    -- Agent meta
    MODE() WITHIN GROUP (ORDER BY agent) AS most_played_agent,
    COUNT(DISTINCT agent) AS agent_diversity,
    
    -- Data quality
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE tournament_id IS NOT NULL) AS opera_linked_records,
    ROUND(
        COUNT(*) FILTER (WHERE tournament_id IS NOT NULL)::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) AS opera_linkage_pct,
    
    -- Status
    CASE 
        WHEN MAX(realworld_time) < NOW() - INTERVAL '7 days' THEN 'completed'
        WHEN MIN(realworld_time) > NOW() THEN 'upcoming'
        ELSE 'active'
    END AS tournament_status,
    
    -- Last update
    MAX(realworld_time) AS last_match_at,
    NOW() AS last_updated

FROM player_performance pp
WHERE tournament IS NOT NULL
GROUP BY 
    tournament,
    tournament_id;

-- Unique index for CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_tournament_summaries_pk 
    ON mv_tournament_summaries (tournament_key);

-- OPERA linkage index
CREATE INDEX idx_mv_tournament_summaries_opera 
    ON mv_tournament_summaries (opera_tournament_id) 
    WHERE opera_tournament_id IS NOT NULL;

-- Status and date indexes
CREATE INDEX idx_mv_tournament_summaries_status 
    ON mv_tournament_summaries (tournament_status, start_date DESC);

CREATE INDEX idx_mv_tournament_summaries_date 
    ON mv_tournament_summaries (start_date DESC, end_date);

COMMENT ON MATERIALIZED VIEW mv_tournament_summaries IS 
    'Tournament-level summaries linked to OPERA for cross-platform analytics';

-- =====================================================
-- 6. pg_cron Schedules for Automated Refresh (if available)
-- Using CONCURRENTLY to avoid locks
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Remove existing schedules if any (to avoid duplicates)
        PERFORM cron.unschedule('refresh-daily-stats');
        PERFORM cron.unschedule('refresh-weekly-rankings');
        PERFORM cron.unschedule('refresh-tournament-summaries');
        
        -- Schedule 1: Daily player stats refresh every 5 minutes
        PERFORM cron.schedule(
            'refresh-daily-stats',
            '*/5 * * * *',
            'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_player_stats'
        );
        
        -- Schedule 2: Weekly team rankings refresh every hour
        PERFORM cron.schedule(
            'refresh-weekly-rankings',
            '0 * * * *',
            'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_team_rankings'
        );
        
        -- Schedule 3: Tournament summaries refresh every 6 hours
        PERFORM cron.schedule(
            'refresh-tournament-summaries',
            '0 */6 * * *',
            'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tournament_summaries'
        );
        
        RAISE NOTICE 'pg_cron schedules created successfully';
    ELSE
        RAISE NOTICE 'pg_cron not available, automated refresh schedules not created';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create pg_cron schedules: %', SQLERRM;
END $$;

-- =====================================================
-- 7. Helper Function for Manual Refresh
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_rotas_analytics(
    p_view_name VARCHAR(50) DEFAULT 'all'
)
RETURNS TABLE (
    view_name VARCHAR(50),
    refreshed_at TIMESTAMPTZ,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_start TIMESTAMPTZ;
BEGIN
    -- Refresh daily stats
    IF p_view_name IN ('all', 'daily', 'mv_daily_player_stats') THEN
        v_start := clock_timestamp();
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_player_stats;
            RETURN QUERY SELECT 
                'mv_daily_player_stats'::VARCHAR(50),
                NOW(),
                TRUE,
                format('Refreshed in %s ms', 
                    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start))::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'mv_daily_player_stats'::VARCHAR(50),
                NOW(),
                FALSE,
                SQLERRM::TEXT;
        END;
    END IF;
    
    -- Refresh weekly rankings
    IF p_view_name IN ('all', 'weekly', 'mv_weekly_team_rankings') THEN
        v_start := clock_timestamp();
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_team_rankings;
            RETURN QUERY SELECT 
                'mv_weekly_team_rankings'::VARCHAR(50),
                NOW(),
                TRUE,
                format('Refreshed in %s ms', 
                    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start))::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'mv_weekly_team_rankings'::VARCHAR(50),
                NOW(),
                FALSE,
                SQLERRM::TEXT;
        END;
    END IF;
    
    -- Refresh tournament summaries
    IF p_view_name IN ('all', 'tournament', 'mv_tournament_summaries') THEN
        v_start := clock_timestamp();
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tournament_summaries;
            RETURN QUERY SELECT 
                'mv_tournament_summaries'::VARCHAR(50),
                NOW(),
                TRUE,
                format('Refreshed in %s ms', 
                    EXTRACT(MILLISECOND FROM clock_timestamp() - v_start))::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'mv_tournament_summaries'::VARCHAR(50),
                NOW(),
                FALSE,
                SQLERRM::TEXT;
        END;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_rotas_analytics IS 
    'Manually refresh ROTAS Analytics materialized views with CONCURRENTLY option';

-- =====================================================
-- 8. Comments and Documentation
-- =====================================================
-- Comment on pg_cron only if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        COMMENT ON EXTENSION pg_cron IS 'Job scheduler for automated materialized view refreshes';
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 012 complete: ROTAS Analytics Materialized Views installed';
    RAISE NOTICE '  - mv_daily_player_stats: 180-day rolling window, refreshed every 5 minutes';
    RAISE NOTICE '  - mv_weekly_team_rankings: Regional/global rankings, refreshed hourly';
    RAISE NOTICE '  - mv_tournament_summaries: OPERA-linked tournaments, refreshed every 6 hours';
    RAISE NOTICE '  - pg_cron schedules: (optional - requires pg_cron extension)';
END $$;
