import React, { useState, useCallback } from 'react';
import './MaterialityToggle.css';

/**
 * MaterialityToggle - Observable/Scalar Spectrum Slider
 * Based on Dale Pond's materiality concepts
 * 
 * Features:
 * - Dual-ended spectrum from Observable (wave) to Scalar (particle)
 * - Visual representation of the materiality spectrum
 * - Real-time value display with descriptive labels
 * - Smooth animated transitions
 */

const SPECTRUM_LABELS = {
  observable: {
    title: 'OBSERVABLE',
    description: 'Wave phenomena - interference patterns, field disturbances',
    glyph: '∿',
    color: '#00f0ff'
  },
  scalar: {
    title: 'SCALAR',
    description: 'Particle phenomena - discrete quanta, localized states',
    glyph: '●',
    color: '#ff9f1c'
  }
};

const MARKER_POSITIONS = [
  { value: 0, label: 'Pure Wave', description: 'Quantum superposition' },
  { value: 25, label: 'Field', description: 'Probability distribution' },
  { value: 50, label: 'Equilibrium', description: 'Wave-particle duality' },
  { value: 75, label: 'Matter', description: 'Localized excitation' },
  { value: 100, label: 'Pure Particle', description: 'Discrete quanta' }
];

const MaterialityToggle = ({ 
  value = 50, 
  onChange,
  label = 'Materiality Spectrum'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [hoveredMarker, setHoveredMarker] = useState(null);

  const currentValue = isDragging ? localValue : value;

  const handleSliderChange = useCallback((e) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  // Calculate which side of the spectrum is dominant
  const isObservableDominant = currentValue < 50;
  const dominancePercent = isObservableDominant 
    ? 50 - currentValue 
    : currentValue - 50;

  const getCurrentLabel = () => {
    if (currentValue < 20) return 'Quantum Field';
    if (currentValue < 40) return 'Wave Dominant';
    if (currentValue < 60) return 'Duality Point';
    if (currentValue < 80) return 'Particle Dominant';
    return 'Discrete State';
  };

  return (
    <div className="materiality-toggle">
      <div className="toggle-header">
        <div className="header-label">
          <span className="label-glyph">◈</span>
          <span className="label-text">{label.toUpperCase()}</span>
        </div>
        <div className="header-value">
          <span 
            className="value-display"
            style={{
              color: isObservableDominant ? SPECTRUM_LABELS.observable.color : SPECTRUM_LABELS.scalar.color
            }}
          >
            {getCurrentLabel()}
          </span>
        </div>
      </div>
      
      <div className="spectrum-container">
        {/* Observable side label */}
        <div className={`spectrum-side ${isObservableDominant ? 'active' : ''}`}>
          <span className="side-glyph">{SPECTRUM_LABELS.observable.glyph}</span>
          <span className="side-title">{SPECTRUM_LABELS.observable.title}</span>
        </div>
        
        {/* Slider track */}
        <div className="slider-wrapper">
          <div className="slider-track">
            {/* Gradient background */}
            <div 
              className="track-gradient"
              style={{
                background: `linear-gradient(
                  90deg,
                  ${SPECTRUM_LABELS.observable.color}40 0%,
                  ${SPECTRUM_LABELS.observable.color}20 40%,
                  ${SPECTRUM_LABELS.scalar.color}20 60%,
                  ${SPECTRUM_LABELS.scalar.color}40 100%
                )`
              }}
            />
            
            {/* Marker positions */}
            <div className="track-markers">
              {MARKER_POSITIONS.map((marker) => (
                <div
                  key={marker.value}
                  className={`marker ${currentValue === marker.value ? 'active' : ''}`}
                  style={{ left: `${marker.value}%` }}
                  onMouseEnter={() => setHoveredMarker(marker)}
                  onMouseLeave={() => setHoveredMarker(null)}
                >
                  <div className="marker-dot" />
                  
                  {hoveredMarker?.value === marker.value && (
                    <div className="marker-tooltip">
                      <span className="tooltip-label">{marker.label}</span>
                      <span className="tooltip-desc">{marker.description}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Active indicator */}
            <div 
              className="active-indicator"
              style={{
                left: `${currentValue}%`,
                background: isObservableDominant ? SPECTRUM_LABELS.observable.color : SPECTRUM_LABELS.scalar.color
              }}
            />
          </div>
          
          <input
            type="range"
            min="0"
            max="100"
            value={currentValue}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="slider-input"
            aria-label="Materiality spectrum"
          />
        </div>
        
        {/* Scalar side label */}
        <div className={`spectrum-side ${!isObservableDominant ? 'active' : ''}`}>
          <span className="side-glyph">{SPECTRUM_LABELS.scalar.glyph}</span>
          <span className="side-title">{SPECTRUM_LABELS.scalar.title}</span>
        </div>
      </div>
      
      <div className="spectrum-footer">
        <div className="value-bar">
          <div 
            className="value-fill observable"
            style={{ 
              width: `${50 - Math.min(currentValue, 50)}%`,
              opacity: isObservableDominant ? 0.5 + (dominancePercent / 100) : 0.2
            }}
          />
          <div className="value-center">
            <span className="center-value">{currentValue}%</span>
          </div>
          
          <div 
            className="value-fill scalar"
            style={{ 
              width: `${Math.max(0, currentValue - 50)}%`,
              opacity: !isObservableDominant ? 0.5 + (dominancePercent / 100) : 0.2
            }}
          />
        </div>
        
        <div className="description-panel">
          <div className={`desc-side ${isObservableDominant ? 'active' : ''}`}>
            <span className="desc-text">{SPECTRUM_LABELS.observable.description}</span>
          </div>
          
          <div className={`desc-side ${!isObservableDominant ? 'active' : ''}`}>
            <span className="desc-text">{SPECTRUM_LABELS.scalar.description}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialityToggle;
