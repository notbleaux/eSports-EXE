/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for gradual rollouts,
 * A/B testing, and feature toggling.
 * 
 * [Ver001.000]
 */

// Feature flag definitions
export interface FeatureFlags {
  // OPERA Hub Features
  'opera.live-chat': boolean;
  'opera.real-time-events': boolean;
  'opera.multi-stream': boolean;
  
  // SATOR Hub Features
  'sator.advanced-analytics': boolean;
  'sater.player-comparison': boolean;
  'sator.investment-grade': boolean;
  
  // ROTAS Hub Features
  'rotas.simulation-3d': boolean;
  'rotas.tactical-replay': boolean;
  'rotas.ai-predictions': boolean;
  
  // AREPO Hub Features
  'arepo.match-analysis': boolean;
  'arepo.video-sync': boolean;
  
  // TENET Platform Features
  'tenet.dark-mode': boolean;
  'tenet.notifications': boolean;
  'tenet.search-v2': boolean;
  
  // Global Features
  'global.sentry': boolean;
  'global.analytics': boolean;
  'global.websocket': boolean;
}

// Default feature flags (development)
export const defaultFeatures: FeatureFlags = {
  'opera.live-chat': true,
  'opera.real-time-events': true,
  'opera.multi-stream': false, // Beta
  
  'sator.advanced-analytics': true,
  'sater.player-comparison': true,
  'sator.investment-grade': true,
  
  'rotas.simulation-3d': true,
  'rotas.tactical-replay': true,
  'rotas.ai-predictions': false, // Beta
  
  'arepo.match-analysis': true,
  'arepo.video-sync': false, // Coming soon
  
  'tenet.dark-mode': true,
  'tenet.notifications': true,
  'tenet.search-v2': false, // Beta
  
  'global.sentry': process.env.NODE_ENV === 'production',
  'global.analytics': true,
  'global.websocket': true,
};

// Production feature flags (conservative)
export const productionFeatures: FeatureFlags = {
  ...defaultFeatures,
  'rotas.ai-predictions': false,
  'arepo.video-sync': false,
  'tenet.search-v2': false,
  'opera.multi-stream': false,
};

// Feature flag descriptions
export const featureDescriptions: Record<keyof FeatureFlags, string> = {
  'opera.live-chat': 'Enable live chat in OPERA hub',
  'opera.real-time-events': 'Show real-time match events',
  'opera.multi-stream': 'Support multiple simultaneous streams',
  
  'sator.advanced-analytics': 'Advanced player analytics dashboard',
  'sater.player-comparison': 'Side-by-side player comparison tool',
  'sator.investment-grade': 'Investment grade ratings display',
  
  'rotas.simulation-3d': '3D simulation visualization',
  'rotas.tactical-replay': 'Tactical replay with annotations',
  'rotas.ai-predictions': 'AI-powered match predictions',
  
  'arepo.match-analysis': 'Detailed match analysis tools',
  'arepo.video-sync': 'Video synchronization with events',
  
  'tenet.dark-mode': 'Dark mode theme support',
  'tenet.notifications': 'In-app notification system',
  'tenet.search-v2': 'Enhanced search functionality',
  
  'global.sentry': 'Error tracking with Sentry',
  'global.analytics': 'Usage analytics tracking',
  'global.websocket': 'WebSocket real-time connections',
};

// Get current environment flags
export function getFeatureFlags(): FeatureFlags {
  const env = import.meta.env.VITE_APP_ENVIRONMENT || 'development';
  
  if (env === 'production') {
    return productionFeatures;
  }
  
  // In development, allow localStorage overrides
  if (typeof window !== 'undefined') {
    try {
      const overrides = JSON.parse(localStorage.getItem('featureFlags') || '{}');
      return { ...defaultFeatures, ...overrides };
    } catch {
      return defaultFeatures;
    }
  }
  
  return defaultFeatures;
}

// Check if a feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] ?? false;
}

// Enable/disable feature (development only)
export function setFeatureOverride(feature: keyof FeatureFlags, enabled: boolean): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Feature overrides only allowed in development');
    return;
  }
  
  try {
    const current = JSON.parse(localStorage.getItem('featureFlags') || '{}');
    current[feature] = enabled;
    localStorage.setItem('featureFlags', JSON.stringify(current));
    window.location.reload();
  } catch (e) {
    console.error('Failed to set feature override:', e);
  }
}

// Reset all overrides
export function resetFeatureOverrides(): void {
  localStorage.removeItem('featureFlags');
  window.location.reload();
}

export default getFeatureFlags;
