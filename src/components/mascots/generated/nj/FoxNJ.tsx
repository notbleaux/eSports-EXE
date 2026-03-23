/**
 * FoxNJ.tsx
 * NJ Style Fox Mascot Component
 * 
 * Minimalist line art fox with clever expression
 * Style: Electric blue stroke, simple geometric shapes
 * 
 * [Ver004.000]
 */

import React, { useMemo } from 'react';

// ===== TYPES =====

export type FoxNJSize = 32 | 64 | 128 | 256 | 512;

export type FoxNJAnimation = 'idle' | 'wave' | 'celebrate';

export type FoxNJVariant = 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';

export interface FoxNJProps {
  /** Size of the fox mascot in pixels */
  size?: FoxNJSize;
  /** Animation state */
  animation?: FoxNJAnimation;
  /** Visual variant */
  variant?: FoxNJVariant;
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

const VARIANT_CONFIG: Record<FoxNJVariant, { stroke: string; animationClass?: string }> = {
  'classic-blue': { stroke: '#0000FF' },
  'attention': { stroke: '#0066FF', animationClass: 'fox-nj-attention' },
  'hype-boy': { stroke: '#00AAFF', animationClass: 'fox-nj-hype-boy' },
  'cookie': { stroke: '#4444FF', animationClass: 'fox-nj-cookie' },
  'ditto': { stroke: '#6666FF', animationClass: 'fox-nj-ditto' },
};

// ===== SVG COMPONENTS BY SIZE =====

const FoxNJ32: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 32 32" 
    width="32" 
    height="32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M4 20 Q2 16 4 12 Q6 8 10 10 Q8 14 6 18 Q5 20 4 20Z" 
            fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 12 Q3 10 4 8" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
    </g>
    
    <g className="body">
      <path d="M10 22 Q10 16 16 15 Q22 14 26 18 Q28 22 26 26 Q24 30 18 29 Q12 28 10 22Z" 
            fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    
    <g className="head">
      <circle cx="18" cy="10" r="6" fill="none" stroke={stroke} strokeWidth="2"/>
      <path d="M13 6 L11 2 L15 5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M23 6 L25 2 L21 5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <ellipse cx="18" cy="13" rx="2.5" ry="1.5" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="18" cy="12.5" r="0.8" fill={stroke}/>
      <circle cx="15" cy="9" r="1.2" fill={stroke}/>
      <circle cx="15.2" cy="8.7" r="0.4" fill="#FFF"/>
      <circle cx="21" cy="9" r="1.2" fill={stroke}/>
      <circle cx="20.8" cy="8.7" r="0.4" fill="#FFF"/>
      <path d="M13 7 Q15 6 17 7" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
      <path d="M19 7 Q21 6 23 7" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
    </g>
    
    <g className="paw-left">
      <circle cx="12" cy="26" r="2" fill="none" stroke={stroke} strokeWidth="1.5"/>
    </g>
    <g className="paw-right">
      <circle cx="24" cy="26" r="2" fill="none" stroke={stroke} strokeWidth="1.5"/>
    </g>
  </svg>
);

const FoxNJ64: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 64 64" 
    width="64" 
    height="64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M8 40 Q4 32 8 24 Q12 16 20 20 Q16 28 12 36 Q10 40 8 40Z" 
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
      <circle cx="36" cy="20" r="12" fill="none" stroke={stroke} strokeWidth="2"/>
      <path d="M26 12 L22 4 L30 10" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M26 10 L24 6 L28 9" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
      <path d="M46 12 L50 4 L42 10" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <path d="M46 10 L48 6 L44 9" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round"/>
      <ellipse cx="36" cy="26" rx="5" ry="3" fill="none" stroke={stroke} strokeWidth="2"/>
      <ellipse cx="36" cy="25" rx="2" ry="1.5" fill={stroke}/>
      <path d="M32 28 Q36 30 40 27" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="30" cy="18" r="2.5" fill={stroke}/>
      <circle cx="30.5" cy="17.5" r="0.8" fill="#FFF"/>
      <circle cx="42" cy="18" r="2.5" fill={stroke}/>
      <circle cx="41.5" cy="17.5" r="0.8" fill="#FFF"/>
      <path d="M26 14 Q30 12 34 14" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M38 14 Q42 12 46 14" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
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

const FoxNJ128: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 128 128" 
    width="128" 
    height="128"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M16 80 Q8 64 16 48 Q24 32 40 40 Q32 56 24 72 Q20 80 16 80Z" 
            fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 48 Q12 40 16 32" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 72 Q28 64 32 56" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M24 64 Q30 58 34 52" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <path d="M28 56 Q33 51 36 46" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
    </g>
    
    <g className="body">
      <path d="M40 88 Q40 64 64 60 Q88 56 104 72 Q112 88 104 104 Q96 120 72 116 Q48 112 40 88Z" 
            fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M56 76 Q64 84 72 76" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <path d="M58 82 Q64 88 70 82" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="head">
      <circle cx="72" cy="40" r="24" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <path d="M52 24 L44 8 L60 20" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M52 20 L48 12 L56 18" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M92 24 L100 8 L84 20" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <path d="M92 20 L96 12 L88 18" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="72" cy="52" rx="10" ry="6" fill="none" stroke={stroke} strokeWidth="2.5"/>
      <ellipse cx="72" cy="50" rx="4" ry="3" fill={stroke}/>
      <path d="M64 56 Q72 60 80 54" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M76 53 L80 54 L78 58" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="60" cy="36" rx="5" ry="6" fill={stroke}/>
      <circle cx="61" cy="35" r="1.8" fill="#FFF"/>
      <ellipse cx="84" cy="36" rx="5" ry="6" fill={stroke}/>
      <circle cx="83" cy="35" r="1.8" fill="#FFF"/>
      <path d="M52 28 Q60 24 68 28" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M76 28 Q84 24 92 28" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M52 44 Q56 46 60 44" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M84 44 Q88 46 92 44" fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
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

const FoxNJ256: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 256 256" 
    width="256" 
    height="256"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M32 160 Q16 128 32 96 Q48 64 80 80 Q64 112 48 144 Q40 160 32 160Z" 
            fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32 96 Q24 80 32 64" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M40 144 Q56 128 64 112" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M48 128 Q60 116 68 104" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
      <path d="M56 112 Q66 102 72 92" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M64 96 Q72 88 76 80" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.25"/>
    </g>
    
    <g className="body">
      <path d="M80 176 Q80 128 128 120 Q176 112 208 144 Q224 176 208 208 Q192 240 144 232 Q96 224 80 176Z" 
            fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M96 152 Q104 144 112 152" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M144 152 Q152 144 160 152" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M112 152 Q128 168 144 152" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M116 164 Q128 176 140 164" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <path d="M120 176 Q128 184 136 176" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    </g>
    
    <g className="head">
      <ellipse cx="144" cy="80" rx="48" ry="44" fill="none" stroke={stroke} strokeWidth="3"/>
      <path d="M104 72 Q128 64 152 72" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M104 48 L88 16 L120 40" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M104 40 L96 24 L112 36" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M100 32 L94 20 L108 30" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <path d="M184 48 L200 16 L168 40" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <path d="M184 40 L192 24 L176 36" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M188 32 L194 20 L180 30" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <ellipse cx="144" cy="104" rx="20" ry="12" fill="none" stroke={stroke} strokeWidth="3"/>
      <ellipse cx="144" cy="100" rx="8" ry="6" fill={stroke}/>
      <path d="M132 108 Q144 114 156 106" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M128 112 Q144 120 160 108" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M152 105 L160 108 L156 116" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="120" cy="72" rx="10" ry="12" fill={stroke}/>
      <ellipse cx="122" cy="70" rx="4" ry="5" fill="#FFF"/>
      <circle cx="124" cy="68" r="2" fill="#FFF"/>
      <ellipse cx="168" cy="72" rx="10" ry="12" fill={stroke}/>
      <ellipse cx="166" cy="70" rx="4" ry="5" fill="#FFF"/>
      <circle cx="164" cy="68" r="2" fill="#FFF"/>
      <path d="M104 56 Q120 48 136 56" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M152 56 Q168 48 184 56" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M104 88 Q112 92 120 88" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M168 88 Q176 92 184 88" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
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

const FoxNJ512: React.FC<{ stroke: string; className?: string }> = ({ stroke, className }) => (
  <svg 
    viewBox="0 0 512 512" 
    width="512" 
    height="512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="tail">
      <path d="M64 320 Q32 256 64 192 Q96 128 160 160 Q128 224 96 288 Q80 320 64 320Z" 
            fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M64 192 Q48 160 64 128" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M80 288 Q112 256 128 224" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <path d="M96 256 Q120 232 136 208" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M112 224 Q132 204 144 184" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" opacity="0.35"/>
      <path d="M128 192 Q144 176 152 160" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <path d="M72 280 Q100 260 116 236" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="body">
      <path d="M160 352 Q160 256 256 240 Q352 224 416 288 Q448 352 416 416 Q384 480 288 464 Q192 448 160 352Z" 
            fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M192 304 Q208 288 224 304" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M288 304 Q304 288 320 304" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M176 336 Q256 360 336 336" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.2"/>
      <path d="M224 304 Q256 336 288 304" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M232 328 Q256 352 280 328" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <path d="M240 352 Q256 368 272 352" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M248 376 Q256 384 264 376" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.2"/>
    </g>
    
    <g className="head">
      <ellipse cx="288" cy="160" rx="96" ry="88" fill="none" stroke={stroke} strokeWidth="4"/>
      <path d="M208 144 Q256 128 304 144" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M216 176 Q256 188 296 176" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.25"/>
      <path d="M208 96 L176 32 L240 80" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="ear-left"/>
      <path d="M208 80 L192 48 L224 72" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
      <path d="M200 64 L188 40 L216 60" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M368 96 L400 32 L336 80" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="ear-right"/>
      <path d="M368 80 L384 48 L352 72" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
      <path d="M376 64 L388 40 L360 60" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <ellipse cx="288" cy="208" rx="40" ry="24" fill="none" stroke={stroke} strokeWidth="4"/>
      <ellipse cx="288" cy="200" rx="16" ry="12" fill={stroke}/>
      <path d="M264 216 Q288 228 312 212" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M272 228 Q288 236 304 224" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.25"/>
      <path d="M256 224 Q288 240 320 216" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M304 210 L320 216 L312 232" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="240" cy="144" rx="20" ry="24" fill={stroke}/>
      <ellipse cx="244" cy="140" rx="8" ry="10" fill="#FFF"/>
      <circle cx="248" cy="136" r="4" fill="#FFF"/>
      <ellipse cx="336" cy="144" rx="20" ry="24" fill={stroke}/>
      <ellipse cx="332" cy="140" rx="8" ry="10" fill="#FFF"/>
      <circle cx="328" cy="136" r="4" fill="#FFF"/>
      <path d="M208 112 Q240 96 272 112" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M304 112 Q336 96 368 112" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M208 176 Q224 184 240 176" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M336 176 Q352 184 368 176" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
    </g>
    
    <g className="paw-left">
      <circle cx="192" cy="416" r="32" fill="none" stroke={stroke} strokeWidth="4"/>
      <line x1="176" y1="400" x2="176" y2="432" stroke={stroke} strokeWidth="3"/>
      <line x1="192" y1="392" x2="192" y2="440" stroke={stroke} strokeWidth="3"/>
      <line x1="208" y1="400" x2="208" y2="432" stroke={stroke} strokeWidth="3"/>
      <ellipse cx="192" cy="428" rx="8" ry="6" fill="none" stroke={stroke} strokeWidth="2" opacity="0.5"/>
    </g>
    <g className="paw-right">
      <circle cx="384" cy="416" r="32" fill="none" stroke={stroke} strokeWidth="4"/>
      <line x1="368" y1="400" x2="368" y2="432" stroke={stroke} strokeWidth="3"/>
      <line x1="384" y1="392" x2="384" y2="440" stroke={stroke} strokeWidth="3"/>
      <line x1="400" y1="400" x2="400" y2="432" stroke={stroke} strokeWidth="3"/>
      <ellipse cx="384" cy="428" rx="8" ry="6" fill="none" stroke={stroke} strokeWidth="2" opacity="0.5"/>
    </g>
  </svg>
);

// ===== MAIN COMPONENT =====

export const FoxNJ: React.FC<FoxNJProps> = ({
  size = 128,
  animation = 'idle',
  variant = 'classic-blue',
  className = '',
  onClick,
  alt = 'Minimalist line art fox mascot',
  hoverable = true,
  strokeColor,
}) => {
  // Get variant configuration
  const variantConfig = VARIANT_CONFIG[variant];
  const stroke = strokeColor || variantConfig.stroke;
  
  // Memoize the SVG component based on size
  const SvgComponent = useMemo(() => {
    switch (size) {
      case 32: return FoxNJ32;
      case 64: return FoxNJ64;
      case 128: return FoxNJ128;
      case 256: return FoxNJ256;
      case 512: return FoxNJ512;
      default: return FoxNJ128;
    }
  }, [size]);

  // Build class names
  const containerClasses = [
    'fox-nj-container',
    `fox-nj-size-${size}`,
    `fox-nj-${animation}`,
    `fox-nj-${variant}`,
    variantConfig.animationClass || '',
    hoverable ? 'fox-nj-hoverable' : '',
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

export default FoxNJ;

// Named exports for convenience
export { FoxNJ as NJFox };
