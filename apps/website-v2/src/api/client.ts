/**
 * API Client - Base HTTP client with retry logic
 * 
 * [Ver001.001]
 */

import { API_CONFIG } from '../config/api'
import { API_BASE_URL } from '../config/api'
import type { ApiRequestConfig, ApiResponse, ApiError } from './types'
import { logger } from '../utils/logger'

const apiLogger = logger.child('API')

/**
 * Cancellable request handle
 */
export interface CancellableRequest<T> {
  /** Promise that resolves with the response */
  promise: Promise<ApiResponse<T>>
  /** AbortController to cancel the request */
  controller: AbortController
  /** Cancel the request */
  cancel: (reason?: string) => void
}

// Token storage keys
const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

/**
 * Get authentication token from storage
 * Supports localStorage and cookie fallback
 */
function getAuthToken(): string | null {
  try {
    // Try localStorage first
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token) return token
    }
    
    // Fallback to cookies
    const cookies = document.cookie.split(';')
    const tokenCookie = cookies.find(c => c.trim().startsWith(`${AUTH_TOKEN_KEY}=`))
    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split('=')[1])
    }
  } catch (error) {
    apiLogger.error('Failed to get auth token', error)
  }
  return null
}

/**
 * Get refresh token from storage
 */
function getRefreshToken(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    }
  } catch (error) {
    apiLogger.error('Failed to get refresh token', error)
  }
  return null
}

/**
 * Store tokens in localStorage
 */
export function setAuthTokens(accessToken: string, refreshToken?: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      }
    }
  } catch (error) {
    apiLogger.error('Failed to store auth tokens', error)
  }
}

/**
 * Clear authentication tokens
 */
export function clearAuthTokens(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
    // Also clear cookie if present
    document.cookie = `${AUTH_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  } catch (error) {
    apiLogger.error('Failed to clear auth tokens', error)
  }
}

/**
 * Refresh access token using refresh token
 * Returns true if refresh succeeded, false otherwise
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    apiLogger.warn('No refresh token available')
    return false
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    })
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.accessToken) {
      setAuthTokens(data.accessToken, data.refreshToken || refreshToken)
      apiLogger.info('Token refreshed successfully')
      return true
    }
  } catch (error) {
    apiLogger.error('Token refresh failed', error)
  }
  
  return false
}

/**
 * Handle 401 Unauthorized - attempt token refresh or redirect to login
 */
async function handleUnauthorized(): Promise<boolean> {
  apiLogger.warn('401 Unauthorized - attempting token refresh')
  
  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    // Clear invalid tokens
    clearAuthTokens()
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/login?redirect=${currentPath}`
    }
  }
  
  return refreshed
}

/**
 * Handle 403 Forbidden - user lacks permission
 */
function handleForbidden(): void {
  apiLogger.error('403 Forbidden - insufficient permissions')
  
  // Dispatch event for UI to handle (show permission error)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:forbidden', {
      detail: { message: 'You do not have permission to perform this action' }
    }))
  }
}

/**
 * Make HTTP request with automatic retry and authentication
 */
export async function request<T>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body, timeout = API_CONFIG.timeout, retry = true, skipAuth = false, signal: externalSignal } = config
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  // Use external signal if provided, otherwise create our own controller
  let controller: AbortController
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  if (externalSignal) {
    // If external signal provided, use it directly (caller handles timeout/cancellation)
    controller = new AbortController()
    
    // Link external signal to our controller
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    
    // Still set up our own timeout
    timeoutId = setTimeout(() => controller.abort(), timeout)
  } else {
    // Create our own controller with timeout
    controller = new AbortController()
    timeoutId = setTimeout(() => controller.abort(), timeout)
  }
  
  let lastError: Error | null = null
  const maxRetries = retry ? API_CONFIG.retryAttempts : 0
  
  // Build headers with authentication
  const authHeaders: Record<string, string> = {}
  if (!skipAuth) {
    const token = getAuthToken()
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`
    }
  }
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      apiLogger.debug(`${method} ${url} (attempt ${attempt + 1}/${maxRetries + 1})`)
      
      const response = await fetch(url, {
        method,
        headers: {
          ...API_CONFIG.headers,
          ...authHeaders,
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })
      
      if (timeoutId) clearTimeout(timeoutId)
      
      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && !skipAuth) {
        const refreshed = await handleUnauthorized()
        if (refreshed && attempt < maxRetries) {
          // Retry with new token
          const newToken = getAuthToken()
          if (newToken) {
            authHeaders['Authorization'] = `Bearer ${newToken}`
            continue
          }
        }
        throw new ApiRequestError(
          'Authentication required. Please log in.',
          'UNAUTHORIZED',
          401
        )
      }
      
      // Handle 403 Forbidden
      if (response.status === 403) {
        handleForbidden()
        const errorData = await response.json().catch(() => ({}))
        throw new ApiRequestError(
          errorData.message || 'Access denied. Insufficient permissions.',
          'FORBIDDEN',
          403
        )
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiRequestError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || 'UNKNOWN_ERROR',
          response.status
        )
      }
      
      const data = await response.json()
      
      return {
        data,
        status: response.status,
        headers: response.headers
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on client errors (4xx)
      if (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) {
        break
      }
      
      // Last attempt failed
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retry
      const delay = API_CONFIG.retryDelay * Math.pow(2, attempt)
      apiLogger.warn(`Request failed, retrying in ${delay}ms...`, lastError.message)
      await sleep(delay)
    }
  }
  
  if (timeoutId) clearTimeout(timeoutId)
  
  const apiError: ApiError = {
    message: lastError?.message || 'Request failed',
    code: 'REQUEST_FAILED',
    status: 0
  }
  
  apiLogger.error('Request failed after all retries', apiError)
  throw apiError
}

/**
 * API Request Error
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

/**
 * HTTP method shortcuts
 */
export const api = {
  get: <T>(endpoint: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    request<T>(endpoint, { ...config, method: 'GET' }),
  
  post: <T>(endpoint: string, body: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    request<T>(endpoint, { ...config, method: 'POST', body }),
  
  put: <T>(endpoint: string, body: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    request<T>(endpoint, { ...config, method: 'PUT', body }),
  
  patch: <T>(endpoint: string, body: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    request<T>(endpoint, { ...config, method: 'PATCH', body }),
  
  delete: <T>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>) =>
    request<T>(endpoint, { ...config, method: 'DELETE' })
}

/**
 * Make cancellable HTTP request with external AbortController support
 * Allows callers to pass their own AbortController for cancellation
 */
export function requestCancellable<T>(
  endpoint: string,
  config: ApiRequestConfig = {}
): CancellableRequest<T> {
  const controller = new AbortController()
  
  const promise = request<T>(endpoint, {
    ...config,
    // Use provided signal if available, otherwise use our controller
    signal: config.signal || controller.signal
  })
  
  return {
    promise,
    controller,
    cancel: (reason?: string) => controller.abort(reason)
  }
}

/**
 * Cancellable HTTP method shortcuts
 * Returns CancellableRequest with promise, controller, and cancel function
 */
export const apiCancellable = {
  get: <T>(endpoint: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    requestCancellable<T>(endpoint, { ...config, method: 'GET' }),
  
  post: <T>(endpoint: string, body: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    requestCancellable<T>(endpoint, { ...config, method: 'POST', body }),
  
  put: <T>(endpoint: string, body: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    requestCancellable<T>(endpoint, { ...config, method: 'PUT', body }),
  
  patch: <T>(endpoint: string, body: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    requestCancellable<T>(endpoint, { ...config, method: 'PATCH', body }),
  
  delete: <T>(endpoint: string, config?: Omit<ApiRequestConfig, 'method'>) =>
    requestCancellable<T>(endpoint, { ...config, method: 'DELETE' })
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default api
