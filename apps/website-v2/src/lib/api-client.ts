[Ver001.000]
/**
 * SATOR API Client
 * ================
 * TypeScript client for the SATOR API with JWT authentication.
 * Handles token storage, refresh, and automatic Bearer token injection.
 */

import { useAuthStore } from '@/stores/authStore';

// API Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token refresh buffer (refresh 5 minutes before expiry)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface ApiError extends Error {
  status?: number;
  data?: any;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
  display_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

/**
 * Store tokens in localStorage
 */
function storeTokens(tokens: TokenResponse): void {
  localStorage.setItem('sator_access_token', tokens.access_token);
  localStorage.setItem('sator_refresh_token', tokens.refresh_token);
  localStorage.setItem('sator_token_expires_at', tokens.expires_at);
}

/**
 * Clear all stored tokens
 */
function clearTokens(): void {
  localStorage.removeItem('sator_access_token');
  localStorage.removeItem('sator_refresh_token');
  localStorage.removeItem('sator_token_expires_at');
}

/**
 * Get stored access token
 */
function getAccessToken(): string | null {
  return localStorage.getItem('sator_access_token');
}

/**
 * Get stored refresh token
 */
function getRefreshToken(): string | null {
  return localStorage.getItem('sator_refresh_token');
}

/**
 * Check if token needs refresh
 */
function tokenNeedsRefresh(): boolean {
  const expiresAt = localStorage.getItem('sator_token_expires_at');
  if (!expiresAt) return false;
  
  const expiryTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  
  return expiryTime - currentTime < TOKEN_REFRESH_BUFFER_MS;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Build API URL with optional query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(endpoint, API_BASE_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Core API request function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, any>
): Promise<T> {
  const url = buildUrl(endpoint, params);
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  // Add auth token if available
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle unauthorized - try to refresh token
    if (response.status === 401 && token) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${getAccessToken()}`;
        const retryResponse = await fetch(url, { ...config, headers });
        
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw { status: retryResponse.status, message: error.detail || 'Request failed', data: error };
        }
        
        return retryResponse.json();
      } else {
        // Refresh failed, logout
        clearTokens();
        window.location.href = '/login';
        throw { status: 401, message: 'Session expired' };
      }
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw { status: response.status, message: error.detail || 'Request failed', data: error };
    }
    
    // Handle empty responses
    if (response.status === 204) {
      return undefined as T;
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw { status: 0, message: 'Network error - API unavailable', data: null };
    }
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      clearTokens();
      return false;
    }
    
    const tokens: TokenResponse = await response.json();
    storeTokens(tokens);
    return true;
  } catch (error) {
    clearTokens();
    return false;
  }
}

// =============================================================================
// AUTHENTICATION API
// =============================================================================

export const authApi = {
  /**
   * Register a new user account
   */
  register: async (data: {
    username: string;
    email?: string;
    password: string;
    password_confirm: string;
    display_name?: string;
  }): Promise<User> => {
    return apiRequest<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Login user and store tokens
   */
  login: async (username: string, password: string): Promise<{ user: User; tokens: TokenResponse }> => {
    const response = await apiRequest<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    storeTokens(response);
    
    // Fetch user profile
    const user = await authApi.me();
    
    return { user, tokens: response };
  },
  
  /**
   * Logout user and clear tokens
   */
  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        // Ignore errors during logout
      }
    }
    clearTokens();
  },
  
  /**
   * Get current user profile
   */
  me: async (): Promise<User> => {
    return apiRequest<User>('/auth/me');
  },
  
  /**
   * Update current user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiRequest<User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Change password
   */
  changePassword: async (data: {
    current_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<void> => {
    return apiRequest('/auth/password/change', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    return apiRequest('/auth/password/reset-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  /**
   * Reset password with token
   */
  resetPassword: async (data: {
    token: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<void> => {
    return apiRequest('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// =============================================================================
// TOKENS API
// =============================================================================

export const tokensApi = {
  /**
   * Get current user's token balance
   */
  getBalance: async (): Promise<any> => {
    return apiRequest('/api/tokens/balance');
  },
  
  /**
   * Claim daily tokens
   */
  claimDaily: async (): Promise<any> => {
    return apiRequest('/api/tokens/claim-daily', { method: 'POST' });
  },
  
  /**
   * Get transaction history
   */
  getHistory: async (params?: { page?: number; page_size?: number; transaction_type?: string }): Promise<any> => {
    return apiRequest('/api/tokens/history', {}, params);
  },
  
  /**
   * Get token statistics
   */
  getStats: async (): Promise<any> => {
    return apiRequest('/api/tokens/stats');
  },
  
  /**
   * Get token leaderboard
   */
  getLeaderboard: async (params?: { page?: number; page_size?: number }): Promise<any> => {
    return apiRequest('/api/tokens/leaderboard', {}, params);
  },
};

// =============================================================================
// FORUM API
// =============================================================================

export const forumApi = {
  /**
   * List forum categories
   */
  getCategories: async (): Promise<any[]> => {
    return apiRequest('/api/forum/categories');
  },
  
  /**
   * List threads in a category
   */
  getThreads: async (categoryId: number, params?: { page?: number; page_size?: number; sort_by?: string }): Promise<any> => {
    return apiRequest(`/api/forum/categories/${categoryId}/threads`, {}, params);
  },
  
  /**
   * Get recent threads
   */
  getRecentThreads: async (params?: { page?: number; page_size?: number }): Promise<any> => {
    return apiRequest('/api/forum/threads/recent', {}, params);
  },
  
  /**
   * Create a new thread
   */
  createThread: async (data: { category_id: number; title: string; content: string }): Promise<any> => {
    return apiRequest('/api/forum/threads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Get thread details
   */
  getThread: async (threadId: number): Promise<any> => {
    return apiRequest(`/api/forum/threads/${threadId}`);
  },
  
  /**
   * Create a post/reply
   */
  createPost: async (threadId: number, data: { content: string; parent_id?: number }): Promise<any> => {
    return apiRequest(`/api/forum/threads/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Vote on a post
   */
  votePost: async (postId: number, voteType: 'up' | 'down'): Promise<any> => {
    return apiRequest(`/api/forum/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  },
};

// =============================================================================
// FANTASY API
// =============================================================================

export const fantasyApi = {
  /**
   * List fantasy leagues
   */
  getLeagues: async (params?: { game?: string; league_type?: string }): Promise<any[]> => {
    return apiRequest('/api/fantasy/leagues', {}, params);
  },
  
  /**
   * Create a new league
   */
  createLeague: async (data: any): Promise<any> => {
    return apiRequest('/api/fantasy/leagues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Get league details
   */
  getLeague: async (leagueId: string): Promise<any> => {
    return apiRequest(`/api/fantasy/leagues/${leagueId}`);
  },
  
  /**
   * Get user's teams
   */
  getMyTeams: async (): Promise<any[]> => {
    return apiRequest('/api/fantasy/teams/my');
  },
  
  /**
   * Create/join a team
   */
  createTeam: async (data: { league_id: string; team_name: string }): Promise<any> => {
    return apiRequest('/api/fantasy/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Get team details
   */
  getTeam: async (teamId: string): Promise<any> => {
    return apiRequest(`/api/fantasy/teams/${teamId}`);
  },
  
  /**
   * Get available players for draft
   */
  getAvailablePlayers: async (leagueId: string, params?: { position?: string; search?: string }): Promise<any[]> => {
    return apiRequest(`/api/fantasy/leagues/${leagueId}/players/available`, {}, params);
  },
  
  /**
   * Draft a player
   */
  draftPlayer: async (teamId: string, playerId: string): Promise<any> => {
    return apiRequest(`/api/fantasy/teams/${teamId}/draft`, {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId }),
    });
  },
  
  /**
   * Set lineup
   */
  setLineup: async (teamId: string, lineup: any): Promise<any> => {
    return apiRequest(`/api/fantasy/teams/${teamId}/lineup`, {
      method: 'PATCH',
      body: JSON.stringify(lineup),
    });
  },
};

// =============================================================================
// CHALLENGES API
// =============================================================================

export const challengesApi = {
  /**
   * Get today's daily challenge
   */
  getDaily: async (date?: string): Promise<any> => {
    return apiRequest('/api/challenges/daily', {}, date ? { challenge_date: date } : undefined);
  },
  
  /**
   * Get upcoming challenges
   */
  getUpcoming: async (days?: number): Promise<any[]> => {
    return apiRequest('/api/challenges/upcoming', {}, days ? { days } : undefined);
  },
  
  /**
   * Submit challenge answer
   */
  submitAnswer: async (challengeId: string, answer: string): Promise<any> => {
    return apiRequest(`/api/challenges/${challengeId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  },
  
  /**
   * Get user's challenge streak
   */
  getMyStreak: async (): Promise<any> => {
    return apiRequest('/api/challenges/user/streak');
  },
  
  /**
   * Get user's challenge summary
   */
  getMySummary: async (): Promise<any> => {
    return apiRequest('/api/challenges/user/summary');
  },
  
  /**
   * Check if user has attempted a challenge
   */
  hasAttempted: async (challengeId: string): Promise<{ attempted: boolean }> => {
    return apiRequest(`/api/challenges/${challengeId}/attempted`);
  },
  
  /**
   * Get challenge leaderboard
   */
  getLeaderboard: async (params?: { period?: string; limit?: number }): Promise<any[]> => {
    return apiRequest('/api/challenges/leaderboard', {}, params);
  },
};

// =============================================================================
// WIKI API
// =============================================================================

export const wikiApi = {
  /**
   * List wiki categories
   */
  getCategories: async (): Promise<any[]> => {
    return apiRequest('/api/wiki/categories');
  },
  
  /**
   * Get category by slug
   */
  getCategory: async (slug: string): Promise<any> => {
    return apiRequest(`/api/wiki/categories/${slug}`);
  },
  
  /**
   * List wiki articles
   */
  getArticles: async (params?: { category_id?: number; is_help?: boolean; page?: number }): Promise<any[]> => {
    return apiRequest('/api/wiki/articles', {}, params);
  },
  
  /**
   * Search wiki articles
   */
  searchArticles: async (query: string, params?: { category_id?: number; is_help_only?: boolean }): Promise<any[]> => {
    return apiRequest('/api/wiki/articles/search', {}, { q: query, ...params });
  },
  
  /**
   * Get article by slug
   */
  getArticle: async (slug: string): Promise<any> => {
    return apiRequest(`/api/wiki/articles/${slug}`);
  },
  
  /**
   * Submit article feedback
   */
  submitFeedback: async (articleId: number, isHelpful: boolean, feedback?: string): Promise<void> => {
    return apiRequest(`/api/wiki/articles/${articleId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ is_helpful: isHelpful, feedback }),
    });
  },
  
  /**
   * Get help articles
   */
  getHelpArticles: async (categorySlug?: string): Promise<any[]> => {
    return apiRequest('/api/wiki/help/articles', {}, categorySlug ? { category_slug: categorySlug } : undefined);
  },
  
  /**
   * Search help articles
   */
  searchHelp: async (query: string): Promise<any[]> => {
    return apiRequest('/api/wiki/help/search', {}, { q: query });
  },
};

// =============================================================================
// OPERA API
// =============================================================================

export const operaApi = {
  /**
   * List tournaments
   */
  getTournaments: async (params?: { circuit?: string; season?: string; status?: string }): Promise<any[]> => {
    const response = await apiRequest<{ tournaments: any[] }>('/api/opera/tournaments', {}, params);
    return response.tournaments;
  },
  
  /**
   * Get tournament details
   */
  getTournament: async (tournamentId: string): Promise<any> => {
    return apiRequest(`/api/opera/tournaments/${tournamentId}`);
  },
  
  /**
   * Get tournament schedule
   */
  getSchedule: async (tournamentId: string): Promise<any> => {
    const response = await apiRequest<{ schedule: any[] }>(`/api/opera/tournaments/${tournamentId}/schedule`);
    return response.schedule;
  },
  
  /**
   * Get patch information
   */
  getPatch: async (patchVersion: string): Promise<any> => {
    return apiRequest(`/api/opera/patches/${patchVersion}`);
  },
  
  /**
   * List circuits
   */
  getCircuits: async (region?: string): Promise<any[]> => {
    const response = await apiRequest<{ circuits: any[] }>('/api/opera/circuits', {}, region ? { region } : undefined);
    return response.circuits;
  },
};

// =============================================================================
// EXPORT
// =============================================================================

export default {
  auth: authApi,
  tokens: tokensApi,
  forum: forumApi,
  fantasy: fantasyApi,
  challenges: challengesApi,
  wiki: wikiApi,
  opera: operaApi,
  isAuthenticated,
};
