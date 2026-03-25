import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { Match } from '@sator/types';

interface MatchesResponse {
  matches: Match[];
  total: number;
  limit: number;
  offset: number;
}

export function useMatches(game?: 'valorant' | 'cs2', status?: string) {
  const params = new URLSearchParams();
  if (game) params.set('game', game);
  if (status) params.set('status', status);
  const query = params.toString();

  return useQuery({
    queryKey: ['matches', game, status],
    queryFn: () => apiFetch<MatchesResponse>(
      query ? `/matches?${query}` : '/matches'
    ),
  });
}

export function useMatch(id: number) {
  return useQuery({
    queryKey: ['match', id],
    queryFn: () => apiFetch<{ match: Match | null }>(`/matches/${id}`),
    enabled: !!id,
  });
}
