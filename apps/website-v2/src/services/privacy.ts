/**
 * Privacy Service - GDPR compliance and data protection
 * 
 * [Ver001.000]
 */

import { PRIVACY_CONFIG } from '../config/analytics'
import { logger } from '../utils/logger'

const privacyLogger = logger.child('Privacy')

const CONSENT_KEY = 'analytics-consent'
const PRIVACY_MODE_KEY = 'privacy-mode'

export interface UserConsent {
  essential: boolean
  analytics: boolean
  performance: boolean
  marketing: boolean
  timestamp: string
  version: string
}

export function isPrivacyMode(): boolean {
  try {
    return localStorage.getItem(PRIVACY_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

export function enablePrivacyMode(): void {
  try {
    localStorage.setItem(PRIVACY_MODE_KEY, 'true')
    privacyLogger.info('Privacy mode enabled')
  } catch {
    privacyLogger.error('Failed to enable privacy mode')
  }
}

export function disablePrivacyMode(): void {
  try {
    localStorage.removeItem(PRIVACY_MODE_KEY)
    privacyLogger.info('Privacy mode disabled')
  } catch {
    privacyLogger.error('Failed to disable privacy mode')
  }
}

export function getConsent(): UserConsent {
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    privacyLogger.warn('Failed to read consent')
  }
  
  return {
    essential: true,
    analytics: false,
    performance: false,
    marketing: false,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }
}

export function setConsent(consent: Partial<UserConsent>): void {
  const updated = { ...getConsent(), ...consent, timestamp: new Date().toISOString() }
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(updated))
  } catch {
    privacyLogger.error('Failed to save consent')
  }
}

export function hasConsent(category: keyof UserConsent): boolean {
  if (isPrivacyMode()) return false
  return getConsent()[category] || false
}

export function scrubPii<T extends Record<string, unknown>>(data: T): T {
  const scrubbed = { ...data }
  for (const field of PRIVACY_CONFIG.piiFields) {
    if (field in scrubbed) scrubbed[field] = '[REDACTED]'
  }
  return scrubbed
}

export const privacyService = {
  isPrivacyMode, enablePrivacyMode, disablePrivacyMode,
  getConsent, setConsent, hasConsent, scrubPii
}

export default privacyService
