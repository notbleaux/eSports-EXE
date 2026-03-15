/** [Ver001.000] */
/**
 * Fantasy Draft Room
 * ==================
 * Live draft interface for snake and auction drafts.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Search, 
  Plus,
  Check,
  TrendingUp,
  DollarSign,
  Target,
  Shield,
  Zap,
  Crosshair
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { AvailablePlayer, FantasyTeam } from './types';

interface FantasyDraftProps {
  leagueId: string;
  teamId: string;
}

export const FantasyDraft: React.FC<FantasyDraftProps> = ({ leagueId, teamId }) => {
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([]);
  const [myTeam, setMyTeam] = useState<FantasyTeam | null>(null);
  const [currentPick, setCurrentPick] = useState(1);
  const [myPickNumber, setMyPickNumber] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [draftLog, setDraftLog] = useState<string[]>([]);

  useEffect(() => {
    // Mock data
    const mockPlayers: AvailablePlayer[] = [
      { player_id: 'tenz', name: 'TenZ', team_tag: 'SEN', role: 'Duelist', game: 'valorant', matches_played: 45, avg_kills: 22.5, avg_deaths: 15.2, avg_assists: 4.1, avg_fantasy_points: 28.5, is_drafted: false },
      { player_id: 'aspas', name: 'aspas', team_tag: 'LEV', role: 'Duelist', game: 'valorant', matches_played: 52, avg_kills: 24.1, avg_deaths: 14.8, avg_assists: 3.9, avg_fantasy_points: 31.2, is_drafted: false },
      { player_id: 'yay', name: 'yay', team_tag: 'DSG', role: 'Duelist', game: 'valorant', matches_played: 38, avg_kills: 21.8, avg_deaths: 13.5, avg_assists: 4.5, avg_fantasy_points: 29.8, is_drafted: false },
      { player_id: 'something', name: 'something', team_tag: 'PRX', role: 'Duelist', game: 'valorant', matches_played: 41, avg_kills: 23.2, avg_deaths: 16.1, avg_assists: 3.8, avg_fantasy_points: 27.9, is_drafted: false },
      { player_id: 'derke', name: 'Derke', team_tag: 'FNC', role: 'Duelist', game: 'valorant', matches_played: 48, avg_kills: 22.9, avg_deaths: 15.5, avg_assists: 4.2, avg_fantasy_points: 28.1, is_drafted: false },
      { player_id: 'suygetsu', name: 'Suycgetsu', team_tag: 'FNC', role: 'Controller', game: 'valorant', matches_played: 42, avg_kills: 18.5, avg_deaths: 14.2, avg_assists: 6.8, avg_fantasy_points: 24.3, is_drafted: false },
      { player_id: 'sacy', name: 'Sacy', team_tag: 'SEN', role: 'Initiator', game: 'valorant', matches_played: 47, avg_kills: 16.2, avg_deaths: 15.8, avg_assists: 8.5, avg_fantasy_points: 22.1, is_drafted: false },
      { player_id: 'less', name: 'Less', team_tag: 'LOUD', role: 'Sentinel', game: 'valorant', matches_played: 44, avg_kills: 17.8, avg_deaths: 14.9, avg_assists: 5.2, avg_fantasy_points: 23.7, is_drafted: false },
    ];
    
    setAvailablePlayers(mockPlayers);
    
    // Timer countdown
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-draft if time runs out
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleDraftPlayer = (player: AvailablePlayer) => {
    // Mark player as drafted
    setAvailablePlayers(prev => 
      prev.map(p => p.player_id === player.player_id ? { ...p, is_drafted: true } : p)
    );
    
    // Add to draft log
    setDraftLog(prev => [`Pick #${currentPick}: ${player.name} drafted`, ...prev.slice(0, 9)]);
    
    // Advance pick
    setCurrentPick(prev => prev + 1);
    setTimeRemaining(30);
  };

  const isMyTurn = currentPick === myPickNumber;

  const filteredPlayers = availablePlayers.filter(p => {
    if (p.is_drafted) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterRole !== 'all' && p.role !== filterRole) return false;
    return true;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Duelist': return <Crosshair className="w-4 h-4" />;
      case 'Controller': return <Shield className="w-4 h-4" />;
      case 'Initiator': return <Zap className="w-4 h-4" />;
      case 'Sentinel': return <Target className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Player Pool */}
      <div className="lg:col-span-2 space-y-4">
        {/* Draft Status Bar */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg ${isMyTurn ? 'bg-[#9d4edd] animate-pulse' : 'bg-white/10'}`}>
                <span className="text-sm text-white/60">Current Pick</span>
                <div className="text-2xl font-bold text-white">#{currentPick}</div>
              </div>
              
              {isMyTurn && (
                <div className="text-[#9d4edd] font-semibold">
                  YOUR TURN!
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${timeRemaining <= 10 ? 'text-red-500' : 'text-white/60'}`} />
              <span className={`text-2xl font-mono font-bold ${timeRemaining <= 10 ? 'text-red-500' : 'text-white'}`}>
                {timeRemaining}s
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Search & Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search players..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
          >
            <option value="all">All Roles</option>
            <option value="Duelist">Duelist</option>
            <option value="Controller">Controller</option>
            <option value="Initiator">Initiator</option>
            <option value="Sentinel">Sentinel</option>
          </select>
        </div>

        {/* Player Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[500px]">
          {filteredPlayers.map((player) => (
            <GlassCard 
              key={player.player_id}
              className={`p-3 ${isMyTurn ? 'hover:border-[#9d4edd]/50 cursor-pointer' : 'opacity-75'}`}
              onClick={() => isMyTurn && handleDraftPlayer(player)}
            >
              <div className="flex items-center gap-3">
                {/* Player Avatar Placeholder */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#6600ff] flex items-center justify-center text-white font-bold">
                  {player.name[0]}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{player.name}</span>
                    <span className="text-xs text-white/40">{player.team_tag}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    {getRoleIcon(player.role)}
                    {player.role}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-[#9d4edd]">
                    {player.avg_fantasy_points.toFixed(1)}
                  </div>
                  <div className="text-xs text-white/40">Avg FP</div>
                </div>
                
                {isMyTurn && (
                  <Button size="sm" variant="primary">
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
                <div className="text-center">
                  <div className="text-sm font-medium text-white">{player.avg_kills.toFixed(1)}</div>
                  <div className="text-xs text-white/40">Kills</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">{player.avg_deaths.toFixed(1)}</div>
                  <div className="text-xs text-white/40">Deaths</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">{player.matches_played}</div>
                  <div className="text-xs text-white/40">Matches</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* My Team */}
        <GlassCard className="p-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#9d4edd]" />
            My Roster ({myTeam?.roster.length || 0}/5)
          </h3>
          <div className="space-y-2">
            {myTeam?.roster.length ? (
              myTeam.roster.map((slot) => (
                <div 
                  key={slot.id}
                  className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-[#9d4edd]/20 flex items-center justify-center text-white text-sm font-bold">
                    {slot.player_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">{slot.player_name}</div>
                    <div className="text-xs text-white/40">{slot.team_tag}</div>
                  </div>
                  {slot.is_captain && (
                    <span className="px-2 py-0.5 text-xs bg-[#ffd700]/20 text-[#ffd700] rounded">C</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-white/40 text-sm">
                No players drafted yet
              </div>
            )}
          </div>
        </GlassCard>

        {/* Draft Log */}
        <GlassCard className="p-4">
          <h3 className="font-semibold text-white mb-3">Draft Log</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {draftLog.map((log, i) => (
              <div key={i} className="text-sm text-white/60 py-1 border-b border-white/5 last:border-0">
                {log}
              </div>
            ))}
            {draftLog.length === 0 && (
              <div className="text-sm text-white/40">Draft hasn't started yet</div>
            )}
          </div>
        </GlassCard>

        {/* Pick Order */}
        <GlassCard className="p-4">
          <h3 className="font-semibold text-white mb-3">Pick Order</h3>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pick) => (
              <div
                key={pick}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  pick === currentPick 
                    ? 'bg-[#9d4edd] text-white' 
                    : pick < currentPick
                    ? 'bg-white/10 text-white/40'
                    : pick === myPickNumber
                    ? 'bg-[#9d4edd]/30 text-[#9d4edd] border border-[#9d4edd]'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                {pick}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default FantasyDraft;
