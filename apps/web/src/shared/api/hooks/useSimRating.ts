import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { SimRating, RAR } from '@sator/types';

interface PlayerSimRatingResponse {
  player_id: number;
  simrating: SimRating | null;
  rar: RAR | null;
  calculated_at: string | null;
  status: string;
}

interface LeaderboardResponse {
  leaderboard: Array<{ player_id: number; simrating: SimRating }>;
  total: number;
  game: string | null;
  limit: number;
  offset: number;
}

export function usePlayerSimRating(playerId: number) {
  return useQuery({
    queryKey: ['simrating', 'player', playerId],
    queryFn: () => apiFetch<PlayerSimRatingResponse>(`/simrating/players/${playerId}`),
    enabled: !!playerId,
  });
}

export function useSimRatingLeaderboard(game?: 'valorant' | 'cs2') {
  return useQuery({
    queryKey: ['simrating', 'leaderboard', game],
    queryFn: () =>
      apiFetch<LeaderboardResponse>(
        game ? `/simrating/leaderboard?game=${game}` : '/simrating/leaderboard'
      ),
  });
}
