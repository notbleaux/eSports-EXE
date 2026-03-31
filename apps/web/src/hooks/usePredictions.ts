/**
 * React Hooks for Predictions API
 * 
 * Provides data fetching with loading states and error handling.
 * Phase 3: Frontend Integration
 * 
 * [Ver001.000]
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as predictionsApi from '@/lib/api/predictions';

// --- Query Keys ---

export const predictionKeys = {
  all: ['predictions'] as const,
  match: (id: number) => [...predictionKeys.all, 'match', id] as const,
  cached: (id: number) => [...predictionKeys.all, 'cached', id] as const,
  activeMatches: () => [...predictionKeys.all, 'active-matches'] as const,
  realtimeStats: () => [...predictionKeys.all, 'realtime-stats'] as const,
};

// --- Match Prediction Hook ---

interface UseMatchPredictionOptions {
  team1Id: number;
  team2Id: number;
  currentScoreTeam1?: number;
  currentScoreTeam2?: number;
  roundsPlayed?: number;
  mapId?: string;
  enabled?: boolean;
}

export function useMatchPrediction(
  matchId: number,
  options: UseMatchPredictionOptions
) {
  const {
    team1Id,
    team2Id,
    currentScoreTeam1 = 0,
    currentScoreTeam2 = 0,
    roundsPlayed = 0,
    mapId,
    enabled = true,
  } = options;
  
  return useQuery({
    queryKey: predictionKeys.match(matchId),
    queryFn: () => predictionsApi.getMatchPrediction({
      match_id: matchId,
      team1_id: team1Id,
      team2_id: team2Id,
      current_score_team1: currentScoreTeam1,
      current_score_team2: currentScoreTeam2,
      rounds_played: roundsPlayed,
      map_id: mapId,
    }),
    enabled: !!matchId && !!team1Id && !!team2Id && enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// --- Cached Prediction Hook ---

interface UseCachedPredictionOptions {
  enabled?: boolean;
}

export function useCachedPrediction(
  matchId: number,
  options: UseCachedPredictionOptions = {}
) {
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: predictionKeys.cached(matchId),
    queryFn: () => predictionsApi.getCachedPrediction(matchId),
    enabled: !!matchId && enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// --- Active Matches Hook ---

interface UseActiveMatchesOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export function useActiveMatches(options: UseActiveMatchesOptions = {}) {
  const { refetchInterval = 30000, enabled = true } = options;
  
  return useQuery({
    queryKey: predictionKeys.activeMatches(),
    queryFn: predictionsApi.getActiveMatches,
    enabled,
    refetchInterval,
    staleTime: 10 * 1000, // 10 seconds
  });
}

// --- Realtime Stats Hook ---

interface UseRealtimeStatsOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export function useRealtimeStats(options: UseRealtimeStatsOptions = {}) {
  const { refetchInterval = 30000, enabled = true } = options;
  
  return useQuery({
    queryKey: predictionKeys.realtimeStats(),
    queryFn: predictionsApi.getRealtimeStats,
    enabled,
    refetchInterval,
    staleTime: 5 * 1000, // 5 seconds
  });
}

// --- Prediction Mutation Hook ---

export function useRequestPrediction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: predictionsApi.PredictionRequest) =>
      predictionsApi.getMatchPrediction(request),
    onSuccess: (data, variables) => {
      // Update cached prediction
      queryClient.setQueryData(
        predictionKeys.cached(variables.match_id),
        data
      );
    },
  });
}

// --- Combined Hook for Live Match ---

interface UseLiveMatchPredictionOptions {
  team1Id: number;
  team2Id: number;
  enabled?: boolean;
}

/**
 * Hook that combines polling prediction with WebSocket for live matches.
 * 
 * For real-time updates, use this alongside the WebSocket connection.
 * This hook handles the initial prediction and periodic refreshes.
 */
export function useLiveMatchPrediction(
  matchId: number,
  options: UseLiveMatchPredictionOptions
) {
  const { team1Id, team2Id, enabled = true } = options;
  
  // Get initial/cached prediction
  const cachedQuery = useCachedPrediction(matchId, { enabled: !!matchId && enabled });
  
  // Request fresh prediction periodically
  const liveQuery = useMatchPrediction(matchId, {
    team1Id,
    team2Id,
    enabled: false, // Don't auto-fetch, we'll trigger manually
  });
  
  // Refresh prediction with current score
  const refreshPrediction = (score1: number, score2: number, rounds: number) => {
    liveQuery.refetch();
  };
  
  return {
    prediction: cachedQuery.data || liveQuery.data,
    isLoading: cachedQuery.isLoading || liveQuery.isLoading,
    isError: cachedQuery.isError || liveQuery.isError,
    error: cachedQuery.error || liveQuery.error,
    refreshPrediction,
    lastUpdated: cachedQuery.data?.generated_at,
  };
}

// --- Prediction Confidence Hook ---

export function usePredictionConfidence(matchId: number) {
  const { data: prediction, isLoading } = useCachedPrediction(matchId);
  
  return {
    confidence: prediction?.confidence ?? 0,
    isHighConfidence: (prediction?.confidence ?? 0) > 0.7,
    isMediumConfidence: (prediction?.confidence ?? 0) > 0.4 && (prediction?.confidence ?? 0) <= 0.7,
    isLowConfidence: (prediction?.confidence ?? 0) <= 0.4,
    isLoading,
  };
}

// --- Key Factors Hook ---

export function usePredictionFactors(matchId: number) {
  const { data: prediction, isLoading } = useCachedPrediction(matchId);
  
  const sortedFactors = prediction?.key_factors
    ? [...prediction.key_factors].sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    : [];
  
  return {
    factors: sortedFactors,
    topFactor: sortedFactors[0],
    isLoading,
  };
}
