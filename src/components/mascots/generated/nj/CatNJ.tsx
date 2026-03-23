/**
 * CatNJ.tsx
 * NJ Style Cat in Bunny Onesie Mascot Component
 * 
 * Minimalist line art tuxedo cat wearing a pink bunny onesie
 * Style: Electric pink stroke (#F72585), simple geometric shapes
 * Features: Playful expression, clean lines, bouncy animations
 * 
 * [Ver004.000]
 */

import React, { useMemo } from 'react';

// ===== TYPES =====

export type CatNJSize = 32 | 64 | 128 | 256 | 512;

export type CatNJAnimation = 'idle' | 'wave' | 'hop' | 'wiggle' | 'peek';

export type CatNJVariant = 'classic-pink' | 'attention' | 'onesie-pink';

export interface CatNJProps {
  /** Size of the cat mascot in pixels */
  size?: CatNJSize;
  /** Animation state */
  animation?: CatNJAnimation;
  /** Visual variant */
  variant?: CatNJVariant;
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

const VARIANT_CONFIG: Record<CatNJVariant, { stroke: string; animationClass?: string }> = {
  'classic-pink': { stroke: '#F72585' },
  'attention': { stroke: '#FF1493', animationClass: 'cat-nj-attention' },
  'onesie-pink': { stroke: '#FF69B4', animationClass: 'cat-nj-onesie-pink' },
};

// ===== SVG COMPONENTS BY SIZE =====

const CatNJ32: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 32 32" 
    width="32" 
    height="32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M6 22 Q4 18 6 14 Q8 10 12 14" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 14 Q5 12 6 10" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="16" cy="22" rx="9" ry="7" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="16" cy="23" rx="5" ry="4" fill="none" stroke={stroke} strokeWidth="1" opacity="0.6"/>
      <line x1="16" y1="16" x2="16" y2="26" stroke={stroke} strokeWidth="1" strokeDasharray="2,1"/>
      <circle cx="16" cy="15.5" r="1.2" fill={stroke}/>
    </g>
    
    <g className="arm-left">
      <ellipse cx="9" cy="20" rx="2.5" ry="4" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="8" cy="23" r="1.5" fill="none" stroke={stroke} strokeWidth="1"/>
    </g>
    <g className="arm-right">
      <ellipse cx="23" cy="20" rx="2.5" ry="4" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="24" cy="23" r="1.5" fill="none" stroke={stroke} strokeWidth="1"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="11" cy="8" rx="3" ry="6" fill="none" stroke={stroke} strokeWidth="2" transform="rotate(-15 11 8)"/>
      <ellipse cx="11" cy="8" rx="1.5" ry="3.5" fill="none" stroke={stroke} strokeWidth="1" transform="rotate(-15 11 8)" opacity="0.6"/>
      <ellipse cx="21" cy="8" rx="3" ry="6" fill="none" stroke={stroke} strokeWidth="2" transform="rotate(15 21 8)"/>
      <ellipse cx="21" cy="8" rx="1.5" ry="3.5" fill="none" stroke={stroke} strokeWidth="1" transform="rotate(15 21 8)" opacity="0.6"/>
    </g>
    
    <g className="head">
      <ellipse cx="16" cy="13" rx="8" ry="7" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="16" cy="16" rx="4" ry="3" fill="none" stroke={stroke} strokeWidth="1.5"/>
      
      <path d="M10 8 L8 4 L12 7Z" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 8 L24 4 L20 7Z" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      
      <g className="eye-left">
        <ellipse cx="13" cy="12" rx="2" ry="2.5" fill={stroke}/>
        <ellipse cx="13.3" cy="11.5" rx="0.8" ry="1" fill="#FFF"/>
      </g>
      <g className="eye-right">
        <ellipse cx="19" cy="12" rx="2" ry="2.5" fill={stroke}/>
        <ellipse cx="18.7" cy="11.5" rx="0.8" ry="1" fill="#FFF"/>
      </g>
      
      <path d="M11 9 Q13 8 14 9.5" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
      <path d="M18 9.5 Q19 8 21 9" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
      
      <ellipse cx="16" cy="15" rx="1" ry="0.7" fill={stroke}/>
      
      <path d="M14 16.5 Q16 18 18 16" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
      <path d="M17.5 16.2 L18 16 L18.3 16.5" fill="none" stroke={stroke} strokeWidth="0.8" strokeLinecap="round"/>
      
      <line x1="10" y1="15" x2="7" y2="14.5" stroke={stroke} strokeWidth="0.5" opacity="0.6"/>
      <line x1="10" y1="16" x2="7" y2="16" stroke={stroke} strokeWidth="0.5" opacity="0.6"/>
      <line x1="22" y1="15" x2="25" y2="14.5" stroke={stroke} strokeWidth="0.5" opacity="0.6"/>
      <line x1="22" y1="16" x2="25" y2="16" stroke={stroke} strokeWidth="0.5" opacity="0.6"/>
    </g>
  </svg>
);

const CatNJ64: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 64 64" 
    width="64" 
    height="64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M12 44 Q8 36 12 28 Q16 20 24 28 Q20 36 16 44 Q14 48 12 44Z" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 28 Q10 24 12 20 Q14 16 18 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 40 Q18 36 20 32" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="32" cy="44" rx="18" ry="14" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <ellipse cx="32" cy="46" rx="10" ry="8" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.6"/>
      <line x1="32" y1="32" x2="32" y2="52" stroke={stroke} strokeWidth="1.5" strokeDasharray="3,2"/>
      <circle cx="32" cy="31" r="2.5" fill={stroke}/>
      <ellipse cx="20" cy="54" rx="4" ry="3" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <ellipse cx="44" cy="54" rx="4" ry="3" fill="none" stroke={stroke} strokeWidth="1.5"/>
    </g>
    
    <g className="arm-left">
      <ellipse cx="16" cy="40" rx="5" ry="8" fill="none" stroke={stroke} strokeWidth="2"/>
      <circle cx="14" cy="46" rx="3" ry="2.5" fill="none" stroke={stroke} strokeWidth="1.5"/>
    </g>
    <g className="arm-right">
      <ellipse cx="48" cy="40" rx="5" ry="8" fill="none" stroke={stroke} strokeWidth="2"/>
      <circle cx="50" cy="46" rx="3" ry="2.5" fill="none" stroke={stroke} strokeWidth="1.5"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="22" cy="16" rx="5" ry="12" fill="none" stroke={stroke} strokeWidth="2.5" transform="rotate(-12 22 16)"/>
      <ellipse cx="22" cy="16" rx="2.5" ry="7" fill="none" stroke={stroke} strokeWidth="1.2" transform="rotate(-12 22 16)" opacity="0.6"/>
      <ellipse cx="42" cy="16" rx="5" ry="12" fill="none" stroke={stroke} strokeWidth="2.5" transform="rotate(12 42 16)"/>
      <ellipse cx="42" cy="16" rx="2.5" ry="7" fill="none" stroke={stroke} strokeWidth="1.2" transform="rotate(12 42 16)" opacity="0.6"/>
    </g>
    
    <g className="head">
      <ellipse cx="32" cy="26" rx="16" ry="14" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <ellipse cx="32" cy="32" rx="8" ry="6" fill="none" stroke={stroke} strokeWidth="2"/>
      <path d="M24 20 Q32 24 40 20" fill="none" stroke={stroke} strokeWidth="1" opacity="0.5"/>
      
      <path d="M20 18 L16 8 L24 16Z" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44 18 L48 8 L40 16Z" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      
      <g className="eye-left">
        <ellipse cx="26" cy="24" rx="4" ry="5" fill={stroke}/>
        <ellipse cx="26.5" cy="23" rx="1.5" ry="2" fill="#FFF"/>
        <circle cx="26.8" cy="25" r="0.8" fill="#FFF" opacity="0.7"/>
      </g>
      <g className="eye-right">
        <ellipse cx="38" cy="24" rx="4" ry="5" fill={stroke}/>
        <ellipse cx="37.5" cy="23" rx="1.5" ry="2" fill="#FFF"/>
        <circle cx="37.2" cy="25" r="0.8" fill="#FFF" opacity="0.7"/>
      </g>
      
      <path d="M22 18 Q26 16 30 19" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M34 19 Q38 16 42 18" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      
      <ellipse cx="32" cy="30" rx="2" ry="1.5" fill={stroke}/>
      <ellipse cx="31" cy="29.5" rx="0.6" ry="0.4" fill="#FFF" opacity="0.5"/>
      
      <path d="M28 33 Q32 36 36 32" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M35 31.5 L36 32 L36.5 33" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
      
      <line x1="20" y1="30" x2="14" y2="29" stroke={stroke} strokeWidth="0.8" opacity="0.6"/>
      <line x1="20" y1="32" x2="14" y2="32" stroke={stroke} strokeWidth="0.8" opacity="0.6"/>
      <line x1="20" y1="34" x2="14" y2="35" stroke={stroke} strokeWidth="0.8" opacity="0.6"/>
      <line x1="44" y1="30" x2="50" y2="29" stroke={stroke} strokeWidth="0.8" opacity="0.6"/>
      <line x1="44" y1="32" x2="50" y2="32" stroke={stroke} strokeWidth="0.8" opacity="0.6"/>
      <line x1="44" y1="34" x2="50" y2="35" stroke={stroke} strokeWidth="0.8" opacity="0.6"/>
    </g>
  </svg>
);

const CatNJ128: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 128 128" 
    width="128" 
    height="128"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M24 88 Q16 72 24 56 Q32 40 48 56 Q40 72 32 88 Q28 96 24 88Z" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 56 Q20 48 24 40 Q28 32 36 40" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 84 Q36 76 40 68" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M32 72 Q38 66 42 60" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="64" cy="88" rx="36" ry="28" fill="none" stroke={stroke} strokeWidth="3"/>
      <ellipse cx="64" cy="92" rx="20" ry="16" fill="none" stroke={stroke} strokeWidth="2" opacity="0.6"/>
      <line x1="64" y1="64" x2="64" y2="104" stroke={stroke} strokeWidth="2" strokeDasharray="4,3"/>
      <circle cx="64" cy="62" r="4" fill={stroke}/>
      <path d="M40 110 Q64 118 88 110" stroke={stroke} strokeWidth="3" fill="none"/>
      <ellipse cx="40" cy="108" rx="8" ry="6" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="88" cy="108" rx="8" ry="6" fill="none" stroke={stroke} strokeWidth="2"/>
    </g>
    
    <g className="arm-left">
      <path d="M32 80 Q24 88 28 96 Q32 104 40 96" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="30" cy="94" rx="5" ry="4" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="30" cy="95" rx="2" ry="1.5" fill={stroke} opacity="0.5"/>
    </g>
    <g className="arm-right">
      <path d="M96 80 Q104 88 100 96 Q96 104 88 96" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="98" cy="94" rx="5" ry="4" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="98" cy="95" rx="2" ry="1.5" fill={stroke} opacity="0.5"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="44" cy="32" rx="10" ry="24" fill="none" stroke={stroke} strokeWidth="3" transform="rotate(-10 44 32)"/>
      <ellipse cx="44" cy="32" rx="5" ry="14" fill="none" stroke={stroke} strokeWidth="1.5" transform="rotate(-10 44 32)" opacity="0.6"/>
      <path d="M44 18 L42 28 L46 28Z" fill={stroke} opacity="0.3" transform="rotate(-10 44 32)"/>
      
      <ellipse cx="84" cy="32" rx="10" ry="24" fill="none" stroke={stroke} strokeWidth="3" transform="rotate(10 84 32)"/>
      <ellipse cx="84" cy="32" rx="5" ry="14" fill="none" stroke={stroke} strokeWidth="1.5" transform="rotate(10 84 32)" opacity="0.6"/>
      <path d="M84 18 L82 28 L86 28Z" fill={stroke} opacity="0.3" transform="rotate(10 84 32)"/>
    </g>
    
    <g className="head">
      <ellipse cx="64" cy="52" rx="32" ry="28" fill="none" stroke={stroke} strokeWidth="3"/>
      <path d="M48 44 Q64 40 80 44" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.4"/>
      <ellipse cx="64" cy="64" rx="16" ry="12" fill="none" stroke={stroke} strokeWidth="2.5"/>
      
      <path d="M40 36 L32 16 L48 32Z" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M40 28 L36 20 L44 26Z" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <path d="M88 36 L96 16 L80 32Z" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M88 28 L92 20 L84 26Z" fill="none" stroke={stroke} strokeWidth="1.5"/>
      
      <g className="eye-left">
        <ellipse cx="52" cy="48" rx="8" ry="10" fill={stroke}/>
        <ellipse cx="53" cy="46" rx="3" ry="4" fill="#FFF"/>
        <circle cx="54" cy="50" r="1.5" fill="#FFF" opacity="0.7"/>
      </g>
      <g className="eye-right">
        <ellipse cx="76" cy="48" rx="8" ry="10" fill={stroke}/>
        <ellipse cx="75" cy="46" rx="3" ry="4" fill="#FFF"/>
        <circle cx="74" cy="50" r="1.5" fill="#FFF" opacity="0.7"/>
      </g>
      
      <path d="M44 38 Q52 36 58 40" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M70 40 Q76 36 84 38" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      
      <ellipse cx="64" cy="60" rx="4" ry="3" fill={stroke}/>
      <ellipse cx="62" cy="59" rx="1.2" ry="0.8" fill="#FFF" opacity="0.5"/>
      
      <path d="M56 66 Q64 72 72 64" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M70 63 L72 64 L71 67" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      
      <line x1="40" y1="60" x2="28" y2="58" stroke={stroke} strokeWidth="1" opacity="0.6"/>
      <line x1="40" y1="64" x2="28" y2="64" stroke={stroke} strokeWidth="1" opacity="0.6"/>
      <line x1="40" y1="68" x2="28" y2="70" stroke={stroke} strokeWidth="1" opacity="0.6"/>
      <line x1="88" y1="60" x2="100" y2="58" stroke={stroke} strokeWidth="1" opacity="0.6"/>
      <line x1="88" y1="64" x2="100" y2="64" stroke={stroke} strokeWidth="1" opacity="0.6"/>
      <line x1="88" y1="68" x2="100" y2="70" stroke={stroke} strokeWidth="1" opacity="0.6"/>
      
      <ellipse cx="48" cy="56" rx="3" ry="2" fill={stroke} opacity="0.3"/>
      <ellipse cx="80" cy="56" rx="3" ry="2" fill={stroke} opacity="0.3"/>
    </g>
  </svg>
);

const CatNJ256: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 256 256" 
    width="256" 
    height="256"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M48 176 Q32 144 48 112 Q64 80 96 96 Q80 128 64 160 Q56 176 48 176Z" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M48 112 Q40 96 48 80 Q56 64 72 80" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
      <path d="M56 168 Q72 156 80 140" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M64 152 Q76 142 84 130" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <path d="M72 136 Q82 128 88 118" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="128" cy="176" rx="72" ry="56" fill="none" stroke={stroke} strokeWidth="4"/>
      <ellipse cx="128" cy="184" rx="40" ry="32" fill="none" stroke={stroke} strokeWidth="2.5" opacity="0.6"/>
      <line x1="128" y1="128" x2="128" y2="208" stroke={stroke} strokeWidth="3" strokeDasharray="6,4"/>
      <circle cx="128" cy="124" r="8" fill={stroke}/>
      <rect x="124" y="132" width="8" height="16" fill={stroke} opacity="0.5"/>
      <path d="M80 220 Q128 232 176 220" stroke={stroke} strokeWidth="6" fill="none"/>
      <line x1="96" y1="220" x2="96" y2="226" stroke={stroke} strokeWidth="2"/>
      <line x1="128" y1="224" x2="128" y2="230" stroke={stroke} strokeWidth="2"/>
      <line x1="160" y1="220" x2="160" y2="226" stroke={stroke} strokeWidth="2"/>
    </g>
    
    <g className="arm-left">
      <path d="M64 160 Q48 176 56 192 Q64 208 80 192" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="58" y="184" width="16" height="8" fill="none" stroke={stroke} strokeWidth="2" rx="2"/>
      <ellipse cx="60" cy="190" rx="10" ry="8" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <ellipse cx="56" cy="188" rx="2.5" ry="2" fill={stroke} opacity="0.5"/>
      <ellipse cx="60" cy="192" rx="2.5" ry="2" fill={stroke} opacity="0.5"/>
      <ellipse cx="64" cy="188" rx="2.5" ry="2" fill={stroke} opacity="0.5"/>
    </g>
    <g className="arm-right">
      <path d="M192 160 Q208 176 200 192 Q192 208 176 192" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="182" y="184" width="16" height="8" fill="none" stroke={stroke} strokeWidth="2" rx="2"/>
      <ellipse cx="196" cy="190" rx="10" ry="8" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <ellipse cx="192" cy="188" rx="2.5" ry="2" fill={stroke} opacity="0.5"/>
      <ellipse cx="196" cy="192" rx="2.5" ry="2" fill={stroke} opacity="0.5"/>
      <ellipse cx="200" cy="188" rx="2.5" ry="2" fill={stroke} opacity="0.5"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="88" cy="64" rx="20" ry="48" fill="none" stroke={stroke} strokeWidth="4" transform="rotate(-8 88 64)"/>
      <ellipse cx="88" cy="64" rx="10" ry="28" fill="none" stroke={stroke} strokeWidth="2" transform="rotate(-8 88 64)" opacity="0.6"/>
      <path d="M88 32 L84 56 L92 56Z" fill={stroke} opacity="0.25" transform="rotate(-8 88 64)"/>
      <ellipse cx="88" cy="88" rx="12" ry="8" fill={stroke} opacity="0.15" transform="rotate(-8 88 64)"/>
      
      <ellipse cx="168" cy="64" rx="20" ry="48" fill="none" stroke={stroke} strokeWidth="4" transform="rotate(8 168 64)"/>
      <ellipse cx="168" cy="64" rx="10" ry="28" fill="none" stroke={stroke} strokeWidth="2" transform="rotate(8 168 64)" opacity="0.6"/>
      <path d="M168 32 L164 56 L172 56Z" fill={stroke} opacity="0.25" transform="rotate(8 168 64)"/>
      <ellipse cx="168" cy="88" rx="12" ry="8" fill={stroke} opacity="0.15" transform="rotate(8 168 64)"/>
    </g>
    
    <g className="head">
      <ellipse cx="128" cy="104" rx="64" ry="56" fill="none" stroke={stroke} strokeWidth="4"/>
      <path d="M96 88 Q128 80 160 88" fill="none" stroke={stroke} strokeWidth="2" opacity="0.4"/>
      <path d="M104 96 Q128 100 152 96" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.3"/>
      <ellipse cx="128" cy="128" rx="32" ry="24" fill="none" stroke={stroke} strokeWidth="3"/>
      <path d="M112 72 Q128 80 144 72" fill="none" stroke={stroke} strokeWidth="2" opacity="0.5"/>
      
      <path d="M80 72 L64 32 L96 64Z" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M80 56 L72 40 L88 52Z" fill="none" stroke={stroke} strokeWidth="2"/>
      <path d="M176 72 L192 32 L160 64Z" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M176 56 L184 40 L168 52Z" fill="none" stroke={stroke} strokeWidth="2"/>
      
      <g className="eye-left">
        <ellipse cx="104" cy="96" rx="16" ry="20" fill={stroke}/>
        <ellipse cx="106" cy="92" rx="6" ry="8" fill="#FFF"/>
        <circle cx="108" cy="98" rx="2.5" fill="#FFF" opacity="0.7"/>
      </g>
      <g className="eye-right">
        <ellipse cx="152" cy="96" rx="16" ry="20" fill={stroke}/>
        <ellipse cx="150" cy="92" rx="6" ry="8" fill="#FFF"/>
        <circle cx="148" cy="98" rx="2.5" fill="#FFF" opacity="0.7"/>
      </g>
      
      <path d="M88 76 Q104 72 116 80" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
      <path d="M140 80 Q152 72 168 76" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
      
      <ellipse cx="128" cy="120" rx="8" ry="6" fill={stroke}/>
      <ellipse cx="124" cy="118" rx="2.5" ry="1.5" fill="#FFF" opacity="0.5"/>
      
      <path d="M112 132 Q128 144 144 128" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
      <path d="M140 126 L144 128 L142 134" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      
      <line x1="80" y1="120" x2="56" y2="116" stroke={stroke} strokeWidth="1.5" opacity="0.6"/>
      <line x1="80" y1="128" x2="56" y2="128" stroke={stroke} strokeWidth="1.5" opacity="0.6"/>
      <line x1="80" y1="136" x2="56" y2="140" stroke={stroke} strokeWidth="1.5" opacity="0.6"/>
      <line x1="176" y1="120" x2="200" y2="116" stroke={stroke} strokeWidth="1.5" opacity="0.6"/>
      <line x1="176" y1="128" x2="200" y2="128" stroke={stroke} strokeWidth="1.5" opacity="0.6"/>
      <line x1="176" y1="136" x2="200" y2="140" stroke={stroke} strokeWidth="1.5" opacity="0.6"/>
      
      <ellipse cx="96" cy="112" rx="6" ry="4" fill={stroke} opacity="0.3"/>
      <ellipse cx="160" cy="112" rx="6" ry="4" fill={stroke} opacity="0.3"/>
    </g>
  </svg>
);

const CatNJ512: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 512 512" 
    width="512" 
    height="512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M96 352 Q64 288 96 224 Q128 160 192 192 Q160 256 128 320 Q112 352 96 352Z" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M96 224 Q80 192 96 160 Q112 128 144 160" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"/>
      <path d="M112 336 Q144 312 160 280" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M128 304 Q152 284 168 260" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <path d="M144 280 Q164 264 176 244" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
      <path d="M72 280 Q100 260 116 236" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="256" cy="352" rx="144" ry="112" fill="none" stroke={stroke} strokeWidth="5"/>
      <ellipse cx="256" cy="368" rx="80" ry="64" fill="none" stroke={stroke} strokeWidth="3" opacity="0.6"/>
      <path d="M224 352 Q256 360 288 352" fill="none" stroke={stroke} strokeWidth="2" opacity="0.3"/>
      <path d="M208 368 Q256 384 304 368" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.25"/>
      <line x1="256" y1="256" x2="256" y2="416" stroke={stroke} strokeWidth="4" strokeDasharray="8,6"/>
      <circle cx="256" cy="248" r="16" fill={stroke}/>
      <rect x="248" y="264" width="16" height="32" fill={stroke} opacity="0.5"/>
      <path d="M160 440 Q256 464 352 440" stroke={stroke} strokeWidth="8" fill="none"/>
      <line x1="176" y1="440" x2="176" y2="452" stroke={stroke} strokeWidth="2.5"/>
      <line x1="208" y1="444" x2="208" y2="456" stroke={stroke} strokeWidth="2.5"/>
      <line x1="256" y1="448" x2="256" y2="460" stroke={stroke} strokeWidth="2.5"/>
      <line x1="304" y1="444" x2="304" y2="456" stroke={stroke} strokeWidth="2.5"/>
      <line x1="336" y1="440" x2="336" y2="452" stroke={stroke} strokeWidth="2.5"/>
    </g>
    
    <g className="arm-left">
      <path d="M128 320 Q96 352 112 384 Q128 416 160 384" fill="none" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="116" y="368" width="32" height="16" fill="none" stroke={stroke} strokeWidth="3" rx="4"/>
      <ellipse cx="120" cy="380" rx="20" ry="16" fill="none" stroke={stroke} strokeWidth="3"/>
      <ellipse cx="112" cy="376" rx="5" ry="4" fill={stroke} opacity="0.5"/>
      <ellipse cx="120" cy="384" rx="5" ry="4" fill={stroke} opacity="0.5"/>
      <ellipse cx="128" cy="376" rx="5" ry="4" fill={stroke} opacity="0.5"/>
      <ellipse cx="120" cy="370" rx="4" ry="3" fill={stroke} opacity="0.5"/>
    </g>
    <g className="arm-right">
      <path d="M384 320 Q416 352 400 384 Q384 416 352 384" fill="none" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="364" y="368" width="32" height="16" fill="none" stroke={stroke} strokeWidth="3" rx="4"/>
      <ellipse cx="392" cy="380" rx="20" ry="16" fill="none" stroke={stroke} strokeWidth="3"/>
      <ellipse cx="384" cy="376" rx="5" ry="4" fill={stroke} opacity="0.5"/>
      <ellipse cx="392" cy="384" rx="5" ry="4" fill={stroke} opacity="0.5"/>
      <ellipse cx="400" cy="376" rx="5" ry="4" fill={stroke} opacity="0.5"/>
      <ellipse cx="392" cy="370" rx="4" ry="3" fill={stroke} opacity="0.5"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="176" cy="128" rx="40" ry="96" fill="none" stroke={stroke} strokeWidth="5" transform="rotate(-6 176 128)"/>
      <ellipse cx="176" cy="128" rx="20" ry="56" fill="none" stroke={stroke} strokeWidth="2.5" transform="rotate(-6 176 128)" opacity="0.6"/>
      <path d="M176 64 L168 112 L184 112Z" fill={stroke} opacity="0.25" transform="rotate(-6 176 128)"/>
      <ellipse cx="176" cy="176" rx="24" ry="16" fill={stroke} opacity="0.15" transform="rotate(-6 176 128)"/>
      <path d="M160 144 Q176 152 192 144" fill="none" stroke={stroke} strokeWidth="3" opacity="0.4" transform="rotate(-6 176 128)"/>
      
      <ellipse cx="336" cy="128" rx="40" ry="96" fill="none" stroke={stroke} strokeWidth="5" transform="rotate(6 336 128)"/>
      <ellipse cx="336" cy="128" rx="20" ry="56" fill="none" stroke={stroke} strokeWidth="2.5" transform="rotate(6 336 128)" opacity="0.6"/>
      <path d="M336 64 L328 112 L344 112Z" fill={stroke} opacity="0.25" transform="rotate(6 336 128)"/>
      <ellipse cx="336" cy="176" rx="24" ry="16" fill={stroke} opacity="0.15" transform="rotate(6 336 128)"/>
      <path d="M320 144 Q336 152 352 144" fill="none" stroke={stroke} strokeWidth="3" opacity="0.4" transform="rotate(6 336 128)"/>
    </g>
    
    <g className="head">
      <ellipse cx="256" cy="208" rx="128" ry="112" fill="none" stroke={stroke} strokeWidth="5"/>
      <path d="M192 176 Q256 160 320 176" fill="none" stroke={stroke} strokeWidth="2.5" opacity="0.4"/>
      <path d="M208 192 Q256 200 304 192" fill="none" stroke={stroke} strokeWidth="2" opacity="0.3"/>
      <path d="M216 208 Q256 214 296 208" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.25"/>
      <ellipse cx="256" cy="256" rx="64" ry="48" fill="none" stroke={stroke} strokeWidth="4"/>
      <path d="M224 144 Q256 160 288 144" fill="none" stroke={stroke} strokeWidth="3" opacity="0.5"/>
      
      <path d="M160 144 L128 64 L192 128Z" fill="none" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M160 112 L144 80 L176 104Z" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <path d="M352 144 L384 64 L320 128Z" fill="none" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M352 112 L368 80 L336 104Z" fill="none" stroke={stroke} strokeWidth="2.5"/>
      
      <g className="eye-left">
        <ellipse cx="208" cy="192" rx="32" ry="40" fill={stroke}/>
        <ellipse cx="212" cy="184" rx="12" ry="16" fill="#FFF"/>
        <circle cx="216" cy="196" rx="5" fill="#FFF" opacity="0.7"/>
        <ellipse cx="220" cy="180" rx="4" ry="5" fill="#FFF" opacity="0.5"/>
      </g>
      <g className="eye-right">
        <ellipse cx="304" cy="192" rx="32" ry="40" fill={stroke}/>
        <ellipse cx="300" cy="184" rx="12" ry="16" fill="#FFF"/>
        <circle cx="296" cy="196" rx="5" fill="#FFF" opacity="0.7"/>
        <ellipse cx="292" cy="180" rx="4" ry="5" fill="#FFF" opacity="0.5"/>
      </g>
      
      <path d="M176 152 Q208 144 232 160" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"/>
      <path d="M280 160 Q304 144 336 152" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"/>
      <path d="M184 156 Q208 150 224 160" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M288 160 Q304 150 328 156" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      
      <ellipse cx="256" cy="240" rx="16" ry="12" fill={stroke}/>
      <ellipse cx="248" cy="236" rx="5" ry="3" fill="#FFF" opacity="0.5"/>
      <ellipse cx="260" cy="234" rx="3" ry="2" fill="#FFB6C1" opacity="0.8"/>
      
      <path d="M224 264 Q256 288 288 256" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"/>
      <path d="M280 252 L288 256 L284 268" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      
      <line x1="160" y1="240" x2="112" y2="232" stroke={stroke} strokeWidth="2" opacity="0.6"/>
      <line x1="160" y1="256" x2="112" y2="256" stroke={stroke} strokeWidth="2" opacity="0.6"/>
      <line x1="160" y1="272" x2="112" y2="280" stroke={stroke} strokeWidth="2" opacity="0.6"/>
      <line x1="352" y1="240" x2="400" y2="232" stroke={stroke} strokeWidth="2" opacity="0.6"/>
      <line x1="352" y1="256" x2="400" y2="256" stroke={stroke} strokeWidth="2" opacity="0.6"/>
      <line x1="352" y1="272" x2="400" y2="280" stroke={stroke} strokeWidth="2" opacity="0.6"/>
      <line x1="164" y1="248" x2="120" y2="244" stroke={stroke} strokeWidth="1.5" opacity="0.4"/>
      <line x1="348" y1="248" x2="392" y2="244" stroke={stroke} strokeWidth="1.5" opacity="0.4"/>
      
      <ellipse cx="192" cy="224" rx="12" ry="8" fill={stroke} opacity="0.3"/>
      <ellipse cx="320" cy="224" rx="12" ry="8" fill={stroke} opacity="0.3"/>
    </g>
  </svg>
);

// ===== MAIN COMPONENT =====

export const CatNJ: React.FC<CatNJProps> = ({
  size = 128,
  animation = 'idle',
  variant = 'classic-pink',
  className = '',
  onClick,
  alt = 'Playful line art cat in bunny onesie',
  hoverable = true,
  strokeColor,
}) => {
  // Get variant configuration
  const variantConfig = VARIANT_CONFIG[variant];
  const stroke = strokeColor || variantConfig.stroke;
  
  // Memoize the SVG component based on size
  const SvgComponent = useMemo(() => {
    switch (size) {
      case 32: return CatNJ32;
      case 64: return CatNJ64;
      case 128: return CatNJ128;
      case 256: return CatNJ256;
      case 512: return CatNJ512;
      default: return CatNJ128;
    }
  }, [size]);

  // Build class names
  const containerClasses = [
    'cat-nj-container',
    `cat-nj-size-${size}`,
    `cat-nj-${animation}`,
    `cat-nj-${variant}`,
    variantConfig.animationClass || '',
    hoverable ? 'cat-nj-hoverable' : '',
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

export default CatNJ;

// Named exports for convenience
export { CatNJ as NJCat };
export { CatNJ as CatInOnesieNJ };
