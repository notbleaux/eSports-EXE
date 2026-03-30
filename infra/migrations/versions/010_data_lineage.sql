-- Data Lineage Schema
-- Phase 2: Data Provenance & Lineage Tracking
-- [Part: 1/1, Phase: 2/5, Progress: 100%, Status: Complete]

-- Core lineage table - every data point has full provenance
CREATE TABLE data_lineage (
    -- Primary identification
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,      -- 'match', 'player', 'prediction', 'simulation'
    entity_id UUID NOT NULL,
    
    -- Source tracking
    source_system VARCHAR(100) NOT NULL,   -- 'pandascore', 'riot_api', 'simulation', 'manual'
    source_version VARCHAR(20),            -- API version
    source_event_id VARCHAR(100),          -- Original event ID from source
    source_timestamp TIMESTAMPTZ NOT NULL, -- When event occurred at source
    
    -- Ingestion tracking
    ingestion_id UUID NOT NULL,            -- Batch/job ID for grouping
    ingestion_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ingestion_method VARCHAR(50) NOT NULL, -- 'webhook', 'api_poll', 'cdc', 'manual_entry'
    ingestion_endpoint VARCHAR(200),       -- API endpoint or webhook URL
    
    -- Validation & quality
    schema_version VARCHAR(20) NOT NULL,   -- Schema version at ingestion
    validation_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'passed', 'warning', 'failed'
    validation_errors JSONB,               -- Array of validation error details
    validation_timestamp TIMESTAMPTZ,      -- When validation occurred
    
    -- Confidence scoring
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 1.00, -- 0.00-1.00
    confidence_factors JSONB,              -- Why this confidence level
    
    -- Integrity
    data_checksum VARCHAR(64) NOT NULL,    -- SHA-256 of canonical data representation
    raw_data_checksum VARCHAR(64),         -- SHA-256 of raw source data
    
    -- Transformation lineage
    parent_uuids UUID[],                   -- Upstream dependencies
    transformation_logic TEXT,             -- SQL/code used for transformation
    transformation_version VARCHAR(20),    -- Version of transformation logic
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    CONSTRAINT valid_validation_status CHECK (validation_status IN ('pending', 'passed', 'warning', 'failed'))
);

-- Indexes for common queries
CREATE INDEX idx_lineage_entity ON data_lineage(entity_type, entity_id);
CREATE INDEX idx_lineage_source ON data_lineage(source_system, source_timestamp);
CREATE INDEX idx_lineage_ingestion ON data_lineage(ingestion_id);
CREATE INDEX idx_lineage_validation ON data_lineage(validation_status);
CREATE INDEX idx_lineage_confidence ON data_lineage(confidence_score) WHERE confidence_score < 1.00;

-- GIN index for JSONB arrays
CREATE INDEX idx_lineage_parents ON data_lineage USING GIN(parent_uuids);

-- Hypertable for time-series data
SELECT create_hypertable('data_lineage', 'ingestion_timestamp', 
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Source system registry
CREATE TABLE source_systems (
    system_name VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(200) NOT NULL,
    system_type VARCHAR(50) NOT NULL,      -- 'api', 'webhook', 'cdc', 'manual'
    base_url VARCHAR(500),
    api_version VARCHAR(20),
    is_official BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    reliability_score DECIMAL(3,2) DEFAULT 1.00,
    rate_limit_requests_per_minute INTEGER,
    documentation_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert known sources
INSERT INTO source_systems (system_name, display_name, system_type, is_official, reliability_score) VALUES
    ('pandascore', 'Pandascore API', 'api', TRUE, 0.99),
    ('riot_api', 'Riot Games API', 'api', TRUE, 0.98),
    ('simulation', 'ROTAS Simulation Engine', 'internal', TRUE, 0.95),
    ('manual_entry', 'Manual Data Entry', 'manual', TRUE, 0.80),
    ('vlr_scraper', 'VLR.gg Scraper (DEPRECATED)', 'scraper', FALSE, 0.60);

-- Validation rules registry
CREATE TABLE validation_rules (
    rule_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_description TEXT,
    rule_logic TEXT NOT NULL,              -- SQL or Python code
    severity VARCHAR(20) NOT NULL DEFAULT 'error', -- 'error', 'warning', 'info'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(entity_type, rule_name)
);

-- Insert default validation rules
INSERT INTO validation_rules (entity_type, rule_name, rule_description, rule_logic, severity) VALUES
    ('match', 'valid_scores', 'Match scores must be non-negative and winner has >= 13', 
     'team_a_score >= 0 AND team_b_score >= 0 AND (winner_id IS NULL OR GREATEST(team_a_score, team_b_score) >= 13)', 
     'error'),
    ('player', 'valid_combat_score', 'Combat score should be between 0 and 1000',
     'combat_score >= 0 AND combat_score <= 1000',
     'warning'),
    ('match', 'valid_duration', 'Match duration should be 5-90 minutes',
     'duration_seconds BETWEEN 300 AND 5400',
     'warning');

-- Multi-source validation log
CREATE TABLE cross_validation_log (
    log_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Source comparisons
    source_a VARCHAR(100) NOT NULL,
    source_b VARCHAR(100) NOT NULL,
    
    -- Data from each source
    data_a JSONB NOT NULL,
    data_b JSONB NOT NULL,
    
    -- Comparison results
    fields_compared TEXT[] NOT NULL,
    mismatched_fields TEXT[],
    discrepancy_score DECIMAL(3,2),        -- 0.00 = perfect match, 1.00 = complete mismatch
    
    -- Resolution
    resolved BOOLEAN DEFAULT FALSE,
    resolution_method VARCHAR(50),         -- 'source_priority', 'weighted_average', 'manual'
    final_data JSONB,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crossval_entity ON cross_validation_log(entity_type, entity_id);
CREATE INDEX idx_crossval_unresolved ON cross_validation_log(resolved) WHERE resolved = FALSE;

-- Convert to hypertable
SELECT create_hypertable('cross_validation_log', 'created_at',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Functions for lineage tracking

-- Function to create lineage record
CREATE OR REPLACE FUNCTION create_lineage_record(
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_source_system VARCHAR,
    p_source_event_id VARCHAR,
    p_source_timestamp TIMESTAMPTZ,
    p_data JSONB,
    p_parent_uuids UUID[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_uuid UUID;
    v_checksum VARCHAR(64);
BEGIN
    -- Calculate checksum
    v_checksum := encode(digest(p_data::text, 'sha256'), 'hex');
    
    -- Insert lineage record
    INSERT INTO data_lineage (
        entity_type, entity_id, source_system, source_event_id,
        source_timestamp, ingestion_id, ingestion_method,
        data_checksum, parent_uuids
    ) VALUES (
        p_entity_type, p_entity_id, p_source_system, p_source_event_id,
        p_source_timestamp, gen_random_uuid(), 'api_webhook',
        v_checksum, p_parent_uuids
    ) RETURNING uuid INTO v_uuid;
    
    RETURN v_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get lineage tree
CREATE OR REPLACE FUNCTION get_lineage_tree(p_uuid UUID)
RETURNS TABLE (
    level INTEGER,
    uuid UUID,
    entity_type VARCHAR,
    entity_id UUID,
    source_system VARCHAR,
    ingestion_timestamp TIMESTAMPTZ
) AS $$
WITH RECURSIVE lineage_tree AS (
    -- Base case
    SELECT 
        0 AS level,
        dl.uuid,
        dl.entity_type,
        dl.entity_id,
        dl.source_system,
        dl.ingestion_timestamp,
        dl.parent_uuids
    FROM data_lineage dl
    WHERE dl.uuid = p_uuid
    
    UNION ALL
    
    -- Recursive case - parents
    SELECT 
        lt.level + 1,
        parent.uuid,
        parent.entity_type,
        parent.entity_id,
        parent.source_system,
        parent.ingestion_timestamp,
        parent.parent_uuids
    FROM lineage_tree lt
    CROSS JOIN LATERAL unnest(lt.parent_uuids) AS parent_uuid
    JOIN data_lineage parent ON parent.uuid = parent_uuid
    WHERE lt.level < 10  -- Prevent infinite recursion
)
SELECT level, uuid, entity_type, entity_id, source_system, ingestion_timestamp
FROM lineage_tree
ORDER BY level, ingestion_timestamp;
$$ LANGUAGE sql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_lineage_updated_at
    BEFORE UPDATE ON data_lineage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_systems_updated_at
    BEFORE UPDATE ON source_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validation_rules_updated_at
    BEFORE UPDATE ON validation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
