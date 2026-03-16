-- [Ver001.000]
-- OAuth and 2FA Migration
-- =====================
-- Creates tables for OAuth providers and Two-Factor Authentication

-- OAuth accounts table (linked to users)
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('discord', 'google', 'github')),
    provider_account_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_username VARCHAR(100),
    provider_avatar_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(provider, provider_account_id),
    UNIQUE(user_id, provider)
);

-- Two-factor authentication table
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret_encrypted TEXT NOT NULL,  -- Encrypted TOTP secret
    is_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    enabled_at TIMESTAMP,
    backup_codes_hash TEXT,  -- JSON array of hashed backup codes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Used backup codes tracking
CREATE TABLE IF NOT EXISTS used_backup_codes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,  -- Hash of the used backup code
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, code_hash)
);

-- OAuth state tokens (for CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_state_tokens (
    id SERIAL PRIMARY KEY,
    state_token VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(20) NOT NULL,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,  -- NULL for new registrations
    redirect_url TEXT,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2FA temporary tokens (during login flow)
CREATE TABLE IF NOT EXISTS two_factor_temp_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add 2FA columns to users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN IF NOT EXISTS two_factor_secret_encrypted TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_account_id ON oauth_accounts(provider_account_id);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled ON two_factor_auth(is_enabled);

CREATE INDEX IF NOT EXISTS idx_used_backup_codes_user_id ON used_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_used_backup_codes_code_hash ON used_backup_codes(code_hash);

CREATE INDEX IF NOT EXISTS idx_oauth_state_tokens_token ON oauth_state_tokens(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_state_tokens_expires ON oauth_state_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_two_factor_temp_tokens_token ON two_factor_temp_tokens(token);
CREATE INDEX IF NOT EXISTS idx_two_factor_temp_tokens_expires ON two_factor_temp_tokens(expires_at);

-- Trigger to update updated_at on oauth_accounts
DROP TRIGGER IF EXISTS update_oauth_accounts_updated_at ON oauth_accounts;
CREATE TRIGGER update_oauth_accounts_updated_at
    BEFORE UPDATE ON oauth_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on two_factor_auth
DROP TRIGGER IF EXISTS update_two_factor_auth_updated_at ON two_factor_auth;
CREATE TRIGGER update_two_factor_auth_updated_at
    BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired OAuth state tokens
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_state()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM oauth_state_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for expired 2FA temp tokens
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_temp_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM two_factor_temp_tokens 
    WHERE expires_at < NOW() - INTERVAL '10 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Sync users.two_factor_enabled with two_factor_auth.is_enabled
CREATE OR REPLACE FUNCTION sync_two_factor_enabled()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET two_factor_enabled = NEW.is_enabled,
        two_factor_secret_encrypted = NEW.secret_encrypted
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_two_factor_enabled_trigger ON two_factor_auth;
CREATE TRIGGER sync_two_factor_enabled_trigger
    AFTER INSERT OR UPDATE ON two_factor_auth
    FOR EACH ROW
    EXECUTE FUNCTION sync_two_factor_enabled();

-- Comments for documentation
COMMENT ON TABLE oauth_accounts IS 'Linked OAuth provider accounts';
COMMENT ON TABLE two_factor_auth IS 'Two-factor authentication settings per user';
COMMENT ON TABLE used_backup_codes IS 'Tracking of consumed backup codes';
COMMENT ON TABLE oauth_state_tokens IS 'CSRF protection tokens for OAuth flows';
COMMENT ON TABLE two_factor_temp_tokens IS 'Temporary tokens during 2FA login flow';

COMMENT ON COLUMN oauth_accounts.secret_encrypted IS 'Encrypted TOTP secret (AES-256-GCM)';
COMMENT ON COLUMN two_factor_auth.backup_codes_hash IS 'JSON array of bcrypt hashed backup codes';
COMMENT ON COLUMN users.two_factor_enabled IS 'Cached value from two_factor_auth.is_enabled';
