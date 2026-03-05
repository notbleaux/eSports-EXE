/**
 * useAnalyticsData.ts — Hook for fetching analytics and statistics data
 * Returns { data, loading, error } pattern for consistent error handling
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from './fetchWithRetry';

export interface PlayerStats {
  playerId: string;
  playerName: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  adr: number; // Average Damage per Round
  headshotPercentage: number;
  roundsPlayed: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  roundsWon: number;
  roundsLost: number;
  winRate: number;
  averageRoundDuration: number;
}

export interface AnalyticsData {
  players: PlayerStats[];
  teams: TeamStats[];
  loading: boolean;
  error: string | null;
}

export interface AnalyticsFilters {
  tournamentId?: string;
  dateRange?: { start: string; end: string };
  minRounds?: number;
}

// Validation schemas
const PlayerStatsSchema = {
  validate(data: unknown): data is PlayerStats {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.playerId === 'string' &&
      typeof d.playerName === 'string' &&
      typeof d.teamId === 'string' &&
      typeof d.kills === 'number' &&
      typeof d.deaths === 'number' &&
      typeof d.assists === 'number' &&
      typeof d.kdRatio === 'number' &&
      typeof d.adr === 'number' &&
      typeof d.headshotPercentage === 'number' &&
      typeof d.roundsPlayed === 'number'
    );
  }
};

const TeamStatsSchema = {
  validate(data: unknown): data is TeamStats {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.teamId === 'string' &&
      typeof d.teamName === 'string' &&
      typeof d.matchesPlayed === 'number' &&
      typeof d.wins === 'number' &&
      typeof d.losses === 'number' &&
      typeof d.roundsWon === 'number' &&
      typeof d.roundsLost === 'number' &&
      typeof d.winRate === 'number' &&
      typeof d.averageRoundDuration === 'number'
    );
  }
};

/**
 * Hook for fetching analytics data with retry logic and error handling
 * 
 * @param filters - Optional filters for analytics query
 * @returns { players, teams, loading, error } - Standard data fetching pattern
 */
export function useAnalyticsData(filters?: AnalyticsFilters): AnalyticsData {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters?.tournamentId) {
        queryParams.append('tournament', filters.tournamentId);
      }
      if (filters?.dateRange) {
        queryParams.append('startDate', filters.dateRange.start);
        queryParams.append('endDate', filters.dateRange.end);
      }
      if (filters?.minRounds) {
        queryParams.append('minRounds', String(filters.minRounds));
      }

      const queryString = queryParams.toString();
      const baseUrl = '/api/analytics';
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      // Fetch player and team stats in parallel with retry
      const [playersResponse, teamsResponse] = await Promise.all([
        fetchWithRetry<unknown[]>(`${url}/players`, {}, 3),
        fetchWithRetry<unknown[]>(`${url}/teams`, {}, 3),
      ]);

      // Validate player stats
      const validatedPlayers = playersResponse.filter((item: unknown) => {
        const isValid = PlayerStatsSchema.validate(item);
        if (!isValid) {
          console.warn('[useAnalyticsData] Invalid player stats:', item);
        }
        return isValid;
      });

      // Validate team stats
      const validatedTeams = teamsResponse.filter((item: unknown) => {
        const isValid = TeamStatsSchema.validate(item);
        if (!isValid) {
          console.warn('[useAnalyticsData] Invalid team stats:', item);
        }
        return isValid;
      });

      setPlayers(validatedPlayers);
      setTeams(validatedTeams);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      console.error('[useAnalyticsData] Fetch error:', errorMessage);
      setPlayers([]);
      setTeams([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters?.tournamentId, filters?.dateRange?.start, filters?.dateRange?.end, filters?.minRounds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    players,
    teams,
    loading,
    error,
  };
}

export default useAnalyticsData;
