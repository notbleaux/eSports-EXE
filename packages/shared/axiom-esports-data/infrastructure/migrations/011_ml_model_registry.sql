-- Migration 011: ML Model Registry Tables
-- Stores ML model metadata, versions, metrics, deployments, and A/B tests
-- [Ver001.000]

-- ============================================
-- ML MODELS TABLE
-- ============================================
-- Core table for ML model metadata and versioning
CREATE TABLE IF NOT EXISTS ml_models (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    version             VARCHAR(20) NOT NULL,
    type                VARCHAR(50) NOT NULL,  -- 'classification', 'regression', 'clustering', etc.
    status              VARCHAR(20) NOT NULL DEFAULT 'development',  -- 'development', 'staging', 'production', 'archived', 'deprecated'
    
    -- Model artifacts
    artifact_url        VARCHAR(500),  -- URL to model file (ONNX, TensorFlow, etc.)
    checksum_sha256     CHAR(64),      -- SHA256 hash of model file
    size_bytes          BIGINT,        -- Model file size in bytes
    
    -- Model configuration
    framework           VARCHAR(50),   -- 'onnx', 'tensorflow', 'pytorch', 'sklearn'
    quantization        VARCHAR(10) DEFAULT 'fp32',  -- 'fp32', 'fp16', 'int8', 'int16'
    input_shape         JSONB,         -- Input tensor shape
    output_shape        JSONB,         -- Output tensor shape
    
    -- Performance metrics (cached for quick access)
    accuracy            NUMERIC(6,4),  -- Primary accuracy metric (0.0000 to 1.0000)
    precision           NUMERIC(6,4),
    recall              NUMERIC(6,4),
    f1_score            NUMERIC(6,4),
    
    -- Resource metrics
    avg_latency_ms      NUMERIC(8,2),  -- Average inference latency
    p95_latency_ms      NUMERIC(8,2),  -- P95 inference latency
    memory_usage_mb     NUMERIC(8,2),  -- Peak memory usage
    
    -- Metadata
    description         TEXT,
    tags                TEXT[],        -- Array of tags for filtering
    hyperparameters     JSONB,         -- Model hyperparameters
    training_config     JSONB,         -- Training configuration
    
    -- Lineage
    parent_model_id     UUID REFERENCES ml_models(id) ON DELETE SET NULL,
    dataset_id          VARCHAR(100),  -- Reference to training dataset
    training_job_id     VARCHAR(100),  -- Reference to training job
    
    -- Timestamps
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    trained_at          TIMESTAMPTZ,   -- When model was trained
    
    -- Constraints
    CONSTRAINT uq_model_name_version UNIQUE (name, version),
    CONSTRAINT chk_status CHECK (status IN ('development', 'staging', 'production', 'archived', 'deprecated')),
    CONSTRAINT chk_quantization CHECK (quantization IN ('fp32', 'fp16', 'int8', 'int16'))
);

-- Indexes for ml_models
CREATE INDEX IF NOT EXISTS idx_ml_models_name ON ml_models(name);
CREATE INDEX IF NOT EXISTS idx_ml_models_status ON ml_models(status);
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(type);
CREATE INDEX IF NOT EXISTS idx_ml_models_created_at ON ml_models(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_models_parent ON ml_models(parent_model_id);

-- Full-text search on model name and description
CREATE INDEX IF NOT EXISTS idx_ml_models_search ON ml_models 
    USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- ============================================
-- MODEL METRICS TABLE
-- ============================================
-- Time-series metrics for models
CREATE TABLE IF NOT EXISTS model_metrics (
    id                  BIGSERIAL PRIMARY KEY,
    model_id            UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    
    -- Metric details
    metric_name         VARCHAR(50) NOT NULL,  -- 'accuracy', 'latency', 'throughput', 'memory', 'custom'
    metric_value        NUMERIC(12,6) NOT NULL,
    metric_unit         VARCHAR(20),           -- 'percent', 'ms', 'ops/sec', 'MB', 'count'
    
    -- Context
    environment         VARCHAR(20) DEFAULT 'production',  -- 'development', 'staging', 'production'
    context             JSONB,                 -- Additional context (batch size, input size, etc.)
    
    -- Timestamp
    recorded_at         TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_metric_name CHECK (metric_name IN ('accuracy', 'precision', 'recall', 'f1_score', 'latency', 'throughput', 'memory', 'error_rate', 'custom'))
);

-- Convert to hypertable for time-series data (if TimescaleDB available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('model_metrics', 'recorded_at',
            chunk_time_interval => INTERVAL '30 days',
            if_not_exists => TRUE);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB hypertable setup skipped: %', SQLERRM;
END $$;

-- Indexes for model_metrics
CREATE INDEX IF NOT EXISTS idx_model_metrics_model ON model_metrics(model_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_metrics_name ON model_metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_metrics_env ON model_metrics(environment);

-- ============================================
-- MODEL DEPLOYMENTS TABLE
-- ============================================
-- Track model deployments to different environments
CREATE TABLE IF NOT EXISTS model_deployments (
    id                  BIGSERIAL PRIMARY KEY,
    model_id            UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    
    -- Deployment details
    environment         VARCHAR(20) NOT NULL,  -- 'development', 'staging', 'production', 'edge'
    deployment_type     VARCHAR(20) DEFAULT 'full',  -- 'full', 'canary', 'shadow'
    
    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending', 'deploying', 'active', 'rolling_back', 'failed', 'retired'
    
    -- Traffic configuration
    traffic_percentage  NUMERIC(5,2) DEFAULT 100.00,  -- Percentage of traffic (for canary)
    
    -- Metadata
    deployed_by         VARCHAR(100),  -- User or system that deployed
    deployment_notes    TEXT,
    error_message       TEXT,          -- Error details if failed
    
    -- Endpoints
    endpoint_url        VARCHAR(500),  -- API endpoint for this deployment
    
    -- Timestamps
    deployed_at         TIMESTAMPTZ DEFAULT NOW(),
    retired_at          TIMESTAMPTZ,   -- When deployment was retired/rolled back
    
    CONSTRAINT chk_deployment_status CHECK (status IN ('pending', 'deploying', 'active', 'rolling_back', 'failed', 'retired')),
    CONSTRAINT chk_traffic_percentage CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100)
);

-- Indexes for model_deployments
CREATE INDEX IF NOT EXISTS idx_model_deployments_model ON model_deployments(model_id);
CREATE INDEX IF NOT EXISTS idx_model_deployments_env ON model_deployments(environment, status);
CREATE INDEX IF NOT EXISTS idx_model_deployments_status ON model_deployments(status);
CREATE INDEX IF NOT EXISTS idx_model_deployments_active ON model_deployments(environment, status) 
    WHERE status = 'active';

-- ============================================
-- A/B TESTS TABLE
-- ============================================
-- A/B testing between models
CREATE TABLE IF NOT EXISTS ab_tests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    
    -- Models being compared
    model_a_id          UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    model_b_id          UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    
    -- Traffic split
    model_a_traffic_pct NUMERIC(5,2) DEFAULT 50.00,
    model_b_traffic_pct NUMERIC(5,2) DEFAULT 50.00,
    
    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'draft',  -- 'draft', 'running', 'paused', 'completed', 'cancelled'
    
    -- Success criteria
    success_metric      VARCHAR(50) DEFAULT 'accuracy',  -- Metric to determine winner
    min_sample_size     INTEGER DEFAULT 1000,            -- Minimum samples before evaluation
    confidence_level    NUMERIC(4,3) DEFAULT 0.950,       -- Statistical confidence (0.95 = 95%)
    
    -- Winner
    winner_model_id     UUID REFERENCES ml_models(id) ON DELETE SET NULL,
    winner_reason       TEXT,
    
    -- Environment
    environment         VARCHAR(20) DEFAULT 'staging',  -- Where test runs
    
    -- Timestamps
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    started_at          TIMESTAMPTZ,
    ended_at            TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT chk_ab_test_status CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
    CONSTRAINT chk_ab_test_traffic CHECK (model_a_traffic_pct + model_b_traffic_pct = 100),
    CONSTRAINT chk_different_models CHECK (model_a_id != model_b_id)
);

-- Indexes for ab_tests
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_env ON ab_tests(environment, status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_models ON ab_tests(model_a_id, model_b_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_running ON ab_tests(status) WHERE status = 'running';

-- ============================================
-- A/B TEST RESULTS TABLE
-- ============================================
-- Aggregated results for A/B tests
CREATE TABLE IF NOT EXISTS ab_test_results (
    id                  BIGSERIAL PRIMARY KEY,
    test_id             UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    model_id            UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    
    -- Metrics
    metric_name         VARCHAR(50) NOT NULL,
    metric_value        NUMERIC(12,6) NOT NULL,
    sample_size         INTEGER NOT NULL,
    
    -- Statistics
    std_dev             NUMERIC(12,6),
    confidence_interval JSONB,         -- {lower: x, upper: y}
    p_value             NUMERIC(10,8), -- For significance testing
    
    -- Timestamp
    recorded_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable (if TimescaleDB available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('ab_test_results', 'recorded_at',
            chunk_time_interval => INTERVAL '30 days',
            if_not_exists => TRUE);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB hypertable setup skipped for ab_test_results: %', SQLERRM;
END $$;

-- Indexes for ab_test_results
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test ON ab_test_results(test_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_model ON ab_test_results(model_id);

-- ============================================
-- MODEL LINEAGE VIEW
-- ============================================
-- View to track model lineage/parent-child relationships
CREATE OR REPLACE VIEW model_lineage AS
WITH RECURSIVE lineage AS (
    -- Base case: models with no parent
    SELECT 
        id,
        name,
        version,
        parent_model_id,
        created_at,
        0 as generation,
        ARRAY[id] as path
    FROM ml_models
    WHERE parent_model_id IS NULL
    
    UNION ALL
    
    -- Recursive case: models with parents
    SELECT 
        m.id,
        m.name,
        m.version,
        m.parent_model_id,
        m.created_at,
        l.generation + 1,
        l.path || m.id
    FROM ml_models m
    INNER JOIN lineage l ON m.parent_model_id = l.id
)
SELECT * FROM lineage;

-- ============================================
-- ACTIVE DEPLOYMENTS VIEW
-- ============================================
-- View to get currently active deployments
CREATE OR REPLACE VIEW active_deployments AS
SELECT 
    d.*,
    m.name as model_name,
    m.version as model_version,
    m.accuracy as model_accuracy,
    m.avg_latency_ms as model_latency
FROM model_deployments d
JOIN ml_models m ON d.model_id = m.id
WHERE d.status = 'active';

-- ============================================
-- FUNCTION: Update model updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_model_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_model_timestamp
    BEFORE UPDATE ON ml_models
    FOR EACH ROW
    EXECUTE FUNCTION update_model_updated_at();

-- ============================================
-- FUNCTION: Get model metrics summary
-- ============================================
CREATE OR REPLACE FUNCTION get_model_metrics_summary(p_model_id UUID)
RETURNS TABLE (
    metric_name VARCHAR,
    latest_value NUMERIC,
    avg_value NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,
    sample_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mm.metric_name::VARCHAR,
        mm.metric_value as latest_value,
        AVG(mm.metric_value) as avg_value,
        MIN(mm.metric_value) as min_value,
        MAX(mm.metric_value) as max_value,
        COUNT(*) as sample_count
    FROM model_metrics mm
    WHERE mm.model_id = p_model_id
    GROUP BY mm.metric_name, mm.metric_value
    ORDER BY mm.metric_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE ml_models IS 'ML model registry - stores model metadata and versions';
COMMENT ON TABLE model_metrics IS 'Time-series metrics for ML models';
COMMENT ON TABLE model_deployments IS 'Model deployment history and current status';
COMMENT ON TABLE ab_tests IS 'A/B test configurations between models';
COMMENT ON TABLE ab_test_results IS 'Aggregated A/B test results';
