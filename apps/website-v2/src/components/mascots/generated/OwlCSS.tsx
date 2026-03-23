import React from 'react';

interface OwlCSSProps {
  className?: string;
  animate?: boolean;
  animation?: 'idle' | 'wave' | 'celebrate' | 'head-turn' | 'blink' | 'feather-ruffle' | 'glasses-flash' | 'book-open' | 'wisdom' | false;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Owl Mascot - CSS-Only Component
 * Zero dependencies, pure CSS pixel art
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const OwlCSS: React.FC<OwlCSSProps> = ({ 
  className = '',
  animate = false,
  animation = 'idle',
  size = 'md'
}) => {
  const sizeMap = {
    sm: { scale: 1, px: 64 },
    md: { scale: 2, px: 128 },
    lg: { scale: 4, px: 256 }
  };

  const { scale, px } = sizeMap[size];
  const animationClass = animate && animation ? `animate-${animation}` : '';

  return (
    <div 
      className={`owl-mascot-wrapper ${className}`}
      style={{ 
        width: px, 
        height: px,
        display: 'inline-block'
      }}
    >
      <div 
        className={`owl-mascot ${animationClass}`}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      />
    </div>
  );
};

/**
 * Owl Mascot with predefined states
 */
export const OwlMascotStates: Record<string, React.FC<Omit<OwlCSSProps, 'animation'>>> = {
  Idle: (props) => <OwlCSS {...props} animate animation="idle" />,
  Wave: (props) => <OwlCSS {...props} animate animation="wave" />,
  Celebrate: (props) => <OwlCSS {...props} animate animation="celebrate" />,
  Thinking: (props) => <OwlCSS {...props} animate animation="head-turn" />,
  Wise: (props) => <OwlCSS {...props} animate animation="wisdom" />,
  Reading: (props) => <OwlCSS {...props} animate animation="book-open" />
};

/**
 * Animated Owl Mascot with multiple states
 */
export const OwlMascotAnimated: React.FC<{
  state?: 'idle' | 'wave' | 'celebrate' | 'thinking' | 'wise' | 'reading';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  state = 'wise',
  className = '',
  size = 'md'
}) => {
  const stateAnimationMap = {
    idle: 'idle',
    wave: 'wave',
    celebrate: 'celebrate',
    thinking: 'head-turn',
    wise: 'wisdom',
    reading: 'book-open'
  } as const;

  return (
    <OwlCSS 
      className={className}
      animate
      animation={stateAnimationMap[state]}
      size={size}
    />
  );
};

export default OwlCSS;
