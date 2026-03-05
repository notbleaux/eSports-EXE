import React, { useState, useEffect } from 'react';

function EllipseSystem({ activeLayer }) {
  const [hoveredLayer, setHoveredLayer] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    // Animate ellipses on mount
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

  const layerInfo = getLayerInfo();
  const opacity = 0.3 + (animationProgress * 0.7);

  return (
    <div className="ellipse-container">
      <div 
        className={`ellipse layer-1 ${activeLayer}`}
        style={{
          '--angle': '0deg',
          '--opacity': opacity,
          transform: `rotate(0deg) scale(${0.8 + animationProgress * 0.2})`
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
          transform: `rotate(60deg) scale(${0.8 + animationProgress * 0.2})`
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
          transform: `rotate(120deg) scale(${0.8 + animationProgress * 0.2})`
        }}
        onMouseEnter={() => setHoveredLayer(3)}
        onMouseLeave={() => setHoveredLayer(null)}
      >
        <div className={`layer-tooltip ${hoveredLayer === 3 ? 'visible' : ''}`}>
          <span>Tertiary Data</span>
        </div>
      </div>
      
      <div className="center-data">
        <div className="center-pulse"></div>
        <h2 className="center-title">{layerInfo.name}</h2>
        <div className="center-metrics">
          <span className="center-value">{layerInfo.value}</span>
          <span className="center-label">Confidence</span>
        </div>
        <div className="center-nodes">
          <span className="node"></span>
          <span className="node"></span>
          <span className="node"></span>
        </div>
      </div>
      
      <div className="intersection-points">
        <span className="intersection i1"></span>
        <span className="intersection i2"></span>
        <span className="intersection i3"></span>
        <span className="intersection i4"></span>
        <span className="intersection i5"></span>
        <span className="intersection i6"></span>
      </div>
    </div>
  );
}

export default EllipseSystem;
