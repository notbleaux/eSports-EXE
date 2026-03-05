import React, { useState } from 'react';

function LayerToggle({ layers, activeLayer, onToggle }) {
  const [hoveredLayer, setHoveredLayer] = useState(null);

  return (
    <div className="layer-panel">
      <div className="layer-grid">
        {layers.map((layer) => (
          <button
            key={layer.id}
            className={`layer-btn ${activeLayer === layer.id ? 'active' : ''}`}
            onClick={() => onToggle(layer.id)}
            onMouseEnter={() => setHoveredLayer(layer.id)}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{
              '--layer-color': layer.color
            }}
          >
            <div className="layer-indicator">
              <span 
                className="layer-color-dot"
                style={{ backgroundColor: layer.color }}
              ></span>
              <span className="layer-status">
                {activeLayer === layer.id ? '●' : '○'}
              </span>
            </div>
            
            <div className="layer-info">
              <span className="layer-name">{layer.name}</span>
              <span className="layer-formula">{layer.formula}</span>
            </div>
            
            <div className={`layer-preview ${hoveredLayer === layer.id ? 'visible' : ''}`}>
              <p className="preview-desc">{layer.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LayerToggle;
