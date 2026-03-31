/**
 * PanelV2 - Valorant-styled Panel Component
 * Dark tactical panels with subtle red accents
 * 
 * [Ver001.000] - Initial Valorant panel implementation
 */
import React from 'react';
import { cn } from '@/utils/cn';

export interface PanelV2Props extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Panel variant
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'bordered' | 'accent';
  
  /**
   * Panel size/padding
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Add header section
   */
  header?: React.ReactNode;
  
  /**
   * Add footer section
   */
  footer?: React.ReactNode;
  
  /**
   * Full height panel
   * @default false
   */
  fullHeight?: boolean;
  
  /**
   * Add glow effect on hover
   * @default false
   */
  hoverGlow?: boolean;
  
  /**
   * Custom border color (overrides variant)
   */
  borderColor?: 'red' | 'teal' | 'gold' | 'none';
}

export const PanelV2 = React.forwardRef<HTMLDivElement, PanelV2Props>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      header,
      footer,
      fullHeight = false,
      hoverGlow = false,
      borderColor,
      className,
      ...props
    },
    ref
  ) => {
    // Base panel styles
    const baseStyles = `
      relative flex flex-col
      bg-valorant-bg-panel
      rounded-sm
      transition-all duration-200
    `;

    // Variant styles
    const variantStyles = {
      default: `
        border border-valorant-border-subtle
        shadow-valorant-panel
      `,
      elevated: `
        border border-valorant-border-subtle
        shadow-valorant-panel
        bg-valorant-bg-elevated
      `,
      bordered: `
        border-2 border-valorant-border-medium
        shadow-none
        bg-transparent
      `,
      accent: `
        border border-valorant-border-red
        shadow-valorant-glow-sm
        bg-valorant-bg-elevated
      `,
    };

    // Size styles
    const sizeStyles = {
      sm: 'p-3 gap-2',
      md: 'p-4 gap-3',
      lg: 'p-6 gap-4',
    };

    // Border color override
    const borderColorStyles = {
      red: 'border-valorant-border-red shadow-valorant-glow-sm',
      teal: 'border-valorant-accent-teal shadow-valorant-teal',
      gold: 'border-valorant-accent-gold shadow-valorant-gold',
      none: 'border-transparent',
    };

    const panelClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullHeight && 'h-full',
      hoverGlow && 'hover:shadow-valorant-glow hover:border-valorant-border-red transition-all duration-300',
      borderColor && borderColorStyles[borderColor],
      className
    );

    return (
      <div ref={ref} className={panelClasses} {...props}>
        {header && (
          <div className="flex items-center justify-between pb-3 border-b border-valorant-border-subtle">
            {typeof header === 'string' ? (
              <h3 className="text-valorant-text-primary font-semibold uppercase tracking-wider text-sm">
                {header}
              </h3>
            ) : (
              header
            )}
          </div>
        )}
        
        <div className="flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="flex items-center justify-between pt-3 border-t border-valorant-border-subtle">
            {typeof footer === 'string' ? (
              <span className="text-valorant-text-muted text-xs">{footer}</span>
            ) : (
              footer
            )}
          </div>
        )}
      </div>
    );
  }
);

PanelV2.displayName = 'PanelV2';

// Convenience components for panel sections
export const PanelV2Header: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className }) => (
  <div className={cn("flex items-center justify-between", className)}>
    <div>
      <h3 className="text-valorant-text-primary font-semibold uppercase tracking-wider text-sm">
        {title}
      </h3>
      {subtitle && (
        <p className="text-valorant-text-muted text-xs mt-0.5">{subtitle}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const PanelV2Footer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("flex items-center justify-between text-xs", className)}>
    {children}
  </div>
);

export default PanelV2;
