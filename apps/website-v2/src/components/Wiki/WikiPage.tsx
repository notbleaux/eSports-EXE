/** [Ver001.000] */
/**
 * Wiki Page
 * =========
 * Full wiki page with sidebar navigation and article display.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Menu,
  ChevronRight,
  Home,
  Tag
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { WikiArticleViewer } from './WikiArticleViewer';
import { WikiSearch } from './WikiSearch';
import { WikiCategory, WikiArticle, WikiArticleSummary } from './types';

interface WikiPageProps {
  defaultSlug?: string;
}

export const WikiPage: React.FC<WikiPageProps> = ({ defaultSlug }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<WikiArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentSlug = slug || defaultSlug;

  // Load data - replace with API calls
  useEffect(() => {
    setIsLoading(true);
    
    // Mock categories
    setCategories([
      { id: 1, slug: 'getting-started', name: 'Getting Started', icon: 'rocket', article_count: 5, sort_order: 1, is_help_category: true },
      { id: 2, slug: 'platform-guide', name: 'Platform Guide', icon: 'compass', article_count: 12, sort_order: 2, is_help_category: true },
      { id: 3, slug: 'token-economy', name: 'Token Economy', icon: 'coins', article_count: 4, sort_order: 3, is_help_category: true },
      { id: 4, slug: 'betting-guide', name: 'Betting Guide', icon: 'trending-up', article_count: 6, sort_order: 4, is_help_category: true },
      { id: 5, slug: 'fantasy-league', name: 'Fantasy League', icon: 'users', article_count: 5, sort_order: 5, is_help_category: true },
      { id: 6, slug: 'troubleshooting', name: 'Troubleshooting', icon: 'tool', article_count: 8, sort_order: 6, is_help_category: true },
    ]);

    // Mock article
    if (currentSlug) {
      setTimeout(() => {
        setArticle({
          id: 1,
          slug: currentSlug,
          title: currentSlug === 'welcome-to-4njz4' 
            ? 'Welcome to 4NJZ4 Platform' 
            : 'Sample Article',
          category_id: 1,
          category: { id: 1, slug: 'getting-started', name: 'Getting Started', icon: 'rocket', article_count: 5, sort_order: 1, is_help_category: true },
          author_id: 'system',
          content: `# Welcome to 4NJZ4 Platform

The **Libre-X-eSport 4NJZ4 TENET Platform** is your ultimate destination for esports analytics, simulation, and community engagement.

## The Five Hubs

### SATOR - The Observatory
Access advanced player metrics including SimRating and RAR (Role-Adjusted Rating). Analyze player performance across tournaments.

### ROTAS - The Harmonic Layer
ML-powered predictions and investment grading. Get AI-driven insights on match outcomes.

### AREPO - The Arena
Community forums, VOD review, and social features. Connect with other fans and analysts.

### OPERA - The Stadium
Live streaming, betting, rankings, and fantasy leagues. The heart of competitive engagement.

### TENET - The Nexus
Navigate between hubs and access your personalized dashboard.

## Getting Started

1. **Create an account** to track your tokens and progress
2. **Claim your daily tokens** (50-100 NJZ every 24 hours)
3. **Explore the hubs** to find your favorite features
4. **Join the community** on AREPO forums
5. **Start predicting** on OPERA matches

Happy analyzing!`,
          content_html: '<h1>Welcome to 4NJZ4 Platform</h1><p>The <strong>Libre-X-eSport 4NJZ4 TENET Platform</strong> is your ultimate destination...</p>',
          excerpt: 'Introduction to the platform and its five hubs',
          tags: ['getting started', 'overview', 'guide'],
          is_published: true,
          is_help_article: true,
          is_featured: true,
          view_count: 1205,
          helpful_count: 234,
          not_helpful_count: 12,
          version: 1,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        setRelatedArticles([
          { id: 2, slug: 'daily-tokens', title: 'How to Claim Daily Tokens', excerpt: 'Learn about daily login bonuses...', helpful_count: 189, view_count: 892, is_featured: true, tags: [], updated_at: new Date().toISOString() },
          { id: 3, slug: 'platform-guide', title: 'Platform Navigation Guide', excerpt: 'Understanding the five hubs...', helpful_count: 156, view_count: 654, is_featured: false, tags: [], updated_at: new Date().toISOString() },
        ]);

        setIsLoading(false);
      }, 500);
    } else {
      // Show wiki home
      setIsLoading(false);
    }
  }, [currentSlug]);

  const handleFeedback = async (feedback: { is_helpful: boolean; feedback?: string }) => {
    // Submit feedback to API
    console.log('Feedback submitted:', feedback);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9d4edd]" />
      </div>
    );
  }

  // Wiki Home (no article selected)
  if (!currentSlug || !article) {
    return (
      <div className="min-h-screen bg-[#050505] pt-20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Knowledge Base
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Find guides, tutorials, and answers to common questions about the 4NJZ4 platform.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <WikiSearch placeholder="Search knowledge base..." />
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <GlassCard
                key={cat.id}
                className="p-6 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => navigate(`/wiki/category/${cat.slug}`)}
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{cat.name}</h3>
                <p className="text-sm text-white/60 mb-4">{cat.description}</p>
                <div className="text-xs text-white/40">{cat.article_count} articles</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Article View
  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 overflow-hidden"
              >
                <GlassCard className="p-4 sticky top-24">
                  {/* Search */}
                  <WikiSearch 
                    placeholder="Search..." 
                    className="mb-4"
                  />

                  {/* Navigation */}
                  <nav className="space-y-1">
                    <a
                      href="/wiki"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Wiki Home
                    </a>

                    {categories.map((cat) => (
                      <div key={cat.id}>
                        <a
                          href={`/wiki/category/${cat.slug}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <span className="w-4 h-4 flex items-center justify-center text-xs">
                            {cat.icon}
                          </span>
                          {cat.name}
                          <span className="ml-auto text-xs text-white/40">
                            {cat.article_count}
                          </span>
                        </a>
                      </div>
                    ))}
                  </nav>

                  {/* Tags */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                      Popular Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {['getting started', 'tokens', 'betting', 'fantasy', 'forum'].map((tag) => (
                        <a
                          key={tag}
                          href={`/wiki/tag/${tag}`}
                          className="px-2 py-1 text-xs bg-white/5 text-white/60 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                        >
                          {tag}
                        </a>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Sidebar Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mb-4 -ml-2"
            >
              <Menu className="w-4 h-4 mr-1" />
              {sidebarOpen ? 'Hide' : 'Show'} Menu
            </Button>

            {/* Article */}
            <WikiArticleViewer
              article={article}
              onFeedback={handleFeedback}
            />

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-white mb-4">Related Articles</h3>
                <div className="grid gap-4">
                  {relatedArticles.map((related) => (
                    <GlassCard
                      key={related.id}
                      className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => navigate(`/wiki/${related.slug}`)}
                    >
                      <h4 className="font-medium text-white">{related.title}</h4>
                      {related.excerpt && (
                        <p className="text-sm text-white/60 mt-1">{related.excerpt}</p>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default WikiPage;
