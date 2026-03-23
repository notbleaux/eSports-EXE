/**
 * [Ver001.000]
 * HawkNJ.tsx - NJ Style Hawk Mascot Component
 * 
 * Features: Sleek hawk outline, precision lines, sharp angles
 * Stroke: #0000FF (blue), 2px weight
 * Animations: Sharp head turn
 */

import React, { useState, useEffect, forwardRef } from 'react';

export type HawkSize = '32' | '64' | '128' | '256' | '512';
export type HawkState = 'idle' | 'hover' | 'alert' | 'focused' | 'scanning' | 'predatory' | 'perch' | 'enter' | 'exit';

export interface HawkNJProps {
  /** Size variant of the hawk */
  size?: HawkSize;
  /** Current animation state */
  state?: HawkState;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Click handler */
  onClick?: () => void;
  /** Mouse enter handler */
  onMouseEnter?: () => void;
  /** Mouse leave handler */
  onMouseLeave?: () => void;
  /** Accessibility label */
  ariaLabel?: string;
  /** ID for the component */
  id?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

const sizeMap: Record<HawkSize, { width: number; height: number }> = {
  '32': { width: 32, height: 32 },
  '64': { width: 64, height: 64 },
  '128': { width: 128, height: 128 },
  '256': { width: 256, height: 256 },
  '512': { width: 512, height: 512 },
};

/**
 * NJ Style Hawk Component
 * 
 * A sleek, minimalist hawk rendered in outline style with precision lines.
 * Features sharp angles, streamlined body, and alert posture.
 */
export const HawkNJ = forwardRef<HTMLDivElement, HawkNJProps>(
  (
    {
      size = '128',
      state = 'idle',
      className = '',
      style = {},
      onClick,
      onMouseEnter,
      onMouseLeave,
      ariaLabel = 'Hawk mascot outline',
      id,
      'data-testid': testId,
    },
    ref
  ) => {
    const [currentState, setCurrentState] = useState<HawkState>(state);
    const dimensions = sizeMap[size];

    useEffect(() => {
      setCurrentState(state);
    }, [state]);

    const handleMouseEnter = () => {
      if (!state || state === 'idle' || state === 'perch') {
        setCurrentState('hover');
      }
      onMouseEnter?.();
    };

    const handleMouseLeave = () => {
      if (!state || state === 'hover') {
        setCurrentState('idle');
      }
      onMouseLeave?.();
    };

    const containerClasses = [
      'hawk-nj',
      `size-${size}`,
      currentState,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const svgPath = `/mascots/nj/hawk-${size}x${size}.svg`;

    return (
      <div
        ref={ref}
        id={id}
        className={containerClasses}
        style={{
          display: 'inline-block',
          position: 'relative',
          width: dimensions.width,
          height: dimensions.height,
          transition: 'transform 0.3s ease',
          ...style,
        }}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label={ariaLabel}
        data-testid={testId || 'hawk-nj'}
        data-size={size}
        data-state={currentState}
      >
        <img
          src={svgPath}
          alt=""
          width={dimensions.width}
          height={dimensions.height}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
);

HawkNJ.displayName = 'HawkNJ';

/**
 * Animated variant with automatic entrance animation
 */
export interface AnimatedHawkNJProps extends HawkNJProps {
  /** Delay before animation starts (ms) */
  animationDelay?: number;
  /** Whether to auto-play entrance animation */
  autoAnimate?: boolean;
}

export const AnimatedHawkNJ: React.FC<AnimatedHawkNJProps> = ({
  animationDelay = 0,
  autoAnimate = true,
  state: initialState = 'idle',
  ...props
}) => {
  const [state, setState] = useState<HawkState>(autoAnimate ? 'enter' : initialState);

  useEffect(() => {
    if (autoAnimate) {
      const timer = setTimeout(() => {
        setState(initialState);
      }, 400 + animationDelay);

      return () => clearTimeout(timer);
    }
  }, [autoAnimate, animationDelay, initialState]);

  return <HawkNJ {...props} state={state} />;
};

/**
 * Alert variant - triggers alert animation on mount
 */
export const AlertHawkNJ: React.FC<Omit<HawkNJProps, 'state'>> = (props) => {
  const [state, setState] = useState<HawkState>('enter');

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setState('alert');
    }, 400);

    const alertTimer = setTimeout(() => {
      setState('focused');
    }, 1000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(alertTimer);
    };
  }, []);

  return <HawkNJ {...props} state={state} />;
};

/**
 * Scanning variant - continuously scanning head movement
 */
export const ScanningHawkNJ: React.FC<Omit<HawkNJProps, 'state'>> = (props) => (
  <HawkNJ {...props} state="scanning" />
);

/**
 * Predatory variant - intense focused state
 */
export const PredatoryHawkNJ: React.FC<Omit<HawkNJProps, 'state'>> = (props) => (
  <HawkNJ {...props} state="predatory" />
);

/**
 * Pre-sized convenience exports
 */
export const HawkNJ32: React.FC<Omit<HawkNJProps, 'size'>> = (props) => (
  <HawkNJ {...props} size="32" />
);

export const HawkNJ64: React.FC<Omit<HawkNJProps, 'size'>> = (props) => (
  <HawkNJ {...props} size="64" />
);

export const HawkNJ128: React.FC<Omit<HawkNJProps, 'size'>> = (props) => (
  <HawkNJ {...props} size="128" />
);

export const HawkNJ256: React.FC<Omit<HawkNJProps, 'size'>> = (props) => (
  <HawkNJ {...props} size="256" />
);

export const HawkNJ512: React.FC<Omit<HawkNJProps, 'size'>> = (props) => (
  <HawkNJ {...props} size="512" />
);

export default HawkNJ;
