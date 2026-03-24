/**
 * OPERA Hub Type Definitions - eSports Hub
 * TypeScript interfaces and types for tournament data, schedules, patches, and circuit standings
 * 
 * [Ver002.000] - Refactored: Map visualization types replaced with eSports data types
 */

// ============================================================================
// CIRCUIT TYPES
// ============================================================================

/** VCT Circuit regions */
export type CircuitRegion = 'Americas' | 'EMEA' | 'Pacific' | 'China' | 'International';

/** Tournament tier classification */
export type TournamentTier = 'Champions' | 'Masters' | 'Lock In' | 'Challenger' | 'Premier' | 'Qualifier' | 'Showmatch';

/** Tournament lifecycle status */
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';

/** Match status for scheduling */
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled' | 'forfeited';

/** Patch type classification */
export type PatchType = 'major' | 'minor' | 'hotfix' | 'beta';

/** Qualification status for circuit standings */
export type QualificationStatus = 'qualified_champions' | 'qualified_masters' | 'qualified_challengers' | 'eliminated' | 'in_contention';

// ============================================================================
// TOURNAMENT TYPES
// ============================================================================

/** Tournament data structure matching opera_tournaments schema */
export interface Tournament {
  tournament_id: number;
  name: string;
  tier: TournamentTier;
  game: string;
  region: CircuitRegion;
  circuit?: CircuitRegion;
  organizer?: string;
  prize_pool_usd?: number;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
  season?: string;
  sator_cross_ref?: string;
  created_at: string;
  updated_at: string;
}

/** Simplified tournament for lists */
export interface TournamentListItem {
  tournament_id: number;
  name: string;
  tier: TournamentTier;
  circuit: CircuitRegion;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
}

/** Tournament filter options */
export interface TournamentFilters {
  circuit?: CircuitRegion;
  tier?: TournamentTier;
  season?: string;
  status?: TournamentStatus;
  game?: string;
}

// ============================================================================
// SCHEDULE TYPES
// ============================================================================

/** Match schedule data matching opera_schedules schema */
export interface MatchSchedule {
  schedule_id: number;
  tournament_id: number;
  match_id: string;
  round_name: string;
  stage?: string;
  team_a_id?: number;
  team_b_id?: number;
  team_a_name?: string;
  team_b_name?: string;
  scheduled_at: string;
  stream_url?: string;
  status: MatchStatus;
  team_a_score?: number;
  team_b_score?: number;
  winner_team_id?: number;
  duration_minutes?: number;
  sator_match_ref?: string;
  created_at: string;
  updated_at: string;
}

/** Match display format for UI */
export interface MatchDisplay {
  id: string;
  tournamentId: number;
  tournamentName: string;
  stage: string;
  round: string;
  teamA: {
    id: number;
    name: string;
    score?: number;
  };
  teamB: {
    id: number;
    name: string;
    score?: number;
  };
  scheduledAt: Date;
  status: MatchStatus;
  streamUrl?: string;
  isLive: boolean;
  isCompleted: boolean;
}

// ============================================================================
// PATCH TYPES
// ============================================================================

/** Patch data matching opera_patches schema */
export interface Patch {
  patch_id: number;
  version: string;
  game: string;
  patch_type: PatchType;
  release_date: string;
  notes_url?: string;
  summary?: string;
  agent_changes?: PatchAgentChange[];
  weapon_changes?: PatchWeaponChange[];
  map_changes?: PatchMapChange[];
  is_active_competitive: boolean;
  sator_meta_ref?: string;
  created_at: string;
  updated_at: string;
}

/** Agent change in a patch */
export interface PatchAgentChange {
  agent_name: string;
  change_type: 'buff' | 'nerf' | 'adjustment' | 'new';
  description: string;
  ability_changes?: AbilityChange[];
}

/** Ability change within an agent change */
export interface AbilityChange {
  ability_name: string;
  change_type: 'buff' | 'nerf' | 'adjustment';
  description: string;
}

/** Weapon change in a patch */
export interface PatchWeaponChange {
  weapon_name: string;
  change_type: 'buff' | 'nerf' | 'adjustment';
  description: string;
}

/** Map change in a patch */
export interface PatchMapChange {
  map_name: string;
  change_type: 'added' | 'removed' | 'updated';
  description: string;
}

// ============================================================================
// STANDINGS TYPES
// ============================================================================

/** Circuit standing matching opera_circuit_standings schema */
export interface CircuitStanding {
  standing_id: number;
  circuit: CircuitRegion;
  season: string;
  team_id: number;
  team_name: string;
  team_tag?: string;
  points: number;
  rank: number;
  tournament_results?: TournamentResult[];
  qualification_status: QualificationStatus;
  wins?: number;
  losses?: number;
  maps_won?: number;
  maps_lost?: number;
  round_diff?: number;
  created_at: string;
  updated_at: string;
}

/** Tournament result within circuit standing */
export interface TournamentResult {
  tournament_id: number;
  tournament_name: string;
  placement: number;
  points_earned: number;
}

/** Standings filter options */
export interface StandingsFilters {
  circuit: CircuitRegion;
  season: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/** Purple theme colors for OPERA hub */
export interface PurpleTheme {
  base: string;
  glow: string;
  muted: string;
}

/** Cache entry structure */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** useOperaData hook return type */
export interface UseOperaDataReturn {
  // Tournaments
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  setSelectedTournament: (tournament: Tournament | null) => void;
  
  // Schedules
  schedules: MatchSchedule[];
  
  // Patches
  patches: Patch[];
  selectedPatch: Patch | null;
  setSelectedPatch: (patch: Patch | null) => void;
  
  // Standings
  standings: CircuitStanding[];
  
  // Loading states
  loading: {
    tournaments: boolean;
    schedules: boolean;
    patches: boolean;
    standings: boolean;
  };
  
  // Errors
  error: string | null;
  
  // Actions
  refreshTournaments: () => Promise<void>;
  refreshSchedules: (tournamentId: number) => Promise<void>;
  refreshPatches: () => Promise<void>;
  refreshStandings: (circuit: CircuitRegion, season: string) => Promise<void>;
  clearCache: () => void;
  
  // Theme
  theme: PurpleTheme;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/** TournamentBrowser component props */
export interface TournamentBrowserProps {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  onSelectTournament: (tournament: Tournament) => void;
  filters: TournamentFilters;
  onFiltersChange: (filters: TournamentFilters) => void;
  loading: boolean;
}

/** ScheduleViewer component props */
export interface ScheduleViewerProps {
  schedules: MatchSchedule[];
  tournament: Tournament | null;
  loading: boolean;
}

/** PatchNotesReader component props */
export interface PatchNotesReaderProps {
  patches: Patch[];
  selectedPatch: Patch | null;
  onSelectPatch: (patch: Patch) => void;
  loading: boolean;
}

/** CircuitStandings component props */
export interface CircuitStandingsProps {
  standings: CircuitStanding[];
  circuit: CircuitRegion;
  season: string;
  onCircuitChange: (circuit: CircuitRegion) => void;
  onSeasonChange: (season: string) => void;
  loading: boolean;
}

/** Tab type for main interface */
export type HubTab = 'overview' | 'schedule' | 'standings' | 'patches' | 'fantasy';

// ============================================================================
// LEGACY TYPES (DEPRECATED - kept for backward compatibility)
// ============================================================================

/** @deprecated - Old map visualization types, will be removed in next version */
export interface MapData {
  id: string;
  name: string;
  game: string;
}

/** @deprecated - Old map visualization types, will be removed in next version */
export interface MapMetadata {
  id: string;
  name: string;
  game: string;
  size: string;
  layout: string;
}

/** @deprecated - Old map visualization types, will be removed in next version */
export type ViewMode = 'tactical' | 'fog' | 'grid';

/** @deprecated - Old map visualization types, will be removed in next version */
export interface ViewModeConfig {
  id: ViewMode;
  name: string;
  icon: React.ElementType;
  description: string;
}

/** @deprecated - Old map visualization types, will be removed in next version */
export interface LayerConfig {
  id: string;
  name: string;
  enabled: boolean;
}
