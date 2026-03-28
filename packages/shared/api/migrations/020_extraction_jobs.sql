-- [Ver001.000]
-- Minimap Extraction Service Migration
-- ====================================
-- Creates tables for extraction job tracking and frame metadata

-- Extraction jobs table
CREATE TABLE IF NOT EXISTS extraction_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    vod_source VARCHAR(50) NOT NULL CHECK (vod_source IN ('local', 's3', 'http')),
    vod_path VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
    
    -- Output tracking
    frame_count INTEGER,
    manifest_id UUID,
    
    -- Error handling
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    
    -- Metadata
    vod_duration_ms INTEGER,
    vod_resolution VARCHAR(50),
    
    CONSTRAINT fk_match_id FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Archive manifest table (integration point with Archival System)
CREATE TABLE IF NOT EXISTS archive_manifests (
    manifest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extraction_job_id UUID NOT NULL REFERENCES extraction_jobs(job_id) ON DELETE CASCADE,
    total_frames INTEGER NOT NULL,
    unique_frames INTEGER NOT NULL,
    storage_size_bytes BIGINT NOT NULL,
    dedup_ratio FLOAT DEFAULT 1.0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    archived_at TIMESTAMP,
    
    UNIQUE(extraction_job_id)
);

-- Archive frames table (individual frame records from Archival System)
CREATE TABLE IF NOT EXISTS archive_frames (
    frame_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_id UUID NOT NULL REFERENCES archive_manifests(manifest_id) ON DELETE CASCADE,
    content_hash VARCHAR(64) NOT NULL UNIQUE,
    
    -- Frame metadata
    frame_index INTEGER NOT NULL,
    segment_type VARCHAR(50) NOT NULL CHECK (segment_type IN ('IN_ROUND', 'BUY_PHASE', 'HALFTIME', 'BETWEEN_ROUND', 'UNKNOWN')),
    timestamp_ms INTEGER NOT NULL,
    accuracy_tier VARCHAR(50) DEFAULT 'STANDARD',
    
    -- Storage
    storage_url TEXT,
    jpeg_size_bytes INTEGER,
    
    -- Verification (TeneT integration)
    is_pinned BOOLEAN DEFAULT FALSE,
    pinned_at TIMESTAMP,
    pinned_by VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_match_id ON extraction_jobs(match_id);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_created_at ON extraction_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_completed_at ON extraction_jobs(completed_at DESC) WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_archive_manifests_extraction_job_id ON archive_manifests(extraction_job_id);
CREATE INDEX IF NOT EXISTS idx_archive_manifests_created_at ON archive_manifests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_archive_frames_manifest_id ON archive_frames(manifest_id);
CREATE INDEX IF NOT EXISTS idx_archive_frames_content_hash ON archive_frames(content_hash);
CREATE INDEX IF NOT EXISTS idx_archive_frames_segment_type ON archive_frames(segment_type);
CREATE INDEX IF NOT EXISTS idx_archive_frames_timestamp ON archive_frames(timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_archive_frames_is_pinned ON archive_frames(is_pinned) WHERE is_pinned = TRUE;

-- Comments for documentation
COMMENT ON TABLE extraction_jobs IS 'Tracks minimap extraction job lifecycle and metadata';
COMMENT ON TABLE archive_manifests IS 'Deduplication manifests from Archival System';
COMMENT ON TABLE archive_frames IS 'Individual frame records with segment classification and verification status';

COMMENT ON COLUMN extraction_jobs.status IS 'Job state: pending → running → completed/failed';
COMMENT ON COLUMN extraction_jobs.vod_source IS 'Source type: local file, s3, or http stream (Phase 1 MVP uses local)';
COMMENT ON COLUMN archive_frames.segment_type IS 'Tactical frame context: IN_ROUND, BUY_PHASE, HALFTIME, BETWEEN_ROUND, UNKNOWN';
COMMENT ON COLUMN archive_frames.is_pinned IS 'True if frame verified by TeneT consensus';
