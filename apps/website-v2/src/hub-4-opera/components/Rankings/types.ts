/**
 * OPERA Rankings Type Definitions
 * 
 * [Ver001.000]
 */

import type { CircuitRegion } from '../../types';

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export interface Team {
  id: string;
  name: string;
  tag: string;
  game: string;
}

export interface Organization {
  id: string;
  name: string;
  logo: string;
  region: CircuitRegion;
  teams: Team[];
  stats: {
    totalPrizeWinnings: number;
    tournamentWins: number;
    matchesWon: number;
    matchesLost: number;
    investmentTier: 'S' | 'A' | 'B' | 'C';
    longevityScore: number; // 0-100
  };
  rank: number;
  rankChange: number; // +5, -2, etc.
}

// ============================================================================
// TEAM RANKING TYPES
// ============================================================================

export interface TeamRanking {
  id: string;
  name: string;
  tag: string;
  logo: string;
  organization?: string;
  region: CircuitRegion;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  stats: {
    rating: number;
    wins: number;
    losses: number;
    winRate: number;
    avgRoundDiff: number;
    recentForm: ('W' | 'L')[]; // Last 5 matches
  };
  rank: number;
  rankChange: number;
}

// ============================================================================
// PLAYER RANKING TYPES
// ============================================================================

export type PlayerRole = 'Duelist' | 'Controller' | 'Initiator' | 'Sentinel';

export interface PlayerRanking {
  id: string;
  name: string;
  tag: string;
  avatar: string;
  team: string;
  region: CircuitRegion;
  role: PlayerRole;
  agents: string[]; // Most played agents
  stats: {
    elo: number;
    rating: number;
    acs: number; // Average combat score
    kd: number;
    adr: number; // Average damage per round
    kast: number; // Kill, assist, survive, trade %
    matchesPlayed: number;
  };
  rank: number;
  rankChange: number;
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface RankingTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  sortColumn: keyof T | string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: keyof T | string) => void;
  rowRenderer: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface FilterState {
  region: string | null;
  tier: string | null;
  role: string | null;
  search: string;
}

export interface RankingsFilterProps {
  regions: string[];
  tiers: string[];
  roles?: string[];
  selectedRegion: string | null;
  selectedTier: string | null;
  selectedRole?: string | null;
  searchQuery?: string;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

// ============================================================================
// BADGE TYPES
// ============================================================================

export interface ELOBadgeProps {
  elo: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  nextTier?: number;
}

export interface GradeBadgeProps {
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  size?: 'sm' | 'md' | 'lg';
  showPlusMinus?: boolean;
  suffix?: '+' | '-' | '';
}

// ============================================================================
// CONTAINER TYPES
// ============================================================================

export type RankingsTab = 'organizations' | 'teams' | 'players';

export interface RankingsContainerProps {
  defaultTab?: RankingsTab;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface RankingsFilters {
  region?: string;
  tier?: string;
  role?: string;
  search?: string;
}

export interface UseRankingsDataReturn {
  orgRankings: Organization[];
  teamRankings: TeamRanking[];
  playerRankings: PlayerRanking[];
  loading: {
    organizations: boolean;
    teams: boolean;
    players: boolean;
  };
  error: string | null;
  fetchOrgRankings: (filters?: RankingsFilters) => Promise<void>;
  fetchTeamRankings: (filters?: RankingsFilters) => Promise<void>;
  fetchPlayerRankings: (filters?: RankingsFilters) => Promise<void>;
  refreshAll: () => Promise<void>;
}
