/** [Ver001.000] */
/**
 * Volatility Indicator Component
 * ==============================
 * Shows performance volatility with trend direction.
 */

import React from 'react';

interface VolatilityIndicatorProps {
  volatilityScore: number;    // 0-1 (0 = stable, 1 = volatile)
  consistencyRating: string;   // A+, A, B, C, D
  trendDirection: string;      // improving, declining, stable, unknown
  trendStrength: number;       // 0-1
  size?: 'sm' | 'md' | 'lg';
}

const ratingColors: Record<string, string> = {
  'A+': '#10B981',
  'A':  '#22C55E',
  'B':  '#3B82F6',
  'C':  '#F59E0B',
  'D':  '#EF4444',
};

const trendIcons: Record<string, string> = {
  'improving': '↗️',
  'declining': '↘️',
  'stable': '→',
  'unknown': '?',
};

export const VolatilityIndicator: React.FC<VolatilityIndicatorProps> = ({
  volatilityScore,
  consistencyRating,
  trendDirection,
  trendStrength,
  size = 'md',
}) => {
  const color = ratingColors[consistencyRating] || ratingColors['D'];
  const icon = trendIcons[trendDirection] || trendIcons['unknown'];
  
  const sizeConfig = {
    sm: { barWidth: 80, barHeight: 8, fontSize: 12 },
    md: { barWidth: 120, barHeight: 12, fontSize: 14 },
    lg: { barWidth: 160, barHeight: 16, fontSize: 16 },
  };
  
  const config = sizeConfig[size];
  
  // Invert for display (stability instead of volatility)
  const stabilityScore = 1 - volatilityScore;
  
  return (
    <div className="volatility-indicator" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Stability bar */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: config.barWidth,
            height: config.barHeight,
            backgroundColor: '#E5E7EB',
            borderRadius: config.barHeight / 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${stabilityScore * 100}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: config.barHeight / 2,
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>
        
        {/* Labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: config.fontSize * 0.75,
            color: '#6B7280',
            marginTop: 4,
          }}
        >
          <span>Volatile</span>
          <span>Stable</span>
        </div>
      </div>
      
      {/* Rating and Trend */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: config.fontSize,
            fontWeight: 'bold',
            color,
          }}
        >
          {consistencyRating}
        </div>
        <div style={{ fontSize: config.fontSize * 0.875 }}>
          {icon} {(trendStrength * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

export default VolatilityIndicator;
