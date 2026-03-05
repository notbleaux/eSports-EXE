import React from 'react';
import { TrendingUp, TrendingDown, Minus, User } from 'lucide-react';
import { Player } from '../../data/mockData';
import { useDashboardStore } from '../../store/dashboardStore';

interface PlayerCardProps {
  player: Player;
  rank: number;
  onClick: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank, onClick }) => {
  const trend = player.trend[player.trend.length - 1] - player.trend[player.trend.length - 2];
  const trendPercent = ((trend / player.trend[player.trend.length - 2]) * 100).toFixed(1);
  
  const getTrendIcon = () => {
    if (trend > 0.5) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend < -0.5) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };
  
  const getTrendColor = () => {
    if (trend > 0.5) return 'text-green-400';
    if (trend < -0.5) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div 
      onClick={onClick}
      className="glass-card p-4 cursor-pointer hover:bg-white/10 transition-all duration-200 group"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <span className="text-2xl font-bold text-dash-teal">#{rank}</span>
        </div>
        
        <div className="flex-shrink-0">
          {player.photo ? (
            <img 
              src={player.photo} 
              alt={player.name}
              className="w-12 h-12 rounded-full bg-dash-panel"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-dash-panel flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-white truncate">{player.name}</h3>
          <p className="text-sm text-gray-400">{player.team} • {player.position}</p>
        </div>
        
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl font-bold text-white">{player.simRating.toFixed(1)}</span>
          </div>
          <div className={`flex items-center gap-1 justify-end text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(Number(trendPercent))}%</span>
          </div>
        </div>
      </div>
      
      {/* Mini Sparkline */}
      <div className="mt-3 h-8 flex items-end gap-1">
        {player.trend.map((value, index) => {
          const height = ((value - 80) / 20) * 100;
          return (
            <div
              key={index}
              className="flex-1 bg-dash-teal/50 rounded-t"
              style={{ height: `${Math.max(10, height)}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const SimRatingPanel: React.FC = () => {
  const { players, setSelectedPlayer } = useDashboardStore();
  
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Top SimRated™ Performers</h2>
          <p className="text-sm text-gray-400 mt-1">Based on latest performance metrics</p>
        </div>
        
        <div className="text-right">
          <span className="text-3xl font-bold text-dash-teal">{players[0]?.simRating.toFixed(1)}</span>
          <p className="text-xs text-gray-400">Highest Rating</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {players.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            rank={index + 1}
            onClick={() => setSelectedPlayer(player)}
          />
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-dash-border">
        <p className="text-xs text-gray-500 text-center">
          Click on a player to view detailed analytics
        </p>
      </div>
    </div>
  );
};

export default SimRatingPanel;
