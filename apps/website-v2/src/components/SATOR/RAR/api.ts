/** [Ver001.000] */
/**
 * RAR API Client
 * ==============
 * Frontend API client for Risk-Adjusted Rating endpoints.
 */

import type { RARData } from './RARCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface RARCalculationRequest {
  player_id: string;
  player_name?: string;
  role?: string;
  team?: string;
  kills_z: number;
  deaths_z: number;
  adjusted_kill_value_z: number;
  adr_z: number;
  kast_pct_z: number;
  performance_history: number[];
}

interface BatchRARRequest {
  players: RARCalculationRequest[];
}

// API client with error handling
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate RAR for a single player
 */
export async function calculateRAR(request: RARCalculationRequest): Promise<RARData> {
  return apiFetch<RARData>('/sator/players/rar', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Calculate RAR for multiple players (batch)
 */
export async function batchCalculateRAR(request: BatchRARRequest): Promise<RARData[]> {
  return apiFetch<RARData[]>('/sator/players/batch/rar', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Calculate volatility metrics
 */
export async function calculateVolatility(
  player_id: string,
  performance_scores: number[]
): Promise<{
  player_id: string;
  coefficient_of_variation: number;
  volatility_score: number;
  consistency_rating: string;
  sample_size: number;
  trend_direction: string;
  trend_strength: number;
}> {
  return apiFetch('/sator/players/volatility', {
    method: 'POST',
    body: JSON.stringify({ player_id, performance_scores }),
  });
}

/**
 * Get RAR leaderboard
 */
export async function getRARLeaderboard(
  limit: number = 100,
  min_matches: number = 10,
  role?: string
): Promise<Array<{
  rank: number;
  player_id: string;
  player_name: string;
  team?: string;
  rar_normalized: number;
  investment_grade: string;
  trend_direction: string;
}>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    min_matches: min_matches.toString(),
  });
  if (role) params.append('role', role);
  
  return apiFetch(`/sator/rar/leaderboard?${params}`);
}

/**
 * Get players by investment grade
 */
export async function getPlayersByGrade(
  grade: 'A+' | 'A' | 'B' | 'C' | 'D',
  limit: number = 50
): Promise<{
  grade: string;
  count: number;
  players: RARData[];
}> {
  return apiFetch(`/sator/rar/investment-grades?grade=${grade}&limit=${limit}`);
}

/**
 * Get RAR system metrics
 */
export async function getRARMetrics(): Promise<{
  total_calculations: number;
  average_rar: number;
  grade_distribution: Record<string, number>;
  system_health: string;
  last_update: string;
}> {
  return apiFetch('/sator/rar/metrics');
}

export default {
  calculateRAR,
  batchCalculateRAR,
  calculateVolatility,
  getRARLeaderboard,
  getPlayersByGrade,
  getRARMetrics,
};
