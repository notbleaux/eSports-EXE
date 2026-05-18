/**
 * GameNodeIDFrame Component
 * 
 * The core navigation interface for the TeNET layer.
 * Displays a 2×2 CSS Grid representing the four quarters
 * (SATOR, AREPO, OPERA, ROTAS) as the primary entry point
 * into any game's ecosystem.
 * 
 * @see SPEC-TD-P3-001 for full specification
 */

import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameNodeIDFrameProps, Quarter, QuarterId } from './types';
import { QuarterCard } from './QuarterCard';
import { DEFAULT_QUARTERS, QUARTER_ORDER, A11Y } from './constants';
import { mergeQuarters } from './utils';
import { QUARTER_ICONS } from './icons';

/**
 * GameNodeIDFrame - 2×2 Quarter Grid Navigation
 * 
 * Renders a responsive grid of four quarters that serve as the primary
 * navigation into a game's SATOR, AREPO, OPERA, and ROTAS sections.
 * 
 * @example
 * ```tsx
 * <GameNodeIDFrame
 *   gameId="valorant"
 *   gameName="VALORANT"
 *   gameIcon={<GameIcon />}
 * />
 * ```
 */
export function GameNodeIDFrame({
  gameId,
  gameName,
  gameIcon,
  quarters: quarterOverrides,
  onQuarterSelect,
  className = '',
}: GameNodeIDFrameProps) {
  const navigate = useNavigate();

  // Merge default quarters with any user-provided overrides
  const baseQuarters = useMemo(() => {
    // Start with defaults and add icons
    const withIcons: Record<QuarterId, Quarter> = {
      SATOR: { ...DEFAULT_QUARTERS.SATOR, icon: <QUARTER_ICONS.SATOR size={40} /> },
      AREPO: { ...DEFAULT_QUARTERS.AREPO, icon: <QUARTER_ICONS.AREPO size={40} /> },
      OPERA: { ...DEFAULT_QUARTERS.OPERA, icon: <QUARTER_ICONS.OPERA size={40} /> },
      ROTAS: { ...DEFAULT_QUARTERS.ROTAS, icon: <QUARTER_ICONS.ROTAS size={40} /> },
    };
    
    return mergeQuarters(withIcons, quarterOverrides);
  }, [quarterOverrides]);

  // Handle quarter selection
  const handleQuarterClick = useCallback(
    (quarter: Quarter) => {
      const route = `/${gameId}${quarter.route}`;

      // Call optional callback before navigation
      if (onQuarterSelect) {
        onQuarterSelect(quarter);
      }

      // Navigate to the quarter route
      navigate(route);
    },
    [gameId, navigate, onQuarterSelect]
  );

  return (
    <div
      className={`game-node-id-frame ${className}`}
      role="navigation"
      aria-label={A11Y.CONTAINER_LABEL(gameName)}
    >
      {/* Game Header */}
      <header className="flex items-center gap-4 mb-8 px-2">
        {gameIcon && (
          <span className="text-4xl" aria-hidden="true">
            {gameIcon}
          </span>
        )}
        <h2 className="text-2xl font-bold text-slate-100">
          {gameName}
        </h2>
      </header>

      {/* Quarter Grid - 2×2 on desktop, 1 column on mobile */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        role="list"
        aria-label={A11Y.GRID_LABEL}
      >
        {QUARTER_ORDER.map((quarterId) => (
          <QuarterCard
            key={quarterId}
            quarter={baseQuarters[quarterId]}
            onClick={() => handleQuarterClick(baseQuarters[quarterId])}
            gameId={gameId}
          />
        ))}
      </div>

      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
    </div>
  );
}

// Re-export types for convenience
export type { GameNodeIDFrameProps, Quarter, QuarterId } from './types';
