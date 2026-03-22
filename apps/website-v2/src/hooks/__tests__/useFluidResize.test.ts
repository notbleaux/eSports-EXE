/**
 * useFluidResize Hook Tests - P0 Test Coverage
 * 
 * Tests for RAF-throttled ResizeObserver
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useFluidResize,
  useResponsive,
  useAspectRatio,
  throttleWithRAF,
} from '../animation/useFluidResize'
import { mockResizeObserver, mockRequestAnimationFrame } from '@/test/utils'

describe('throttleWithRAF', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should throttle function calls', () => {
    const fn = vi.fn()
    const { throttled } = throttleWithRAF(fn, 16)

    // Call multiple times rapidly
    throttled()
    throttled()
    throttled()

    // Should not be called immediately
    expect(fn).not.toHaveBeenCalled()

    // Fast-forward
    act(() => {
      vi.advanceTimersByTime(16)
    })

    // Should have been called at least once
    expect(fn).toHaveBeenCalled()
  })

  it('should support cancel', () => {
    const fn = vi.fn()
    const { throttled, cancel } = throttleWithRAF(fn, 16)

    throttled()
    cancel()

    act(() => {
      vi.advanceTimersByTime(32)
    })

    // Should not be called after cancel
    expect(fn).not.toHaveBeenCalled()
  })

  it('should call on leading edge when configured', () => {
    const fn = vi.fn()
    const { throttled } = throttleWithRAF(fn, 16, { leading: true, trailing: false })

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('useFluidResize', () => {
  let roMock: ReturnType<typeof mockResizeObserver>

  beforeEach(() => {
    roMock = mockResizeObserver()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should initialize with zero size', () => {
    const { result } = renderHook(() => useFluidResize())

    expect(result.current.width).toBe(0)
    expect(result.current.height).toBe(0)
    expect(result.current.isResizing).toBe(false)
  })

  it('should update size when element resizes', () => {
    const { result } = renderHook(() => useFluidResize())

    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.ref.current = mockElement
    })

    const contentRect = { width: 100, height: 200 } as DOMRectReadOnly
    act(() => {
      roMock.triggerResize(contentRect, mockElement)
    })

    expect(result.current.width).toBe(100)
    expect(result.current.height).toBe(200)
    expect(result.current.isResizing).toBe(true)
  })

  it('should track previous size', () => {
    const { result } = renderHook(() => useFluidResize())

    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.ref.current = mockElement
    })

    // First resize
    act(() => {
      roMock.triggerResize({ width: 100, height: 200 } as DOMRectReadOnly, mockElement)
    })

    // Second resize
    act(() => {
      roMock.triggerResize({ width: 150, height: 250 } as DOMRectReadOnly, mockElement)
    })

    expect(result.current.previousSize).toEqual({ width: 100, height: 200 })
  })

  it('should clear isResizing after delay', async () => {
    const { result } = renderHook(() => useFluidResize())

    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.ref.current = mockElement
    })

    act(() => {
      roMock.triggerResize({ width: 100, height: 200 } as DOMRectReadOnly, mockElement)
    })

    expect(result.current.isResizing).toBe(true)

    // Wait for resize timeout
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isResizing).toBe(false)
  })

  it('should not update if size has not changed', () => {
    const { result } = renderHook(() => useFluidResize())

    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.ref.current = mockElement
    })

    // First resize
    act(() => {
      roMock.triggerResize({ width: 100, height: 200 } as DOMRectReadOnly, mockElement)
    })

    const updateCount = vi.fn()
    const originalSetState = result.current

    // Same size again
    act(() => {
      roMock.triggerResize({ width: 100, height: 200 } as DOMRectReadOnly, mockElement)
    })

    // Size should remain the same
    expect(result.current.width).toBe(100)
    expect(result.current.height).toBe(200)
  })
})

describe('useResponsive', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should identify correct breakpoint', () => {
    const { result } = renderHook(() =>
      useResponsive({
        mobile: 0,
        tablet: 768,
        desktop: 1024,
      })
    )

    const mockElement = document.createElement('div')
    act(() => {
      // @ts-expect-error - setting ref manually for test
      result.current.ref.current = mockElement
    })

    // Simulate desktop width
    Object.defineProperty(mockElement, 'getBoundingClientRect', {
      value: () => ({ width: 1200, height: 800 }),
    })

    window.dispatchEvent(new Event('resize'))

    // currentBreakpoint should be 'desktop' when width >= 1024
  })

  it('should create boolean flags for each breakpoint', () => {
    const { result } = renderHook(() =>
      useResponsive({
        mobile: 0,
        tablet: 768,
        desktop: 1024,
      })
    )

    expect(result.current).toHaveProperty('isMobile')
    expect(result.current).toHaveProperty('isTablet')
    expect(result.current).toHaveProperty('isDesktop')
  })

  it('should pass through fluid resize state', () => {
    const { result } = renderHook(() => useResponsive({ mobile: 0 }))

    expect(result.current).toHaveProperty('width')
    expect(result.current).toHaveProperty('height')
    expect(result.current).toHaveProperty('isResizing')
  })
})

describe('useAspectRatio', () => {
  it('should calculate aspect ratio styles', () => {
    const { result } = renderHook(() => useAspectRatio(16 / 9))

    expect(result.current.wrapperStyle).toHaveProperty('position', 'relative')
    expect(result.current.wrapperStyle).toHaveProperty('paddingBottom')
    expect(result.current.contentStyle).toHaveProperty('position', 'absolute')
  })

  it('should calculate correct padding percentage', () => {
    const { result } = renderHook(() => useAspectRatio(16 / 9))

    // 9/16 = 0.5625 = 56.25%
    expect(result.current.wrapperStyle.paddingBottom).toBe('56.25%')
  })

  it('should calculate actual ratio', () => {
    const { result } = renderHook(() => useAspectRatio(16 / 9))

    // Default to target ratio when no size available
    expect(result.current.actualRatio).toBe(16 / 9)
  })

  it('should support different aspect ratios', () => {
    const { result: square } = renderHook(() => useAspectRatio(1))
    expect(square.current.wrapperStyle.paddingBottom).toBe('100%')

    const { result: widescreen } = renderHook(() => useAspectRatio(21 / 9))
    expect(widescreen.current.wrapperStyle.paddingBottom).toBe('42.857142857142854%')
  })
})
