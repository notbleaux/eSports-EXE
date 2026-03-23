/**
 * MascotStyleSelector.tsx
 * 
 * Visual selector component for choosing between Dropout and NJ styles
 * Displays style previews and descriptions
 * 
 * [Ver004.000]
 */

import React from 'react';
import type { MascotStyle } from '../../../scripts/mascot-generator/config';

// ===== TYPE DEFINITIONS =====

export interface MascotStyleSelectorProps {
  /** Current selected style */
  value: MascotStyle;
  /** Callback when style changes */
  onChange: (style: MascotStyle) => void;
  /** Additional CSS class */
  className?: string;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show descriptions */
  showDescription?: boolean;
  /** Disable the selector */
  disabled?: boolean;
}

// ===== STYLE CONFIGURATION =====

const STYLE_DATA: Record<MascotStyle, {
  name: string;
  description: string;
  colors: string[];
  features: string[];
}> = {
  dropout: {
    name: 'Dropout',
    description: 'Full-color cartoon style with rich gradients and detailed shading',
    colors: ['#F48C06', '#6A040F', '#370617', '#FFD60A'],
    features: ['Rich gradients', 'Detailed shading', 'Vibrant colors', 'Cartoon aesthetic'],
  },
  nj: {
    name: 'NJ',
    description: 'Minimalist line art with electric blue strokes and geometric shapes',
    colors: ['#0000FF', '#0066FF', '#00AAFF', '#4444FF'],
    features: ['Clean lines', 'Minimal design', 'Blue accents', 'Modern aesthetic'],
  },
};

const SIZE_CONFIG = {
  sm: {
    cardPadding: 12,
    previewSize: 48,
    titleSize: 14,
    descSize: 11,
    gap: 8,
  },
  md: {
    cardPadding: 16,
    previewSize: 64,
    titleSize: 16,
    descSize: 12,
    gap: 12,
  },
  lg: {
    cardPadding: 24,
    previewSize: 80,
    titleSize: 18,
    descSize: 14,
    gap: 16,
  },
};

// ===== PREVIEW COMPONENTS =====

const DropoutPreview: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dropoutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F48C06" />
        <stop offset="100%" stopColor="#6A040F" />
      </linearGradient>
    </defs>
    {/* Background */}
    <circle cx="32" cy="32" r="30" fill="url(#dropoutGrad)" />
    {/* Character body */}
    <ellipse cx="32" cy="40" rx="16" ry="14" fill="#370617" />
    {/* Character head */}
    <circle cx="32" cy="24" r="12" fill="#F48C06" />
    {/* Eyes */}
    <ellipse cx="28" cy="22" rx="3" ry="4" fill="white" />
    <ellipse cx="28" cy="22" rx="1.5" ry="2.5" fill="#1a1a1a" />
    <ellipse cx="36" cy="22" rx="3" ry="4" fill="white" />
    <ellipse cx="36" cy="22" rx="1.5" ry="2.5" fill="#1a1a1a" />
    {/* Jacket collar */}
    <path d="M24 36 L32 42 L40 36" stroke="#FFD60A" strokeWidth="2" fill="none" />
    {/* Shine effect */}
    <ellipse cx="24" cy="18" rx="4" ry="3" fill="white" opacity="0.3" />
  </svg>
);

const NJPreview: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    {/* Background circle outline */}
    <circle cx="32" cy="32" r="30" stroke="#0000FF" strokeWidth="2" fill="none" />
    {/* Character body - outline */}
    <ellipse cx="32" cy="40" rx="16" ry="14" stroke="#0000FF" strokeWidth="2" fill="none" />
    {/* Character head - outline */}
    <circle cx="32" cy="24" r="12" stroke="#0000FF" strokeWidth="2" fill="none" />
    {/* Eyes - filled circles */}
    <circle cx="28" cy="22" r="2" fill="#0000FF" />
    <circle cx="36" cy="22" r="2" fill="#0000FF" />
    {/* Smile */}
    <path d="M28 30 Q32 34 36 30" stroke="#0000FF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* Decorative lines */}
    <line x1="18" y1="32" x2="14" y2="32" stroke="#0000FF" strokeWidth="1" opacity="0.5" />
    <line x1="46" y1="32" x2="50" y2="32" stroke="#0000FF" strokeWidth="1" opacity="0.5" />
    <line x1="32" y1="12" x2="32" y2="8" stroke="#0000FF" strokeWidth="1" opacity="0.5" />
    <line x1="32" y1="52" x2="32" y2="56" stroke="#0000FF" strokeWidth="1" opacity="0.5" />
  </svg>
);

// ===== MAIN COMPONENT =====

export const MascotStyleSelector: React.FC<MascotStyleSelectorProps> = ({
  value,
  onChange,
  className = '',
  direction = 'horizontal',
  size = 'md',
  showDescription = true,
  disabled = false,
}) => {
  const config = SIZE_CONFIG[size];
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={`mascot-style-selector ${className}`}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        gap: config.gap,
      }}
      role="radiogroup"
      aria-label="Select mascot style"
    >
      {( ['dropout', 'nj'] as MascotStyle[]).map((style) => {
        const data = STYLE_DATA[style];
        const isSelected = value === style;
        const isDropout = style === 'dropout';

        return (
          <button
            key={style}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => !disabled && onChange(style)}
            style={{
              display: 'flex',
              flexDirection: isHorizontal ? 'column' : 'row',
              alignItems: 'center',
              gap: config.gap,
              padding: config.cardPadding,
              borderRadius: '12px',
              border: `2px solid ${isSelected 
                ? isDropout ? '#F48C06' : '#0000FF'
                : '#e0e0e0'
              }`,
              backgroundColor: isSelected
                ? isDropout ? 'rgba(244, 140, 6, 0.08)' : 'rgba(0, 0, 255, 0.08)'
                : 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              flex: isHorizontal ? 1 : undefined,
              textAlign: isHorizontal ? 'center' : 'left',
              minWidth: isHorizontal ? '140px' : undefined,
            }}
          >
            {/* Preview */}
            <div
              style={{
                width: config.previewSize,
                height: config.previewSize,
                borderRadius: '50%',
                backgroundColor: isSelected
                  ? isDropout ? 'rgba(244, 140, 6, 0.15)' : 'rgba(0, 0, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isDropout ? (
                <DropoutPreview size={config.previewSize * 0.75} />
              ) : (
                <NJPreview size={config.previewSize * 0.75} />
              )}
            </div>

            {/* Text Content */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: config.titleSize,
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected
                    ? isDropout ? '#F48C06' : '#0000FF'
                    : '#333',
                  marginBottom: showDescription ? 4 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isHorizontal ? 'center' : 'flex-start',
                  gap: '6px',
                }}
              >
                {data.name}
                {isSelected && (
                  <span style={{ fontSize: config.titleSize * 0.7 }}>✓</span>
                )}
              </div>

              {showDescription && (
                <div
                  style={{
                    fontSize: config.descSize,
                    color: '#666',
                    lineHeight: 1.4,
                    maxWidth: isHorizontal ? '160px' : '240px',
                  }}
                >
                  {data.description}
                </div>
              )}

              {/* Feature Tags */}
              {size !== 'sm' && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginTop: '8px',
                    justifyContent: isHorizontal ? 'center' : 'flex-start',
                  }}
                >
                  {data.features.slice(0, size === 'md' ? 2 : 4).map((feature, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: config.descSize - 1,
                        backgroundColor: isSelected
                          ? isDropout ? 'rgba(244, 140, 6, 0.15)' : 'rgba(0, 0, 255, 0.15)'
                          : 'rgba(0, 0, 0, 0.05)',
                        color: isSelected
                          ? isDropout ? '#B85D00' : '#0000CC'
                          : '#666',
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ===== COMPACT BADGE COMPONENT =====

export interface StyleBadgeProps {
  style: MascotStyle;
  size?: 'sm' | 'md';
}

export const StyleBadge: React.FC<StyleBadgeProps> = ({ style, size = 'sm' }) => {
  const data = STYLE_DATA[style];
  const isDropout = style === 'dropout';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: '12px',
        fontSize: size === 'sm' ? '11px' : '13px',
        fontWeight: 600,
        backgroundColor: isDropout ? 'rgba(244, 140, 6, 0.15)' : 'rgba(0, 0, 255, 0.15)',
        color: isDropout ? '#B85D00' : '#0000CC',
      }}
    >
      <span
        style={{
          width: size === 'sm' ? '6px' : '8px',
          height: size === 'sm' ? '6px' : '8px',
          borderRadius: '50%',
          backgroundColor: isDropout ? '#F48C06' : '#0000FF',
        }}
      />
      {data.name}
    </span>
  );
};

export default MascotStyleSelector;
