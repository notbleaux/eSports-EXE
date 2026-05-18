/**
 * ROTAS TanStack Query Hooks
 *
 * Wraps @/api/rotas endpoints with caching, error handling, and optimistic updates.
 * PIE-002-B: Players + Teams hooks
 *
 * [Ver001.000]
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  rotasApi,
  type RotasPlayerSummary,
  type RotasPlayerDetail,
  type RotasPlayerStats,
  type RotasTeamSummary,
  type RotasTeamDetail,
  type RotasTeamStats,
  type RotasMatchSummary,
  type RotasMatchDetail,
  type RotasTournamentSummary,
  type PaginatedResponse,
} from '@/api/rotas';

// ============================================================================
// Query Keys
// ============================================================================

export const rotasKeys = {
  all: ['rotas'] as const,
  players: (filters?: Record<string, unknown>) =>
    [...rotasKeys.all, 'players', filters] as const,
  player: (id: number) => [...rotasKeys.all, 'player', id] as const,
  playerStats: (id: number, game?: string) =>
    [...rotasKeys.all, 'player', id, 'stats', game] as const,
  teams: (filters?: Record<string, unknown>) =>
    [...rotasKeys.all, 'teams', filters] as const,
  team: (id: number) => [...rotasKeys.all, 'team', id] as const,
  teamStats: (id: number, game?: string) =>
    [...rotasKeys.all, 'team', id, 'stats', game] as const,
  matches: (filters?: Record<string, unknown>) =>
    [...rotasKeys.all, 'matches', filters] as const,
  match: (id: number) => [...rotasKeys.all, 'match', id] as const,
  liveMatches: (game?: string) =>
    [...rotasKeys.all, 'matches', 'live', game] as const,
  tournaments: (filters?: Record<string, unknown>) =>
    [...rotasKeys.all, 'tournaments', filters] as const,
  leaderboard: (category: string, game: string) =>
    [...rotasKeys.all, 'leaderboard', category, game] as const,
};

// ============================================================================
// Player Hooks
// ============================================================================

interface UsePlayersOptions {
  game?: string;
  teamId?: number;
  search?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function usePlayers(options: UsePlayersOptions = {}) {
  const {
    game,
    teamId,
    search,
    page = 1,
    perPage = 20,
    enabled = true,
  } = options;

  return useQuery<PaginatedResponse<RotasPlayerSummary>>({
    queryKey: rotasKeys.players({ game, teamId, search, page, perPage }),
    queryFn: () => rotasApi.players.list(game, teamId, search, page, perPage),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

interface UsePlayerOptions {
  enabled?: boolean;
}

export function usePlayer(playerId: number, options: UsePlayerOptions = {}) {
  const { enabled = true } = options;

  return useQuery<RotasPlayerDetail>({
    queryKey: rotasKeys.player(playerId),
    queryFn: () => rotasApi.players.get(playerId),
    enabled: !!playerId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

interface UsePlayerStatsOptions {
  game?: string;
  enabled?: boolean;
}

export function usePlayerStats(
  playerId: number,
  options: UsePlayerStatsOptions = {}
) {
  const { game, enabled = true } = options;

  return useQuery<RotasPlayerStats>({
    queryKey: rotasKeys.playerStats(playerId, game),
    queryFn: () => rotasApi.players.stats(playerId, game),
    enabled: !!playerId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// Team Hooks
// ============================================================================

interface UseTeamsOptions {
  game?: string;
  region?: string;
  search?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useTeams(options: UseTeamsOptions = {}) {
  const {
    game,
    region,
    search,
    page = 1,
    perPage = 20,
    enabled = true,
  } = options;

  return useQuery<PaginatedResponse<RotasTeamSummary>>({
    queryKey: rotasKeys.teams({ game, region, search, page, perPage }),
    queryFn: () => rotasApi.teams.list(game, region, search, page, perPage),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

interface UseTeamOptions {
  enabled?: boolean;
}

export function useTeam(teamId: number, options: UseTeamOptions = {}) {
  const { enabled = true } = options;

  return useQuery<RotasTeamDetail>({
    queryKey: rotasKeys.team(teamId),
    queryFn: () => rotasApi.teams.get(teamId),
    enabled: !!teamId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

interface UseTeamStatsOptions {
  game?: string;
  enabled?: boolean;
}

export function useTeamStats(
  teamId: number,
  options: UseTeamStatsOptions = {}
) {
  const { game, enabled = true } = options;

  return useQuery<RotasTeamStats>({
    queryKey: rotasKeys.teamStats(teamId, game),
    queryFn: () => rotasApi.teams.stats(teamId, game),
    enabled: !!teamId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// Match Hooks (complement existing useStats)
// ============================================================================

interface UseMatchesOptions {
  game?: string;
  teamId?: number;
  status?: 'not_started' | 'running' | 'finished';
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useMatches(options: UseMatchesOptions = {}) {
  const {
    game,
    teamId,
    status,
    page = 1,
    perPage = 20,
    enabled = true,
  } = options;

  return useQuery<PaginatedResponse<RotasMatchSummary>>({
    queryKey: rotasKeys.matches({ game, teamId, status, page, perPage }),
    queryFn: () => rotasApi.matches.list(game, teamId, status, page, perPage),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useMatch(matchId: number, enabled = true) {
  return useQuery<RotasMatchDetail>({
    queryKey: rotasKeys.match(matchId),
    queryFn: () => rotasApi.matches.get(matchId),
    enabled: !!matchId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

interface UseLiveMatchesOptions {
  game?: string;
  limit?: number;
  enabled?: boolean;
}

export function useLiveMatches(options: UseLiveMatchesOptions = {}) {
  const { game = 'valorant', limit = 20, enabled = true } = options;

  return useQuery<RotasMatchSummary[]>({
    queryKey: rotasKeys.liveMatches(game),
    queryFn: () => rotasApi.matches.live(game, limit),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ============================================================================
// Tournament Hooks
// ============================================================================

interface UseTournamentsOptions {
  game?: string;
  status?: 'upcoming' | 'ongoing' | 'finished';
  tier?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useTournaments(options: UseTournamentsOptions = {}) {
  const {
    game,
    status,
    tier,
    page = 1,
    perPage = 20,
    enabled = true,
  } = options;

  return useQuery<PaginatedResponse<RotasTournamentSummary>>({
    queryKey: rotasKeys.tournaments({ game, status, tier, page, perPage }),
    queryFn: () => rotasApi.tournaments.list(game, status, tier, page, perPage),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

// ============================================================================
// Leaderboard Hooks
// ============================================================================

interface UseLeaderboardOptions {
  game?: string;
  minMatches?: number;
  limit?: number;
  enabled?: boolean;
}

export function useKDLeaderboard(options: UseLeaderboardOptions = {}) {
  const {
    game = 'valorant',
    minMatches = 5,
    limit = 20,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: rotasKeys.leaderboard('kd', game),
    queryFn: () => rotasApi.leaderboards.kd(game, minMatches, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useADRLeaderboard(options: UseLeaderboardOptions = {}) {
  const {
    game = 'valorant',
    minMatches = 5,
    limit = 20,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: rotasKeys.leaderboard('adr', game),
    queryFn: () => rotasApi.leaderboards.adr(game, minMatches, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// Invalidate Helpers
// ============================================================================

export function useInvalidateRotas() {
  const queryClient = useQueryClient();

  const invalidatePlayer = (playerId: number) =>
    queryClient.invalidateQueries({ queryKey: rotasKeys.player(playerId) });

  const invalidateTeam = (teamId: number) =>
    queryClient.invalidateQueries({ queryKey: rotasKeys.team(teamId) });

  const invalidateMatch = (matchId: number) =>
    queryClient.invalidateQueries({ queryKey: rotasKeys.match(matchId) });

  const invalidatePlayers = () =>
    queryClient.invalidateQueries({ queryKey: rotasKeys.players() });

  const invalidateTeams = () =>
    queryClient.invalidateQueries({ queryKey: rotasKeys.teams() });

  const invalidateMatches = () =>
    queryClient.invalidateQueries({ queryKey: rotasKeys.matches() });

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: rotasKeys.all });

  return {
    invalidatePlayer,
    invalidateTeam,
    invalidateMatch,
    invalidatePlayers,
    invalidateTeams,
    invalidateMatches,
    invalidateAll,
  };
}

// ============================================================================
// Dashboard Combo Hook
// ============================================================================

interface UsePlayerDashboardOptions {
  game?: string;
  enabled?: boolean;
}

export function useRotasPlayerDashboard(
  playerId: number,
  options: UsePlayerDashboardOptions = {}
) {
  const { game, enabled = true } = options;

  const playerQuery = usePlayer(playerId, { enabled });
  const statsQuery = usePlayerStats(playerId, { game, enabled: enabled && !playerQuery.isLoading });

  return {
    player: playerQuery.data,
    stats: statsQuery.data,
    isLoading: playerQuery.isLoading || statsQuery.isLoading,
    isError: playerQuery.isError || statsQuery.isError,
    error: playerQuery.error || statsQuery.error,
    refetch: () => {
      playerQuery.refetch();
      statsQuery.refetch();
    },
  };
}

interface UseTeamDashboardOptions {
  game?: string;
  enabled?: boolean;
}

export function useRotasTeamDashboard(
  teamId: number,
  options: UseTeamDashboardOptions = {}
) {
  const { game, enabled = true } = options;

  const teamQuery = useTeam(teamId, { enabled });
  const statsQuery = useTeamStats(teamId, { game, enabled: enabled && !teamQuery.isLoading });

  return {
    team: teamQuery.data,
    stats: statsQuery.data,
    isLoading: teamQuery.isLoading || statsQuery.isLoading,
    isError: teamQuery.isError || statsQuery.isError,
    error: teamQuery.error || statsQuery.error,
    refetch: () => {
      teamQuery.refetch();
      statsQuery.refetch();
    },
  };
}
