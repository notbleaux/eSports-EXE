/**
 * TeamRankings Component
 * Team power rankings with tier-based grouping
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Minus, Target, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import RankingTable from './RankingTable';
import RankingsFilter from './RankingsFilter';
import GradeBadge from './GradeBadge';
import type { TeamRanking, ColumnDef } from './types';

const OPERA_COLOR = '#9d4edd';
const OPERA_GLOW = 'rgba(157, 78, 221, 0.4)';

// Tier colors
const TIER_COLORS: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  S: { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'rgba(251, 191, 36, 0.4)', border: 'border-amber-500/30' },
  A: { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'rgba(168, 85, 247, 0.4)', border: 'border-purple-500/30' },
  B: { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.4)', border: 'border-blue-500/30' },
  C: { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'rgba(34, 197, 94, 0.4)', border: 'border-green-500/30' },
  D: { bg: 'bg-gray-500/20', text: 'text-gray-400', glow: 'rgba(156, 163, 175, 0.4)', border: 'border-gray-500/30' },
};

// Region colors
const REGION_COLORS: Record<string, string> = {
  'Americas': '#ff4655',
  'EMEA': '#00d4ff',
  'Pacific': '#ff9f1c',
  'China': '#ffd700',
  'International': '#9d4edd',
};

interface TeamRankingsProps {
  teams: TeamRanking[];
  loading?: boolean;
  onTeamClick?: (team: TeamRanking) => void;
}

const TeamRankings: React.FC<TeamRankingsProps> = ({
  teams,
  loading = false,
  onTeamClick,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof TeamRanking | string>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    region: null as string | null,
    tier: null as string | null,
    search: '',
  });

  // Available filter options
  const regions = useMemo(() => 
    [...new Set(teams.map(t => t.region))].sort(),
    [teams]
  );
  const tiers = useMemo(() => 
    [...new Set(teams.map(t => t.tier))].sort(),
    [teams]
  );

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...teams];

    // Apply filters
    if (filters.region) {
      data = data.filter(t => t.region === filters.region);
    }
    if (filters.tier) {
      data = data.filter(t => t.tier === filters.tier);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.tag.toLowerCase().includes(search) ||
        (t.organization && t.organization.toLowerCase().includes(search))
      );
    }

    // Apply sorting
    data.sort((a, b) => {
      let aVal: unknown, bVal: unknown;
      
      if (sortColumn === 'stats.rating') {
        aVal = a.stats.rating;
        bVal = b.stats.rating;
      } else if (sortColumn === 'stats.winRate') {
        aVal = a.stats.winRate;
        bVal = b.stats.winRate;
      } else if (sortColumn === 'tier') {
        const tierOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
        aVal = tierOrder[a.tier] || 0;
        bVal = tierOrder[b.tier] || 0;
      } else {
        aVal = a[sortColumn as keyof TeamRanking];
        bVal = b[sortColumn as keyof TeamRanking];
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return data;
  }, [teams, filters, sortColumn, sortDirection]);

  // Group by tier for display
  const teamsByTier = useMemo(() => {
    const grouped: Record<string, TeamRanking[]> = { S: [], A: [], B: [], C: [], D: [] };
    filteredData.forEach(team => {
      if (grouped[team.tier]) {
        grouped[team.tier].push(team);
      }
    });
    return grouped;
  }, [filteredData]);

  // Handle sort
  const handleSort = useCallback((column: keyof TeamRanking | string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }, [sortColumn]);

  // Get rank style
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'rgba(251, 191, 36, 0.4)' };
      case 2:
        return { bg: 'bg-gray-300/20', border: 'border-gray-300/30', text: 'text-gray-300', glow: 'rgba(209, 213, 219, 0.4)' };
      case 3:
        return { bg: 'bg-amber-600/20', border: 'border-amber-600/30', text: 'text-amber-400', glow: 'rgba(217, 119, 6, 0.4)' };
      default:
        return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white', glow: 'rgba(255,255,255,0.1)' };
    }
  };

  // Rank change indicator
  const RankChange: React.FC<{ change: number }> = ({ change }) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-0.5 text-green-400 text-xs">
          <TrendingUp className="w-3 h-3" />
          <span>+{change}</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="flex items-center gap-0.5 text-red-400 text-xs">
          <TrendingDown className="w-3 h-3" />
          <span>{change}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-0.5 text-gray-400 text-xs">
        <Minus className="w-3 h-3" />
        <span>-</span>
      </div>
    );
  };

  // Recent form indicator
  const RecentForm: React.FC<{ form: ('W' | 'L')[] }> = ({ form }) => (
    <div className="flex gap-0.5">
      {form.slice(0, 5).map((result, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            'w-5 h-5 rounded text-xs font-bold flex items-center justify-center',
            result === 'W' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400'
          )}
        >
          {result}
        </motion.div>
      ))}
    </div>
  );

  // Win rate bar
  const WinRateBar: React.FC<{ rate: number }> = ({ rate }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            rate >= 70 ? 'bg-green-500' : rate >= 50 ? 'bg-blue-500' : 'bg-orange-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right">{rate.toFixed(1)}%</span>
    </div>
  );

  // Columns definition
  const columns: ColumnDef<TeamRanking>[] = [
    { key: 'rank', header: '#', width: '60px', sortable: true, align: 'center' },
    { key: 'name', header: 'Team', width: '2fr', sortable: true },
    { key: 'tier', header: 'Tier', width: '80px', sortable: true, align: 'center' },
    { key: 'region', header: 'Region', width: '100px', sortable: true },
    { key: 'stats.rating', header: 'Rating', width: '90px', sortable: true, align: 'center' },
    { key: 'stats.winRate', header: 'Win Rate', width: '140px', sortable: true },
    { key: 'stats.recentForm', header: 'Form', width: '150px', sortable: false, align: 'center' },
    { key: 'rankChange', header: 'Change', width: '80px', sortable: true, align: 'center' },
  ];

  // Row renderer
  const renderRow = (team: TeamRanking, index: number) => {
    const rankStyle = getRankStyle(team.rank);
    const tierColors = TIER_COLORS[team.tier] || TIER_COLORS.D;
    const regionColor = REGION_COLORS[team.region] || OPERA_COLOR;

    return (
      <div
        className="grid gap-2 p-3 items-center cursor-pointer"
        style={{ gridTemplateColumns: columns.map(c => c.width || '1fr').join(' ') }}
        onClick={() => onTeamClick?.(team)}
      >
        {/* Rank */}
        <div className="flex justify-center">
          <motion.div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              rankStyle.bg,
              rankStyle.text
            )}
            style={team.rank <= 3 ? { border: `1px solid`, borderColor: rankStyle.border, boxShadow: `0 0 10px ${rankStyle.glow}` } : undefined}
            whileHover={{ scale: 1.1 }}
          >
            {team.rank}
          </motion.div>
        </div>

        {/* Team */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden font-bold text-sm"
            style={{ backgroundColor: `${regionColor}20`, color: regionColor }}
          >
            {team.tag}
          </div>
          <div>
            <div className="font-medium text-sm">{team.name}</div>
            {team.organization && (
              <div className="text-xs opacity-50">{team.organization}</div>
            )}
          </div>
        </div>

        {/* Tier */}
        <div className="flex justify-center">
          <GradeBadge grade={team.tier} size="sm" />
        </div>

        {/* Region */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: regionColor }} />
          <span className="text-sm">{team.region}</span>
        </div>

        {/* Rating */}
        <div className="flex justify-center">
          <span className="text-sm font-bold" style={{ color: tierColors.text }}>
            {team.stats.rating.toFixed(0)}
          </span>
        </div>

        {/* Win Rate */}
        <WinRateBar rate={team.stats.winRate} />

        {/* Recent Form */}
        <div className="flex justify-center">
          <RecentForm form={team.stats.recentForm} />
        </div>

        {/* Rank Change */}
        <div className="flex justify-center">
          <RankChange change={team.rankChange} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tier Summary */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(TIER_COLORS).map(([tier, colors]) => (
          <GlassCard
            key={tier}
            className={cn('p-3 text-center cursor-pointer transition-colors', filters.tier === tier && 'ring-1')}
            style={{ borderColor: filters.tier === tier ? colors.text : undefined }}
            onClick={() => setFilters(prev => ({ ...prev, tier: prev.tier === tier ? null : tier }))}
          >
            <div className="text-2xl font-bold" style={{ color: colors.text }}>
              {teamsByTier[tier]?.length || 0}
            </div>
            <div className="text-xs opacity-60">Tier {tier}</div>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <RankingsFilter
        regions={regions}
        tiers={tiers}
        selectedRegion={filters.region}
        selectedTier={filters.tier}
        searchQuery={filters.search}
        onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
      />

      {/* Table */}
      <RankingTable
        data={filteredData}
        columns={columns}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        rowRenderer={renderRow}
        loading={loading}
        emptyMessage="No teams found"
        pageSize={20}
      />
    </div>
  );
};

export default TeamRankings;
