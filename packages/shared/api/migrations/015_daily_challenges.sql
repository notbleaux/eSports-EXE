-- [Ver001.000]
-- Daily Challenges System Migration
-- =================================
-- Tables for daily video challenges, predictions, and rewards

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
    id VARCHAR(50) PRIMARY KEY,
    challenge_date DATE UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('video_quiz', 'prediction', 'stat_guess', 'match_result', 'trivia')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    data JSON NOT NULL, -- Challenge-specific data (video URL, options, etc.)
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    token_reward INTEGER DEFAULT 50 CHECK (token_reward > 0),
    time_limit_seconds INTEGER, -- Optional time limit
    total_attempts INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User challenge attempts
CREATE TABLE IF NOT EXISTS user_challenges (
    user_id VARCHAR(50) NOT NULL,
    challenge_id VARCHAR(50) NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answer_given VARCHAR(100),
    is_correct BOOLEAN,
    tokens_earned INTEGER DEFAULT 0,
    time_taken_seconds INTEGER, -- How long to answer
    PRIMARY KEY (user_id, challenge_id)
);

-- Challenge streak tracking
CREATE TABLE IF NOT EXISTS challenge_streaks (
    user_id VARCHAR(50) PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_correct_date DATE,
    total_correct INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenge leaderboards (daily)
CREATE TABLE IF NOT EXISTS challenge_leaderboards (
    challenge_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    score INTEGER DEFAULT 0, -- Points for this challenge
    time_taken INTEGER, -- Seconds to complete
    rank_position INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (challenge_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_streaks_user ON challenge_streaks(user_id);

-- Trigger to update streak on correct answer
CREATE OR REPLACE FUNCTION update_challenge_streak()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_correct THEN
        INSERT INTO challenge_streaks (user_id, current_streak, longest_streak, last_correct_date, total_correct)
        VALUES (NEW.user_id, 1, 1, CURRENT_DATE, 1)
        ON CONFLICT (user_id) DO UPDATE
        SET current_streak = CASE
                WHEN challenge_streaks.last_correct_date = CURRENT_DATE - INTERVAL '1 day'
                THEN challenge_streaks.current_streak + 1
                ELSE 1
            END,
            longest_streak = GREATEST(challenge_streaks.longest_streak, 
                CASE
                    WHEN challenge_streaks.last_correct_date = CURRENT_DATE - INTERVAL '1 day'
                    THEN challenge_streaks.current_streak + 1
                    ELSE 1
                END),
            last_correct_date = CURRENT_DATE,
            total_correct = challenge_streaks.total_correct + 1,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_challenge_streak ON user_challenges;
CREATE TRIGGER trg_update_challenge_streak
    AFTER INSERT ON user_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_challenge_streak();

-- Trigger to update challenge stats
CREATE OR REPLACE FUNCTION update_challenge_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE daily_challenges
    SET total_attempts = total_attempts + 1,
        total_correct = total_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END
    WHERE id = NEW.challenge_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_challenge_stats ON user_challenges;
CREATE TRIGGER trg_update_challenge_stats
    AFTER INSERT ON user_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_challenge_stats();

-- Seed data: Sample daily challenges
INSERT INTO daily_challenges (id, challenge_date, type, title, description, data, difficulty, token_reward)
VALUES 
('daily-001', CURRENT_DATE, 'video_quiz', 
 'Who Won This Round?', 
 'Watch this clip from VCT Americas and predict the round winner',
 '{"videoUrl": "https://example.com/clip1", "roundTimestamp": 45, "options": ["Sentinels", "Cloud9", "Draw"], "correctAnswer": "Sentinels"}',
 'medium', 50),

('daily-002', CURRENT_DATE + INTERVAL '1 day', 'prediction',
 'Match Winner Prediction',
 'Predict the winner of tonight''s VCT match',
 '{"matchId": "vct-2024-001", "teamA": "Fnatic", "teamB": "LOUD", "options": ["Fnatic", "LOUD"], "correctAnswer": null}',
 'easy', 25),

('daily-003', CURRENT_DATE + INTERVAL '2 days', 'stat_guess',
 'Player Stat Challenge',
 'Guess how many kills TenZ will get in his next match (within 2)',
 '{"playerId": "tenz", "stat": "kills", "options": ["<15", "15-20", "20-25", ">25"], "correctAnswer": "20-25"}',
 'hard', 100)

ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE daily_challenges IS 'Daily challenge definitions';
COMMENT ON TABLE user_challenges IS 'User attempts at daily challenges';
COMMENT ON TABLE challenge_streaks IS 'User streak tracking for daily challenges';
