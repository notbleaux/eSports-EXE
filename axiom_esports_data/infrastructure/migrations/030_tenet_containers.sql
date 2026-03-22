-- Migration 030: TENET Containers + HUB Layouts
-- Phase 4: Database support for Lensing system

BEGIN;

-- TENET Containers table
CREATE TABLE IF NOT EXISTS tenet_containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenet_id VARCHAR(10) NOT NULL,  -- 'Valorant', 'CS2'
    name VARCHAR(100) NOT NULL,
    hub_type VARCHAR(10) NOT NULL CHECK (hub_type IN ('SATOR', 'ROTAS', 'AREPO', 'OPERA')),
    layout_config JSONB DEFAULT '{}',  -- grid x,y,w,h
    weight VARCHAR(10) DEFAULT 'medium' CHECK (weight IN ('light', 'medium', 'heavy')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lensing user preferences
CREATE TABLE IF NOT EXISTS lensing_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenet_id VARCHAR(10) NOT NULL,
    active_lenses VARCHAR(10)[] NOT NULL DEFAULT ARRAY['SATOR', 'ROTAS']::VARCHAR[],
    layout JSONB NOT NULL,  -- Grid layout from react-grid-layout
    presets JSONB DEFAULT '{}',
    is_mobile BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data archives tracking (Phase 3 integration)
CREATE TABLE IF NOT EXISTS data_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenet_id VARCHAR(10) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_count INTEGER NOT NULL,
    storage_type VARCHAR(20) NOT NULL CHECK (storage_type IN ('github', 's3', 'local')),
    storage_path TEXT NOT NULL,
    schema_version VARCHAR(20) DEFAULT '2.1.0',
    checksum VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Scraper job queue
CREATE TABLE IF NOT EXISTS scraper_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,  -- 'vlr', 'pandascore', 'hltv'
    job_type VARCHAR(50) NOT NULL,  -- 'matches', 'players'
    parameters JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    priority INTEGER DEFAULT 5,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    UNIQUE(source, job_type, parameters)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenet_containers_tenet ON tenet_containers(tenet_id, hub_type);
CREATE INDEX IF NOT EXISTS idx_lensing_user_tenet ON lensing_preferences(user_id, tenet_id);
CREATE INDEX IF NOT EXISTS idx_archives_tenet ON data_archives(tenet_id, storage_type);
CREATE INDEX IF NOT EXISTS idx_scraper_pending ON scraper_jobs(status, priority, scheduled_at) WHERE status = 'pending';

-- Seed default TENET containers
INSERT INTO tenet_containers (tenet_id, name, hub_type, layout_config, weight) VALUES
('Valorant', 'SATOR Player Stats', 'SATOR', '{"x":0,"y":0,"w":4,"h":5}', 'heavy'),
('Valorant', 'ROTAS Tactical Maps', 'ROTAS', '{"x":4,"y":0,"w":4,"h":5}', 'heavy'),
('Valorant', 'AREPO Community', 'AREPO', '{"x":0,"y":5,"w":4,"h":3}', 'light'),
('Valorant', 'OPERA Pro Tournaments', 'OPERA', '{"x":4,"y":5,"w":4,"h":3}', 'medium')
ON CONFLICT DO NOTHING;

COMMIT;

