/**
 * Health Check API Endpoint
 * Returns system health status for monitoring and load balancers
 * 
 * [Ver001.001] - Updated health endpoint to use /v1/ prefix
 */

import { api } from './client'
import { performanceMonitor } from '../monitoring/PerformanceMonitor'
import { useMLCacheStore } from '../store/mlCacheStore'

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface MLModelHealth {
  status: 'loaded' | 'loading' | 'error' | 'not-loaded'
  modelId?: string
  lastLoaded?: number
  loadTime?: number
  errorMessage?: string
}

export interface APIHealth {
  status: 'connected' | 'disconnected' | 'degraded'
  latency?: number
  lastChecked: number
}

export interface CacheHealth {
  status: 'warm' | 'cold' | 'error'
  hitRate: number
  modelCount: number
  totalSize: number
}

export interface HealthCheckResponse {
  status: HealthStatus
  version: string
  timestamp: number
  uptime: number
  checks: {
    mlModel: MLModelHealth
    api: APIHealth
    cache: CacheHealth
    webVitals: {
      LCP?: number
      FID?: number
      CLS?: number
      FCP?: number
      TTFB?: number
    }
  }
  metadata: {
    environment: string
    buildId: string
    nodeVersion?: string
  }
}

// Cache health check results to avoid excessive computation
let cachedHealth: HealthCheckResponse | null = null
let lastHealthCheck = 0
const HEALTH_CACHE_TTL = 5000 // 5 seconds

/**
 * Perform comprehensive health check
 */
export async function getHealthStatus(): Promise<HealthCheckResponse> {
  const now = Date.now()
  
  // Return cached result if within TTL
  if (cachedHealth && (now - lastHealthCheck) < HEALTH_CACHE_TTL) {
    return cachedHealth
  }

  // Gather all health data
  const [mlHealth, apiHealth, cacheHealth] = await Promise.all([
    checkMLModelHealth(),
    checkAPIHealth(),
    checkCacheHealth()
  ])

  // Get Web Vitals from performance monitor
  const metrics = performanceMonitor.getMetrics()
  const webVitals: HealthCheckResponse['checks']['webVitals'] = {}
  
  for (const vital of metrics.webVitals) {
    webVitals[vital.name] = vital.value
  }

  // Determine overall status
  let status: HealthStatus = 'healthy'
  if (apiHealth.status === 'disconnected' || mlHealth.status === 'error') {
    status = 'unhealthy'
  } else if (apiHealth.status === 'degraded' || cacheHealth.status === 'cold') {
    status = 'degraded'
  }

  // Build response
  const health: HealthCheckResponse = {
    status,
    version: '2.0.0',
    timestamp: now,
    uptime: getUptime(),
    checks: {
      mlModel: mlHealth,
      api: apiHealth,
      cache: cacheHealth,
      webVitals
    },
    metadata: {
      environment: (import.meta as unknown as { env: Record<string, string> }).env.VITE_APP_ENV || 'production',
      buildId: (import.meta as unknown as { env: Record<string, string> }).env.VITE_BUILD_ID || 'unknown',
      nodeVersion: typeof process !== 'undefined' ? process.version : undefined
    }
  }

  // Cache result
  cachedHealth = health
  lastHealthCheck = now

  return health
}

/**
 * Quick health check for load balancers (just returns status)
 */
export function getQuickHealth(): { status: HealthStatus; timestamp: number } {
  // Use cached health if available
  if (cachedHealth) {
    return {
      status: cachedHealth.status,
      timestamp: Date.now()
    }
  }

  // Default to healthy if no checks performed yet
  return {
    status: 'healthy',
    timestamp: Date.now()
  }
}

// Private health check functions
async function checkMLModelHealth(): Promise<MLModelHealth> {
  // Check ML cache store for model status
  const cacheStore = useMLCacheStore.getState()
  const cachedModels = cacheStore.cachedModels
  
  if (cachedModels.size === 0) {
    return { status: 'not-loaded' }
  }

  // Get first cached model for health info
  const firstModel = Array.from(cachedModels.values())[0]
  
  return {
    status: 'loaded',
    modelId: firstModel.id,
    lastLoaded: firstModel.lastAccessed,
    loadTime: firstModel.accessCount // Proxy for load tracking
  }
}

async function checkAPIHealth(): Promise<APIHealth> {
  const startTime = performance.now()
  
  try {
    // Try to fetch a lightweight endpoint
    const response = await api.get('/v1/health/ping', { 
      timeout: 5000,
      retry: false 
    })
    
    const latency = performance.now() - startTime
    
    return {
      status: latency > 1000 ? 'degraded' : 'connected',
      latency,
      lastChecked: Date.now()
    }
  } catch (error) {
    return {
      status: 'disconnected',
      lastChecked: Date.now()
    }
  }
}

function checkCacheHealth(): CacheHealth {
  const cacheStore = useMLCacheStore.getState()
  const stats = cacheStore.getCacheStats()
  
  let status: CacheHealth['status'] = 'warm'
  if (stats.modelCount === 0) {
    status = 'cold'
  } else if (stats.hitRate < 0.1) {
    status = 'cold'
  }

  return {
    status,
    hitRate: stats.hitRate,
    modelCount: stats.modelCount,
    totalSize: stats.totalSize
  }
}

function getUptime(): number {
  if (typeof window !== 'undefined' && window.performance) {
    return Math.floor(window.performance.now())
  }
  return 0
}

// React hook for health check polling
export function useHealthCheck(pollInterval = 30000) {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true
    let intervalId: number

    const checkHealth = async () => {
      try {
        const status = await getHealthStatus()
        if (mounted) {
          setHealth(status)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Initial check
    checkHealth()

    // Set up polling
    intervalId = window.setInterval(checkHealth, pollInterval)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [pollInterval])

  return { health, isLoading, error, refetch: () => getHealthStatus() }
}

// Import useState for the hook
import { useState, useEffect } from 'react'

export default getHealthStatus
