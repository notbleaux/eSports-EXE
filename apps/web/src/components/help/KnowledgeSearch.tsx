/** [Ver001.000] */
/**
 * KnowledgeSearch Component
 * =========================
 * Search interface for help documentation with autocomplete,
 * filters, and recent searches.
 * 
 * Features:
 * - Real-time search with debouncing
 * - Autocomplete suggestions
 * - Category filtering
 * - Recent searches
 * - "Did you mean?" suggestions
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Clock, 
  Filter, 
  ChevronRight,
  BookOpen,
  Lightbulb,
  Code,
  GraduationCap,
  FileText,
  Sparkles,
  History,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { 
  SearchResult, 
  SearchFilters, 
  SearchCategory,
  KnowledgeNodeType 
} from '../../lib/help/knowledge-types';
import type { SearchIndex } from '../../lib/help/search-index';
import { 
  search as searchIndex, 
  getAutocompleteSuggestions,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches
} from '../../lib/help/search-index';

// ============================================================================
// Types
// ============================================================================

export interface KnowledgeSearchProps {
  /** Search index to query */
  index: SearchIndex;
  /** Called when a result is selected */
  onSelect?: (result: SearchResult) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className */
  className?: string;
  /** Initial filters */
  initialFilters?: SearchFilters;
  /** Show filters UI */
  showFilters?: boolean;
  /** Maximum results to display */
  maxResults?: number;
  /** Debounce delay in ms */
  debounceMs?: number;
}

interface SuggestionItem {
  text: string;
  type: 'recent' | 'suggestion' | 'autocomplete';
  icon?: React.ReactNode;
}

// ============================================================================
// Category Configuration
// ============================================================================

const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: React.ReactNode }> = {
  all: { label: 'All', icon: <Sparkles className="w-4 h-4" /> },
  feature: { label: 'Features', icon: <Code className="w-4 h-4" /> },
  concept: { label: 'Concepts', icon: <Lightbulb className="w-4 h-4" /> },
  tutorial: { label: 'Tutorials', icon: <GraduationCap className="w-4 h-4" /> },
  guide: { label: 'Guides', icon: <BookOpen className="w-4 h-4" /> },
  reference: { label: 'Reference', icon: <FileText className="w-4 h-4" /> },
};

const TYPE_ICONS: Record<KnowledgeNodeType, React.ReactNode> = {
  concept: <Lightbulb className="w-4 h-4" />,
  topic: <BookOpen className="w-4 h-4" />,
  feature: <Code className="w-4 h-4" />,
  tutorial: <GraduationCap className="w-4 h-4" />,
  guide: <BookOpen className="w-4 h-4" />,
  reference: <FileText className="w-4 h-4" />,
  hub: <Sparkles className="w-4 h-4" />,
  page: <FileText className="w-4 h-4" />,
  command: <Code className="w-4 h-4" />,
  setting: <Filter className="w-4 h-4" />,
};

// ============================================================================
// Component
// ============================================================================

export const KnowledgeSearch: React.FC<KnowledgeSearchProps> = ({
  index,
  onSelect,
  placeholder = 'Search help documentation...',
  className,
  initialFilters = {},
  showFilters = true,
  maxResults = 10,
  debounceMs = 150,
}) => {
  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [didYouMean, setDidYouMean] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search with debouncing
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setDidYouMean([]);
      setSuggestions(getRecentSearches().map(r => ({ text: r, type: 'recent' })));
      return;
    }

    setIsLoading(true);

    const { results: searchResults, suggestions: searchSuggestions } = searchIndex(index, {
      query: searchQuery,
      filters,
      pageSize: maxResults,
    });

    setResults(searchResults);
    setDidYouMean(searchSuggestions);
    setIsLoading(false);
  }, [index, filters, maxResults]);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch, debounceMs]);

  // Update autocomplete suggestions
  useEffect(() => {
    if (query.length >= 2) {
      const autocomplete = getAutocompleteSuggestions(index, query, 5);
      setSuggestions(autocomplete.map(text => ({ text, type: 'autocomplete' })));
    } else {
      const recent = getRecentSearches();
      setSuggestions(recent.map(text => ({ text, type: 'recent', icon: <Clock className="w-4 h-4" /> })));
    }
  }, [query, index]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    addRecentSearch(query);
    setRecentSearches(getRecentSearches());
    onSelect?.(result);
    setIsOpen(false);
    setQuery('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
    inputRef.current?.focus();
  };

  // Handle "Did you mean" click
  const handleDidYouMeanClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  // Clear recent searches
  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
    setSuggestions([]);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setDidYouMean([]);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? results : suggestions;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          if (query && results[activeIndex]) {
            handleSelect(results[activeIndex]);
          } else if (suggestions[activeIndex]) {
            handleSuggestionClick(suggestions[activeIndex].text);
          }
        } else if (query) {
          performSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Filter change handler
  const handleFilterChange = (category: SearchCategory) => {
    setFilters(prev => ({ ...prev, category }));
    if (query) {
      performSearch(query);
    }
  };

  // Render score badge
  const renderScore = (score: number) => {
    const percentage = Math.round(score * 100);
    let colorClass = 'bg-gray-100 text-gray-600';
    if (percentage >= 80) colorClass = 'bg-green-100 text-green-700';
    else if (percentage >= 50) colorClass = 'bg-yellow-100 text-yellow-700';
    else if (percentage >= 30) colorClass = 'bg-orange-100 text-orange-700';

    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colorClass)}>
        {percentage}%
      </span>
    );
  };

  // Render difficulty badge
  const renderDifficulty = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      advanced: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      expert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', colors[difficulty] || colors.beginner)}>
        {difficulty}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-all duration-200"
          aria-label="Search help documentation"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="search-results"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-10 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
          </div>
        )}

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 
                       dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="search-results"
          role="listbox"
          className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                     border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Filters */}
          {showFilters && (
            <div className="border-b border-gray-200 dark:border-gray-700 p-2">
              <div className="flex items-center gap-1 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400 mr-1" />
                {(Object.keys(CATEGORY_CONFIG) as SearchCategory[]).map(category => (
                  <button
                    key={category}
                    onClick={() => handleFilterChange(category)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                      filters.category === category || (category === 'all' && !filters.category)
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {CATEGORY_CONFIG[category].icon}
                    {CATEGORY_CONFIG[category].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* "Did you mean?" */}
          {didYouMean.length > 0 && (
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Did you mean: </span>
              {didYouMean.map((suggestion, i) => (
                <button
                  key={suggestion}
                  onClick={() => handleDidYouMeanClick(suggestion)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline mx-1 font-medium"
                >
                  {suggestion}
                  {i < didYouMean.length - 1 && ','}
                </button>
              ))}
            </div>
          )}

          {/* Results or Suggestions */}
          <div className="max-h-96 overflow-y-auto">
            {results.length > 0 ? (
              // Search Results
              <div className="py-2">
                <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Results ({results.length})
                </div>
                {results.map((result, index) => (
                  <button
                    key={result.node.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors flex items-start gap-3',
                      activeIndex === index
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                    role="option"
                    aria-selected={activeIndex === index}
                  >
                    <div className="flex-shrink-0 mt-0.5 text-gray-400">
                      {TYPE_ICONS[result.node.type]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 
                          className="font-medium text-gray-900 dark:text-gray-100 truncate"
                          dangerouslySetInnerHTML={{ 
                            __html: result.highlights?.title || result.node.title 
                          }}
                        />
                        {renderScore(result.score)}
                      </div>
                      
                      <p 
                        className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                        dangerouslySetInnerHTML={{ 
                          __html: result.highlights?.description || result.highlights?.excerpt || result.node.description 
                        }}
                      />
                      
                      <div className="flex items-center gap-2 mt-2">
                        {renderDifficulty(result.node.difficulty)}
                        {result.node.hub && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {result.node.hub}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            ) : query ? (
              // No results
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No results found for &quot;{query}&quot;</p>
                <p className="text-sm mt-1">Try different keywords or check your spelling</p>
              </div>
            ) : (
              // Suggestions (recent searches + autocomplete)
              <div className="py-2">
                {suggestions.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {suggestions[0]?.type === 'recent' ? (
                          <><History className="w-3.5 h-3.5" /> Recent Searches</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" /> Suggestions</>
                        )}
                      </span>
                      {suggestions[0]?.type === 'recent' && (
                        <button
                          onClick={handleClearRecent}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.text}`}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          'w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3',
                          activeIndex === index
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        )}
                      >
                        <span className="text-gray-400">
                          {suggestion.icon || <Search className="w-4 h-4" />}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{suggestion.text}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Quick links */}
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Popular Topics
                  </div>
                  {['Getting Started', 'SimRating', 'Tactical View', 'API Access'].map((topic, index) => (
                    <button
                      key={topic}
                      onClick={() => handleSuggestionClick(topic)}
                      className="w-full px-4 py-2 text-left text-gray-600 dark:text-gray-300 hover:bg-gray-50 
                                 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-primary-500" />
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>
              {results.length > 0 
                ? `Showing ${results.length} result${results.length !== 1 ? 's' : ''}`
                : 'Start typing to search'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-600 rounded border">↑↓</kbd>
              to navigate
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-600 rounded border ml-2">Enter</kbd>
              to select
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeSearch;
