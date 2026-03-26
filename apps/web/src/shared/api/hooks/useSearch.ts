// [Ver001.000] Unified search hook across Players and Teams.
import { useQuery } from '@tanstack/react-query';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
  .replace(/\/+$/, '').replace(/\/v1$/, '');

export function useSearch(query: string, game?: 'valorant' | 'cs2', resourceType?: 'player' | 'team') {
  return useQuery({
    queryKey: ['search', query, game, resourceType],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query });
      if (game) params.set('game', game);
      if (resourceType) params.set('resource_type', resourceType);
      const res = await fetch(`${API_URL}/v1/search?${params}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json() as Promise<{
        results: Array<{ type: string; id: number; name: string; slug: string; game: string }>;
        total: number; query: string;
      }>;
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}
