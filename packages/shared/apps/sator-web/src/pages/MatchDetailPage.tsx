import { useParams, Link } from 'react-router-dom';
import { useMatch } from '../hooks/useApi';
import { ArrowLeft, Trophy, MapPin, Users, Clock } from 'lucide-react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading, error } = useMatch(id || '');

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-radiant-gray">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading match data...</span>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-radiant-red/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-radiant-red" />
          </div>
          <h2 className="text-xl font-bold mb-2">Match Not Found</h2>
          <p className="text-radiant-gray">
            The match you are looking for does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Navigation */}
      <Link
        to="/matches"
        className="inline-flex items-center gap-2 text-radiant-gray hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      {/* Match Header */}
      <div className="stat-card p-6">
        {/* Status & Tournament */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isLive && (
              <>
                <div className="w-2 h-2 bg-radiant-red rounded-full live-dot" />
                <span className="text-xs font-medium text-radiant-red uppercase">Live</span>
              </>
            )}
            {isUpcoming && (
              <>
                <div className="w-2 h-2 bg-radiant-orange rounded-full animate-pulse" />
                <span className="text-xs font-medium text-radiant-orange uppercase">Upcoming</span>
              </>
            )}
            {!isLive && !isUpcoming && (
              <>
                <div className="w-2 h-2 bg-radiant-green rounded-full" />
                <span className="text-xs font-medium text-radiant-green uppercase">Finished</span>
              </>
            )}
          </div>
          <span className="text-sm text-radiant-gray">{match.tournament || 'VCT'}</span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{match.teamA?.name || 'TBD'}</p>
            <p className="text-5xl font-mono font-bold text-radiant-red mt-2">
              {match.teamA?.score ?? '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono text-radiant-gray">VS</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{match.teamB?.name || 'TBD'}</p>
            <p className="text-5xl font-mono font-bold text-radiant-cyan mt-2">
              {match.teamB?.score ?? '-'}
            </p>
          </div>
        </div>

        {/* Match Info */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-radiant-border text-sm text-radiant-gray">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {match.mapName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {match.roundsPlayed} rounds
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {match.playerIds.length} players
          </span>
        </div>
      </div>

      {/* Match Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Team A Players */}
        <div className="stat-card p-6">
          <h2 className="text-xl font-bold mb-4">{match.teamA?.name || 'Team A'}</h2>
          <div className="space-y-2">
            {match.teamA?.players.map((playerId) => (
              <PlayerRow key={playerId} playerId={playerId} />
            )) || (
              <p className="text-radiant-gray text-center py-4">
                No player data available
              </p>
            )}
          </div>
        </div>

        {/* Team B Players */}
        <div className="stat-card p-6">
          <h2 className="text-xl font-bold mb-4">{match.teamB?.name || 'Team B'}</h2>
          <div className="space-y-2">
            {match.teamB?.players.map((playerId) => (
              <PlayerRow key={playerId} playerId={playerId} />
            )) || (
              <p className="text-radiant-gray text-center py-4">
                No player data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ playerId }: { playerId: string }) {
  // This would fetch player details - for now just show ID
  return (
    <Link
      to={`/players/${playerId}`}
      className="flex items-center gap-3 p-3 bg-radiant-black rounded-lg hover:bg-radiant-card transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-radiant-red/20 to-radiant-orange/20 flex items-center justify-center font-bold">
        {playerId.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="font-medium">Player {playerId.slice(0, 8)}</p>
      </div>
      <div className="flex-1" />
      <span className="text-xs text-radiant-gray">View Profile →</span>
    </Link>
  );
}
