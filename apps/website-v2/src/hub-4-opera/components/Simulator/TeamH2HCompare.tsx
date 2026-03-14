/**
 * TeamH2HCompare Component
 * Team vs Team comparison with win probability prediction
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Swords, TrendingUp, Target, Map, History, ChevronDown, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import WinProbabilityGauge from './WinProbabilityGauge';
import type { TeamH2HCompareProps, TeamPredictionResult, H2HHistory } from './types';
import { useSimulator } from './hooks/useSimulator';
import { PURPLE, mockTeams } from './mockData';

interface TeamStat {
  label: string;
  teamA: number | string;
  teamB: number | string;
  higherIsBetter: boolean;
  format?: 'percent' | 'number' | 'rating';
}

const TeamH2HCompare: React.FC<TeamH2HCompareProps> = ({ onPredict }) => {
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [showTeamASelect, setShowTeamASelect] = useState(false);
  const [showTeamBSelect, setShowTeamBSelect] = useState(false);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [prediction, setPrediction] = useState<TeamPredictionResult | null>(null);
  const [h2hHistory, setH2hHistory] = useState<H2HHistory[]>([]);
  
  const { isLoading, getH2HHistory, teams } = useSimulator();

  const teamA = useMemo(() => teams.find(t => t.id === teamAId), [teams, teamAId]);
  const teamB = useMemo(() => teams.find(t => t.id === teamBId), [teams, teamBId]);

  // Filter teams for dropdown
  const filteredTeamsA = useMemo(() => {
    return teams.filter(t => 
      t.id !== teamBId && 
      (t.name.toLowerCase().includes(searchA.toLowerCase()) || 
       t.tag?.toLowerCase().includes(searchA.toLowerCase()))
    );
  }, [teams, teamBId, searchA]);

  const filteredTeamsB = useMemo(() => {
    return teams.filter(t => 
      t.id !== teamAId && 
      (t.name.toLowerCase().includes(searchB.toLowerCase()) || 
       t.tag?.toLowerCase().includes(searchB.toLowerCase()))
    );
  }, [teams, teamAId, searchB]);

  // Comparison stats
  const stats: TeamStat[] = useMemo(() => {
    if (!teamA || !teamB) return [];
    
    return [
      { label: 'Rating', teamA: teamA.avgRating, teamB: teamB.avgRating, higherIsBetter: true, format: 'rating' },
      { label: 'Form', teamA: teamA.recentForm, teamB: teamB.recentForm, higherIsBetter: true, format: 'number' },
      { label: 'Win Rate', teamA: teamA.winRate, teamB: teamB.winRate, higherIsBetter: true, format: 'percent' },
      { label: 'Maps Played', teamA: teamA.mapsPlayed, teamB: teamB.mapsPlayed, higherIsBetter: false, format: 'number' },
    ];
  }, [teamA, teamB]);

  const handlePredict = async () => {
    if (!teamAId || !teamBId) return;
    
    try {
      const result = await onPredict(teamAId, teamBId);
      setPrediction(result);
      
      // Load H2H history
      const history = getH2HHistory(teamAId, teamBId);
      setH2hHistory(history);
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'percent':
        return `${(value * 100).toFixed(0)}%`;
      case 'rating':
        return value.toFixed(0);
      default:
        return value.toString();
    }
  };

  return (
    <div className="space-y-4">
      {/* Team Selectors */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Team A Selector */}
          <div className="relative flex-1 w-full">
            <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" style={{ color: PURPLE.base }} />
              Team A
            </div>
            <button
              onClick={() => setShowTeamASelect(!showTeamASelect)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
            >
              <span className={teamA ? 'text-white' : 'opacity-50'}>
                {teamA ? (
                  <span className="flex items-center gap-2">
                    {teamA.tag && (
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{ backgroundColor: `${PURPLE.base}30`, color: PURPLE.base }}
                      >
                        {teamA.tag}
                      </span>
                    )}
                    {teamA.name}
                  </span>
                ) : 'Select Team A...'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTeamASelect ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showTeamASelect && (
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
                        placeholder="Search teams..."
                        value={searchA}
                        onChange={(e) => setSearchA(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white/5 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ '--tw-ring-color': PURPLE.base } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredTeamsA.map(team => (
                      <button
                        key={team.id}
                        onClick={() => {
                          setTeamAId(team.id);
                          setShowTeamASelect(false);
                          setSearchA('');
                          setPrediction(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                      >
                        {team.tag && (
                          <span className="text-xs opacity-60 font-mono">{team.tag}</span>
                        )}
                        <span className="text-sm">{team.name}</span>
                      </button>
                    ))}
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
              <Swords className="w-5 h-5" style={{ color: PURPLE.base }} />
            </div>
          </div>

          {/* Team B Selector */}
          <div className="relative flex-1 w-full">
            <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" style={{ color: PURPLE.base }} />
              Team B
            </div>
            <button
              onClick={() => setShowTeamBSelect(!showTeamBSelect)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
            >
              <span className={teamB ? 'text-white' : 'opacity-50'}>
                {teamB ? (
                  <span className="flex items-center gap-2">
                    {teamB.tag && (
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{ backgroundColor: `${PURPLE.base}30`, color: PURPLE.base }}
                      >
                        {teamB.tag}
                      </span>
                    )}
                    {teamB.name}
                  </span>
                ) : 'Select Team B...'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTeamBSelect ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showTeamBSelect && (
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
                        placeholder="Search teams..."
                        value={searchB}
                        onChange={(e) => setSearchB(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white/5 rounded text-sm focus:outline-none focus:ring-1"
                        style={{ '--tw-ring-color': PURPLE.base } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredTeamsB.map(team => (
                      <button
                        key={team.id}
                        onClick={() => {
                          setTeamBId(team.id);
                          setShowTeamBSelect(false);
                          setSearchB('');
                          setPrediction(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                      >
                        {team.tag && (
                          <span className="text-xs opacity-60 font-mono">{team.tag}</span>
                        )}
                        <span className="text-sm">{team.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Predict Button */}
        <motion.button
          onClick={handlePredict}
          disabled={!teamAId || !teamBId || isLoading}
          className="w-full mt-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: teamAId && teamBId ? PURPLE.base : 'rgba(255,255,255,0.1)',
            color: teamAId && teamBId ? 'white' : 'rgba(255,255,255,0.5)'
          }}
          whileHover={teamAId && teamBId ? { scale: 1.02, boxShadow: `0 0 20px ${PURPLE.glow}` } : {}}
          whileTap={teamAId && teamBId ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Predict Match
            </>
          )}
        </motion.button>
      </GlassCard>

      {/* Stats Comparison */}
      {teamA && teamB && !prediction && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: PURPLE.base }}>
            <TrendingUp className="w-4 h-4" />
            Team Stats Comparison
          </h3>
          
          <div className="space-y-3">
            {stats.map((stat, index) => {
              const teamAVal = typeof stat.teamA === 'number' ? stat.teamA : parseFloat(stat.teamA);
              const teamBVal = typeof stat.teamB === 'number' ? stat.teamB : parseFloat(stat.teamB);
              const total = teamAVal + teamBVal;
              const teamAPercent = total > 0 ? (teamAVal / total) * 100 : 50;
              const isATeamABetter = stat.higherIsBetter ? teamAVal > teamBVal : teamAVal < teamBVal;
              
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between text-xs opacity-60 mb-1">
                    <span>{formatValue(stat.teamA, stat.format)}</span>
                    <span>{stat.label}</span>
                    <span>{formatValue(stat.teamB, stat.format)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs w-8 text-right ${isATeamABetter ? 'text-green-400' : ''}`}>
                      {teamA?.tag || 'A'}
                    </span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${teamAPercent}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ 
                          backgroundColor: isATeamABetter ? '#22c55e' : PURPLE.base,
                          marginLeft: 'auto'
                        }}
                      />
                    </div>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - teamAPercent}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ 
                          backgroundColor: !isATeamABetter ? '#22c55e' : PURPLE.base,
                        }}
                      />
                    </div>
                    <span className={`text-xs w-8 ${!isATeamABetter ? 'text-green-400' : ''}`}>
                      {teamB?.tag || 'B'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Map Pool Comparison */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-xs opacity-60 mb-2 flex items-center gap-1">
              <Map className="w-3 h-3" />
              Common Map Pool
            </h4>
            <div className="flex flex-wrap gap-1">
              {teamA.mapPool.filter(m => teamB.mapPool.includes(m)).map(map => (
                <span 
                  key={map}
                  className="text-xs px-2 py-1 rounded bg-white/10"
                >
                  {map}
                </span>
              ))}
              {teamA.mapPool.filter(m => teamB.mapPool.includes(m)).length === 0 && (
                <span className="text-xs opacity-50">No common maps</span>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Prediction Result */}
      {prediction && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <WinProbabilityGauge
              teamAName={prediction.teamA.name}
              teamBName={prediction.teamB.name}
              probability={prediction.teamA.winProbability}
              confidence={prediction.confidence}
              size="lg"
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Factor Breakdown */}
      {prediction && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium mb-3" style={{ color: PURPLE.base }}>
            Prediction Factors
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs opacity-60">Rating Difference</div>
              <div className={`font-semibold ${prediction.factors.ratingDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {prediction.factors.ratingDiff > 0 ? '+' : ''}
                {prediction.factors.ratingDiff.toFixed(0)}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs opacity-60">Form Difference</div>
              <div className={`font-semibold ${prediction.factors.formDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {prediction.factors.formDiff > 0 ? '+' : ''}
                {prediction.factors.formDiff.toFixed(1)}
              </div>
            </div>
            {prediction.factors.mapAdvantage && (
              <div className="bg-white/5 rounded-lg p-3 col-span-2">
                <div className="text-xs opacity-60 flex items-center gap-1">
                  <Map className="w-3 h-3" />
                  Map Advantage
                </div>
                <div className="font-semibold" style={{ color: PURPLE.base }}>
                  {prediction.factors.mapAdvantage}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* H2H History */}
      {h2hHistory.length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: PURPLE.base }}>
            <History className="w-4 h-4" />
            Recent H2H History
          </h3>
          <div className="space-y-2">
            {h2hHistory.map((match, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-60">{match.date}</span>
                  <span className="text-sm font-medium" style={{ 
                    color: match.winner === teamA?.name ? '#22c55e' : '#ef4444'
                  }}>
                    {match.winner}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{match.score}</span>
                  <span className="text-xs opacity-50">{match.map}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default TeamH2HCompare;
