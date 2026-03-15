/** [Ver001.000] */
/**
 * Help Panel
 * ==========
 * Slide-out help panel with wiki navigation and search.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  BookOpen, 
  ChevronRight,
  HelpCircle,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { WikiArticleSummary, WikiCategory, WikiNavigationItem } from './types';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentArticleSlug?: string;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose,
  currentArticleSlug,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [articles, setArticles] = useState<WikiArticleSummary[]>([]);
  const [navigation, setNavigation] = useState<WikiNavigationItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Mock data - replace with API calls
  useEffect(() => {
    if (isOpen) {
      // Load categories
      setCategories([
        { id: 1, slug: 'getting-started', name: 'Getting Started', icon: 'rocket', article_count: 5, sort_order: 1, is_help_category: true },
        { id: 2, slug: 'platform-guide', name: 'Platform Guide', icon: 'compass', article_count: 12, sort_order: 2, is_help_category: true },
        { id: 3, slug: 'token-economy', name: 'Token Economy', icon: 'coins', article_count: 4, sort_order: 3, is_help_category: true },
        { id: 4, slug: 'troubleshooting', name: 'Troubleshooting', icon: 'tool', article_count: 8, sort_order: 4, is_help_category: true },
      ]);

      // Load navigation
      setNavigation([
        { id: 1, menu_key: 'help_panel', title: 'Welcome Guide', article_slug: 'welcome-to-4njz4', sort_order: 1, icon: 'book-open', is_visible: true, children: [] },
        { id: 2, menu_key: 'help_panel', title: 'How to Earn Tokens', article_slug: 'earning-tokens', sort_order: 2, icon: 'coins', is_visible: true, children: [] },
        { id: 3, menu_key: 'help_panel', title: 'Betting Guide', article_slug: 'betting-guide', sort_order: 3, icon: 'trending-up', is_visible: true, children: [] },
        { id: 4, menu_key: 'help_panel', title: 'Community Rules', article_slug: 'community-guidelines', sort_order: 4, icon: 'users', is_visible: true, children: [] },
      ]);

      // Load featured articles
      setArticles([
        { id: 1, slug: 'welcome-to-4njz4', title: 'Welcome to 4NJZ4 Platform', excerpt: 'Introduction to the platform and its five hubs...', helpful_count: 234, view_count: 1205, is_featured: true, tags: [], updated_at: new Date().toISOString() },
        { id: 2, slug: 'daily-tokens', title: 'How to Claim Daily Tokens', excerpt: 'Learn about daily login bonuses and streaks...', helpful_count: 189, view_count: 892, is_featured: true, tags: [], updated_at: new Date().toISOString() },
        { id: 3, slug: 'forum-guide', title: 'Using the Forums', excerpt: 'Guide to posting, replying, and voting...', helpful_count: 156, view_count: 654, is_featured: false, tags: [], updated_at: new Date().toISOString() },
      ]);
    }
  }, [isOpen]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
      // Mock search - replace with API call
      setTimeout(() => {
        setIsSearching(false);
      }, 300);
    } else {
      setIsSearching(false);
    }
  };

  const filteredArticles = searchQuery.length >= 2
    ? articles.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#9d4edd]" />
                <h2 className="text-lg font-semibold text-white">Help Center</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search help articles..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#9d4edd]"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Quick Links / Navigation */}
              {!searchQuery && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
                    Quick Links
                  </h3>
                  <div className="space-y-1">
                    {navigation.map((item) => (
                      <a
                        key={item.id}
                        href={`/wiki/${item.article_slug}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <BookOpen className="w-4 h-4 text-white/40 group-hover:text-[#9d4edd]" />
                        <span className="text-white/80 group-hover:text-white flex-1">
                          {item.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {!searchQuery && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
                    Browse by Category
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          selectedCategory === cat.id
                            ? 'bg-[#9d4edd]/20 border-[#9d4edd]/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-2xl mb-1">{cat.icon}</div>
                        <div className="text-sm font-medium text-white">{cat.name}</div>
                        <div className="text-xs text-white/50">{cat.article_count} articles</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles List */}
              <div>
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
                  {searchQuery ? 'Search Results' : 'Popular Articles'}
                </h3>
                <div className="space-y-2">
                  {filteredArticles.map((article) => (
                    <GlassCard
                      key={article.id}
                      className="p-3 cursor-pointer hover:bg-white/10 transition-colors"
                      glowColor={currentArticleSlug === article.slug ? '#9d4edd' : undefined}
                      onClick={() => window.location.href = `/wiki/${article.slug}`}
                    >
                      <h4 className="font-medium text-white mb-1">{article.title}</h4>
                      {article.excerpt && (
                        <p className="text-sm text-white/60 line-clamp-2">{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        <span>{article.view_count.toLocaleString()} views</span>
                        <span>{article.helpful_count} found helpful</span>
                      </div>
                    </GlassCard>
                  ))}
                  {filteredArticles.length === 0 && searchQuery && (
                    <div className="text-center py-8 text-white/50">
                      <p>No articles found matching "{searchQuery}"</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Support */}
              <div className="pt-4 border-t border-white/10">
                <a
                  href="/forum/feedback-support"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-[#9d4edd]" />
                  <div className="flex-1">
                    <div className="font-medium text-white">Contact Support</div>
                    <div className="text-sm text-white/50">Post in our community forum</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/40" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <a
                href="/wiki"
                className="flex items-center justify-center gap-2 text-sm text-[#9d4edd] hover:text-[#b76eff] transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Browse Full Knowledge Base
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HelpPanel;
