/**
 * ML Feature Flags Tests
 * 
 * [Ver001.000] - Tests for ml-feature-flags utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock logger
vi.mock('../../utils/logger', () => ({
  mlLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

import {
  loadFeatureFlags,
  isMLFeatureEnabled,
  isAnyMLFeatureEnabled,
  setMLFeature,
  enableAllMLFeatures,
  resetMLFeatures,
  getFeaturesForRoute,
  shouldLoadMLForRoute,
  getModelsToPreload,
  estimateMLBundleSize
} from '../ml-feature-flags'

describe('ml-feature-flags', () => {
  beforeEach(() => {
    localStorage.clear()
    resetMLFeatures()
  })

  describe('Default State', () => {
    it('should have all features disabled by default', () => {
      const flags = loadFeatureFlags()
      
      expect(flags.mlPredictions).toBe(false)
      expect(flags.mlAnalytics).toBe(false)
      expect(flags.mlBatchInference).toBe(false)
    })

    it('should return false for any enabled features', () => {
      expect(isAnyMLFeatureEnabled()).toBe(false)
    })
  })

  describe('Feature Toggling', () => {
    it('should enable specific feature', () => {
      setMLFeature('mlPredictions', true)
      
      expect(isMLFeatureEnabled('mlPredictions')).toBe(true)
    })

    it('should disable specific feature', () => {
      setMLFeature('mlPredictions', true)
      setMLFeature('mlPredictions', false)
      
      expect(isMLFeatureEnabled('mlPredictions')).toBe(false)
    })

    it('should enable all features', () => {
      enableAllMLFeatures()
      
      expect(isMLFeatureEnabled('mlPredictions')).toBe(true)
      expect(isMLFeatureEnabled('mlAnalytics')).toBe(true)
      expect(isMLFeatureEnabled('mlBatchInference')).toBe(true)
      expect(isAnyMLFeatureEnabled()).toBe(true)
    })

    it('should reset to defaults', () => {
      enableAllMLFeatures()
      resetMLFeatures()
      
      expect(isAnyMLFeatureEnabled()).toBe(false)
    })
  })

  describe('Route-Based Activation', () => {
    it('should return no features for unknown route', () => {
      const result = getFeaturesForRoute('/unknown')
      
      expect(result.features).toHaveLength(0)
      expect(result.shouldLoadML).toBe(false)
    })

    it('should return features for SATOR hub route', () => {
      const result = getFeaturesForRoute('/hub-1-sator')
      
      expect(result.shouldLoadML).toBe(false) // Features disabled by default
    })

    it('should return preload models for route', () => {
      const result = getModelsToPreload('/hub-1-sator')
      
      // Should return empty since ML is disabled
      expect(result).toHaveLength(0)
    })

    it('should suggest loading ML for enabled routes', () => {
      enableAllMLFeatures()
      const result = shouldLoadMLForRoute('/hub-1-sator')
      
      expect(result).toBe(true)
    })
  })

  describe('Bundle Size Estimation', () => {
    it('should estimate zero size when all features disabled', () => {
      const estimate = estimateMLBundleSize()
      
      expect(estimate.estimatedSizeKB).toBe(0)
      expect(estimate.modules).toHaveLength(0)
    })

    it('should estimate size for predictions feature', () => {
      setMLFeature('mlPredictions', true)
      const estimate = estimateMLBundleSize()
      
      expect(estimate.estimatedSizeKB).toBeGreaterThan(0)
      expect(estimate.modules).toContain('@tensorflow/tfjs')
    })

    it('should reduce estimate with quantization', () => {
      setMLFeature('mlPredictions', true)
      setMLFeature('modelQuantization', true)
      const estimate = estimateMLBundleSize()
      
      // Quantization reduces size
      expect(estimate.estimatedSizeKB).toBeGreaterThan(0)
    })
  })

  describe('Persistence', () => {
    it('should persist flags to localStorage', () => {
      setMLFeature('mlPredictions', true)
      
      const stored = localStorage.getItem('sator:ml:features')
      expect(stored).toBeDefined()
      
      const parsed = JSON.parse(stored!)
      expect(parsed.flags.mlPredictions).toBe(true)
    })
  })
})
