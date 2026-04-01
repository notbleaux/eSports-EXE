/**
 * GameNodeIDFrame Constants
 * 
 * Default configurations for the Quarter Grid.
 * 
 * @see SPEC-TD-P3-001 for full specification
 */

import type { Quarter, QuarterId } from './types';

/**
 * Default quarter configurations.
 * These can be overridden via the `quarters` prop.
 */
export const DEFAULT_QUARTERS: Record<QuarterId, Omit<Quarter, 'icon'>> = {
  SATOR: {
    id: 'SATOR',
    name: 'Analytics',
    description: 'Advanced statistics and insights',
    route: '/analytics',
    color: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      ring: 'focus:ring-blue-400',
      gradient: 'from-blue-600 to-blue-800',
    },
    branchCount: 3,
  },
  AREPO: {
    id: 'AREPO',
    name: 'Community',
    description: 'Players and fans',
    route: '/community',
    color: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      ring: 'focus:ring-green-400',
      gradient: 'from-green-600 to-green-800',
    },
    branchCount: 4,
  },
  OPERA: {
    id: 'OPERA',
    name: 'Pro Scene',
    description: 'Tournaments and live matches',
    route: '/pro-scene',
    color: {
      bg: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      ring: 'focus:ring-purple-400',
      gradient: 'from-purple-600 to-purple-800',
    },
    branchCount: 3,
  },
  ROTAS: {
    id: 'ROTAS',
    name: 'Stats',
    description: 'Leaderboards and history',
    route: '/stats',
    color: {
      bg: 'bg-orange-600',
      hover: 'hover:bg-orange-700',
      ring: 'focus:ring-orange-400',
      gradient: 'from-orange-600 to-orange-800',
    },
    branchCount: 4,
  },
};

/** Standard order for 2×2 grid display: TL, TR, BL, BR */
export const QUARTER_ORDER: QuarterId[] = ['SATOR', 'AREPO', 'OPERA', 'ROTAS'];

/** Animation timing constants (in milliseconds) */
export const ANIMATION = {
  /** Hover transition duration */
  HOVER_DURATION: 300,
  /** Focus ring transition duration */
  FOCUS_DURATION: 200,
  /** Page enter stagger delay */
  STAGGER_DELAY: 100,
  /** Page enter animation duration */
  ENTER_DURATION: 400,
} as const;

/** Accessibility constants */
export const A11Y = {
  /** Container navigation label */
  CONTAINER_LABEL: (gameName: string) => `${gameName} Game Navigation`,
  /** Grid list label */
  GRID_LABEL: 'Game Quarters',
  /** Quarter button label */
  QUARTER_LABEL: (name: string, description: string) => `${name}: ${description}`,
} as const;
