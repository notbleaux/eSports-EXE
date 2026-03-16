/**
 * useFeatureFlag Hook
 * 
 * React hook for checking feature flags with reactive updates.
 * 
 * [Ver001.000]
 */
import { useState, useEffect, useCallback } from 'react';
import type { FeatureFlags } from '@/config/features';
import { isFeatureEnabled, setFeatureOverride, resetFeatureOverrides } from '@/config/features';

/**
 * Hook to check if a feature is enabled
 * @param feature - Feature flag key
 * @returns boolean indicating if feature is enabled
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasLiveChat = useFeatureFlag('opera.live-chat');
 *   
 *   return hasLiveChat ? <LiveChat /> : null;
 * }
 * ```
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(feature));
  
  useEffect(() => {
    // Re-check on mount and when localStorage changes
    const handleStorageChange = () => {
      setEnabled(isFeatureEnabled(feature));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [feature]);
  
  return enabled;
}

/**
 * Hook for feature flag management (development only)
 * @returns Object with feature management utilities
 * 
 * @example
 * ```tsx
 * function FeatureToggles() {
 *   const { toggleFeature, resetFeatures } = useFeatureManager();
 *   
 *   return (
 *     <button onClick={() => toggleFeature('beta.feature', true)}>
 *       Enable Beta
 *     </button>
 *   );
 * }
 * ```
 */
export function useFeatureManager() {
  const toggleFeature = useCallback((feature: keyof FeatureFlags, enabled: boolean) => {
    setFeatureOverride(feature, enabled);
  }, []);
  
  const resetFeatures = useCallback(() => {
    resetFeatureOverrides();
  }, []);
  
  return {
    toggleFeature,
    resetFeatures,
    isDevelopment: process.env.NODE_ENV === 'development',
  };
}

export default useFeatureFlag;
