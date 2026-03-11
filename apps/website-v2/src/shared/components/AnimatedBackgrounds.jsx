import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * Animated Grid Background
 * Based on Image 1 (grid platform) and Image 5 (digital grid)
 * Creates a perspective grid with animated lines
 */
export function AnimatedGridBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawGrid = () => {
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const gridSize = 50
      const perspective = 0.8

      // Vertical lines with perspective
      for (let i = -20; i <= 20; i++) {
        const x = centerX + i * gridSize
        const offset = Math.sin(time * 0.001 + i * 0.1) * 2

        ctx.beginPath()
        ctx.moveTo(x + offset, centerY)
        ctx.lineTo(x * perspective + centerX * (1 - perspective), canvas.height)
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 + Math.sin(time * 0.002 + i * 0.05) * 0.05})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Horizontal lines with perspective
      for (let i = 0; i < 15; i++) {
        const y = centerY + i * gridSize * 2
        const offset = Math.sin(time * 0.0015 + i * 0.1) * 3

        ctx.beginPath()
        ctx.moveTo(0, y + offset)
        ctx.lineTo(canvas.width, y + offset)
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.05 + i * 0.01})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Glowing intersection points
      for (let i = -10; i <= 10; i++) {
        for (let j = 0; j < 8; j++) {
          const x = centerX + i * gridSize * 2
          const y = centerY + j * gridSize * 2
          const glow = Math.sin(time * 0.003 + i * 0.2 + j * 0.3) * 0.5 + 0.5

          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 240, 255, ${glow * 0.3})`
          ctx.fill()
        }
      }

      time++
      animationId = requestAnimationFrame(drawGrid)
    }

    resize()
    window.addEventListener('resize', resize)
    drawGrid()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}

/**
 * Smoke/Void Background
 * Based on Image 4 (dark atmosphere)
 */
export function SmokeBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-void via-void-deep to-void" />
      
      {/* Animated smoke layers */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at ${50 + i * 20}% ${50 + i * 10}%, rgba(0, 240, 255, 0.03) 0%, transparent 50%)`,
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Particle dots */}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-signal-cyan"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.3,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  )
}
