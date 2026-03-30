-- Migration: Feature Store Schema
-- Version: 023
-- Purpose: Tecton-style feature store with online/offline separation

-- Feature definitions registry
CREATE TABLE IF NOT EXISTS feature_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    entity_type VARCHAR(50) NOT NULL, -- 'player', 'team', 'match'
    feature_type VARCHAR(50) NOT NULL, -- 'numeric', 'categorical', 'boolean', 'vector'
    store_type VARCHAR(20) NOT NULL DEFAULT 'both', -- 'online', 'offline', 'both'
    ttl_seconds INTEGER,
    description TEXT,
    tags JSONB DEFAULT '[]',
    nullability BOOLEAN DEFAULT FALSE,
    default_value JSONB,
    validation_rules JSONB DEFAULT '{}',
    owner VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(name, version)
);

-- Index for feature lookup
CREATE INDEX IF NOT EXISTS idx_feature_defs_name ON feature_definitions(name);
CREATE INDEX IF NOT EXISTS idx_feature_defs_entity ON feature_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_feature_defs_tags ON feature_definitions USING GIN(tags);

-- Feature views (collections of features)
CREATE TABLE IF NOT EXISTS feature_views (
    name VARCHAR(255) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    features JSONB NOT NULL, -- Array of feature names
    materialize_online BOOLEAN DEFAULT TRUE,
    materialize_offline BOOLEAN DEFAULT TRUE,
    refresh_interval_minutes INTEGER DEFAULT 60,
    lookback_window_days INTEGER DEFAULT 30,
    description TEXT,
    owner VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature values (offline store)
CREATE TABLE IF NOT EXISTS feature_values (
    id BIGSERIAL PRIMARY KEY,
    feature_name VARCHAR(255) NOT NULL,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    value JSONB NOT NULL,
    value_type VARCHAR(50) NOT NULL,
    feature_definition_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    
    -- Timestamps
    computed_at TIMESTAMPTZ NOT NULL,
    event_timestamp TIMESTAMPTZ,
    ingestion_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Source tracking
    source_system VARCHAR(100),
    source_id VARCHAR(255),
    
    -- Quality
    is_valid BOOLEAN DEFAULT TRUE,
    validation_errors JSONB DEFAULT '[]',
    
    -- Create hypertable for time-series optimization
    CONSTRAINT feature_values_unique UNIQUE (feature_name, entity_id, computed_at)
);

-- Convert to hypertable (if TimescaleDB is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('feature_values', 'computed_at', 
            chunk_time_interval => INTERVAL '1 day',
            if_not_exists => TRUE
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB not available, using regular table';
END $$;

-- Indexes for feature values
CREATE INDEX IF NOT EXISTS idx_feature_values_lookup 
    ON feature_values(feature_name, entity_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_values_entity 
    ON feature_values(entity_type, entity_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_values_time 
    ON feature_values(computed_at DESC);

-- Feature statistics for monitoring/drift detection
CREATE TABLE IF NOT EXISTS feature_statistics (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    
    -- Statistics
    count INTEGER NOT NULL,
    null_count INTEGER DEFAULT 0,
    mean DOUBLE PRECISION,
    std DOUBLE PRECISION,
    min DOUBLE PRECISION,
    max DOUBLE PRECISION,
    
    -- Drift detection
    drift_score DOUBLE PRECISION,
    is_drifted BOOLEAN DEFAULT FALSE,
    
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(feature_name, entity_type, window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_feature_stats_lookup 
    ON feature_statistics(feature_name, entity_type, window_end DESC);

-- Feature materialization jobs tracking
CREATE TABLE IF NOT EXISTS feature_materialization_jobs (
    id SERIAL PRIMARY KEY,
    feature_view_name VARCHAR(255) NOT NULL REFERENCES feature_views(name),
    job_type VARCHAR(50) NOT NULL, -- 'online', 'offline', 'backfill'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    
    -- Time range
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    -- Progress
    entities_processed INTEGER DEFAULT 0,
    entities_total INTEGER,
    features_written INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_jobs_view 
    ON feature_materialization_jobs(feature_view_name, status);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_feature_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_feature_defs_updated
    BEFORE UPDATE ON feature_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_updated_at();

CREATE TRIGGER trigger_feature_views_updated
    BEFORE UPDATE ON feature_views
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_updated_at();

-- Insert default feature definitions for SimRating
INSERT INTO feature_definitions (
    name, version, entity_type, feature_type, store_type, 
    description, tags, owner
) VALUES 
    ('kd_ratio', '1.0.0', 'player', 'numeric', 'both',
     'Kill/death ratio', '["combat", "performance"]', 'system'),
    ('acs_per_round', '1.0.0', 'player', 'numeric', 'both',
     'Average combat score per round', '["performance"]', 'system'),
     ('headshot_percentage', '1.0.0', 'player', 'numeric', 'both',
     'Percentage of kills that are headshots', '["accuracy"]', 'system'),
    ('first_blood_rate', '1.0.0', 'player', 'numeric', 'both',
     'Rate of getting first kill in rounds', '["aggression"]', 'system'),
    ('clutch_success_rate', '1.0.0', 'player', 'numeric', 'both',
     'Success rate in 1vX situations', '["pressure"]', 'system')
ON CONFLICT (name, version) DO NOTHING;

-- Create feature view for SimRating v2
INSERT INTO feature_views (
    name, entity_type, features, materialize_online, materialize_offline,
    refresh_interval_minutes, lookback_window_days, description, owner
) VALUES (
    'simrating_v2_features',
    'player',
    '["kd_ratio", "acs_per_round", "headshot_percentage", "first_blood_rate", "clutch_success_rate"]',
    TRUE,
    TRUE,
    60,
    90,
    'Core features for SimRating v2 calculation',
    'system'
)
ON CONFLICT (name) DO NOTHING;
