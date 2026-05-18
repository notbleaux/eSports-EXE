/**
 * Stats API Client
 * 
 * Provides typed methods for interacting with the stats aggregation service.
 * Phase 3: Frontend Integration
 * 
 * [Ver001.000]
 */

import { apiClient, APIError } from './client';

// --- Types ---

export interface AggregatedPlayerStats {
  player_id: number;
  game: string;
  period_days: number;
  matches_played: number;
  wins: number;
  losses: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  total_damage: number;
  total_rounds: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  avg_damage: number;
  avg_kpr: number;
  avg_dpr: number;
  avg_adr: number;
  avg_acs: number;
  avg_kast: number;
  avg_kda: number;
  headshot_pct: number;
  kast_consistency: number;
  acs_consistency: number;
  kda_trend: number;
  acs_trend: number;
  last_updated: string;
}

export interface PlayerPerformanceStats {
  player_id: number;
  match_id: number;
  team_id: number;
  game: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  damage_dealt: number;
  kda: number;
  kd_ratio: number;
  acs: number;
  adr: number;
  kast: number;
  headshot_pct: number;
  rounds_played: number;
  first_bloods: number;
  clutches_won: number;
  recorded_at: string;
}

export interface MatchPerformanceSummary {
  match_id: number;
  game: string;
  team1_id: number;
  team2_id: number;
  team1_score: number;
  team2_score: number;
  total_rounds: number;
  player_stats: PlayerPerformanceStats[];
  team1_kills: number;
  team1_deaths: number;
  team1_damage: number;
  team2_kills: number;
  team2_deaths: number;
  team2_damage: number;
  recorded_at: string;
}

export interface StatsTrend {
  player_id: number;
  metric: string;
  current_value: number;
  previous_value: number;
  trend_percent: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface StatsComparison {
  player1_id: number;
  player2_id: number;
  player1_stats: AggregatedPlayerStats;
  player2_stats: AggregatedPlayerStats;
  h2h_matches: number;
  player1_wins: number;
  player2_wins: number;
  kda_diff: number;
  acs_diff: number;
  adr_diff: number;
  kast_diff: number;
  advantage_player: number | null;
  advantage_metric: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  player_id: number;
  player_name: string;
  value: number;
  stats: Record<string, unknown>;
}

export interface LeaderboardResponse {
  category: string;
  game: string;
  period_days: number;
  entries: LeaderboardEntry[];
  generated_at: string;
}

export interface CacheStats {
  player_stats_cached: number;
  match_summaries_cached: number;
  live_matches_cached: number;
  predictions_cached: number;
  total_cached: number;
}

// --- API Methods ---

/**
 * Get aggregated player statistics.
 */
export async function getPlayerStats(
  playerId: number,
  options?: {
    game?: string;
    periodDays?: number;
    useCache?: boolean;
  }
): Promise<AggregatedPlayerStats> {
  const params = new URLSearchParams();
  if (options?.game) params.append('game', options.game);
  if (options?.periodDays) params.append('period_days', options.periodDays.toString());
  if (options?.useCache !== undefined) params.append('use_cache', options.useCache.toString());
  
  const query = params.toString();
  const url = `/api/v1/stats/player/${playerId}${query ? `?${query}` : ''}`;
  
  const response = await apiClient.get<AggregatedPlayerStats>(url);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to fetch player stats', response.status);
  }
  
  return response.data!;
}

/**
 * Get player stats for a specific match.
 */
export async function getPlayerMatchStats(
  playerId: number,
  matchId: number
): Promise<PlayerPerformanceStats> {
  const url = `/api/v1/stats/match/${matchId}/player/${playerId}`;
  const response = await apiClient.get<PlayerPerformanceStats>(url);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to fetch match stats', response.status);
  }
  
  return response.data!;
}

/**
 * Get match performance summary.
 */
export async function getMatchStats(
  matchId: number,
  useCache = true
): Promise<MatchPerformanceSummary> {
  const url = `/api/v1/stats/match/${matchId}?use_cache=${useCache}`;
  const response = await apiClient.get<MatchPerformanceSummary>(url);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to fetch match stats', response.status);
  }
  
  return response.data!;
}

/**
 * Get player performance trends.
 */
export async function getPlayerTrends(
  playerId: number,
  options?: {
    game?: string;
    currentPeriodDays?: number;
    previousPeriodDays?: number;
  }
): Promise<StatsTrend[]> {
  const params = new URLSearchParams();
  if (options?.game) params.append('game', options.game);
  if (options?.currentPeriodDays) params.append('current_period_days', options.currentPeriodDays.toString());
  if (options?.previousPeriodDays) params.append('previous_period_days', options.previousPeriodDays.toString());
  
  const query = params.toString();
  const url = `/api/v1/stats/player/${playerId}/trends${query ? `?${query}` : ''}`;
  
  const response = await apiClient.get<StatsTrend[]>(url);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to fetch trends', response.status);
  }
  
  return response.data!;
}

/**
 * Compare two players.
 */
export async function comparePlayers(
  player1Id: number,
  player2Id: number,
  options?: {
    game?: string;
    periodDays?: number;
  }
): Promise<StatsComparison> {
  const params = new URLSearchParams();
  params.append('player1_id', player1Id.toString());
  params.append('player2_id', player2Id.toString());
  if (options?.game) params.append('game', options.game);
  if (options?.periodDays) params.append('period_days', options.periodDays.toString());
  
  const response = await apiClient.get<StatsComparison>(`/api/v1/stats/compare?${params}`);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to compare players', response.status);
  }
  
  return response.data!;
}

/**
 * Get leaderboard for a category.
 */
export async function getLeaderboard(
  category: 'kda' | 'acs' | 'adr' | 'kast' | 'kills' | 'headshot_pct' = 'kda',
  options?: {
    game?: string;
    limit?: number;
    periodDays?: number;
  }
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams();
  params.append('category', category);
  if (options?.game) params.append('game', options.game);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.periodDays) params.append('period_days', options.periodDays.toString());
  
  const response = await apiClient.get<LeaderboardResponse>(`/api/v1/stats/leaderboard?${params}`);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to fetch leaderboard', response.status);
  }
  
  return response.data!;
}

/**
 * Invalidate player cache (admin only).
 */
export async function invalidatePlayerCache(
  playerId: number,
  game = 'valorant'
): Promise<{ message: string }> {
  const url = `/api/v1/stats/cache/invalidate/${playerId}?game=${game}`;
  const response = await apiClient.post<{ message: string }>(url);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to invalidate cache', response.status);
  }
  
  return response.data!;
}

/**
 * Get cache statistics (admin only).
 */
export async function getCacheStats(): Promise<CacheStats> {
  const response = await apiClient.get<CacheStats>('/api/v1/stats/cache/stats');
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to fetch cache stats', response.status);
  }
  
  return response.data!;
}
