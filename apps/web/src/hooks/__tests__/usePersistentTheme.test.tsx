/**
 * usePersistentTheme Hook Tests
 * 
 * Tests for theme persistence with localStorage
 * 
 * [Ver001.000]
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistentTheme } from '../usePersistentTheme'

describe('usePersistentTheme', () => {
  // localStorage is mocked in setup.js and cleared after each test

  it('should default to light theme when no stored value', () => {
    const { result } = renderHook(() => usePersistentTheme())
    
    const [theme] = result.current
    expect(theme).toBe('light')
  })

  it('should read theme from localStorage on initialization', () => {
    // Pre-populate localStorage
    localStorage.setItem('landing-theme-preference', 'valorant')
    
    const { result } = renderHook(() => usePersistentTheme())
    
    const [theme] = result.current
    expect(theme).toBe('valorant')
  })

  it('should default to light for invalid stored values', () => {
    // Set invalid value
    localStorage.setItem('landing-theme-preference', 'invalid-theme')
    
    const { result } = renderHook(() => usePersistentTheme())
    
    const [theme] = result.current
    expect(theme).toBe('light')
  })

  it('should persist theme to localStorage when changed', () => {
    const { result } = renderHook(() => usePersistentTheme())
    
    const [, setTheme] = result.current
    
    act(() => {
      setTheme('valorant')
    })
    
    expect(localStorage.setItem).toHaveBeenCalledWith('landing-theme-preference', 'valorant')
    expect(result.current[0]).toBe('valorant')
  })

  it('should update theme from light to valorant', () => {
    const { result } = renderHook(() => usePersistentTheme())
    
    expect(result.current[0]).toBe('light')
    
    act(() => {
      result.current[1]('valorant')
    })
    
    expect(result.current[0]).toBe('valorant')
  })

  it('should update theme from valorant to light', () => {
    localStorage.setItem('landing-theme-preference', 'valorant')
    
    const { result } = renderHook(() => usePersistentTheme())
    
    expect(result.current[0]).toBe('valorant')
    
    act(() => {
      result.current[1]('light')
    })
    
    expect(result.current[0]).toBe('light')
  })

  it('should handle localStorage getItem errors gracefully', () => {
    // Mock console.warn to verify error handling
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Override localStorage.getItem to throw
    const originalGetItem = localStorage.getItem
    localStorage.getItem = vi.fn(() => {
      throw new Error('Storage error')
    })
    
    const { result } = renderHook(() => usePersistentTheme())
    
    // Should default to light on error
    expect(result.current[0]).toBe('light')
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to read theme from localStorage:',
      expect.any(Error)
    )
    
    // Cleanup
    localStorage.getItem = originalGetItem
    consoleSpy.mockRestore()
  })

  it('should handle localStorage setItem errors gracefully', () => {
    // Mock console.warn to verify error handling
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Override localStorage.setItem to throw
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded')
    })
    
    const { result } = renderHook(() => usePersistentTheme())
    
    // Try to set theme
    act(() => {
      result.current[1]('valorant')
    })
    
    // State should still update even if localStorage fails
    expect(result.current[0]).toBe('valorant')
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save theme to localStorage:',
      expect.any(Error)
    )
    
    // Cleanup
    localStorage.setItem = originalSetItem
    consoleSpy.mockRestore()
  })

  it('should return tuple with theme and setter function', () => {
    const { result } = renderHook(() => usePersistentTheme())
    
    expect(result.current).toHaveLength(2)
    expect(typeof result.current[0]).toBe('string')
    expect(typeof result.current[1]).toBe('function')
  })
})
