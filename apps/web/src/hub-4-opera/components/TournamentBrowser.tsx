// @ts-nocheck
/**
 * TournamentBrowser Component
 * Display and filter tournaments from TiDB
 * [Ver001.000]
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, ChevronRight, Filter } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Tournament, TournamentFilters, CircuitRegion, TournamentTier } from '../types';

// Purple theme colors
const PURPLE = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

// Circuit colors for visual distinction
const CIRCUIT_COLORS: Record<CircuitRegion, string> = {
  Americas: '#ff4655',
  EMEA: '#00d4ff',
  Pacific: '#ff9f1c',
  China: '#ffd700',
  International: '#9d4edd',
};

// Tier badges
const TIER_BADGES: Record<TournamentTier, { bg: string; text: string }> = {
  Champions: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  Masters: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'Lock In': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  Challenger: { bg: 'bg-green-500/20', text: 'text-green-400' },
  Premier: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  Qualifier: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  Showmatch: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
};

interface TournamentBrowserProps {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  onSelectTournament: (tournament: Tournament) => void;
  filters: TournamentFilters;
  onFiltersChange: (filters: TournamentFilters) => void;
  loading: boolean;
}

function TournamentBrowser({
  tournaments,
  selectedTournament,
  onSelectTournament,
  filters,
  onFiltersChange,
  loading,
}: TournamentBrowserProps): JSX.Element {
  // Filter tournaments
  const filteredTournaments = tournaments.filter(t => {
    if (filters.circuit && t.circuit !== filters.circuit) return false;
    if (filters.tier && t.tier !== filters.tier) return false;
    if (filters.season && t.season !== filters.season) return false;
    if (filters.status && t.status !== filters.status) return false;
    return true;
  });

  // Get unique values for filters
  const circuits: CircuitRegion[] = ['Americas', 'EMEA', 'Pacific', 'China', 'International'];
  const tiers: TournamentTier[] = ['Champions', 'Masters', 'Challenger', 'Premier', 'Qualifier', 'Lock In', 'Showmatch'];
  const seasons = [...new Set(tournaments.map(t => t.season).filter(Boolean))];

  const handleCircuitChange = (circuit: CircuitRegion | '') => {
    onFiltersChange({ ...filters, circuit: circuit || undefined });
  };

  const handleTierChange = (tier: TournamentTier | '') => {
    onFiltersChange({ ...filters, tier: tier || undefined });
  };

  const handleSeasonChange = (season: string) => {
    onFiltersChange({ ...filters, season: season || undefined });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4" style={{ color: PURPLE.base }} />
          <span className="text-sm font-medium" style={{ color: PURPLE.base }}>
            Filters
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Circuit Filter */}
          <select
            value={filters.circuit || ''}
            onChange={(e) => handleCircuitChange(e.target.value as CircuitRegion | '')}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            style={{ color: '#e8e6e3' }}
          >
            <option value="">All Circuits</option>
            {circuits.map(circuit => (
              <option key={circuit} value={circuit}>{circuit}</option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={filters.tier || ''}
            onChange={(e) => handleTierChange(e.target.value as TournamentTier | '')}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            style={{ color: '#e8e6e3' }}
          >
            <option value="">All Tiers</option>
            {tiers.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>

          {/* Season Filter */}
          <select
            value={filters.season || ''}
            onChange={(e) => handleSeasonChange(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            style={{ color: '#e8e6e3' }}
          >
            <option value="">All Seasons</option>
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Tournament List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 rounded-full"
              style={{ borderColor: `${PURPLE.base} transparent ${PURPLE.base} transparent` }}
            />
          </div>
        ) : filteredTournaments.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: PURPLE.base }} />
            <p className="text-sm opacity-60">No tournaments found</p>
          </GlassCard>
        ) : (
          filteredTournaments.map((tournament, index) => {
            const isSelected = selectedTournament?.tournament_id === tournament.tournament_id;
            const circuitColor = CIRCUIT_COLORS[tournament.circuit || 'International'];

            return (
              <motion.div
                key={tournament.tournament_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    borderColor: isSelected ? PURPLE.base : undefined,
                    boxShadow: isSelected ? `0 0 20px ${PURPLE.glow}` : undefined,
                  }}
                  hoverGlow={isSelected ? PURPLE.glow : undefined}
                  onClick={() => onSelectTournament(tournament)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Tournament Name */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate" style={{ color: PURPLE.base }}>
                          {tournament.name}
                        </h3>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PURPLE.base }}
                          />
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {tournament.circuit}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(tournament.start_date)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(tournament.status)}`} />
                          {tournament.status}
                        </span>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col items-end gap-2 ml-3">
                      {/* Tier Badge */}
                      <span className={`text-xs px-2 py-1 rounded ${TIER_BADGES[tournament.tier]?.bg} ${TIER_BADGES[tournament.tier]?.text}`}>
                        {tournament.tier}
                      </span>
                      
                      {/* Circuit Indicator */}
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: circuitColor }}
                      />
                    </div>
                  </div>

                  {/* Prize Pool (if available) */}
                  {tournament.prize_pool_usd && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-xs opacity-60">
                        Prize Pool: <span className="font-mono" style={{ color: PURPLE.base }}>
                          ${tournament.prize_pool_usd.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Arrow indicator */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" style={{ color: PURPLE.base }} />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Results Count */}
      <div className="text-xs opacity-50 text-center">
        Showing {filteredTournaments.length} of {tournaments.length} tournaments
      </div>
    </div>
  );
}

export default TournamentBrowser;
