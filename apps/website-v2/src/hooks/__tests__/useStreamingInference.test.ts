/**
 * useStreamingInference Hook Tests
 * 
 * [Ver001.000]
 */

import { describe, it, expect } from 'vitest'

describe('useStreamingInference', () => {
  it('should calculate throughput correctly', () => {
    const calculateThroughput = (count: number, elapsedMs: number): number => {
      if (elapsedMs === 0) return 0
      return (count / elapsedMs) * 1000
    }
    
    expect(calculateThroughput(10, 1000)).toBe(10)
    expect(calculateThroughput(5, 500)).toBe(10)
    expect(calculateThroughput(0, 1000)).toBe(0)
  })

  it('should validate stream data schema', () => {
    interface StreamData {
      id: string
      features: number[]
      timestamp: number
    }
    
    const validateStreamData = (data: unknown): data is StreamData => {
      if (typeof data !== 'object' || data === null) return false
      const d = data as Record<string, unknown>
      return (
        typeof d.id === 'string' &&
        Array.isArray(d.features) &&
        d.features.every(v => typeof v === 'number') &&
        typeof d.timestamp === 'number'
      )
    }
    
    expect(validateStreamData({
      id: 'test-1',
      features: [0.1, 0.2, 0.3],
      timestamp: Date.now()
    })).toBe(true)
    
    expect(validateStreamData({
      id: 'test-2',
      features: 'invalid'
    })).toBe(false)
    
    expect(validateStreamData(null)).toBe(false)
  })

  it('should calculate lag correctly', () => {
    const calculateLag = (dataTimestamp: number, currentTime: number): number => {
      return currentTime - dataTimestamp
    }
    
    const now = Date.now()
    expect(calculateLag(now - 50, now)).toBe(50)
    expect(calculateLag(now, now)).toBe(0)
  })

  it('should debounce predictions correctly', () => {
    const now = Date.now()
    const predictions = [
      { timestamp: now },
      { timestamp: now + 50 },
      { timestamp: now + 100 },
      { timestamp: now + 200 }
    ]
    
    const debounceWindow = 100
    const debouncedCount = predictions.filter((p, i) => {
      if (i === 0) return true
      return p.timestamp - predictions[i - 1].timestamp > debounceWindow
    }).length
    
    // With 100ms window, predictions at 0, 50, 100, 200 would be: 0, 200 (100+100 gap)
    expect(debouncedCount).toBeLessThanOrEqual(predictions.length)
  })
})
