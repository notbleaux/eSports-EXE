/**
 * WolfNJ.tsx
 * NJ Style Wolf Mascot Component
 * 
 * Mysterious wolf rendered in minimalist line art
 * Style: Electric blue stroke, simple geometric shapes
 * Features: Piercing gaze, sharp angles, sleek form
 * 
 * [Ver004.000]
 */

import React, { useMemo } from 'react';

// ===== TYPES =====

export type WolfNJSize = 32 | 64 | 128 | 256 | 512;

export type WolfNJAnimation = 'idle' | 'howl' | 'prowl';

export type WolfNJVariant = 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';

export interface WolfNJProps {
  /** Size of the wolf mascot in pixels */
  size?: WolfNJSize;
  /** Animation state */
  animation?: WolfNJAnimation;
  /** Visual variant */
  variant?: WolfNJVariant;
  /** Additional CSS class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether to apply hover effects */
  hoverable?: boolean;
  /** Custom stroke color (overrides variant) */
  strokeColor?: string;
}

// ===== VARIANT CONFIGURATION =====

const VARIANT_CONFIG: Record<WolfNJVariant, { stroke: string; animationClass?: string }> = {
  'classic-blue': { stroke: '#0000FF' },
  'attention': { stroke: '#0066FF', animationClass: 'wolf-nj-attention' },
  'hype-boy': { stroke: '#00AAFF', animationClass: 'wolf-nj-hype-boy' },
  'cookie': { stroke: '#4444FF', animationClass: 'wolf-nj-cookie' },
  'ditto': { stroke: '#6666FF', animationClass: 'wolf-nj-ditto' },
};

// ===== SVG COMPONENTS BY SIZE =====

const WolfNJ32: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 32 32" 
    width="32" 
    height="32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M4 20 Q2 16 4 12 Q6 8 10 10" 
            fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 12 Q3 10 4 8" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
    </g>
    
    <g className="body">
      <path d="M10 22 Q10 16 16 15 Q22 14 26 18 Q28 22 26 26 Q24 30 18 29 Q12 28 10 22Z" 
            fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    
    <g className="head">
      <path d="M12 10 L10 4 L14 8" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M20 10 L22 4 L18 8" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <ellipse cx="16" cy="10" rx="5" ry="4" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="16" cy="12" rx="2.5" ry="1.5" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <ellipse cx="14" cy="9" rx="1.5" ry="2" fill={stroke}/>
      <ellipse cx="14.2" cy="8.7" rx="0.5" ry="0.7" fill="#FFF"/>
      <ellipse cx="18" cy="9" rx="1.5" ry="2" fill={stroke}/>
      <ellipse cx="17.8" cy="8.7" rx="0.5" ry="0.7" fill="#FFF"/>
      <path d="M13 6 Q14.5 5.5 16 6" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
      <path d="M16 6 Q17.5 5.5 19 6" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
    </g>
    
    <g className="paw-left">
      <circle cx="12" cy="26" r="2" fill="none" stroke={stroke} strokeWidth="1.5"/>
    </g>
    <g className="paw-right">
      <circle cx="24" cy="26" r="2" fill="none" stroke={stroke} strokeWidth="1.5"/>
    </g>
  </svg>
);

const WolfNJ64: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 64 64" 
    width="64" 
    height="64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M8 40 Q4 32 8 24 Q12 16 20 20" 
            fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 24 Q6 20 8 16" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 36 Q14 32 16 28" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </g>
    
    <g className="body">
      <path d="M20 44 Q20 32 32 30 Q44 28 52 36 Q56 44 52 52 Q48 60 36 58 Q24 56 20 44Z" 
            fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 38 Q32 42 36 38" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    </g>
    
    <g className="head">
      <path d="M24 20 L20 8 L28 16" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M40 20 L44 8 L36 16" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <ellipse cx="32" cy="20" rx="10" ry="8" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="32" cy="24" rx="5" ry="3" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="28" cy="18" rx="3" ry="4" fill={stroke}/>
      <ellipse cx="28.5" cy="17.5" rx="1.2" ry="1.5" fill="#FFF"/>
      <ellipse cx="36" cy="18" rx="3" ry="4" fill={stroke}/>
      <ellipse cx="35.5" cy="17.5" rx="1.2" ry="1.5" fill="#FFF"/>
      <path d="M26 12 Q29 11 32 12" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 12 Q35 11 38 12" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M28 26 Q32 28 36 25" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    </g>
    
    <g className="paw-left">
      <circle cx="24" cy="52" r="4" fill="none" stroke={stroke} strokeWidth="2"/>
      <line x1="22" y1="50" x2="22" y2="54" stroke={stroke} strokeWidth="1"/>
      <line x1="24" y1="49" x2="24" y2="55" stroke={stroke} strokeWidth="1"/>
      <line x1="26" y1="50" x2="26" y2="54" stroke={stroke} strokeWidth="1"/>
    </g>
    <g className="paw-right">
      <circle cx="48" cy="52" r="4" fill="none" stroke={stroke} strokeWidth="2"/>
      <line x1="46" y1="50" x2="46" y2="54" stroke={stroke} strokeWidth="1"/>
      <line x1="48" y1="49" x2="48" y2="55" stroke={stroke} strokeWidth="1"/>
      <line x1="50" y1="50" x2="50" y2="54" stroke={stroke} strokeWidth="1"/>
    </g>
  </svg>
);

const WolfNJ128: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 128 128" 
    width="128" 
    height="128"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M16 80 Q8 64 16 48 Q24 32 40 40" 
            fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 48 Q12 40 16 32" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 72 Q28 64 32 56" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M24 64 Q30 58 34 52" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="body">
      <path d="M40 88 Q40 64 64 60 Q88 56 104 72 Q112 88 104 104 Q96 120 72 116 Q48 112 40 88Z" 
            fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M56 76 Q64 84 72 76" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <path d="M58 82 Q64 88 70 82" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="head">
      <path d="M48 40 L40 16 L56 32" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M80 40 L88 16 L72 32" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <ellipse cx="64" cy="40" rx="20" ry="16" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <ellipse cx="64" cy="48" rx="10" ry="6" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <ellipse cx="56" cy="36" rx="6" ry="8" fill={stroke}/>
      <ellipse cx="57" cy="35" rx="2.5" ry="3.5" fill="#FFF"/>
      <ellipse cx="72" cy="36" rx="6" ry="8" fill={stroke}/>
      <ellipse cx="71" cy="35" rx="2.5" ry="3.5" fill="#FFF"/>
      <path d="M52 24 Q58 22 64 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M64 24 Q70 22 76 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M56 52 Q64 56 72 50" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M52 32 Q56 34 60 32" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M68 32 Q72 34 76 32" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="paw-left">
      <circle cx="48" cy="104" r="8" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <line x1="44" y1="100" x2="44" y2="108" stroke={stroke} strokeWidth="1.5"/>
      <line x1="48" y1="98" x2="48" y2="110" stroke={stroke} strokeWidth="1.5"/>
      <line x1="52" y1="100" x2="52" y2="108" stroke={stroke} strokeWidth="1.5"/>
    </g>
    <g className="paw-right">
      <circle cx="96" cy="104" r="8" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <line x1="92" y1="100" x2="92" y2="108" stroke={stroke} strokeWidth="1.5"/>
      <line x1="96" y1="98" x2="96" y2="110" stroke={stroke} strokeWidth="1.5"/>
      <line x1="100" y1="100" x2="100" y2="108" stroke={stroke} strokeWidth="1.5"/>
    </g>
  </svg>
);

const WolfNJ256: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 256 256" 
    width="256" 
    height="256"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M32 160 Q16 128 32 96 Q48 64 80 80" 
            fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32 96 Q24 80 32 64" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M40 144 Q56 128 64 112" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M48 128 Q60 116 68 104" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
      <path d="M56 112 Q66 102 72 92" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    </g>
    
    <g className="body">
      <path d="M80 176 Q80 128 128 120 Q176 112 208 144 Q224 176 208 208 Q192 240 144 232 Q96 224 80 176Z" 
            fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M96 152 Q104 144 112 152" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M144 152 Q152 144 160 152" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M112 152 Q128 168 144 152" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M116 164 Q128 176 140 164" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="head">
      <path d="M96 80 L80 32 L112 64" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M160 80 L176 32 L144 64" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <ellipse cx="128" cy="80" rx="40" ry="32" fill="none" stroke={stroke} strokeWidth="3"/>
      <ellipse cx="128" cy="96" rx="20" ry="12" fill="none" stroke={stroke} strokeWidth="3"/>
      <ellipse cx="112" cy="72" rx="12" ry="16" fill={stroke}/>
      <ellipse cx="114" cy="70" rx="5" ry="7" fill="#FFF"/>
      <ellipse cx="144" cy="72" rx="12" ry="16" fill={stroke}/>
      <ellipse cx="142" cy="70" rx="5" ry="7" fill="#FFF"/>
      <path d="M104 48 Q116 44 128 48" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M128 48 Q140 44 152 48" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M112 104 Q128 112 144 100" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M104 64 Q112 68 120 64" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M136 64 Q144 68 152 64" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="paw-left">
      <circle cx="96" cy="208" r="16" fill="none" stroke={stroke} strokeWidth="3"/>
      <line x1="88" y1="200" x2="88" y2="216" stroke={stroke} strokeWidth="2"/>
      <line x1="96" y1="196" x2="96" y2="220" stroke={stroke} strokeWidth="2"/>
      <line x1="104" y1="200" x2="104" y2="216" stroke={stroke} strokeWidth="2"/>
    </g>
    <g className="paw-right">
      <circle cx="192" cy="208" r="16" fill="none" stroke={stroke} strokeWidth="3"/>
      <line x1="184" y1="200" x2="184" y2="216" stroke={stroke} strokeWidth="2"/>
      <line x1="192" y1="196" x2="192" y2="220" stroke={stroke} strokeWidth="2"/>
      <line x1="200" y1="200" x2="200" y2="216" stroke={stroke} strokeWidth="2"/>
    </g>
  </svg>
);

const WolfNJ512: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 512 512" 
    width="512" 
    height="512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M64 320 Q32 256 64 192 Q96 128 160 160" 
            fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M64 192 Q48 160 64 128" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M80 288 Q112 256 128 224" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <path d="M96 256 Q120 232 136 208" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M112 224 Q132 204 144 184" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" opacity="0.35"/>
      <path d="M128 192 Q144 176 152 160" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    </g>
    
    <g className="body">
      <path d="M160 352 Q160 256 256 240 Q352 224 416 288 Q448 352 416 416 Q384 480 288 464 Q192 448 160 352Z" 
            fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M192 304 Q208 288 224 304" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M288 304 Q304 288 320 304" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M224 304 Q256 336 288 304" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M232 328 Q256 352 280 328" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <path d="M240 352 Q256 368 272 352" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
    </g>
    
    <g className="head">
      <path d="M192 160 L160 64 L224 128" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M320 160 L352 64 L288 128" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <ellipse cx="256" cy="160" rx="80" ry="64" fill="none" stroke={stroke} strokeWidth="4"/>
      <ellipse cx="256" cy="192" rx="40" ry="24" fill="none" stroke={stroke} strokeWidth="4"/>
      <ellipse cx="224" cy="144" rx="24" ry="32" fill={stroke}/>
      <ellipse cx="228" cy="140" rx="10" ry="14" fill="#FFF"/>
      <ellipse cx="288" cy="144" rx="24" ry="32" fill={stroke}/>
      <ellipse cx="284" cy="140" rx="10" ry="14" fill="#FFF"/>
      <path d="M208 96 Q232 88 256 96" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M256 96 Q280 88 304 96" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M224 208 Q256 224 288 200" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M208 128 Q224 136 240 128" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M272 128 Q288 136 304 128" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="paw-left">
      <circle cx="192" cy="416" r="32" fill="none" stroke={stroke} strokeWidth="4"/>
      <line x1="176" y1="400" x2="176" y2="432" stroke={stroke} strokeWidth="3"/>
      <line x1="192" y1="392" x2="192" y2="440" stroke={stroke} strokeWidth="3"/>
      <line x1="208" y1="400" x2="208" y2="432" stroke={stroke} strokeWidth="3"/>
    </g>
    <g className="paw-right">
      <circle cx="384" cy="416" r="32" fill="none" stroke={stroke} strokeWidth="4"/>
      <line x1="368" y1="400" x2="368" y2="432" stroke={stroke} strokeWidth="3"/>
      <line x1="384" y1="392" x2="384" y2="440" stroke={stroke} strokeWidth="3"/>
      <line x1="400" y1="400" x2="400" y2="432" stroke={stroke} strokeWidth="3"/>
    </g>
  </svg>
);

// ===== MAIN COMPONENT =====

export const WolfNJ: React.FC<WolfNJProps> = ({
  size = 128,
  animation = 'idle',
  variant = 'classic-blue',
  className = '',
  onClick,
  alt = 'Minimalist line art wolf mascot',
  hoverable = true,
  strokeColor,
}) => {
  // Get variant configuration
  const variantConfig = VARIANT_CONFIG[variant];
  const stroke = strokeColor || variantConfig.stroke;
  
  // Memoize the SVG component based on size
  const SvgComponent = useMemo(() => {
    switch (size) {
      case 32: return WolfNJ32;
      case 64: return WolfNJ64;
      case 128: return WolfNJ128;
      case 256: return WolfNJ256;
      case 512: return WolfNJ512;
      default: return WolfNJ128;
    }
  }, [size]);

  // Build class names
  const containerClasses = [
    'wolf-nj-container',
    `wolf-nj-size-${size}`,
    `wolf-nj-${animation}`,
    `wolf-nj-${variant}`,
    variantConfig.animationClass || '',
    hoverable ? 'wolf-nj-hoverable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClasses}
      onClick={onClick}
      role="img"
      aria-label={alt}
      style={{ 
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <SvgComponent stroke={stroke} />
    </div>
  );
};

// ===== EXPORTS =====

export default WolfNJ;

// Named exports for convenience
export { WolfNJ as NJWolf };
