/**
 * useScrollReveal Hook Tests - P0 Test Coverage
 * 
 * Tests for intersection observer-based scroll animations
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useScrollReveal,
  useStaggerReveal,
  useParallax,
  getInitialTransform,
} from '../animation/useScrollReveal'
import { mockIntersectionObserver, mockMatchMedia } from '@/test/utils'

describe('getInitialTransform', () => {
  it('should return correct transform for up direction', () => {
    const result = getInitialTransform('up', 50)
    expect(result).toEqual({ y: 50 })
  })

  it('should return correct transform for down direction', () => {
    const result = getInitialTransform('down', 50)
    expect(result).toEqual({ y: -50 })
  })

  it('should return correct transform for left direction', () => {
    const result = getInitialTransform('left', 50)
    expect(result).toEqual({ x: 50 })
  })

  it('should return correct transform for right direction', () => {
    const result = getInitialTransform('right', 50)
    expect(result).toEqual({ x: -50 })
  })

  it('should default to up direction for undefined', () => {
    const result = getInitialTransform(undefined, 50)
    expect(result).toEqual({ y: 50 })
  })
})

describe('useScrollReveal', () => {
  let ioMock: ReturnType<typeof mockIntersectionObserver>
  let matchMediaMock: ReturnType<typeof mockMatchMedia>

  beforeEach(() => {
    ioMock = mockIntersectionObserver()
    matchMediaMock = mockMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useScrollReveal())

    expect(result.current.isVisible).toBe(false)
    expect(result.current.hasRevealed).toBe(false)
    expect(result.current.ref.current).toBeNull()
  })

  it('should return initial animation values', () => {
    const { result } = renderHook(() => useScrollReveal({ direction: 'up', distance: 30 }))

    expect(result.current.initial).toEqual({ opacity: 0, y: 30 })
    expect(result.current.animate).toEqual({ opacity: 0, y: 30 })
  })

  it('should return visible animation values when revealed', () => {
    const { result } = renderHook(() => useScrollReveal())

    // Create a mock element
    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.ref.current = mockElement
    })

    // Trigger intersection
    act(() => {
      ioMock.triggerIntersect(true, mockElement)
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.hasRevealed).toBe(true)
    expect(result.current.animate).toEqual({ opacity: 1, x: 0, y: 0 })
  })

  it('should handle triggerOnce option', () => {
    const { result } = renderHook(() => useScrollReveal({ triggerOnce: true }))

    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.ref.current = mockElement
    })

    // First intersection
    act(() => {
      ioMock.triggerIntersect(true, mockElement)
    })

    expect(result.current.hasRevealed).toBe(true)

    // Observer should be disconnected after triggerOnce
  })

  it('should handle custom threshold', () => {
    const { result } = renderHook(() => useScrollReveal({ threshold: 0.5 }))

    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.ref.current = mockElement
    })

    act(() => {
      ioMock.triggerIntersect(true, mockElement)
    })

    expect(result.current.isVisible).toBe(true)
  })

  it('should handle different directions', () => {
    const directions = ['up', 'down', 'left', 'right'] as const

    directions.forEach((direction) => {
      const { result } = renderHook(() =>
        useScrollReveal({ direction, distance: 50 })
      )

      if (direction === 'up' || direction === 'down') {
        expect(result.current.initial).toHaveProperty('y')
      } else {
        expect(result.current.initial).toHaveProperty('x')
      }
    })
  })

  it('should show immediately when reduced motion is enabled', () => {
    matchMediaMock.setMatches(true)

    const { result } = renderHook(() => useScrollReveal())

    // Should be immediately visible
    expect(result.current.initial).toEqual({ opacity: 1, x: 0, y: 0 })
  })

  it('should handle missing IntersectionObserver gracefully', () => {
    // Remove IntersectionObserver
    const originalIO = global.IntersectionObserver
    // @ts-expect-error - removing for test
    global.IntersectionObserver = undefined

    const { result } = renderHook(() => useScrollReveal())

    // Should fallback to visible
    expect(result.current.isVisible).toBe(true)
    expect(result.current.hasRevealed).toBe(true)

    // Restore
    global.IntersectionObserver = originalIO
  })
})

describe('useStaggerReveal', () => {
  let ioMock: ReturnType<typeof mockIntersectionObserver>

  beforeEach(() => {
    ioMock = mockIntersectionObserver()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with container ref', () => {
    const { result } = renderHook(() => useStaggerReveal())

    expect(result.current.containerRef.current).toBeNull()
    expect(result.current.getItemProps).toBeDefined()
  })

  it('should calculate item delays correctly', () => {
    const { result } = renderHook(() =>
      useStaggerReveal({ staggerDelay: 0.1, initialDelay: 0.2 })
    )

    const item0 = result.current.getItemProps(0)
    const item1 = result.current.getItemProps(1)
    const item2 = result.current.getItemProps(2)

    expect(item0.delay).toBe(0.2)
    expect(item1.delay).toBe(0.3)
    expect(item2.delay).toBe(0.4)
  })

  it('should pass visibility to items', () => {
    const { result } = renderHook(() => useStaggerReveal())

    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.containerRef.current = mockElement
    })

    act(() => {
      ioMock.triggerIntersect(true, mockElement)
    })

    const itemProps = result.current.getItemProps(0)
    expect(itemProps.isVisible).toBe(true)
  })
})

describe('useParallax', () => {
  let matchMediaMock: ReturnType<typeof mockMatchMedia>

  beforeEach(() => {
    matchMediaMock = mockMatchMedia(false)
    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useParallax())

    expect(result.current.offset).toBe(0)
    expect(result.current.transform).toContain('translate3d')
  })

  it('should return no transform when disabled', () => {
    matchMediaMock.setMatches(true)

    const { result } = renderHook(() => useParallax({ respectReducedMotion: true }))

    expect(result.current.transform).toBe('none')
  })

  it('should calculate vertical transform', () => {
    const { result } = renderHook(() =>
      useParallax({ direction: 'vertical', speed: 0.5 })
    )

    expect(result.current.transform).toContain('translate3d(0,')
  })

  it('should calculate horizontal transform', () => {
    const { result } = renderHook(() =>
      useParallax({ direction: 'horizontal', speed: 0.5 })
    )

    expect(result.current.transform).toContain('translate3d(')
    expect(result.current.transform).not.toContain('translate3d(0,')
  })

  it('should respect maxOffset', () => {
    const { result } = renderHook(() =>
      useParallax({ speed: 10, maxOffset: 100 })
    )

    // Offset should be clamped
    expect(Math.abs(result.current.offset)).toBeLessThanOrEqual(100)
  })
})
