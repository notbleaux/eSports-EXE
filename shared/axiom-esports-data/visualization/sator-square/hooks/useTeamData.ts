/**
 * useTeamData.ts — Hook for fetching team roster and statistics data
 * Returns { data, loading, error } pattern for consistent error handling
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from './fetchWithRetry';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  joinDate: string;
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export interface TeamData {
  team: TeamMember[];
  loading: boolean;
  error: string | null;
}

// Validation schema
const TeamMemberSchema = {
  validate(data: unknown): data is TeamMember {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.id === 'string' &&
      typeof d.name === 'string' &&
      typeof d.role === 'string' &&
      typeof d.avatar === 'string' &&
      typeof d.joinDate === 'string' &&
      d.stats &&
      typeof d.stats === 'object' &&
      typeof (d.stats as Record<string, unknown>).matchesPlayed === 'number' &&
      typeof (d.stats as Record<string, unknown>).wins === 'number' &&
      typeof (d.stats as Record<string, unknown>).losses === 'number' &&
      typeof (d.stats as Record<string, unknown>).winRate === 'number'
    );
  }
};

/**
 * Hook for fetching team data with retry logic and error handling
 * 
 * @param teamId - The team identifier
 * @returns { data, loading, error } - Standard data fetching pattern
 */
export function useTeamData(teamId: string): TeamData {
  const [data, setData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!teamId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithRetry<unknown[]>(
        `/api/teams/${encodeURIComponent(teamId)}/members`,
        {},
        3
      );

      // Validate response data
      const validated = response.filter((item: unknown) => {
        const isValid = TeamMemberSchema.validate(item);
        if (!isValid) {
          console.warn('[useTeamData] Invalid team member:', item);
        }
        return isValid;
      });

      setData(validated);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch team data';
      console.error('[useTeamData] Fetch error:', errorMessage);
      setData([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    team: data,
    loading,
    error,
  };
}

export default useTeamData;
