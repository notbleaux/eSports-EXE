// [Ver001.000] Forum posts hook — fetches posts from /v1/forum/posts.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/v1';

export function useForumPosts(category?: string, game?: string) {
  return useQuery({
    queryKey: ['forum-posts', category, game],
    queryFn: () => {
      const p = new URLSearchParams();
      if (category) p.set('category', category);
      if (game) p.set('game', game);
      const qs = p.toString();
      return apiFetch<{ posts: any[]; total: number }>(
        qs ? `/forum/posts?${qs}` : '/forum/posts'
      );
    },
    staleTime: 30_000,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      body: string;
      category?: string;
      game?: string;
    }) => {
      // apiFetch only accepts a path string; use fetch directly for POST requests.
      const res = await fetch(`${API_BASE}/forum/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`API error ${res.status}: /forum/posts`);
      }
      return res.json() as Promise<{ post: any }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-posts'] }),
  });
}
