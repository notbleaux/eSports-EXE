/**
 * Feature Flags Configuration
 * 
 * [Ver002.000] - Consolidated implementation with new functions
 */

import { createLogger } from '@/utils/logger';

const logger = createLogger('Features');

export interface FeatureFlags {
  'opera.live-chat': boolean;
  'opera.real-time-events': boolean;
  'opera.multi-stream': boolean;
  'sator.advanced-analytics': boolean;
  'sater.player-comparison': boolean;
  'sator.investment-grade': boolean;
  'rotas.simulation-3d': boolean;
  'rotas.tactical-replay': boolean;
  'rotas.ai-predictions': boolean;
  'arepo.match-analysis': boolean;
  'arepo.video-sync': boolean;
  'tenet.dark-mode': boolean;
  'tenet.notifications': boolean;
  'tenet.search-v2': boolean;
  'global.sentry': boolean;
  'global.analytics': boolean;
  'global.websocket': boolean;
  'ml.predictions': boolean;
  'ml.model-registry': boolean;
  'ml.batch-inference': boolean;
  'realtime.updates': boolean;
  'realtime.streaming': boolean;
  'realtime.dashboard': boolean;
  'ui.new-design': boolean;
  'ui.animations': boolean;
  'ui.beta': boolean;
}

export const defaultFeatures: FeatureFlags = {
  'opera.live-chat': true,
  'opera.real-time-events': true,
  'opera.multi-stream': false,
  'sator.advanced-analytics': true,
  'sater.player-comparison': true,
  'sator.investment-grade': true,
  'rotas.simulation-3d': true,
  'rotas.tactical-replay': true,
  'rotas.ai-predictions': false,
  'arepo.match-analysis': true,
  'arepo.video-sync': false,
  'tenet.dark-mode': true,
  'tenet.notifications': true,
  'tenet.search-v2': false,
  'global.sentry': import.meta.env.VITE_APP_ENVIRONMENT === 'production',
  'global.analytics': true,
  'global.websocket': true,
  'ml.predictions': import.meta.env.VITE_ENABLE_ML === 'true',
  'ml.model-registry': import.meta.env.VITE_ENABLE_MODEL_REGISTRY === 'true',
  'ml.batch-inference': false,
  'realtime.updates': true,
  'realtime.streaming': true,
  'realtime.dashboard': true,
  'ui.new-design': import.meta.env.VITE_ENABLE_NEW_UI === 'true',
  'ui.animations': true,
  'ui.beta': import.meta.env.VITE_ENABLE_BETA === 'true',
};

export const productionFeatures: FeatureFlags = {
  ...defaultFeatures,
  'rotas.ai-predictions': false,
  'arepo.video-sync': false,
  'tenet.search-v2': false,
  'opera.multi-stream': false,
  'ui.beta': false,
};

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
  'ml.predictions': 'ML-based predictions',
  'ml.model-registry': 'Model registry management',
  'ml.batch-inference': 'Batch inference processing',
  'realtime.updates': 'Real-time data updates',
  'realtime.streaming': 'WebSocket streaming',
  'realtime.dashboard': 'Live dashboard',
  'ui.new-design': 'New UI design system',
  'ui.animations': 'UI animations enabled',
  'ui.beta': 'Beta UI features',
};

let runtimeOverrides: Partial<FeatureFlags> = {};
const STORAGE_KEY_OVERRIDES = 'featureOverrides';
const STORAGE_KEY_LEGACY = 'featureFlags';

export function getFeatureFlags(): FeatureFlags {
  const env = import.meta.env.VITE_APP_ENVIRONMENT || 'development';
  const baseFeatures = env === 'production' ? productionFeatures : defaultFeatures;
  
  let localOverrides: Partial<FeatureFlags> = {};
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (saved) {
        localOverrides = JSON.parse(saved);
      } else {
        const legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
        if (legacy) {
          localOverrides = JSON.parse(legacy);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }
  
  return {
    ...baseFeatures,
    ...localOverrides,
    ...runtimeOverrides,
  };
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] ?? false;
}

export function setFeatureOverride<K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K]
): void {
  runtimeOverrides[key] = value;
  
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY_OVERRIDES) || '{}');
      current[key] = value;
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(current));
      logger.info(`Feature '${String(key)}' set to ${String(value)}`);
    } catch (e) {
      logger.error('Failed to save feature override', { error: String(e) });
    }
  }
}

export function clearFeatureOverride(key: keyof FeatureFlags): void {
  delete runtimeOverrides[key];
  
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY_OVERRIDES) || '{}');
      delete current[key];
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(current));
      logger.info(`Feature '${String(key)}' override cleared`);
    } catch (e) {
      logger.error('Failed to clear feature override', { error: String(e) });
    }
  }
}

export function resetFeatureOverrides(): void {
  runtimeOverrides = {};
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    localStorage.removeItem(STORAGE_KEY_LEGACY);
  }
  logger.info('All feature overrides reset');
}

export default getFeatureFlags;
