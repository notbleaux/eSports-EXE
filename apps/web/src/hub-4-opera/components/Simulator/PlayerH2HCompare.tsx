/**
 * PlayerH2HCompare Component
 * Player vs Player stat comparison with radar chart
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Target, Crosshair, Activity, Zap, ChevronDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { PlayerH2HCompareProps, PlayerPredictionData } from './types';
import { mockPlayers, PURPLE, roleColors } from './mockData';

interface StatConfig {
  key: keyof PlayerPredictionData;
  label: string;
  max: number;
  format?: 'decimal' | 'percent' | 'number';
}

const playerStats: StatConfig[] = [
  { key: 'rating', label: 'Rating', max: 1.5, format: 'decimal' },
  { key: 'acs', label: 'ACS', max: 300, format: 'number' },
  { key: 'kdr', label: 'K/D', max: 2.0, format: 'decimal' },
  { key: 'adr', label: 'ADR', max: 200, format: 'number' },
  { key: 'fkpr', label: 'FK/PR', max: 0.25, format: 'decimal' },
];

const PlayerH2HCompare: React.FC<PlayerH2HCompareProps> = ({ onCompare, players = mockPlayers }) => {
  const [playerAId, setPlayerAId] = useState<string>('');
  const [playerBId, setPlayerBId] = useState<string>('');
  const [showPlayerASelect, setShowPlayerASelect] = useState(false);
  const [showPlayerBSelect, setShowPlayerBSelect] = useState(false);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  const playerA = useMemo(() => players.find(p => p.id === playerAId), [players, playerAId]);
  const playerB = useMemo(() => players.find(p => p.id === playerBId), [players, playerBId]);

  // Filter players for dropdown
  const filteredPlayersA = useMemo(() => {
    return players.filter(p => 
      p.id !== playerBId && 
      (p.name.toLowerCase().includes(searchA.toLowerCase()) || 
       p.team?.toLowerCase().includes(searchA.toLowerCase()))
    );
  }, [players, playerBId, searchA]);

  const filteredPlayersB = useMemo(() => {
    return players.filter(p => 
      p.id !== playerAId && 
      (p.name.toLowerCase().includes(searchB.toLowerCase()) || 
       p.team?.toLowerCase().includes(searchB.toLowerCase()))
    );
  }, [players, playerAId, searchB]);

  const handleCompare = () => {
    if (playerAId && playerBId) {
      onCompare(playerAId, playerBId);
    }
  };

  // Calculate radar chart points
  const getRadarPoints = (player: PlayerPredictionData, centerX: number, centerY: number, radius: number) => {
    return playerStats.map((stat, index) => {
      const angle = (Math.PI * 2 * index) / playerStats.length - Math.PI / 2;
      const value = (player[stat.key] as number) / stat.max;
      const r = radius * Math.min(value, 1);
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        label: stat.label,
        value: player[stat.key] as number,
      };
    });
  };

  // Format stat value
  const formatStat = (value: number, format?: string) => {
    switch (format) {
      case 'decimal':
        return value.toFixed(2);
      case 'percent':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return value.toFixed(0);
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    return roleColors[role] || roleColors.flex;
  };

  return (
    <div className="space-y-4">
      {/* Player Selectors */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Player A Selector */}
          <div className="relative flex-1 w-full">
            <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
              <Crosshair className="w-3 h-3" style={{ color: PURPLE.base }} />
              Player A
            </div>
            <button
              onClick={() => setShowPlayerASelect(!showPlayerASelect)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
            >
              <span className={playerA ? 'text-white' : 'opacity-50'}>
                {playerA ? (
                  <span className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PURPLE.base }}
                    />
                    {playerA.name}
                    {playerA.team && (
                      <span className="text-xs opacity-50">({playerA.team})</span>
                    )}
                  </span>
                ) : 'Select Player A...'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPlayerASelect ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showPlayerASelect && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 w-full mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden shadow-xl"
                >
                  <div className="p-2 border-b border-white/10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                      <input
                        type="text"
                        placeholder="Search players..."
                        value={searchA}
                        onChange={(e) => setSearchA(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white/5 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ '--tw-ring-color': PURPLE.base } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredPlayersA.map(player => {
                      const roleColor = getRoleColor(player.role);
                      return (
                        <button
                          key={player.id}
                          onClick={() => {
                            setPlayerAId(player.id);
                            setShowPlayerASelect(false);
                            setSearchA('');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                        >
                          <span className={`w-2 h-2 rounded-full ${roleColor.bg.replace('/20', '')}`} />
                          <span className="text-sm">{player.name}</span>
                          {player.team && (
                            <span className="text-xs opacity-50 ml-auto">{player.team}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* VS Icon */}
          <div className="flex flex-col items-center justify-center">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${PURPLE.base}20` }}
            >
              <Users className="w-5 h-5" style={{ color: PURPLE.base }} />
            </div>
          </div>

          {/* Player B Selector */}
          <div className="relative flex-1 w-full">
            <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
              <Crosshair className="w-3 h-3" style={{ color: PURPLE.base }} />
              Player B
            </div>
            <button
              onClick={() => setShowPlayerBSelect(!showPlayerBSelect)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
            >
              <span className={playerB ? 'text-white' : 'opacity-50'}>
                {playerB ? (
                  <span className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#22c55e' }}
                    />
                    {playerB.name}
                    {playerB.team && (
                      <span className="text-xs opacity-50">({playerB.team})</span>
                    )}
                  </span>
                ) : 'Select Player B...'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPlayerBSelect ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showPlayerBSelect && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 w-full mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden shadow-xl"
                >
                  <div className="p-2 border-b border-white/10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                      <input
                        type="text"
                        placeholder="Search players..."
                        value={searchB}
                        onChange={(e) => setSearchB(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white/5 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ '--tw-ring-color': PURPLE.base } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredPlayersB.map(player => {
                      const roleColor = getRoleColor(player.role);
                      return (
                        <button
                          key={player.id}
                          onClick={() => {
                            setPlayerBId(player.id);
                            setShowPlayerBSelect(false);
                            setSearchB('');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                        >
                          <span className={`w-2 h-2 rounded-full ${roleColor.bg.replace('/20', '')}`} />
                          <span className="text-sm">{player.name}</span>
                          {player.team && (
                            <span className="text-xs opacity-50 ml-auto">{player.team}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Compare Button */}
        <motion.button
          onClick={handleCompare}
          disabled={!playerAId || !playerBId}
          className="w-full mt-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: playerAId && playerBId ? PURPLE.base : 'rgba(255,255,255,0.1)',
            color: playerAId && playerBId ? 'white' : 'rgba(255,255,255,0.5)'
          }}
          whileHover={playerAId && playerBId ? { scale: 1.02, boxShadow: `0 0 20px ${PURPLE.glow}` } : {}}
          whileTap={playerAId && playerBId ? { scale: 0.98 } : {}}
        >
          <Activity className="w-4 h-4" />
          Compare Players
        </motion.button>
      </GlassCard>

      {/* Comparison Content */}
      {playerA && playerB && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Radar Chart */}
          <GlassCard className="p-4">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: PURPLE.base }}>
              <Target className="w-4 h-4" />
              Stat Comparison
            </h3>
            
            <div className="flex justify-center">
              <svg width="220" height="220" className="overflow-visible">
                {/* Background circles */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
                  <circle
                    key={i}
                    cx="110"
                    cy="110"
                    r={80 * r}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Axis lines */}
                {playerStats.map((_, index) => {
                  const angle = (Math.PI * 2 * index) / playerStats.length - Math.PI / 2;
                  const x = 110 + 80 * Math.cos(angle);
                  const y = 110 + 80 * Math.sin(angle);
                  return (
                    <line
                      key={index}
                      x1="110"
                      y1="110"
                      x2={x}
                      y2={y}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  );
                })}
                
                {/* Labels */}
                {playerStats.map((stat, index) => {
                  const angle = (Math.PI * 2 * index) / playerStats.length - Math.PI / 2;
                  const x = 110 + 95 * Math.cos(angle);
                  const y = 110 + 95 * Math.sin(angle);
                  return (
                    <text
                      key={stat.label}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.6)"
                      fontSize="10"
                    >
                      {stat.label}
                    </text>
                  );
                })}
                
                {/* Player B polygon (green) */}
                <motion.polygon
                  points={getRadarPoints(playerB, 110, 110, 80)
                    .map(p => `${p.x},${p.y}`)
                    .join(' ')}
                  fill="rgba(34, 197, 94, 0.2)"
                  stroke="#22c55e"
                  strokeWidth="2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
                
                {/* Player A polygon (purple) */}
                <motion.polygon
                  points={getRadarPoints(playerA, 110, 110, 80)
                    .map(p => `${p.x},${p.y}`)
                    .join(' ')}
                  fill={`${PURPLE.glow}`}
                  stroke={PURPLE.base}
                  strokeWidth="2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
                
                {/* Player A points */}
                {getRadarPoints(playerA, 110, 110, 80).map((point, i) => (
                  <motion.circle
                    key={`a-${i}`}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill={PURPLE.base}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  />
                ))}
                
                {/* Player B points */}
                {getRadarPoints(playerB, 110, 110, 80).map((point, i) => (
                  <motion.circle
                    key={`b-${i}`}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="#22c55e"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  />
                ))}
              </svg>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE.base }} />
                <span className="text-sm">{playerA.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">{playerB.name}</span>
              </div>
            </div>
          </GlassCard>

          {/* Stat Details */}
          <div className="space-y-3">
            {/* Role Comparison */}
            <GlassCard className="p-4">
              <h4 className="text-xs opacity-60 mb-3 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Role Comparison
              </h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium capitalize ${getRoleColor(playerA.role).bg} ${getRoleColor(playerA.role).text}`}>
                    {playerA.role}
                  </div>
                  <div className="text-xs opacity-60 mt-1">{playerA.name}</div>
                </div>
                <div className="text-xs opacity-40">VS</div>
                <div className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium capitalize ${getRoleColor(playerB.role).bg} ${getRoleColor(playerB.role).text}`}>
                    {playerB.role}
                  </div>
                  <div className="text-xs opacity-60 mt-1">{playerB.name}</div>
                </div>
              </div>
            </GlassCard>

            {/* Key Stats */}
            <GlassCard className="p-4">
              <h4 className="text-xs opacity-60 mb-3">Key Stats</h4>
              <div className="space-y-2">
                {playerStats.map((stat) => {
                  const valA = playerA[stat.key] as number;
                  const valB = playerB[stat.key] as number;
                  const isABetter = valA > valB;
                  const diff = Math.abs(valA - valB);
                  
                  return (
                    <div key={stat.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className={`text-sm ${isABetter ? 'text-white' : 'opacity-60'}`}>
                        {formatStat(valA, stat.format)}
                      </div>
                      <div className="text-xs opacity-40 flex-1 text-center">{stat.label}</div>
                      <div className={`text-sm ${!isABetter ? 'text-white' : 'opacity-60'}`}>
                        {formatStat(valB, stat.format)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Agent Pools */}
            <GlassCard className="p-4">
              <h4 className="text-xs opacity-60 mb-3">Agent Pools</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-2" style={{ color: PURPLE.base }}>{playerA.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {playerA.agentPool.map(agent => (
                      <span key={agent} className="text-xs px-2 py-1 rounded bg-white/10">
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-2 text-green-400">{playerB.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {playerB.agentPool.map(agent => (
                      <span key={agent} className="text-xs px-2 py-1 rounded bg-white/10">
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Recent Form */}
            <GlassCard className="p-4">
              <h4 className="text-xs opacity-60 mb-3">Recent Form (Last 5)</h4>
              <div className="space-y-3">
                {/* Player A */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: PURPLE.base }}>{playerA.name}</span>
                    <span className="text-xs opacity-60">
                      Avg: {(playerA.recentForm.reduce((a, b) => a + b, 0) / playerA.recentForm.length).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {playerA.recentForm.map((rating, i) => (
                      <div 
                        key={i}
                        className="flex-1 h-6 rounded bg-white/5 flex items-center justify-center text-xs"
                        style={{ 
                          backgroundColor: rating >= 1.1 ? `${PURPLE.base}40` : 'rgba(255,255,255,0.05)'
                        }}
                      >
                        {rating.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Player B */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-green-400">{playerB.name}</span>
                    <span className="text-xs opacity-60">
                      Avg: {(playerB.recentForm.reduce((a, b) => a + b, 0) / playerB.recentForm.length).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {playerB.recentForm.map((rating, i) => (
                      <div 
                        key={i}
                        className="flex-1 h-6 rounded bg-white/5 flex items-center justify-center text-xs"
                        style={{ 
                          backgroundColor: rating >= 1.1 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.05)'
                        }}
                      >
                        {rating.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerH2HCompare;
