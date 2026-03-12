/**
 * useArepoData Hook
 * Data fetching and state management for AREPO Hub
 * Handles documentation, FAQs, and directory data
 */
import { useState, useEffect, useCallback } from 'react';
import { useNJZStore } from '../../shared/store/njzStore';

// Mock data for development - replace with actual API calls
const MOCK_DOCUMENTATION = [
  { 
    id: 1, 
    title: 'Platform Overview', 
    category: 'getting-started', 
    content: 'Comprehensive overview of the Libre-X-eSport platform...',
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
 * Custom hook for AREPO hub data management
 * @param {Object} options - Configuration options
 * @returns {Object} AREPO data and utilities
 */
export function useArepoData(options = {}) {
  const { 
    autoFetch = true,
    categoryFilter = null,
    searchQuery = ''
  } = options;

  const addNotification = useNJZStore(state => state.addNotification);
  
  // State
  const [documentation, setDocumentation] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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
   * Search documentation and questions
   */
  const search = useCallback((query) => {
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
   * Filter by category
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

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Filtered data based on current filters
  const filteredData = searchQuery 
    ? search(searchQuery)
    : categoryFilter 
      ? filterByCategory(categoryFilter)
      : { docs: documentation, questions: questions };

  return {
    // Data
    documentation: filteredData.docs,
    questions: filteredData.questions,
    categories,
    stats,
    
    // Loading state
    isLoading,
    error,
    
    // Actions
    fetchData,
    search,
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

export default useArepoData;
