/**
 * NJZ Platform v2 - useAbyssalGradient Hook
 * Animated gradient background with abyssal theme
 * 
 * @version 2.0.0
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Default abyssal gradient colors
 */
const abyssalColors = {
  void: '#0a0a0f',
  deep: '#12121a',
  mid: '#1a1a24',
  cyan: '#00f0ff',
  cyanDim: 'rgba(0, 240, 255, 0.3)',
  amber: '#ff9f1c',
  gold: '#c9b037',
};

/**
 * Gradient presets for different moods
 */
export const gradientPresets = {
  // Deep ocean abyss
  abyss: [
    abyssalColors.void,
    abyssalColors.deep,
    abyssalColors.mid,
    abyssalColors.cyanDim,
  ],
  // Cyan energy pulse
  signal: [
    abyssalColors.void,
    abyssalColors.deep,
    '#001a20',
    abyssalColors.cyanDim,
  ],
  // Amber warning state
  alert: [
    abyssalColors.void,
    '#1a1510',
    '#2a2015',
    'rgba(255, 159, 28, 0.2)',
  ],
  // Gold premium state
  premium: [
    abyssalColors.void,
    '#1a1810',
    '#252210',
    'rgba(201, 176, 55, 0.2)',
  ],
  // Void only - minimal
  void: [
    abyssalColors.void,
    abyssalColors.deep,
    abyssalColors.void,
  ],
};

/**
 * Hook for animated gradient background
 * @param {Object} options - Configuration options
 * @returns {Object} Ref and control functions
 * 
 * @example
 * const { ref, updateGradient, setPreset } = useAbyssalGradient({
 *   preset: 'abyss',
 *   speed: 0.5,
 * });
 */
export function useAbyssalGradient(options = {}) {
  const {
    preset = 'abyss',
    speed = 0.5,
    intensity = 1,
    animated = true,
  } = options;

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const colorsRef = useRef(gradientPresets[preset] || gradientPresets.abyss);

  // Convert hex to RGB
  const hexToRgb = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    }
    // Handle rgba strings
    const rgba = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(hex);
    if (rgba) {
      return {
        r: parseInt(rgba[1]),
        g: parseInt(rgba[2]),
        b: parseInt(rgba[3]),
        a: rgba[4] ? parseFloat(rgba[4]) : 1,
      };
    }
    return { r: 10, g: 10, b: 15 };
  }, []);

  // Noise function for organic movement
  const noise = useCallback((x, y, t) => {
    return Math.sin(x * 0.5 + t) * Math.cos(y * 0.5 + t * 0.7) * 
           Math.sin(x * 0.3 + y * 0.3 + t * 0.5);
  }, []);

  // Interpolate between colors
  const lerpColor = useCallback((color1, color2, t) => {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * t),
      g: Math.round(c1.g + (c2.g - c1.g) * t),
      b: Math.round(c1.b + (c2.b - c1.b) * t),
      a: (c1.a || 1) + ((c2.a || 1) - (c1.a || 1)) * t,
    };
  }, [hexToRgb]);

  // Render gradient frame
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const colors = colorsRef.current;

    // Create gradient based on time
    const gradient = ctx.createRadialGradient(
      width * (0.5 + Math.sin(timeRef.current * 0.3) * 0.3),
      height * (0.5 + Math.cos(timeRef.current * 0.2) * 0.3),
      0,
      width * 0.5,
      height * 0.5,
      width * 0.8
    );

    // Animate color stops
    colors.forEach((color, index) => {
      const offset = index / (colors.length - 1);
      const noiseVal = noise(offset * 5, 0, timeRef.current) * 0.1 * intensity;
      const adjustedOffset = Math.max(0, Math.min(1, offset + noiseVal));
      
      // Blend colors for smooth transition
      const colorIndex = Math.floor(adjustedOffset * (colors.length - 1));
      const nextColorIndex = Math.min(colorIndex + 1, colors.length - 1);
      const blend = (adjustedOffset * (colors.length - 1)) - colorIndex;
      
      const blended = lerpColor(colors[colorIndex], colors[nextColorIndex], blend);
      gradient.addColorStop(offset, `rgba(${blended.r}, ${blended.g}, ${blended.b}, ${blended.a || 1})`);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle noise texture
    if (intensity > 0.5) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noiseVal = (Math.random() - 0.5) * 5 * intensity;
        data[i] = Math.max(0, Math.min(255, data[i] + noiseVal));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noiseVal));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noiseVal));
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }, [noise, lerpColor, intensity]);

  // Animation loop
  useEffect(() => {
    if (!animated) {
      render();
      return;
    }

    let animationId;
    const animate = () => {
      timeRef.current += 0.01 * speed;
      render();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [animated, speed, render]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        render();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [render]);

  // Update gradient colors
  const updateGradient = useCallback((newColors) => {
    colorsRef.current = newColors;
    render();
  }, [render]);

  // Set preset
  const setPreset = useCallback((presetName) => {
    colorsRef.current = gradientPresets[presetName] || gradientPresets.abyss;
    render();
  }, [render]);

  return {
    ref: canvasRef,
    updateGradient,
    setPreset,
    colors: colorsRef.current,
  };
}

/**
 * Hook for CSS-based animated gradient
 * Less performant but simpler implementation
 * @param {Object} options - Configuration options
 * @returns {Object} Style object
 */
export function useCSSGradient(options = {}) {
  const { preset = 'abyss', duration = 10 } = options;
  const colors = gradientPresets[preset] || gradientPresets.abyss;

  return {
    background: `linear-gradient(135deg, ${colors.join(', ')})`,
    backgroundSize: '400% 400%',
    animation: `gradientShift ${duration}s ease infinite`,
  };
}

export default useAbyssalGradient;
