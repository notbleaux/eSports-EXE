/**
 * WolfMascot Component
 * [Ver001.000]
 * 
 * React component for the Wolf mascot character.
 * Features: Pointed ears, long snout, gray coloration (slate scheme)
 * 
 * @example
 * <WolfMascot size={128} animate="idle" />
 * <WolfMascot size={64} variant="minimal" />
 */

import React from 'react';

export type WolfSize = 32 | 64 | 128 | 256 | 512;
export type WolfAnimation = 'idle' | 'wave' | 'celebrate' | 'none';
export type WolfVariant = 'full' | 'minimal' | 'icon';

interface WolfMascotProps {
  /** Display size in pixels */
  size?: WolfSize;
  
  /** Animation type */
  animate?: WolfAnimation;
  
  /** Visual variant */
  variant?: WolfVariant;
  
  /** Additional CSS class */
  className?: string;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Accessible label */
  alt?: string;
  
  /** Disable interactions */
  disabled?: boolean;
  
  /** Apply glow effect */
  glow?: boolean;
  
  /** Theme override */
  theme?: 'default' | 'dark' | 'light';
}

/**
 * WolfMascot - React component for the Wolf mascot character
 * 
 * Renders an SVG-based wolf mascot with:
 * - Pointed ears characteristic of wolves
 * - Long snout for predatory appearance  
 * - Gray coloration using slate color scheme (#475569 primary)
 */
export const WolfMascot: React.FC<WolfMascotProps> = ({
  size = 128,
  animate = 'none',
  variant = 'full',
  className = '',
  onClick,
  alt = 'Wolf mascot',
  disabled = false,
  glow = false,
  theme = 'default'
}) => {
  const animationClass = animate !== 'none' ? `animate-${animate}` : '';
  const glowClass = glow ? 'drop-shadow-[0_0_20px_rgba(71,85,105,0.5)]' : '';
  const disabledClass = disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer';
  
  // Scale factor based on base 128 size
  const scale = size / 128;
  
  // Render different variants
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`inline-block ${className} ${animationClass} ${disabledClass}`}
        onClick={disabled ? undefined : onClick}
        aria-label={alt}
        role="img"
        style={{ imageRendering: 'pixelated' }}
      >
        <defs>
          <linearGradient id={`wolfGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b"/>
            <stop offset="100%" stopColor="#475569"/>
          </linearGradient>
          <linearGradient id={`wolfLight-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8"/>
            <stop offset="100%" stopColor="#64748b"/>
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="32" height="32" fill="#1e293b" rx="4"/>
        
        {/* Left Ear */}
        <path d="M8 6 L12 14 L6 12 Z" fill={`url(#wolfGradient-${size})`}/>
        
        {/* Right Ear */}
        <path d="M24 6 L20 14 L26 12 Z" fill={`url(#wolfGradient-${size})`}/>
        
        {/* Head */}
        <ellipse cx="16" cy="16" rx="9" ry="8" fill={`url(#wolfGradient-${size})`}/>
        
        {/* Snout */}
        <ellipse cx="16" cy="20" rx="5" ry="4" fill={`url(#wolfLight-${size})`}/>
        
        {/* Nose */}
        <ellipse cx="16" cy="22" rx="2" ry="1.5" fill="#1e293b"/>
        
        {/* Eyes */}
        <ellipse cx="12.5" cy="14" rx="2" ry="2.5" fill="#f8fafc"/>
        <ellipse cx="19.5" cy="14" rx="2" ry="2.5" fill="#f8fafc"/>
        <ellipse cx="12.5" cy="14" rx="1" ry="1.5" fill="#0f172a"/>
        <ellipse cx="19.5" cy="14" rx="1" ry="1.5" fill="#0f172a"/>
        
        {/* Eye shine */}
        <circle cx="13" cy="13.2" r="0.5" fill="#ffffff"/>
        <circle cx="20" cy="13.2" r="0.5" fill="#ffffff"/>
      </svg>
    );
  }
  
  if (variant === 'minimal') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className={`inline-block ${className} ${animationClass} ${glowClass} ${disabledClass}`}
        onClick={disabled ? undefined : onClick}
        aria-label={alt}
        role="img"
        style={{ imageRendering: 'pixelated' }}
      >
        <defs>
          <linearGradient id={`wolfGradMin-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b"/>
            <stop offset="50%" stopColor="#475569"/>
            <stop offset="100%" stopColor="#334155"/>
          </linearGradient>
        </defs>
        
        {/* Simplified wolf head silhouette */}
        <path
          d="M32 8 L40 24 L56 20 L48 36 L52 52 L32 44 L12 52 L16 36 L8 20 L24 24 Z"
          fill={`url(#wolfGradMin-${size})`}
          stroke="#334155"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Eyes */}
        <circle cx="24" cy="32" r="4" fill="#f8fafc"/>
        <circle cx="40" cy="32" r="4" fill="#f8fafc"/>
        <circle cx="24" cy="32" r="2" fill="#0f172a"/>
        <circle cx="40" cy="32" r="2" fill="#0f172a"/>
      </svg>
    );
  }
  
  // Full variant (default)
  return (
    <div
      className={`inline-block ${className} ${disabledClass}`}
      style={{ 
        width: size, 
        height: size,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
      onClick={disabled ? undefined : onClick}
      role="img"
      aria-label={alt}
    >
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        className={`${animationClass} ${glowClass}`}
        style={{ imageRendering: 'pixelated' }}
      >
        <defs>
          <linearGradient id="wolfGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b"/>
            <stop offset="40%" stopColor="#475569"/>
            <stop offset="100%" stopColor="#334155"/>
          </linearGradient>
          <linearGradient id="wolfLightFull" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8"/>
            <stop offset="50%" stopColor="#64748b"/>
            <stop offset="100%" stopColor="#475569"/>
          </linearGradient>
          <linearGradient id="wolfEarInnerFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1"/>
            <stop offset="100%" stopColor="#94a3b8"/>
          </linearGradient>
          <filter id="shadowFull" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Background */}
        <rect width="128" height="128" fill="#0f172a" rx="16"/>
        
        {/* Left Ear (pointed) */}
        <path d="M28 18 L44 50 L20 42 Z" fill="url(#wolfGradientFull)" filter="url(#shadowFull)"/>
        <path d="M32 24 L40 44 L26 38 Z" fill="url(#wolfEarInnerFull)"/>
        
        {/* Right Ear (pointed) */}
        <path d="M100 18 L84 50 L108 42 Z" fill="url(#wolfGradientFull)" filter="url(#shadowFull)"/>
        <path d="M96 24 L88 44 L102 38 Z" fill="url(#wolfEarInnerFull)"/>
        
        {/* Head main */}
        <ellipse cx="64" cy="58" rx="36" ry="32" fill="url(#wolfGradientFull)" filter="url(#shadowFull)"/>
        
        {/* Cheek fur */}
        <path d="M30 62 Q24 68 28 74" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
        <path d="M98 62 Q104 68 100 74" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
        
        {/* Forehead markings */}
        <path d="M56 38 L64 50 L72 38" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        
        {/* Snout (long) */}
        <ellipse cx="64" cy="78" rx="20" ry="16" fill="url(#wolfLightFull)"/>
        
        {/* Snout shading */}
        <ellipse cx="64" cy="74" rx="12" ry="8" fill="#94a3b8" opacity="0.3"/>
        
        {/* Nose */}
        <ellipse cx="64" cy="86" rx="8" ry="6" fill="#1e293b"/>
        <ellipse cx="64" cy="84" rx="4" ry="2" fill="#334155" opacity="0.5"/>
        
        {/* Nostrils */}
        <ellipse cx="61" cy="87" rx="1.5" ry="1" fill="#0f172a"/>
        <ellipse cx="67" cy="87" rx="1.5" ry="1" fill="#0f172a"/>
        
        {/* Eyes */}
        <ellipse cx="48" cy="54" rx="8" ry="10" fill="#f8fafc"/>
        <ellipse cx="80" cy="54" rx="8" ry="10" fill="#f8fafc"/>
        <ellipse cx="48" cy="54" rx="5" ry="7" fill="#0f172a"/>
        <ellipse cx="80" cy="54" rx="5" ry="7" fill="#0f172a"/>
        
        {/* Eye shine */}
        <circle cx="50" cy="51" r="2.5" fill="#ffffff"/>
        <circle cx="82" cy="51" r="2.5" fill="#ffffff"/>
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
  );
};

// CSS for animations (injected via style tag)
const animationStyles = `
  @keyframes wolf-idle {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-2px) scale(1.02); }
  }
  
  @keyframes wolf-wave {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-8deg); }
    75% { transform: rotate(8deg); }
  }
  
  @keyframes wolf-celebrate {
    0%, 100% { transform: translateY(0) scale(1); }
    25% { transform: translateY(-8px) scale(1.1); }
    50% { transform: translateY(0) scale(1); }
    75% { transform: translateY(-8px) scale(1.1); }
  }
  
  .animate-idle {
    animation: wolf-idle 2s ease-in-out infinite;
  }
  
  .animate-wave {
    animation: wolf-wave 0.6s ease-in-out 3;
  }
  
  .animate-celebrate {
    animation: wolf-celebrate 0.8s ease-in-out;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .animate-idle, .animate-wave, .animate-celebrate {
      animation: none !important;
    }
  }
`;

// Inject styles once
if (typeof document !== 'undefined') {
  const styleId = 'wolf-mascot-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = animationStyles;
    document.head.appendChild(styleEl);
  }
}

export default WolfMascot;
