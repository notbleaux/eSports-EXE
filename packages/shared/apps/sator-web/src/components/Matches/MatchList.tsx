import { ExtendedMatch } from '../../types';
import { Link } from 'react-router-dom';
import { Trophy, Calendar } from 'lucide-react';

interface MatchListProps {
  matches: ExtendedMatch[];
  isLoading?: boolean;
}

export function MatchList({ matches, isLoading }: MatchListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-radiant-gray mx-auto mb-4" />
        <p className="text-radiant-gray">No matches found</p>
        <p className="text-sm text-radiant-gray/60 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}

function MatchCard({ match }: { match: ExtendedMatch }) {
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const isFinished = match.status === 'finished';

  return (
    <Link
      to={`/matches/${match.id}`}
      className="stat-card p-5 block hover:border-radiant-red/30 transition-all group"
    >
      {/* Status & Tournament */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isLive && (
            <>
              <div className="w-2 h-2 bg-radiant-red rounded-full live-dot" />
              <span className="text-xs font-medium text-radiant-red">Live</span>
            </>
          )}
          {isFinished && (
            <>
              <div className="w-2 h-2 bg-radiant-green rounded-full" />
              <span className="text-xs font-medium text-radiant-green">Finished</span>
            </>
          )}
          {isUpcoming && (
            <>
              <div className="w-2 h-2 bg-radiant-orange rounded-full animate-pulse" />
              <span className="text-xs font-medium text-radiant-orange">Upcoming</span>
            </>
          )}
        </div>
        <span className="text-xs text-radiant-gray">{match.tournament || 'VCT'}</span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="text-center flex-1">
          <p className="font-bold truncate group-hover:text-radiant-cyan transition-colors">
            {match.teamA?.name || 'TBD'}
          </p>
          <p className="text-xs text-radiant-gray">{match.teamA?.players.length || 0} players</p>
        </div>
        
        <div className="text-center px-2">
          {isUpcoming ? (
            <span className="text-sm text-radiant-gray">VS</span>
          ) : (
            <div className="flex items-center gap-2 text-lg font-mono">
              <span>{match.teamA?.score || 0}</span>
              <span className="text-radiant-gray">-</span>
              <span>{match.teamB?.score || 0}</span>
            </div>
          )}
          {!isUpcoming && (
            <p className="text-xs text-radiant-gray">{match.roundsPlayed} rounds</p>
          )}
        </div>
        
        <div className="text-center flex-1">
          <p className="font-bold truncate group-hover:text-radiant-cyan transition-colors">
            {match.teamB?.name || 'TBD'}
          </p>
          <p className="text-xs text-radiant-gray">{match.teamB?.players.length || 0} players</p>
        </div>
      </div>

      {/* Map & Time */}
      <div className="flex items-center justify-between pt-3 border-t border-radiant-border text-xs text-radiant-gray">
        <span>{match.mapName}</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatMatchTime(match)}
        </span>
      </div>
    </Link>
  );
}

function formatMatchTime(match: ExtendedMatch): string {
  if (match.status === 'live') {
    return 'In Progress';
  }
  if (match.status === 'upcoming') {
    const start = new Date(match.startedAt);
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `In ${minutes}m`;
    }
    return `In ${hours}h`;
  }
  return new Date(match.endedAt).toLocaleDateString();
}
