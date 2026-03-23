/** [Ver001.000] */
/**
 * useHelpSearch Hook
 * ==================
 * React hook for searching help content with debouncing,
 * autocomplete, and personalized results.
 * 
 * @example
 * ```tsx
 * const { results, query, setQuery, isSearching, suggestions } = useHelpSearch();
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '@/utils/logger';
import type {
  SearchResult,
  AutocompleteSuggestion,
  UserExpertiseProfile,
} from '@sator/types/help';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useHelpSearch');

// ============================================================================
// Hook Options
// ============================================================================

export interface UseHelpSearchOptions {
  /** Search API endpoint */
  apiEndpoint?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Minimum query length to trigger search */
  minQueryLength?: number;
  /** Maximum results to return */
  maxResults?: number;
  /** User expertise profile for personalization */
  userProfile?: UserExpertiseProfile;
  /** Auto-search on query change */
  autoSearch?: boolean;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseHelpSearchReturn {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: SearchResult[];
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Error if any occurred */
  error: Error | null;
  /** Autocomplete suggestions */
  suggestions: AutocompleteSuggestion[];
  /** Whether suggestions are loading */
  isLoadingSuggestions: boolean;
  /** Execute search manually */
  search: (query: string) => Promise<void>;
  /** Clear search results */
  clear: () => void;
  /** Select a suggestion */
  selectSuggestion: (suggestion: string) => Promise<void>;
  /** Recent searches */
  recentSearches: string[];
  /** Clear recent searches */
  clearRecentSearches: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

const RECENT_SEARCHES_KEY = 'help_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export function useHelpSearch(
  options: UseHelpSearchOptions = {}
): UseHelpSearchReturn {
  const {
    apiEndpoint = '/api/v1/help/search',
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 10,
    userProfile,
    autoSearch = true,
  } = options;

  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches(prev => {
      const normalized = searchQuery.trim();
      const filtered = prev.filter(s => s.toLowerCase() !== normalized.toLowerCase());
      const updated = [normalized, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      
      return updated;
    });
  }, []);

  /**
   * Execute search
   */
  const executeSearch = useCallback(async (searchQuery: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if query is too short
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsSearching(true);
      setError(null);

      const params = new URLSearchParams({
        q: searchQuery,
        limit: maxResults.toString(),
      });

      const response = await fetch(`${apiEndpoint}?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(userProfile && { 'X-User-Profile': JSON.stringify(userProfile) }),
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: SearchResult[] = await response.json();
      
      if (!controller.signal.aborted) {
        setResults(data);
        saveRecentSearch(searchQuery);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      
      setError(err instanceof Error ? err : new Error('Search failed'));
      logger.error('Search error', {
        error: err instanceof Error ? err.message : String(err),
        query: searchQuery,
      });
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [apiEndpoint, minQueryLength, maxResults, userProfile, saveRecentSearch]);

  /**
   * Fetch autocomplete suggestions
   */
  const fetchSuggestions = useCallback(async (partial: string) => {
    if (partial.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoadingSuggestions(true);

      const response = await fetch(
        `${apiEndpoint}/suggestions?q=${encodeURIComponent(partial)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data: AutocompleteSuggestion[] = await response.json();
      setSuggestions(data);
    } catch (err) {
      logger.error('Error fetching suggestions', {
        error: err instanceof Error ? err.message : String(err),
        partial,
      });
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [apiEndpoint, minQueryLength]);

  /**
   * Set query with debounced search
   */
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (autoSearch) {
      // Debounce the search
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(newQuery);
      }, debounceMs);
    }

    // Fetch suggestions immediately (with shorter debounce)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newQuery);
    }, Math.min(debounceMs, 100));
  }, [autoSearch, debounceMs, executeSearch, fetchSuggestions]);

  /**
   * Manual search function
   */
  const search = useCallback(async (searchQuery: string) => {
    setQueryState(searchQuery);
    await executeSearch(searchQuery);
  }, [executeSearch]);

  /**
   * Clear search results
   */
  const clear = useCallback(() => {
    setQueryState('');
    setResults([]);
    setSuggestions([]);
    setError(null);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  /**
   * Select a suggestion and search
   */
  const selectSuggestion = useCallback(async (suggestion: string) => {
    setQueryState(suggestion);
    setSuggestions([]);
    await executeSearch(suggestion);
  }, [executeSearch]);

  /**
   * Clear recent searches
   */
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    suggestions,
    isLoadingSuggestions,
    search,
    clear,
    selectSuggestion,
    recentSearches,
    clearRecentSearches,
  };
}

export default useHelpSearch;
