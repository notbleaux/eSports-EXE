import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { Player } from '@sator/types';

interface PlayersResponse {
  players: Player[];
  total: number;
  limit: number;
  offset: number;
}

export function usePlayers(game?: 'valorant' | 'cs2', slug?: string, teamId?: number | string) {
  const params = new URLSearchParams();
  if (game) params.append('game', game);
  if (slug) params.append('slug', slug);
  if (teamId != null) params.append('team_id', String(teamId));
  const query = params.toString();

  return useQuery({
    queryKey: ['players', game, slug, teamId],
    queryFn: () => apiFetch<PlayersResponse>(
      query ? `/players?${query}` : '/players'
    ),
  });
}

export function usePlayer(id: number) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => apiFetch<{ player: Player | null }>(`/players/${id}`),
    enabled: !!id,
  });
}
