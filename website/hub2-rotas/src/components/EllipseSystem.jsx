import React, { useState, useEffect } from 'react';

// Jungian Archetype Layer definitions
const JUNGIAN_LAYERS = {
  persona: {
    name: 'Persona',
    color: '#00f0ff',
    blendMode: 'screen',
    description: 'Conscious identity layer - public-facing analytics',
    correlation: 87.3
  },
  shadow: {
    name: 'Shadow',
    color: '#ff6b6b',
    blendMode: 'multiply',
    description: 'Unconscious patterns - hidden risk factors',
    correlation: 64.2
  },
  animus: {
    name: 'Animus/Anima',
    color: '#c9b037',
    blendMode: 'overlay',
    description: 'Balancing principle - market harmony signals',
    correlation: 78.5
  }
};

function EllipseSystem({ activeLayer, jungianLayers = { persona: true, shadow: false, animus: false } }) {
  const [hoveredLayer, setHoveredLayer] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);
    
    // Check for mobile viewport
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Animate ellipses on mount
    if (!motionQuery.matches) {
      const duration = 1500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimationProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setAnimationProgress(1);
    }

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const getLayerInfo = () => {
    const layerMap = {
      base: { name: 'BASE Analytics', value: '87.3%' },
      talent: { name: 'Talent Layer', value: '92.1%' },
      market: { name: 'Market Layer', value: '78.5%' },
      risk: { name: 'Risk Layer', value: '64.2%' },
      sentiment: { name: 'Sentiment Layer', value: '81.7%' }
    };
    return layerMap[activeLayer] || layerMap.base;
  };

  // Calculate correlation between active Jungian layers
  const calculateCorrelation = () => {
    const activeLayers = Object.keys(jungianLayers).filter(k => jungianLayers[k]);
    if (activeLayers.length === 0) return 0;
    if (activeLayers.length === 1) return JUNGIAN_LAYERS[activeLayers[0]].correlation;
    
    // Calculate blended correlation
    const totalCorrelation = activeLayers.reduce((sum, key) => 
      sum + JUNGIAN_LAYERS[key].correlation, 0
    );
    return (totalCorrelation / activeLayers.length).toFixed(1);
  };

  const layerInfo = getLayerInfo();
  const opacity = reducedMotion ? 1 : (0.3 + (animationProgress * 0.7));
  const correlation = calculateCorrelation();
  const activeJungianCount = Object.values(jungianLayers).filter(Boolean).length;

  // Get glassmorphism depth style based on layer depth
  const getDepthStyle = (depthLevel) => {
    const isMobileReduced = isMobile && reducedMotion;
    
    switch(depthLevel) {
      case 'base':
        return {
          background: 'var(--njz-deep-space)',
          opacity: 1,
          backdropFilter: 'none'
        };
      case 'analytics':
        return {
          background: 'rgba(10, 10, 15, 0.7)',
          opacity: 0.7,
          backdropFilter: isMobileReduced ? 'blur(5px)' : 'blur(10px)'
        };
      case 'predictions':
        return {
          background: 'rgba(10, 10, 15, 0.4)',
          opacity: 0.4,
          backdropFilter: isMobileReduced ? 'blur(8px)' : 'blur(20px)'
        };
      default:
        return {};
    }
  };

  return (
    <div className={`ellipse-container ${isMobile ? 'mobile' : ''}`}>
      {/* Jungian Layer Blender Controls */}
      <div className="jungian-controls">
        <div className="jungian-label">Archetype Layers</div>
        <div className={`jungian-toggles ${isMobile ? 'vertical' : ''}`}>
          {Object.entries(JUNGIAN_LAYERS).map(([key, config]) => (
            <label key={key} className={`jungian-toggle ${jungianLayers[key] ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={jungianLayers[key] || false}
                onChange={() => {}}
                style={{ display: 'none' }}
              />
              <span 
                className="toggle-indicator"
                style={{ 
                  backgroundColor: jungianLayers[key] ? config.color : 'transparent',
                  borderColor: config.color 
                }}
              />
              <span className="toggle-label" style={{ color: config.color }}>
                {config.name}
              </span>
              <span className="blend-mode-badge" style={{ color: config.color }}>
                {config.blendMode}
              </span>
            </label>
          ))}
        </div>
        
        {/* Correlation Display */}
        {activeJungianCount > 1 && (
          <div className="correlation-display">
            <span className="correlation-label">Layer Correlation:</span>
            <span className="correlation-value">{correlation}%</span>
          </div>
        )}
      </div>

      {/* Ellipse Layers with Jungian Blending */}
      <div 
        className="ellipse-visualization"
        style={getDepthStyle('base')}
      >
        {/* Persona Layer */}
        {jungianLayers.persona && (
          <div 
            className={`ellipse jungian-layer persona ${activeLayer}`}
            style={{
              '--angle': '0deg',
              '--opacity': opacity,
              '--blend-mode': JUNGIAN_LAYERS.persona.blendMode,
              '--layer-color': JUNGIAN_LAYERS.persona.color,
              transform: reducedMotion 
                ? 'rotate(0deg) scale(1)' 
                : `rotate(0deg) scale(${0.8 + animationProgress * 0.2})`,
              mixBlendMode: JUNGIAN_LAYERS.persona.blendMode,
              animation: reducedMotion ? 'none' : 'rotate-slow 20s linear infinite'
            }}
            onMouseEnter={() => setHoveredLayer('persona')}
            onMouseLeave={() => setHoveredLayer(null)}
          >
            <div className={`layer-tooltip ${hoveredLayer === 'persona' ? 'visible' : ''}`}>
              <span>{JUNGIAN_LAYERS.persona.name}</span>
              <small>{JUNGIAN_LAYERS.persona.description}</small>
            </div>
          </div>
        )}
        
        {/* Shadow Layer */}
        {jungianLayers.shadow && (
          <div 
            className={`ellipse jungian-layer shadow ${activeLayer}`}
            style={{
              '--angle': '60deg',
              '--opacity': opacity,
              '--blend-mode': JUNGIAN_LAYERS.shadow.blendMode,
              '--layer-color': JUNGIAN_LAYERS.shadow.color,
              transform: reducedMotion 
                ? 'rotate(60deg) scale(1)' 
                : `rotate(60deg) scale(${0.8 + animationProgress * 0.2})`,
              mixBlendMode: JUNGIAN_LAYERS.shadow.blendMode,
              animation: reducedMotion ? 'none' : 'rotate-slow 20s linear infinite reverse'
            }}
            onMouseEnter={() => setHoveredLayer('shadow')}
            onMouseLeave={() => setHoveredLayer(null)}
          >
            <div className={`layer-tooltip ${hoveredLayer === 'shadow' ? 'visible' : ''}`}>
              <span>{JUNGIAN_LAYERS.shadow.name}</span>
              <small>{JUNGIAN_LAYERS.shadow.description}</small>
            </div>
          </div>
        )}
        
        {/* Animus Layer */}
        {jungianLayers.animus && (
          <div 
            className={`ellipse jungian-layer animus ${activeLayer}`}
            style={{
              '--angle': '120deg',
              '--opacity': opacity,
              '--blend-mode': JUNGIAN_LAYERS.animus.blendMode,
              '--layer-color': JUNGIAN_LAYERS.animus.color,
              transform: reducedMotion 
                ? 'rotate(120deg) scale(1)' 
                : `rotate(120deg) scale(${0.8 + animationProgress * 0.2})`,
              mixBlendMode: JUNGIAN_LAYERS.animus.blendMode,
              animation: reducedMotion ? 'none' : 'rotate-slow 25s linear infinite'
            }}
            onMouseEnter={() => setHoveredLayer('animus')}
            onMouseLeave={() => setHoveredLayer(null)}
          >
            <div className={`layer-tooltip ${hoveredLayer === 'animus' ? 'visible' : ''}`}>
              <span>{JUNGIAN_LAYERS.animus.name}</span>
              <small>{JUNGIAN_LAYERS.animus.description}</small>
            </div>
          </div>
        )}

        {/* Fallback ellipses if no Jungian layers active */}
        {activeJungianCount === 0 && (
          <>
            <div 
              className={`ellipse layer-1 ${activeLayer}`}
              style={{
                '--angle': '0deg',
                '--opacity': opacity,
                transform: reducedMotion 
                  ? 'rotate(0deg) scale(1)' 
                  : `rotate(0deg) scale(${0.8 + animationProgress * 0.2})`,
                animation: reducedMotion ? 'none' : 'rotate-slow 20s linear infinite'
              }}
              onMouseEnter={() => setHoveredLayer(1)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              <div className={`layer-tooltip ${hoveredLayer === 1 ? 'visible' : ''}`}>
                <span>Primary Analysis</span>
              </div>
            </div>
            
            <div 
              className={`ellipse layer-2 ${activeLayer}`}
              style={{
                '--angle': '60deg',
                '--opacity': opacity,
                transform: reducedMotion 
                  ? 'rotate(60deg) scale(1)' 
                  : `rotate(60deg) scale(${0.8 + animationProgress * 0.2})`,
                animation: reducedMotion ? 'none' : 'rotate-slow 20s linear infinite reverse'
              }}
              onMouseEnter={() => setHoveredLayer(2)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              <div className={`layer-tooltip ${hoveredLayer === 2 ? 'visible' : ''}`}>
                <span>Secondary Matrix</span>
              </div>
            </div>
            
            <div 
              className={`ellipse layer-3 ${activeLayer}`}
              style={{
                '--angle': '120deg',
                '--opacity': opacity,
                transform: reducedMotion 
                  ? 'rotate(120deg) scale(1)' 
                  : `rotate(120deg) scale(${0.8 + animationProgress * 0.2})`,
                animation: reducedMotion ? 'none' : 'rotate-slow 25s linear infinite'
              }}
              onMouseEnter={() => setHoveredLayer(3)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              <div className={`layer-tooltip ${hoveredLayer === 3 ? 'visible' : ''}`}>
                <span>Tertiary Data</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Center Data with Glassmorphism */}
      <div 
        className="center-data glass-depth-analytics"
        style={getDepthStyle('analytics')}
      >
        <div className="center-pulse"></div>
        <h2 className="center-title">{layerInfo.name}</h2>
        <div className="center-metrics">
          <span className="center-value">{layerInfo.value}</span>
          <span className="center-label">Confidence</span>
        </div>
        
        {/* Active Jungian Indicators */}
        {activeJungianCount > 0 && (
          <div className="jungian-indicators">
            {Object.entries(jungianLayers)
              .filter(([, active]) => active)
              .map(([key]) => (
                <span 
                  key={key}
                  className="jungian-dot"
                  style={{ backgroundColor: JUNGIAN_LAYERS[key].color }}
                  title={JUNGIAN_LAYERS[key].name}
                />
              ))}
          </div>
        )}
        
        <div className="center-nodes">
          <span className="node" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
          <span className="node" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
          <span className="node" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
        </div>
      </div>
      
      {/* Intersection Points with Glassmorphism Depth */}
      <div 
        className="intersection-points glass-depth-predictions"
        style={getDepthStyle('predictions')}
      >
        <span className="intersection i1" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
        <span className="intersection i2" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
        <span className="intersection i3" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
        <span className="intersection i4" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
        <span className="intersection i5" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
        <span className="intersection i6" style={{ animationPlayState: reducedMotion ? 'paused' : 'running' }}></span>
      </div>
    </div>
  );
}

export default EllipseSystem;