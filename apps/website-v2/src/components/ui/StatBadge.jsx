import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/utils/cn';

/**
 * StatBadge - Animated statistic display
 * 
 * Visual:
 * ┌──────────┐
 * │   245    │  ← Large number (tabular-nums)
 * │   ACS    │  ← Small label
 * └──────────┘
 * 
 * Animation:
 * - Number counts up from 0 on mount
 * - Duration: 500ms
 */
export function StatBadge({
  value,
  label,
  trend,
  color = '#00d4ff',
  animate = true,
}) {
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
  });
  
  const displayValue = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );
  
  useEffect(() => {
    if (animate) {
      spring.set(value);
    }
  }, [spring, value, animate]);
  
  const trendColors = {
    up: '#00ff88',
    down: '#ff4655',
    neutral: '#a0a0b0',
  };
  
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'px-4 py-3 rounded-lg',
        'bg-white/5 border border-white/10'
      )}
    >
      <motion.span
        className="text-2xl font-mono font-bold tabular-nums"
        style={{ color }}
      >
        {animate ? displayValue : value.toLocaleString()}
      </motion.span>
      
      <span className="text-xs text-white/60 uppercase tracking-wide mt-1">
        {label}
      </span>
      
      {trend && (
        <span
          className="text-xs mt-1"
          style={{ color: trendColors[trend] }}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
  );
}

export default StatBadge;
