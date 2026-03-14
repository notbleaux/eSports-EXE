/**
 * PlayerRankings Component
 * Individual player leaderboards with ELO ratings
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, TrendingUp, TrendingDown, Minus, Target, Crosshair, Shield, Zap, Eye } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import RankingTable from './RankingTable';
import RankingsFilter from './RankingsFilter';
import ELOBadge from './ELOBadge';
import type { PlayerRanking, PlayerRole, ColumnDef } from './types';

const OPERA_COLOR = '#9d4edd';
const OPERA_GLOW = 'rgba(157, 78, 221, 0.4)';

// Role icons and colors
const ROLE_CONFIG: Record<PlayerRole, { icon: typeof User; color: string; bg: string }> = {
  Duelist: { icon: Crosshair, color: '#ff4655', bg: 'bg-red-500/20' },
  Controller: { icon: Eye, color: '#9d4edd', bg: 'bg-purple-500/20' },
  Initiator: { icon: Zap, color: '#00d4ff', bg: 'bg-cyan-500/20' },
  Sentinel: { icon: Shield, color: '#00ff88', bg: 'bg-green-500/20' },
};

// Region colors
const REGION_COLORS: Record<string, string> = {
  'Americas': '#ff4655',
  'EMEA': '#00d4ff',
  'Pacific': '#ff9f1c',
  'China': '#ffd700',
  'International': '#9d4edd',
};

// Agent icons (simplified - using initials)
const AGENT_COLORS: Record<string, string> = {
  'Jett': '#00d4ff',
  'Phoenix': '#ff6600',
  'Raze': '#ffcc00',
  'Reyna': '#9900cc',
  'Yoru': '#0066ff',
  'Neon': '#00ffff',
  'Iso': '#ffccff',
  'Omen': '#660099',
  'Viper': '#00cc00',
  'Brimstone': '#cc6600',
  'Astra': '#6600cc',
  'Harbor': '#0099cc',
  'Clove': '#ff99cc',
  'Sova': '#0066cc',
  'Breach': '#cc9900',
  'Skye': '#00cc66',
  'KAY/O': '#ff6666',
  'Fade': '#6600ff',
  'Gekko': '#99ff00',
  'Cypher': '#6666ff',
  'Killjoy': '#ffcc00',
  'Sage': '#00cccc',
  'Chamber': '#cc9966',
  'Deadlock': '#cc6600',
};

interface PlayerRankingsProps {
  players: PlayerRanking[];
  loading?: boolean;
  onPlayerClick?: (player: PlayerRanking) => void;
}

const PlayerRankings: React.FC<PlayerRankingsProps> = ({
  players,
  loading = false,
  onPlayerClick,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof PlayerRanking | string>('stats.elo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    region: null as string | null,
    role: null as string | null,
    search: '',
  });

  // Available filter options
  const regions = useMemo(() => 
    [...new Set(players.map(p => p.region))].sort(),
    [players]
  );
  const roles = useMemo(() => 
    [...new Set(players.map(p => p.role))].sort(),
    [players]
  );

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...players];

    // Apply filters
    if (filters.region) {
      data = data.filter(p => p.region === filters.region);
    }
    if (filters.role) {
      data = data.filter(p => p.role === filters.role);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.tag.toLowerCase().includes(search) ||
        p.team.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    data.sort((a, b) => {
      let aVal: unknown, bVal: unknown;
      
      if (sortColumn === 'stats.elo') {
        aVal = a.stats.elo;
        bVal = b.stats.elo;
      } else if (sortColumn === 'stats.acs') {
        aVal = a.stats.acs;
        bVal = b.stats.acs;
      } else if (sortColumn === 'stats.kd') {
        aVal = a.stats.kd;
        bVal = b.stats.kd;
      } else if (sortColumn === 'stats.adr') {
        aVal = a.stats.adr;
        bVal = b.stats.adr;
      } else if (sortColumn === 'stats.kast') {
        aVal = a.stats.kast;
        bVal = b.stats.kast;
      } else {
        aVal = a[sortColumn as keyof PlayerRanking];
        bVal = b[sortColumn as keyof PlayerRanking];
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
  }, [players, filters, sortColumn, sortDirection]);

  // Top 10 players
  const topPlayers = useMemo(() => filteredData.slice(0, 10), [filteredData]);

  // Handle sort
  const handleSort = useCallback((column: keyof PlayerRanking | string) => {
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

  // Role badge
  const RoleBadge: React.FC<{ role: PlayerRole }> = ({ role }) => {
    const config = ROLE_CONFIG[role];
    const Icon = config.icon;
    return (
      <div
        className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', config.bg)}
        style={{ color: config.color }}
      >
        <Icon className="w-3 h-3" />
        <span className="hidden sm:inline">{role}</span>
      </div>
    );
  };

  // Agent icons
  const AgentIcons: React.FC<{ agents: string[] }> = ({ agents }) => (
    <div className="flex -space-x-1">
      {agents.slice(0, 3).map((agent, i) => (
        <motion.div
          key={agent}
          initial={{ scale: 0, x: -10 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#12121a]"
          style={{ backgroundColor: AGENT_COLORS[agent] || '#666', color: '#fff' }}
          title={agent}
        >
          {agent.slice(0, 1)}
        </motion.div>
      ))}
    </div>
  );

  // Stat bar
  const StatBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs font-medium w-10 text-right tabular-nums">{value.toFixed(1)}</span>
      </div>
    );
  };

  // Columns definition
  const columns: ColumnDef<PlayerRanking>[] = [
    { key: 'rank', header: '#', width: '50px', sortable: true, align: 'center' },
    { key: 'name', header: 'Player', width: '2fr', sortable: true },
    { key: 'role', header: 'Role', width: '90px', sortable: true },
    { key: 'stats.elo', header: 'ELO', width: '100px', sortable: true, align: 'center' },
    { key: 'stats.acs', header: 'ACS', width: '90px', sortable: true, align: 'center' },
    { key: 'stats.kd', header: 'K/D', width: '80px', sortable: true, align: 'center' },
    { key: 'stats.adr', header: 'ADR', width: '90px', sortable: true, align: 'center' },
    { key: 'stats.kast', header: 'KAST%', width: '90px', sortable: true, align: 'center' },
  ];

  // Calculate max stats for bars
  const maxStats = useMemo(() => ({
    acs: Math.max(...players.map(p => p.stats.acs), 1),
    kd: Math.max(...players.map(p => p.stats.kd), 1),
    adr: Math.max(...players.map(p => p.stats.adr), 1),
    kast: 100,
  }), [players]);

  // Row renderer
  const renderRow = (player: PlayerRanking, index: number) => {
    const rankStyle = getRankStyle(player.rank);
    const regionColor = REGION_COLORS[player.region] || OPERA_COLOR;
    const roleConfig = ROLE_CONFIG[player.role];

    return (
      <div
        className="grid gap-2 p-3 items-center cursor-pointer"
        style={{ gridTemplateColumns: columns.map(c => c.width || '1fr').join(' ') }}
        onClick={() => onPlayerClick?.(player)}
      >
        {/* Rank */}
        <div className="flex justify-center">
          <motion.div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
              rankStyle.bg,
              rankStyle.text
            )}
            style={player.rank <= 3 ? { border: `1px solid`, borderColor: rankStyle.border, boxShadow: `0 0 10px ${rankStyle.glow}` } : undefined}
            whileHover={{ scale: 1.1 }}
          >
            {player.rank}
          </motion.div>
        </div>

        {/* Player */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 opacity-50" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{player.name}</div>
            <div className="flex items-center gap-2 text-xs opacity-50">
              <span>{player.tag}</span>
              <span style={{ color: regionColor }}>{player.team}</span>
            </div>
          </div>
          <AgentIcons agents={player.agents} />
        </div>

        {/* Role */}
        <div className="flex justify-start">
          <RoleBadge role={player.role} />
        </div>

        {/* ELO */}
        <div className="flex justify-center">
          <ELOBadge elo={player.stats.elo} size="sm" />
        </div>

        {/* ACS */}
        <div className="flex justify-center">
          <span className="text-sm font-bold" style={{ color: roleConfig.color }}>
            {player.stats.acs.toFixed(0)}
          </span>
        </div>

        {/* K/D */}
        <div className="flex justify-center">
          <span className={cn(
            'text-sm font-medium',
            player.stats.kd >= 1.2 ? 'text-green-400' : player.stats.kd >= 1 ? 'text-blue-400' : 'text-orange-400'
          )}>
            {player.stats.kd.toFixed(2)}
          </span>
        </div>

        {/* ADR */}
        <div className="flex justify-center">
          <span className="text-sm tabular-nums">
            {player.stats.adr.toFixed(1)}
          </span>
        </div>

        {/* KAST */}
        <div className="flex justify-center">
          <span className={cn(
            'text-sm font-medium',
            player.stats.kast >= 75 ? 'text-green-400' : 'text-white'
          )}>
            {player.stats.kast.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top 10 Podium */}
      {topPlayers.length >= 3 && !filters.search && !filters.region && !filters.role && (
        <div className="grid grid-cols-3 gap-3">
          {/* 2nd Place */}
          <GlassCard className="p-4 text-center" hoverGlow="rgba(209, 213, 219, 0.4)">
            <div className="text-3xl mb-2">🥈</div>
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {topPlayers[1].avatar ? (
                <img src={topPlayers[1].avatar} alt={topPlayers[1].name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 opacity-50" />
              )}
            </div>
            <div className="font-bold text-sm">{topPlayers[1].name}</div>
            <div className="text-xs opacity-60 mb-2">{topPlayers[1].team}</div>
            <ELOBadge elo={topPlayers[1].stats.elo} size="sm" />
          </GlassCard>

          {/* 1st Place */}
          <GlassCard className="p-4 text-center transform scale-105" hoverGlow="rgba(251, 191, 36, 0.4)">
            <div className="text-4xl mb-2">🥇</div>
            <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center overflow-hidden ring-2 ring-yellow-400/50">
              {topPlayers[0].avatar ? (
                <img src={topPlayers[0].avatar} alt={topPlayers[0].name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 opacity-50" />
              )}
            </div>
            <div className="font-bold text-lg">{topPlayers[0].name}</div>
            <div className="text-xs opacity-60 mb-2">{topPlayers[0].team}</div>
            <ELOBadge elo={topPlayers[0].stats.elo} size="md" />
          </GlassCard>

          {/* 3rd Place */}
          <GlassCard className="p-4 text-center" hoverGlow="rgba(217, 119, 6, 0.4)">
            <div className="text-3xl mb-2">🥉</div>
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {topPlayers[2].avatar ? (
                <img src={topPlayers[2].avatar} alt={topPlayers[2].name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 opacity-50" />
              )}
            </div>
            <div className="font-bold text-sm">{topPlayers[2].name}</div>
            <div className="text-xs opacity-60 mb-2">{topPlayers[2].team}</div>
            <ELOBadge elo={topPlayers[2].stats.elo} size="sm" />
          </GlassCard>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3">
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: OPERA_COLOR }}>
            {players.length}
          </div>
          <div className="text-xs opacity-60">Players</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {Math.round(players.reduce((sum, p) => sum + p.stats.elo, 0) / players.length)}
          </div>
          <div className="text-xs opacity-60">Avg ELO</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {Math.max(...players.map(p => p.stats.acs)).toFixed(0)}
          </div>
          <div className="text-xs opacity-60">Highest ACS</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {players.reduce((sum, p) => sum + p.stats.matchesPlayed, 0)}
          </div>
          <div className="text-xs opacity-60">Total Matches</div>
        </GlassCard>
      </div>

      {/* Filters */}
      <RankingsFilter
        regions={regions}
        tiers={[]}
        roles={roles}
        selectedRegion={filters.region}
        selectedTier={null}
        selectedRole={filters.role}
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
        emptyMessage="No players found"
        pageSize={20}
      />
    </div>
  );
};

export default PlayerRankings;
