[Ver001.000]
/**
 * Fantasy eSports Types
 * =====================
 * TypeScript interfaces for fantasy Valorant and CS2.
 */

export type GameType = 'valorant' | 'cs2';
export type LeagueType = 'public' | 'private' | 'premium';
export type DraftType = 'snake' | 'auction' | 'pick_em';
export type DraftStatus = 'pending' | 'in_progress' | 'completed';

export interface FantasyLeague {
  id: string;
  name: string;
  description?: string;
  game: GameType;
  league_type: LeagueType;
  max_teams: number;
  roster_size: number;
  salary_cap: number;
  draft_type: DraftType;
  draft_status: DraftStatus;
  season_start_date?: string;
  season_end_date?: string;
  entry_fee_tokens: number;
  prize_pool_tokens: number;
  scoring_rules?: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  team_count: number;
}

export interface FantasyTeam {
  id: string;
  league_id: string;
  owner_id: string;
  team_name: string;
  team_logo_url?: string;
  total_points: number;
  weekly_points: number;
  rank_position?: number;
  wins: number;
  losses: number;
  draws: number;
  streak?: string;
  budget_remaining?: number;
  is_active: boolean;
  roster: FantasyRoster[];
  created_at: string;
  updated_at: string;
}

export interface FantasyRoster {
  id: number;
  team_id: string;
  player_id: string;
  player_name: string;
  player_role?: string;
  team_tag?: string;
  acquisition_type: string;
  draft_round?: number;
  draft_pick?: number;
  purchase_price?: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_starter: boolean;
  is_bench: boolean;
  week_acquired: number;
  week_dropped?: number;
}

export interface AvailablePlayer {
  player_id: string;
  name: string;
  team_tag: string;
  role: string;
  game: GameType;
  matches_played: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  avg_fantasy_points: number;
  is_drafted: boolean;
  drafted_by?: string;
  estimated_value?: number;
}

export interface FantasyMatchup {
  id: number;
  week_number: number;
  opponent_name: string;
  opponent_points: number;
  my_points: number;
  result: 'win' | 'loss' | 'tie' | 'upcoming';
}

export interface LeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  owner_name: string;
  total_points: number;
  wins: number;
  losses: number;
  streak: string;
  is_my_team: boolean;
}

// Component Props

export interface FantasyLeagueCardProps {
  league: FantasyLeague;
  onJoin?: () => void;
  onView?: () => void;
}

export interface FantasyTeamCardProps {
  team: FantasyTeam;
  showRoster?: boolean;
}

export interface PlayerDraftCardProps {
  player: AvailablePlayer;
  onDraft: () => void;
  isDisabled?: boolean;
}

export interface RosterSlotProps {
  slot: FantasyRoster | null;
  slotType: 'starter' | 'bench';
  onRemove?: () => void;
  onSetCaptain?: () => void;
}
