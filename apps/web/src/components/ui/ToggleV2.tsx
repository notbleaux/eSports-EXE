/**
 * ToggleV2 - Valorant-styled Toggle/Switch Component
 * Sharp tactical switch with red accent
 * 
 * [Ver001.000] - Initial Valorant toggle implementation
 */
import React from 'react';
import { cn } from '@/utils/cn';

export interface ToggleV2Props {
  /**
   * Toggle state
   */
  checked: boolean;
  
  /**
   * State change handler
   */
  onChange: (checked: boolean) => void;
  
  /**
   * Toggle size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Label text
   */
  label?: string;
  
  /**
   * Label position
   * @default 'right'
   */
  labelPosition?: 'left' | 'right';
  
  /**
   * Additional class names
   */
  className?: string;
  
  /**
   * Custom accent color
   * @default 'red'
   */
  accent?: 'red' | 'teal' | 'gold';
}

export const ToggleV2: React.FC<ToggleV2Props> = ({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  label,
  labelPosition = 'right',
  className,
  accent = 'red',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  };

  const config = sizeConfig[size];

  // Accent colors
  const accentColors = {
    red: {
      active: 'bg-valorant-accent-red shadow-valorant-glow-sm',
      hover: 'hover:shadow-valorant-glow',
    },
    teal: {
      active: 'bg-valorant-accent-teal shadow-valorant-teal',
      hover: 'hover:shadow-[0_0_30px_rgba(10,200,185,0.4)]',
    },
    gold: {
      active: 'bg-valorant-accent-gold shadow-valorant-gold',
      hover: 'hover:shadow-[0_0_30px_rgba(255,184,0,0.4)]',
    },
  };

  const colors = accentColors[accent];

  const toggleContent = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-valorant-accent-red focus:ring-offset-2 focus:ring-offset-valorant-bg-base',
        config.track,
        checked
          ? cn(colors.active, colors.hover)
          : 'bg-valorant-bg-hover hover:bg-valorant-bg-active',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'inline-block bg-valorant-text-primary rounded-sm shadow-md transform transition-transform duration-200 ease-out',
          config.thumb,
          checked ? config.translate : 'translate-x-0.5'
        )}
      />
    </button>
  );

  if (!label) {
    return toggleContent;
  }

  const labelContent = (
    <span
      className={cn(
        'text-sm font-medium select-none',
        disabled ? 'text-valorant-text-disabled' : 'text-valorant-text-secondary'
      )}
    >
      {label}
    </span>
  );

  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer',
        disabled && 'cursor-not-allowed'
      )}
    >
      {labelPosition === 'left' && (
        <>
          {labelContent}
          {toggleContent}
        </>
      )}
      {labelPosition === 'right' && (
        <>
          {toggleContent}
          {labelContent}
        </>
      )}
    </label>
  );
};

export default ToggleV2;
