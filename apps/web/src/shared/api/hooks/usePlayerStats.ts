// [Ver001.001] Hook for aggregated player stats from /v1/players/stats.
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';

interface PlayerStatsResponse {
  stats: Array<{
    player_id: number;
    handle: string;
    slug: string;
    game: string;
    avg_kd: number;
    avg_acs: number;
    avg_hs_pct: number;
    games: number;
  }>;
}

export function usePlayerStats(game?: 'valorant' | 'cs2') {
  return useQuery({
    queryKey: ['player-stats', game],
    queryFn: () => {
      const params = new URLSearchParams();
      if (game) params.set('game', game);
      const query = params.toString();
      return apiFetch<PlayerStatsResponse>(
        query ? `/players/stats?${query}` : '/players/stats'
      );
    },
    staleTime: 300_000,
  });
}
