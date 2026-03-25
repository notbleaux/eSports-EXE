import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import type { Player } from '@sator/types';

interface PlayersResponse {
  players: Player[];
  total: number;
}

function usePlayerBySlug(slug: string) {
  return useQuery({
    queryKey: ['player', 'slug', slug],
    queryFn: () =>
      apiFetch<PlayersResponse>(`/players?slug=${encodeURIComponent(slug)}&limit=1`),
    enabled: !!slug,
    select: (data) => data.players[0] ?? null,
  });
}

export default function PlayerProfilePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: player, isLoading, isError } = usePlayerBySlug(slug ?? '');

  if (!slug) return <div className="p-20 text-center text-gray-400">No player specified.</div>;
  if (isLoading) return <div className="p-20 text-center text-gray-400">Loading player...</div>;
  if (isError || !player) return (
    <div className="p-20 text-center">
      <p className="text-gray-400">Player not found: {slug}</p>
      <Link to="/analytics" className="text-purple-400 hover:underline mt-4 block">← Back to Analytics</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <Link to="/analytics" className="text-purple-400 hover:underline text-sm">← Back to Analytics</Link>
      <div className="mt-6 max-w-2xl">
        <h1 className="text-4xl font-bold">{player.handle}</h1>
        {player.realName && <p className="text-gray-400 mt-1">{player.realName}</p>}
        <div className="flex gap-4 mt-4 text-sm text-gray-400">
          <span className="capitalize bg-gray-800 px-3 py-1 rounded">{player.game}</span>
          {player.nationality && <span>{player.nationality}</span>}
          {player.role && <span className="bg-purple-900 px-3 py-1 rounded">{player.role}</span>}
        </div>
        <p className="mt-8 text-gray-500 text-sm">
          Full stats and SimRating breakdown coming in Phase 5.
        </p>
      </div>
    </div>
  );
}
