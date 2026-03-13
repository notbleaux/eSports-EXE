/**
 * Environment Configuration - Runtime environment detection
 * 
 * [Ver001.000]
 */

// Environment variables interface
export interface Environment {
  NODE_ENV: 'development' | 'staging' | 'production'
  VITE_API_URL?: string
  VITE_WS_URL?: string
  VITE_MODEL_REGISTRY_URL?: string
  DEBUG?: boolean
}

// Detect environment
function detectEnvironment(): Environment['NODE_ENV'] {
  if (typeof process !== 'undefined' && process.env) {
    const env = process.env.NODE_ENV
    if (env === 'production' || env === 'staging') {
      return env
    }
  }
  
  // Check for staging in URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname.includes('staging') || hostname.includes('preview')) {
      return 'staging'
    }
  }
  
  return 'development'
}

// Get environment variables
export function getEnvironment(): Environment {
  const nodeEnv = detectEnvironment()
  
  return {
    NODE_ENV: nodeEnv,
    VITE_API_URL: import.meta.env?.VITE_API_URL,
    VITE_WS_URL: import.meta.env?.VITE_WS_URL,
    VITE_MODEL_REGISTRY_URL: import.meta.env?.VITE_MODEL_REGISTRY_URL,
    DEBUG: import.meta.env?.DEBUG === 'true' || nodeEnv === 'development'
  }
}

// Environment checks
export const isDevelopment = (): boolean => getEnvironment().NODE_ENV === 'development'
export const isStaging = (): boolean => getEnvironment().NODE_ENV === 'staging'
export const isProduction = (): boolean => getEnvironment().NODE_ENV === 'production'

// Debug mode
export const isDebug = (): boolean => getEnvironment().DEBUG === true

// Log environment info (once)
let envLogged = false
export function logEnvironment(): void {
  if (envLogged) return
  envLogged = true
  
  const env = getEnvironment()
  console.log(`[Config] Environment: ${env.NODE_ENV}`)
  console.log(`[Config] Debug mode: ${env.DEBUG}`)
}
