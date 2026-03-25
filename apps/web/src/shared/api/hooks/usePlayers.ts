import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { Player } from '@sator/types';

interface PlayersResponse {
  players: Player[];
  total: number;
  limit: number;
  offset: number;
}

export function usePlayers(game?: 'valorant' | 'cs2') {
  return useQuery({
    queryKey: ['players', game],
    queryFn: () => apiFetch<PlayersResponse>(
      game ? `/players?game=${game}` : '/players'
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
