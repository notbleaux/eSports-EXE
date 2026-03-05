import React, { useEffect, useRef, useCallback, useState } from 'react';
import './LissajousComparator.css';

/**
 * LissajousComparator - Canvas Harmonic Curves
 * Based on Dale Pond's materiality concepts
 * 
 * Features:
 * - Harmonic Lissajous curves for dataset comparison
 * - Multiple frequency ratios for different data patterns
 * - Animated phase shifts showing temporal relationships
 * - Interactive parameter controls
 */

const PRESETS = [
  { name: 'Teams', a: 3, b: 2, delta: Math.PI / 4, color: '#ff9f1c' },
  { name: 'Matches', a: 5, b: 4, delta: Math.PI / 2, color: '#ff8c42' },
  { name: 'Players', a: 7, b: 5, delta: Math.PI / 3, color: '#ff7b59' },
  { name: 'Tournaments', a: 4, b: 3, delta: Math.PI / 6, color: '#ff6b6b' },
  { name: 'History', a: 6, b: 5, delta: Math.PI / 8, color: '#ff5e78' }
];

const LissajousComparator = ({ 
  width = 600, 
  height = 400,
  activeDatasets = [],
  onDatasetToggle
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  const drawCurve = useCallback((ctx, centerX, centerY, preset, phase, opacity = 1) => {
    const { a, b, delta, color } = preset;
    const scale = Math.min(width, height) * 0.35;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = opacity;
    
    // Draw Lissajous curve
    for (let t = 0; t <= Math.PI * 2; t += 0.01) {
      const x = centerX + scale * Math.sin(a * t + delta + phase);
      const y = centerY + scale * Math.sin(b * t + phase);
      
      if (t === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
    
    // Draw current point
    const t = phase % (Math.PI * 2);
    const pointX = centerX + scale * Math.sin(a * t + delta + phase);
    const pointY = centerY + scale * Math.sin(b * t + phase);
    
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
    ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Glow effect
    const gradient = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, 20);
    gradient.addColorStop(0, color + '80');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pointX, pointY, 20, 0, Math.PI * 2);
    ctx.fill();
  }, [width, height]);

  const drawGrid = useCallback((ctx) => {
    ctx.strokeStyle = 'rgba(255, 159, 28, 0.1)';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    
    const gridSize = 40;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Center crosshair
    ctx.strokeStyle = 'rgba(255, 159, 28, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [width, height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx);
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw all active curves
    if (activeDatasets.length === 0) {
      // Show all presets when no filter
      PRESETS.forEach((preset, index) => {
        const opacity = 0.3 + (index === selectedPreset ? 0.4 : 0);
        drawCurve(ctx, centerX, centerY, preset, phaseRef.current, opacity);
      });
    } else {
      // Show only active datasets
      PRESETS.forEach((preset, index) => {
        if (activeDatasets.includes(preset.name.toLowerCase())) {
          drawCurve(ctx, centerX, centerY, preset, phaseRef.current + index * 0.5, 1);
        }
      });
    }
    
    ctx.globalAlpha = 1;
  }, [drawCurve, drawGrid, activeDatasets, selectedPreset, width, height]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (isPlaying) {
        phaseRef.current += 0.02 * speed;
      }
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, isPlaying, speed]);

  return (
    <div className="lissajous-comparator">
      <div className="comparator-header">
        <div className="header-title">
          <span className="title-glyph">∿</span>
          <span className="title-text">HARMONIC COMPARATOR</span>
        </div>
        <div className="header-controls">
          <button 
            className={`control-btn ${isPlaying ? 'active' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <div className="speed-control">
            <span className="speed-label">SPEED</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="speed-slider"
            />
            <span className="speed-value">{speed.toFixed(1)}x</span>
          </div>
        </div>
      </div>
      
      <div className="comparator-canvas-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="comparator-canvas"
        />
        
        <div className="canvas-overlay">
          <div className="frequency-labels">
            <span className="freq-x">FREQ-A</span>
            <span className="freq-y">FREQ-B</span>
          </div>
        </div>
      </div>
      
      <div className="preset-selector">
        {PRESETS.map((preset, index) => (
          <button
            key={preset.name}
            className={`preset-btn ${selectedPreset === index ? 'active' : ''} ${
              activeDatasets.length === 0 || activeDatasets.includes(preset.name.toLowerCase()) ? '' : 'disabled'
            }`}
            onClick={() => setSelectedPreset(index)}
            style={{ '--preset-color': preset.color }}
          >
            <span className="preset-indicator" />
            <span className="preset-name">{preset.name}</span>
            <span className="preset-params">{a}/{b}</span>
          </button>
        ))}
      </div>
      
      <div className="comparator-footer">
        <div className="phase-indicator">
          <span className="phase-label">PHASE:</span>
          <span className="phase-value">
            {((phaseRef.current % (Math.PI * 2)) / Math.PI).toFixed(2)}π
          </span>
        </div>
        
        <div className="harmonic-info">
          <span className="info-glyph">◈</span>
          <span className="info-text">Lissajous curves reveal harmonic relationships between datasets</span>
        </div>
      </div>
    </div>
  );
};

export default LissajousComparator;
