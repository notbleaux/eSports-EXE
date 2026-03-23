/**
 * FoxDropout.tsx
 * Dropout Style Fox Mascot Component
 * 
 * Street-smart fox with bomber jacket, confident stance
 * Style: Vibrant orange, burgundy jacket, gold accents
 * 
 * [Ver004.000]
 */

import React, { useMemo } from 'react';

// ===== TYPES =====

export type FoxDropoutSize = 32 | 64 | 128 | 256 | 512;

export type FoxDropoutAnimation = 'idle' | 'wave' | 'celebrate' | 'confident';

export interface FoxDropoutProps {
  /** Size of the fox mascot in pixels */
  size?: FoxDropoutSize;
  /** Animation state */
  animation?: FoxDropoutAnimation;
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

const FoxDropout32: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 32 32" 
    width="32" 
    height="32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="foxOrange32" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F48C06"/>
        <stop offset="100%" stopColor="#E85D04"/>
      </linearGradient>
      <linearGradient id="jacketBurgundy32" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6A040F"/>
        <stop offset="100%" stopColor="#370617"/>
      </linearGradient>
      <linearGradient id="goldAccent32" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD60A"/>
        <stop offset="100%" stopColor="#FFC300"/>
      </linearGradient>
    </defs>
    
    <g className="tail">
      <path d="M6 20 Q4 16 6 12 Q8 8 12 10 Q10 14 8 18 Q7 20 6 20Z" fill="url(#foxOrange32)"/>
      <path d="M6 12 Q5 10 6 8 Q7 6 9 8" fill="none" stroke="#F48C06" strokeWidth="0.5"/>
    </g>
    
    <g className="jacket">
      <path d="M10 18 Q10 14 14 13 Q18 12 22 14 Q24 16 24 20 Q24 26 20 28 Q16 30 12 28 Q10 26 10 22 Q10 20 10 18Z" fill="url(#jacketBurgundy32)"/>
      <path d="M14 16 L14 24" stroke="#9D0208" strokeWidth="0.5"/>
      <path d="M18 16 L18 24" stroke="#9D0208" strokeWidth="0.5"/>
      <rect x="15" y="18" width="2" height="2" fill="url(#goldAccent32)" rx="0.3"/>
      <path d="M12 14 L14 16 L18 16 L20 14" fill="none" stroke="#9D0208" strokeWidth="0.8" className="collar"/>
    </g>
    
    <g className="head">
      <ellipse cx="16" cy="10" rx="6" ry="5" fill="url(#foxOrange32)"/>
      <path d="M11 7 L10 3 L13 6Z" fill="url(#foxOrange32)" className="ear-left"/>
      <path d="M11 5 L11 4 L12 5Z" fill="#370617"/>
      <path d="M21 7 L22 3 L19 6Z" fill="url(#foxOrange32)" className="ear-right"/>
      <path d="M21 5 L21 4 L20 5Z" fill="#370617"/>
      <ellipse cx="16" cy="12" rx="2.5" ry="1.5" fill="#FFBA08"/>
      <circle cx="16" cy="11.5" r="0.8" fill="#370617"/>
      <ellipse cx="13.5" cy="9.5" rx="1.2" ry="1.5" fill="#FFF"/>
      <ellipse cx="13.7" cy="9.5" rx="0.6" ry="0.9" fill="#370617"/>
      <ellipse cx="18.5" cy="9.5" rx="1.2" ry="1.5" fill="#FFF"/>
      <ellipse cx="18.3" cy="9.5" rx="0.6" ry="0.9" fill="#370617"/>
      <path d="M12 7.5 Q13.5 7 15 7.5" stroke="#370617" strokeWidth="0.4" fill="none"/>
      <path d="M17 7.5 Q18.5 7 20 7.5" stroke="#370617" strokeWidth="0.4" fill="none"/>
    </g>
    
    <g className="arm-left">
      <path d="M10 20 Q8 22 9 24 Q10 26 12 24" fill="url(#jacketBurgundy32)"/>
    </g>
    <g className="arm-right">
      <path d="M24 20 Q26 22 25 24 Q24 26 22 24" fill="url(#jacketBurgundy32)"/>
    </g>
    
    <g className="emblem">
      <circle cx="20" cy="19" r="1.5" fill="url(#goldAccent32)"/>
      <text x="20" y="19.5" fontSize="1.5" textAnchor="middle" fill="#370617" fontWeight="bold">F</text>
    </g>
  </svg>
);

const FoxDropout64: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 64 64" 
    width="64" 
    height="64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="foxOrange64" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F48C06"/>
        <stop offset="100%" stopColor="#E85D04"/>
      </linearGradient>
      <linearGradient id="jacketBurgundy64" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6A040F"/>
        <stop offset="100%" stopColor="#370617"/>
      </linearGradient>
      <linearGradient id="goldAccent64" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD60A"/>
        <stop offset="100%" stopColor="#FFC300"/>
      </linearGradient>
    </defs>
    
    <g className="tail">
      <path d="M12 40 Q8 32 12 24 Q16 16 24 20 Q20 28 16 36 Q14 40 12 40Z" fill="url(#foxOrange64)"/>
      <path d="M12 24 Q10 20 12 16 Q14 12 18 16" fill="none" stroke="#F48C06" strokeWidth="1"/>
      <path d="M14 38 Q18 36 20 32" fill="none" stroke="#FAA307" strokeWidth="0.8"/>
    </g>
    
    <g className="jacket">
      <path d="M20 36 Q20 28 28 26 Q36 24 44 28 Q48 32 48 40 Q48 52 40 56 Q32 60 24 56 Q20 52 20 44 Q20 40 20 36Z" fill="url(#jacketBurgundy64)"/>
      <path d="M28 32 L28 48" stroke="#9D0208" strokeWidth="1"/>
      <path d="M36 32 L36 48" stroke="#9D0208" strokeWidth="1"/>
      <rect x="30" y="36" width="4" height="4" fill="url(#goldAccent64)" rx="0.5"/>
      <line x1="32" y1="32" x2="32" y2="50" stroke="#FFD60A" strokeWidth="0.5" strokeDasharray="2,1"/>
      <path d="M24 28 L28 32 L36 32 L40 28" fill="none" stroke="#9D0208" strokeWidth="1.5" className="collar"/>
    </g>
    
    <g className="head">
      <ellipse cx="32" cy="20" rx="12" ry="10" fill="url(#foxOrange64)"/>
      <ellipse cx="22" cy="22" rx="3" ry="2" fill="#FFBA08" opacity="0.6"/>
      <ellipse cx="42" cy="22" rx="3" ry="2" fill="#FFBA08" opacity="0.6"/>
      <path d="M22 14 L20 6 L26 12Z" fill="url(#foxOrange64)" className="ear-left"/>
      <path d="M22 10 L22 8 L24 10Z" fill="#370617"/>
      <path d="M42 14 L44 6 L38 12Z" fill="url(#foxOrange64)" className="ear-right"/>
      <path d="M42 10 L42 8 L40 10Z" fill="#370617"/>
      <ellipse cx="32" cy="24" rx="5" ry="3" fill="#FFBA08"/>
      <ellipse cx="32" cy="23" rx="2" ry="1.5" fill="#370617"/>
      <path d="M28 26 Q32 28 36 25" fill="none" stroke="#370617" strokeWidth="0.8" strokeLinecap="round"/>
      <ellipse cx="27" cy="19" rx="2.5" ry="3" fill="#FFF"/>
      <ellipse cx="27.5" cy="19" rx="1.2" ry="1.8" fill="#370617"/>
      <circle cx="27.8" cy="18.5" r="0.4" fill="#FFF"/>
      <ellipse cx="37" cy="19" rx="2.5" ry="3" fill="#FFF"/>
      <ellipse cx="36.5" cy="19" rx="1.2" ry="1.8" fill="#370617"/>
      <circle cx="36.2" cy="18.5" r="0.4" fill="#FFF"/>
      <path d="M24 15 Q27 14 30 15" stroke="#370617" strokeWidth="0.8" fill="none"/>
      <path d="M34 15 Q37 14 40 15" stroke="#370617" strokeWidth="0.8" fill="none"/>
    </g>
    
    <g className="arm-left">
      <path d="M20 40 Q16 44 18 48 Q20 52 24 48" fill="url(#jacketBurgundy64)"/>
      <rect x="19" y="46" width="5" height="3" fill="#6A040F" rx="1"/>
    </g>
    <g className="arm-right">
      <path d="M48 40 Q52 44 50 48 Q48 52 44 48" fill="url(#jacketBurgundy64)"/>
      <rect x="40" y="46" width="5" height="3" fill="#6A040F" rx="1"/>
    </g>
    
    <g className="emblem">
      <circle cx="40" cy="38" r="3" fill="url(#goldAccent64)"/>
      <text x="40" y="39.5" fontSize="3" textAnchor="middle" fill="#370617" fontWeight="bold">F</text>
    </g>
    
    <path d="M24 42 L26 42 L26 46 L24 46Z" fill="#6A040F"/>
    <path d="M38 42 L40 42 L40 46 L38 46Z" fill="#6A040F"/>
  </svg>
);

const FoxDropout128: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 128 128" 
    width="128" 
    height="128"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="foxOrange128" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F48C06"/>
        <stop offset="100%" stopColor="#E85D04"/>
      </linearGradient>
      <linearGradient id="jacketBurgundy128" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6A040F"/>
        <stop offset="100%" stopColor="#370617"/>
      </linearGradient>
      <linearGradient id="goldAccent128" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD60A"/>
        <stop offset="100%" stopColor="#FFC300"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="64" cy="118" rx="30" ry="6" fill="#000" opacity="0.15"/>
    
    <g className="tail">
      <path d="M24 80 Q16 64 24 48 Q32 32 48 40 Q40 56 32 72 Q28 80 24 80Z" fill="url(#foxOrange128)"/>
      <path d="M24 48 Q20 40 24 32 Q28 24 36 32" fill="none" stroke="#F48C06" strokeWidth="2"/>
      <path d="M28 76 Q36 72 40 64" fill="none" stroke="#FAA307" strokeWidth="1.5"/>
      <path d="M32 68 Q38 64 42 58" fill="none" stroke="#FAA307" strokeWidth="1"/>
    </g>
    
    <g className="jacket">
      <path d="M40 72 Q40 56 56 52 Q72 48 88 56 Q96 64 96 80 Q96 104 80 112 Q64 120 48 112 Q40 104 40 88 Q40 80 40 72Z" fill="url(#jacketBurgundy128)"/>
      <path d="M56 64 L56 96" stroke="#9D0208" strokeWidth="2"/>
      <path d="M72 64 L72 96" stroke="#9D0208" strokeWidth="2"/>
      <rect x="60" y="72" width="8" height="8" fill="url(#goldAccent128)" rx="1"/>
      <line x1="64" y1="64" x2="64" y2="100" stroke="#FFD60A" strokeWidth="1" strokeDasharray="3,2"/>
      <circle cx="64" cy="62" r="3" fill="#FFC300"/>
      <path d="M48 56 L56 64 L72 64 L80 56" fill="none" stroke="#9D0208" strokeWidth="3" className="collar"/>
      <path d="M44 104 Q64 112 84 104" stroke="#6A040F" strokeWidth="4" fill="none"/>
    </g>
    
    <g className="head">
      <ellipse cx="64" cy="40" rx="24" ry="20" fill="url(#foxOrange128)"/>
      <ellipse cx="44" cy="44" rx="6" ry="4" fill="#FFBA08" opacity="0.6"/>
      <ellipse cx="84" cy="44" rx="6" ry="4" fill="#FFBA08" opacity="0.6"/>
      <path d="M44 28 L40 12 L52 24Z" fill="url(#foxOrange128)" className="ear-left"/>
      <path d="M44 20 L44 16 L48 20Z" fill="#370617"/>
      <path d="M84 28 L88 12 L76 24Z" fill="url(#foxOrange128)" className="ear-right"/>
      <path d="M84 20 L84 16 L80 20Z" fill="#370617"/>
      <ellipse cx="64" cy="48" rx="10" ry="6" fill="#FFBA08"/>
      <ellipse cx="64" cy="46" rx="4" ry="3" fill="#370617"/>
      <path d="M56 52 Q64 56 72 50" fill="none" stroke="#370617" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="54" cy="38" rx="5" ry="6" fill="#FFF"/>
      <ellipse cx="55" cy="38" rx="2.5" ry="3.5" fill="#370617"/>
      <circle cx="56" cy="37" r="1" fill="#FFF"/>
      <ellipse cx="74" cy="38" rx="5" ry="6" fill="#FFF"/>
      <ellipse cx="73" cy="38" rx="2.5" ry="3.5" fill="#370617"/>
      <circle cx="72" cy="37" r="1" fill="#FFF"/>
      <path d="M48 30 Q54 28 60 30" stroke="#370617" strokeWidth="1.5" fill="none"/>
      <path d="M68 30 Q74 28 80 30" stroke="#370617" strokeWidth="1.5" fill="none"/>
      <ellipse cx="62" cy="45" rx="1" ry="0.8" fill="#FFF" opacity="0.5"/>
    </g>
    
    <g className="arm-left">
      <path d="M40 80 Q32 88 36 96 Q40 104 48 96" fill="url(#jacketBurgundy128)"/>
      <rect x="38" y="92" width="10" height="6" fill="#6A040F" rx="2"/>
    </g>
    <g className="arm-right">
      <path d="M96 80 Q104 88 100 96 Q96 104 88 96" fill="url(#jacketBurgundy128)"/>
      <rect x="80" y="92" width="10" height="6" fill="#6A040F" rx="2"/>
    </g>
    
    <g className="emblem">
      <circle cx="80" cy="76" r="6" fill="url(#goldAccent128)"/>
      <text x="80" y="79" fontSize="6" textAnchor="middle" fill="#370617" fontWeight="bold">F</text>
    </g>
    
    <path d="M48 84 L52 84 L52 92 L48 92Z" fill="#6A040F"/>
    <path d="M76 84 L80 84 L80 92 L76 92Z" fill="#6A040F"/>
  </svg>
);

const FoxDropout256: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 256 256" 
    width="256" 
    height="256"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="foxOrange256" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F48C06"/>
        <stop offset="50%" stopColor="#FAA307"/>
        <stop offset="100%" stopColor="#E85D04"/>
      </linearGradient>
      <linearGradient id="jacketBurgundy256" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#9D0208"/>
        <stop offset="50%" stopColor="#6A040F"/>
        <stop offset="100%" stopColor="#370617"/>
      </linearGradient>
      <linearGradient id="goldAccent256" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD60A"/>
        <stop offset="100%" stopColor="#FFC300"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="128" cy="238" rx="60" ry="12" fill="#000" opacity="0.12"/>
    
    <g className="tail">
      <path d="M48 160 Q32 128 48 96 Q64 64 96 80 Q80 112 64 144 Q56 160 48 160Z" fill="url(#foxOrange256)"/>
      <path d="M48 96 Q40 80 48 64 Q56 48 72 64" fill="none" stroke="#F48C06" strokeWidth="3"/>
      <path d="M56 152 Q72 144 80 128" fill="none" stroke="#FAA307" strokeWidth="2.5"/>
      <path d="M64 136 Q76 128 84 116" fill="none" stroke="#FAA307" strokeWidth="2"/>
      <ellipse cx="52" cy="156" rx="6" ry="8" fill="#FFF" opacity="0.3"/>
    </g>
    
    <g className="jacket">
      <path d="M80 144 Q80 112 112 104 Q144 96 176 112 Q192 128 192 160 Q192 208 160 224 Q128 240 96 224 Q80 208 80 176 Q80 160 80 144Z" fill="url(#jacketBurgundy256)"/>
      <path d="M112 128 L112 192" stroke="#9D0208" strokeWidth="3"/>
      <path d="M144 128 L144 192" stroke="#9D0208" strokeWidth="3"/>
      <rect x="120" y="144" width="16" height="16" fill="url(#goldAccent256)" rx="2"/>
      <line x1="128" y1="128" x2="128" y2="200" stroke="#FFD60A" strokeWidth="1.5" strokeDasharray="4,3"/>
      <circle cx="128" cy="124" r="6" fill="#FFC300"/>
      <rect x="126" y="130" width="4" height="8" fill="#FFD60A"/>
      <path d="M96 112 L112 128 L144 128 L160 112" fill="none" stroke="#9D0208" strokeWidth="4" className="collar"/>
      <path d="M88 208 Q128 224 168 208" stroke="#6A040F" strokeWidth="8" fill="none"/>
    </g>
    
    <g className="head">
      <ellipse cx="128" cy="80" rx="48" ry="40" fill="url(#foxOrange256)"/>
      <path d="M112 48 Q128 56 144 48" stroke="#FAA307" strokeWidth="2" fill="none" opacity="0.6"/>
      <ellipse cx="88" cy="88" rx="12" ry="8" fill="#FFBA08" opacity="0.6"/>
      <ellipse cx="168" cy="88" rx="12" ry="8" fill="#FFBA08" opacity="0.6"/>
      <path d="M88 56 L80 24 L104 48Z" fill="url(#foxOrange256)" className="ear-left"/>
      <path d="M88 40 L88 32 L96 40Z" fill="#370617"/>
      <path d="M168 56 L176 24 L152 48Z" fill="url(#foxOrange256)" className="ear-right"/>
      <path d="M168 40 L168 32 L160 40Z" fill="#370617"/>
      <ellipse cx="128" cy="96" rx="20" ry="12" fill="#FFBA08"/>
      <ellipse cx="128" cy="92" rx="8" ry="6" fill="#370617"/>
      <path d="M112 104 Q128 112 144 100" fill="none" stroke="#370617" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="108" cy="76" rx="10" ry="12" fill="#FFF"/>
      <ellipse cx="110" cy="76" rx="5" ry="7" fill="#370617"/>
      <circle cx="112" cy="74" r="2" fill="#FFF"/>
      <ellipse cx="148" cy="76" rx="10" ry="12" fill="#FFF"/>
      <ellipse cx="146" cy="76" rx="5" ry="7" fill="#370617"/>
      <circle cx="144" cy="74" r="2" fill="#FFF"/>
      <path d="M96 60 Q108 56 120 60" stroke="#370617" strokeWidth="2.5" fill="none"/>
      <path d="M136 60 Q148 56 160 60" stroke="#370617" strokeWidth="2.5" fill="none"/>
      <ellipse cx="124" cy="90" rx="2" ry="1.5" fill="#FFF" opacity="0.6"/>
    </g>
    
    <g className="arm-left">
      <path d="M80 160 Q64 176 72 192 Q80 208 96 192" fill="url(#jacketBurgundy256)"/>
      <rect x="76" y="184" width="20" height="12" fill="#6A040F" rx="3"/>
    </g>
    <g className="arm-right">
      <path d="M192 160 Q208 176 200 192 Q192 208 176 192" fill="url(#jacketBurgundy256)"/>
      <rect x="160" y="184" width="20" height="12" fill="#6A040F" rx="3"/>
    </g>
    
    <g className="emblem">
      <circle cx="160" cy="152" r="12" fill="url(#goldAccent256)"/>
      <circle cx="160" cy="152" r="10" fill="none" stroke="#9D0208" strokeWidth="1"/>
      <text x="160" y="158" fontSize="12" textAnchor="middle" fill="#370617" fontWeight="bold">F</text>
    </g>
    
    <path d="M96 168 L104 168 L104 184 L96 184Z" fill="#6A040F"/>
    <path d="M152 168 L160 168 L160 184 L152 184Z" fill="#6A040F"/>
  </svg>
);

const FoxDropout512: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 512 512" 
    width="512" 
    height="512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="foxOrange512" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F48C06"/>
        <stop offset="30%" stopColor="#FAA307"/>
        <stop offset="70%" stopColor="#E85D04"/>
        <stop offset="100%" stopColor="#D00000"/>
      </linearGradient>
      <linearGradient id="jacketBurgundy512" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#9D0208"/>
        <stop offset="40%" stopColor="#6A040F"/>
        <stop offset="100%" stopColor="#370617"/>
      </linearGradient>
      <linearGradient id="goldAccent512" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD60A"/>
        <stop offset="50%" stopColor="#FFC300"/>
        <stop offset="100%" stopColor="#FF9500"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="256" cy="478" rx="120" ry="24" fill="#000" opacity="0.1"/>
    
    <g className="tail">
      <path d="M96 320 Q64 256 96 192 Q128 128 192 160 Q160 224 128 288 Q112 320 96 320Z" fill="url(#foxOrange512)"/>
      <path d="M96 192 Q80 160 96 128 Q112 96 144 128" fill="none" stroke="#F48C06" strokeWidth="5"/>
      <path d="M112 304 Q144 288 160 256" fill="none" stroke="#FAA307" strokeWidth="4"/>
      <path d="M128 272 Q152 256 168 232" fill="none" stroke="#FAA307" strokeWidth="3.5"/>
      <ellipse cx="104" cy="312" rx="12" ry="16" fill="#FFF" opacity="0.35"/>
      <ellipse cx="100" cy="308" rx="6" ry="8" fill="#FFF" opacity="0.5"/>
    </g>
    
    <g className="jacket">
      <path d="M160 288 Q160 224 224 208 Q288 192 352 224 Q384 256 384 320 Q384 416 320 448 Q256 480 192 448 Q160 416 160 352 Q160 320 160 288Z" fill="url(#jacketBurgundy512)"/>
      <path d="M224 256 L224 384" stroke="#9D0208" strokeWidth="5"/>
      <path d="M288 256 L288 384" stroke="#9D0208" strokeWidth="5"/>
      <rect x="240" y="288" width="32" height="32" fill="url(#goldAccent512)" rx="3"/>
      <line x1="256" y1="256" x2="256" y2="400" stroke="#FFD60A" strokeWidth="2.5" strokeDasharray="6,4"/>
      <circle cx="256" cy="248" r="12" fill="#FFC300"/>
      <circle cx="256" cy="248" r="8" fill="#FF9500" opacity="0.5"/>
      <rect x="252" y="260" width="8" height="16" fill="#FFD60A"/>
      <path d="M192 224 L224 256 L288 256 L320 224" fill="none" stroke="#9D0208" strokeWidth="7" className="collar"/>
      <path d="M176 416 Q256 448 336 416" stroke="#6A040F" strokeWidth="16" fill="none"/>
    </g>
    
    <g className="head">
      <ellipse cx="256" cy="160" rx="96" ry="80" fill="url(#foxOrange512)"/>
      <path d="M224 96 Q256 112 288 96" stroke="#FAA307" strokeWidth="3" fill="none" opacity="0.6"/>
      <ellipse cx="176" cy="176" rx="24" ry="16" fill="#FFBA08" opacity="0.6"/>
      <ellipse cx="336" cy="176" rx="24" ry="16" fill="#FFBA08" opacity="0.6"/>
      <path d="M176 112 L160 48 L208 96Z" fill="url(#foxOrange512)" className="ear-left"/>
      <path d="M176 80 L176 64 L192 80Z" fill="#370617"/>
      <path d="M336 112 L352 48 L304 96Z" fill="url(#foxOrange512)" className="ear-right"/>
      <path d="M336 80 L336 64 L320 80Z" fill="#370617"/>
      <ellipse cx="256" cy="192" rx="40" ry="24" fill="#FFBA08"/>
      <ellipse cx="256" cy="184" rx="16" ry="12" fill="#370617"/>
      <path d="M224 208 Q256 224 288 200" fill="none" stroke="#370617" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="216" cy="152" rx="20" ry="24" fill="#FFF"/>
      <ellipse cx="220" cy="152" rx="10" ry="14" fill="#370617"/>
      <circle cx="224" cy="148" r="4" fill="#FFF"/>
      <ellipse cx="296" cy="152" rx="20" ry="24" fill="#FFF"/>
      <ellipse cx="292" cy="152" rx="10" ry="14" fill="#370617"/>
      <circle cx="288" cy="148" r="4" fill="#FFF"/>
      <path d="M192 120 Q216 112 240 120" stroke="#370617" strokeWidth="4" fill="none"/>
      <path d="M272 120 Q296 112 320 120" stroke="#370617" strokeWidth="4" fill="none"/>
      <ellipse cx="248" cy="180" rx="4" ry="3" fill="#FFF" opacity="0.7"/>
    </g>
    
    <g className="arm-left">
      <path d="M160 320 Q128 352 144 384 Q160 416 192 384" fill="url(#jacketBurgundy512)"/>
      <rect x="152" y="368" width="40" height="24" fill="#6A040F" rx="5"/>
    </g>
    <g className="arm-right">
      <path d="M384 320 Q416 352 400 384 Q384 416 352 384" fill="url(#jacketBurgundy512)"/>
      <rect x="320" y="368" width="40" height="24" fill="#6A040F" rx="5"/>
    </g>
    
    <g className="emblem">
      <circle cx="320" cy="304" r="24" fill="url(#goldAccent512)"/>
      <circle cx="320" cy="304" r="20" fill="none" stroke="#9D0208" strokeWidth="2"/>
      <text x="320" y="316" fontSize="24" textAnchor="middle" fill="#370617" fontWeight="bold">F</text>
    </g>
    
    <path d="M192 336 L208 336 L208 368 L192 368Z" fill="#6A040F"/>
    <path d="M304 336 L320 336 L320 368 L304 368Z" fill="#6A040F"/>
  </svg>
);

// ===== MAIN COMPONENT =====

export const FoxDropout: React.FC<FoxDropoutProps> = ({
  size = 128,
  animation = 'idle',
  className = '',
  onClick,
  alt = 'Fox mascot in bomber jacket',
  hoverable = true,
}) => {
  // Memoize the SVG component based on size
  const SvgComponent = useMemo(() => {
    switch (size) {
      case 32: return FoxDropout32;
      case 64: return FoxDropout64;
      case 128: return FoxDropout128;
      case 256: return FoxDropout256;
      case 512: return FoxDropout512;
      default: return FoxDropout128;
    }
  }, [size]);

  // Build class names
  const containerClasses = [
    'fox-dropout-container',
    `fox-dropout-size-${size}`,
    `fox-dropout-${animation}`,
    hoverable ? 'fox-dropout-hoverable' : '',
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

export default FoxDropout;

// Named exports for convenience
export { FoxDropout as DropoutFox };
