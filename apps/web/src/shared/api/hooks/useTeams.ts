import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { Team } from '@sator/types';

interface TeamsResponse {
  teams: Team[];
  total: number;
  limit: number;
  offset: number;
}

export function useTeams(game?: 'valorant' | 'cs2', region?: string) {
  const params = new URLSearchParams();
  if (game) params.set('game', game);
  if (region) params.set('region', region);
  const query = params.toString();

  return useQuery({
    queryKey: ['teams', game, region],
    queryFn: () => apiFetch<TeamsResponse>(
      query ? `/teams?${query}` : '/teams'
    ),
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => apiFetch<{ team: Team | null }>(`/teams/${id}`),
    enabled: !!id,
  });
}
