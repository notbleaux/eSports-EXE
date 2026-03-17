-- Migration 031: Enhanced Lensing Preferences (user-specific)
BEGIN;

ALTER TABLE lensing_preferences ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add composite index for fast lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lensing_active ON lensing_preferences(user_id, tenet_id, is_active);

-- Default preset templates
CREATE TABLE IF NOT EXISTS lensing_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    tenet_id VARCHAR(10) NOT NULL,
    lenses VARCHAR(10)[] NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO lensing_presets (name, tenet_id, lenses, description) VALUES
('Analytics Focus', 'Valorant', ARRAY['SATOR', 'ROTAS'], 'Player stats + tactical analysis'),
('Community View', 'Valorant', ARRAY['AREPO', 'OPERA'], 'Community + pro scene')
ON CONFLICT DO NOTHING;

COMMIT;

