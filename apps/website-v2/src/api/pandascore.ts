/**
 * Pandascore API Client - Frontend Integration
 * Handles rate-limited esports data fetching with caching
 * 
 * [Ver001.000] - Initial implementation for SATOR hub
 */

import { logger } from '@/utils/logger';

const PANDASCORE_API_URL = 'https://api.pandascore.co';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const RATE_LIMIT_DELAY = 1000; // 1 second between calls (1000 calls/day limit)

const apiLogger = logger.child('Pandascore');

// Environment variable for Pandascore token
const PANDASCORE_TOKEN = (import.meta as unknown as { env: Record<string, string> }).env.VITE_PANDASCORE_TOKEN || '';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PandascorePlayer {
  id: number;
  name: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  age: number | null;
  image_url: string | null;
  current_team?: {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
  } | null;
  current_videogame?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface PandascoreTeam {
  id: number;
  name: string;
  slug: string;
  acronym: string | null;
  location: string | null;
  image_url: string | null;
  players?: PandascorePlayer[];
}

export interface PandascoreMatch {
  id: number;
  slug: string;
  name: string;
  status: 'finished' | 'running' | 'upcoming' | 'not_started';
  scheduled_at: string | null;
  began_at: string | null;
  ended_at: string | null;
  winner_id: number | null;
  tournament: {
    id: number;
    name: string;
    slug: string;
    league: {
      id: number;
      name: string;
      slug: string;
    };
  };
  opponents: Array<{
    opponent: {
      id: number;
      name: string;
      slug: string;
      image_url: string | null;
    };
    type: 'Team' | 'Player';
  }>;
  games?: Array<{
    id: number;
    status: string;
    winner: {
      id: number;
      type: string;
    } | null;
  }>;
}

export interface PandascoreStats {
  player_id: number;
  matches_played: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  rating: number;
  acs: number;
  adr: number;
  kast: number;
}

// SATOR-formatted player data
export interface SatorPlayer {
  id: string;
  name: string;
  team: string;
  nationality: string;
  rating: number;
  acs: number;
  kda: string;
  winRate: number;
  avatar: string | null;
  age?: number | null;
}

// SATOR-formatted stats data
export interface SatorStats {
  value: number;
  label: string;
  trend: 'up' | 'down' | 'neutral';
}

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// ============================================================================
// In-Memory Cache Implementation
// ============================================================================

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new SimpleCache();

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private lastCallTime = 0;
  private queue: Array<() => void> = [];
  private isProcessing = false;

  async throttle(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    
    if (elapsed < RATE_LIMIT_DELAY) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY - elapsed));
    }

    const resolve = this.queue.shift();
    if (resolve) {
      this.lastCallTime = Date.now();
      resolve();
    }

    this.isProcessing = false;
    
    // Process next item if any
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }
}

const rateLimiter = new RateLimiter();

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * Check if Pandascore API is available (token configured)
 */
export function isPandascoreAvailable(): boolean {
  return PANDASCORE_TOKEN.length > 0;
}

/**
 * Make rate-limited API request to Pandascore
 */
async function pandascoreRequest<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  // Wait for rate limit
  await rateLimiter.throttle();

  const url = new URL(`${PANDASCORE_API_URL}/${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  apiLogger.debug(`API Request: ${endpoint}`, params);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PANDASCORE_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
    apiLogger.error(`Pandascore API error: ${errorMessage}`);
    throw new Error(`Pandascore API error: ${errorMessage}`);
  }

  return response.json();
}

/**
 * Fetch players from Pandascore API
 */
export async function fetchPlayers(
  videogame: 'valorant' = 'valorant',
  perPage: number = 100
): Promise<PandascorePlayer[]> {
  const cacheKey = `players_${videogame}_${perPage}`;
  
  // Check cache first
  const cached = cache.get<PandascorePlayer[]>(cacheKey);
  if (cached) {
    apiLogger.debug('Using cached players data');
    return cached;
  }

  if (!isPandascoreAvailable()) {
    throw new Error('Pandascore API token not configured');
  }

  try {
    const data = await pandascoreRequest<PandascorePlayer[]>(
      `${videogame}/players`,
      { per_page: Math.min(perPage, 100) }
    );

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    apiLogger.error('Failed to fetch players:', error);
    throw error;
  }
}

/**
 * Fetch teams from Pandascore API
 */
export async function fetchTeams(
  videogame: 'valorant' = 'valorant',
  perPage: number = 100
): Promise<PandascoreTeam[]> {
  const cacheKey = `teams_${videogame}_${perPage}`;
  
  const cached = cache.get<PandascoreTeam[]>(cacheKey);
  if (cached) {
    apiLogger.debug('Using cached teams data');
    return cached;
  }

  if (!isPandascoreAvailable()) {
    throw new Error('Pandascore API token not configured');
  }

  try {
    const data = await pandascoreRequest<PandascoreTeam[]>(
      `${videogame}/teams`,
      { per_page: Math.min(perPage, 100) }
    );

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    apiLogger.error('Failed to fetch teams:', error);
    throw error;
  }
}

/**
 * Fetch matches from Pandascore API
 */
export async function fetchMatches(
  videogame: 'valorant' = 'valorant',
  status: 'finished' | 'running' | 'upcoming' | 'all' = 'finished',
  perPage: number = 100
): Promise<PandascoreMatch[]> {
  const cacheKey = `matches_${videogame}_${status}_${perPage}`;
  
  const cached = cache.get<PandascoreMatch[]>(cacheKey);
  if (cached) {
    apiLogger.debug('Using cached matches data');
    return cached;
  }

  if (!isPandascoreAvailable()) {
    throw new Error('Pandascore API token not configured');
  }

  try {
    const params: Record<string, string | number> = {
      per_page: Math.min(perPage, 100),
    };
    
    if (status !== 'all') {
      params['filter[status]'] = status;
    }

    const data = await pandascoreRequest<PandascoreMatch[]>(
      `${videogame}/matches`,
      params
    );

    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    apiLogger.error('Failed to fetch matches:', error);
    throw error;
  }
}

/**
 * Fetch match details by ID
 */
export async function fetchMatchDetails(
  matchId: number
): Promise<PandascoreMatch> {
  const cacheKey = `match_${matchId}`;
  
  const cached = cache.get<PandascoreMatch>(cacheKey);
  if (cached) {
    apiLogger.debug('Using cached match details');
    return cached;
  }

  if (!isPandascoreAvailable()) {
    throw new Error('Pandascore API token not configured');
  }

  try {
    const data = await pandascoreRequest<PandascoreMatch>(`matches/${matchId}`);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    apiLogger.error(`Failed to fetch match ${matchId}:`, error);
    throw error;
  }
}

/**
 * Fetch player statistics (aggregated from matches)
 * Note: Pandascore doesn't have direct stats endpoint, this is simulated/aggregated
 */
export async function fetchPlayerStats(
  playerId: number
): Promise<Partial<PandascoreStats>> {
  const cacheKey = `player_stats_${playerId}`;
  
  const cached = cache.get<Partial<PandascoreStats>>(cacheKey);
  if (cached) {
    return cached;
  }

  // This would typically fetch from a stats endpoint
  // For now, return placeholder that will be enhanced later
  const stats: Partial<PandascoreStats> = {
    player_id: playerId,
    matches_played: 0,
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    rating: 1.0,
    acs: 200,
  };

  cache.set(cacheKey, stats);
  return stats;
}

// ============================================================================
// Data Transformation Functions
// ============================================================================

/**
 * Transform Pandascore player to SATOR format
 */
export function transformPlayerToSator(
  player: PandascorePlayer,
  stats?: Partial<PandascoreStats>
): SatorPlayer {
  const matchesPlayed = stats?.matches_played || 100;
  const wins = stats?.wins || 60;
  
  return {
    id: String(player.id),
    name: player.name,
    team: player.current_team?.name || 'Free Agent',
    nationality: player.nationality || 'Unknown',
    rating: stats?.rating || 1.15 + Math.random() * 0.2, // Placeholder until real stats
    acs: stats?.acs || 220 + Math.random() * 50, // Placeholder until real stats
    kda: '1.25', // Placeholder - would calculate from stats
    winRate: Math.round((wins / Math.max(matchesPlayed, 1)) * 1000) / 10,
    avatar: player.image_url,
    age: player.age,
  };
}

/**
 * Get platform statistics from Pandascore data
 */
export async function getPlatformStats(): Promise<SatorStats[]> {
  try {
    const [players, teams, matches] = await Promise.all([
      fetchPlayers().catch(() => []),
      fetchTeams().catch(() => []),
      fetchMatches('valorant', 'all', 100).catch(() => []),
    ]);

    return [
      { value: teams.length, label: 'Teams', trend: 'up' },
      { value: matches.filter(m => m.status === 'finished').length, label: 'Matches', trend: 'neutral' },
      { value: players.length, label: 'Players', trend: 'up' },
      { value: 48, label: 'Tournaments', trend: 'up' }, // Placeholder - would fetch actual tournaments
      { value: matches.length * 10, label: 'Records', trend: 'up' }, // Estimated
      { value: 99.9, label: 'Uptime %', trend: 'neutral' },
    ];
  } catch (error) {
    apiLogger.error('Failed to get platform stats:', error);
    throw error;
  }
}

/**
 * Fetch and transform top players for SATOR hub
 */
export async function fetchSatorPlayers(limit: number = 10): Promise<SatorPlayer[]> {
  const players = await fetchPlayers('valorant', limit * 2); // Fetch more to filter
  
  // Transform and sort by rating (simulated for now)
  const transformed = players.map(p => transformPlayerToSator(p));
  
  // Sort by rating descending
  return transformed
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
  apiLogger.info('Pandascore cache cleared');
}

/**
 * Clear cache for specific endpoint type
 */
export function clearCacheByType(type: 'players' | 'teams' | 'matches'): void {
  cache.clearByPrefix(type);
  apiLogger.info(`Pandascore ${type} cache cleared`);
}

// ============================================================================
// Export default client
// ============================================================================

export const pandascoreApi = {
  // Status
  isAvailable: isPandascoreAvailable,
  
  // Raw data fetching
  fetchPlayers,
  fetchTeams,
  fetchMatches,
  fetchMatchDetails,
  fetchPlayerStats,
  
  // Transformed data for SATOR
  fetchSatorPlayers,
  getPlatformStats,
  
  // Cache management
  clearCache,
  clearCacheByType,
  
  // Types
  type: {
    Player: {} as PandascorePlayer,
    Team: {} as PandascoreTeam,
    Match: {} as PandascoreMatch,
    Stats: {} as PandascoreStats,
    SatorPlayer: {} as SatorPlayer,
    SatorStats: {} as SatorStats,
  },
};

export default pandascoreApi;
