-- [Ver001.000]
-- Forum System Migration
-- ======================
-- Tables for AREPO forum: categories, threads, posts, votes, polls

-- Forum categories
CREATE TABLE IF NOT EXISTS forum_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'message-circle',
    sort_order INTEGER DEFAULT 0,
    requires_token INTEGER DEFAULT 0,  -- 0 = free, >0 = entry cost
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum threads
CREATE TABLE IF NOT EXISTS forum_threads (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_poll BOOLEAN DEFAULT FALSE,
    poll_options JSON DEFAULT NULL, -- [{"option": "text", "votes": 0}, ...]
    poll_ends_at TIMESTAMP,
    views INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    last_post_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum posts (replies)
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES forum_posts(id), -- For nested replies
    upvotes INTEGER DEFAULT 0,
    is_solution BOOLEAN DEFAULT FALSE, -- For Q&A threads
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum votes (upvotes/downvotes)
CREATE TABLE IF NOT EXISTS forum_votes (
    user_id VARCHAR(50) NOT NULL,
    post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (1, -1)), -- 1 = upvote, -1 = downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);

-- Thread views tracking (unique per user)
CREATE TABLE IF NOT EXISTS forum_thread_views (
    thread_id INTEGER NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id, user_id)
);

-- Forum subscriptions (users following threads)
CREATE TABLE IF NOT EXISTS forum_subscriptions (
    user_id VARCHAR(50) NOT NULL,
    thread_id INTEGER NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, thread_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_category ON forum_threads(category_id, is_pinned DESC, last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_author ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_thread ON forum_posts(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_votes_post ON forum_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON forum_votes(user_id);

-- Trigger to update thread reply count
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads SET reply_count = reply_count + 1, last_post_at = NEW.created_at WHERE id = NEW.thread_id;
        UPDATE forum_categories SET post_count = post_count + 1 WHERE id = (SELECT category_id FROM forum_threads WHERE id = NEW.thread_id);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads SET reply_count = reply_count - 1 WHERE id = OLD.thread_id;
        UPDATE forum_categories SET post_count = post_count - 1 WHERE id = (SELECT category_id FROM forum_threads WHERE id = OLD.thread_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reply_count ON forum_posts;
CREATE TRIGGER trg_update_reply_count
    AFTER INSERT OR DELETE ON forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_reply_count();

-- Trigger to update category thread count
CREATE OR REPLACE FUNCTION update_category_thread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_categories SET thread_count = thread_count + 1 WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_categories SET thread_count = thread_count - 1 WHERE id = OLD.category_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_thread_count ON forum_threads;
CREATE TRIGGER trg_update_thread_count
    AFTER INSERT OR DELETE ON forum_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_category_thread_count();

-- Seed data: Forum categories
INSERT INTO forum_categories (name, description, icon, sort_order) VALUES
('VCT Discussion', 'Live matches, predictions, and competitive analysis', 'trophy', 1),
('Strategy & Analysis', 'Agent compositions, map tactics, and meta discussion', 'brain', 2),
('VOD Review', 'Share matches for community analysis and feedback', 'video', 3),
('Custom Maps', 'Showcase user-created content and map ideas', 'map', 4),
('Off-Topic', 'General gaming and esports discussion', 'coffee', 5),
('Feedback & Support', 'Platform feedback, bug reports, and help', 'help-circle', 6)
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE forum_categories IS 'Forum categories/sections';
COMMENT ON TABLE forum_threads IS 'Discussion threads within categories';
COMMENT ON TABLE forum_posts IS 'Individual posts/replies within threads';
COMMENT ON TABLE forum_votes IS 'User votes on posts (upvote/downvote)';
