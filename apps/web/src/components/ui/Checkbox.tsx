import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Minus } from 'lucide-react';

/**
 * Valorant-Style Checkbox Component
 * 
 * Design Reference:
 * - Sharp corners (2px radius)
 * - Cyan checkmark on dark background
 * - Red variant for danger/alert states
 * - Indeterminate state support
 * - Subtle border glow on hover
 * 
 * @example
 * <Checkbox checked={true} onChange={(e) => handleChange(e.target.checked)} />
 * <Checkbox label="AGREE TO TERMS" labelPosition="right" />
 * <Checkbox variant="danger" indeterminate={partial} />
 */

export type CheckboxVariant = 'default' | 'danger' | 'success';
export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  /** Visual variant */
  variant?: CheckboxVariant;
  /** Size of the checkbox */
  size?: CheckboxSize;
  /** Label text */
  label?: string;
  /** Position of the label relative to checkbox */
  labelPosition?: 'left' | 'right';
  /** Additional className for the label */
  labelClassName?: string;
  /** Indeterminate state (overrides checked visual) */
  indeterminate?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
}

const variantStyles: Record<CheckboxVariant, { checked: string; icon: string }> = {
  default: {
    checked: 'peer-checked:bg-[#22D3EE] peer-checked:border-[#22D3EE]',
    icon: 'text-[#050817]',
  },
  danger: {
    checked: 'peer-checked:bg-[#F43F5E] peer-checked:border-[#F43F5E]',
    icon: 'text-[#050817]',
  },
  success: {
    checked: 'peer-checked:bg-[#22C55E] peer-checked:border-[#22C55E]',
    icon: 'text-[#050817]',
  },
};

const sizeStyles: Record<CheckboxSize, { root: string; icon: string }> = {
  sm: {
    root: 'h-4 w-4 rounded-sm',
    icon: 'h-3 w-3',
  },
  md: {
    root: 'h-5 w-5 rounded-sm',
    icon: 'h-4 w-4',
  },
  lg: {
    root: 'h-6 w-6 rounded',
    icon: 'h-5 w-5',
  },
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    label,
    labelPosition = 'right',
    labelClassName,
    indeterminate = false,
    checked,
    onChange,
    id,
    ...props 
  }, ref) => {
    const checkboxId = id || React.useId();
    const variantClasses = variantStyles[variant];
    const sizeClasses = sizeStyles[size];
    const isChecked = !!checked || indeterminate;

    return (
      <div className={cn(
        'group inline-flex items-center gap-3',
        labelPosition === 'left' && 'flex-row-reverse',
        className
      )}>
        <label className="relative flex items-center cursor-pointer">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            className="sr-only peer"
            onChange={(e) => onChange?.(e.target.checked)}
            {...props}
          />
          <div
            className={cn(
              'relative flex items-center justify-center',
              'bg-transparent border-2 border-[#2E3652]',
              'transition-all duration-150 ease-out',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
              'peer-focus-visible:ring-[#22D3EE] peer-focus-visible:ring-offset-[#050817]',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              'hover:border-[#5C6278]',
              sizeClasses.root,
              variantClasses.checked
            )}
          >
            {/* Checkmark icon */}
            <div
              className={cn(
                'transition-all duration-150',
                isChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
                variantClasses.icon
              )}
            >
              {indeterminate ? (
                <Minus className={cn(sizeClasses.icon, 'stroke-[3]')} />
              ) : (
                <Check className={cn(sizeClasses.icon, 'stroke-[3]')} />
              )}
            </div>

            {/* Subtle inner shadow for depth */}
            <span className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-sm pointer-events-none" />
          </div>
        </label>

        {label && (
          <label
            htmlFor={checkboxId}
            className={cn(
              'text-xs font-bold uppercase tracking-[0.1em]',
              'text-[#8A8E9E]',
              'select-none cursor-pointer transition-colors duration-150',
              'group-hover:text-[#B8BAC4]',
              labelClassName
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * Checkbox Group - For multiple related checkboxes
 */
interface CheckboxGroupProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ 
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
 * Checkbox Description - Additional context below a checkbox
 */
interface CheckboxDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const CheckboxDescription: React.FC<CheckboxDescriptionProps> = ({ children, className }) => {
  return (
    <p className={cn('text-[11px] text-[#5C6278] mt-1 ml-8', className)}>
      {children}
    </p>
  );
};

/**
 * Checkbox Card - A card-style checkbox with more prominence
 */
interface CheckboxCardProps extends CheckboxProps {
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Icon to display */
  icon?: React.ReactNode;
}

const CheckboxCard = React.forwardRef<HTMLInputElement, CheckboxCardProps>(
  ({ title, description, icon, className, variant = 'default', id, ...props }, ref) => {
    const cardId = id || React.useId();
    
    const variantBorder = {
      default: 'has-[:checked]:border-[#22D3EE] has-[:checked]:shadow-[0_0_20px_rgba(34,211,238,0.2)]',
      danger: 'has-[:checked]:border-[#F43F5E] has-[:checked]:shadow-[0_0_20px_rgba(244,63,94,0.2)]',
      success: 'has-[:checked]:border-[#22C55E] has-[:checked]:shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    };

    return (
      <label 
        htmlFor={cardId}
        className={cn(
          'group relative flex items-start gap-4 p-4 cursor-pointer',
          'bg-gradient-to-br from-[#0A0E1F] to-[#050817]',
          'border border-[#1E2642] rounded-sm',
          'transition-all duration-200',
          'hover:border-[#2E3652]',
          variantBorder[variant],
          className
        )}
      >
        <Checkbox ref={ref} id={cardId} variant={variant} className="mt-0.5 flex-shrink-0" {...props} />
        
        <div className="flex-1 min-w-0">
          {icon && (
            <div className="mb-2 text-[#5C6278] group-hover:text-[#8A8E9E] transition-colors">
              {icon}
            </div>
          )}
          {title && (
            <h4 className="text-sm font-bold uppercase tracking-[0.08em] text-[#B8BAC4] group-hover:text-white transition-colors">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-xs text-[#5C6278] mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Corner accent */}
        <span className={cn(
          "absolute top-0 right-0 w-2 h-2 border-t border-r opacity-0 group-hover:opacity-100 transition-opacity",
          variant === 'default' && "border-[#22D3EE]",
          variant === 'danger' && "border-[#F43F5E]",
          variant === 'success' && "border-[#22C55E]",
        )} />
      </label>
    );
  }
);

CheckboxCard.displayName = 'CheckboxCard';

export { 
  Checkbox, 
  CheckboxGroup, 
  CheckboxDescription, 
  CheckboxCard 
};
export default Checkbox;
