/**
 * OrganizationRankings Component
 * Organization (esports org) power rankings
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, TrendingDown, Minus, Trophy, DollarSign, Target } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import RankingTable from './RankingTable';
import RankingsFilter from './RankingsFilter';
import GradeBadge from './GradeBadge';
import type { Organization, ColumnDef } from './types';

const OPERA_COLOR = '#9d4edd';
const OPERA_GLOW = 'rgba(157, 78, 221, 0.4)';

// Circuit colors
const REGION_COLORS: Record<string, string> = {
  'Americas': '#ff4655',
  'EMEA': '#00d4ff',
  'Pacific': '#ff9f1c',
  'China': '#ffd700',
  'International': '#9d4edd',
};

interface OrganizationRankingsProps {
  organizations: Organization[];
  loading?: boolean;
  onOrgClick?: (org: Organization) => void;
}

const OrganizationRankings: React.FC<OrganizationRankingsProps> = ({
  organizations,
  loading = false,
  onOrgClick,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof Organization | string>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    region: null as string | null,
    tier: null as string | null,
    search: '',
  });

  // Available filter options
  const regions = useMemo(() => 
    [...new Set(organizations.map(o => o.region))].sort(),
    [organizations]
  );
  const tiers = useMemo(() => 
    [...new Set(organizations.map(o => o.stats.investmentTier))].sort(),
    [organizations]
  );

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...organizations];

    // Apply filters
    if (filters.region) {
      data = data.filter(o => o.region === filters.region);
    }
    if (filters.tier) {
      data = data.filter(o => o.stats.investmentTier === filters.tier);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(o => 
        o.name.toLowerCase().includes(search) ||
        o.teams.some(t => t.name.toLowerCase().includes(search))
      );
    }

    // Apply sorting
    data.sort((a, b) => {
      let aVal: unknown, bVal: unknown;
      
      if (sortColumn === 'stats.investmentTier') {
        aVal = a.stats.investmentTier;
        bVal = b.stats.investmentTier;
      } else if (sortColumn === 'stats.totalPrizeWinnings') {
        aVal = a.stats.totalPrizeWinnings;
        bVal = b.stats.totalPrizeWinnings;
      } else if (sortColumn === 'stats.longevityScore') {
        aVal = a.stats.longevityScore;
        bVal = b.stats.longevityScore;
      } else {
        aVal = a[sortColumn as keyof Organization];
        bVal = b[sortColumn as keyof Organization];
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
  }, [organizations, filters, sortColumn, sortDirection]);

  // Handle sort
  const handleSort = useCallback((column: keyof Organization | string) => {
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

  // Prize pool bar
  const PrizeBar: React.FC<{ amount: number; max: number }> = ({ amount, max }) => {
    const percentage = max > 0 ? (amount / max) * 100 : 0;
    return (
      <div className="w-full">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="opacity-80">${(amount / 1000000).toFixed(1)}M</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: OPERA_COLOR }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };

  // Columns definition
  const columns: ColumnDef<Organization>[] = [
    { key: 'rank', header: '#', width: '60px', sortable: true, align: 'center' },
    { key: 'name', header: 'Organization', width: '2fr', sortable: true },
    { key: 'region', header: 'Region', width: '120px', sortable: true },
    { key: 'stats.investmentTier', header: 'Tier', width: '80px', sortable: true, align: 'center' },
    { key: 'stats.totalPrizeWinnings', header: 'Prize Pool', width: '150px', sortable: true },
    { key: 'stats.tournamentWins', header: 'Wins', width: '80px', sortable: true, align: 'center' },
    { key: 'stats.longevityScore', header: 'Longevity', width: '100px', sortable: true, align: 'center' },
    { key: 'rankChange', header: 'Change', width: '80px', sortable: true, align: 'center' },
  ];

  // Calculate max prize for bar scaling
  const maxPrize = useMemo(() => 
    Math.max(...organizations.map(o => o.stats.totalPrizeWinnings), 1),
    [organizations]
  );

  // Row renderer
  const renderRow = (org: Organization, index: number) => {
    const rankStyle = getRankStyle(org.rank);
    const regionColor = REGION_COLORS[org.region] || OPERA_COLOR;

    return (
      <div
        className="grid gap-2 p-3 items-center cursor-pointer"
        style={{ gridTemplateColumns: columns.map(c => c.width || '1fr').join(' ') }}
        onClick={() => onOrgClick?.(org)}
      >
        {/* Rank */}
        <div className="flex justify-center">
          <motion.div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              rankStyle.bg,
              rankStyle.text
            )}
            style={org.rank <= 3 ? { border: `1px solid`, borderColor: rankStyle.border, boxShadow: `0 0 10px ${rankStyle.glow}` } : undefined}
            whileHover={{ scale: 1.1 }}
          >
            {org.rank}
          </motion.div>
        </div>

        {/* Organization */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
            {org.logo ? (
              <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 opacity-50" />
            )}
          </div>
          <div>
            <div className="font-medium text-sm">{org.name}</div>
            <div className="text-xs opacity-50">
              {org.teams.length} team{org.teams.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Region */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: regionColor }} />
          <span className="text-sm">{org.region}</span>
        </div>

        {/* Investment Tier */}
        <div className="flex justify-center">
          <GradeBadge grade={org.stats.investmentTier} size="sm" />
        </div>

        {/* Prize Pool */}
        <PrizeBar amount={org.stats.totalPrizeWinnings} max={maxPrize} />

        {/* Tournament Wins */}
        <div className="flex items-center justify-center gap-1">
          <Trophy className="w-3 h-3 opacity-50" />
          <span className="text-sm">{org.stats.tournamentWins}</span>
        </div>

        {/* Longevity Score */}
        <div className="flex justify-center">
          <div className="text-sm font-medium" style={{ color: OPERA_COLOR }}>
            {org.stats.longevityScore}
          </div>
        </div>

        {/* Rank Change */}
        <div className="flex justify-center">
          <RankChange change={org.rankChange} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3">
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: OPERA_COLOR }}>
            {organizations.length}
          </div>
          <div className="text-xs opacity-60">Organizations</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {organizations.filter(o => o.stats.investmentTier === 'S').length}
          </div>
          <div className="text-xs opacity-60">S-Tier Orgs</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            ${(organizations.reduce((sum, o) => sum + o.stats.totalPrizeWinnings, 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs opacity-60">Total Prize Pool</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {organizations.reduce((sum, o) => sum + o.stats.tournamentWins, 0)}
          </div>
          <div className="text-xs opacity-60">Total Wins</div>
        </GlassCard>
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
        emptyMessage="No organizations found"
        pageSize={15}
      />
    </div>
  );
};

export default OrganizationRankings;
