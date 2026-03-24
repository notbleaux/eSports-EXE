/**
 * CircuitStandings Component
 * VCT points leaderboard with team rankings and qualification status
 * [Ver001.000]
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Target, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { CircuitStanding, CircuitRegion } from '../types';

// Purple theme colors
const PURPLE = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

// Circuit configurations
const CIRCUIT_CONFIG: Record<CircuitRegion, { color: string; icon: typeof Trophy }> = {
  Americas: { color: '#ff4655', icon: Trophy },
  EMEA: { color: '#00d4ff', icon: Trophy },
  Pacific: { color: '#ff9f1c', icon: Trophy },
  China: { color: '#ffd700', icon: Trophy },
  International: { color: '#9d4edd', icon: Trophy },
};

// Qualification status badges
const QUALIFICATION_BADGES: Record<string, { bg: string; text: string; label: string; icon: typeof Medal }> = {
  qualified_champions: { 
    bg: 'bg-yellow-500/20', 
    text: 'text-yellow-400', 
    label: 'Champions Qualified',
    icon: Medal
  },
  qualified_masters: { 
    bg: 'bg-purple-500/20', 
    text: 'text-purple-400', 
    label: 'Masters Qualified',
    icon: Trophy
  },
  qualified_challengers: { 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-400', 
    label: 'Challengers Qualified',
    icon: Target
  },
  in_contention: { 
    bg: 'bg-green-500/20', 
    text: 'text-green-400', 
    label: 'In Contention',
    icon: Zap
  },
  eliminated: { 
    bg: 'bg-gray-500/20', 
    text: 'text-gray-400', 
    label: 'Eliminated',
    icon: Minus
  },
};

interface CircuitStandingsProps {
  standings: CircuitStanding[];
  circuit: CircuitRegion;
  season: string;
  onCircuitChange: (circuit: CircuitRegion) => void;
  onSeasonChange: (season: string) => void;
  loading: boolean;
}

function CircuitStandings({
  standings,
  circuit,
  season,
  onCircuitChange,
  onSeasonChange,
  loading,
}: CircuitStandingsProps): JSX.Element {
  const circuits: CircuitRegion[] = ['Americas', 'EMEA', 'Pacific', 'China'];
  const seasons = ['2026', '2025', '2024'];

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' };
      case 2:
        return { bg: 'bg-gray-300/20', border: 'border-gray-300/30', text: 'text-gray-300' };
      case 3:
        return { bg: 'bg-amber-600/20', border: 'border-amber-600/30', text: 'text-amber-400' };
      default:
        return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white' };
    }
  };

  const getQualificationBadge = (status: string) => {
    return QUALIFICATION_BADGES[status] || QUALIFICATION_BADGES.in_contention;
  };

  // Calculate stats
  const totalTeams = standings.length;
  const qualifiedTeams = standings.filter(s => s.qualification_status.startsWith('qualified')).length;
  const inContention = standings.filter(s => s.qualification_status === 'in_contention').length;

  return (
    <div className="space-y-4">
      {/* Circuit Selector */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Circuit Tabs */}
          <div className="flex flex-wrap gap-2">
            {circuits.map((c) => {
              const config = CIRCUIT_CONFIG[c];
              const isActive = circuit === c;
              
              return (
                <button
                  key={c}
                  onClick={() => onCircuitChange(c)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? 'ring-1' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: isActive ? `${config.color}20` : undefined,
                    borderColor: isActive ? config.color : undefined,
                    color: isActive ? config.color : 'rgba(255,255,255,0.7)',
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {c}
                </button>
              );
            })}
          </div>

          {/* Season Selector */}
          <select
            value={season}
            onChange={(e) => onSeasonChange(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            style={{ color: '#e8e6e3' }}
          >
            {seasons.map(s => (
              <option key={s} value={s}>Season {s}</option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: PURPLE.base }}>
            {totalTeams}
          </div>
          <div className="text-xs opacity-60">Teams</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {qualifiedTeams}
          </div>
          <div className="text-xs opacity-60">Qualified</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {inContention}
          </div>
          <div className="text-xs opacity-60">In Contention</div>
        </GlassCard>
      </div>

      {/* Standings Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 rounded-full"
            style={{ borderColor: `${PURPLE.base} transparent ${PURPLE.base} transparent` }}
          />
        </div>
      ) : standings.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: PURPLE.base }} />
          <p className="text-sm opacity-60">No standings available for this circuit</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/10 text-xs font-medium opacity-60">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Team</div>
            <div className="col-span-2 text-center">W-L</div>
            <div className="col-span-2 text-center">Points</div>
            <div className="col-span-2 text-center">Status</div>
          </div>

          {/* Standings Rows */}
          <div className="divide-y divide-white/5">
            {standings.map((standing, index) => {
              const rankStyle = getRankStyle(standing.rank);
              const qualBadge = getQualificationBadge(standing.qualification_status);
              const QualIcon = qualBadge.icon;

              return (
                <motion.div
                  key={standing.standing_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/5 transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${rankStyle.bg} ${rankStyle.text}`}
                      style={standing.rank <= 3 ? { border: `1px solid`, borderColor: rankStyle.border } : undefined}
                    >
                      {standing.rank}
                    </div>
                  </div>

                  {/* Team */}
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      {standing.team_tag && (
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-mono"
                          style={{ backgroundColor: `${CIRCUIT_CONFIG[circuit].color}20`, color: CIRCUIT_CONFIG[circuit].color }}
                        >
                          {standing.team_tag}
                        </span>
                      )}
                      <span className="font-medium text-sm truncate">
                        {standing.team_name}
                      </span>
                    </div>
                  </div>

                  {/* W-L */}
                  <div className="col-span-2 text-center text-sm opacity-80">
                    {standing.wins !== undefined && standing.losses !== undefined ? (
                      <span>{standing.wins}-{standing.losses}</span>
                    ) : (
                      <span className="opacity-40">-</span>
                    )}
                  </div>

                  {/* Points */}
                  <div className="col-span-2 text-center">
                    <span className="font-bold text-sm" style={{ color: PURPLE.base }}>
                      {standing.points}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex justify-center">
                    <div 
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${qualBadge.bg} ${qualBadge.text}`}
                      title={qualBadge.label}
                    >
                      <QualIcon className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(QUALIFICATION_BADGES).map(([key, badge]) => {
          const Icon = badge.icon;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className={`px-2 py-1 rounded ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
              </div>
              <span className="opacity-60">{badge.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CircuitStandings;
