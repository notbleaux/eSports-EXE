import { useParams, Link } from 'react-router-dom';
import { useTeams } from '@/shared/api/hooks';

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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <Link to="/stats" className="text-purple-400 hover:underline text-sm">← Back to Stats</Link>
      <div className="mt-6 max-w-2xl">
        <h1 className="text-4xl font-bold">{team.name}</h1>
        {team.shortName && <p className="text-gray-400 mt-1">{team.shortName}</p>}
        <div className="flex gap-4 mt-4 text-sm text-gray-400">
          <span className="capitalize bg-gray-800 px-3 py-1 rounded">{team.game}</span>
          {team.region && <span>{team.region}</span>}
        </div>
        <p className="mt-8 text-gray-500 text-sm">
          Full roster and match history coming in Phase 5.
        </p>
      </div>
    </div>
  );
}
