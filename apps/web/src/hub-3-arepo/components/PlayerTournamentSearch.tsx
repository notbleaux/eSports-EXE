/**
 * PlayerTournamentSearch Component
 * Cross-reference: Player performance in specific tournaments
 * Combines SATOR (performance data) + OPERA (tournament metadata)
 * 
 * [Ver001.000]
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Calendar,
  MapPin,
  Target,
  Activity,
  Award,
  Clock,
  Database
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCrossReferenceEngine } from '../hooks/useArepoData';
import type { PlayerTournamentPerformance } from '@/api/crossReference';

interface PlayerTournamentSearchProps {
  hubColor?: string;
  hubGlow?: string;
}

const PlayerTournamentSearch: React.FC<PlayerTournamentSearchProps> = ({
  hubColor = '#0066ff',
  hubGlow = 'rgba(0, 102, 255, 0.4)'
}) => {
  const [playerId, setPlayerId] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [result, setResult] = useState<PlayerTournamentPerformance | null>(null);
  
  const { 
    getPlayerTournamentStats, 
    isLoading, 
    error 
  } = useCrossReferenceEngine();

  const handleSearch = useCallback(async () => {
    if (!playerId.trim() || !tournamentId.trim()) return;
    
    const data = await getPlayerTournamentStats(playerId, tournamentId);
    if (data) {
      setResult(data);
      setPlayerName(data.player_name);
      setTournamentName(data.tournament_name);
    }
  }, [playerId, tournamentId, getPlayerTournamentStats]);

  const handleClear = () => {
    setPlayerId('');
    setTournamentId('');
    setPlayerName('');
    setTournamentName('');
    setResult(null);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-400';
      case 'declining':
        return 'text-red-400';
      default:
        return 'text-slate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <GlassCard hoverGlow={hubGlow} className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${hubColor}20` }}
          >
            <Search className="w-5 h-5" style={{ color: hubColor }} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Player + Tournament Search</h3>
            <p className="text-sm text-slate">
              Cross-reference player performance with tournament context
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Player Input */}
          <div className="space-y-2">
            <label className="text-sm text-slate flex items-center gap-2">
              <User className="w-4 h-4" />
              Player ID or Name
            </label>
            <input
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="e.g., TenZ, yay, aspas"
              className="w-full px-4 py-3 bg-void-mid rounded-lg border border-mist 
                       focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                       text-white placeholder-slate transition-colors"
            />
          </div>

          {/* Tournament Input */}
          <div className="space-y-2">
            <label className="text-sm text-slate flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tournament
            </label>
            <input
              type="text"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              placeholder="e.g., VCT 2025 Masters"
              className="w-full px-4 py-3 bg-void-mid rounded-lg border border-mist 
                       focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                       text-white placeholder-slate transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleSearch}
            disabled={isLoading || !playerId.trim() || !tournamentId.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: hubColor,
              color: '#ffffff'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Cross-Reference
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={handleClear}
            className="px-6 py-3 rounded-lg font-medium border border-mist
                     text-slate hover:text-white hover:border-[#0066ff]/50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear
          </motion.button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header Card */}
            <GlassCard hoverGlow={hubGlow} className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-6 h-6" style={{ color: hubColor }} />
                    <h2 className="font-display text-2xl font-bold">{result.player_name}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-slate">
                    <Trophy className="w-4 h-4" />
                    <span>{result.tournament_name}</span>
                  </div>
                </div>
                <div 
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ 
                    backgroundColor: `${hubColor}15`,
                    color: hubColor 
                  }}
                >
                  Rank #{result.tournament_ranking}
                </div>
              </div>

              {/* Data Source Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate mb-4">
                <Database className="w-3 h-3" />
                <span>Data sources: </span>
                <span className="px-2 py-0.5 rounded bg-[#ffd700]/20 text-[#ffd700]">SATOR</span>
                <span className="px-2 py-0.5 rounded bg-[#9d4edd]/20 text-[#9d4edd]">OPERA</span>
              </div>

              {/* Performance Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox 
                  label="Matches Played" 
                  value={result.performance.matches_played} 
                  icon={Activity}
                  color={hubColor}
                />
                <StatBox 
                  label="Avg ACS" 
                  value={result.performance.avg_acs.toFixed(1)} 
                  icon={Target}
                  color={hubColor}
                />
                <StatBox 
                  label="SimRating" 
                  value={result.performance.avg_sim_rating.toFixed(1)} 
                  icon={Award}
                  color={hubColor}
                />
                <StatBox 
                  label="KDR" 
                  value={result.performance.kdr.toFixed(2)} 
                  icon={BarChart3}
                  color={hubColor}
                />
              </div>
            </GlassCard>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <GlassCard hoverGlow={hubGlow} className="p-6">
                <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: hubColor }} />
                  Performance Metrics
                </h4>
                <div className="space-y-3">
                  <MetricRow label="Average ACS" value={result.performance.avg_acs.toFixed(1)} />
                  <MetricRow label="Average ADR" value={result.performance.avg_adr.toFixed(1)} />
                  <MetricRow label="KAST %" value={`${(result.performance.avg_kast * 100).toFixed(1)}%`} />
                  <MetricRow label="KDR" value={result.performance.kdr.toFixed(2)} />
                  <MetricRow label="Peak Performance" value={result.performance.peak_performance.toFixed(1)} />
                  <MetricRow label="Consistency Score" value={`${(result.performance.consistency_score * 100).toFixed(0)}%`} />
                </div>
              </GlassCard>

              {/* Tournament Context */}
              <GlassCard hoverGlow={hubGlow} className="p-6">
                <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" style={{ color: hubColor }} />
                  Tournament Context
                </h4>
                <div className="space-y-3">
                  <MetricRow 
                    label="Circuit" 
                    value={result.tournament_context.circuit} 
                    icon={Award}
                  />
                  <MetricRow 
                    label="Season" 
                    value={result.tournament_context.season} 
                    icon={Calendar}
                  />
                  <MetricRow 
                    label="Region" 
                    value={result.tournament_context.region} 
                    icon={MapPin}
                  />
                  <MetricRow 
                    label="Dates" 
                    value={`${result.tournament_context.start_date} to ${result.tournament_context.end_date}`} 
                    icon={Clock}
                  />
                  {result.tournament_context.prize_pool && (
                    <MetricRow 
                      label="Prize Pool" 
                      value={`$${result.tournament_context.prize_pool.toLocaleString()}`} 
                      icon={Trophy}
                    />
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Performance Analysis */}
            <GlassCard hoverGlow={hubGlow} className="p-6">
              <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: hubColor }} />
                Performance Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-void-mid">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${hubColor}20` }}
                  >
                    {getTrendIcon(result.performance_trend)}
                  </div>
                  <div>
                    <div className="text-sm text-slate">Performance Trend</div>
                    <div className={`font-medium capitalize ${getTrendColor(result.performance_trend)}`}>
                      {result.performance_trend}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg bg-void-mid">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: result.comparison_to_average >= 0 
                        ? 'rgba(0, 255, 136, 0.2)' 
                        : 'rgba(255, 70, 85, 0.2)' 
                    }}
                  >
                    {result.comparison_to_average >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-slate">vs Tournament Average</div>
                    <div className={`font-medium ${result.comparison_to_average >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.comparison_to_average >= 0 ? '+' : ''}{result.comparison_to_average.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components

interface StatBoxProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, icon: Icon, color }) => (
  <div className="p-4 rounded-lg bg-void-mid border border-mist">
    <Icon className="w-5 h-5 mb-2" style={{ color }} />
    <div className="text-2xl font-display font-bold">{value}</div>
    <div className="text-xs text-slate">{label}</div>
  </div>
);

interface MetricRowProps {
  label: string;
  value: string;
  icon?: React.ElementType;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-mist/50 last:border-0">
    <div className="flex items-center gap-2 text-slate">
      {Icon && <Icon className="w-4 h-4" />}
      <span className="text-sm">{label}</span>
    </div>
    <span className="font-medium">{value}</span>
  </div>
);

export default PlayerTournamentSearch;
