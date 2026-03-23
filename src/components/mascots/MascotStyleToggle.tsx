/**
 * MascotStyleToggle.tsx
 * 
 * Accessible toggle switch for switching between Dropout and NJ mascot styles
 * Features visual preview, keyboard navigation, and localStorage persistence
 * 
 * [Ver004.000]
 */

import React, { useCallback, useEffect, useState, useRef } from 'react';
import type { MascotStyle } from '../../../scripts/mascot-generator/config';
import { STYLE_SWITCH_CONFIG } from '../../../scripts/mascot-generator/config-new-mascots';

// ===== TYPE DEFINITIONS =====

export interface MascotStyleToggleProps {
  /** Current selected style */
  value: MascotStyle;
  /** Callback when style changes */
  onChange: (style: MascotStyle) => void;
  /** Additional CSS class */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show style labels */
  showLabels?: boolean;
  /** Show preview icons */
  showPreview?: boolean;
  /** Disable the toggle */
  disabled?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** Whether to persist preference to localStorage */
  persist?: boolean;
  /** Custom storage key */
  storageKey?: string;
}

// ===== STYLE CONFIGURATION =====

const STYLE_INFO: Record<MascotStyle, {
  label: string;
  shortLabel: string;
  description: string;
  previewColor: string;
  previewGradient: string;
}> = {
  dropout: {
    label: 'Dropout',
    shortLabel: 'DO',
    description: 'Full-color cartoon style with rich gradients',
    previewColor: '#F48C06',
    previewGradient: 'linear-gradient(135deg, #F48C06 0%, #6A040F 100%)',
  },
  nj: {
    label: 'NJ',
    shortLabel: 'NJ',
    description: 'Minimalist line art with electric blue strokes',
    previewColor: '#0000FF',
    previewGradient: 'linear-gradient(135deg, #0000FF 0%, #0066FF 100%)',
  },
};

const SIZE_CONFIG = {
  sm: {
    height: 28,
    width: 100,
    thumbSize: 24,
    fontSize: 11,
    previewSize: 16,
  },
  md: {
    height: 36,
    width: 120,
    thumbSize: 32,
    fontSize: 13,
    previewSize: 20,
  },
  lg: {
    height: 44,
    width: 140,
    thumbSize: 40,
    fontSize: 15,
    previewSize: 24,
  },
};

const STORAGE_KEY = STYLE_SWITCH_CONFIG.storageKey;

// ===== UTILITY FUNCTIONS =====

function getStoredStyle(): MascotStyle | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dropout' || stored === 'nj' ? stored : null;
  } catch {
    return null;
  }
}

function storeStyle(style: MascotStyle): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // Ignore storage errors
  }
}

// ===== PREVIEW ICONS =====

const DropoutPreview: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#dropoutGrad)" />
    <circle cx="12" cy="12" r="4" fill="white" fillOpacity="0.3" />
    <defs>
      <linearGradient id="dropoutGrad" x1="0" y1="0" x2="24" y2="24">
        <stop offset="0%" stopColor="#F48C06" />
        <stop offset="100%" stopColor="#6A040F" />
      </linearGradient>
    </defs>
  </svg>
);

const NJPreview: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#0000FF" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" stroke="#0000FF" strokeWidth="1.5" fill="none" />
    <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke="#0000FF" strokeWidth="1" opacity="0.5" />
  </svg>
);

// ===== MAIN COMPONENT =====

export const MascotStyleToggle: React.FC<MascotStyleToggleProps> = ({
  value,
  onChange,
  className = '',
  size = 'md',
  showLabels = true,
  showPreview = true,
  disabled = false,
  ariaLabel = 'Toggle mascot style',
  persist = STYLE_SWITCH_CONFIG.persistPreference,
  storageKey = STORAGE_KEY,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const config = SIZE_CONFIG[size];
  const isNJ = value === 'nj';

  // Load persisted preference on mount
  useEffect(() => {
    if (persist) {
      const stored = getStoredStyle();
      if (stored && stored !== value) {
        onChange(stored);
      }
    }
  }, []);

  // Persist preference when changed
  useEffect(() => {
    if (persist) {
      storeStyle(value);
    }
  }, [value, persist]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const newStyle = isNJ ? 'dropout' : 'nj';
    onChange(newStyle);
  }, [disabled, isNJ, onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleToggle();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        if (isNJ) onChange('dropout');
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        if (!isNJ) onChange('nj');
        break;
    }
  }, [disabled, handleToggle, isNJ, onChange]);

  return (
    <div
      className={`mascot-style-toggle ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showLabels ? 12 : 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Dropout Label */}
      {showLabels && (
        <span
          style={{
            fontSize: config.fontSize,
            fontWeight: !isNJ ? 600 : 400,
            color: !isNJ ? '#F48C06' : '#666',
            cursor: disabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            transition: 'color 0.2s ease',
          }}
          onClick={() => !disabled && onChange('dropout')}
          role="button"
          tabIndex={-1}
        >
          {STYLE_INFO.dropout.label}
        </span>
      )}

      {/* Toggle Switch */}
      <button
        ref={buttonRef}
        type="button"
        role="switch"
        aria-checked={isNJ}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          position: 'relative',
          width: config.width,
          height: config.height,
          padding: 2,
          border: `2px solid ${isFocused ? '#0000FF' : isNJ ? '#0000FF' : '#F48C06'}`,
          borderRadius: config.height / 2,
          backgroundColor: isNJ ? 'rgba(0, 0, 255, 0.05)' : 'rgba(244, 140, 6, 0.05)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: `all ${STYLE_SWITCH_CONFIG.transitionDuration}ms ease`,
          outline: 'none',
        }}
      >
        {/* Track Labels */}
        {!showLabels && (
          <>
            <span
              style={{
                position: 'absolute',
                left: config.height / 2,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: config.fontSize - 2,
                fontWeight: 600,
                color: '#F48C06',
                opacity: isNJ ? 0.3 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {STYLE_INFO.dropout.shortLabel}
            </span>
            <span
              style={{
                position: 'absolute',
                right: config.height / 2,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: config.fontSize - 2,
                fontWeight: 600,
                color: '#0000FF',
                opacity: isNJ ? 1 : 0.3,
                transition: 'opacity 0.2s ease',
              }}
            >
              {STYLE_INFO.nj.shortLabel}
            </span>
          </>
        )}

        {/* Thumb */}
        <span
          style={{
            position: 'absolute',
            left: isNJ ? config.width - config.thumbSize - 2 : 2,
            top: 2,
            width: config.thumbSize,
            height: config.thumbSize,
            borderRadius: '50%',
            background: isNJ 
              ? STYLE_INFO.nj.previewGradient 
              : STYLE_INFO.dropout.previewGradient,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: `left ${STYLE_SWITCH_CONFIG.transitionDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showPreview && (
            <span style={{ color: 'white', fontSize: config.previewSize * 0.6 }}>
              {isNJ ? 'NJ' : 'DO'}
            </span>
          )}
        </span>
      </button>

      {/* NJ Label */}
      {showLabels && (
        <span
          style={{
            fontSize: config.fontSize,
            fontWeight: isNJ ? 600 : 400,
            color: isNJ ? '#0000FF' : '#666',
            cursor: disabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            transition: 'color 0.2s ease',
          }}
          onClick={() => !disabled && onChange('nj')}
          role="button"
          tabIndex={-1}
        >
          {STYLE_INFO.nj.label}
        </span>
      )}

      {/* Screen Reader Description */}
      <span className="sr-only" style={{ position: 'absolute', left: -10000 }}>
        Current style: {STYLE_INFO[value].description}
      </span>
    </div>
  );
};

// ===== COMPACT VARIANT =====

export interface MascotStyleToggleCompactProps {
  value: MascotStyle;
  onChange: (style: MascotStyle) => void;
  className?: string;
  disabled?: boolean;
}

export const MascotStyleToggleCompact: React.FC<MascotStyleToggleCompactProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`mascot-style-toggle-compact ${className}`} style={{ display: 'inline-flex', gap: 4 }}>
      {( ['dropout', 'nj'] as MascotStyle[]).map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => !disabled && onChange(style)}
          disabled={disabled}
          aria-pressed={value === style}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: `2px solid ${value === style 
              ? style === 'dropout' ? '#F48C06' : '#0000FF'
              : '#ddd'
            }`,
            backgroundColor: value === style
              ? style === 'dropout' ? 'rgba(244, 140, 6, 0.1)' : 'rgba(0, 0, 255, 0.1)'
              : 'transparent',
            color: value === style
              ? style === 'dropout' ? '#F48C06' : '#0000FF'
              : '#666',
            fontSize: '12px',
            fontWeight: value === style ? 600 : 400,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {STYLE_INFO[style].shortLabel}
        </button>
      ))}
    </div>
  );
};

// ===== STYLE DISPLAY COMPONENT =====

export interface MascotStyleDisplayProps {
  style: MascotStyle;
  showDescription?: boolean;
  size?: 'sm' | 'md';
}

export const MascotStyleDisplay: React.FC<MascotStyleDisplayProps> = ({
  style,
  showDescription = false,
  size = 'md',
}) => {
  const info = STYLE_INFO[style];
  const iconSize = size === 'sm' ? 16 : 24;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {style === 'dropout' ? (
        <DropoutPreview size={iconSize} />
      ) : (
        <NJPreview size={iconSize} />
      )}
      <div>
        <div style={{ fontWeight: 600, fontSize: size === 'sm' ? 12 : 14 }}>
          {info.label}
        </div>
        {showDescription && (
          <div style={{ fontSize: size === 'sm' ? 10 : 12, color: '#666' }}>
            {info.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default MascotStyleToggle;
