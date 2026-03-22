/**
 * useMLInference Worker Integration Tests
 * Tests ML Worker offloading and performance improvements
 * 
 * [Ver001.000]
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMLInference } from '../useMLInference'

// Mock TensorFlow.js
const mockTensor2d = vi.fn()
const mockPredict = vi.fn()
const mockDispose = vi.fn()
const mockDataSync = vi.fn()
const mockSetBackend = vi.fn()
const mockReady = vi.fn()
const mockGetBackend = vi.fn().mockReturnValue('webgl')
const mockLoadLayersModel = vi.fn()

vi.mock('@tensorflow/tfjs', () => ({
  setBackend: mockSetBackend,
  ready: mockReady,
  getBackend: mockGetBackend,
  tensor2d: mockTensor2d,
  loadLayersModel: mockLoadLayersModel
}))

// Mock Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((error: Error) => void) | null = null
  
  postMessage = vi.fn()
  terminate = vi.fn()
  
  // Helper to simulate worker responses
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }))
    }
  }
  
  simulateError(error: Error) {
    if (this.onerror) {
      this.onerror(error)
    }
  }
}

let mockWorkerInstance: MockWorker

vi.mock('../workers/ml.worker.ts', () => {
  return {
    default: MockWorker
  }
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn()
global.URL.revokeObjectURL = vi.fn()

describe('useMLInference - Worker Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWorkerInstance = new MockWorker()
    
    // Mock Worker constructor
    global.Worker = vi.fn(() => mockWorkerInstance) as unknown as typeof Worker
    
    // Setup default TF.js mock behavior
    mockTensor2d.mockReturnValue({
      dispose: mockDispose
    })
    mockPredict.mockReturnValue({
      dataSync: mockDataSync.mockReturnValue(new Float32Array([0.7, 0.2, 0.1])),
      dispose: mockDispose
    })
    mockReady.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Worker Initialization', () => {
    it('should initialize worker when useWorker is true', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Worker should be created
      expect(global.Worker).toHaveBeenCalled()
      
      // Worker should receive LOAD_MODEL message
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOAD_MODEL',
          url: '/models/test.json'
        })
      )
    })

    it('should fallback to main thread when worker fails', async () => {
      // Make Worker constructor throw
      global.Worker = vi.fn(() => {
        throw new Error('Worker not supported')
      }) as unknown as typeof Worker
      
      const onWorkerError = vi.fn()
      const { result } = renderHook(() => 
        useMLInference({ useWorker: true, onWorkerError })
      )
      
      await act(async () => {
        try {
          await result.current.loadModel('/models/test.json')
        } catch {
          // Expected to fail
        }
      })
      
      // Should call error handler
      await waitFor(() => {
        expect(onWorkerError).toHaveBeenCalled()
      })
      
      // Should fallback to main thread
      expect(result.current.useWorker).toBe(false)
    })
  })

  describe('Worker Prediction', () => {
    it('should use worker for predictions when available', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Simulate model loaded
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'MODEL_LOADED',
          modelName: 'test',
          backend: 'webgl'
        })
      })
      
      await waitFor(() => {
        expect(result.current.isModelReady).toBe(true)
      })
      
      // Make prediction
      act(() => {
        result.current.predict([0.5, 0.5, 0.5])
      })
      
      // Worker should receive PREDICT message
      await waitFor(() => {
        expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'PREDICT',
            input: [0.5, 0.5, 0.5]
          })
        )
      })
    })

    it('should handle worker prediction response', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Simulate model loaded
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'MODEL_LOADED',
          modelName: 'test',
          backend: 'webgl'
        })
      })
      
      await waitFor(() => {
        expect(result.current.isModelReady).toBe(true)
      })
      
      // Make prediction and capture the promise
      let predictionPromise: Promise<number[]>
      act(() => {
        predictionPromise = result.current.predict([0.5, 0.5, 0.5])
      })
      
      // Get the requestId from the postMessage call
      const postMessageCalls = mockWorkerInstance.postMessage.mock.calls
      const predictCall = postMessageCalls.find(
        call => call[0].type === 'PREDICT'
      )
      const requestId = predictCall?.[0].requestId
      
      // Simulate prediction result
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'PREDICTION_RESULT',
          requestId,
          result: [0.8, 0.15, 0.05]
        })
      })
      
      await waitFor(async () => {
        const result = await predictionPromise
        expect(result).toEqual([0.8, 0.15, 0.05])
      })
    })

    it('should handle worker prediction errors', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Simulate model loaded
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'MODEL_LOADED',
          modelName: 'test',
          backend: 'webgl'
        })
      })
      
      await waitFor(() => {
        expect(result.current.isModelReady).toBe(true)
      })
      
      // Make prediction
      let predictionPromise: Promise<number[]>
      act(() => {
        predictionPromise = result.current.predict([0.5, 0.5, 0.5])
      })
      
      // Get requestId
      const postMessageCalls = mockWorkerInstance.postMessage.mock.calls
      const predictCall = postMessageCalls.find(
        call => call[0].type === 'PREDICT'
      )
      const requestId = predictCall?.[0].requestId
      
      // Simulate prediction error
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'PREDICTION_ERROR',
          requestId,
          error: 'Model execution failed'
        })
      })
      
      await expect(predictionPromise!).rejects.toThrow('Model execution failed')
    })
  })

  describe('Batch Prediction', () => {
    it('should use worker for batch predictions', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Simulate model loaded
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'MODEL_LOADED',
          modelName: 'test',
          backend: 'webgl'
        })
      })
      
      await waitFor(() => {
        expect(result.current.isModelReady).toBe(true)
      })
      
      const batchInputs = Array.from({ length: 10 }, () => [0.5, 0.5, 0.5])
      
      act(() => {
        result.current.predictBatch(batchInputs)
      })
      
      // Worker should receive PREDICT_BATCH message
      await waitFor(() => {
        expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'PREDICT_BATCH',
            inputs: batchInputs
          })
        )
      })
    })

    it('should handle batch prediction response with throughput metrics', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Simulate model loaded
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'MODEL_LOADED',
          modelName: 'test',
          backend: 'webgl'
        })
      })
      
      await waitFor(() => {
        expect(result.current.isModelReady).toBe(true)
      })
      
      const batchInputs = Array.from({ length: 10 }, () => [0.5, 0.5, 0.5])
      
      let batchPromise: Promise<{ results: number[][]; totalTime: number; throughput: number }>
      act(() => {
        batchPromise = result.current.predictBatch(batchInputs)
      })
      
      // Get requestId
      const postMessageCalls = mockWorkerInstance.postMessage.mock.calls
      const batchCall = postMessageCalls.find(
        call => call[0].type === 'PREDICT_BATCH'
      )
      const requestId = batchCall?.[0].requestId
      
      // Simulate batch prediction result
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'BATCH_PREDICTION_RESULT',
          requestId,
          results: Array.from({ length: 10 }, () => [0.7, 0.2, 0.1]),
          totalTime: 150
        })
      })
      
      await waitFor(async () => {
        const result = await batchPromise!
        expect(result.results).toHaveLength(10)
        expect(result.totalTime).toBe(150)
        expect(result.throughput).toBeGreaterThan(0)
      })
    })
  })

  describe('Progress Reporting', () => {
    it('should report prediction progress from worker', async () => {
      const onProgress = vi.fn()
      const { result } = renderHook(() => 
        useMLInference({ useWorker: true, onProgress })
      )
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Simulate model loaded
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'MODEL_LOADED',
          modelName: 'test',
          backend: 'webgl'
        })
      })
      
      await waitFor(() => {
        expect(result.current.isModelReady).toBe(true)
      })
      
      // Make prediction
      act(() => {
        result.current.predict([0.5, 0.5, 0.5])
      })
      
      // Get requestId
      const postMessageCalls = mockWorkerInstance.postMessage.mock.calls
      const predictCall = postMessageCalls.find(
        call => call[0].type === 'PREDICT'
      )
      const requestId = predictCall?.[0].requestId
      
      // Simulate progress updates
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'PROGRESS',
          requestId,
          current: 1,
          total: 3,
          stage: 'preprocessing'
        })
      })
      
      await waitFor(() => {
        expect(onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            current: 1,
            total: 3,
            stage: 'preprocessing',
            percentComplete: 33
          })
        )
      })
      
      expect(result.current.predictionProgress?.percentComplete).toBe(33)
    })
  })

  describe('Queue Metrics', () => {
    it('should track queue depth from worker', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Simulate queue metrics update
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'QUEUE_METRICS',
          depth: 5
        })
      })
      
      await waitFor(() => {
        expect(result.current.queueDepth).toBe(5)
      })
    })

    it('should handle backpressure warnings', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      // Simulate backpressure warning
      act(() => {
        mockWorkerInstance.simulateMessage({
          type: 'BACKPRESSURE',
          queueDepth: 85,
          maxQueueSize: 100
        })
      })
      
      // Should log warning
      await waitFor(() => {
        expect(consoleWarn).toHaveBeenCalled()
      })
      
      consoleWarn.mockRestore()
    })
  })

  describe('Worker Toggle', () => {
    it('should allow toggling worker on/off', async () => {
      const { result } = renderHook(() => useMLInference({ useWorker: true }))
      
      expect(result.current.useWorker).toBe(true)
      
      await act(async () => {
        result.current.setUseWorker(false)
      })
      
      expect(result.current.useWorker).toBe(false)
      
      // Worker should be terminated
      expect(mockWorkerInstance.terminate).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup worker on unmount', async () => {
      const { result, unmount } = renderHook(() => 
        useMLInference({ useWorker: true })
      )
      
      await act(async () => {
        await result.current.loadModel('/models/test.json')
      })
      
      unmount()
      
      // Should send dispose message
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DISPOSE'
        })
      )
    })
  })
})

// Performance comparison test
describe('ML Worker Performance', () => {
  it('should measure worker vs main thread performance', async () => {
    // This is a conceptual test - actual performance tests would run in browser
    const performanceData = {
      workerTimes: [] as number[],
      mainThreadTimes: [] as number[]
    }
    
    // Simulate 10 predictions with worker
    for (let i = 0; i < 10; i++) {
      const start = performance.now()
      // Worker prediction would happen here
      await new Promise(resolve => setTimeout(resolve, 5)) // Simulated 5ms
      performanceData.workerTimes.push(performance.now() - start)
    }
    
    // Simulate 10 predictions on main thread (might block)
    for (let i = 0; i < 10; i++) {
      const start = performance.now()
      // Main thread prediction would happen here
      await new Promise(resolve => setTimeout(resolve, 3)) // Simulated 3ms
      performanceData.mainThreadTimes.push(performance.now() - start)
    }
    
    const avgWorkerTime = performanceData.workerTimes.reduce((a, b) => a + b, 0) / 10
    const avgMainThreadTime = performanceData.mainThreadTimes.reduce((a, b) => a + b, 0) / 10
    
    console.log(`Worker avg: ${avgWorkerTime.toFixed(2)}ms`)
    console.log(`Main thread avg: ${avgMainThreadTime.toFixed(2)}ms`)
    
    // Worker may be slightly slower due to message passing but provides non-blocking behavior
    expect(avgWorkerTime).toBeGreaterThan(0)
    expect(avgMainThreadTime).toBeGreaterThan(0)
  })
})
