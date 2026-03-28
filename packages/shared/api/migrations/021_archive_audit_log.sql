-- [Ver001.000]
-- Archive Audit Log Migration
-- ===========================
-- Creates audit log table for archival system frame operations
-- Immutable audit trail - no update/delete allowed

-- Archive audit log table
CREATE TABLE IF NOT EXISTS archive_audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frame_id UUID NOT NULL REFERENCES archive_frames(frame_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'UPLOAD',           -- Frame uploaded to storage
        'DEDUP_SKIP',       -- Frame skipped due to duplicate hash
        'PIN',              -- Frame pinned (verified)
        'UNPIN',            -- Frame unpinned
        'DELETE',           -- Frame deleted (GC)
        'MIGRATE',          -- Frame migrated between backends
        'ACCESS',           -- Frame accessed/retrieved
        'GC_SCAN'           -- Garbage collection scan
    )),
    actor VARCHAR(100) NOT NULL,  -- User or service that performed action
    metadata JSONB DEFAULT '{}'::jsonb,  -- Additional context (IP, user agent, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_archive_audit_log_frame_id 
    ON archive_audit_log(frame_id);
CREATE INDEX IF NOT EXISTS idx_archive_audit_log_created_at_desc 
    ON archive_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_audit_log_action 
    ON archive_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_archive_audit_log_actor 
    ON archive_audit_log(actor);

-- Composite index for frame audit history queries
CREATE INDEX IF NOT EXISTS idx_archive_audit_log_frame_created 
    ON archive_audit_log(frame_id, created_at DESC);

-- Prevent updates to audit log (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Updates to archive_audit_log are not allowed - audit trail is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON archive_audit_log;
CREATE TRIGGER audit_log_no_update
    BEFORE UPDATE ON archive_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_update();

-- Prevent deletes from audit log (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Deletes from archive_audit_log are not allowed - audit trail is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_delete ON archive_audit_log;
CREATE TRIGGER audit_log_no_delete
    BEFORE DELETE ON archive_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_delete();

-- Comments for documentation
COMMENT ON TABLE archive_audit_log IS 'Immutable audit trail for all archival frame operations';
COMMENT ON COLUMN archive_audit_log.log_id IS 'Unique audit entry identifier';
COMMENT ON COLUMN archive_audit_log.frame_id IS 'Reference to affected frame';
COMMENT ON COLUMN archive_audit_log.action IS 'Operation type: UPLOAD, DEDUP_SKIP, PIN, UNPIN, DELETE, MIGRATE, ACCESS, GC_SCAN';
COMMENT ON COLUMN archive_audit_log.actor IS 'User ID or service name that performed the action';
COMMENT ON COLUMN archive_audit_log.metadata IS 'JSON blob with additional context (IP, user agent, request ID, etc.)';
COMMENT ON COLUMN archive_audit_log.created_at IS 'Timestamp when action occurred';
