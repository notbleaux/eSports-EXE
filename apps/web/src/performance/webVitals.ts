/** [Ver001.000]
 * Web Vitals
 * Core Web Vitals tracking: LCP, FID, CLS, FCP, TTFB, INP
 */

export type WebVitalName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP'

export interface WebVitalMetric {
  name: WebVitalName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

export interface WebVitalsReport {
  LCP?: number
  FID?: number
  CLS?: number
  FCP?: number
  TTFB?: number
  INP?: number
}

const THRESHOLDS: Record<WebVitalName, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
}

function getRating(name: WebVitalName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value >= threshold.poor) return 'poor'
  return 'needs-improvement'
}

export function reportWebVital(name: WebVitalName, value: number): WebVitalMetric {
  return {
    name,
    value,
    rating: getRating(name, value)
  }
}

export function getAllWebVitals(): WebVitalsReport {
  // Placeholder for actual web vitals collection
  return {}
}
