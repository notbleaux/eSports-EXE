import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { Team } from '@sator/types';

interface TeamsResponse {
  teams: Team[];
  total: number;
  limit: number;
  offset: number;
}

export function useTeams(game?: 'valorant' | 'cs2', region?: string, slug?: string) {
  const params = new URLSearchParams();
  if (game) params.append('game', game);
  if (region) params.append('region', region);
  if (slug) params.append('slug', slug);
  const query = params.toString();

  return useQuery({
    queryKey: ['teams', game, region, slug],
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
