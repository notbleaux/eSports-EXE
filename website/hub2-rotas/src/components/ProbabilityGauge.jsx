import React, { useState, useEffect, useRef } from 'react';

function ProbabilityGauge({ value, label }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const gaugeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (gaugeRef.current) {
      observer.observe(gaugeRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (value - startValue) * easeProgress;
      
      setAnimatedValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value]);

  // Calculate SVG arc
  const radius = 40;
  const centerX = 50;
  const centerY = 50;
  const maxDashArray = 126; // Approximate semi-circle circumference
  const dashArray = (animatedValue / 100) * maxDashArray;

  // Determine color based on value
  const getColor = (val) => {
    if (val >= 85) return '#00f0ff'; // Cyan for high
    if (val >= 70) return '#c9b037'; // Gold for medium-high
    if (val >= 50) return '#ff9f1c'; // Amber for medium
    return '#ef4444'; // Red for low
  };

  const strokeColor = getColor(value);

  return (
    <div className="probability-card" ref={gaugeRef}>
      <div className="gauge">
        <svg viewBox="0 0 100 60" className="gauge-svg">
          {/* Background arc */}
          <path
            d={`M 10 50 A ${radius} ${radius} 0 0 1 90 50`}
            fill="none"
            stroke="#1e1e24"
            strokeWidth="10"
            strokeLinecap="round"
          />
          
          {/* Animated arc */}
          <path
            d={`M 10 50 A ${radius} ${radius} 0 0 1 90 50`}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dashArray} ${maxDashArray}`}
            className="gauge-fill"
            style={{
              filter: `drop-shadow(0 0 8px ${strokeColor}40)`
            }}
          />
          
          {/* Decorative ticks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 180 - 180;
            const rad = (angle * Math.PI) / 180;
            const x1 = centerX + (radius - 5) * Math.cos(rad);
            const y1 = centerY + (radius - 5) * Math.sin(rad);
            const x2 = centerX + (radius + 5) * Math.cos(rad);
            const y2 = centerY + (radius + 5) * Math.sin(rad);
            
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#2a2a35"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        <div className="gauge-value-container">
          <span className="gauge-value" style={{ color: strokeColor }}>
            {animatedValue.toFixed(1)}
          </span>
          <span className="gauge-unit">%</span>
        </div>
      </div>
      
      <span className="gauge-label">{label}</span>
      
      <div className="gauge-bar">
        <div 
          className="gauge-bar-fill"
          style={{ 
            width: `${animatedValue}%`,
            backgroundColor: strokeColor
          }}
        ></div>
      </div>
    </div>
  );
}

export default ProbabilityGauge;
