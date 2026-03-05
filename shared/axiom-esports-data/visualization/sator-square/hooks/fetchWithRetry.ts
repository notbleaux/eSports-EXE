/**
 * fetchWithRetry.ts — Reliable fetch utility with retry logic and error handling
 * 
 * Usage:
 *   const data = await fetchWithRetry('/api/data');
 *   const data = await fetchWithRetry('/api/data', { method: 'POST' }, 5);
 */

export interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface FetchResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Fetch with automatic retry logic and exponential backoff
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options (extends RequestInit)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise with parsed JSON data
 * @throws Error after all retries exhausted
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Check for HTTP error status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx) except for rate limiting (429)
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        if (error.status !== 429) {
          throw lastError;
        }
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw new Error(
          `Failed after ${maxRetries} attempts: ${lastError.message}`
        );
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delayMs = 1000 * Math.pow(2, attempt);
      console.warn(`[fetchWithRetry] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached due to throw above
  throw lastError || new Error('Unknown fetch error');
}

/**
 * Fetch with validation - validates response data against a schema
 * 
 * @param url - The URL to fetch
 * @param validator - Function to validate each item in response array
 * @param options - Fetch options
 * @param maxRetries - Maximum retry attempts
 * @returns Array of validated items
 */
export async function fetchWithValidation<T>(
  url: string,
  validator: { validate: (data: unknown) => data is T },
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<T[]> {
  const data = await fetchWithRetry<unknown[]>(url, options, maxRetries);

  if (!Array.isArray(data)) {
    throw new Error('Expected array response');
  }

  // Validate each item, filter invalid ones
  const validated = data.filter((item: unknown) => {
    const isValid = validator.validate(item);
    if (!isValid) {
      console.warn('[fetchWithValidation] Invalid data item:', item);
    }
    return isValid;
  });

  return validated;
}

/**
 * Hook-compatible fetch result helper
 * Returns standard { data, loading, error } shape
 */
export function createInitialState<T>(): FetchResult<T> {
  return {
    data: null,
    error: null,
    loading: true,
  };
}

export default fetchWithRetry;
