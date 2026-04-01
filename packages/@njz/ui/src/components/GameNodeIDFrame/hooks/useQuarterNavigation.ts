/**
 * useQuarterNavigation Hook
 * 
 * Provides navigation logic for quarter selection.
 * 
 * @see SPEC-TD-P3-001 for full specification
 */

import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Quarter, QuarterId } from '../types';

interface UseQuarterNavigationResult {
  /** Current game ID from URL params */
  gameId: string | undefined;
  /** Current quarter from URL path */
  currentQuarter: QuarterId | undefined;
  /** Navigate to a specific quarter */
  navigateToQuarter: (quarter: Quarter) => void;
  /** Navigate to game root */
  navigateToGame: () => void;
}

/**
 * Hook for quarter navigation within a game context.
 * 
 * @example
 * ```tsx
 * const { gameId, currentQuarter, navigateToQuarter } = useQuarterNavigation();
 * ```
 */
export function useQuarterNavigation(): UseQuarterNavigationResult {
  const navigate = useNavigate();
  const { gameId, quarter } = useParams<{ gameId: string; quarter?: string }>();

  const navigateToQuarter = useCallback(
    (q: Quarter) => {
      if (gameId) {
        navigate(`/${gameId}${q.route}`);
      }
    },
    [gameId, navigate]
  );

  const navigateToGame = useCallback(() => {
    if (gameId) {
      navigate(`/${gameId}`);
    }
  }, [gameId, navigate]);

  // Derive current quarter from URL
  const currentQuarter = quarter?.toUpperCase() as QuarterId | undefined;

  return {
    gameId,
    currentQuarter,
    navigateToQuarter,
    navigateToGame,
  };
}
