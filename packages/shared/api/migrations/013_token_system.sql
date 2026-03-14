[Ver001.000]
-- Token Economy System Migration
-- ==============================
-- Creates tables for NJZ token wallet, transactions, and daily claims

-- User token balances
CREATE TABLE IF NOT EXISTS user_tokens (
    user_id VARCHAR(50) PRIMARY KEY,
    balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
    total_earned INTEGER DEFAULT 0 NOT NULL CHECK (total_earned >= 0),
    total_spent INTEGER DEFAULT 0 NOT NULL CHECK (total_spent >= 0),
    last_daily_claim TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Token transaction history
CREATE TABLE IF NOT EXISTS token_transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES user_tokens(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN (
        'earn', 'spend', 'bet_win', 'bet_loss', 'daily_claim',
        'fantasy_win', 'fantasy_entry', 'simulation_reward', 'community_reward'
    )),
    source VARCHAR(50) NOT NULL,
    description TEXT,
    balance_after INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Daily claim tracking for streaks
CREATE TABLE IF NOT EXISTS daily_claims (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES user_tokens(user_id) ON DELETE CASCADE,
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    streak_count INTEGER DEFAULT 1 NOT NULL CHECK (streak_count > 0),
    tokens_awarded INTEGER NOT NULL CHECK (tokens_awarded > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, claim_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id 
    ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at 
    ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type 
    ON token_transactions(type);
CREATE INDEX IF NOT EXISTS idx_daily_claims_user_id 
    ON daily_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_claims_date 
    ON daily_claims(claim_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_tokens_balance 
    ON user_tokens(balance DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON user_tokens;
CREATE TRIGGER update_user_tokens_updated_at
    BEFORE UPDATE ON user_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_tokens IS 'User token wallet balances';
COMMENT ON TABLE token_transactions IS 'Audit log of all token transactions';
COMMENT ON TABLE daily_claims IS 'Daily claim history for streak tracking';
COMMENT ON COLUMN user_tokens.balance IS 'Current spendable token balance';
COMMENT ON COLUMN user_tokens.total_earned IS 'All-time tokens earned (lifetime)';
COMMENT ON COLUMN user_tokens.total_spent IS 'All-time tokens spent (lifetime)';
