/**
 * Feature Flags Configuration Tests
 * 
 * [Ver001.000]
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFeatureFlags,
  isFeatureEnabled,
  setFeatureOverride,
  resetFeatureOverrides,
  defaultFeatures,
  productionFeatures,
} from '../features';

describe('Feature Flags', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  describe('getFeatureFlags', () => {
    it('should return default features in development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const flags = getFeatureFlags();
      expect(flags['opera.live-chat']).toBe(true);
    });

    it('should return production features in production', () => {
      vi.stubEnv('VITE_APP_ENVIRONMENT', 'production');
      const flags = getFeatureFlags();
      expect(flags).toEqual(productionFeatures);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(isFeatureEnabled('opera.live-chat')).toBe(true);
    });
  });

  describe('feature categories', () => {
    it('should have OPERA features', () => {
      expect(defaultFeatures).toHaveProperty('opera.live-chat');
      expect(defaultFeatures).toHaveProperty('opera.real-time-events');
    });

    it('should have SATOR features', () => {
      expect(defaultFeatures).toHaveProperty('sator.advanced-analytics');
    });

    it('should have global features', () => {
      expect(defaultFeatures).toHaveProperty('global.sentry');
    });
  });

  describe('production differences', () => {
    it('should disable beta features in production', () => {
      expect(productionFeatures['rotas.ai-predictions']).toBe(false);
      expect(productionFeatures['opera.multi-stream']).toBe(false);
    });
  });
});
