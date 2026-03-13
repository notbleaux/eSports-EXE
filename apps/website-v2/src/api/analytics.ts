/**
 * Analytics API - Server-side analytics collection
 * 
 * [Ver001.000]
 */

import { ANALYTICS_ENDPOINTS, ANALYTICS_BATCH } from '../config/analytics'
import { privacyService, scrubPii } from '../services/privacy'
import { logger } from '../utils/logger'
import type { PredictionEvent, ModelLoadEvent, MLError } from '../types/ml'

const analyticsLogger = logger.child('AnalyticsAPI')

export interface AnalyticsEvent {
  type: 'prediction' | 'model_load' | 'error' | 'performance'
  timestamp: number
  data: Record<string, unknown>
  sessionId: string
}

export interface AnalyticsBatch {
  events: AnalyticsEvent[]
  metadata: {
    batchSize: number
    sentAt: string
    clientVersion: string
  }
}

export interface DashboardParams {
  timeRange: '1h' | '24h' | '7d' | '30d'
  metrics: string[]
}

export interface DashboardData {
  predictions: {
    total: number
    errors: number
    avgLatency: number
    p95Latency: number
  }
  models: {
    active: string[]
    loads: number
    errors: number
  }
  realtime: {
    predictionsPerSecond: number
    activeUsers: number
  }
}

// Session ID for tracking
const SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

/**
 * Post single analytics event
 */
export async function postAnalyticsEvent(event: Omit<AnalyticsEvent, 'sessionId'>): Promise<void> {
  if (privacyService.isPrivacyMode()) {
    return
  }
  
  if (!privacyService.hasConsent('analytics')) {
    return
  }
  
  const fullEvent: AnalyticsEvent = {
    ...event,
    sessionId: SESSION_ID,
    data: scrubPii(event.data)
  }
  
  try {
    const response = await fetch(ANALYTICS_ENDPOINTS.events, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullEvent)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    analyticsLogger.error('Failed to post analytics event', error)
    // Queue for retry
    queueForRetry(fullEvent)
  }
}

/**
 * Post batch analytics
 */
export async function postBatchAnalytics(events: AnalyticsEvent[]): Promise<void> {
  if (events.length === 0) return
  if (privacyService.isPrivacyMode()) return
  if (!privacyService.hasConsent('analytics')) return
  
  const batch: AnalyticsBatch = {
    events: events.map(e => ({ ...e, sessionId: SESSION_ID, data: scrubPii(e.data) })),
    metadata: {
      batchSize: events.length,
      sentAt: new Date().toISOString(),
      clientVersion: '2.0.0'
    }
  }
  
  let attempts = 0
  
  while (attempts < ANALYTICS_BATCH.retryAttempts) {
    try {
      const response = await fetch(ANALYTICS_ENDPOINTS.batch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      })
      
      if (response.ok) {
        analyticsLogger.debug(`Batch sent: ${events.length} events`)
        return
      }
      
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      attempts++
      analyticsLogger.warn(`Batch failed (attempt ${attempts})`, error)
      
      if (attempts < ANALYTICS_BATCH.retryAttempts) {
        await sleep(ANALYTICS_BATCH.retryDelayMs * Math.pow(2, attempts - 1))
      }
    }
  }
  
  // All retries failed, queue for later
  events.forEach(queueForRetry)
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboard(params: DashboardParams): Promise<DashboardData> {
  const queryParams = new URLSearchParams({
    range: params.timeRange,
    metrics: params.metrics.join(',')
  })
  
  const response = await fetch(`${ANALYTICS_ENDPOINTS.events}/dashboard?${queryParams}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.status}`)
  }
  
  return response.json()
}

// Offline queue
const offlineQueue: AnalyticsEvent[] = []

function queueForRetry(event: AnalyticsEvent): void {
  if (offlineQueue.length >= 1000) {
    offlineQueue.shift() // Remove oldest
  }
  offlineQueue.push(event)
  
  // Persist to IndexedDB for survival across refreshes
  persistQueue()
}

async function persistQueue(): Promise<void> {
  try {
    // Simple localStorage fallback (could use IndexedDB)
    localStorage.setItem('analytics-queue', JSON.stringify(offlineQueue.slice(-100)))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Flush offline queue
 */
export async function flushOfflineQueue(): Promise<void> {
  if (offlineQueue.length === 0) {
    // Try to restore from storage
    try {
      const stored = localStorage.getItem('analytics-queue')
      if (stored) {
        const events = JSON.parse(stored)
        offlineQueue.push(...events)
        localStorage.removeItem('analytics-queue')
      }
    } catch {
      // Ignore
    }
  }
  
  if (offlineQueue.length === 0) return
  
  const batch = offlineQueue.splice(0, ANALYTICS_BATCH.maxSize)
  
  try {
    await postBatchAnalytics(batch)
  } catch {
    // Put back in queue
    offlineQueue.unshift(...batch)
  }
}

/**
 * Get queue size
 */
export function getQueueSize(): number {
  return offlineQueue.length
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const analyticsApi = {
  postAnalyticsEvent,
  postBatchAnalytics,
  getAnalyticsDashboard,
  flushOfflineQueue,
  getQueueSize
}

export default analyticsApi
