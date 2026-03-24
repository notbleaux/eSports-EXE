/**
 * API Client Tests - P0 Test Coverage
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { request, api, ApiRequestError } from '../client'
import { API_CONFIG, API_BASE_URL } from '../../config/api'

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }))
  }
}))

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('request with retry', () => {
    it('should make successful request and return data', async () => {
      const mockData = { id: 1, name: 'Test' }
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue(mockData)
      } as unknown as Response)

      const response = await request('/test-endpoint')

      expect(response.data).toEqual(mockData)
      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should construct full URL from endpoint', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response)

      await request('/test-endpoint')

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/test-endpoint`,
        expect.any(Object)
      )
    })

    it('should use provided full URL if endpoint starts with http', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response)

      await request('https://custom-api.com/endpoint')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-api.com/endpoint',
        expect.any(Object)
      )
    })

    it('should retry on network error', async () => {
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: vi.fn().mockResolvedValue({ success: true })
        } as unknown as Response)

      const response = await request('/test-endpoint')

      expect(response.data).toEqual({ success: true })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should retry on 5xx server errors', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: vi.fn().mockResolvedValue({ message: 'Server error' })
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: vi.fn().mockResolvedValue({ success: true })
        } as unknown as Response)

      const response = await request('/test-endpoint')

      expect(response.data).toEqual({ success: true })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry on 4xx client errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({ message: 'Resource not found', code: 'NOT_FOUND' })
      } as unknown as Response)

      await expect(request('/test-endpoint')).rejects.toMatchObject({
        message: 'Resource not found'
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should not retry when retry is disabled', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      await expect(request('/test-endpoint', { retry: false })).rejects.toBeDefined()

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should merge custom headers with default headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response)

      await request('/test-endpoint', {
        headers: { 'X-Custom-Header': 'custom-value' }
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Custom-Header': 'custom-value'
          })
        })
      )
    })

    it('should include request body for POST requests', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response)

      const body = { name: 'Test', value: 123 }
      await request('/test-endpoint', { method: 'POST', body })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body)
        })
      )
    })

    it('should use correct HTTP method', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response)

      await request('/test', { method: 'GET' })
      await request('/test', { method: 'POST', body: {} })
      await request('/test', { method: 'PUT', body: {} })
      await request('/test', { method: 'PATCH', body: {} })
      await request('/test', { method: 'DELETE' })

      const calls = vi.mocked(global.fetch).mock.calls
      expect(calls[0][1]).toMatchObject({ method: 'GET' })
      expect(calls[1][1]).toMatchObject({ method: 'POST' })
      expect(calls[2][1]).toMatchObject({ method: 'PUT' })
      expect(calls[3][1]).toMatchObject({ method: 'PATCH' })
      expect(calls[4][1]).toMatchObject({ method: 'DELETE' })
    })
  })

  describe('error handling', () => {
    it('should extract error message from response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ message: 'Invalid input data', code: 'VALIDATION_ERROR' })
      } as unknown as Response)

      await expect(request('/test-endpoint')).rejects.toMatchObject({
        message: 'Invalid input data'
      })
    })

    it('should throw ApiRequestError for HTTP errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: vi.fn().mockResolvedValue({ message: 'Validation failed', code: 'VALIDATION_ERROR' })
      } as unknown as Response)

      try {
        await request('/test-endpoint')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).toBe('Validation failed')
      }
    })
  })

  describe('api convenience methods', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({ result: 'success' })
      } as unknown as Response)
    })

    it('should make GET request with api.get', async () => {
      const response = await api.get('/test')

      expect(response.data).toEqual({ result: 'success' })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should make POST request with api.post', async () => {
      const body = { name: 'Test' }
      const response = await api.post('/test', body)

      expect(response.data).toEqual({ result: 'success' })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body)
        })
      )
    })

    it('should make PUT request with api.put', async () => {
      const body = { name: 'Updated' }
      const response = await api.put('/test/1', body)

      expect(response.data).toEqual({ result: 'success' })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body)
        })
      )
    })

    it('should make PATCH request with api.patch', async () => {
      const body = { field: 'value' }
      const response = await api.patch('/test/1', body)

      expect(response.data).toEqual({ result: 'success' })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(body)
        })
      )
    })

    it('should make DELETE request with api.delete', async () => {
      const response = await api.delete('/test/1')

      expect(response.data).toEqual({ result: 'success' })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should pass config options to request', async () => {
      await api.get('/test', { retry: false, timeout: 5000 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      )
    })
  })

  describe('ApiRequestError', () => {
    it('should create error with correct properties', () => {
      const error = new ApiRequestError('Test error', 'TEST_CODE', 418)

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.status).toBe(418)
      expect(error.name).toBe('ApiRequestError')
    })

    it('should be instanceof Error', () => {
      const error = new ApiRequestError('Test', 'CODE', 500)
      expect(error).toBeInstanceOf(Error)
    })
  })
})
