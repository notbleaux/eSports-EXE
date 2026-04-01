/**
 * GameNodeIDFrame Icons
 * 
 * SVG icon components for each quarter.
 * 
 * @see SPEC-TD-P3-001 for full specification
 */

import type { ReactNode } from 'react';

/** Props for icon components */
interface IconProps {
  /** Additional CSS classes */
  className?: string;
  /** Icon size in pixels */
  size?: number;
}

/**
 * Analytics icon for SATOR quarter.
 * Represents data analysis and insights.
 */
export function AnalyticsIcon({ className = '', size = 24 }: IconProps): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <title>Analytics</title>
    </svg>
  );
}

/**
 * Community icon for AREPO quarter.
 * Represents people and community.
 */
export function CommunityIcon({ className = '', size = 24 }: IconProps): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <title>Community</title>
    </svg>
  );
}

/**
 * Trophy icon for OPERA quarter.
 * Represents tournaments and pro scene.
 */
export function TrophyIcon({ className = '', size = 24 }: IconProps): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      <title>Pro Scene</title>
    </svg>
  );
}

/**
 * Chart icon for ROTAS quarter.
 * Represents statistics and leaderboards.
 */
export function ChartIcon({ className = '', size = 24 }: IconProps): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
      <title>Stats</title>
    </svg>
  );
}

/** Map of icon components by quarter ID */
export const QUARTER_ICONS = {
  SATOR: AnalyticsIcon,
  AREPO: CommunityIcon,
  OPERA: TrophyIcon,
  ROTAS: ChartIcon,
} as const;
