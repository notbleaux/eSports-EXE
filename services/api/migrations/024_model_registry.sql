-- Migration: Model Registry Schema
-- Version: 024
-- Purpose: MLflow-style model registry for ML model lifecycle management

-- Registered models (containers for versions)
CREATE TABLE IF NOT EXISTS registered_models (
    name VARCHAR(255) PRIMARY KEY,
    description TEXT,
    tags JSONB DEFAULT '{}',
    
    -- Current stage pointers
    latest_version INTEGER DEFAULT 0,
    production_version INTEGER,
    staging_version INTEGER,
    
    -- Metadata
    owner VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model versions
CREATE TABLE IF NOT EXISTS model_versions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL REFERENCES registered_models(name),
    version INTEGER NOT NULL,
    
    -- Source
    source_system VARCHAR(100), -- e.g., "training_pipeline"
    run_id VARCHAR(255), -- Training run ID
    
    -- Stage
    stage VARCHAR(20) DEFAULT 'None', -- 'None', 'Staging', 'Production', 'Archived'
    stage_updated_at TIMESTAMPTZ,
    
    -- Framework info
    framework VARCHAR(50) NOT NULL, -- 'tensorflow', 'pytorch', 'sklearn', 'onnx'
    framework_version VARCHAR(20),
    
    -- Artifacts
    artifact_uri TEXT, -- S3/MinIO path
    signature JSONB DEFAULT '{}', -- Input/output schema
    
    -- Description
    description TEXT,
    tags JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    
    UNIQUE(name, version)
);

CREATE INDEX IF NOT EXISTS idx_model_versions_name ON model_versions(name);
CREATE INDEX IF NOT EXISTS idx_model_versions_stage ON model_versions(stage);
CREATE INDEX IF NOT EXISTS idx_model_versions_created ON model_versions(created_at DESC);

-- Model metrics
CREATE TABLE IF NOT EXISTS model_metrics (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    model_version INTEGER NOT NULL,
    
    -- Dataset info
    dataset_name VARCHAR(255),
    dataset_version VARCHAR(50),
    
    -- Metrics (JSON for flexibility)
    metrics JSONB NOT NULL, -- e.g., {"accuracy": 0.95, "f1": 0.93}
    
    -- Training info
    training_duration_seconds DOUBLE PRECISION,
    epochs INTEGER,
    
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (model_name, model_version) REFERENCES model_versions(name, version)
);

CREATE INDEX IF NOT EXISTS idx_model_metrics_lookup ON model_metrics(model_name, model_version);
CREATE INDEX IF NOT EXISTS idx_model_metrics_computed ON model_metrics(computed_at DESC);

-- Model inference logs (for monitoring)
CREATE TABLE IF NOT EXISTS model_inference_logs (
    id BIGSERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    model_version INTEGER NOT NULL,
    
    -- Request
    request_id UUID NOT NULL,
    input_features JSONB,
    
    -- Response
    prediction JSONB,
    prediction_probability DOUBLE PRECISION,
    
    -- Latency
    inference_time_ms DOUBLE PRECISION,
    
    -- Context
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    source_ip INET
);

-- Convert to hypertable for time-series optimization
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('model_inference_logs', 'timestamp', 
            chunk_time_interval => INTERVAL '7 days',
            if_not_exists => TRUE
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB not available, using regular table';
END $$;

CREATE INDEX IF NOT EXISTS idx_model_inference_lookup 
    ON model_inference_logs(model_name, model_version, timestamp DESC);

-- Model stage transition history
CREATE TABLE IF NOT EXISTS model_stage_transitions (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    previous_stage VARCHAR(20),
    new_stage VARCHAR(20) NOT NULL,
    transitioned_by VARCHAR(100),
    approval_notes TEXT,
    transitioned_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (model_name, version) REFERENCES model_versions(name, version)
);

CREATE INDEX IF NOT EXISTS idx_model_transitions 
    ON model_stage_transitions(model_name, transitioned_at DESC);

-- Trigger to log stage transitions
CREATE OR REPLACE FUNCTION log_model_stage_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        INSERT INTO model_stage_transitions (
            model_name, version, previous_stage, new_stage, transitioned_at
        ) VALUES (
            NEW.name, NEW.version, OLD.stage, NEW.stage, NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_model_stage_transition
    AFTER UPDATE OF stage ON model_versions
    FOR EACH ROW
    EXECUTE FUNCTION log_model_stage_transition();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_model_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registered_models_updated
    BEFORE UPDATE ON registered_models
    FOR EACH ROW
    EXECUTE FUNCTION update_model_updated_at();

CREATE TRIGGER trigger_model_versions_updated
    BEFORE UPDATE ON model_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_model_updated_at();

-- Insert default SimRating model
INSERT INTO registered_models (name, description, owner, tags)
VALUES (
    'simrating_predictor',
    'SimRating v2 prediction model using player performance features',
    'system',
    '{"type": "regression", "domain": "esports"}'::jsonb
)
ON CONFLICT (name) DO NOTHING;
