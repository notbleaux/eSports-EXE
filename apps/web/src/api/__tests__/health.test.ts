/**
 * Health Check API Tests - P0 Test Coverage
 * 
 * [Ver002.000] - Fixed test structure and added comprehensive coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getQuickHealth, getHealthStatus } from '../health'

// Mock analyticsSync
vi.mock('../../services/analyticsSync', () => ({
  analyticsSync: {
    track: vi.fn()
  }
}))

describe('Health Check API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getQuickHealth', () => {
    it('getQuickHealth returns valid status object', () => {
      const health = getQuickHealth()
      
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('timestamp')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
      expect(health.timestamp).toBeGreaterThan(0)
    })

    it('should return numeric timestamp', () => {
      const health = getQuickHealth()
      expect(typeof health.timestamp).toBe('number')
    })
  })

  describe('getHealthStatus', () => {
    it('getHealthStatus returns full health response', async () => {
      const health = await getHealthStatus()
      
      // Verify structure
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('version')
      expect(health).toHaveProperty('timestamp')
      expect(health).toHaveProperty('uptime')
      expect(health).toHaveProperty('checks')
      expect(health).toHaveProperty('metadata')
      
      // Verify checks structure
      expect(health.checks).toHaveProperty('mlModel')
      expect(health.checks).toHaveProperty('api')
      expect(health.checks).toHaveProperty('cache')
      expect(health.checks).toHaveProperty('webVitals')
      
      // Verify version
      expect(health.version).toBe('2.0.0')
      
      // Verify status is valid
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    })

    it('health check includes ML model status', async () => {
      const health = await getHealthStatus()
      
      expect(health.checks.mlModel).toHaveProperty('status')
      expect(['loaded', 'loading', 'error', 'not-loaded']).toContain(health.checks.mlModel.status)
    })

    it('health check includes API status', async () => {
      const health = await getHealthStatus()
      
      expect(health.checks.api).toHaveProperty('status')
      expect(health.checks.api).toHaveProperty('lastChecked')
      expect(['connected', 'disconnected', 'degraded']).toContain(health.checks.api.status)
    })

    it('health check includes cache status', async () => {
      const health = await getHealthStatus()
      
      expect(health.checks.cache).toHaveProperty('status')
      expect(health.checks.cache).toHaveProperty('hitRate')
      expect(health.checks.cache).toHaveProperty('modelCount')
      expect(['warm', 'cold', 'error']).toContain(health.checks.cache.status)
    })

    it('health check includes web vitals', async () => {
      const health = await getHealthStatus()
      
      expect(health.checks.webVitals).toHaveProperty('status')
      expect(['good', 'needs-improvement', 'poor']).toContain(health.checks.webVitals.status)
    })

    it('health check caches results', async () => {
      const health1 = await getHealthStatus()
      const health2 = await getHealthStatus()
      
      // Should return same cached result within TTL
      expect(health1.timestamp).toBe(health2.timestamp)
    })

    it('should include valid metadata', async () => {
      const health = await getHealthStatus()
      
      expect(health.metadata).toHaveProperty('environment')
      expect(health.metadata).toHaveProperty('region')
      expect(health.metadata).toHaveProperty('instance')
    })

    it('should have positive uptime', async () => {
      const health = await getHealthStatus()
      expect(health.uptime).toBeGreaterThanOrEqual(0)
    })
  })
})
