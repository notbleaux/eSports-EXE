/**
 * API Client
 * 
 * Base HTTP client for API requests with error handling.
 * Phase 3: Frontend Integration
 * 
 * [Ver001.000]
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- Types ---

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  status: number;
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// --- Request Helpers ---

async function makeRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<APIResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const status = response.status;
    
    // Handle empty responses
    if (response.status === 204) {
      return { success: true, status };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data.detail || data.message || 'Request failed',
          code: data.code,
        },
        status,
      };
    }
    
    return {
      success: true,
      data,
      status,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
      },
      status: 0,
    };
  }
}

// --- API Client ---

export const apiClient = {
  get<T>(endpoint: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return makeRequest<T>('GET', endpoint, undefined, headers);
  },
  
  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return makeRequest<T>('POST', endpoint, body, headers);
  },
  
  put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return makeRequest<T>('PUT', endpoint, body, headers);
  },
  
  patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return makeRequest<T>('PATCH', endpoint, body, headers);
  },
  
  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return makeRequest<T>('DELETE', endpoint, undefined, headers);
  },
};

// --- Utility Functions ---

/**
 * Check if the API is available.
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get API version info.
 */
export async function getApiVersion(): Promise<{ version: string; environment: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/version`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}
