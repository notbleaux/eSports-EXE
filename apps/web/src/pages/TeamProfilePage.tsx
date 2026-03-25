import { useParams, Link } from 'react-router-dom';
import { useTeams } from '@/shared/api/hooks';
import { usePlayers } from '@/shared/api/hooks';
import { useMatches } from '@/shared/api/hooks';

export default function TeamProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useTeams(undefined, undefined, slug);

  if (!slug) return <div className="p-20 text-center text-gray-400">No team specified.</div>;
  if (isLoading) return <div className="p-20 text-center text-gray-400">Loading team...</div>;

  const team = data?.teams?.[0];

  if (isError || !team) return (
    <div className="p-20 text-center">
      <p className="text-gray-400">Team not found: {slug}</p>
      <Link to="/stats" className="text-purple-400 hover:underline mt-4 block">← Back to Stats</Link>
    </div>
  );

  return <TeamDetail team={team} />;
}

function TeamDetail({ team }: { team: { id: number; name: string; shortName?: string; game: string; region?: string } }) {
  const { data: rosterData, isLoading: rosterLoading } = usePlayers(
    team.game as 'valorant' | 'cs2',
    undefined,
    team.id,
  );
  const { data: matchData, isLoading: matchLoading } = useMatches(
    team.game as 'valorant' | 'cs2',
    'finished',
  );

  const players = rosterData?.players ?? [];
  const recentMatches = matchData?.matches?.slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <Link to="/stats" className="text-purple-400 hover:underline text-sm">← Back to Stats</Link>

      <div className="mt-6 max-w-3xl">
        {/* Header */}
        <h1 className="text-4xl font-bold">{team.name}</h1>
        {team.shortName && <p className="text-gray-400 mt-1">{team.shortName}</p>}
        <div className="flex gap-4 mt-4 text-sm text-gray-400">
          <span className="capitalize bg-gray-800 px-3 py-1 rounded">{team.game}</span>
          {team.region && <span>{team.region}</span>}
        </div>

        {/* Roster */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Roster</h2>
          {rosterLoading ? (
            <p className="text-gray-500 text-sm">Loading roster...</p>
          ) : players.length === 0 ? (
            <p className="text-gray-500 text-sm">No players found. Run data sync to populate.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {players.map((p) => (
                <Link
                  to={`/player/${p.slug}`}
                  key={p.id}
                  className="flex flex-col bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-white">{p.handle}</span>
                  {p.role && (
                    <span className="text-xs text-purple-400 mt-1">{p.role}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Recent Matches</h2>
          {matchLoading ? (
            <p className="text-gray-500 text-sm">Loading matches...</p>
          ) : recentMatches.length === 0 ? (
            <p className="text-gray-500 text-sm">No finished matches yet.</p>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center bg-gray-800 rounded-lg px-4 py-3 text-sm"
                >
                  <span className="text-gray-200">{m.name ?? `Match #${m.id}`}</span>
                  <span className="text-green-400 text-xs capitalize">{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
