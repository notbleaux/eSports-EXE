-- Migration: Security, RBAC, and Observability Schema
-- Version: 025
-- Purpose: Production hardening - RBAC, audit logs, observability

-- RBAC: Roles and permissions
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(50) PRIMARY KEY,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
    ('guest', 'Unauthenticated user', '["player:read", "team:read", "match:read", "analytics:read"]'),
    ('user', 'Standard authenticated user', '["player:read", "team:read", "match:read", "analytics:read"]'),
    ('analyst', 'Data analyst with write access', '["player:read", "team:read", "match:read", "analytics:read", "analytics:write"]'),
    ('moderator', 'Content moderator', '["player:read", "player:write", "team:read", "team:write", "match:read", "match:write", "analytics:read", "analytics:write"]'),
    ('admin', 'Full system access', '["*"]'),
    ('service', 'Internal service account', '["*"]')
ON CONFLICT (name) DO NOTHING;

-- RBAC: User roles assignment
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL REFERENCES roles(name),
    granted_by UUID,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- RBAC: Custom user permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted_by UUID,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    UNIQUE(user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- Audit log for all API actions
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- Request info
    request_id UUID NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- User info
    user_id UUID,
    user_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    
    -- Action info
    action VARCHAR(100) NOT NULL, -- "create", "update", "delete", "read"
    resource_type VARCHAR(100) NOT NULL, -- "player", "team", "match"
    resource_id UUID,
    
    -- Request details
    method VARCHAR(10),
    path TEXT,
    query_params JSONB,
    request_body JSONB,
    
    -- Response details
    status_code INTEGER,
    response_size INTEGER,
    duration_ms INTEGER,
    
    -- Changes (for write operations)
    changes JSONB, -- {field: {old: x, new: y}}
    
    -- Risk assessment
    risk_score INTEGER, -- 0-100
    anomalies JSONB -- List of detected anomalies
);

-- Convert to hypertable for time-series optimization
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('audit_log', 'timestamp', 
            chunk_time_interval => INTERVAL '1 day',
            if_not_exists => TRUE
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB not available, using regular table';
END $$;

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_log(ip_address, timestamp DESC);

-- Security events (high-risk actions)
CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    event_type VARCHAR(100) NOT NULL, -- "brute_force", "suspicious_login", "privilege_escalation"
    severity VARCHAR(20) NOT NULL, -- "low", "medium", "high", "critical"
    
    -- Actor
    user_id UUID,
    ip_address INET,
    
    -- Details
    description TEXT,
    evidence JSONB,
    
    -- Resolution
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_security_events_time ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(resolved) WHERE resolved = FALSE;

-- Observability: Application metrics
CREATE TABLE IF NOT EXISTS app_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    metric_name VARCHAR(255) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_type VARCHAR(20), -- "counter", "gauge", "histogram", "summary"
    
    labels JSONB,
    
    -- Source
    service_name VARCHAR(100),
    instance_id VARCHAR(100),
    host VARCHAR(100)
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('app_metrics', 'timestamp', 
            chunk_time_interval => INTERVAL '1 hour',
            if_not_exists => TRUE
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB not available, using regular table';
END $$;

CREATE INDEX IF NOT EXISTS idx_app_metrics_lookup ON app_metrics(metric_name, timestamp DESC);

-- Observability: Traces (simplified OpenTelemetry)
CREATE TABLE IF NOT EXISTS traces (
    id BIGSERIAL PRIMARY KEY,
    
    trace_id VARCHAR(32) NOT NULL,
    span_id VARCHAR(16) NOT NULL,
    parent_span_id VARCHAR(16),
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Info
    service_name VARCHAR(100),
    operation_name VARCHAR(255),
    status VARCHAR(20), -- "ok", "error"
    
    -- Attributes
    attributes JSONB,
    events JSONB,
    
    UNIQUE(trace_id, span_id)
);

CREATE INDEX IF NOT EXISTS idx_traces_trace ON traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_traces_time ON traces(start_time DESC);

-- Observability: SLO violations
CREATE TABLE IF NOT EXISTS slo_violations (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    slo_name VARCHAR(255) NOT NULL,
    slo_target DOUBLE PRECISION NOT NULL,
    actual_value DOUBLE PRECISION NOT NULL,
    
    -- Context
    service_name VARCHAR(100),
    error_budget_impact DOUBLE PRECISION, -- How much error budget was consumed
    
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ
);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_request_id UUID,
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID,
    p_changes JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_log (
        request_id, user_id, action, resource_type, resource_id, changes
    ) VALUES (
        p_request_id, p_user_id, p_action, p_resource_type, p_resource_id, p_changes
    );
END;
$$ LANGUAGE plpgsql;

-- Function to detect and log security events
CREATE OR REPLACE FUNCTION detect_security_event()
RETURNS TRIGGER AS $$
DECLARE
    recent_failures INTEGER;
BEGIN
    -- Detect brute force attempts (5+ failed logins in 5 minutes)
    IF NEW.action = 'login_failed' THEN
        SELECT COUNT(*) INTO recent_failures
        FROM audit_log
        WHERE action = 'login_failed'
          AND ip_address = NEW.ip_address
          AND timestamp > NOW() - INTERVAL '5 minutes';
        
        IF recent_failures >= 5 THEN
            INSERT INTO security_events (
                event_type, severity, user_id, ip_address, description
            ) VALUES (
                'brute_force',
                'high',
                NEW.user_id,
                NEW.ip_address,
                'Multiple failed login attempts detected'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for security event detection
CREATE TRIGGER trigger_detect_security_event
    AFTER INSERT ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION detect_security_event();
