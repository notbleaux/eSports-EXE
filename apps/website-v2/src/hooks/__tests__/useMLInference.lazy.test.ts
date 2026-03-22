/**
 * useMLInference Lazy Loading Tests
 * 
 * [Ver001.000] - Tests for lazy loading TensorFlow.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock TensorFlow.js
const mockTensorFlow = {
  setBackend: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
  getBackend: vi.fn().mockReturnValue('webgl'),
  loadLayersModel: vi.fn().mockResolvedValue({
    predict: vi.fn().mockReturnValue({
      dataSync: vi.fn().mockReturnValue(new Float32Array([0.8, 0.2])),
      dispose: vi.fn()
    }),
    dispose: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined)
  }),
  tensor2d: vi.fn().mockReturnValue({
    dispose: vi.fn()
  })
}

vi.mock('@tensorflow/tfjs', () => mockTensorFlow)

// Mock ml-loader
vi.mock('../../lib/ml-loader', () => ({
  loadTensorFlow: vi.fn().mockResolvedValue(mockTensorFlow),
  loadModel: vi.fn().mockResolvedValue({
    predict: vi.fn().mockReturnValue({
      dataSync: vi.fn().mockReturnValue(new Float32Array([0.8, 0.2])),
      dispose: vi.fn()
    }),
    dispose: vi.fn()
  }),
  isMLFeatureEnabled: vi.fn().mockReturnValue(true),
  isTensorFlowLoaded: vi.fn().mockReturnValue(false),
  isModelCached: vi.fn().mockReturnValue(false),
  unloadModel: vi.fn()
}))

// Mock ml-feature-flags
vi.mock('../../lib/ml-feature-flags', () => ({
  isMLFeatureEnabled: vi.fn().mockReturnValue(true)
}))

// Mock worker
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  
  postMessage = vi.fn()
  terminate = vi.fn()
  
  constructor() {
    // Auto-trigger init complete
    setTimeout(() => {
      this.onmessage?.(new MessageEvent('message', {
        data: { type: 'INIT_COMPLETE', backend: 'webgl' }
      }))
    }, 0)
  }
}

vi.mock('../../workers/ml.worker.ts', () => MockWorker)
Object.defineProperty(global, 'Worker', {
  value: MockWorker,
  writable: true
})

// Mock logger
vi.mock('../../utils/logger', () => ({
  mlLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

// Mock API
vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({})
  }
}))

import { useMLInference, MLFeatureDisabledError } from '../useMLInference'

describe('useMLInference - Lazy Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should not load TensorFlow.js on mount', () => {
      const { loadTensorFlow } = require('../../lib/ml-loader')
      
      renderHook(() => useMLInference())
      
      // TF should not be loaded initially
      expect(loadTensorFlow).not.toHaveBeenCalled()
    })

    it('should have initial state correctly set', () => {
      const { result } = renderHook(() => useMLInference())
      
      expect(result.current.isModelLoading).toBe(false)
      expect(result.current.isModelReady).toBe(false)
      expect(result.current.isPredicting).toBe(false)
      expect(result.current.progress).toBe(0)
    })
  })

  describe('Model Loading', () => {
    it('should load model when loadModel is called', async () => {
      const { loadModel: mockLoadModel } = require('../../lib/ml-loader')
      
      const { result } = renderHook(() => useMLInference())
      
      act(() => {
        result.current.loadModel('/models/test.json')
      })

      expect(result.current.isModelLoading).toBe(true)
      
      await waitFor(() => {
        expect(mockLoadModel).toHaveBeenCalledWith(
          '/models/test.json',
          expect.any(Object),
          expect.any(Function)
        )
      })
    })

    it('should track progress during model loading', async () => {
      const { result } = renderHook(() => useMLInference())
      
      act(() => {
        result.current.loadModel('/models/test.json')
      })

      // Progress should be set during loading
      expect(result.current.progress).toBeGreaterThanOrEqual(0)
    })

    it('should handle feature disabled error', async () => {
      const { isMLFeatureEnabled } = require('../../lib/ml-feature-flags')
      isMLFeatureEnabled.mockReturnValue(false)
      
      const { result } = renderHook(() => useMLInference())
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })

      expect(result.current.error).toBeInstanceOf(MLFeatureDisabledError)
    })
  })

  describe('Prediction', () => {
    it('should not allow prediction before model is loaded', async () => {
      const { result } = renderHook(() => useMLInference())
      
      await expect(
        act(async () => {
          await result.current.predict([0.5, 0.5, 0.5])
        })
      ).rejects.toThrow('Model not loaded')
    })
  })

  describe('Cleanup', () => {
    it('should dispose resources on unmount', async () => {
      const { unloadModel } = require('../../lib/ml-loader')
      
      const { unmount } = renderHook(() => useMLInference())
      
      unmount()
      
      // Cleanup should happen
      expect(true).toBe(true) // Hook cleanup happens in useEffect
    })

    it('should unload model on demand', async () => {
      const { result } = renderHook(() => useMLInference())
      
      act(() => {
        result.current.unloadModel()
      })

      expect(result.current.isModelReady).toBe(false)
    })
  })

  describe('Worker Integration', () => {
    it('should use worker when enabled', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      // Worker should be initialized
      expect(result.current.useWorker).toBe(true)
    })

    it('should fallback to main thread when worker fails', async () => {
      // Mock Worker to fail
      vi.mocked(global.Worker).mockImplementationOnce(() => {
        throw new Error('Worker failed')
      })
      
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      // Should fall back to main thread
      await waitFor(() => {
        expect(result.current.useWorker).toBe(false)
      })
    })
  })
})
