/** [Ver001.000] */
/**
 * Wiki Search
 * ===========
 * Search component for wiki articles.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { WikiArticleSummary } from './types';

interface WikiSearchProps {
  onSearch?: (query: string, results: WikiArticleSummary[]) => void;
  placeholder?: string;
  isHelpOnly?: boolean;
  className?: string;
}

export const WikiSearch: React.FC<WikiSearchProps> = ({
  onSearch,
  placeholder = 'Search help articles...',
  isHelpOnly = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikiArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Mock search - replace with API call
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock results
    const mockResults: WikiArticleSummary[] = [
      {
        id: 1,
        slug: 'welcome-to-4njz4',
        title: 'Welcome to 4NJZ4 Platform',
        category_name: 'Getting Started',
        excerpt: 'Introduction to the platform and its five hubs...',
        helpful_count: 234,
        view_count: 1205,
        is_featured: true,
        tags: ['getting started', 'overview'],
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        slug: 'daily-tokens',
        title: 'How to Claim Daily Tokens',
        category_name: 'Token Economy',
        excerpt: 'Learn about daily login bonuses and streaks...',
        helpful_count: 189,
        view_count: 892,
        is_featured: true,
        tags: ['tokens', 'daily', 'rewards'],
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        slug: 'betting-guide',
        title: 'Betting Guide for Beginners',
        category_name: 'Platform Guide',
        excerpt: 'Understanding odds, placing bets, and strategies...',
        helpful_count: 156,
        view_count: 654,
        is_featured: false,
        tags: ['betting', 'guide', 'odds'],
        updated_at: new Date().toISOString(),
      },
    ].filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setResults(mockResults);
    setIsLoading(false);
    onSearch?.(searchQuery, mockResults);
  }, [onSearch]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, performSearch]);

  const handleSelectResult = (slug: string) => {
    window.location.href = `/wiki/${slug}`;
    setShowResults(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#9d4edd] focus:ring-1 focus:ring-[#9d4edd]/50 transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (query.length >= 2 || results.length > 0) && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResults(false)}
              className="fixed inset-0 z-40"
            />

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <GlassCard className="max-h-80 overflow-y-auto" glowColor="#9d4edd">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-[#9d4edd] animate-spin" />
                    <span className="ml-2 text-white/60">Searching...</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {results.map((article, index) => (
                      <motion.button
                        key={article.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectResult(article.slug)}
                        className="w-full text-left p-3 hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-white/40 group-hover:text-[#9d4edd] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white group-hover:text-[#9d4edd] transition-colors truncate">
                              {article.title}
                            </h4>
                            {article.category_name && (
                              <span className="text-xs text-white/50">
                                {article.category_name}
                              </span>
                            )}
                            {article.excerpt && (
                              <p className="text-sm text-white/60 line-clamp-1 mt-1">
                                {article.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : query.length >= 2 ? (
                  <div className="text-center py-8 text-white/50">
                    <p>No articles found</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                ) : null}

                {/* View All Link */}
                {results.length > 0 && (
                  <div className="p-3 border-t border-white/10">
                    <a
                      href={`/wiki/search?q=${encodeURIComponent(query)}`}
                      className="text-sm text-[#9d4edd] hover:text-[#b76eff] transition-colors flex items-center justify-center gap-1"
                    >
                      View all results
                    </a>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WikiSearch;
