/**
 * WolfMascotAnimated Component
 * [Ver001.000]
 * 
 * Enhanced animated Wolf mascot with interactive features:
 * - Click-triggered celebrate animation
 * - Hover state transitions
 * - Easter egg: 5 clicks triggers special animation
 * - Progressive loading states
 * - Accessibility features
 * 
 * @example
 * <WolfMascotAnimated size={128} preferenceKey="user-mascot" />
 * <WolfMascotAnimated size={256} showLoading glow />
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';

export type WolfSize = 32 | 64 | 128 | 256 | 512;
export type WolfAnimation = 'idle' | 'wave' | 'celebrate' | 'special' | 'none';
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

interface WolfMascotAnimatedProps {
  /** Display size in pixels */
  size?: WolfSize;
  
  /** Initial animation state */
  defaultAnimate?: WolfAnimation;
  
  /** Additional CSS class */
  className?: string;
  
  /** Accessible label */
  alt?: string;
  
  /** Show loading placeholder */
  showLoading?: boolean;
  
  /** Apply glow effect */
  glow?: boolean;
  
  /** Enable click interactions */
  interactive?: boolean;
  
  /** Personalization key for storing preference */
  preferenceKey?: string;
  
  /** Enable easter eggs */
  easterEggs?: boolean;
  
  /** Called when asset loads */
  onLoad?: () => void;
  
  /** Called on error */
  onError?: (error: Error) => void;
  
  /** Called on click */
  onClick?: () => void;
  
  /** Custom click threshold for easter egg (default: 5) */
  clickThreshold?: number;
}

interface AnimationState {
  current: WolfAnimation;
  isPlaying: boolean;
}

/**
 * WolfMascotAnimated - Enhanced animated Wolf mascot component
 * 
 * Features:
 * - Interactive click animations
 * - Easter egg: Click 5 times for special celebrate animation
 * - Loading state with placeholder
 * - Hover and focus states
 * - Reduced motion support
 * - Full accessibility
 */
export const WolfMascotAnimated: React.FC<WolfMascotAnimatedProps> = ({
  size = 128,
  defaultAnimate = 'idle',
  className = '',
  alt = 'Wolf mascot - click to interact',
  showLoading = true,
  glow = false,
  interactive = true,
  preferenceKey,
  easterEggs = true,
  onLoad,
  // onError - reserved for future error handling
  onClick,
  clickThreshold = 5
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [animation, setAnimation] = useState<AnimationState>({
    current: defaultAnimate,
    isPlaying: false
  });
  const [clickCount, setClickCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simulate asset loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingState('loaded');
      onLoad?.();
    }, showLoading ? 300 : 0);
    
    return () => clearTimeout(timer);
  }, [showLoading, onLoad]);
  
  // Handle click interactions
  const handleClick = useCallback(() => {
    if (!interactive || loadingState !== 'loaded') return;
    
    onClick?.();
    
    if (easterEggs) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      
      if (newCount >= clickThreshold) {
        // Trigger special animation
        setAnimation({ current: 'special', isPlaying: true });
        setClickCount(0);
        
        // Reset after animation
        setTimeout(() => {
          setAnimation({ current: defaultAnimate, isPlaying: false });
        }, 1500);
      } else {
        // Regular celebrate
        setAnimation({ current: 'celebrate', isPlaying: true });
        
        setTimeout(() => {
          setAnimation({ current: defaultAnimate, isPlaying: false });
        }, 800);
      }
    } else {
      // Simple celebrate without easter egg
      setAnimation({ current: 'celebrate', isPlaying: true });
      
      setTimeout(() => {
        setAnimation({ current: defaultAnimate, isPlaying: false });
      }, 800);
    }
  }, [interactive, loadingState, clickCount, easterEggs, clickThreshold, defaultAnimate, onClick]);
  
  // Handle hover
  const handleMouseEnter = useCallback(() => {
    if (interactive) setIsHovered(true);
  }, [interactive]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  // Handle focus
  const handleFocus = useCallback(() => {
    if (interactive) setIsFocused(true);
  }, [interactive]);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);
  
  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);
  
  // Save preference on unmount if key provided
  useEffect(() => {
    return () => {
      if (preferenceKey && typeof window !== 'undefined') {
        localStorage.setItem(`mascot-pref-${preferenceKey}`, 'wolf');
      }
    };
  }, [preferenceKey]);
  
  // Get current animation class
  const getAnimationClass = () => {
    if (animation.isPlaying) {
      switch (animation.current) {
        case 'celebrate':
          return 'animate-celebrate';
        case 'special':
          return 'animate-special';
        case 'wave':
          return 'animate-wave';
        default:
          return '';
      }
    }
    if (animation.current === 'idle' && !isHovered) {
      return 'animate-idle';
    }
    return '';
  };
  
  // Visual states
  const glowClass = glow ? 'drop-shadow-[0_0_30px_rgba(71,85,105,0.6)]' : '';
  const hoverClass = isHovered ? 'scale-110' : '';
  const focusClass = isFocused ? 'ring-4 ring-slate-400/50' : '';
  const interactiveClass = interactive ? 'cursor-pointer transition-transform duration-200' : 'cursor-default';
  
  // Scale factor
  const scale = size / 128;
  
  // Render loading state
  if (loadingState === 'loading' && showLoading) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-slate-800 rounded-2xl ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label="Loading wolf mascot..."
      >
        <div 
          className="rounded-full bg-slate-600 animate-pulse"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
      </div>
    );
  }
  
  // Render error state
  if (loadingState === 'error') {
    return (
      <div
        className={`inline-flex items-center justify-center bg-red-900/20 rounded-2xl ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label="Failed to load wolf mascot"
      >
        <span className="text-red-500 text-2xl font-bold">!</span>
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`inline-block relative ${interactiveClass} ${focusClass} ${className}`}
      style={{ 
        width: size, 
        height: size,
        borderRadius: size * 0.125
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-label={alt}
    >
      {/* Main SVG */}
      <div
        style={{ 
          transform: `scale(${scale}) ${hoverClass ? 'scale(1.1)' : ''}`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease-out'
        }}
      >
        <svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          className={`${getAnimationClass()} ${glowClass}`}
          style={{ imageRendering: 'pixelated' }}
        >
          <defs>
            <linearGradient id="wolfGradAnim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b"/>
              <stop offset="40%" stopColor="#475569"/>
              <stop offset="100%" stopColor="#334155"/>
            </linearGradient>
            <linearGradient id="wolfLightAnim" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8"/>
              <stop offset="50%" stopColor="#64748b"/>
              <stop offset="100%" stopColor="#475569"/>
            </linearGradient>
            <linearGradient id="wolfEarInnerAnim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1"/>
              <stop offset="100%" stopColor="#94a3b8"/>
            </linearGradient>
            <filter id="shadowAnim" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
            <filter id="glowAnim" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background */}
          <rect width="128" height="128" fill="#0f172a" rx="16"/>
          
          {/* Left Ear (pointed) */}
          <path d="M28 18 L44 50 L20 42 Z" fill="url(#wolfGradAnim)" filter="url(#shadowAnim)"/>
          <path d="M32 24 L40 44 L26 38 Z" fill="url(#wolfEarInnerAnim)"/>
          
          {/* Right Ear (pointed) */}
          <path d="M100 18 L84 50 L108 42 Z" fill="url(#wolfGradAnim)" filter="url(#shadowAnim)"/>
          <path d="M96 24 L88 44 L102 38 Z" fill="url(#wolfEarInnerAnim)"/>
          
          {/* Head main */}
          <ellipse cx="64" cy="58" rx="36" ry="32" fill="url(#wolfGradAnim)" filter="url(#shadowAnim)"/>
          
          {/* Cheek fur */}
          <path d="M30 62 Q24 68 28 74" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
          <path d="M98 62 Q104 68 100 74" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
          
          {/* Forehead markings */}
          <path d="M56 38 L64 50 L72 38" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          
          {/* Snout (long) */}
          <ellipse cx="64" cy="78" rx="20" ry="16" fill="url(#wolfLightAnim)"/>
          
          {/* Snout shading */}
          <ellipse cx="64" cy="74" rx="12" ry="8" fill="#94a3b8" opacity="0.3"/>
          
          {/* Nose */}
          <ellipse cx="64" cy="86" rx="8" ry="6" fill="#1e293b"/>
          <ellipse cx="64" cy="84" rx="4" ry="2" fill="#334155" opacity="0.5"/>
          
          {/* Nostrils */}
          <ellipse cx="61" cy="87" rx="1.5" ry="1" fill="#0f172a"/>
          <ellipse cx="67" cy="87" rx="1.5" ry="1" fill="#0f172a"/>
          
          {/* Eyes with shine */}
          <ellipse cx="48" cy="54" rx="8" ry="10" fill="#f8fafc"/>
          <ellipse cx="80" cy="54" rx="8" ry="10" fill="#f8fafc"/>
          <ellipse cx="48" cy="54" rx="5" ry="7" fill="#0f172a"/>
          <ellipse cx="80" cy="54" rx="5" ry="7" fill="#0f172a"/>
          
          {/* Eye shine */}
          <circle cx="50" cy="51" r="2.5" fill="#ffffff" filter="url(#glowAnim)"/>
          <circle cx="82" cy="51" r="2.5" fill="#ffffff" filter="url(#glowAnim)"/>
          <circle cx="46" cy="56" r="1.5" fill="#ffffff" opacity="0.5"/>
          <circle cx="78" cy="56" r="1.5" fill="#ffffff" opacity="0.5"/>
          
          {/* Eyebrows */}
          <path d="M40 44 Q48 40 56 44" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round"/>
          <path d="M72 44 Q80 40 88 44" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round"/>
          
          {/* Mouth */}
          <path d="M56 94 Q64 98 72 94" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
          <path d="M64 90 L64 96" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
          
          {/* Chin fur */}
          <path d="M58 100 Q64 104 70 100" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      
      {/* Click counter for easter egg */}
      {easterEggs && clickCount > 0 && clickCount < clickThreshold && (
        <div 
          className="absolute -top-1 -right-1 bg-slate-700 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse"
          style={{ fontSize: Math.max(10, size * 0.08) }}
        >
          {clickCount}
        </div>
      )}
      
      {/* Screen reader description */}
      <span className="sr-only">
        Wolf mascot with pointed ears and long snout. 
        {interactive && ' Click to see it celebrate!'}
        {easterEggs && ` Click ${clickThreshold} times for a special surprise.`}
      </span>
    </div>
  );
};

// Enhanced animation styles
const animationStyles = `
  @keyframes wolf-idle {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-3px) scale(1.02); }
  }
  
  @keyframes wolf-wave {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-10deg); }
    75% { transform: rotate(10deg); }
  }
  
  @keyframes wolf-celebrate {
    0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
    25% { transform: translateY(-10px) scale(1.15) rotate(-5deg); }
    50% { transform: translateY(0) scale(1) rotate(0deg); }
    75% { transform: translateY(-10px) scale(1.15) rotate(5deg); }
  }
  
  @keyframes wolf-special {
    0% { transform: scale(1) rotate(0deg); }
    10% { transform: scale(1.2) rotate(-10deg); }
    20% { transform: scale(1.2) rotate(10deg); }
    30% { transform: scale(1.2) rotate(-10deg); }
    40% { transform: scale(1.2) rotate(10deg); }
    50% { transform: scale(1.3) rotate(0deg); filter: brightness(1.3); }
    60% { transform: scale(1.2) rotate(-5deg); }
    70% { transform: scale(1.2) rotate(5deg); }
    80% { transform: scale(1.1) rotate(0deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  
  .animate-idle {
    animation: wolf-idle 2.5s ease-in-out infinite;
  }
  
  .animate-wave {
    animation: wolf-wave 0.5s ease-in-out 3;
  }
  
  .animate-celebrate {
    animation: wolf-celebrate 0.8s ease-in-out;
  }
  
  .animate-special {
    animation: wolf-special 1.5s ease-in-out;
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .animate-idle, .animate-wave, .animate-celebrate, .animate-special {
      animation: none !important;
    }
  }
`;

// Inject styles once
if (typeof document !== 'undefined') {
  const styleId = 'wolf-mascot-animated-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = animationStyles;
    document.head.appendChild(styleEl);
  }
}

export default WolfMascotAnimated;
