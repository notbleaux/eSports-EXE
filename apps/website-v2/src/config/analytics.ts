/**
 * Analytics Configuration - Data collection and privacy settings
 * 
 * [Ver001.000]
 */

import { getEnvironment, isProduction } from './environment'

const env = getEnvironment()

// Analytics endpoints
export const ANALYTICS_ENDPOINTS = {
  events: `${env.VITE_API_URL || 'https://api.libre-x-esport.com'}/v1/analytics/events`,
  batch: `${env.VITE_API_URL || 'https://api.libre-x-esport.com'}/v1/analytics/batch`,
  dashboard: `${env.VITE_WS_URL || 'wss://api.libre-x-esport.com'}/v1/analytics/dashboard`
} as const

// Batch configuration
export const ANALYTICS_BATCH = {
  maxSize: 100,           // Max events per batch
  flushIntervalMs: 30000, // Flush every 30 seconds
  retryAttempts: 3,
  retryDelayMs: 1000
} as const

// Privacy settings
export const PRIVACY_CONFIG = {
  // Data retention (days)
  retentionDays: {
    predictions: 90,
    analytics: 365,
    errors: 30
  },
  
  // PII fields to scrub
  piiFields: [
    'email',
    'username',
    'ip',
    'userAgent',
    'fingerprint'
  ],
  
  // Anonymization
  anonymizeIp: true,
  anonymizeUserId: true
} as const

// Feature toggles
export const ANALYTICS_FEATURES = {
  enabled: true,
  realTimeDashboard: true,
  serverSync: isProduction(), // Only sync to server in production
  offlineQueue: true,
  privacyMode: false // Set to true to disable all tracking
} as const

// Consent categories
export const CONSENT_CATEGORIES = {
  essential: true,    // Always required
  analytics: false,   // Requires consent
  performance: false, // Requires consent
  marketing: false    // Requires consent
} as const

export type ConsentCategory = keyof typeof CONSENT_CATEGORIES

// Get effective analytics config
export function getAnalyticsConfig() {
  return {
    endpoints: ANALYTICS_ENDPOINTS,
    batch: ANALYTICS_BATCH,
    privacy: PRIVACY_CONFIG,
    features: ANALYTICS_FEATURES,
    consent: CONSENT_CATEGORIES
  }
}
