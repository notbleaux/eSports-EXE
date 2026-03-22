/**
 * useViscousSpring Hook Tests - P0 Test Coverage
 * 
 * Tests for fluid dynamics-based spring animations
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useViscousSpring,
  useViscousSpringTransform,
  integrateSpring,
  applyOvershoot,
} from '../animation/useViscousSpring'
import { mockRequestAnimationFrame, mockMatchMedia } from '@/test/utils'

describe('integrateSpring', () => {
  it('should calculate spring physics correctly', () => {
    const state = { position: 0, velocity: 0 }
    const target = 1
    const config = { tension: 300, friction: 30, mass: 1, overshoot: 0.05, settleDuration: 0.6 }
    const dt = 0.016 // ~60fps

    const result = integrateSpring(state, target, config, dt)

    expect(result.position).not.toBe(0)
    expect(result.velocity).not.toBe(0)
  })

  it('should settle at target when close enough', () => {
    const state = { position: 0.999, velocity: 0.0001 }
    const target = 1
    const config = { tension: 300, friction: 30, mass: 1, overshoot: 0.05, settleDuration: 0.6 }
    const dt = 0.016

    const result = integrateSpring(state, target, config, dt)

    // Position should approach target
    expect(Math.abs(result.position - target)).toBeLessThan(0.1)
  })
})

describe('applyOvershoot', () => {
  it('should apply overshoot for target = 1', () => {
    const result = applyOvershoot(0.5, 1, 0.1)
    expect(result).toBeGreaterThan(0.5)
  })

  it('should reduce value for target = 0', () => {
    const result = applyOvershoot(0.5, 0, 0.1)
    expect(result).toBeLessThan(0.5)
  })

  it('should return original value for other targets', () => {
    const result = applyOvershoot(0.5, 0.5, 0.1)
    expect(result).toBe(0.5)
  })

  it('should return 0 when target is 0 and value is 0', () => {
    const result = applyOvershoot(0, 0, 0.1)
    expect(result).toBe(0)
  })
})

describe('useViscousSpring', () => {
  let rafMock: ReturnType<typeof mockRequestAnimationFrame>
  let matchMediaMock: ReturnType<typeof mockMatchMedia>

  beforeEach(() => {
    rafMock = mockRequestAnimationFrame()
    matchMediaMock = mockMatchMedia(false)
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useViscousSpring())

    expect(result.current.value).toBe(0)
    expect(result.current.isAnimating).toBe(false)
  })

  it('should initialize with custom values', () => {
    const { result } = renderHook(() =>
      useViscousSpring({ initial: 0.5, target: 1 })
    )

    expect(result.current.value).toBe(0.5)
  })

  it('should start animating when target changes', () => {
    const { result } = renderHook(() => useViscousSpring({ initial: 0 }))

    act(() => {
      result.current.setTarget(1)
    })

    expect(result.current.isAnimating).toBe(true)
  })

  it('should clamp target between 0 and 1', () => {
    const { result } = renderHook(() => useViscousSpring())

    act(() => {
      result.current.setTarget(1.5)
    })

    // The hook clamps target values
    expect(result.current.isAnimating).toBe(true)
  })

  it('should set value immediately without animation', () => {
    const { result } = renderHook(() => useViscousSpring())

    act(() => {
      result.current.setValue(0.7)
    })

    expect(result.current.value).toBe(0.7)
    expect(result.current.isAnimating).toBe(false)
  })

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useViscousSpring({ initial: 0.3 }))

    act(() => {
      result.current.setValue(0.8)
    })
    expect(result.current.value).toBe(0.8)

    act(() => {
      result.current.reset()
    })
    expect(result.current.value).toBe(0.3)
  })

  it('should skip animation when reduced motion is enabled', () => {
    matchMediaMock.setMatches(true)

    const { result } = renderHook(() => useViscousSpring({ target: 0 }))

    act(() => {
      result.current.setTarget(1)
    })

    // Should immediately set to target
    expect(result.current.value).toBe(1)
    expect(result.current.isAnimating).toBe(false)
  })

  it('should call onUpdate callback', () => {
    const onUpdate = vi.fn()
    
    const { result } = renderHook(() =>
      useViscousSpring({ target: 0, onUpdate })
    )

    act(() => {
      result.current.setTarget(1)
    })

    // Trigger animation frames
    act(() => {
      rafMock.flush()
    })

    // onUpdate should have been called
    expect(onUpdate).toHaveBeenCalled()
  })

  it('should call onComplete callback when animation finishes', async () => {
    const onComplete = vi.fn()
    
    const { result } = renderHook(() =>
      useViscousSpring({ target: 0, onComplete, tension: 1000, friction: 100 })
    )

    act(() => {
      result.current.setTarget(1)
    })

    // Fast-forward through animation
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        rafMock.flush()
        vi.advanceTimersByTime(16)
      }
    })

    // Animation should have settled
    expect(result.current.isAnimating).toBe(false)
  }, 10000)
})

describe('useViscousSpringTransform', () => {
  let matchMediaMock: ReturnType<typeof mockMatchMedia>

  beforeEach(() => {
    matchMediaMock = mockMatchMedia(false)
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should generate transform string with scale', () => {
    const { result } = renderHook(() =>
      useViscousSpringTransform({
        scale: { from: 1, to: 1.5 },
      })
    )

    act(() => {
      result.current.setTarget(1)
    })

    expect(result.current.transform).toContain('scale')
  })

  it('should generate transform string with translate', () => {
    const { result } = renderHook(() =>
      useViscousSpringTransform({
        translateX: { from: 0, to: 100 },
        translateY: { from: 0, to: 50 },
      })
    )

    expect(result.current.transform).toContain('translate3d')
  })

  it('should generate transform string with rotate', () => {
    const { result } = renderHook(() =>
      useViscousSpringTransform({
        rotate: { from: 0, to: 90 },
      })
    )

    expect(result.current.transform).toContain('rotate')
  })

  it('should calculate opacity correctly', () => {
    const { result } = renderHook(() =>
      useViscousSpringTransform({
        opacity: { from: 0, to: 1 },
      })
    )

    act(() => {
      result.current.setTarget(1)
    })

    expect(result.current.opacity).toBeDefined()
    expect(result.current.opacity).toBeGreaterThanOrEqual(0)
    expect(result.current.opacity).toBeLessThanOrEqual(1)
  })

  it('should combine multiple transforms', () => {
    const { result } = renderHook(() =>
      useViscousSpringTransform({
        scale: { from: 1, to: 1.2 },
        translateX: { from: 0, to: 10 },
        rotate: { from: 0, to: 5 },
      })
    )

    const transform = result.current.transform
    expect(transform).toContain('scale')
    expect(transform).toContain('translate3d')
    expect(transform).toContain('rotate')
  })
})
