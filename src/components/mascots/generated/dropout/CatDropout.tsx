/**
 * CatDropout.tsx
 * Dropout Style Cat in Bunny Onesie Mascot Component
 * 
 * Playful tuxedo cat wearing a pink bunny onesie
 * Style: Full-color cartoon, mischievous expression
 * Features: Bright blue eyes (#00B4D8), grey markings, floppy bunny ears
 * 
 * [Ver004.000]
 */

import React, { useMemo } from 'react';

// ===== TYPES =====

export type CatDropoutSize = 32 | 64 | 128 | 256 | 512;

export type CatDropoutAnimation = 'idle' | 'mischief' | 'peekaboo' | 'celebrate';

export type CatDropoutVariant = 'tuxedo' | 'onesie-only';

export interface CatDropoutProps {
  /** Size of the cat mascot in pixels */
  size?: CatDropoutSize;
  /** Animation state */
  animation?: CatDropoutAnimation;
  /** Visual variant */
  variant?: CatDropoutVariant;
  /** Additional CSS class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether to apply hover effects */
  hoverable?: boolean;
}

// ===== SVG COMPONENTS BY SIZE =====

const CatDropout32: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 32 32" 
    width="32" 
    height="32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="catBlack32" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2D2D2D"/>
        <stop offset="100%" stopColor="#1A1A1A"/>
      </linearGradient>
      <linearGradient id="catWhite32" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="100%" stopColor="#F0F0F0"/>
      </linearGradient>
      <linearGradient id="onesiePink32" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF69B4"/>
        <stop offset="100%" stopColor="#F72585"/>
      </linearGradient>
      <linearGradient id="eyeBlue32" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF"/>
        <stop offset="100%" stopColor="#00B4D8"/>
      </linearGradient>
    </defs>
    
    {/* Shadow */}
    <ellipse cx="16" cy="30" rx="8" ry="1.5" fill="#000" opacity="0.15"/>
    
    {/* Tail peeking from onesie */}
    <g className="tail">
      <path d="M6 22 Q4 18 6 14 Q8 10 12 14" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M6 14 Q5 12 6 10" fill="none" stroke="#2D2D2D" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
    
    {/* Onesie Body */}
    <g className="onesie">
      <ellipse cx="16" cy="22" rx="9" ry="7" fill="url(#onesiePink32)"/>
      <ellipse cx="16" cy="23" rx="5" ry="4" fill="#FFB6C1" opacity="0.6"/>
      <line x1="16" y1="16" x2="16" y2="26" stroke="#D41675" strokeWidth="0.8" strokeDasharray="2,1"/>
      <circle cx="16" cy="15.5" r="1.2" fill="#FF1493"/>
    </g>
    
    {/* Onesie Arms */}
    <g className="arm-left">
      <ellipse cx="9" cy="20" rx="2.5" ry="4" fill="url(#onesiePink32)"/>
      <circle cx="8" cy="23" r="1.5" fill="#FFB6C1"/>
    </g>
    <g className="arm-right">
      <ellipse cx="23" cy="20" rx="2.5" ry="4" fill="url(#onesiePink32)"/>
      <circle cx="24" cy="23" r="1.5" fill="#FFB6C1"/>
    </g>
    
    {/* Bunny Ears (hood) */}
    <g className="bunny-ears">
      <ellipse cx="11" cy="8" rx="3" ry="6" fill="url(#onesiePink32)" transform="rotate(-15 11 8)"/>
      <ellipse cx="11" cy="8" rx="1.5" ry="3.5" fill="#FFB6C1" transform="rotate(-15 11 8)"/>
      <ellipse cx="21" cy="8" rx="3" ry="6" fill="url(#onesiePink32)" transform="rotate(15 21 8)"/>
      <ellipse cx="21" cy="8" rx="1.5" ry="3.5" fill="#FFB6C1" transform="rotate(15 21 8)"/>
    </g>
    
    {/* Cat Head */}
    <g className="head">
      <ellipse cx="16" cy="13" rx="8" ry="7" fill="url(#catBlack32)"/>
      <ellipse cx="16" cy="16" rx="4" ry="3" fill="url(#catWhite32)"/>
      <path d="M10 10 Q12 8 14 10" fill="none" stroke="#6B7280" strokeWidth="0.8" opacity="0.6"/>
      <path d="M18 10 Q20 8 22 10" fill="none" stroke="#6B7280" strokeWidth="0.8" opacity="0.6"/>
      
      <path d="M10 8 L8 4 L12 7Z" fill="url(#catBlack32)"/>
      <path d="M22 8 L24 4 L20 7Z" fill="url(#catBlack32)"/>
      
      <g className="eye-left">
        <ellipse cx="13" cy="12" rx="2" ry="2.5" fill="url(#eyeBlue32)"/>
        <ellipse cx="13.3" cy="11.5" rx="0.8" ry="1" fill="#FFF"/>
        <circle cx="13.5" cy="12.5" r="0.4" fill="#000" opacity="0.3"/>
      </g>
      <g className="eye-right">
        <ellipse cx="19" cy="12" rx="2" ry="2.5" fill="url(#eyeBlue32)"/>
        <ellipse cx="18.7" cy="11.5" rx="0.8" ry="1" fill="#FFF"/>
        <circle cx="18.5" cy="12.5" r="0.4" fill="#000" opacity="0.3"/>
      </g>
      
      <path d="M11 9 Q13 8 14 9.5" fill="none" stroke="#1A1A1A" strokeWidth="0.6" strokeLinecap="round"/>
      <path d="M18 9.5 Q19 8 21 9" fill="none" stroke="#1A1A1A" strokeWidth="0.6" strokeLinecap="round"/>
      
      <ellipse cx="16" cy="15" rx="1" ry="0.7" fill="#FF69B4"/>
      
      <path d="M14 16.5 Q16 18 18 16" fill="none" stroke="#1A1A1A" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M17.5 16.2 L18 16 L18.3 16.5" fill="none" stroke="#1A1A1A" strokeWidth="0.6" strokeLinecap="round"/>
      
      <line x1="10" y1="15" x2="7" y2="14.5" stroke="#FFF" strokeWidth="0.3" opacity="0.6"/>
      <line x1="10" y1="16" x2="7" y2="16" stroke="#FFF" strokeWidth="0.3" opacity="0.6"/>
      <line x1="22" y1="15" x2="25" y2="14.5" stroke="#FFF" strokeWidth="0.3" opacity="0.6"/>
      <line x1="22" y1="16" x2="25" y2="16" stroke="#FFF" strokeWidth="0.3" opacity="0.6"/>
    </g>
    
    <ellipse cx="8" cy="23.5" rx="0.8" ry="0.5" fill="#6B7280" opacity="0.5"/>
    <ellipse cx="24" cy="23.5" rx="0.8" ry="0.5" fill="#6B7280" opacity="0.5"/>
  </svg>
);

const CatDropout64: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 64 64" 
    width="64" 
    height="64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="catBlack64" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2D2D2D"/>
        <stop offset="50%" stopColor="#1F1F1F"/>
        <stop offset="100%" stopColor="#1A1A1A"/>
      </linearGradient>
      <linearGradient id="catWhite64" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="100%" stopColor="#F5F5F5"/>
      </linearGradient>
      <linearGradient id="onesiePink64" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF69B4"/>
        <stop offset="50%" stopColor="#FF1493"/>
        <stop offset="100%" stopColor="#F72585"/>
      </linearGradient>
      <linearGradient id="eyeBlue64" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF"/>
        <stop offset="100%" stopColor="#00B4D8"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="32" cy="60" rx="16" ry="3" fill="#000" opacity="0.12"/>
    
    <g className="tail">
      <path d="M12 44 Q8 36 12 28 Q16 20 24 28 Q20 36 16 44 Q14 48 12 44Z" fill="url(#catBlack64)"/>
      <path d="M12 28 Q10 24 12 20 Q14 16 18 20" fill="none" stroke="#2D2D2D" strokeWidth="1"/>
      <path d="M14 38 Q18 36 20 32" fill="none" stroke="#333333" strokeWidth="0.8"/>
      <ellipse cx="14" cy="42" rx="2" ry="3" fill="#FFFFFF" opacity="0.25"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="32" cy="44" rx="18" ry="14" fill="url(#onesiePink64)"/>
      <ellipse cx="32" cy="46" rx="10" ry="8" fill="#FFB6C1" opacity="0.6"/>
      <line x1="32" y1="32" x2="32" y2="52" stroke="#D41675" strokeWidth="1.5" strokeDasharray="3,2"/>
      <circle cx="32" cy="31" r="2.5" fill="#FF1493"/>
      <ellipse cx="20" cy="54" rx="4" ry="3" fill="#FFB6C1"/>
      <ellipse cx="44" cy="54" rx="4" ry="3" fill="#FFB6C1"/>
    </g>
    
    <g className="arm-left">
      <ellipse cx="16" cy="40" rx="5" ry="8" fill="url(#onesiePink64)"/>
      <circle cx="14" cy="46" rx="3" ry="2.5" fill="#FFB6C1"/>
    </g>
    <g className="arm-right">
      <ellipse cx="48" cy="40" rx="5" ry="8" fill="url(#onesiePink64)"/>
      <circle cx="50" cy="46" rx="3" ry="2.5" fill="#FFB6C1"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="22" cy="16" rx="5" ry="12" fill="url(#onesiePink64)" transform="rotate(-12 22 16)"/>
      <ellipse cx="22" cy="16" rx="2.5" ry="7" fill="#FFB6C1" transform="rotate(-12 22 16)"/>
      <ellipse cx="42" cy="16" rx="5" ry="12" fill="url(#onesiePink64)" transform="rotate(12 42 16)"/>
      <ellipse cx="42" cy="16" rx="2.5" ry="7" fill="#FFB6C1" transform="rotate(12 42 16)"/>
    </g>
    
    <g className="head">
      <ellipse cx="32" cy="26" rx="16" ry="14" fill="url(#catBlack64)"/>
      <ellipse cx="32" cy="32" rx="8" ry="6" fill="url(#catWhite64)"/>
      <path d="M20 20 Q24 16 28 20" fill="none" stroke="#6B7280" strokeWidth="1.5" opacity="0.6"/>
      <path d="M36 20 Q40 16 44 20" fill="none" stroke="#6B7280" strokeWidth="1.5" opacity="0.6"/>
      
      <path d="M20 18 L16 8 L24 16Z" fill="url(#catBlack64)"/>
      <path d="M20 14 L18 10 L22 13Z" fill="#6B7280" opacity="0.5"/>
      <path d="M44 18 L48 8 L40 16Z" fill="url(#catBlack64)"/>
      <path d="M44 14 L46 10 L42 13Z" fill="#6B7280" opacity="0.5"/>
      
      <g className="eye-left">
        <ellipse cx="26" cy="24" rx="4" ry="5" fill="url(#eyeBlue64)"/>
        <ellipse cx="26.5" cy="23" rx="1.5" ry="2" fill="#FFF"/>
        <circle cx="27" cy="25" rx="0.8" fill="#000" opacity="0.3"/>
      </g>
      <g className="eye-right">
        <ellipse cx="38" cy="24" rx="4" ry="5" fill="url(#eyeBlue64)"/>
        <ellipse cx="37.5" cy="23" rx="1.5" ry="2" fill="#FFF"/>
        <circle cx="37" cy="25" rx="0.8" fill="#000" opacity="0.3"/>
      </g>
      
      <path d="M22 18 Q26 16 30 19" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M34 19 Q38 16 42 18" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
      
      <ellipse cx="32" cy="30" rx="2" ry="1.5" fill="#FF69B4"/>
      <ellipse cx="31" cy="29.5" rx="0.6" ry="0.4" fill="#FFF" opacity="0.5"/>
      
      <path d="M28 33 Q32 36 36 32" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M35 31.5 L36 32 L36.5 33" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeLinecap="round"/>
      
      <line x1="20" y1="30" x2="14" y2="29" stroke="#FFF" strokeWidth="0.5" opacity="0.7"/>
      <line x1="20" y1="32" x2="14" y2="32" stroke="#FFF" strokeWidth="0.5" opacity="0.7"/>
      <line x1="20" y1="34" x2="14" y2="35" stroke="#FFF" strokeWidth="0.5" opacity="0.7"/>
      <line x1="44" y1="30" x2="50" y2="29" stroke="#FFF" strokeWidth="0.5" opacity="0.7"/>
      <line x1="44" y1="32" x2="50" y2="32" stroke="#FFF" strokeWidth="0.5" opacity="0.7"/>
      <line x1="44" y1="34" x2="50" y2="35" stroke="#FFF" strokeWidth="0.5" opacity="0.7"/>
    </g>
    
    <ellipse cx="14" cy="47" rx="1.5" ry="1" fill="#6B7280" opacity="0.6"/>
    <ellipse cx="50" cy="47" rx="1.5" ry="1" fill="#6B7280" opacity="0.6"/>
  </svg>
);

const CatDropout128: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 128 128" 
    width="128" 
    height="128"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="catBlack128" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#333333"/>
        <stop offset="50%" stopColor="#1F1F1F"/>
        <stop offset="100%" stopColor="#0D0D0D"/>
      </linearGradient>
      <linearGradient id="catWhite128" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="100%" stopColor="#F0F0F0"/>
      </linearGradient>
      <linearGradient id="onesiePink128" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF69B4"/>
        <stop offset="50%" stopColor="#FF1493"/>
        <stop offset="100%" stopColor="#F72585"/>
      </linearGradient>
      <linearGradient id="eyeBlue128" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF"/>
        <stop offset="100%" stopColor="#00B4D8"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="64" cy="120" rx="32" ry="6" fill="#000" opacity="0.1"/>
    
    <g className="tail">
      <path d="M24 88 Q16 72 24 56 Q32 40 48 56 Q40 56 32 72 Q28 80 24 88Z" fill="url(#catBlack128)"/>
      <path d="M24 56 Q20 48 24 40 Q28 32 36 40" fill="none" stroke="#2D2D2D" strokeWidth="2"/>
      <path d="M28 76 Q36 72 40 64" fill="none" stroke="#333333" strokeWidth="1.5"/>
      <ellipse cx="26" cy="86" rx="3" ry="4" fill="#FFFFFF" opacity="0.3"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="64" cy="88" rx="36" ry="28" fill="url(#onesiePink128)"/>
      <ellipse cx="64" cy="92" rx="20" ry="16" fill="#FFB6C1" opacity="0.6"/>
      <line x1="64" y1="64" x2="64" y2="104" stroke="#D41675" strokeWidth="2.5" strokeDasharray="4,3"/>
      <circle cx="64" cy="62" r="5" fill="#FF1493"/>
      <rect x="62" y="66" width="4" height="8" fill="#FF69B4"/>
      <path d="M44 104 Q64 112 84 104" stroke="#D41675" strokeWidth="4" fill="none"/>
      <ellipse cx="40" cy="108" rx="8" ry="6" fill="#FFB6C1"/>
      <ellipse cx="88" cy="108" rx="8" ry="6" fill="#FFB6C1"/>
    </g>
    
    <g className="arm-left">
      <path d="M32 80 Q24 88 28 96 Q32 104 40 96" fill="url(#onesiePink128)"/>
      <ellipse cx="30" cy="94" rx="5" ry="4" fill="#FFB6C1"/>
      <ellipse cx="30" cy="95" rx="2" ry="1.5" fill="#6B7280" opacity="0.5"/>
    </g>
    <g className="arm-right">
      <path d="M96 80 Q104 88 100 96 Q96 104 88 96" fill="url(#onesiePink128)"/>
      <ellipse cx="98" cy="94" rx="5" ry="4" fill="#FFB6C1"/>
      <ellipse cx="98" cy="95" rx="2" ry="1.5" fill="#6B7280" opacity="0.5"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="44" cy="32" rx="10" ry="24" fill="url(#onesiePink128)" transform="rotate(-10 44 32)"/>
      <ellipse cx="44" cy="32" rx="5" ry="14" fill="#FFB6C1" transform="rotate(-10 44 32)"/>
      <path d="M44 18 L42 28 L46 28Z" fill="#FF1493" opacity="0.3" transform="rotate(-10 44 32)"/>
      
      <ellipse cx="84" cy="32" rx="10" ry="24" fill="url(#onesiePink128)" transform="rotate(10 84 32)"/>
      <ellipse cx="84" cy="32" rx="5" ry="14" fill="#FFB6C1" transform="rotate(10 84 32)"/>
      <path d="M84 18 L82 28 L86 28Z" fill="#FF1493" opacity="0.3" transform="rotate(10 84 32)"/>
    </g>
    
    <g className="head">
      <ellipse cx="64" cy="52" rx="32" ry="28" fill="url(#catBlack128)"/>
      <ellipse cx="64" cy="64" rx="16" ry="12" fill="url(#catWhite128)"/>
      <path d="M40 40 Q48 32 56 40" fill="none" stroke="#6B7280" strokeWidth="2.5" opacity="0.6"/>
      <path d="M72 40 Q80 32 88 40" fill="none" stroke="#6B7280" strokeWidth="2.5" opacity="0.6"/>
      <path d="M56 38 L60 44 L64 38 L68 44 L72 38" fill="none" stroke="#6B7280" strokeWidth="1.5" opacity="0.5"/>
      
      <path d="M40 36 L32 16 L48 32Z" fill="url(#catBlack128)"/>
      <path d="M40 28 L36 20 L44 26Z" fill="#6B7280" opacity="0.5"/>
      <path d="M88 36 L96 16 L80 32Z" fill="url(#catBlack128)"/>
      <path d="M88 28 L92 20 L84 26Z" fill="#6B7280" opacity="0.5"/>
      
      <g className="eye-left">
        <ellipse cx="52" cy="48" rx="8" ry="10" fill="url(#eyeBlue128)"/>
        <ellipse cx="53" cy="46" rx="3" ry="4" fill="#FFF"/>
        <circle cx="54" cy="50" rx="1.5" fill="#000" opacity="0.3"/>
      </g>
      <g className="eye-right">
        <ellipse cx="76" cy="48" rx="8" ry="10" fill="url(#eyeBlue128)"/>
        <ellipse cx="75" cy="46" rx="3" ry="4" fill="#FFF"/>
        <circle cx="74" cy="50" rx="1.5" fill="#000" opacity="0.3"/>
      </g>
      
      <path d="M44 38 Q52 36 58 40" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M70 40 Q76 36 84 38" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
      
      <ellipse cx="64" cy="60" rx="4" ry="3" fill="#FF69B4"/>
      <ellipse cx="62" cy="59" rx="1.2" ry="0.8" fill="#FFF" opacity="0.5"/>
      
      <path d="M56 66 Q64 72 72 64" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M70 63 L72 64 L71 67" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
      
      <line x1="40" y1="60" x2="28" y2="58" stroke="#FFF" strokeWidth="0.8" opacity="0.7"/>
      <line x1="40" y1="64" x2="28" y2="64" stroke="#FFF" strokeWidth="0.8" opacity="0.7"/>
      <line x1="40" y1="68" x2="28" y2="70" stroke="#FFF" strokeWidth="0.8" opacity="0.7"/>
      <line x1="88" y1="60" x2="100" y2="58" stroke="#FFF" strokeWidth="0.8" opacity="0.7"/>
      <line x1="88" y1="64" x2="100" y2="64" stroke="#FFF" strokeWidth="0.8" opacity="0.7"/>
      <line x1="88" y1="68" x2="100" y2="70" stroke="#FFF" strokeWidth="0.8" opacity="0.7"/>
      
      <ellipse cx="48" cy="56" rx="3" ry="2" fill="#6B7280" opacity="0.3"/>
      <ellipse cx="80" cy="56" rx="3" ry="2" fill="#6B7280" opacity="0.3"/>
    </g>
  </svg>
);

const CatDropout256: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 256 256" 
    width="256" 
    height="256"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="catBlack256" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3D3D3D"/>
        <stop offset="40%" stopColor="#1F1F1F"/>
        <stop offset="100%" stopColor="#0A0A0A"/>
      </linearGradient>
      <linearGradient id="catWhite256" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="100%" stopColor="#F5F5F5"/>
      </linearGradient>
      <linearGradient id="onesiePink256" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF7EBC"/>
        <stop offset="50%" stopColor="#FF1493"/>
        <stop offset="100%" stopColor="#F72585"/>
      </linearGradient>
      <linearGradient id="eyeBlue256" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF"/>
        <stop offset="50%" stopColor="#00B4D8"/>
        <stop offset="100%" stopColor="#0096C7"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="128" cy="238" rx="60" ry="10" fill="#000" opacity="0.1"/>
    
    <g className="tail">
      <path d="M48 176 Q32 144 48 112 Q64 80 96 96 Q80 128 64 160 Q56 176 48 176Z" fill="url(#catBlack256)"/>
      <path d="M48 112 Q40 96 48 80 Q56 64 72 80" fill="none" stroke="#2D2D2D" strokeWidth="3"/>
      <path d="M56 168 Q72 156 80 140" fill="none" stroke="#333333" strokeWidth="2.5"/>
      <path d="M64 152 Q76 142 84 130" fill="none" stroke="#333333" strokeWidth="2"/>
      <ellipse cx="52" cy="170" rx="5" ry="6" fill="#FFFFFF" opacity="0.35"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="128" cy="176" rx="72" ry="56" fill="url(#onesiePink256)"/>
      <ellipse cx="128" cy="184" rx="40" ry="32" fill="#FFB6C1" opacity="0.6"/>
      <line x1="128" y1="128" x2="128" y2="208" stroke="#D41675" strokeWidth="4" strokeDasharray="6,4"/>
      <circle cx="128" cy="124" r="8" fill="#FF1493"/>
      <rect x="124" y="132" width="8" height="16" fill="#FF69B4"/>
      <line x1="126" y1="136" x2="126" y2="204" stroke="#FF69B4" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"/>
      <line x1="130" y1="136" x2="130" y2="204" stroke="#FF69B4" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"/>
      <path d="M80 220 Q128 232 176 220" stroke="#D41675" strokeWidth="8" fill="none"/>
      <line x1="88" y1="220" x2="88" y2="226" stroke="#FF1493" strokeWidth="2"/>
      <line x1="104" y1="222" x2="104" y2="228" stroke="#FF1493" strokeWidth="2"/>
      <line x1="128" y1="224" x2="128" y2="230" stroke="#FF1493" strokeWidth="2"/>
      <line x1="152" y1="222" x2="152" y2="228" stroke="#FF1493" strokeWidth="2"/>
      <line x1="168" y1="220" x2="168" y2="226" stroke="#FF1493" strokeWidth="2"/>
    </g>
    
    <g className="arm-left">
      <path d="M64 160 Q48 176 56 192 Q64 208 80 192" fill="url(#onesiePink256)"/>
      <rect x="58" y="184" width="16" height="10" fill="#D41675" rx="3"/>
      <ellipse cx="60" cy="190" rx="10" ry="8" fill="#FFB6C1"/>
      <ellipse cx="56" cy="188" rx="2.5" ry="2" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="60" cy="192" rx="2.5" ry="2" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="64" cy="188" rx="2.5" ry="2" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="60" cy="185" rx="2" ry="1.5" fill="#6B7280" opacity="0.5"/>
    </g>
    <g className="arm-right">
      <path d="M192 160 Q208 176 200 192 Q192 208 176 192" fill="url(#onesiePink256)"/>
      <rect x="182" y="184" width="16" height="10" fill="#D41675" rx="3"/>
      <ellipse cx="196" cy="190" rx="10" ry="8" fill="#FFB6C1"/>
      <ellipse cx="192" cy="188" rx="2.5" ry="2" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="196" cy="192" rx="2.5" ry="2" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="200" cy="188" rx="2.5" ry="2" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="196" cy="185" rx="2" ry="1.5" fill="#6B7280" opacity="0.5"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="88" cy="64" rx="20" ry="48" fill="url(#onesiePink256)" transform="rotate(-8 88 64)"/>
      <ellipse cx="88" cy="64" rx="10" ry="28" fill="#FFB6C1" transform="rotate(-8 88 64)"/>
      <path d="M88 32 L84 56 L92 56Z" fill="#FF1493" opacity="0.25" transform="rotate(-8 88 64)"/>
      <ellipse cx="88" cy="88" rx="12" ry="8" fill="#FF1493" opacity="0.15" transform="rotate(-8 88 64)"/>
      
      <ellipse cx="168" cy="64" rx="20" ry="48" fill="url(#onesiePink256)" transform="rotate(8 168 64)"/>
      <ellipse cx="168" cy="64" rx="10" ry="28" fill="#FFB6C1" transform="rotate(8 168 64)"/>
      <path d="M168 32 L164 56 L172 56Z" fill="#FF1493" opacity="0.25" transform="rotate(8 168 64)"/>
      <ellipse cx="168" cy="88" rx="12" ry="8" fill="#FF1493" opacity="0.15" transform="rotate(8 168 64)"/>
    </g>
    
    <g className="head">
      <ellipse cx="128" cy="104" rx="64" ry="56" fill="url(#catBlack256)"/>
      <ellipse cx="128" cy="128" rx="32" ry="24" fill="url(#catWhite256)"/>
      <path d="M224 96 Q256 112 288 96" stroke="#FAA307" strokeWidth="3" fill="none" opacity="0.6"/>
      
      <path d="M80 80 Q96 64 112 80" fill="none" stroke="#6B7280" strokeWidth="4" opacity="0.6"/>
      <path d="M144 80 Q160 64 176 80" fill="none" stroke="#6B7280" strokeWidth="4" opacity="0.6"/>
      <path d="M112 72 L120 88 L128 72 L136 88 L144 72" fill="none" stroke="#6B7280" strokeWidth="2.5" opacity="0.5"/>
      
      <ellipse cx="96" cy="112" rx="6" ry="4" fill="#6B7280" opacity="0.4"/>
      <ellipse cx="160" cy="112" rx="6" ry="4" fill="#6B7280" opacity="0.4"/>
      
      <path d="M80 72 L64 32 L96 64Z" fill="url(#catBlack256)"/>
      <path d="M80 56 L72 40 L88 52Z" fill="#6B7280" opacity="0.5"/>
      <path d="M176 72 L192 32 L160 64Z" fill="url(#catBlack256)"/>
      <path d="M176 56 L184 40 L168 52Z" fill="#6B7280" opacity="0.5"/>
      
      <g className="eye-left">
        <ellipse cx="104" cy="96" rx="16" ry="20" fill="url(#eyeBlue256)"/>
        <ellipse cx="106" cy="92" rx="6" ry="8" fill="#FFF"/>
        <circle cx="108" cy="98" rx="3" fill="#000" opacity="0.3"/>
        <ellipse cx="110" cy="90" rx="2" ry="2.5" fill="#FFF" opacity="0.8"/>
      </g>
      <g className="eye-right">
        <ellipse cx="152" cy="96" rx="16" ry="20" fill="url(#eyeBlue256)"/>
        <ellipse cx="150" cy="92" rx="6" ry="8" fill="#FFF"/>
        <circle cx="148" cy="98" rx="3" fill="#000" opacity="0.3"/>
        <ellipse cx="146" cy="90" rx="2" ry="2.5" fill="#FFF" opacity="0.8"/>
      </g>
      
      <path d="M88 76 Q104 72 116 80" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round"/>
      <path d="M140 80 Q152 72 168 76" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round"/>
      
      <ellipse cx="128" cy="120" rx="8" ry="6" fill="#FF69B4"/>
      <ellipse cx="124" cy="118" rx="2.5" ry="1.5" fill="#FFF" opacity="0.5"/>
      
      <path d="M112 132 Q128 144 144 128" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round"/>
      <path d="M140 126 L144 128 L142 134" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
      
      <line x1="80" y1="120" x2="56" y2="116" stroke="#FFF" strokeWidth="1.2" opacity="0.7"/>
      <line x1="80" y1="128" x2="56" y2="128" stroke="#FFF" strokeWidth="1.2" opacity="0.7"/>
      <line x1="80" y1="136" x2="56" y2="140" stroke="#FFF" strokeWidth="1.2" opacity="0.7"/>
      <line x1="176" y1="120" x2="200" y2="116" stroke="#FFF" strokeWidth="1.2" opacity="0.7"/>
      <line x1="176" y1="128" x2="200" y2="128" stroke="#FFF" strokeWidth="1.2" opacity="0.7"/>
      <line x1="176" y1="136" x2="200" y2="140" stroke="#FFF" strokeWidth="1.2" opacity="0.7"/>
      
      <path d="M142 136 L144 140 L146 136" fill="#FFFFFF" opacity="0.9"/>
    </g>
  </svg>
);

const CatDropout512: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 512 512" 
    width="512" 
    height="512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="catBlack512" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A4A4A"/>
        <stop offset="30%" stopColor="#2D2D2D"/>
        <stop offset="70%" stopColor="#1A1A1A"/>
        <stop offset="100%" stopColor="#0D0D0D"/>
      </linearGradient>
      <linearGradient id="catWhite512" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="50%" stopColor="#F8F8F8"/>
        <stop offset="100%" stopColor="#F0F0F0"/>
      </linearGradient>
      <linearGradient id="onesiePink512" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF85C0"/>
        <stop offset="40%" stopColor="#FF1493"/>
        <stop offset="100%" stopColor="#F72585"/>
      </linearGradient>
      <linearGradient id="eyeBlue512" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF"/>
        <stop offset="40%" stopColor="#00B4D8"/>
        <stop offset="100%" stopColor="#0077B6"/>
      </linearGradient>
      <linearGradient id="earPink512" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFB6C1"/>
        <stop offset="100%" stopColor="#FF69B4"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="256" cy="478" rx="120" ry="20" fill="#000" opacity="0.1"/>
    
    <g className="tail">
      <path d="M96 352 Q64 288 96 224 Q128 160 192 192 Q160 256 128 320 Q112 352 96 352Z" fill="url(#catBlack512)"/>
      <path d="M96 224 Q80 192 96 160 Q112 128 144 160" fill="none" stroke="#2D2D2D" strokeWidth="5"/>
      <path d="M112 336 Q144 312 160 280" fill="none" stroke="#333333" strokeWidth="4"/>
      <path d="M128 304 Q152 284 168 260" fill="none" stroke="#333333" strokeWidth="3.5"/>
      <path d="M144 280 Q164 264 176 244" fill="none" stroke="#333333" strokeWidth="3"/>
      <path d="M100 240 Q108 236 116 240" fill="none" stroke="#1A1A1A" strokeWidth="3" opacity="0.5"/>
      <path d="M104 264 Q112 260 120 264" fill="none" stroke="#1A1A1A" strokeWidth="3" opacity="0.5"/>
      <path d="M108 288 Q116 284 124 288" fill="none" stroke="#1A1A1A" strokeWidth="3" opacity="0.5"/>
      <ellipse cx="104" cy="340" rx="10" ry="12" fill="#FFFFFF" opacity="0.4"/>
    </g>
    
    <g className="onesie">
      <ellipse cx="256" cy="352" rx="144" ry="112" fill="url(#onesiePink512)"/>
      <ellipse cx="256" cy="368" rx="80" ry="64" fill="#FFB6C1" opacity="0.6"/>
      <ellipse cx="256" cy="360" rx="60" ry="40" fill="#FFC0CB" opacity="0.4"/>
      <line x1="256" y1="256" x2="256" y2="416" stroke="#D41675" strokeWidth="6" strokeDasharray="10,6"/>
      <circle cx="256" cy="248" r="16" fill="#FF1493"/>
      <circle cx="256" cy="248" r="10" fill="#FF69B4" opacity="0.5"/>
      <rect x="248" y="264" width="16" height="32" fill="#FF69B4"/>
      <line x1="252" y1="272" x2="252" y2="408" stroke="#FFB6C1" strokeWidth="2" strokeDasharray="6,6" opacity="0.6"/>
      <line x1="260" y1="272" x2="260" y2="408" stroke="#FFB6C1" strokeWidth="2" strokeDasharray="6,6" opacity="0.6"/>
      <path d="M160 440 Q256 464 352 440" stroke="#D41675" strokeWidth="16" fill="none"/>
      <line x1="176" y1="440" x2="176" y2="452" stroke="#FF1493" strokeWidth="3"/>
      <line x1="208" y1="444" x2="208" y2="456" stroke="#FF1493" strokeWidth="3"/>
      <line x1="256" y1="448" x2="256" y2="460" stroke="#FF1493" strokeWidth="3"/>
      <line x1="304" y1="444" x2="304" y2="456" stroke="#FF1493" strokeWidth="3"/>
      <line x1="336" y1="440" x2="336" y2="452" stroke="#FF1493" strokeWidth="3"/>
    </g>
    
    <g className="arm-left">
      <path d="M128 320 Q96 352 112 384 Q128 416 160 384" fill="url(#onesiePink512)"/>
      <rect x="116" y="368" width="32" height="20" fill="#D41675" rx="6"/>
      <ellipse cx="120" cy="380" rx="20" ry="16" fill="#FFB6C1"/>
      <ellipse cx="112" cy="376" rx="5" ry="4" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="120" cy="384" rx="5" ry="4" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="128" cy="376" rx="5" ry="4" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="120" cy="370" rx="4" ry="3" fill="#6B7280" opacity="0.5"/>
    </g>
    <g className="arm-right">
      <path d="M384 320 Q416 352 400 384 Q384 416 352 384" fill="url(#onesiePink512)"/>
      <rect x="364" y="368" width="32" height="20" fill="#D41675" rx="6"/>
      <ellipse cx="392" cy="380" rx="20" ry="16" fill="#FFB6C1"/>
      <ellipse cx="384" cy="376" rx="5" ry="4" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="392" cy="384" rx="5" ry="4" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="400" cy="376" rx="5" ry="4" fill="#6B7280" opacity="0.5"/>
      <ellipse cx="392" cy="370" rx="4" ry="3" fill="#6B7280" opacity="0.5"/>
    </g>
    
    <g className="bunny-ears">
      <ellipse cx="176" cy="128" rx="40" ry="96" fill="url(#onesiePink512)" transform="rotate(-6 176 128)"/>
      <ellipse cx="176" cy="128" rx="20" ry="56" fill="url(#earPink512)" transform="rotate(-6 176 128)"/>
      <path d="M176 64 L168 112 L184 112Z" fill="#FF1493" opacity="0.25" transform="rotate(-6 176 128)"/>
      <ellipse cx="176" cy="176" rx="24" ry="16" fill="#FF1493" opacity="0.15" transform="rotate(-6 176 128)"/>
      <path d="M160 144 Q176 152 192 144" fill="none" stroke="#D41675" strokeWidth="3" opacity="0.4" transform="rotate(-6 176 128)"/>
      
      <ellipse cx="336" cy="128" rx="40" ry="96" fill="url(#onesiePink512)" transform="rotate(6 336 128)"/>
      <ellipse cx="336" cy="128" rx="20" ry="56" fill="url(#earPink512)" transform="rotate(6 336 128)"/>
      <path d="M336 64 L328 112 L344 112Z" fill="#FF1493" opacity="0.25" transform="rotate(6 336 128)"/>
      <ellipse cx="336" cy="176" rx="24" ry="16" fill="#FF1493" opacity="0.15" transform="rotate(6 336 128)"/>
      <path d="M320 144 Q336 152 352 144" fill="none" stroke="#D41675" strokeWidth="3" opacity="0.4" transform="rotate(6 336 128)"/>
    </g>
    
    <g className="head">
      <ellipse cx="256" cy="208" rx="128" ry="112" fill="url(#catBlack512)"/>
      <ellipse cx="256" cy="256" rx="64" ry="48" fill="url(#catWhite512)"/>
      <path d="M240 128 L256 160 L272 128" fill="#FFFFFF" opacity="0.35"/>
      <ellipse cx="256" cy="144" rx="8" ry="12" fill="#FFFFFF" opacity="0.25"/>
      
      <path d="M160 160 Q192 128 224 160" fill="none" stroke="#6B7280" strokeWidth="7" opacity="0.6"/>
      <path d="M288 160 Q320 128 352 160" fill="none" stroke="#6B7280" strokeWidth="7" opacity="0.6"/>
      <path d="M224 144 L240 176 L256 144 L272 176 L288 144" fill="none" stroke="#6B7280" strokeWidth="4" opacity="0.5"/>
      <path d="M232 128 L244 152 L256 128" fill="none" stroke="#6B7280" strokeWidth="3" opacity="0.4"/>
      <path d="M256 128 L268 152 L280 128" fill="none" stroke="#6B7280" strokeWidth="3" opacity="0.4"/>
      <path d="M208 176 Q256 192 304 176" fill="none" stroke="#6B7280" strokeWidth="2.5" opacity="0.35"/>
      <path d="M216 192 Q256 204 296 192" fill="none" stroke="#6B7280" strokeWidth="2" opacity="0.3"/>
      
      <ellipse cx="192" cy="224" rx="12" ry="8" fill="#6B7280" opacity="0.4"/>
      <ellipse cx="320" cy="224" rx="12" ry="8" fill="#6B7280" opacity="0.4"/>
      <ellipse cx="176" cy="240" rx="4" ry="3" fill="#6B7280" opacity="0.3"/>
      <ellipse cx="336" cy="240" rx="4" ry="3" fill="#6B7280" opacity="0.3"/>
      
      <path d="M160 144 L128 64 L192 128Z" fill="url(#catBlack512)"/>
      <path d="M160 112 L144 80 L176 104Z" fill="#6B7280" opacity="0.5"/>
      <path d="M352 144 L384 64 L320 128Z" fill="url(#catBlack512)"/>
      <path d="M352 112 L368 80 L336 104Z" fill="#6B7280" opacity="0.5"/>
      
      <g className="eye-left">
        <ellipse cx="208" cy="192" rx="32" ry="40" fill="url(#eyeBlue512)"/>
        <ellipse cx="212" cy="184" rx="12" ry="16" fill="#FFF"/>
        <circle cx="216" cy="196" rx="6" fill="#000" opacity="0.3"/>
        <ellipse cx="220" cy="180" rx="4" ry="5" fill="#FFF" opacity="0.9"/>
        <circle cx="224" cy="176" r="2" fill="#FFF" opacity="0.7"/>
      </g>
      <g className="eye-right">
        <ellipse cx="304" cy="192" rx="32" ry="40" fill="url(#eyeBlue512)"/>
        <ellipse cx="300" cy="184" rx="12" ry="16" fill="#FFF"/>
        <circle cx="296" cy="196" rx="6" fill="#000" opacity="0.3"/>
        <ellipse cx="292" cy="180" rx="4" ry="5" fill="#FFF" opacity="0.9"/>
        <circle cx="288" cy="176" r="2" fill="#FFF" opacity="0.7"/>
      </g>
      
      <path d="M176 152 Q208 144 232 160" fill="none" stroke="#1A1A1A" strokeWidth="7" strokeLinecap="round"/>
      <path d="M280 160 Q304 144 336 152" fill="none" stroke="#1A1A1A" strokeWidth="7" strokeLinecap="round"/>
      <path d="M184 156 Q208 150 224 160" fill="none" stroke="#333333" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <path d="M288 160 Q304 150 328 156" fill="none" stroke="#333333" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      
      <ellipse cx="256" cy="240" rx="16" ry="12" fill="#FF69B4"/>
      <ellipse cx="248" cy="236" rx="5" ry="3" fill="#FFF" opacity="0.5"/>
      <ellipse cx="260" cy="234" rx="3" ry="2" fill="#FFB6C1" opacity="0.8"/>
      
      <path d="M224 264 Q256 288 288 256" fill="none" stroke="#1A1A1A" strokeWidth="7" strokeLinecap="round"/>
      <path d="M280 252 L288 256 L284 268" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round"/>
      
      <line x1="160" y1="240" x2="112" y2="232" stroke="#FFF" strokeWidth="2.5" opacity="0.8"/>
      <line x1="160" y1="256" x2="112" y2="256" stroke="#FFF" strokeWidth="2.5" opacity="0.8"/>
      <line x1="160" y1="272" x2="112" y2="280" stroke="#FFF" strokeWidth="2.5" opacity="0.8"/>
      <line x1="352" y1="240" x2="400" y2="232" stroke="#FFF" strokeWidth="2.5" opacity="0.8"/>
      <line x1="352" y1="256" x2="400" y2="256" stroke="#FFF" strokeWidth="2.5" opacity="0.8"/>
      <line x1="352" y1="272" x2="400" y2="280" stroke="#FFF" strokeWidth="2.5" opacity="0.8"/>
      <line x1="164" y1="248" x2="120" y2="244" stroke="#FFF" strokeWidth="2" opacity="0.6"/>
      <line x1="348" y1="248" x2="392" y2="244" stroke="#FFF" strokeWidth="2" opacity="0.6"/>
      
      <path d="M284 272 L288 280 L292 272" fill="#FFFFFF" opacity="0.95"/>
      <path d="M220 276 L224 284 L228 276" fill="#FFFFFF" opacity="0.7"/>
      
      <ellipse cx="280" cy="200" rx="4" ry="6" fill="#00E5FF" opacity="0.4"/>
    </g>
  </svg>
);

// ===== MAIN COMPONENT =====

export const CatDropout: React.FC<CatDropoutProps> = ({
  size = 128,
  animation = 'idle',
  variant = 'tuxedo',
  className = '',
  onClick,
  alt = 'Playful tuxedo cat in pink bunny onesie',
  hoverable = true,
}) => {
  // Memoize the SVG component based on size
  const SvgComponent = useMemo(() => {
    switch (size) {
      case 32: return CatDropout32;
      case 64: return CatDropout64;
      case 128: return CatDropout128;
      case 256: return CatDropout256;
      case 512: return CatDropout512;
      default: return CatDropout128;
    }
  }, [size]);

  // Build class names
  const containerClasses = [
    'cat-dropout-container',
    `cat-dropout-size-${size}`,
    `cat-dropout-${animation}`,
    hoverable ? 'cat-dropout-hoverable' : '',
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
      <SvgComponent />
    </div>
  );
};

// ===== EXPORTS =====

export default CatDropout;

// Named exports for convenience
export { CatDropout as DropoutCat };
export { CatDropout as CatInOnesie };
