-- Migration: Data Lineage Schema
-- Version: 022
-- Purpose: Track data provenance, confidence scoring, and multi-source validation

-- Source systems registry
CREATE TABLE IF NOT EXISTS source_systems (
    system_name VARCHAR(50) PRIMARY KEY,
    system_type VARCHAR(20) NOT NULL CHECK (system_type IN ('official_api', 'scraped', 'simulated', 'manual')),
    is_active BOOLEAN DEFAULT TRUE,
    deprecation_date DATE,
    confidence_baseline DECIMAL(3,2) DEFAULT 0.85,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert known source systems
INSERT INTO source_systems (system_name, system_type, is_active, deprecation_date, confidence_baseline) VALUES
    ('pandascore', 'official_api', TRUE, NULL, 0.95),
    ('vlr_gg', 'scraped', TRUE, '2026-06-01', 0.75),
    ('manual_entry', 'manual', TRUE, NULL, 0.60),
    ('rotas_simulation', 'simulated', TRUE, NULL, 0.90),
    ('riot_api', 'official_api', TRUE, NULL, 0.98)
ON CONFLICT (system_name) DO NOTHING;

-- Data lineage tracking table
CREATE TABLE IF NOT EXISTS data_lineage (
    lineage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system VARCHAR(50) NOT NULL REFERENCES source_systems(system_name),
    external_id VARCHAR(255),
    entity_type VARCHAR(50) NOT NULL, -- 'player', 'match', 'team', 'stats'
    entity_id UUID,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0.00 AND 1.00),
    checksum VARCHAR(64) NOT NULL, -- SHA-256 of canonical JSON representation
    parent_lineage_id UUID REFERENCES data_lineage(lineage_id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation rules for data quality
CREATE TABLE IF NOT EXISTS validation_rules (
    rule_id SERIAL PRIMARY KEY,
    source_system VARCHAR(50) NOT NULL REFERENCES source_systems(system_name),
    entity_type VARCHAR(50) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('range', 'presence', 'uniqueness', 'format', 'custom')),
    parameters JSONB NOT NULL, -- rule-specific parameters
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_system, entity_type, rule_name)
);

-- Cross-validation log for multi-source reconciliation
CREATE TABLE IF NOT EXISTS cross_validation_log (
    validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    source_1 VARCHAR(50) NOT NULL REFERENCES source_systems(system_name),
    source_2 VARCHAR(50) NOT NULL REFERENCES source_systems(system_name),
    source_1_lineage_id UUID REFERENCES data_lineage(lineage_id),
    source_2_lineage_id UUID REFERENCES data_lineage(lineage_id),
    agreement_score DECIMAL(3,2) CHECK (agreement_score BETWEEN 0.00 AND 1.00),
    conflicts JSONB DEFAULT '[]', -- array of conflicting field names
    resolution VARCHAR(20) CHECK (resolution IN ('source_1', 'source_2', 'average', 'manual', 'pending')),
    resolved_by UUID, -- user ID if manually resolved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_lineage_source ON data_lineage(source_system);
CREATE INDEX IF NOT EXISTS idx_data_lineage_entity ON data_lineage(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_data_lineage_created ON data_lineage(created_at);
CREATE INDEX IF NOT EXISTS idx_cross_validation_entity ON cross_validation_log(entity_type, entity_id);

-- Function to calculate confidence score
CREATE OR REPLACE FUNCTION calculate_confidence_score(
    p_source_system VARCHAR(50),
    p_validation_passed BOOLEAN,
    p_cross_validated BOOLEAN
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_baseline DECIMAL(3,2);
    v_score DECIMAL(3,2);
BEGIN
    SELECT confidence_baseline INTO v_baseline
    FROM source_systems WHERE system_name = p_source_system;
    
    v_score := v_baseline;
    
    -- Boost for validation passed
    IF p_validation_passed THEN
        v_score := LEAST(v_score + 0.05, 1.00);
    ELSE
        v_score := GREATEST(v_score - 0.10, 0.00);
    END IF;
    
    -- Boost for cross-validation
    IF p_cross_validated THEN
        v_score := LEAST(v_score + 0.05, 1.00);
    END IF;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- View for data lineage summary
CREATE OR REPLACE VIEW data_lineage_summary AS
SELECT 
    dl.lineage_id,
    dl.source_system,
    ss.system_type,
    dl.entity_type,
    dl.entity_id,
    dl.confidence_score,
    dl.checksum,
    dl.parent_lineage_id,
    dl.metadata,
    dl.created_at,
    ss.is_active AS source_active,
    ss.deprecation_date AS source_deprecation
FROM data_lineage dl
JOIN source_systems ss ON dl.source_system = ss.system_name;
