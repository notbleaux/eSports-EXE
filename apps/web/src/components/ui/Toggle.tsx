import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Valorant-Style Toggle (Switch) Component
 * 
 * Design Reference:
 * - Pill-shaped track (rounded-full for track, square for thumb)
 * - Cyan accent when checked
 * - Red accent for alert/danger states
 * - Sharp thumb with slight radius
 * - Glow effect when active
 * 
 * @example
 * <Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
 * <Toggle variant="danger" label="ALERT MODE" />
 * <Toggle size="lg" labelPosition="right" label="ENABLED" />
 */

export type ToggleVariant = 'default' | 'danger' | 'success';
export type ToggleSize = 'sm' | 'md' | 'lg';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  /** Visual variant */
  variant?: ToggleVariant;
  /** Size of the toggle */
  size?: ToggleSize;
  /** Label text */
  label?: string;
  /** Position of the label relative to toggle */
  labelPosition?: 'left' | 'right';
  /** Additional className for the label */
  labelClassName?: string;
  /** Change handler */
  onChange?: (checked: boolean) => void;
}

const variantStyles: Record<ToggleVariant, { track: string; thumb: string }> = {
  default: {
    track: 'peer-checked:bg-[#22D3EE] peer-checked:border-transparent peer-checked:shadow-[0_0_15px_rgba(34,211,238,0.5)]',
    thumb: 'bg-[#8A8E9E] peer-checked:bg-[#050817]',
  },
  danger: {
    track: 'peer-checked:bg-[#F43F5E] peer-checked:border-transparent peer-checked:shadow-[0_0_15px_rgba(244,63,94,0.5)]',
    thumb: 'bg-[#8A8E9E] peer-checked:bg-[#050817]',
  },
  success: {
    track: 'peer-checked:bg-[#22C55E] peer-checked:border-transparent peer-checked:shadow-[0_0_15px_rgba(34,197,94,0.5)]',
    thumb: 'bg-[#8A8E9E] peer-checked:bg-[#050817]',
  },
};

const sizeStyles: Record<ToggleSize, { track: string; thumb: string; translate: string }> = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'peer-checked:translate-x-4',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'peer-checked:translate-x-5',
  },
  lg: {
    track: 'h-8 w-14',
    thumb: 'h-7 w-7',
    translate: 'peer-checked:translate-x-6',
  },
};

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    label,
    labelPosition = 'right',
    labelClassName,
    onChange,
    id,
    ...props 
  }, ref) => {
    const toggleId = id || React.useId();
    const variantClasses = variantStyles[variant];
    const sizeClasses = sizeStyles[size];

    const ToggleComponent = (
      <label className={cn(
        'relative inline-flex items-center cursor-pointer',
        className
      )}>
        <input
          ref={ref}
          id={toggleId}
          type="checkbox"
          className="sr-only peer"
          onChange={(e) => onChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'relative rounded-full',
            'bg-[#1E2642] border border-[#2E3652]',
            'transition-all duration-200 ease-out',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
            'peer-focus-visible:ring-[#22D3EE] peer-focus-visible:ring-offset-[#050817]',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            sizeClasses.track,
            variantClasses.track
          )}
        >
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 left-0.5',
              'rounded-sm transition-all duration-200 ease-out',
              sizeClasses.thumb,
              sizeClasses.translate,
              variantClasses.thumb
            )}
          />
        </div>
      </label>
    );

    if (!label) {
      return ToggleComponent;
    }

    const LabelElement = (
      <span
        className={cn(
          'text-xs font-bold uppercase tracking-[0.1em]',
          'text-[#8A8E9E]',
          'select-none cursor-pointer',
          labelClassName
        )}
      >
        {label}
      </span>
    );

    return (
      <div className={cn(
        'inline-flex items-center gap-3',
        labelPosition === 'left' && 'flex-row-reverse',
        className
      )}>
        {ToggleComponent}
        <label htmlFor={toggleId} className="cursor-pointer">
          {LabelElement}
        </label>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

/**
 * Toggle Group - For multiple related toggles
 */
interface ToggleGroupProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

const ToggleGroup: React.FC<ToggleGroupProps> = ({ 
  children, 
  className,
  direction = 'vertical',
  gap = 'md' 
}) => {
  const gapClasses = {
    sm: direction === 'horizontal' ? 'gap-4' : 'gap-2',
    md: direction === 'horizontal' ? 'gap-6' : 'gap-3',
    lg: direction === 'horizontal' ? 'gap-8' : 'gap-4',
  };

  const directionClasses = {
    horizontal: 'flex flex-wrap items-center',
    vertical: 'flex flex-col',
  };

  return (
    <div className={cn(directionClasses[direction], gapClasses[gap], className)}>
      {children}
    </div>
  );
};

/**
 * Toggle Description - Additional context below a toggle
 */
interface ToggleDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const ToggleDescription: React.FC<ToggleDescriptionProps> = ({ children, className }) => {
  return (
    <p className={cn('text-[11px] text-[#5C6278] mt-1 ml-[52px]', className)}>
      {children}
    </p>
  );
};

export { Toggle, ToggleGroup, ToggleDescription };
export default Toggle;
