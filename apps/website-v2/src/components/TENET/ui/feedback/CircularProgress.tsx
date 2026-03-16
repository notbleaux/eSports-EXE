/** [Ver001.000] */
/**
 * CircularProgress Component
 * ==========================
 * Circular progress indicator with customizable appearance.
 */

import { forwardRef } from 'react';

export interface CircularProgressProps {
  value?: number;
  size?: string | number;
  thickness?: string | number;
  color?: string;
  trackColor?: string;
  isIndeterminate?: boolean;
  capIsRound?: boolean;
  children?: React.ReactNode;
  className?: string;
  label?: string;
}

export const CircularProgress = forwardRef<SVGSVGElement, CircularProgressProps>(
  (
    {
      value = 0,
      size = 48,
      thickness = 4,
      color = '#3B82F6',
      trackColor = '#E5E7EB',
      isIndeterminate = false,
      capIsRound = false,
      children,
      className = '',
      label,
    },
    ref
  ) => {
    const sizeNum = typeof size === 'string' ? parseInt(size, 10) : size;
    const thicknessNum = typeof thickness === 'string' ? parseInt(thickness, 10) : thickness;
    
    const radius = (sizeNum - thicknessNum) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedValue = Math.min(Math.max(value, 0), 100);
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
    const center = sizeNum / 2;

    return (
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-label={label}
        className={`inline-flex items-center justify-center relative ${className}`}
        style={{ width: sizeNum, height: sizeNum }}
      >
        <svg
          ref={ref}
          width={sizeNum}
          height={sizeNum}
          viewBox={`0 0 ${sizeNum} ${sizeNum}`}
          className={isIndeterminate ? 'animate-spin' : ''}
          style={{ animationDuration: '1s' }}
        >
          {/* Track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={thicknessNum}
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thicknessNum}
            strokeLinecap={capIsRound ? 'round' : 'butt'}
            strokeDasharray={circumference}
            strokeDashoffset={isIndeterminate ? circumference * 0.75 : strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{
              transition: isIndeterminate ? undefined : 'stroke-dashoffset 0.3s ease-out',
            }}
          />
        </svg>
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

export default CircularProgress;
