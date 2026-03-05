/**
 * useMatchData.ts — Hook for fetching match information and results
 * Returns { data, loading, error } pattern for consistent error handling
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from './fetchWithRetry';

export interface MatchInfo {
  id: string;
  tournament: string;
  round: string;
  map: string;
  date: string;
  duration: number;
  teams: {
    teamA: { id: string; name: string; score: number };
    teamB: { id: string; name: string; score: number };
  };
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  winner?: string;
}

export interface RoundData {
  roundNumber: number;
  teamAScore: number;
  teamBScore: number;
  duration: number;
  mvp?: string;
}

export interface MatchData {
  match: MatchInfo | null;
  rounds: RoundData[];
  loading: boolean;
  error: string | null;
}

// Validation schemas
const MatchInfoSchema = {
  validate(data: unknown): data is MatchInfo {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.id === 'string' &&
      typeof d.tournament === 'string' &&
      typeof d.round === 'string' &&
      typeof d.map === 'string' &&
      typeof d.date === 'string' &&
      typeof d.duration === 'number' &&
      d.teams &&
      typeof d.teams === 'object' &&
      ['scheduled', 'live', 'completed', 'cancelled'].includes(d.status as string)
    );
  }
};

const RoundDataSchema = {
  validate(data: unknown): data is RoundData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.roundNumber === 'number' &&
      typeof d.teamAScore === 'number' &&
      typeof d.teamBScore === 'number' &&
      typeof d.duration === 'number'
    );
  }
};

/**
 * Hook for fetching match data with retry logic and error handling
 * 
 * @param matchId - The match identifier
 * @returns { match, rounds, loading, error } - Standard data fetching pattern
 */
export function useMatchData(matchId: string): MatchData {
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!matchId) {
      setMatch(null);
      setRounds([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch match info and rounds in parallel with retry
      const [matchResponse, roundsResponse] = await Promise.all([
        fetchWithRetry<MatchInfo>(
          `/api/matches/${encodeURIComponent(matchId)}`,
          {},
          3
        ),
        fetchWithRetry<unknown[]>(
          `/api/matches/${encodeURIComponent(matchId)}/rounds`,
          {},
          3
        ),
      ]);

      // Validate match info
      if (!MatchInfoSchema.validate(matchResponse)) {
        throw new Error('Invalid match data received from API');
      }

      // Validate rounds
      const validatedRounds = roundsResponse.filter((item: unknown) => {
        const isValid = RoundDataSchema.validate(item);
        if (!isValid) {
          console.warn('[useMatchData] Invalid round data:', item);
        }
        return isValid;
      });

      setMatch(matchResponse);
      setRounds(validatedRounds);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch match data';
      console.error('[useMatchData] Fetch error:', errorMessage);
      setMatch(null);
      setRounds([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    match,
    rounds,
    loading,
    error,
  };
}

export default useMatchData;
