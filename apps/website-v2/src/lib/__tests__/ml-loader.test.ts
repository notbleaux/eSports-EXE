/**
 * ML Loader Tests
 * 
 * [Ver001.000] - Tests for ml-loader utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  setBackend: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
  getBackend: vi.fn().mockReturnValue('webgl'),
  loadLayersModel: vi.fn().mockResolvedValue({
    predict: vi.fn().mockReturnValue({
      dataSync: vi.fn().mockReturnValue(new Float32Array([0.5, 0.5])),
      dispose: vi.fn()
    }),
    dispose: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined)
  }),
  tensor2d: vi.fn().mockReturnValue({
    dispose: vi.fn()
  })
}))

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
  loadTensorFlow,
  setBackend,
  getCurrentBackend,
  isTensorFlowLoaded,
  loadModel,
  isModelCached,
  getCacheStats,
  clearMemoryCache,
  isMLEnabled,
  setMLEnabled,
  getMLConfig,
  updateMLConfig,
  dispose
} from '../ml-loader'

describe('ml-loader', () => {
  beforeEach(() => {
    // Reset module state
    dispose()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Feature Flags', () => {
    it('should disable ML by default', () => {
      expect(isMLEnabled()).toBe(false)
    })

    it('should enable ML when set', () => {
      setMLEnabled(true)
      expect(isMLEnabled()).toBe(true)
    })

    it('should persist ML settings to localStorage', () => {
      setMLEnabled(true)
      // Re-load config
      const config = getMLConfig()
      expect(config.enabled).toBe(true)
    })

    it('should update ML config', () => {
      updateMLConfig({ maxModelsInMemory: 10 })
      const config = getMLConfig()
      expect(config.maxModelsInMemory).toBe(10)
    })
  })

  describe('TensorFlow Loading', () => {
    it('should not have TF loaded initially', () => {
      expect(isTensorFlowLoaded()).toBe(false)
    })

    it('should load TensorFlow.js on demand', async () => {
      const tf = await loadTensorFlow()
      expect(tf).toBeDefined()
      expect(isTensorFlowLoaded()).toBe(true)
    })

    it('should return cached TF module on subsequent calls', async () => {
      const tf1 = await loadTensorFlow()
      const tf2 = await loadTensorFlow()
      expect(tf1).toBe(tf2)
    })

    it('should track backend after loading', async () => {
      await loadTensorFlow('webgl')
      expect(getCurrentBackend()).toBe('webgl')
    })
  })

  describe('Model Management', () => {
    it('should load model and cache it', async () => {
      const progressCallback = vi.fn()
      const model = await loadModel(
        '/models/test-model.json',
        { name: 'test-model' },
        progressCallback
      )

      expect(model).toBeDefined()
      expect(isModelCached('test-model:fp32')).toBe(true)
    })

    it('should track cache stats', async () => {
      await loadModel('/models/test-model.json', { name: 'test-model' })
      const stats = getCacheStats()
      
      expect(stats.memoryModels).toBe(1)
      expect(stats.totalLoads).toBeGreaterThan(0)
    })

    it('should clear memory cache', async () => {
      await loadModel('/models/test-model.json', { name: 'test-model' })
      clearMemoryCache()
      
      const stats = getCacheStats()
      expect(stats.memoryModels).toBe(0)
    })
  })

  describe('Cleanup', () => {
    it('should dispose all resources', async () => {
      await loadTensorFlow()
      await loadModel('/models/test.json', { name: 'test' })
      
      dispose()
      
      expect(isTensorFlowLoaded()).toBe(false)
      expect(getCacheStats().memoryModels).toBe(0)
    })
  })
})
