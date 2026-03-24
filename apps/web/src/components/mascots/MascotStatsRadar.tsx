/** [Ver001.000]
 * MascotStatsRadar Component
 * ==========================
 * Radar chart visualization for mascot stats using Recharts.
 * Displays agility, power, wisdom, defense, speed, and luck.
 * 
 * WCAG 2.1 AA Compliant: Includes color-independent indicators
 * and screen reader accessible data.
 */

import React, { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import type { MascotStats } from './types';

// ============================================================================
// Props Interface
// ============================================================================

export interface MascotStatsRadarProps {
  stats: MascotStats;
  color?: string;
  size?: number;
  animated?: boolean;
  showLabels?: boolean;
  className?: string;
  'aria-label'?: string;
}

// ============================================================================
// Stat Label Mapping
// ============================================================================

const STAT_LABELS: Record<keyof MascotStats, string> = {
  agility: 'AGI',
  power: 'PWR',
  wisdom: 'WIS',
  defense: 'DEF',
  speed: 'SPD',
  luck: 'LCK',
};

// ============================================================================
// Component
// ============================================================================

export const MascotStatsRadar: React.FC<MascotStatsRadarProps> = ({
  stats,
  color = '#00D1FF',
  size = 200,
  animated = true,
  showLabels = true,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const { enabled: motionEnabled } = useReducedMotion();
  const shouldAnimate = animated && motionEnabled;

  // Transform stats into Recharts data format
  const chartData = useMemo(() => [
    { subject: STAT_LABELS.agility, value: stats.agility, fullMark: 100 },
    { subject: STAT_LABELS.power, value: stats.power, fullMark: 100 },
    { subject: STAT_LABELS.wisdom, value: stats.wisdom, fullMark: 100 },
    { subject: STAT_LABELS.defense, value: stats.defense, fullMark: 100 },
    { subject: STAT_LABELS.speed, value: stats.speed, fullMark: 100 },
    { subject: STAT_LABELS.luck, value: stats.luck, fullMark: 100 },
  ], [stats]);

  // Generate accessible description
  const accessibleDescription = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    return `Stats: Agility ${stats.agility}, Power ${stats.power}, Wisdom ${stats.wisdom}, Defense ${stats.defense}, Speed ${stats.speed}, Luck ${stats.luck}`;
  }, [ariaLabel, stats]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { subject: string; value: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-charcoal">
            {data.subject}: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={accessibleDescription}
    >
      {/* Screen reader only table for accessibility */}
      <table className="sr-only">
        <caption>Mascot Statistics</caption>
        <thead>
          <tr>
            <th>Stat</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid 
            stroke="#E5E5E7" 
            strokeWidth={1}
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={showLabels ? { 
              fill: '#111217', 
              fontSize: 10, 
              fontWeight: 600 
            } : false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Stats"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.25}
            isAnimationActive={shouldAnimate}
            animationDuration={shouldAnimate ? 800 : 0}
            animationEasing="ease-out"
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MascotStatsRadar;
