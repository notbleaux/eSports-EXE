/**
 * Predictions API Client
 * 
 * Provides typed methods for match predictions.
 * Phase 3: Frontend Integration
 * 
 * [Ver001.000]
 */

import { apiClient, APIError } from './client';

// --- Types ---

export interface PredictionRequest {
  match_id: number;
  team1_id: number;
  team2_id: number;
  current_score_team1?: number;
  current_score_team2?: number;
  rounds_played?: number;
  map_id?: string;
}

export interface PredictionResult {
  match_id: number;
  team1_win_probability: number;
  team2_win_probability: number;
  confidence: number;
  key_factors: Array<{
    name?: string;
    factor?: string;
    impact?: number;
    advantage?: string;
  }>;
  generated_at: string;
}

export interface ActiveMatch {
  match_id: number;
  team1_id: number;
  team2_id: number;
  team1_name?: string;
  team2_name?: string;
  status: 'live' | 'upcoming' | 'ended';
  current_round?: number;
  team1_score?: number;
  team2_score?: number;
}

export interface RealtimeStats {
  active_connections: number;
  active_matches: number;
  total_subscriptions: number;
  event_queue_size: number;
}

// --- API Methods ---

/**
 * Get prediction for a match.
 */
export async function getMatchPrediction(request: PredictionRequest): Promise<PredictionResult> {
  const response = await apiClient.post<PredictionResult>('/api/v1/predictions/match', request);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to get prediction', response.status);
  }
  
  return response.data!;
}

/**
 * Get cached prediction for a match.
 */
export async function getCachedPrediction(matchId: number): Promise<PredictionResult> {
  const response = await apiClient.get<PredictionResult>(`/api/v1/predictions/match/${matchId}`);
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to get cached prediction', response.status);
  }
  
  return response.data!;
}

/**
 * Get list of active matches with live updates.
 */
export async function getActiveMatches(): Promise<{ active_matches: number[]; count: number }> {
  const response = await apiClient.get<{ active_matches: number[]; count: number }>('/api/v1/realtime/active-matches');
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to get active matches', response.status);
  }
  
  return response.data!;
}

/**
 * Get real-time system statistics.
 */
export async function getRealtimeStats(): Promise<RealtimeStats> {
  const response = await apiClient.get<RealtimeStats>('/api/v1/realtime/stats');
  
  if (!response.success) {
    throw new APIError(response.error?.message || 'Failed to get realtime stats', response.status);
  }
  
  return response.data!;
}
