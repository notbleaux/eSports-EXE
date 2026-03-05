-- eXe Directory Database Schema
-- SATOR-eXe-ROTAS Service Registry
-- SQLite database for service discovery and health monitoring

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Service Registry: All registered services/components
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id VARCHAR(64) UNIQUE NOT NULL,      -- Unique service identifier (e.g., 'raws', 'base')
    name VARCHAR(128) NOT NULL,                   -- Human-readable name
    service_type VARCHAR(32) NOT NULL,            -- 'core', 'game', 'pipeline', 'platform'
    host VARCHAR(256) NOT NULL,                   -- Host address
    port INTEGER NOT NULL,                        -- Port number
    base_url VARCHAR(512),                        -- Base API URL
    health_endpoint VARCHAR(256) DEFAULT '/health', -- Health check path
    metadata JSON,                                -- Service-specific config
    tags TEXT,                                    -- Comma-separated tags
    priority INTEGER DEFAULT 100,                 -- Load balancing priority (lower = higher)
    is_active BOOLEAN DEFAULT 1,                  -- Soft delete flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Instances: Track multiple instances of same service
CREATE TABLE IF NOT EXISTS service_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id VARCHAR(64) NOT NULL,
    instance_id VARCHAR(64) UNIQUE NOT NULL,      -- Unique instance identifier
    host VARCHAR(256) NOT NULL,
    port INTEGER NOT NULL,
    status VARCHAR(16) DEFAULT 'unknown',         -- 'healthy', 'unhealthy', 'unknown', 'starting'
    last_heartbeat TIMESTAMP,
    metadata JSON,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- Health Check History
CREATE TABLE IF NOT EXISTS health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id VARCHAR(64) NOT NULL,
    instance_id VARCHAR(64),
    status VARCHAR(16) NOT NULL,                  -- 'healthy', 'unhealthy', 'degraded'
    response_time_ms INTEGER,                     -- Response time in milliseconds
    status_code INTEGER,                          -- HTTP status code
    message TEXT,                                 -- Error message or details
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- =====================================================
-- PARITY CHECK TABLES
-- =====================================================

-- Parity Check Configuration
CREATE TABLE IF NOT EXISTS parity_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_service VARCHAR(64) NOT NULL,          -- Source service (e.g., 'raws')
    target_service VARCHAR(64) NOT NULL,          -- Target service (e.g., 'base')
    table_name VARCHAR(128) NOT NULL,             -- Table being synchronized
    source_query TEXT,                            -- Query to fetch from source
    target_query TEXT,                            -- Query to fetch from target
    check_interval_minutes INTEGER DEFAULT 60,    -- How often to run check
    tolerance_percent DECIMAL(5,2) DEFAULT 0.0,   -- Allowed discrepancy %
    is_enabled BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_service, target_service, table_name)
);

-- Parity Check Results
CREATE TABLE IF NOT EXISTS parity_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_id INTEGER NOT NULL,
    check_run_id VARCHAR(64) NOT NULL,            -- Group checks in a run
    status VARCHAR(16) NOT NULL,                  -- 'synced', 'mismatch', 'error', 'running'
    source_count INTEGER,                         -- Records in source
    target_count INTEGER,                         -- Records in target
    diff_count INTEGER,                           -- Number of differences
    diff_details JSON,                            -- Detailed diff (sample)
    execution_time_ms INTEGER,                    -- How long the check took
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (config_id) REFERENCES parity_configs(id) ON DELETE CASCADE
);

-- =====================================================
-- ROUTING & DATA FLOW TABLES
-- =====================================================

-- Data Routes: Define data flow between services
CREATE TABLE IF NOT EXISTS data_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id VARCHAR(64) UNIQUE NOT NULL,
    source_service VARCHAR(64) NOT NULL,
    target_service VARCHAR(64) NOT NULL,
    route_type VARCHAR(32) NOT NULL,              -- 'sync', 'async', 'webhook', 'stream'
    endpoint_path VARCHAR(256),                   -- API path for this route
    transformation_rules JSON,                    -- Data transformation config
    retry_policy JSON,                            -- Retry configuration
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route Events: Track data flow events
CREATE TABLE IF NOT EXISTS route_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(32) NOT NULL,              -- 'request', 'response', 'error', 'retry'
    payload_size INTEGER,
    status VARCHAR(16),                           -- 'success', 'failed', 'pending'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES data_routes(route_id) ON DELETE CASCADE
);

-- =====================================================
-- SYSTEM TABLES
-- =====================================================

-- System Events: Audit log for directory operations
CREATE TABLE IF NOT EXISTS system_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type VARCHAR(64) NOT NULL,              -- 'service_registered', 'health_alert', etc.
    service_id VARCHAR(64),
    severity VARCHAR(16) DEFAULT 'info',          -- 'info', 'warning', 'error', 'critical'
    message TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Directory Configuration
CREATE TABLE IF NOT EXISTS directory_config (
    key VARCHAR(128) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_services_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_instances_service ON service_instances(service_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON service_instances(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_time ON health_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_parity_checks_run ON parity_checks(check_run_id);
CREATE INDEX IF NOT EXISTS idx_parity_checks_status ON parity_checks(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_time ON system_events(created_at);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert known service types
INSERT OR IGNORE INTO directory_config (key, value, description) VALUES
('version', '1.0.0', 'Directory service version'),
('health_check_interval_sec', '30', 'How often to check service health'),
('service_timeout_sec', '5', 'Timeout for service health checks'),
('max_health_history', '1000', 'Max health check records per service'),
('default_retry_attempts', '3', 'Default retry attempts for routes'),
('parity_check_enabled', '1', 'Global parity check toggle');

-- Seed known services (inactive until registered)
INSERT OR IGNORE INTO services (service_id, name, service_type, host, port, health_endpoint, tags) VALUES
('raws', 'RAWS Stats Reference', 'core', 'localhost', 8001, '/health', 'stats,reference,api'),
('base', 'BASE Analytics', 'core', 'localhost', 8002, '/health', 'analytics,advanced,api'),
('njz-platform', 'NJZ Platform', 'platform', 'localhost', 8003, '/health', 'tools,dashboard,ui'),
('axiom-game', 'AXIOM Game', 'game', 'localhost', 8004, '/health', 'game,simulation'),
('njz-market', 'NJZ Market Sim', 'game', 'localhost', 8005, '/health', 'market,simulation,economy'),
('data-pipeline', 'Data Pipeline', 'pipeline', 'localhost', 8006, '/health', 'etl,data,processing');

-- Seed parity check configs for RAWS <> BASE
INSERT OR IGNORE INTO parity_configs (source_service, target_service, table_name, check_interval_minutes, tolerance_percent) VALUES
('raws', 'base', 'player_stats', 60, 0.1),
('raws', 'base', 'match_history', 60, 0.0),
('raws', 'base', 'team_standings', 30, 0.05),
('raws', 'base', 'market_data', 15, 0.5);
