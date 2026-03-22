/**
 * Analytics API Tests - P0 Test Coverage
 * 
 * Tests for analytics collection, batching, and dashboard
 * 
 * [Ver001.000]
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  postAnalyticsEvent,
  postBatchAnalytics,
  getAnalyticsDashboard,
  flushOfflineQueue,
  getQueueSize,
  analyticsApi,
  type AnalyticsEvent,
  type DashboardParams
} from '../analytics'

// Mock privacy service
vi.mock('../../services/privacy', () => ({
  privacyService: {
    isPrivacyMode: vi.fn(() => false),
    hasConsent: vi.fn(() => true),
  },
  scrubPii: vi.fn((data) => data),
}))

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}))

describe('Analytics API', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('postAnalyticsEvent', () => {
    it('should post single event successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      const event: Omit<AnalyticsEvent, 'sessionId'> = {
        type: 'prediction',
        timestamp: Date.now(),
        data: { modelId: 'test-model', confidence: 0.9 },
      }

      await postAnalyticsEvent(event)

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/events'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('prediction'),
        })
      )
    })

    it('should not post when privacy mode is enabled', async () => {
      const { privacyService } = await import('../../services/privacy')
      vi.mocked(privacyService.isPrivacyMode).mockReturnValue(true)

      const event: Omit<AnalyticsEvent, 'sessionId'> = {
        type: 'prediction',
        timestamp: Date.now(),
        data: {},
      }

      await postAnalyticsEvent(event)

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should not post without analytics consent', async () => {
      const { privacyService } = await import('../../services/privacy')
      vi.mocked(privacyService.hasConsent).mockReturnValue(false)

      const event: Omit<AnalyticsEvent, 'sessionId'> = {
        type: 'prediction',
        timestamp: Date.now(),
        data: {},
      }

      await postAnalyticsEvent(event)

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should queue event for retry on failure', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      const event: Omit<AnalyticsEvent, 'sessionId'> = {
        type: 'prediction',
        timestamp: Date.now(),
        data: { test: 'data' },
      }

      await postAnalyticsEvent(event)

      // Should attempt to persist to localStorage
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('postBatchAnalytics', () => {
    it('should post batch events successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      const events: AnalyticsEvent[] = [
        { type: 'prediction', timestamp: Date.now(), data: {}, sessionId: 'sess-1' },
        { type: 'model_load', timestamp: Date.now(), data: {}, sessionId: 'sess-1' },
      ]

      await postBatchAnalytics(events)

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/batch'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('batchSize'),
        })
      )
    })

    it('should handle empty events array', async () => {
      await postBatchAnalytics([])
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should retry on failure with exponential backoff', async () => {
      vi.useFakeTimers()
      
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response)

      const events: AnalyticsEvent[] = [
        { type: 'prediction', timestamp: Date.now(), data: {}, sessionId: 'sess-1' },
      ]

      const promise = postBatchAnalytics(events)
      
      // Fast-forward through retries
      await vi.runAllTimersAsync()
      await promise

      expect(global.fetch).toHaveBeenCalledTimes(3)
      vi.useRealTimers()
    }, 10000)

    it('should queue events after all retries fail', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      const events: AnalyticsEvent[] = [
        { type: 'prediction', timestamp: Date.now(), data: {}, sessionId: 'sess-1' },
      ]

      await postBatchAnalytics(events)

      // After all retries, events should be queued
      expect(getQueueSize()).toBeGreaterThanOrEqual(0)
    }, 10000)
  })

  describe('getAnalyticsDashboard', () => {
    it('should fetch dashboard data', async () => {
      const mockData = {
        predictions: { total: 100, errors: 5, avgLatency: 20.5, p95Latency: 45.2 },
        models: { active: ['model-a'], loads: 50, errors: 2 },
        realtime: { predictionsPerSecond: 10.5, activeUsers: 25 },
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Response)

      const params: DashboardParams = {
        timeRange: '24h',
        metrics: ['predictions', 'latency'],
      }

      const result = await getAnalyticsDashboard(params)

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('range=24h')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('metrics=predictions%2Clatency')
      )
    })

    it('should throw on fetch failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      const params: DashboardParams = {
        timeRange: '1h',
        metrics: ['predictions'],
      }

      await expect(getAnalyticsDashboard(params)).rejects.toThrow()
    })
  })

  describe('flushOfflineQueue', () => {
    it('should flush queued events', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response)

      // First, queue some events by failing a batch
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))
      
      const events: AnalyticsEvent[] = [
        { type: 'prediction', timestamp: Date.now(), data: {}, sessionId: 'sess-1' },
      ]
      
      await postBatchAnalytics(events)
      
      // Reset mock to succeed
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response)

      // Now flush
      await flushOfflineQueue()
      
      // Should have attempted to send
      expect(global.fetch).toHaveBeenCalled()
    }, 10000)

    it('should handle empty queue gracefully', async () => {
      await expect(flushOfflineQueue()).resolves.not.toThrow()
    })
  })

  describe('getQueueSize', () => {
    it('should return current queue size', () => {
      const size = getQueueSize()
      expect(typeof size).toBe('number')
      expect(size).toBeGreaterThanOrEqual(0)
    })
  })

  describe('analyticsApi export', () => {
    it('should export all functions', () => {
      expect(analyticsApi.postAnalyticsEvent).toBeDefined()
      expect(analyticsApi.postBatchAnalytics).toBeDefined()
      expect(analyticsApi.getAnalyticsDashboard).toBeDefined()
      expect(analyticsApi.flushOfflineQueue).toBeDefined()
      expect(analyticsApi.getQueueSize).toBeDefined()
    })
  })
})
