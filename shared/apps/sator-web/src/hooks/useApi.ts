import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import type {
  ExtendedPlayer,
  PlayerListResponse,
  ExtendedMatch,
  SimRatingBreakdown,
  RARResponse,
  InvestmentGradeResponse,
  DashboardStats,
  PlayerFilters,
  MatchFilters,
} from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Query keys for cache management
export const queryKeys = {
  health: ['health'] as const,
  players: ['players'] as const,
  player: (id: string) => ['player', id] as const,
  simRating: (id: string, season?: string) => ['simRating', id, season] as const,
  rar: (id: string) => ['rar', id] as const,
  investment: (id: string) => ['investment', id] as const,
  matches: ['matches'] as const,
  match: (id: string) => ['match', id] as const,
  dashboardStats: ['dashboardStats'] as const,
};

// Health check
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async () => {
      const response = await apiClient.get('/api/health');
      return response.data;
    },
    refetchInterval: 30000,
  });
}

// Players
export function usePlayers(filters?: PlayerFilters, offset?: number, limit?: number) {
  return useQuery<PlayerListResponse>({
    queryKey: [...queryKeys.players, filters, offset, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.region) params.append('region', filters.region);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.minMaps) params.append('min_maps', filters.minMaps.toString());
      if (filters?.grade) params.append('grade', filters.grade);
      if (offset) params.append('offset', offset.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get(`/api/players?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlayer(playerId: string) {
  return useQuery<ExtendedPlayer>({
    queryKey: queryKeys.player(playerId),
    queryFn: async () => {
      const response = await apiClient.get(`/api/players/${playerId}`);
      return response.data;
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}

// SimRating
export function useSimRating(playerId: string, season?: string) {
  return useQuery<SimRatingBreakdown>({
    queryKey: queryKeys.simRating(playerId, season),
    queryFn: async () => {
      const params = season ? `?season=${season}` : '';
      const response = await apiClient.get(`/api/analytics/simrating/${playerId}${params}`);
      return response.data;
    },
    enabled: !!playerId,
  });
}

// RAR
export function useRAR(playerId: string) {
  return useQuery<RARResponse>({
    queryKey: queryKeys.rar(playerId),
    queryFn: async () => {
      const response = await apiClient.get(`/api/analytics/rar/${playerId}`);
      return response.data;
    },
    enabled: !!playerId,
  });
}

// Investment Grade
export function useInvestmentGrade(playerId: string) {
  return useQuery<InvestmentGradeResponse>({
    queryKey: queryKeys.investment(playerId),
    queryFn: async () => {
      const response = await apiClient.get(`/api/analytics/investment/${playerId}`);
      return response.data;
    },
    enabled: !!playerId,
  });
}

// Matches
export function useMatches(filters?: MatchFilters) {
  return useQuery<ExtendedMatch[]>({
    queryKey: [...queryKeys.matches, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.map) params.append('map', filters.map);
      if (filters?.tournament) params.append('tournament', filters.tournament);

      const response = await apiClient.get(`/api/matches?${params.toString()}`);
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useMatch(matchId: string) {
  return useQuery<ExtendedMatch>({
    queryKey: queryKeys.match(matchId),
    queryFn: async () => {
      const response = await apiClient.get(`/api/matches/${matchId}`);
      return response.data;
    },
    enabled: !!matchId,
  });
}

// Dashboard Stats
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const response = await apiClient.get('/api/stats/dashboard');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Player Search
export function usePlayerSearch(query: string) {
  return useQuery<ExtendedPlayer[]>({
    queryKey: ['playerSearch', query],
    queryFn: async () => {
      const response = await apiClient.get(`/api/players/search?q=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}

export { apiClient };
