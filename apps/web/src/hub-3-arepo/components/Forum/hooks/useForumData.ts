/**
 * AREPO Forum Data Hook
 * Manages forum data fetching, caching, and mutations
 * 
 * [Ver001.000] - Initial hook implementation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ForumCategory,
  ForumThread,
  ForumPost,
  UserProfile,
  CreateThreadData,
  CreateReplyData,
  ThreadFilters,
  PaginationState,
} from '../types';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CATEGORIES: ForumCategory[] = [
  { 
    id: 'getting-started', 
    name: 'Getting Started', 
    icon: 'BookOpen', 
    description: 'New to the platform? Start here',
    threadCount: 42,
    color: '#0066ff'
  },
  { 
    id: 'vct-discussion', 
    name: 'VCT Discussion', 
    icon: 'Trophy', 
    description: 'Talk about VCT matches and teams',
    threadCount: 156,
    color: '#0066ff'
  },
  { 
    id: 'strategy', 
    name: 'Strategy', 
    icon: 'Brain', 
    description: 'Share and discuss tactics',
    threadCount: 89,
    color: '#0066ff'
  },
  { 
    id: 'general', 
    name: 'General', 
    icon: 'MessageSquare', 
    description: 'Off-topic discussions',
    threadCount: 234,
    color: '#0066ff'
  },
];

const MOCK_USERS: Record<string, UserProfile> = {
  'user-1': {
    id: 'user-1',
    name: 'RadiantPlayer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RadiantPlayer',
    joinDate: '2024-01-15T00:00:00Z',
    reputation: 1250,
    role: 'moderator',
    postCount: 342,
  },
  'user-2': {
    id: 'user-2',
    name: 'ValorantFan2024',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ValorantFan2024',
    joinDate: '2024-03-20T00:00:00Z',
    reputation: 89,
    role: 'user',
    postCount: 23,
  },
  'user-3': {
    id: 'user-3',
    name: 'TacticalMind',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TacticalMind',
    joinDate: '2023-11-08T00:00:00Z',
    reputation: 567,
    role: 'user',
    postCount: 128,
  },
  'user-4': {
    id: 'user-4',
    name: 'EsportsAnalyst',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EsportsAnalyst',
    joinDate: '2023-06-12T00:00:00Z',
    reputation: 2100,
    role: 'admin',
    postCount: 892,
  },
};

const generateMockThreads = (categoryId: string, count: number = 10): ForumThread[] => {
  const users = Object.values(MOCK_USERS);
  const titles = [
    'How do I interpret SimRating values?',
    'What is the RAR metric and how is it calculated?',
    'Best strategies for Ascent defense?',
    'VCT Masters analysis - Team Liquid vs FNATIC',
    'API rate limits for free tier?',
    'Custom data export formats',
    'Understanding the SATOR data pipeline',
    'New patch impact on agent pick rates',
    'Best duos for ranked climbing?',
    'Economy management guide',
    'Clutch situation analysis',
    'Map control fundamentals',
  ];

  return Array.from({ length: count }, (_, i) => {
    const author = users[Math.floor(Math.random() * users.length)];
    const isPinned = i < 2 && categoryId === 'getting-started';
    const replies = Math.floor(Math.random() * 50);
    
    return {
      id: `thread-${categoryId}-${i}`,
      categoryId,
      title: titles[i % titles.length] + (i > titles.length ? ` (${Math.floor(i / titles.length) + 1})` : ''),
      author,
      content: `This is a sample post content for discussion. In a real implementation, this would contain the full post text with markdown formatting support.\n\n**Key points:**\n- Point 1\n- Point 2\n- Point 3`,
      replies,
      views: Math.floor(Math.random() * 1000) + 50,
      isPinned,
      isLocked: false,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      lastReplyAt: replies > 0 ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString() : undefined,
      lastReplyBy: replies > 0 ? users[Math.floor(Math.random() * users.length)] : undefined,
      tags: ['discussion', 'help'],
    };
  });
};

const generateMockPosts = (threadId: string, count: number = 5): ForumPost[] => {
  const users = Object.values(MOCK_USERS);
  
  return Array.from({ length: count }, (_, i) => {
    const author = users[Math.floor(Math.random() * users.length)];
    
    return {
      id: `post-${threadId}-${i}`,
      threadId,
      author,
      content: i === 0 
        ? 'This is the original post content. It would contain the full discussion starter with all the details.'
        : `This is reply #${i}. Great discussion! I think there are several factors to consider here.`,
      likes: Math.floor(Math.random() * 20),
      isLikedByMe: false,
      isEdited: i === 1,
      editedAt: i === 1 ? new Date().toISOString() : undefined,
      createdAt: new Date(Date.now() - (count - i) * 3600000).toISOString(),
      replyTo: i > 1 ? `post-${threadId}-${i - 1}` : undefined,
    };
  });
};

// ============================================================================
// HOOK INTERFACE
// ============================================================================

interface UseForumDataReturn {
  // Data
  categories: ForumCategory[];
  threads: ForumThread[];
  currentThread: ForumThread | null;
  posts: ForumPost[];
  currentUser: UserProfile | null;
  
  // Loading states
  loading: {
    categories: boolean;
    threads: boolean;
    thread: boolean;
    posts: boolean;
    creating: boolean;
  };
  
  // Errors
  error: string | null;
  
  // Filters & Pagination
  filters: ThreadFilters;
  pagination: PaginationState;
  
  // Actions
  fetchCategories: () => Promise<void>;
  fetchThreads: (categoryId?: string) => Promise<void>;
  fetchThread: (threadId: string) => Promise<void>;
  fetchPosts: (threadId: string, page?: number) => Promise<void>;
  createThread: (data: CreateThreadData) => Promise<ForumThread | null>;
  createReply: (data: CreateReplyData) => Promise<ForumPost | null>;
  setFilters: (filters: Partial<ThreadFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: ThreadFilters = {
  sortBy: 'last-activity',
  showPinned: true,
};

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 0,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useForumData(): UseForumDataReturn {
  // Data state
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [currentUser] = useState<UserProfile | null>(MOCK_USERS['user-2']);
  
  // Loading states
  const [loading, setLoading] = useState({
    categories: false,
    threads: false,
    thread: false,
    posts: false,
    creating: false,
  });
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Filters & pagination
  const [filters, setFiltersState] = useState<ThreadFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
  
  // Cache refs
  const threadsCache = useRef<Record<string, ForumThread[]>>({});
  const postsCache = useRef<Record<string, ForumPost[]>>({});

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(prev => ({ ...prev, categories: true }));
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production: const response = await fetch('/api/v1/forum/categories');
      setCategories(MOCK_CATEGORIES);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, []);

  const fetchThreads = useCallback(async (categoryId?: string): Promise<void> => {
    setLoading(prev => ({ ...prev, threads: true }));
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // In production: 
      // const params = new URLSearchParams({ categoryId, ...filters, page: pagination.page });
      // const response = await fetch(`/api/v1/forum/threads?${params}`);
      
      const cacheKey = categoryId || 'all';
      let mockThreads = threadsCache.current[cacheKey];
      
      if (!mockThreads) {
        mockThreads = categoryId 
          ? generateMockThreads(categoryId, 15)
          : Object.values(MOCK_CATEGORIES).flatMap(cat => generateMockThreads(cat.id, 5));
        threadsCache.current[cacheKey] = mockThreads;
      }
      
      // Apply filters
      let filteredThreads = [...mockThreads];
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredThreads = filteredThreads.filter(t => 
          t.title.toLowerCase().includes(searchLower) ||
          t.author.name.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort threads
      filteredThreads.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        switch (filters.sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'most-replies':
            return b.replies - a.replies;
          case 'most-views':
            return b.views - a.views;
          case 'last-activity':
          default:
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
      });
      
      // Paginate
      const total = filteredThreads.length;
      const totalPages = Math.ceil(total / pagination.perPage);
      const start = (pagination.page - 1) * pagination.perPage;
      const paginatedThreads = filteredThreads.slice(start, start + pagination.perPage);
      
      setThreads(paginatedThreads);
      setPagination(prev => ({ ...prev, total, totalPages }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threads');
    } finally {
      setLoading(prev => ({ ...prev, threads: false }));
    }
  }, [filters, pagination.page, pagination.perPage]);

  const fetchThread = useCallback(async (threadId: string): Promise<void> => {
    setLoading(prev => ({ ...prev, thread: true }));
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // In production: const response = await fetch(`/api/v1/forum/threads/${threadId}`);
      
      // Find thread in cache or create mock
      const cachedThread = Object.values(threadsCache.current)
        .flat()
        .find(t => t.id === threadId);
      
      if (cachedThread) {
        setCurrentThread(cachedThread);
      } else {
        // Create a mock thread if not found
        const mockThread: ForumThread = {
          id: threadId,
          categoryId: 'general',
          title: 'Thread Not Found',
          author: MOCK_USERS['user-1'],
          content: 'This thread could not be found.',
          replies: 0,
          views: 0,
          isPinned: false,
          isLocked: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentThread(mockThread);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch thread');
    } finally {
      setLoading(prev => ({ ...prev, thread: false }));
    }
  }, []);

  const fetchPosts = useCallback(async (threadId: string, page: number = 1): Promise<void> => {
    setLoading(prev => ({ ...prev, posts: true }));
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production: const response = await fetch(`/api/v1/forum/threads/${threadId}/posts?page=${page}`);
      
      let mockPosts = postsCache.current[threadId];
      
      if (!mockPosts) {
        mockPosts = generateMockPosts(threadId, 8);
        postsCache.current[threadId] = mockPosts;
      }
      
      setPosts(mockPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  }, []);

  // ============================================================================
  // MUTATION FUNCTIONS
  // ============================================================================

  const createThread = useCallback(async (data: CreateThreadData): Promise<ForumThread | null> => {
    setLoading(prev => ({ ...prev, creating: true }));
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In production:
      // const response = await fetch('/api/v1/forum/threads', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
      if (!currentUser) {
        throw new Error('You must be logged in to create a thread');
      }
      
      const newThread: ForumThread = {
        id: `thread-${Date.now()}`,
        categoryId: data.categoryId,
        title: data.title,
        author: currentUser,
        content: data.content,
        replies: 0,
        views: 0,
        isPinned: false,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: data.tags,
      };
      
      // Update cache
      const cacheKey = data.categoryId;
      if (!threadsCache.current[cacheKey]) {
        threadsCache.current[cacheKey] = [];
      }
      threadsCache.current[cacheKey].unshift(newThread);
      
      return newThread;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thread');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  }, [currentUser]);

  const createReply = useCallback(async (data: CreateReplyData): Promise<ForumPost | null> => {
    setLoading(prev => ({ ...prev, creating: true }));
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // In production:
      // const response = await fetch(`/api/v1/forum/threads/${data.threadId}/replies`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: data.content, replyTo: data.replyTo }),
      // });
      
      if (!currentUser) {
        throw new Error('You must be logged in to reply');
      }
      
      const newPost: ForumPost = {
        id: `post-${Date.now()}`,
        threadId: data.threadId,
        author: currentUser,
        content: data.content,
        likes: 0,
        isLikedByMe: false,
        isEdited: false,
        createdAt: new Date().toISOString(),
        replyTo: data.replyTo,
      };
      
      // Update cache
      if (!postsCache.current[data.threadId]) {
        postsCache.current[data.threadId] = [];
      }
      postsCache.current[data.threadId].push(newPost);
      
      // Update posts state
      setPosts(prev => [...prev, newPost]);
      
      // Update thread reply count
      setCurrentThread(prev => prev ? { 
        ...prev, 
        replies: prev.replies + 1,
        updatedAt: new Date().toISOString(),
      } : null);
      
      return newPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reply');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  }, [currentUser]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const setFilters = useCallback((newFilters: Partial<ThreadFilters>): void => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const setPage = useCallback((page: number): void => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    // Data
    categories,
    threads,
    currentThread,
    posts,
    currentUser,
    
    // Loading states
    loading,
    
    // Errors
    error,
    
    // Filters & Pagination
    filters,
    pagination,
    
    // Actions
    fetchCategories,
    fetchThreads,
    fetchThread,
    fetchPosts,
    createThread,
    createReply,
    setFilters,
    setPage,
    clearError,
  };
}

export default useForumData;
