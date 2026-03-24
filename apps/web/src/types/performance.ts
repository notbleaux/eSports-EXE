/** [Ver001.000]
 * Performance Types
 * TypeScript interfaces for performance monitoring metrics
 */

export interface FPSMetrics {
  average: number
  min: number
  max: number
  drops: number
}

export interface MemoryMetrics {
  used: number
  total: number
  limit: number
}

export interface PerformanceAlert {
  type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: number
  value?: number
}

export type WarningLevel = 'none' | 'info' | 'warning' | 'critical'

export interface PerformanceConfig {
  fpsWindowSize?: number
  fpsDropThreshold?: number
  memoryWarningThreshold?: number
  memoryCriticalThreshold?: number
  memoryCheckInterval?: number
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  fpsWindowSize: 60,
  fpsDropThreshold: 30,
  memoryWarningThreshold: 0.8,
  memoryCriticalThreshold: 0.9,
  memoryCheckInterval: 30000
}
