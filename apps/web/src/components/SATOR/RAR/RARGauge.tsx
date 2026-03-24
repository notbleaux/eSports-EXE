/** [Ver001.000] */
/**
 * RAR Gauge Component
 * ===================
 * Visual gauge for Risk-Adjusted Rating display.
 * Shows RAR score with color-coded investment grade.
 */

import React from 'react';

interface RARGaugeProps {
  value: number;        // 0-100 scale
  max?: number;
  grade: string;        // A+, A, B, C, D
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const gradeColors: Record<string, string> = {
  'A+': '#10B981',  // Emerald
  'A':  '#22C55E',  // Green
  'B':  '#3B82F6',  // Blue
  'C':  '#F59E0B',  // Amber
  'D':  '#EF4444',  // Red
};

const sizeConfig = {
  sm: { width: 120, height: 60, fontSize: 24, strokeWidth: 8 },
  md: { width: 180, height: 90, fontSize: 32, strokeWidth: 12 },
  lg: { width: 240, height: 120, fontSize: 48, strokeWidth: 16 },
};

export const RARGauge: React.FC<RARGaugeProps> = ({
  value,
  max = 100,
  grade,
  size = 'md',
  showValue = true,
}) => {
  const config = sizeConfig[size];
  const percentage = Math.min((value / max) * 100, 100);
  const color = gradeColors[grade] || gradeColors['D'];
  
  // Semi-circle gauge
  const radius = (config.width / 2) - config.strokeWidth;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="rar-gauge" style={{ position: 'relative', width: config.width, height: config.height }}>
      <svg width={config.width} height={config.height}>
        {/* Background arc */}
        <path
          d={`M ${config.strokeWidth} ${config.height - config.strokeWidth} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth} ${config.height - config.strokeWidth}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        <path
          d={`M ${config.strokeWidth} ${config.height - config.strokeWidth} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth} ${config.height - config.strokeWidth}`}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      
      {showValue && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: config.fontSize,
              fontWeight: 'bold',
              color,
            }}
          >
            {value.toFixed(1)}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: config.fontSize * 0.4,
              color: '#6B7280',
            }}
          >
            Grade {grade}
          </span>
        </div>
      )}
    </div>
  );
};

export default RARGauge;
