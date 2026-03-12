/**
 * FogOverlay Component
 * Animated fog of war effect for map visualization
 */
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../theme/colors.js';

// Purple theme colors (exact values)
const PURPLE = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

/**
 * FogOverlay - Renders an animated fog of war effect
 */
function FogOverlay({
  intensity = 0.6,
  color = PURPLE.base,
  animated = true,
  pattern = 'radial',
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Canvas-based animated fog effect
  useEffect(() => {
    if (!canvasRef.current || !animated) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Fog particles
    const particles = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 30 + Math.random() * 50,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: 0.1 + Math.random() * 0.2,
    }));

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create base fog gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );

      const rgba = hexToRgba(color, intensity * 0.3);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, rgba);
      gradient.addColorStop(1, hexToRgba(color, intensity * 0.6));

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated fog particles
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < -particle.radius) particle.x = canvas.width + particle.radius;
        if (particle.x > canvas.width + particle.radius) particle.x = -particle.radius;
        if (particle.y < -particle.radius) particle.y = canvas.height + particle.radius;
        if (particle.y > canvas.height + particle.radius) particle.y = -particle.radius;

        // Pulse effect
        const pulse = Math.sin(time + particle.x * 0.01) * 5;
        const currentRadius = particle.radius + pulse;

        const particleGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          currentRadius
        );

        particleGradient.addColorStop(0, hexToRgba(color, particle.opacity * intensity));
        particleGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw scanning lines
      const scanY = (time * 50) % (canvas.height + 100) - 50;
      const scanGradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGradient.addColorStop(0, 'transparent');
      scanGradient.addColorStop(0.5, hexToRgba(color, 0.2 * intensity));
      scanGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 20, canvas.width, 40);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [intensity, color, animated]);

  // Static CSS-based overlay for non-animated mode
  if (!animated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, ${hexToRgba(
            color,
            intensity * 0.5
          )} 100%)`,
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {/* Animated canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* CSS vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 20%, ${hexToRgba(
            color,
            intensity * 0.4
          )} 100%)`,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(${color} 1px, transparent 1px),
            linear-gradient(90deg, ${color} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${hexToRgba(color, 0.03)} 2px,
            ${hexToRgba(color, 0.03)} 4px
          )`,
        }}
      />
    </motion.div>
  );
}

// Helper function to convert hex to rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default FogOverlay;
