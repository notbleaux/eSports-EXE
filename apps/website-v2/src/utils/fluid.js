/**
 * Fluid, Dynamic, Adaptive UI Utilities
 * For eSports-EXE HUB improvements: container queries, scroll reveals, viscous SFX
 * [Ver001.000]
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useMotionValue, useSpring, animate, AnimatePresence } from 'framer-motion'
import { cn } from './cn.js' // Existing utility

// ========================================
// 1. Reduced Motion Detection (Adaptive)
// ========================================
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mediaQuery.matches)

    const handleChange = () => setReduced(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reduced
}

// ========================================
// 2. Fluid Resize Observer
// ========================================
export function useFluidResize(callback, deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return

    let rafId
    const observer = new ResizeObserver(entries => {
      rafId = requestAnimationFrame(() => callback(entries))
    })

    observer.observe(ref.current)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      observer.disconnect()
    }
import { motion, AnimatePresence } from 'framer-motion';

  return ref
}

// ========================================
// 3. Container Query Hook (Fluid Layouts)
// ========================================
export function useContainerQuery(queries = {}) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const ref = useFluidResize(([entry]) => {
    const rect = entry.contentRect
    setContainerSize({ width: rect.width, height: rect.height })
  })

  const matches = {}
  Object.entries(queries).forEach(([key, breakpoint]) => {
    matches[key] = containerSize.width >= breakpoint
  })

  return { ref, size: containerSize, matches }
}

// ========================================
// 4. Scroll Reveal (Dynamic)
// ========================================
export function useScrollReveal(
  variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  }
) {
  const ref = useRef(null)
  const controls = useMotionValue(0)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.set(1)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, animate: useSpring(controls, { stiffness: 100, damping: 20 }) }
}

// ========================================
// 5. Viscous SFX (4NJZ4 Fluid Smoke Easing)
// ========================================
export const viscousEase = t => {
  // WebGL-fluid inspired easing: overshoot + settle
  return Math.min(1.1 * t * (2 - t), 1)
}

export function useViscousSFX(target, config = { stiffness: 200, damping: 30 }) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, config)

  const animateViscous = useCallback(
    value => {
      animate(motionValue, value, {
        type: 'spring',
        ...config,
        ease: viscousEase
      })
    },
    [motionValue, config]
  )

  return { spring, animateViscous }
}

// ========================================
// 6. Clamp Utility (Fluid Typography)
// ========================================
export const clamp = (min, max, val) => Math.min(max, Math.max(min, val))
export const rem = px => `${px / 16}rem`

// Fluid font: clamp(min, max, viewport)
export const fluidFont = (min, max, vwMin, vwMax) => {
  const minVw = vwMin / 100
  const maxVw = vwMax / 100
  return `clamp(${rem(min)}, calc(${rem(min)} + (${vwMin} * (100vw - ${vwMin * 100}px) / (${vwMax - vwMin})), ${rem(max)})`
}

// ========================================
// 7. Lensing Panel (TENET Latin Square)
// ========================================
export function useLensingPanel(activeLayer = 0, maxLayers = 5) {
  const [layers, setLayers] = useState(Array(maxLayers).fill(false))

  const toggleLayer = index => {
    setLayers(layers.map((active, i) => (i === index ? !active : active)))
  }

  return { layers, toggleLayer, activeLayer }
}

// ========================================
// 8. NZ/J? Spinner (4NJZ4 Distinct)
// ========================================
export function useNZSpinner(isHover = false) {
  const rotation = useMotionValue(0)
  const scaleNZ = useMotionValue(1)
  const scaleJ = useMotionValue(1)

  useEffect(() => {
    if (isHover) {
      animate(rotation, 360, { duration: 2, ease: viscousEase, repeat: Infinity })
      animate(scaleNZ, [1, 1.2, 1], { duration: 3, repeat: Infinity })
    } else {
      rotation.set(0)
      scaleNZ.set(1)
    }
  }, [isHover])

  return { rotation, scaleNZ }
}

// ========================================
// 9. Parallax Hook (Dynamic BG)
// ========================================
export function useParallax(ref) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const parallaxStyle = {
    transform: `translateY(${scrollY * 0.5}px)`
  }

  return { scrollY, parallaxStyle }
}

// ========================================
// 10. Micro Ripple (Hover Interactions)
// ========================================
export function Ripple({ className = '' }) {
  const [ripples, setRipples] = useState([])

  const addRipple = e => {
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const ripple = { x, y, size, id: Date.now() }
    setRipples(prev => [...prev, ripple])

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id))
    }, 600)
  }

  return (
    <div className={cn('relative overflow-hidden', className)} onPointerDown={addRipple}>
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              scale: 1.5,
              opacity: 0
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Export all
export {
  useReducedMotion,
  useFluidResize,
  useContainerQuery,
  useScrollReveal,
  useViscousSFX,
  useLensingPanel,
  useNZSpinner,
  useParallax,
  Ripple,
  clamp,
  rem,
  fluidFont,
  viscousEase
}
