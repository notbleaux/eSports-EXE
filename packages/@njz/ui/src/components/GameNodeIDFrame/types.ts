/**
 * GameNodeIDFrame Component Types
 * 
 * Type definitions for the 2×2 Quarter Grid navigation component.
 * 
 * @see SPEC-TD-P3-001 for full specification
 */

import type { ReactNode } from 'react';

/** Quarter identifiers - the four cardinal directions of TENET */
export type QuarterId = 'SATOR' | 'AREPO' | 'OPERA' | 'ROTAS';

/** Color scheme for a quarter using Tailwind classes */
export interface QuarterColor {
  /** Background color class (e.g., 'bg-blue-600') */
  bg: string;
  /** Hover background color class (e.g., 'hover:bg-blue-700') */
  hover: string;
  /** Focus ring color class (e.g., 'focus:ring-blue-400') */
  ring: string;
  /** Gradient color classes (e.g., 'from-blue-600 to-blue-800') */
  gradient: string;
}

/** Optional statistics displayed on a quarter card */
export interface QuarterStats {
  /** Number of live events occurring */
  liveEvents?: number;
  /** Number of active users in this quarter */
  activeUsers?: number;
  /** Number of recent updates */
  recentUpdates?: number;
}

/** A single quarter (SATOR, AREPO, OPERA, or ROTAS) */
export interface Quarter {
  /** Unique identifier */
  id: QuarterId;
  /** Display name (e.g., 'Analytics') */
  name: string;
  /** Short description */
  description: string;
  /** Route suffix (e.g., '/analytics') */
  route: string;
  /** Color scheme */
  color: QuarterColor;
  /** Icon component */
  icon: ReactNode;
  /** Number of TeZeT branches in this quarter */
  branchCount: number;
  /** Optional live statistics */
  stats?: QuarterStats;
}

/** Props for the GameNodeIDFrame component */
export interface GameNodeIDFrameProps {
  /** Game identifier (e.g., 'valorant', 'cs2') */
  gameId: string;
  /** Game display name (e.g., 'VALORANT') */
  gameName: string;
  /** Optional game icon */
  gameIcon?: ReactNode;
  /** Override default quarter configurations */
  quarters?: Partial<Record<QuarterId, Partial<Quarter>>>;
  /** Callback when a quarter is selected (before navigation) */
  onQuarterSelect?: (quarter: Quarter) => void;
  /** Additional CSS classes */
  className?: string;
}

/** Props for the QuarterCard sub-component */
export interface QuarterCardProps {
  /** Quarter configuration */
  quarter: Quarter;
  /** Click handler */
  onClick: () => void;
  /** Game identifier for routing */
  gameId: string;
}
