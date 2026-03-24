/**
 * WinProbabilityGauge Component
 * Visual semi-circle gauge for displaying win probability
 * 
 * [Ver001.000]
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import type { WinProbabilityGaugeProps } from './types';
import { PURPLE } from './mockData';

/**
 * Get color for probability value
 * Maps 0-1 to red-yellow-green gradient
 */
const getProbabilityColor = (probability: number): string => {
  // Red (#ef4444) -> Yellow (#eab308) -> Green (#22c55e)
  if (probability < 0.5) {
    // Red to Yellow
    const t = probability * 2;
    const r = Math.round(239 + (234 - 239) * t);
    const g = Math.round(68 + (179 - 68) * t);
    const b = Math.round(68 + (8 - 68) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to Green
    const t = (probability - 0.5) * 2;
    const r = Math.round(234 + (34 - 234) * t);
    const g = Math.round(179 + (197 - 179) * t);
    const b = Math.round(8 + (94 - 8) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

/**
 * Get gauge size configuration
 */
const getGaugeSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        width: 180,
        height: 90,
        strokeWidth: 8,
        fontSize: 14,
        subFontSize: 10,
      };
    case 'lg':
      return {
        width: 320,
        height: 160,
        strokeWidth: 16,
        fontSize: 24,
        subFontSize: 14,
      };
    case 'md':
    default:
      return {
        width: 240,
        height: 120,
        strokeWidth: 12,
        fontSize: 18,
        subFontSize: 12,
      };
  }
};

const WinProbabilityGauge: React.FC<WinProbabilityGaugeProps> = ({
  teamAName,
  teamBName,
  probability,
  confidence,
  size = 'md',
}) => {
  const dimensions = getGaugeSize(size);
  const radius = (dimensions.width / 2) - dimensions.strokeWidth;
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height;
  
  // Calculate arc path
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = endAngle - startAngle;
  
  // Calculate fill position based on probability
  const fillAngle = startAngle + sweepAngle * probability;
  
  // Color for the fill
  const fillColor = getProbabilityColor(probability);
  const inverseColor = getProbabilityColor(1 - probability);
  
  // Confidence ring radius
  const confidenceRadius = radius + dimensions.strokeWidth / 2 + 4;

  // Create arc path
  const createArcPath = (start: number, end: number, r: number) => {
    const x1 = centerX + r * Math.cos(start);
    const y1 = centerY + r * Math.sin(start);
    const x2 = centerX + r * Math.cos(end);
    const y2 = centerY + r * Math.sin(end);
    const largeArc = end - start <= Math.PI ? 0 : 1;
    
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Background arc
  const bgPath = createArcPath(startAngle, endAngle, radius);
  
  // Fill arc
  const fillPath = createArcPath(startAngle, fillAngle, radius);
  
  // Confidence arc (if provided)
  const confidencePath = confidence 
    ? createArcPath(startAngle, startAngle + sweepAngle * (confidence / 100), confidenceRadius)
    : '';

  return (
    <GlassCard className="p-4 flex flex-col items-center">
      <div className="relative">
        <svg 
          width={dimensions.width} 
          height={dimensions.height + 20}
          className="overflow-visible"
        >
          {/* Background track */}
          <path
            d={bgPath}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={dimensions.strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gaugeGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={fillColor} />
              <stop offset="50%" stopColor={PURPLE.base} />
              <stop offset="100%" stopColor={inverseColor} />
            </linearGradient>
          </defs>
          
          {/* Animated fill */}
          <motion.path
            d={fillPath}
            fill="none"
            stroke={`url(#gaugeGradient-${size})`}
            strokeWidth={dimensions.strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          
          {/* Confidence ring (if provided) */}
          {confidence && (
            <motion.path
              d={confidencePath}
              fill="none"
              stroke={PURPLE.base}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="4 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: confidence / 100 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
          )}
          
          {/* Center needle/indicator */}
          <motion.circle
            cx={centerX + radius * Math.cos(fillAngle)}
            cy={centerY + radius * Math.sin(fillAngle)}
            r={dimensions.strokeWidth / 2 + 2}
            fill={fillColor}
            stroke="white"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          />
          
          {/* Center text - Probability */}
          <text
            x={centerX}
            y={centerY - radius * 0.3}
            textAnchor="middle"
            fill="white"
            fontSize={dimensions.fontSize}
            fontWeight="bold"
          >
            {Math.round(probability * 100)}%
          </text>
          
          {/* Team A label */}
          <text
            x={centerX - radius * 0.6}
            y={centerY + 15}
            textAnchor="middle"
            fill={fillColor}
            fontSize={dimensions.subFontSize}
            fontWeight="medium"
          >
            {teamAName.length > 10 ? teamAName.slice(0, 10) + '...' : teamAName}
          </text>
          
          {/* Team B label */}
          <text
            x={centerX + radius * 0.6}
            y={centerY + 15}
            textAnchor="middle"
            fill={inverseColor}
            fontSize={dimensions.subFontSize}
            fontWeight="medium"
          >
            {teamBName.length > 10 ? teamBName.slice(0, 10) + '...' : teamBName}
          </text>
          
          {/* VS indicator */}
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={dimensions.subFontSize - 2}
          >
            VS
          </text>
          
          {/* Confidence indicator */}
          {confidence && (
            <text
              x={centerX}
              y={dimensions.height + 15}
              textAnchor="middle"
              fill={PURPLE.base}
              fontSize={dimensions.subFontSize - 2}
            >
              {confidence}% confidence
            </text>
          )}
        </svg>
      </div>
      
      {/* Stats below gauge */}
      <div className="flex justify-between w-full mt-2 pt-3 border-t border-white/10">
        <div className="text-center">
          <div className="text-xs opacity-50">Win Chance</div>
          <div className="font-semibold" style={{ color: fillColor }}>
            {(probability * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs opacity-50">Draw</div>
          <div className="font-semibold text-gray-400">0%</div>
        </div>
        <div className="text-center">
          <div className="text-xs opacity-50">Win Chance</div>
          <div className="font-semibold" style={{ color: inverseColor }}>
            {((1 - probability) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default WinProbabilityGauge;
