-- Migration 032: Data Archives Index + Integrity
BEGIN;

-- Add archive metrics tracking
ALTER TABLE data_archives ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
ALTER TABLE data_archives ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Archive retrieval stats
CREATE TABLE IF NOT EXISTS archive_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_id UUID REFERENCES data_archives(id),
    user_id UUID REFERENCES users(id),
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    latency_ms INTEGER
);

-- Constraints for data integrity
ALTER TABLE data_archives ADD CONSTRAINT chk_positive_count CHECK (record_count > 0);

-- Archive status view
CREATE VIEW v_archive_summary AS
SELECT 
    storage_type,
    tenet_id,
    COUNT(*) as total_archives,
    SUM(record_count) as total_records,
    AVG(size_bytes) as avg_size,
    MAX(created_at) as latest_archive
FROM data_archives 
WHERE expires_at IS NULL OR expires_at > NOW()
GROUP BY storage_type, tenet_id;

COMMIT;

