import React, { useEffect, useRef, useState, useCallback } from 'react';
import './HarmonicWaveViz.css';

/**
 * HarmonicWaveViz - Canvas wave interference patterns
 * 
 * Features:
 * - IBM Harmonic State style visualization
 * - Multiple wave sources with interference
 * - Real-time frequency modulation
 * - Interactive click-to-collapse
 * - 60fps animation
 */

const WAVE_COLORS = {
  cyan: { primary: '#00f0ff', secondary: 'rgba(0, 240, 255, 0.3)', glow: 'rgba(0, 240, 255, 0.5)' },
  gold: { primary: '#c9b037', secondary: 'rgba(201, 176, 55, 0.3)', glow: 'rgba(201, 176, 55, 0.5)' },
  red: { primary: '#ff6b6b', secondary: 'rgba(255, 107, 107, 0.3)', glow: 'rgba(255, 107, 107, 0.5)' },
  green: { primary: '#10b981', secondary: 'rgba(16, 185, 129, 0.3)', glow: 'rgba(16, 185, 129, 0.5)' },
};

const DEFAULT_WAVES = [
  { id: 1, frequency: 0.02, amplitude: 50, phase: 0, speed: 0.05, color: 'cyan', y: 0.5 },
  { id: 2, frequency: 0.03, amplitude: 40, phase: Math.PI / 2, speed: 0.03, color: 'gold', y: 0.5 },
  { id: 3, frequency: 0.015, amplitude: 60, phase: Math.PI, speed: 0.04, color: 'red', y: 0.5 },
];

function HarmonicWaveViz({
  width = 800,
  height = 300,
  waves = DEFAULT_WAVES,
  showInterference = true,
  showGrid = true,
  className = '',
  onWaveClick,
  interactive = true,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [waveParams, setWaveParams] = useState(waves);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Wave calculation functions
  const calculateWave = useCallback((x, wave, t) => {
    const adjustedY = wave.y * height;
    const k = 2 * Math.PI * wave.frequency;
    const omega = wave.speed;
    return adjustedY + wave.amplitude * Math.sin(k * x + omega * t + wave.phase);
  }, [height]);

  const calculateInterference = useCallback((x, t) => {
    let sumY = height / 2;
    waveParams.forEach(wave => {
      sumY += wave.amplitude * Math.sin(2 * Math.PI * wave.frequency * x + wave.speed * t + wave.phase);
    });
    return sumY / waveParams.length + height / 4;
  }, [waveParams, height]);

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size for retina displays
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    if (showGrid) {
      drawGrid(ctx, width, height);
    }
    
    // Draw individual waves
    waveParams.forEach(wave => {
      drawWave(ctx, wave, time, width);
    });
    
    // Draw interference pattern
    if (showInterference && waveParams.length > 1) {
      drawInterferenceWave(ctx, time, width);
    }
    
    // Draw hover point
    if (hoverPoint && interactive) {
      drawHoverPoint(ctx, hoverPoint);
    }
    
    // Draw clicked point ripple
    if (clickedPoint) {
      drawRipple(ctx, clickedPoint);
    }
    
    // Draw harmonic nodes
    drawHarmonicNodes(ctx, time, width, height);
    
  }, [width, height, waveParams, time, showGrid, showInterference, hoverPoint, clickedPoint, interactive, calculateWave, calculateInterference]);

  const drawGrid = (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= h; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Center line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  };

  const drawWave = (ctx, wave, t, w) => {
    const colors = WAVE_COLORS[wave.color];
    
    ctx.beginPath();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    
    // Draw wave path
    for (let x = 0; x <= w; x += 2) {
      const y = calculateWave(x, wave, t);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw glow effect
    ctx.beginPath();
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 8;
    ctx.filter = 'blur(4px)';
    for (let x = 0; x <= w; x += 2) {
      const y = calculateWave(x, wave, t);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.filter = 'none';
  };

  const drawInterferenceWave = (ctx, t, w) => {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    
    // Create gradient for interference
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(201, 176, 55, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.8)');
    ctx.strokeStyle = gradient;
    
    for (let x = 0; x <= w; x += 2) {
      const y = calculateInterference(x, t);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Glow
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 12;
    ctx.filter = 'blur(8px)';
    for (let x = 0; x <= w; x += 2) {
      const y = calculateInterference(x, t);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.filter = 'none';
  };

  const drawHarmonicNodes = (ctx, t, w, h) => {
    const nodeCount = 5;
    const nodeSpacing = w / (nodeCount + 1);
    
    for (let i = 1; i <= nodeCount; i++) {
      const x = i * nodeSpacing;
      const nodeY = h / 2 + Math.sin(t * 0.1 + i) * 20;
      
      // Node circle
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.arc(x, nodeY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Node glow
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.arc(x, nodeY, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Connection to interference wave
      const interferenceY = calculateInterference(x, t);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.moveTo(x, nodeY);
      ctx.lineTo(x, interferenceY);
      ctx.stroke();
    }
  };

  const drawHoverPoint = (ctx, point) => {
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    
    // Value tooltip
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(point.x + 15, point.y - 25, 80, 24);
    ctx.fillStyle = '#00f0ff';
    ctx.font = '12px JetBrains Mono';
    ctx.fillText(`y: ${point.y.toFixed(1)}`, point.x + 20, point.y - 10);
  };

  const drawRipple = (ctx, point) => {
    const elapsed = Date.now() - point.time;
    const maxRadius = 100;
    const progress = Math.min(elapsed / 1000, 1);
    const radius = progress * maxRadius;
    const opacity = 1 - progress;
    
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
    ctx.lineWidth = 2;
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner ripple
    if (progress < 0.5) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(201, 176, 55, ${opacity * 0.7})`;
      ctx.arc(point.x, point.y, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying || reducedMotion) return;
    
    let lastTime = performance.now();
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      setTime(prev => prev + deltaTime * 0.05);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, reducedMotion]);

  // Draw on each frame
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle canvas interactions
  const handleMouseMove = (e) => {
    if (!interactive) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const y = (e.clientY - rect.top) * (height / rect.height);
    
    // Find closest point on interference wave
    const waveY = calculateInterference(x, time);
    
    if (Math.abs(y - waveY) < 30) {
      setHoverPoint({ x, y: waveY });
    } else {
      setHoverPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  const handleClick = (e) => {
    if (!interactive) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const y = calculateInterference(x, time);
    
    setClickedPoint({ x, y, time: Date.now() });
    onWaveClick?.({ x, y, timestamp: Date.now() });
    
    // Clear clicked point after animation
    setTimeout(() => setClickedPoint(null), 1000);
  };

  // Update wave parameter
  const updateWaveParam = (waveId, param, value) => {
    setWaveParams(prev => prev.map(wave => 
      wave.id === waveId ? { ...wave, [param]: parseFloat(value) } : wave
    ));
  };

  return (
    <div className={`harmonic-wave-viz ${className}`}>
      {/* Canvas */}
      <div className="wave-canvas-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="wave-canvas"
          style={{ width: `${width}px`, height: `${height}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        
        {/* Overlay Info */}
        <div className="wave-overlay">
          <div className="wave-stats">
            <span className="stat-item">
              <span className="stat-label">Freq</span>
              <span className="stat-value">{(waveParams[0].frequency * 100).toFixed(1)}Hz</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Phase</span>
              <span className="stat-value">{(time % 360).toFixed(0)}°</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Amp</span>
              <span className="stat-value">{waveParams[0].amplitude}px</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="wave-controls">
        <div className="control-row">
          <button 
            className={`play-pause-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="wave-toggles">
            {waveParams.map(wave => (
              <button
                key={wave.id}
                className="wave-toggle-btn"
                style={{ '--wave-color': WAVE_COLORS[wave.color].primary }}
                onClick={() => updateWaveParam(wave.id, 'amplitude', wave.amplitude > 0 ? 0 : 50)}
              >
                <span className="wave-indicator" />
                Wave {wave.id}
              </button>
            ))}
          </div>
        </div>
        
        {/* Frequency Sliders */}
        <div className="frequency-sliders">
          {waveParams.map(wave => (
            <div key={wave.id} className="slider-group">
              <label style={{ color: WAVE_COLORS[wave.color].primary }}>
                F{wave.id}
              </label>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.001"
                value={wave.frequency}
                onChange={(e) => updateWaveParam(wave.id, 'frequency', e.target.value)}
                className="freq-slider"
                style={{ '--slider-color': WAVE_COLORS[wave.color].primary }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="wave-legend">
        <div className="legend-item">
          <span className="legend-line cyan" />
          <span>Primary Wave</span>
        </div>
        <div className="legend-item">
          <span className="legend-line gold" />
          <span>Secondary Wave</span>
        </div>
        <div className="legend-item">
          <span className="legend-line interference" />
          <span>Interference</span>
        </div>
      </div>
    </div>
  );
}

export default HarmonicWaveViz;
