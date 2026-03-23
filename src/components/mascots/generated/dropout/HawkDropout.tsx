/**
 * [Ver001.000]
 * HawkDropout.tsx - Dropout Style Hawk Mascot Component
 * 
 * Features: Sharp hawk with aviator jacket, focused gaze, confident stance
 * Colors: Red (#D00000), maroon jacket (#370617), gold accents
 * Animations: Focused gaze shift, wing adjust
 */

import React, { useState, useEffect, forwardRef } from 'react';

export type HawkSize = '32' | '64' | '128' | '256' | '512';
export type HawkState = 'idle' | 'hover' | 'focused' | 'ready' | 'enter' | 'exit';

export interface HawkDropoutProps {
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
 * Dropout Style Hawk Component
 * 
 * A sharp, confident hawk mascot wearing an aviator jacket.
 * Features intense eyes, focused gaze animations, and gold accents.
 */
export const HawkDropout = forwardRef<HTMLDivElement, HawkDropoutProps>(
  (
    {
      size = '128',
      state = 'idle',
      className = '',
      style = {},
      onClick,
      onMouseEnter,
      onMouseLeave,
      ariaLabel = 'Hawk mascot in aviator jacket',
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
      if (!state || state === 'idle') {
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
      'hawk-dropout',
      `size-${size}`,
      currentState,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const svgPath = `/mascots/dropout/hawk-${size}x${size}.svg`;

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
        data-testid={testId || 'hawk-dropout'}
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

HawkDropout.displayName = 'HawkDropout';

/**
 * Animated variant with automatic entrance animation
 */
export interface AnimatedHawkDropoutProps extends HawkDropoutProps {
  /** Delay before animation starts (ms) */
  animationDelay?: number;
  /** Whether to auto-play entrance animation */
  autoAnimate?: boolean;
}

export const AnimatedHawkDropout: React.FC<AnimatedHawkDropoutProps> = ({
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
      }, 500 + animationDelay);

      return () => clearTimeout(timer);
    }
  }, [autoAnimate, animationDelay, initialState]);

  return <HawkDropout {...props} state={state} />;
};

/**
 * Pre-sized convenience exports
 */
export const HawkDropout32: React.FC<Omit<HawkDropoutProps, 'size'>> = (props) => (
  <HawkDropout {...props} size="32" />
);

export const HawkDropout64: React.FC<Omit<HawkDropoutProps, 'size'>> = (props) => (
  <HawkDropout {...props} size="64" />
);

export const HawkDropout128: React.FC<Omit<HawkDropoutProps, 'size'>> = (props) => (
  <HawkDropout {...props} size="128" />
);

export const HawkDropout256: React.FC<Omit<HawkDropoutProps, 'size'>> = (props) => (
  <HawkDropout {...props} size="256" />
);

export const HawkDropout512: React.FC<Omit<HawkDropoutProps, 'size'>> = (props) => (
  <HawkDropout {...props} size="512" />
);

export default HawkDropout;
