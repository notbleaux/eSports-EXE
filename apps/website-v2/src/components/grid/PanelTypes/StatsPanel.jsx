/**
 * Stats Panel - Player statistics and leaderboards
 * 
 * [Ver001.000]
 */
import { Trophy, Medal, Target, Zap } from 'lucide-react';
import { colors } from '@/theme/colors';

const MOCK_PLAYERS = [
  { id: 1, name: 'TenZ', team: 'SEN', acs: 278, kda: '1.85', rank: 1, trend: 'up' },
  { id: 2, name: 'aspas', team: 'LEV', acs: 265, kda: '1.72', rank: 2, trend: 'same' },
  { id: 3, name: 'yay', team: 'DIG', acs: 252, kda: '1.58', rank: 3, trend: 'down' },
  { id: 4, name: 'Derke', team: 'FNC', acs: 241, kda: '1.45', rank: 4, trend: 'up' },
  { id: 5, name: 'something', team: 'PRX', acs: 238, kda: '1.42', rank: 5, trend: 'same' },
];

function getRankIcon(rank) {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-xs text-white/40 w-4 text-center">{rank}</span>;
}

export function StatsPanel() {
  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: colors.hub.arepo.base }} />
          <span className="text-sm font-medium text-white/80">Top Performers</span>
        </div>
        <button className="text-xs text-white/40 hover:text-white/60 transition-colors">
          View All
        </button>
      </div>
      
      {/* Player List */}
      <div className="flex-1 overflow-auto space-y-2">
        {MOCK_PLAYERS.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/8 transition-colors group"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-6 flex justify-center">
              {getRankIcon(player.rank)}
            </div>
            
            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">
                  {player.name}
                </span>
                <span className="text-xs text-white/40">{player.team}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-xs text-white/40">ACS</div>
                <div className="text-sm font-mono font-medium" style={{ color: colors.hub.arepo.base }}>
                  {player.acs}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/40">K/D</div>
                <div className="text-sm font-mono text-white/80">{player.kda}</div>
              </div>
            </div>
            
            {/* Trend Indicator */}
            <div className="flex-shrink-0 w-4">
              {player.trend === 'up' && (
                <div className="w-2 h-2 rounded-full bg-green-400" />
              )}
              {player.trend === 'down' && (
                <div className="w-2 h-2 rounded-full bg-red-400" />
              )}
              {player.trend === 'same' && (
                <div className="w-2 h-2 rounded-full bg-white/20" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/60">247 tracked</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: colors.hub.arepo.base }} />
          <span className="text-xs text-white/60">Live Updates</span>
        </div>
      </div>
    </div>
  );
}
