// @ts-nocheck
// [Ver002.000] Feed of followed players with unfollow option.
import { Link } from 'react-router-dom';
import { useFollows } from '../hooks/useFollows';

export function FollowedFeed() {
  const { followed, unfollow, count } = useFollows();
  if (count === 0) return (
    <div className="p-4 text-center text-gray-500">
      <p>No players followed yet.</p>
      <p className="text-xs mt-1">Hit &quot;+ Follow&quot; on any player below.</p>
    </div>
  );
  return (
    <div className="w-full">
      <h3 className="text-gray-200 font-semibold mb-2 text-sm sm:text-base">
        Following ({count})
      </h3>
      {followed.map(p => (
        <div
          key={p.id}
          className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-b-0"
        >
          <Link
            to={`/player/${p.slug}`}
            className="text-indigo-400 hover:text-indigo-300 transition-colors flex-1 min-w-0 truncate text-sm"
          >
            {p.handle}
          </Link>
          <span className="text-gray-500 text-xs shrink-0">{p.game}</span>
          <button
            onClick={() => unfollow(p.id)}
            className="text-red-400 hover:text-red-300 text-xs shrink-0 transition-colors"
          >
            Unfollow
          </button>
        </div>
      ))}
    </div>
  );
}
