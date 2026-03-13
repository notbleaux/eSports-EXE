/**
 * API Client - Base HTTP client with retry logic
 * 
 * [Ver001.000]
 */

import { API_CONFIG } from '../config/api'
import { API_BASE_URL } from '../config/api'
import type { ApiRequestConfig, ApiResponse, ApiError } from './types'
import { logger } from '../utils/logger'

const apiLogger = logger.child('API')

/**
 * Make HTTP request with automatic retry
 */
export async function request<T>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body, timeout = API_CONFIG.timeout, retry = true } = config
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  let lastError: Error | null = null
  const maxRetries = retry ? API_CONFIG.retryAttempts : 0
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      apiLogger.debug(`${method} ${url} (attempt ${attempt + 1}/${maxRetries + 1})`)
      
      const response = await fetch(url, {
        method,
        headers: {
          ...API_CONFIG.headers,
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
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
  
  clearTimeout(timeoutId)
  
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
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default api
