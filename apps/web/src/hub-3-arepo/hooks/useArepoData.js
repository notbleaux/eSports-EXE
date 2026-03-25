/**
 * useArepoData Hook - Cross-Reference Engine for AREPO Hub
 * Enables cross-hub queries between SATOR (Component B) and OPERA (Component D)
 * 
 * [Ver003.000] - Added Cross-Reference Engine functionality
 * [Ver002.000] - Migrated to backend search API
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '@/utils/logger';
import { useNJZStore } from '@/shared/store/njzStore';
import { 
  searchAll, 
  searchPlayers, 
  searchTeams, 
  searchMatches,
  getSearchSuggestions 
} from '@/api/search';
import { debounce } from '@/utils/debounce';

// Cross-reference API client
import { 
  getPlayerTournamentPerformance,
  getPatchPerformanceImpact,
  compareTeamsAcrossTournaments,
  executeCrossHubQuery,
  getQueryHistory,
  saveQuery,
  deleteSavedQuery
} from '@/api/crossReference';

// Mock data for development - replace with actual API calls

const logger = createLogger('useArepoData');
const MOCK_DOCUMENTATION = [
  { 
    id: 1, 
    title: 'Platform Overview', 
    category: 'getting-started', 
    content: 'Comprehensive overview of the NJZiteGeisTe platform...',
    lastUpdated: '2026-03-10',
    views: 2400
  },
  { 
    id: 2, 
    title: 'Authentication Guide', 
    category: 'api-docs', 
    content: 'How to authenticate with the SATOR API...',
    lastUpdated: '2026-03-08',
    views: 1800
  },
  { 
    id: 3, 
    title: 'SimRating Explained', 
    category: 'tutorials', 
    content: 'Understanding the SimRating calculation methodology...',
    lastUpdated: '2026-03-12',
    views: 3200
  },
  { 
    id: 4, 
    title: 'Data Pipeline Setup', 
    category: 'tutorials', 
    content: 'Setting up your local data pipeline...',
    lastUpdated: '2026-03-05',
    views: 1500
  },
  { 
    id: 5, 
    title: 'Common Errors', 
    category: 'faq', 
    content: 'Solutions to common integration errors...',
    lastUpdated: '2026-03-11',
    views: 4100
  },
];

const MOCK_QUESTIONS = [
  { 
    id: 1, 
    question: 'How do I interpret SimRating values?',
    answer: 'SimRating values range from 0-100, with higher values indicating better predicted performance...',
    answers: 3, 
    status: 'answered',
    askedAt: '2026-03-12T10:30:00Z',
    askedBy: 'user123'
  },
  { 
    id: 2, 
    question: 'What is the RAR metric?',
    answer: 'RAR (Risk-Adjusted Return) measures performance relative to risk taken...',
    answers: 5, 
    status: 'answered',
    askedAt: '2026-03-11T15:45:00Z',
    askedBy: 'analyst_pro'
  },
  { 
    id: 3, 
    question: 'API rate limits for free tier?',
    answer: 'Free tier allows 100 requests per minute with burst capacity of 150...',
    answers: 2, 
    status: 'answered',
    askedAt: '2026-03-10T09:20:00Z',
    askedBy: 'dev_newbie'
  },
  { 
    id: 4, 
    question: 'Custom data export formats',
    answers: 0, 
    status: 'open',
    askedAt: '2026-03-12T14:15:00Z',
    askedBy: 'data_wizard'
  },
];

const CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', itemCount: 12 },
  { id: 'api-docs', name: 'API Documentation', itemCount: 24 },
  { id: 'tutorials', name: 'Tutorials', itemCount: 18 },
  { id: 'faq', name: 'FAQ', itemCount: 36 },
  { id: 'community', name: 'Community', itemCount: 156 },
];

/**
 * Custom hook for AREPO hub data management with cross-reference engine
 * @param {Object} options - Configuration options
 * @returns {Object} AREPO data and utilities
 */
export function useArepoData(options = {}) {
  const { 
    autoFetch = true,
    categoryFilter = null,
    searchQuery = '',
    searchType = 'all', // 'all' | 'players' | 'teams' | 'matches'
    useBackendSearch = true, // Toggle between client and server-side search
    debounceMs = 300
  } = options;

  const addNotification = useNJZStore(state => state.addNotification);
  const abortControllerRef = useRef(null);
  
  // State
  const [documentation, setDocumentation] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Backend search results
  const [searchResults, setSearchResults] = useState({
    players: [],
    teams: [],
    matches: [],
    total: 0
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalQuestions: 0,
    answeredRate: 0,
    contributors: 0
  });

  /**
   * Fetch all AREPO data
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setDocumentation(MOCK_DOCUMENTATION);
      setQuestions(MOCK_QUESTIONS);
      setCategories(CATEGORIES);
      
      setStats({
        totalDocs: MOCK_DOCUMENTATION.length,
        totalQuestions: 1847,
        answeredRate: 94,
        contributors: 324
      });

    } catch (err) {
      setError(err.message || 'Failed to fetch AREPO data');
      addNotification('Failed to load directory data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  /**
   * Backend search implementation using API
   */
  const performBackendSearch = useCallback(async (query, type = 'all') => {
    if (!query.trim()) {
      setSearchResults({ players: [], teams: [], matches: [], total: 0 });
      setSearchSuggestions([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const results = await searchAll({
        q: query,
        type: type === 'all' ? undefined : type,
        limit: 20,
        sort: 'relevance'
      });

      setSearchResults({
        players: results.players || [],
        teams: results.teams || [],
        matches: results.matches || [],
        total: results.total || 0
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSearchError(err.message || 'Search failed');
        logger.error('Backend search error', { error: err.message });
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);

  /**
   * Debounced backend search
   */
  const debouncedBackendSearch = useRef(
    debounce((query, type) => performBackendSearch(query, type), debounceMs)
  ).current;

  /**
   * Fetch search suggestions for autocomplete
   */
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await getSearchSuggestions(query, 'all', 10);
      setSearchSuggestions(response.suggestions || []);
    } catch (err) {
      // Silently fail for suggestions
      setSearchSuggestions([]);
    }
  }, []);

  const debouncedFetchSuggestions = useRef(
    debounce((query) => fetchSuggestions(query), 150)
  ).current;

  /**
   * Client-side search (fallback/legacy)
   */
  const clientSideSearch = useCallback((query) => {
    if (!query.trim()) {
      return { docs: documentation, questions: questions };
    }

    const lowerQuery = query.toLowerCase();
    
    const filteredDocs = documentation.filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
    );

    const filteredQuestions = questions.filter(q => 
      q.question.toLowerCase().includes(lowerQuery) ||
      (q.answer && q.answer.toLowerCase().includes(lowerQuery))
    );

    return { docs: filteredDocs, questions: filteredQuestions };
  }, [documentation, questions]);

  /**
   * Unified search function
   */
  const search = useCallback((query) => {
    if (useBackendSearch) {
      debouncedBackendSearch(query, searchType);
      debouncedFetchSuggestions(query);
      return { docs: documentation, questions: questions };
    } else {
      return clientSideSearch(query);
    }
  }, [useBackendSearch, searchType, documentation, questions, debouncedBackendSearch, debouncedFetchSuggestions, clientSideSearch]);

  /**
   * Direct search players API
   */
  const searchPlayersOnly = useCallback(async (query) => {
    setSearchLoading(true);
    try {
      const results = await searchPlayers({ q: query, limit: 20 });
      setSearchResults(prev => ({ ...prev, players: results.results || [] }));
      return results.results || [];
    } catch (err) {
      setSearchError(err.message);
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  /**
   * Direct search teams API
   */
  const searchTeamsOnly = useCallback(async (query) => {
    setSearchLoading(true);
    try {
      const results = await searchTeams({ q: query, limit: 20 });
      setSearchResults(prev => ({ ...prev, teams: results.results || [] }));
      return results.results || [];
    } catch (err) {
      setSearchError(err.message);
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  /**
   * Direct search matches API
   */
  const searchMatchesOnly = useCallback(async (query) => {
    setSearchLoading(true);
    try {
      const results = await searchMatches({ q: query, limit: 20 });
      setSearchResults(prev => ({ ...prev, matches: results.results || [] }));
      return results.results || [];
    } catch (err) {
      setSearchError(err.message);
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  /**
   * Filter by category (client-side only)
   */
  const filterByCategory = useCallback((categoryId) => {
    if (!categoryId) {
      return { docs: documentation, questions: questions };
    }

    const filteredDocs = documentation.filter(doc => doc.category === categoryId);
    return { docs: filteredDocs, questions: questions };
  }, [documentation, questions]);

  /**
   * Submit a new question
   */
  const submitQuestion = useCallback(async (questionData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newQuestion = {
        id: Date.now(),
        ...questionData,
        status: 'open',
        answers: 0,
        askedAt: new Date().toISOString()
      };

      setQuestions(prev => [newQuestion, ...prev]);
      addNotification('Question submitted successfully', 'success');
      
      return newQuestion;
    } catch (err) {
      addNotification('Failed to submit question', 'error');
      throw err;
    }
  }, [addNotification]);

  /**
   * Submit an answer to a question
   */
  const submitAnswer = useCallback(async (questionId, answer) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, answers: q.answers + 1, status: 'answered' }
          : q
      ));

      addNotification('Answer submitted successfully', 'success');
    } catch (err) {
      addNotification('Failed to submit answer', 'error');
      throw err;
    }
  }, [addNotification]);

  /**
   * Get popular resources
   */
  const getPopularResources = useCallback((limit = 5) => {
    return [...documentation]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }, [documentation]);

  /**
   * Get recent questions
   */
  const getRecentQuestions = useCallback((limit = 10) => {
    return [...questions]
      .sort((a, b) => new Date(b.askedAt) - new Date(a.askedAt))
      .slice(0, limit);
  }, [questions]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchResults({ players: [], teams: [], matches: [], total: 0 });
    setSearchSuggestions([]);
    setSearchError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Perform search when searchQuery changes
  useEffect(() => {
    if (searchQuery && useBackendSearch) {
      debouncedBackendSearch(searchQuery, searchType);
      debouncedFetchSuggestions(searchQuery);
    }
  }, [searchQuery, searchType, useBackendSearch, debouncedBackendSearch, debouncedFetchSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Filtered data based on current filters
  const filteredData = useBackendSearch
    ? { docs: documentation, questions: questions } // Backend search uses separate searchResults
    : searchQuery 
      ? clientSideSearch(searchQuery)
      : categoryFilter 
        ? filterByCategory(categoryFilter)
        : { docs: documentation, questions: questions };

  return {
    // Data
    documentation: filteredData.docs,
    questions: filteredData.questions,
    categories,
    stats,
    
    // Backend search results
    searchResults,
    searchSuggestions,
    
    // Loading states
    isLoading,
    searchLoading,
    error,
    searchError,
    
    // Actions
    fetchData,
    search,
    searchPlayers: searchPlayersOnly,
    searchTeams: searchTeamsOnly,
    searchMatches: searchMatchesOnly,
    clearSearch,
    filterByCategory,
    submitQuestion,
    submitAnswer,
    getPopularResources,
    getRecentQuestions,
    
    // Utilities
    refresh: fetchData
  };
}

/**
 * Hook for Cross-Reference Engine functionality
 * Enables cross-hub queries between SATOR and OPERA
 */
export function useCrossReferenceEngine() {
  const addNotification = useNJZStore(state => state.addNotification);
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);
  
  // Results state
  const [playerTournamentResult, setPlayerTournamentResult] = useState(null);
  const [patchImpactResult, setPatchImpactResult] = useState(null);
  const [teamComparisonResult, setTeamComparisonResult] = useState(null);
  const [crossHubResult, setCrossHubResult] = useState(null);

  /**
   * Cross-reference: Player + Tournament
   * Query SATOR for player performance, OPERA for tournament metadata
   */
  const getPlayerTournamentStats = useCallback(async (playerId, tournamentId) => {
    if (!playerId || !tournamentId) {
      setError('Player ID and Tournament ID are required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPlayerTournamentPerformance(playerId, tournamentId);
      setPlayerTournamentResult(result);
      
      // Add to query history
      addToHistory({
        type: 'player-tournament',
        playerId,
        tournamentId,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch player tournament stats');
      addNotification('Failed to load player tournament data', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  /**
   * Cross-reference: Patch + Performance
   * Query OPERA for patch changes, SATOR for performance before/after
   */
  const getPatchPerformanceImpact = useCallback(async (patchVersion, agentName) => {
    if (!patchVersion || !agentName) {
      setError('Patch version and agent name are required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPatchPerformanceImpact(patchVersion, agentName);
      setPatchImpactResult(result);
      
      // Add to query history
      addToHistory({
        type: 'patch-impact',
        patchVersion,
        agentName,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch patch performance impact');
      addNotification('Failed to load patch impact data', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  /**
   * Cross-reference: Team comparison across tournaments
   * Query SATOR for both teams' stats, OPERA for tournament contexts
   */
  const compareTeamsAcrossTournaments = useCallback(async (teamA, teamB, tournaments) => {
    if (!teamA || !teamB) {
      setError('Both teams are required for comparison');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await compareTeamsAcrossTournaments(teamA, teamB, tournaments);
      setTeamComparisonResult(result);
      
      // Add to query history
      addToHistory({
        type: 'team-comparison',
        teamA,
        teamB,
        tournaments,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to compare teams');
      addNotification('Failed to load team comparison data', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  /**
   * Execute custom cross-hub query
   */
  const executeQuery = useCallback(async (queryConfig) => {
    if (!queryConfig || Object.keys(queryConfig).length === 0) {
      setError('Query configuration is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await executeCrossHubQuery(queryConfig);
      setCrossHubResult(result);
      
      // Add to query history
      addToHistory({
        type: 'custom',
        config: queryConfig,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to execute cross-hub query');
      addNotification('Failed to execute query', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  /**
   * Add query to history
   */
  const addToHistory = useCallback((query) => {
    setQueryHistory(prev => {
      const newHistory = [query, ...prev].slice(0, 50); // Keep last 50 queries
      // Persist to localStorage
      try {
        localStorage.setItem('arepo_query_history', JSON.stringify(newHistory));
      } catch (e) {
        // Ignore storage errors
      }
      return newHistory;
    });
  }, []);

  /**
   * Load query history from localStorage
   */
  const loadQueryHistory = useCallback(async () => {
    try {
      const stored = localStorage.getItem('arepo_query_history');
      if (stored) {
        setQueryHistory(JSON.parse(stored));
      }
    } catch (e) {
      logger.error('Failed to load query history', { error: e.message });
    }
    
    // Also fetch saved queries from API
    try {
      const saved = await getQueryHistory();
      setSavedQueries(saved.queries || []);
    } catch (e) {
      // Silent fail
    }
  }, []);

  /**
   * Save a query for later use
   */
  const saveQueryForLater = useCallback(async (query, name) => {
    try {
      await saveQuery({ ...query, name });
      addNotification('Query saved successfully', 'success');
      
      // Refresh saved queries
      const saved = await getQueryHistory();
      setSavedQueries(saved.queries || []);
    } catch (err) {
      addNotification('Failed to save query', 'error');
    }
  }, [addNotification]);

  /**
   * Delete a saved query
   */
  const deleteSavedQueryById = useCallback(async (queryId) => {
    try {
      await deleteSavedQuery(queryId);
      setSavedQueries(prev => prev.filter(q => q.id !== queryId));
      addNotification('Query deleted', 'info');
    } catch (err) {
      addNotification('Failed to delete query', 'error');
    }
  }, [addNotification]);

  /**
   * Clear all query history
   */
  const clearQueryHistory = useCallback(() => {
    setQueryHistory([]);
    try {
      localStorage.removeItem('arepo_query_history');
    } catch (e) {
      // Ignore storage errors
    }
    addNotification('Query history cleared', 'info');
  }, [addNotification]);

  /**
   * Clear current results
   */
  const clearResults = useCallback(() => {
    setPlayerTournamentResult(null);
    setPatchImpactResult(null);
    setTeamComparisonResult(null);
    setCrossHubResult(null);
    setError(null);
  }, []);

  // Load history on mount
  useEffect(() => {
    loadQueryHistory();
  }, [loadQueryHistory]);

  return {
    // Results
    playerTournamentResult,
    patchImpactResult,
    teamComparisonResult,
    crossHubResult,
    
    // History and saved queries
    queryHistory,
    savedQueries,
    
    // Loading and error states
    isLoading,
    error,
    
    // Actions
    getPlayerTournamentStats,
    getPatchPerformanceImpact,
    compareTeamsAcrossTournaments,
    executeQuery,
    saveQuery: saveQueryForLater,
    deleteSavedQuery: deleteSavedQueryById,
    clearQueryHistory,
    clearResults,
    loadQueryHistory
  };
}

/**
 * Hook for managing a single document
 */
export function useDocument(docId) {
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const addNotification = useNJZStore(state => state.addNotification);

  const fetchDocument = useCallback(async () => {
    if (!docId) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const doc = MOCK_DOCUMENTATION.find(d => d.id === parseInt(docId));
      if (doc) {
        setDocument(doc);
      } else {
        throw new Error('Document not found');
      }
    } catch (err) {
      addNotification('Failed to load document', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [docId, addNotification]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  return { document, isLoading, refresh: fetchDocument };
}

/**
 * Hook for managing a single question
 */
export function useQuestion(questionId) {
  const [question, setQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const addNotification = useNJZStore(state => state.addNotification);

  const fetchQuestion = useCallback(async () => {
    if (!questionId) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const q = MOCK_QUESTIONS.find(q => q.id === parseInt(questionId));
      if (q) {
        setQuestion(q);
      } else {
        throw new Error('Question not found');
      }
    } catch (err) {
      addNotification('Failed to load question', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [questionId, addNotification]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  return { question, isLoading, refresh: fetchQuestion };
}

/**
 * Hook for search with real-time suggestions
 */
export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (query, type = 'all') => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getSearchSuggestions(query, type, 10);
      setSuggestions(response.suggestions || []);
    } catch (err) {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedFetchSuggestions = useRef(
    debounce((query, type) => fetchSuggestions(query, type), 150)
  ).current;

  return {
    suggestions,
    isLoading,
    fetchSuggestions: debouncedFetchSuggestions,
    clearSuggestions: () => setSuggestions([])
  };
}

export default useArepoData;
