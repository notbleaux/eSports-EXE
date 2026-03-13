/**
 * Analytics Sync Service - Batches and syncs analytics to server
 * 
 * [Ver001.000]
 */

import { ANALYTICS_BATCH } from '../config/analytics'
import { analyticsApi } from '../api/analytics'
import { privacyService } from './privacy'
import { logger } from '../utils/logger'
import type { PredictionEvent, ModelLoadEvent, MLError } from '../types/ml'

const syncLogger = logger.child('AnalyticsSync')

export class AnalyticsSyncService {
  private eventBuffer: Array<{ type: string; timestamp: number; data: Record<string, unknown>; sessionId: string }> = []
  private flushInterval: NodeJS.Timeout | null = null
  private isOnline = navigator.onLine
  private isInitialized = false

  initialize(): void {
    if (this.isInitialized || privacyService.isPrivacyMode()) return
    this.isInitialized = true
    
    window.addEventListener('online', () => { this.isOnline = true; this.flush() })
    window.addEventListener('offline', () => { this.isOnline = false })
    
    this.flushInterval = setInterval(() => this.flush(), ANALYTICS_BATCH.flushIntervalMs)
    analyticsApi.flushOfflineQueue()
    
    syncLogger.info('Analytics sync initialized')
  }

  cleanup(): void {
    if (!this.isInitialized) return
    if (this.flushInterval) clearInterval(this.flushInterval)
    this.flush()
    this.isInitialized = false
  }

  trackPrediction(event: PredictionEvent): void {
    if (!privacyService.hasConsent('analytics')) return
    this.bufferEvent({
      type: 'prediction',
      timestamp: event.timestamp,
      data: { latency: event.latency, success: event.success, modelId: event.modelId }
    })
  }

  trackModelLoad(event: ModelLoadEvent): void {
    if (!privacyService.hasConsent('analytics')) return
    this.bufferEvent({
      type: 'model_load',
      timestamp: event.timestamp,
      data: { modelId: event.modelId, duration: event.duration, source: event.source }
    })
  }

  trackError(error: MLError, context: string): void {
    if (!privacyService.hasConsent('analytics')) return
    this.bufferEvent({
      type: 'error',
      timestamp: Date.now(),
      data: { errorType: error.type, message: error.message, context }
    })
  }

  private bufferEvent(event: { type: string; timestamp: number; data: Record<string, unknown> }): void {
    this.eventBuffer.push({ ...event, sessionId: this.getSessionId() })
    if (this.eventBuffer.length >= ANALYTICS_BATCH.maxSize) this.flush()
  }

  private async flush(): Promise<void> {
    if (this.eventBuffer.length === 0 || !this.isOnline) return
    const events = [...this.eventBuffer]
    this.eventBuffer = []
    
    try {
      await analyticsApi.postBatchAnalytics(events as any)
    } catch {
      this.eventBuffer.unshift(...events)
    }
  }

  private getSessionId(): string {
    let id = sessionStorage.getItem('analytics-session-id')
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics-session-id', id)
    }
    return id
  }

  getStats(): { buffered: number; queued: number } {
    return { buffered: this.eventBuffer.length, queued: analyticsApi.getQueueSize() }
  }
}

export const analyticsSync = new AnalyticsSyncService()
export default analyticsSync
