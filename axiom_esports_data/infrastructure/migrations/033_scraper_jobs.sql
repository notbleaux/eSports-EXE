-- Migration 033: Enhanced Scraper Job Queue + Monitoring
BEGIN;

-- Worker tracking
ALTER TABLE scraper_jobs ADD COLUMN IF NOT EXISTS worker_id VARCHAR(100);
ALTER TABLE scraper_jobs ADD COLUMN IF NOT EXISTS bytes_processed BIGINT DEFAULT 0;

-- Job metrics
CREATE TABLE IF NOT EXISTS scraper_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES scraper_jobs(id),
    metric_name VARCHAR(50),
    metric_value NUMERIC,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Priority queue function
CREATE OR REPLACE FUNCTION next_scraper_job() RETURNS TABLE (
    job_id UUID,
    source VARCHAR,
    priority INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    SELECT id, source, priority 
    FROM scraper_jobs 
    WHERE status = 'pending'
    ORDER BY priority ASC, scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
END;
$$;

-- Monitoring view
CREATE VIEW v_scraper_queue AS
SELECT 
    status,
    COUNT(*) as count,
    AVG(priority)::INTEGER as avg_priority,
    MIN(scheduled_at) as next_scheduled
FROM scraper_jobs 
GROUP BY status;

COMMIT;

