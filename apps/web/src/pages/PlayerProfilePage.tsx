import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { usePlayerSimRating } from '@/shared/api/hooks';
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

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center bg-gray-800 rounded-lg p-3 min-w-[80px]">
      <span className="text-lg font-bold text-white">{value}</span>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  );
}

const gradeColor: Record<string, string> = {
  S: '#ffd700', A: '#22c55e', B: '#3b82f6',
  C: '#f59e0b', D: '#ef4444', F: '#6b7280',
};

export default function PlayerProfilePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: player, isLoading, isError } = usePlayerBySlug(slug ?? '');
  const { data: ratingData, isLoading: ratingLoading } = usePlayerSimRating(player?.id ?? 0);

  if (!slug) return <div className="p-20 text-center text-gray-400">No player specified.</div>;
  if (isLoading) return <div className="p-20 text-center text-gray-400">Loading player...</div>;
  if (isError || !player) return (
    <div className="p-20 text-center">
      <p className="text-gray-400">Player not found: {slug}</p>
      <Link to="/analytics" className="text-purple-400 hover:underline mt-4 block">← Back to Analytics</Link>
    </div>
  );

  const rating = ratingData?.simrating ?? null;
  const grade = ratingData?.grade ?? null;
  const source = (ratingData as { source?: string } | undefined)?.source;
  const components = (ratingData as { components?: Record<string, number> } | undefined)?.components;
  const gamesSampled = (ratingData as { games_sampled?: number } | undefined)?.games_sampled ?? 0;

  const avgKd = components?.kd_score != null
    ? (components.kd_score / 25 * 2).toFixed(2)
    : '--';
  const avgAcs = components?.acs_score != null
    ? Math.round(components.acs_score / 25 * 300).toString()
    : '--';

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

        {/* SimRating Section */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">SimRating</h2>

          {ratingLoading ? (
            <p className="text-gray-500 text-sm">Calculating...</p>
          ) : (
            <>
              <div className="flex items-end gap-4 mb-4">
                <span className="text-5xl font-bold text-white">
                  {rating != null ? rating.toFixed(1) : '--'}
                </span>
                {grade && (
                  <span
                    className="text-2xl font-bold mb-1"
                    style={{ color: gradeColor[grade] ?? '#6b7280' }}
                  >
                    {grade}
                  </span>
                )}
                <span className="text-xs text-gray-500 mb-2">
                  {source === 'v2_stats' ? 'Based on match data' : 'Estimated'}
                </span>
              </div>

              <div className="flex gap-3 flex-wrap">
                <StatCell label="K/D" value={avgKd} />
                <StatCell label="Avg ACS" value={avgAcs} />
                <StatCell label="Games" value={gamesSampled} />
              </div>

              {source !== 'v2_stats' && (
                <p className="mt-4 text-xs text-gray-600">
                  No match data available yet. Run the PandaScore sync to get real stats.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
