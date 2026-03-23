/**
 * WolfDropout.tsx
 * Dropout Style Wolf Mascot Component
 * 
 * Mysterious midnight wolf with leather jacket, piercing eyes
 * Style: Dark charcoal (#2D2D2D), silver accents, piercing cyan eyes
 * Features: Sharp features, sleek jacket, confident stance
 * 
 * [Ver004.000]
 */

import React, { useMemo } from 'react';

// ===== TYPES =====

export type WolfDropoutSize = 32 | 64 | 128 | 256 | 512;

export type WolfDropoutAnimation = 'idle' | 'howl' | 'prowl' | 'celebrate';

export type WolfDropoutVariant = 'midnight' | 'silverback';

export interface WolfDropoutProps {
  /** Size of the wolf mascot in pixels */
  size?: WolfDropoutSize;
  /** Animation state */
  animation?: WolfDropoutAnimation;
  /** Visual variant */
  variant?: WolfDropoutVariant;
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

const WolfDropout32: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 32 32" 
    width="32" 
    height="32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="wolfGrey32" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A4A4A"/>
        <stop offset="100%" stopColor="#2D2D2D"/>
      </linearGradient>
      <linearGradient id="jacketBlack32" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1A1A1A"/>
        <stop offset="100%" stopColor="#0D0D0D"/>
      </linearGradient>
      <linearGradient id="eyeCyan32" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00E5FF"/>
        <stop offset="100%" stopColor="#00B4D8"/>
      </linearGradient>
      <linearGradient id="silverAccent32" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C0C0C0"/>
        <stop offset="100%" stopColor="#808080"/>
      </linearGradient>
    </defs>
    
    <g className="tail">
      <path d="M4 18 Q2 14 4 10 Q6 6 10 8 Q8 12 6 16 Q5 18 4 18Z" fill="url(#wolfGrey32)"/>
      <path d="M4 10 Q3 8 4 6" fill="none" stroke="#808080" strokeWidth="0.5"/>
    </g>
    
    <g className="jacket">
      <path d="M10 16 Q10 12 14 11 Q18 10 22 12 Q24 14 24 18 Q24 24 20 26 Q16 28 12 26 Q10 24 10 20 Q10 18 10 16Z" fill="url(#jacketBlack32)"/>
      <path d="M14 14 L14 22" stroke="#333" strokeWidth="0.5"/>
      <path d="M18 14 L18 22" stroke="#333" strokeWidth="0.5"/>
      <rect x="15" y="16" width="2" height="2" fill="url(#silverAccent32)" rx="0.3"/>
    </g>
    
    <g className="head">
      <ellipse cx="16" cy="8" rx="5" ry="4" fill="url(#wolfGrey32)"/>
      <path d="M12 6 L10 2 L14 5Z" fill="url(#wolfGrey32)" className="ear-left"/>
      <path d="M12 4 L12 3 L13 4Z" fill="#1A1A1A"/>
      <path d="M20 6 L22 2 L18 5Z" fill="url(#wolfGrey32)" className="ear-right"/>
      <path d="M20 4 L20 3 L19 4Z" fill="#1A1A1A"/>
      <ellipse cx="14" cy="7" rx="1.5" ry="2" fill="url(#eyeCyan32)"/>
      <ellipse cx="14.2" cy="6.8" rx="0.6" ry="0.8" fill="#FFF"/>
      <ellipse cx="18" cy="7" rx="1.5" ry="2" fill="url(#eyeCyan32)"/>
      <ellipse cx="17.8" cy="6.8" rx="0.6" ry="0.8" fill="#FFF"/>
      <path d="M15 9 L16 10 L17 9" fill="none" stroke="#1A1A1A" strokeWidth="0.5"/>
      <path d="M13 5 Q14.5 4.5 16 5" stroke="#1A1A1A" strokeWidth="0.3" fill="none"/>
      <path d="M16 5 Q17.5 4.5 19 5" stroke="#1A1A1A" strokeWidth="0.3" fill="none"/>
    </g>
    
    <g className="arm-left">
      <path d="M10 18 Q8 20 9 22 Q10 24 12 22" fill="url(#jacketBlack32)"/>
    </g>
    <g className="arm-right">
      <path d="M24 18 Q26 20 25 22 Q24 24 22 22" fill="url(#jacketBlack32)"/>
    </g>
    
    <g className="emblem">
      <circle cx="20" cy="17" r="1.5" fill="url(#silverAccent32)"/>
      <text x="20" y="17.5" fontSize="1.5" textAnchor="middle" fill="#0D0D0D" fontWeight="bold">W</text>
    </g>
  </svg>
);

const WolfDropout64: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 64 64" 
    width="64" 
    height="64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="wolfGrey64" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5A5A5A"/>
        <stop offset="50%" stopColor="#3D3D3D"/>
        <stop offset="100%" stopColor="#2D2D2D"/>
      </linearGradient>
      <linearGradient id="jacketBlack64" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2A2A2A"/>
        <stop offset="100%" stopColor="#0D0D0D"/>
      </linearGradient>
      <linearGradient id="eyeCyan64" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF"/>
        <stop offset="100%" stopColor="#00B4D8"/>
      </linearGradient>
      <linearGradient id="silverAccent64" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D0D0D0"/>
        <stop offset="100%" stopColor="#909090"/>
      </linearGradient>
    </defs>
    
    <g className="tail">
      <path d="M8 36 Q4 28 8 20 Q12 12 20 16 Q16 24 12 32 Q10 36 8 36Z" fill="url(#wolfGrey64)"/>
      <path d="M8 20 Q6 16 8 12" fill="none" stroke="#808080" strokeWidth="1"/>
      <path d="M10 32 Q14 28 16 24" fill="none" stroke="#A0A0A0" strokeWidth="0.8"/>
    </g>
    
    <g className="jacket">
      <path d="M20 32 Q20 24 28 22 Q36 20 44 24 Q48 28 48 36 Q48 48 40 52 Q32 56 24 52 Q20 48 20 40 Q20 36 20 32Z" fill="url(#jacketBlack64)"/>
      <path d="M28 28 L28 44" stroke="#333" strokeWidth="1"/>
      <path d="M36 28 L36 44" stroke="#333" strokeWidth="1"/>
      <rect x="30" y="32" width="4" height="4" fill="url(#silverAccent64)" rx="0.5"/>
      <line x1="32" y1="28" x2="32" y2="46" stroke="#C0C0C0" strokeWidth="0.5" strokeDasharray="2,1"/>
      <path d="M24 24 L28 28 L36 28 L40 24" fill="none" stroke="#444" strokeWidth="1.5" className="collar"/>
    </g>
    
    <g className="head">
      <ellipse cx="32" cy="16" rx="10" ry="8" fill="url(#wolfGrey64)"/>
      <ellipse cx="24" cy="18" rx="2.5" ry="1.5" fill="#808080" opacity="0.4"/>
      <ellipse cx="40" cy="18" rx="2.5" ry="1.5" fill="#808080" opacity="0.4"/>
      <path d="M24 12 L20 4 L28 10Z" fill="url(#wolfGrey64)" className="ear-left"/>
      <path d="M24 8 L24 6 L26 8Z" fill="#1A1A1A"/>
      <path d="M40 12 L44 4 L36 10Z" fill="url(#wolfGrey64)" className="ear-right"/>
      <path d="M40 8 L40 6 L38 8Z" fill="#1A1A1A"/>
      <ellipse cx="32" cy="20" rx="4" ry="2.5" fill="#4A4A4A"/>
      <ellipse cx="32" cy="19" rx="1.5" ry="1" fill="#1A1A1A"/>
      <path d="M28 22 Q32 24 36 21" fill="none" stroke="#1A1A1A" strokeWidth="0.8" strokeLinecap="round"/>
      <ellipse cx="27" cy="15" rx="3" ry="4" fill="url(#eyeCyan64)"/>
      <ellipse cx="27.5" cy="14.5" rx="1.2" ry="1.5" fill="#FFF"/>
      <circle cx="27.8" cy="15.5" r="0.4" fill="#000" opacity="0.3"/>
      <ellipse cx="37" cy="15" rx="3" ry="4" fill="url(#eyeCyan64)"/>
      <ellipse cx="36.5" cy="14.5" rx="1.2" ry="1.5" fill="#FFF"/>
      <circle cx="36.2" cy="15.5" r="0.4" fill="#000" opacity="0.3"/>
      <path d="M24 12 Q27 11 30 12" stroke="#1A1A1A" strokeWidth="0.8" fill="none"/>
      <path d="M34 12 Q37 11 40 12" stroke="#1A1A1A" strokeWidth="0.8" fill="none"/>
    </g>
    
    <g className="arm-left">
      <path d="M20 36 Q16 40 18 44 Q20 48 24 44" fill="url(#jacketBlack64)"/>
      <rect x="19" y="42" width="5" height="3" fill="#333" rx="1"/>
    </g>
    <g className="arm-right">
      <path d="M48 36 Q52 40 50 44 Q48 48 44 44" fill="url(#jacketBlack64)"/>
      <rect x="40" y="42" width="5" height="3" fill="#333" rx="1"/>
    </g>
    
    <g className="emblem">
      <circle cx="40" cy="34" r="3" fill="url(#silverAccent64)"/>
      <text x="40" y="35.5" fontSize="3" textAnchor="middle" fill="#0D0D0D" fontWeight="bold">W</text>
    </g>
  </svg>
);

const WolfDropout128: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 128 128" 
    width="128" 
    height="128"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="wolfGrey128" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6A6A6A"/>
        <stop offset="40%" stopColor="#4A4A4A"/>
        <stop offset="100%" stopColor="#2D2D2D"/>
      </linearGradient>
      <linearGradient id="jacketBlack128" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3A3A3A"/>
        <stop offset="50%" stopColor="#1A1A1A"/>
        <stop offset="100%" stopColor="#0D0D0D"/>
      </linearGradient>
      <linearGradient id="eyeCyan128" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF"/>
        <stop offset="100%" stopColor="#0096C7"/>
      </linearGradient>
      <linearGradient id="silverAccent128" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0E0E0"/>
        <stop offset="100%" stopColor="#A0A0A0"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="64" cy="118" rx="30" ry="6" fill="#000" opacity="0.15"/>
    
    <g className="tail">
      <path d="M16 72 Q8 56 16 40 Q24 24 40 32 Q32 48 24 64 Q20 72 16 72Z" fill="url(#wolfGrey128)"/>
      <path d="M16 40 Q12 32 16 24" fill="none" stroke="#808080" strokeWidth="2"/>
      <path d="M20 64 Q28 56 32 48" fill="none" stroke="#A0A0A0" strokeWidth="1.5"/>
      <path d="M24 56 Q30 50 34 44" fill="none" stroke="#A0A0A0" strokeWidth="1"/>
      <ellipse cx="18" cy="68" rx="4" ry="5" fill="#FFF" opacity="0.2"/>
    </g>
    
    <g className="jacket">
      <path d="M40 64 Q40 48 56 44 Q72 40 88 48 Q96 56 96 72 Q96 96 80 104 Q64 112 48 104 Q40 96 40 80 Q40 72 40 64Z" fill="url(#jacketBlack128)"/>
      <path d="M56 56 L56 88" stroke="#444" strokeWidth="2"/>
      <path d="M72 56 L72 88" stroke="#444" strokeWidth="2"/>
      <rect x="60" y="64" width="8" height="8" fill="url(#silverAccent128)" rx="1"/>
      <line x1="64" y1="56" x2="64" y2="92" stroke="#C0C0C0" strokeWidth="1" strokeDasharray="3,2"/>
      <circle cx="64" cy="54" r="3" fill="#C0C0C0"/>
      <path d="M48 48 L56 56 L72 56 L80 48" fill="none" stroke="#555" strokeWidth="3" className="collar"/>
      <path d="M44 92 Q64 100 84 92" stroke="#333" strokeWidth="4" fill="none"/>
    </g>
    
    <g className="head">
      <ellipse cx="64" cy="32" rx="20" ry="16" fill="url(#wolfGrey128)"/>
      <path d="M48 24 Q64 28 80 24" stroke="#808080" strokeWidth="2" fill="none" opacity="0.4"/>
      <ellipse cx="48" cy="36" rx="5" ry="3" fill="#808080" opacity="0.3"/>
      <ellipse cx="80" cy="36" rx="5" ry="3" fill="#808080" opacity="0.3"/>
      <path d="M48 24 L40 8 L56 20Z" fill="url(#wolfGrey128)" className="ear-left"/>
      <path d="M48 16 L48 12 L52 16Z" fill="#1A1A1A"/>
      <path d="M80 24 L88 8 L72 20Z" fill="url(#wolfGrey128)" className="ear-right"/>
      <path d="M80 16 L80 12 L76 16Z" fill="#1A1A1A"/>
      <ellipse cx="64" cy="40" rx="8" ry="5" fill="#4A4A4A"/>
      <ellipse cx="64" cy="38" rx="3" ry="2" fill="#1A1A1A"/>
      <path d="M56 44 Q64 48 72 42" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="54" cy="30" rx="6" ry="8" fill="url(#eyeCyan128)"/>
      <ellipse cx="55" cy="29" rx="2.5" ry="3.5" fill="#FFF"/>
      <circle cx="56" cy="31" r="1" fill="#000" opacity="0.3"/>
      <ellipse cx="74" cy="30" rx="6" ry="8" fill="url(#eyeCyan128)"/>
      <ellipse cx="73" cy="29" rx="2.5" ry="3.5" fill="#FFF"/>
      <circle cx="72" cy="31" r="1" fill="#000" opacity="0.3"/>
      <path d="M48 24 Q54 22 60 24" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
      <path d="M68 24 Q74 22 80 24" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
      <ellipse cx="62" cy="37" rx="1" ry="0.8" fill="#FFF" opacity="0.3"/>
    </g>
    
    <g className="arm-left">
      <path d="M40 72 Q32 80 36 88 Q40 96 48 88" fill="url(#jacketBlack128)"/>
      <rect x="38" y="84" width="10" height="6" fill="#333" rx="2"/>
    </g>
    <g className="arm-right">
      <path d="M96 72 Q104 80 100 88 Q96 96 88 88" fill="url(#jacketBlack128)"/>
      <rect x="80" y="84" width="10" height="6" fill="#333" rx="2"/>
    </g>
    
    <g className="emblem">
      <circle cx="80" cy="68" r="6" fill="url(#silverAccent128)"/>
      <circle cx="80" cy="68" r="5" fill="none" stroke="#666" strokeWidth="1"/>
      <text x="80" y="71" fontSize="6" textAnchor="middle" fill="#0D0D0D" fontWeight="bold">W</text>
    </g>
    
    <path d="M48 76 L52 76 L52 84 L48 84Z" fill="#333"/>
    <path d="M76 76 L80 76 L80 84 L76 84Z" fill="#333"/>
  </svg>
);

const WolfDropout256: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 256 256" 
    width="256" 
    height="256"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="wolfGrey256" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7A7A7A"/>
        <stop offset="30%" stopColor="#5A5A5A"/>
        <stop offset="70%" stopColor="#3D3D3D"/>
        <stop offset="100%" stopColor="#2D2D2D"/>
      </linearGradient>
      <linearGradient id="jacketBlack256" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4A4A4A"/>
        <stop offset="40%" stopColor="#2A2A2A"/>
        <stop offset="100%" stopColor="#0D0D0D"/>
      </linearGradient>
      <linearGradient id="eyeCyan256" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF"/>
        <stop offset="50%" stopColor="#00B4D8"/>
        <stop offset="100%" stopColor="#0077B6"/>
      </linearGradient>
      <linearGradient id="silverAccent256" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F0F0F0"/>
        <stop offset="100%" stopColor="#B0B0B0"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="128" cy="238" rx="60" ry="12" fill="#000" opacity="0.12"/>
    
    <g className="tail">
      <path d="M32 144 Q16 112 32 80 Q48 48 80 64 Q64 96 48 128 Q40 144 32 144Z" fill="url(#wolfGrey256)"/>
      <path d="M32 80 Q24 64 32 48" fill="none" stroke="#909090" strokeWidth="3"/>
      <path d="M40 128 Q56 112 64 96" fill="none" stroke="#A0A0A0" strokeWidth="2.5"/>
      <path d="M48 112 Q60 100 68 88" fill="none" stroke="#A0A0A0" strokeWidth="2"/>
      <ellipse cx="36" cy="136" rx="6" ry="8" fill="#FFF" opacity="0.25"/>
    </g>
    
    <g className="jacket">
      <path d="M80 128 Q80 96 112 88 Q144 80 176 96 Q192 112 192 144 Q192 192 160 208 Q128 224 96 208 Q80 192 80 160 Q80 144 80 128Z" fill="url(#jacketBlack256)"/>
      <path d="M112 112 L112 176" stroke="#444" strokeWidth="3"/>
      <path d="M144 112 L144 176" stroke="#444" strokeWidth="3"/>
      <rect x="120" y="128" width="16" height="16" fill="url(#silverAccent256)" rx="2"/>
      <line x1="128" y1="112" x2="128" y2="184" stroke="#C0C0C0" strokeWidth="1.5" strokeDasharray="4,3"/>
      <circle cx="128" cy="108" r="6" fill="#C0C0C0"/>
      <rect x="126" y="114" width="4" height="8" fill="#E0E0E0"/>
      <path d="M96 96 L112 112 L144 112 L160 96" fill="none" stroke="#555" strokeWidth="4" className="collar"/>
      <path d="M88 184 Q128 200 168 184" stroke="#333" strokeWidth="8" fill="none"/>
    </g>
    
    <g className="head">
      <ellipse cx="128" cy="64" rx="40" ry="32" fill="url(#wolfGrey256)"/>
      <path d="M96 48 Q128 56 160 48" stroke="#909090" strokeWidth="2" fill="none" opacity="0.4"/>
      <ellipse cx="96" cy="72" rx="10" ry="6" fill="#808080" opacity="0.3"/>
      <ellipse cx="160" cy="72" rx="10" ry="6" fill="#808080" opacity="0.3"/>
      <path d="M96 48 L80 16 L112 40Z" fill="url(#wolfGrey256)" className="ear-left"/>
      <path d="M96 32 L96 24 L104 32Z" fill="#1A1A1A"/>
      <path d="M160 48 L176 16 L144 40Z" fill="url(#wolfGrey256)" className="ear-right"/>
      <path d="M160 32 L160 24 L152 32Z" fill="#1A1A1A"/>
      <ellipse cx="128" cy="80" rx="16" ry="10" fill="#4A4A4A"/>
      <ellipse cx="128" cy="76" rx="6" ry="4" fill="#1A1A1A"/>
      <path d="M112 88 Q128 96 144 84" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="108" cy="60" rx="12" ry="16" fill="url(#eyeCyan256)"/>
      <ellipse cx="110" cy="58" rx="5" ry="7" fill="#FFF"/>
      <circle cx="112" cy="62" r="2" fill="#000" opacity="0.3"/>
      <ellipse cx="148" cy="60" rx="12" ry="16" fill="url(#eyeCyan256)"/>
      <ellipse cx="146" cy="58" rx="5" ry="7" fill="#FFF"/>
      <circle cx="144" cy="62" r="2" fill="#000" opacity="0.3"/>
      <path d="M96 48 Q108 44 120 48" stroke="#1A1A1A" strokeWidth="2.5" fill="none"/>
      <path d="M136 48 Q148 44 160 48" stroke="#1A1A1A" strokeWidth="2.5" fill="none"/>
      <ellipse cx="124" cy="74" rx="2" ry="1.5" fill="#FFF" opacity="0.4"/>
    </g>
    
    <g className="arm-left">
      <path d="M80 144 Q64 160 72 176 Q80 192 96 176" fill="url(#jacketBlack256)"/>
      <rect x="76" y="168" width="20" height="12" fill="#333" rx="3"/>
    </g>
    <g className="arm-right">
      <path d="M192 144 Q208 160 200 176 Q192 192 176 176" fill="url(#jacketBlack256)"/>
      <rect x="160" y="168" width="20" height="12" fill="#333" rx="3"/>
    </g>
    
    <g className="emblem">
      <circle cx="160" cy="136" r="12" fill="url(#silverAccent256)"/>
      <circle cx="160" cy="136" r="10" fill="none" stroke="#666" strokeWidth="1"/>
      <text x="160" y="142" fontSize="12" textAnchor="middle" fill="#0D0D0D" fontWeight="bold">W</text>
    </g>
    
    <path d="M96 152 L104 152 L104 168 L96 168Z" fill="#333"/>
    <path d="M152 152 L160 152 L160 168 L152 168Z" fill="#333"/>
  </svg>
);

const WolfDropout512: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 512 512" 
    width="512" 
    height="512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="wolfGrey512" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8A8A8A"/>
        <stop offset="25%" stopColor="#6A6A6A"/>
        <stop offset="60%" stopColor="#4A4A4A"/>
        <stop offset="100%" stopColor="#2D2D2D"/>
      </linearGradient>
      <linearGradient id="jacketBlack512" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#5A5A5A"/>
        <stop offset="30%" stopColor="#3A3A3A"/>
        <stop offset="70%" stopColor="#1A1A1A"/>
        <stop offset="100%" stopColor="#0A0A0A"/>
      </linearGradient>
      <linearGradient id="eyeCyan512" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF"/>
        <stop offset="40%" stopColor="#00B4D8"/>
        <stop offset="100%" stopColor="#0077B6"/>
      </linearGradient>
      <linearGradient id="silverAccent512" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="50%" stopColor="#D0D0D0"/>
        <stop offset="100%" stopColor="#A0A0A0"/>
      </linearGradient>
    </defs>
    
    <ellipse cx="256" cy="478" rx="120" ry="24" fill="#000" opacity="0.1"/>
    
    <g className="tail">
      <path d="M64 288 Q32 224 64 160 Q96 96 160 128 Q128 192 96 256 Q80 288 64 288Z" fill="url(#wolfGrey512)"/>
      <path d="M64 160 Q48 128 64 96" fill="none" stroke="#A0A0A0" strokeWidth="5"/>
      <path d="M80 256 Q112 224 128 192" fill="none" stroke="#B0B0B0" strokeWidth="4"/>
      <path d="M96 224 Q120 200 136 176" fill="none" stroke="#B0B0B0" strokeWidth="3.5"/>
      <ellipse cx="72" cy="272" rx="12" ry="16" fill="#FFF" opacity="0.3"/>
    </g>
    
    <g className="jacket">
      <path d="M160 256 Q160 192 224 176 Q288 160 352 192 Q384 224 384 288 Q384 384 320 416 Q256 448 192 416 Q160 384 160 320 Q160 288 160 256Z" fill="url(#jacketBlack512)"/>
      <path d="M224 224 L224 352" stroke="#444" strokeWidth="5"/>
      <path d="M288 224 L288 352" stroke="#444" strokeWidth="5"/>
      <rect x="240" y="256" width="32" height="32" fill="url(#silverAccent512)" rx="3"/>
      <line x1="256" y1="224" x2="256" y2="368" stroke="#D0D0D0" strokeWidth="2.5" strokeDasharray="6,4"/>
      <circle cx="256" cy="216" r="12" fill="#D0D0D0"/>
      <circle cx="256" cy="216" r="8" fill="#F0F0F0" opacity="0.5"/>
      <rect x="252" y="228" width="8" height="16" fill="#FFF"/>
      <path d="M192 192 L224 224 L288 224 L320 192" fill="none" stroke="#555" strokeWidth="7" className="collar"/>
      <path d="M176 368 Q256 400 336 368" stroke="#333" strokeWidth="16" fill="none"/>
    </g>
    
    <g className="head">
      <ellipse cx="256" cy="128" rx="80" ry="64" fill="url(#wolfGrey512)"/>
      <path d="M192 96 Q256 112 320 96" stroke="#A0A0A0" strokeWidth="3" fill="none" opacity="0.4"/>
      <ellipse cx="192" cy="144" rx="20" ry="12" fill="#909090" opacity="0.3"/>
      <ellipse cx="320" cy="144" rx="20" ry="12" fill="#909090" opacity="0.3"/>
      <path d="M192 96 L160 32 L224 80Z" fill="url(#wolfGrey512)" className="ear-left"/>
      <path d="M192 64 L192 48 L208 64Z" fill="#1A1A1A"/>
      <path d="M320 96 L352 32 L288 80Z" fill="url(#wolfGrey512)" className="ear-right"/>
      <path d="M320 64 L320 48 L304 64Z" fill="#1A1A1A"/>
      <ellipse cx="256" cy="160" rx="32" ry="20" fill="#4A4A4A"/>
      <ellipse cx="256" cy="152" rx="12" ry="8" fill="#1A1A1A"/>
      <path d="M224 176 Q256 192 288 168" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="216" cy="120" rx="24" ry="32" fill="url(#eyeCyan512)"/>
      <ellipse cx="220" cy="116" rx="10" ry="14" fill="#FFF"/>
      <circle cx="224" cy="124" r="4" fill="#000" opacity="0.3"/>
      <ellipse cx="296" cy="120" rx="24" ry="32" fill="url(#eyeCyan512)"/>
      <ellipse cx="292" cy="116" rx="10" ry="14" fill="#FFF"/>
      <circle cx="288" cy="124" r="4" fill="#000" opacity="0.3"/>
      <path d="M192 96 Q216 88 240 96" stroke="#1A1A1A" strokeWidth="4" fill="none"/>
      <path d="M272 96 Q296 88 320 96" stroke="#1A1A1A" strokeWidth="4" fill="none"/>
      <ellipse cx="248" cy="148" rx="4" ry="3" fill="#FFF" opacity="0.5"/>
    </g>
    
    <g className="arm-left">
      <path d="M160 288 Q128 320 144 352 Q160 384 192 352" fill="url(#jacketBlack512)"/>
      <rect x="152" y="336" width="40" height="24" fill="#333" rx="5"/>
    </g>
    <g className="arm-right">
      <path d="M384 288 Q416 320 400 352 Q384 384 352 352" fill="url(#jacketBlack512)"/>
      <rect x="320" y="336" width="40" height="24" fill="#333" rx="5"/>
    </g>
    
    <g className="emblem">
      <circle cx="320" cy="272" r="24" fill="url(#silverAccent512)"/>
      <circle cx="320" cy="272" r="20" fill="none" stroke="#666" strokeWidth="2"/>
      <text x="320" y="284" fontSize="24" textAnchor="middle" fill="#0A0A0A" fontWeight="bold">W</text>
    </g>
    
    <path d="M192 304 L208 304 L208 336 L192 336Z" fill="#333"/>
    <path d="M304 304 L320 304 L320 336 L304 336Z" fill="#333"/>
  </svg>
);

// ===== MAIN COMPONENT =====

export const WolfDropout: React.FC<WolfDropoutProps> = ({
  size = 128,
  animation = 'idle',
  variant = 'midnight',
  className = '',
  onClick,
  alt = 'Midnight wolf mascot in leather jacket',
  hoverable = true,
}) => {
  // Memoize the SVG component based on size
  const SvgComponent = useMemo(() => {
    switch (size) {
      case 32: return WolfDropout32;
      case 64: return WolfDropout64;
      case 128: return WolfDropout128;
      case 256: return WolfDropout256;
      case 512: return WolfDropout512;
      default: return WolfDropout128;
    }
  }, [size]);

  // Build class names
  const containerClasses = [
    'wolf-dropout-container',
    `wolf-dropout-size-${size}`,
    `wolf-dropout-${animation}`,
    `wolf-dropout-${variant}`,
    hoverable ? 'wolf-dropout-hoverable' : '',
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

export default WolfDropout;

// Named exports for convenience
export { WolfDropout as DropoutWolf };
