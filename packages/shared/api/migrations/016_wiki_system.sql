[Ver001.000]
-- Wiki System Migration
-- =====================
-- Knowledge base and help documentation system

-- Wiki categories (mirrors help categories)
CREATE TABLE IF NOT EXISTS wiki_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'file-text',
    sort_order INTEGER DEFAULT 0,
    parent_id INTEGER REFERENCES wiki_categories(id),
    is_help_category BOOLEAN DEFAULT FALSE,
    article_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wiki articles
CREATE TABLE IF NOT EXISTS wiki_articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES wiki_categories(id) ON DELETE SET NULL,
    author_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    content_html TEXT, -- Pre-rendered HTML cache
    excerpt TEXT, -- Auto-generated or manual excerpt
    tags TEXT[], -- Array of tags
    is_published BOOLEAN DEFAULT FALSE,
    is_help_article BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wiki article versions (history)
CREATE TABLE IF NOT EXISTS wiki_article_versions (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES wiki_articles(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    editor_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    edit_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wiki article feedback (helpful/not helpful)
CREATE TABLE IF NOT EXISTS wiki_article_feedback (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES wiki_articles(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_id)
);

-- Wiki redirects (for moved articles)
CREATE TABLE IF NOT EXISTS wiki_redirects (
    id SERIAL PRIMARY KEY,
    from_slug VARCHAR(200) UNIQUE NOT NULL,
    to_slug VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wiki navigation menu structure
CREATE TABLE IF NOT EXISTS wiki_navigation (
    id SERIAL PRIMARY KEY,
    menu_key VARCHAR(50) NOT NULL, -- 'help_panel', 'footer', 'header', etc.
    parent_id INTEGER REFERENCES wiki_navigation(id),
    title VARCHAR(100) NOT NULL,
    article_slug VARCHAR(200),
    external_url TEXT,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wiki_articles_category ON wiki_articles(category_id) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_wiki_articles_slug ON wiki_articles(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_tags ON wiki_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_help ON wiki_articles(is_help_article, is_published);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_search ON wiki_articles USING gin(to_tsvector('english', title || ' ' || coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_wiki_versions_article ON wiki_article_versions(article_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_navigation_menu ON wiki_navigation(menu_key, parent_id, sort_order);

-- Trigger to update article count on category
CREATE OR REPLACE FUNCTION update_wiki_category_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_published = TRUE THEN
        UPDATE wiki_categories SET article_count = article_count + 1 WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' AND OLD.is_published = TRUE THEN
        UPDATE wiki_categories SET article_count = article_count - 1 WHERE id = OLD.category_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_published = FALSE AND NEW.is_published = TRUE THEN
            UPDATE wiki_categories SET article_count = article_count + 1 WHERE id = NEW.category_id;
        ELSIF OLD.is_published = TRUE AND NEW.is_published = FALSE THEN
            UPDATE wiki_categories SET article_count = article_count - 1 WHERE id = NEW.category_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_wiki_category_count ON wiki_articles;
CREATE TRIGGER trg_update_wiki_category_count
    AFTER INSERT OR UPDATE OR DELETE ON wiki_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_wiki_category_count();

-- Trigger to create version on update
CREATE OR REPLACE FUNCTION create_wiki_version()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content != NEW.content THEN
        INSERT INTO wiki_article_versions (article_id, version, editor_id, content, edit_summary)
        VALUES (NEW.id, OLD.version + 1, NEW.author_id, NEW.content, 'Auto-saved version');
        NEW.version = OLD.version + 1;
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_wiki_version ON wiki_articles;
CREATE TRIGGER trg_create_wiki_version
    BEFORE UPDATE ON wiki_articles
    FOR EACH ROW
    EXECUTE FUNCTION create_wiki_version();

-- Seed data: Wiki categories
INSERT INTO wiki_categories (slug, name, description, icon, sort_order, is_help_category) VALUES
('getting-started', 'Getting Started', 'New user guides and platform basics', 'rocket', 1, TRUE),
('platform-guide', 'Platform Guide', 'How to use SATOR, ROTAS, AREPO, OPERA, TENET', 'compass', 2, TRUE),
('token-economy', 'Token Economy', 'Understanding NJZ tokens, earning and spending', 'coins', 3, TRUE),
('betting-guide', 'Betting Guide', 'How to bet on matches, odds explained', 'trending-up', 4, TRUE),
('fantasy-league', 'Fantasy League', 'Fantasy draft, scoring, and strategy', 'users', 5, TRUE),
('simulator', 'Simulator', 'Using the match simulator and predictions', 'cpu', 6, TRUE),
('api-docs', 'API Documentation', 'Developer guides and API reference', 'code', 7, FALSE),
('community', 'Community', 'Forum rules, guidelines, and best practices', 'message-circle', 8, TRUE),
('troubleshooting', 'Troubleshooting', 'Common issues and solutions', 'tool', 9, TRUE),
('changelog', 'Changelog', 'Platform updates and release notes', 'git-branch', 10, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Seed data: Sample help articles
INSERT INTO wiki_articles (slug, title, category_id, author_id, content, excerpt, is_published, is_help_article, published_at)
SELECT 
    'welcome-to-4njz4',
    'Welcome to 4NJZ4 Platform',
    (SELECT id FROM wiki_categories WHERE slug = 'getting-started'),
    'system',
    E'# Welcome to 4NJZ4 Platform\n\nThe **Libre-X-eSport 4NJZ4 TENET Platform** is your ultimate destination for esports analytics, simulation, and community engagement.\n\n## The Five Hubs\n\n### SATOR - The Observatory\nAccess advanced player metrics including SimRating and RAR (Role-Adjusted Rating). Analyze player performance across tournaments.\n\n### ROTAS - The Harmonic Layer\nML-powered predictions and investment grading. Get AI-driven insights on match outcomes.\n\n### AREPO - The Arena\nCommunity forums, VOD review, and social features. Connect with other fans and analysts.\n\n### OPERA - The Stadium\nLive streaming, betting, rankings, and fantasy leagues. The heart of competitive engagement.\n\n### TENET - The Nexus\nNavigate between hubs and access your personalized dashboard.\n\n## Getting Started\n\n1. **Create an account** to track your tokens and progress\n2. **Claim your daily tokens** (50-100 NJZ every 24 hours)\n3. **Explore the hubs** to find your favorite features\n4. **Join the community** on AREPO forums\n5. **Start predicting** on OPERA matches\n\nHappy analyzing!',
    'Introduction to the 4NJZ4 platform and its five hubs: SATOR, ROTAS, AREPO, OPERA, and TENET.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM wiki_articles WHERE slug = 'welcome-to-4njz4');

-- Seed navigation menu structure
INSERT INTO wiki_navigation (menu_key, title, article_slug, sort_order, icon) VALUES
('help_panel', 'Getting Started', 'welcome-to-4njz4', 1, 'rocket'),
('help_panel', 'How to Earn Tokens', NULL, 2, 'coins'),
('help_panel', 'Betting Guide', NULL, 3, 'trending-up'),
('help_panel', 'Fantasy League Rules', NULL, 4, 'users'),
('help_panel', 'Community Guidelines', NULL, 5, 'message-circle'),
('help_panel', 'Contact Support', NULL, 6, 'help-circle')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE wiki_categories IS 'Wiki article categories';
COMMENT ON TABLE wiki_articles IS 'Wiki/knowledge base articles';
COMMENT ON TABLE wiki_article_versions IS 'Article revision history';
COMMENT ON TABLE wiki_article_feedback IS 'User feedback on articles';
COMMENT ON TABLE wiki_navigation IS 'Wiki menu structure for help panels';
