/**
 * Fluid, Dynamic, Adaptive UI Utilities
 * For eSports-EXE HUB improvements: container queries, scroll reveals, viscous SFX
 * [Ver001.000]
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, animate, AnimatePresence } from 'framer-motion'
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
  }, deps)

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
  const [isVisible, setIsVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!ref.current || reducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [reducedMotion])

  return { ref, isVisible, variants: reducedMotion ? {} : variants }
}

// ========================================
// 5. Ripple Effect Component
// ========================================
export function Ripple({ children, className }) {
  const [ripples, setRipples] = useState([])
  const reducedMotion = useReducedMotion()

  const handleClick = useCallback((e) => {
    if (reducedMotion) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)
  }, [reducedMotion])

  return (
    <motion.div 
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5
            }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

// ========================================
// 6. Viscous SFX (Micro-interactions)
// ========================================
export function useViscousSFX(stiffness = 100, damping = 15) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness, damping })
  const springY = useSpring(y, { stiffness, damping })

  const animateViscous = useCallback((targetX, targetY) => {
    x.set(targetX)
    y.set(targetY)
  }, [x, y])

  return { x: springX, y: springY, animateViscous }
}

// ========================================
// 7. Fluid Grid System
// ========================================
export function useFluidGrid(options = {}) {
  const {
    minItemWidth = 300,
    gap = 16,
    padding = 0
  } = options

  const [columns, setColumns] = useState(1)
  const containerRef = useFluidResize(([entry]) => {
    const width = entry.contentRect.width - padding * 2
    const cols = Math.floor((width + gap) / (minItemWidth + gap))
    setColumns(Math.max(1, cols))
  })

  return { ref: containerRef, columns, gap }
}

// ========================================
// 8. Adaptive Typography
// ========================================
export function useAdaptiveType(baseSize = 16) {
  const [fontSize, setFontSize] = useState(baseSize)
  const reducedMotion = useReducedMotion()
  
  const ref = useFluidResize(([entry]) => {
    const width = entry.contentRect.width
    // Scale font size based on container width
    const scale = Math.min(width / 1200, 1.5)
    setFontSize(baseSize * scale)
  })

  return { ref, fontSize: reducedMotion ? baseSize : fontSize }
}

// ========================================
// Export all utilities
// ========================================
export default {
  useReducedMotion,
  useFluidResize,
  useContainerQuery,
  useScrollReveal,
  Ripple,
  useViscousSFX,
  useFluidGrid,
  useAdaptiveType
}
