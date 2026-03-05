import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EllipseLayerSystem.css';

/**
 * EllipseLayerSystem - 3 overlapping ellipses (Persona/Shadow/Animus)
 * 
 * Features:
 * - CSS mix-blend-mode for layer interactions
 * - Toggle switches for each Jungian archetype
 * - Real-time correlation calculation
 * - Fluid morphing animations between layers
 * - Glassmorphism depth levels
 */

const JUNGIAN_LAYERS = {
  persona: {
    id: 'persona',
    name: 'Persona',
    color: '#00f0ff',
    rgb: '0, 240, 255',
    blendMode: 'screen',
    description: 'Conscious identity layer - public-facing analytics',
    correlation: 87.3,
    angle: 0,
    rotationSpeed: 20,
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow',
    color: '#ff6b6b',
    rgb: '255, 107, 107',
    blendMode: 'multiply',
    description: 'Unconscious patterns - hidden risk factors',
    correlation: 64.2,
    angle: 60,
    rotationSpeed: -20,
  },
  animus: {
    id: 'animus',
    name: 'Animus',
    color: '#c9b037',
    rgb: '201, 176, 55',
    blendMode: 'overlay',
    description: 'Balancing principle - market harmony signals',
    correlation: 78.5,
    angle: 120,
    rotationSpeed: 25,
  },
};

const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'color-dodge', 'difference'];

function EllipseLayerSystem({ 
  onLayerChange,
  onCorrelationChange,
  className = '',
  showControls = true,
  showCorrelation = true,
  animated = true,
}) {
  const [activeLayers, setActiveLayers] = useState({
    persona: true,
    shadow: false,
    animus: true,
  });
  const [blendModes, setBlendModes] = useState({
    persona: 'screen',
    shadow: 'multiply',
    animus: 'overlay',
  });
  const [hoveredLayer, setHoveredLayer] = useState(null);
  const [morphProgress, setMorphProgress] = useState(0);
  const [isMorphing, setIsMorphing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Animate morphing on layer changes
  useEffect(() => {
    if (reducedMotion || !animated) {
      setMorphProgress(1);
      return;
    }

    setIsMorphing(true);
    setMorphProgress(0);
    
    const duration = 800;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth morph
      const eased = 1 - Math.pow(1 - progress, 3);
      setMorphProgress(eased);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsMorphing(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeLayers, animated, reducedMotion]);

  // Calculate correlation between active layers
  const calculateCorrelation = useCallback(() => {
    const activeKeys = Object.keys(activeLayers).filter(k => activeLayers[k]);
    if (activeKeys.length === 0) return 0;
    if (activeKeys.length === 1) return JUNGIAN_LAYERS[activeKeys[0]].correlation;
    
    const totalCorrelation = activeKeys.reduce((sum, key) => 
      sum + JUNGIAN_LAYERS[key].correlation, 0
    );
    const correlation = (totalCorrelation / activeKeys.length);
    
    // Apply blend mode modifiers
    const blendModifier = activeKeys.length * 5;
    return Math.min(correlation + blendModifier, 99.9);
  }, [activeLayers]);

  const correlation = calculateCorrelation();
  const activeCount = Object.values(activeLayers).filter(Boolean).length;

  // Notify parent of changes
  useEffect(() => {
    onLayerChange?.(activeLayers);
    onCorrelationChange?.(correlation);
  }, [activeLayers, correlation, onLayerChange, onCorrelationChange]);

  const toggleLayer = (layerId) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const cycleBlendMode = (layerId) => {
    const currentIndex = BLEND_MODES.indexOf(blendModes[layerId]);
    const nextIndex = (currentIndex + 1) % BLEND_MODES.length;
    setBlendModes(prev => ({
      ...prev,
      [layerId]: BLEND_MODES[nextIndex],
    }));
  };

  const getEllipseStyle = (layer) => {
    const isActive = activeLayers[layer.id];
    const baseAngle = layer.angle;
    const morphScale = 0.8 + (morphProgress * 0.2);
    const opacity = isActive ? (0.4 + morphProgress * 0.6) : 0;
    
    return {
      '--layer-color': layer.color,
      '--layer-rgb': layer.rgb,
      '--base-angle': `${baseAngle}deg`,
      '--morph-scale': morphScale,
      '--layer-opacity': opacity,
      mixBlendMode: blendModes[layer.id],
      transform: `rotate(${baseAngle}deg) scale(${isActive ? morphScale : 0.5})`,
      opacity: opacity,
      animation: (!reducedMotion && isActive && animated) 
        ? `ellipse-rotate-${layer.id === 'persona' ? '1' : layer.id === 'shadow' ? '2' : '3'} ${Math.abs(layer.rotationSpeed)}s linear infinite`
        : 'none',
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`ellipse-layer-system ${className} ${isMorphing ? 'morphing' : ''}`}
    >
      {/* Layer Controls */}
      {showControls && (
        <div className="ellipse-controls">
          <div className="controls-header">
            <span className="controls-label">Archetype Layers</span>
            <span className="active-count">{activeCount}/3 Active</span>
          </div>
          
          <div className="layer-toggles">
            {Object.values(JUNGIAN_LAYERS).map((layer) => (
              <div 
                key={layer.id}
                className={`layer-toggle ${activeLayers[layer.id] ? 'active' : ''}`}
                onMouseEnter={() => setHoveredLayer(layer.id)}
                onMouseLeave={() => setHoveredLayer(null)}
              >
                <button
                  className="toggle-button"
                  onClick={() => toggleLayer(layer.id)}
                  style={{ '--layer-color': layer.color }}
                >
                  <span 
                    className="toggle-indicator"
                    style={{ 
                      backgroundColor: activeLayers[layer.id] ? layer.color : 'transparent',
                      borderColor: layer.color,
                      boxShadow: activeLayers[layer.id] ? `0 0 10px ${layer.color}` : 'none',
                    }}
                  />
                  <span className="toggle-name" style={{ color: layer.color }}>
                    {layer.name}
                  </span>
                </button>
                
                <button 
                  className="blend-mode-badge"
                  onClick={() => cycleBlendMode(layer.id)}
                  style={{ color: layer.color }}
                  title="Click to cycle blend mode"
                >
                  {blendModes[layer.id]}
                </button>
              </div>
            ))}
          </div>
          
          {/* Correlation Display */}
          {showCorrelation && activeCount > 1 && (
            <div className="correlation-panel">
              <div className="correlation-header">
                <span className="correlation-label">Layer Correlation</span>
                <span className="correlation-value" style={{
                  color: correlation > 80 ? '#00f0ff' : correlation > 60 ? '#c9b037' : '#ff6b6b'
                }}>
                  {correlation.toFixed(1)}%
                </span>
              </div>
              <div className="correlation-bar">
                <div 
                  className="correlation-fill"
                  style={{ 
                    width: `${correlation}%`,
                    background: `linear-gradient(90deg, ${Object.values(JUNGIAN_LAYERS)
                      .filter(l => activeLayers[l.id])
                      .map(l => l.color)
                      .join(', ')})`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ellipse Visualization */}
      <div className="ellipse-container">
        <div className="ellipse-visualization">
          {/* Background glow effect */}
          <div className="ellipse-glow-background" />
          
          {/* Render ellipses in reverse order for proper z-index */}
          {Object.values(JUNGIAN_LAYERS).map((layer) => (
            <div
              key={layer.id}
              className={`ellipse-layer ${layer.id} ${activeLayers[layer.id] ? 'active' : ''} ${hoveredLayer === layer.id ? 'hovered' : ''}`}
              style={getEllipseStyle(layer)}
              onMouseEnter={() => setHoveredLayer(layer.id)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              {/* Inner gradient */}
              <div 
                className="ellipse-gradient"
                style={{
                  background: `linear-gradient(135deg, 
                    rgba(${layer.rgb}, 0.15) 0%, 
                    rgba(${layer.rgb}, 0.05) 50%, 
                    transparent 100%)`,
                }}
              />
              
              {/* Tooltip */}
              <div className={`ellipse-tooltip ${hoveredLayer === layer.id ? 'visible' : ''}`}>
                <span className="tooltip-name" style={{ color: layer.color }}>
                  {layer.name}
                </span>
                <span className="tooltip-desc">{layer.description}</span>
                <span className="tooltip-correlation">
                  Correlation: {layer.correlation}%
                </span>
              </div>
            </div>
          ))}
          
          {/* Center Data Display */}
          <div className="center-display">
            <div className="center-glow" />
            <div className="center-content">
              <span className="center-label">Harmonic State</span>
              <span className="center-value" style={{
                color: correlation > 80 ? '#00f0ff' : correlation > 60 ? '#c9b037' : '#ff6b6b'
              }}>
                {correlation.toFixed(1)}%
              </span>
              <div className="center-dots">
                {Object.values(JUNGIAN_LAYERS).map((layer) => (
                  activeLayers[layer.id] && (
                    <span 
                      key={layer.id}
                      className="center-dot"
                      style={{ 
                        backgroundColor: layer.color,
                        boxShadow: `0 0 8px ${layer.color}`,
                      }}
                    />
                  )
                ))}
              </div>
            </div>
          </div>
          
          {/* Intersection Points */}
          {activeCount >= 2 && (
            <div className="intersection-points">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="intersection-point"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    opacity: correlation / 100,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Blend Mode Legend */}
      <div className="blend-legend">
        {BLEND_MODES.slice(0, 4).map(mode => (
          <span key={mode} className="legend-item">{mode}</span>
        ))}
      </div>
    </div>
  );
}

export default EllipseLayerSystem;
