/**
 * Hub-related custom hooks
 * [Ver001.000]
 */

import { useMemo } from 'react';

/**
 * Hook to determine if a hub is heavy (requires optimization)
 */
export function useIsHeavyHub(weight: string): boolean {
  return useMemo(() => weight === 'heavy' || weight === 'medium', [weight]);
}

/**
 * Hook to check if hub should use worker
 */
export function useShouldUseWorker(weight: string, isVisible: boolean): boolean {
  return useMemo(() => {
    return weight === 'heavy' && !isVisible;
  }, [weight, isVisible]);
}
