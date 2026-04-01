import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Valorant-Style Panel Component
 * 
 * Replaces GlassCard with a sharp, tactical panel design.
 * 
 * Design Reference:
 * - Sharp corners (2-4px radius max)
 * - Dark gradient background
 * - Optional accent border (red or cyan)
 * - Optional edge accent line
 * - Subtle inner shadow for depth
 * 
 * @example
 * <Panel>Basic tactical panel</Panel>
 * <Panel variant="accent" accentColor="red" header="INTEL">Content</Panel>
 * <Panel variant="elevated" edgeAccent="cyan">Elevated content</Panel>
 */

export type PanelVariant = 'default' | 'accent' | 'elevated' | 'flat' | 'outlined' | 'minimal';
export type PanelPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type PanelAccentColor = 'none' | 'red' | 'cyan' | 'purple' | 'green';
export type PanelEdgeAccent = 'none' | 'red' | 'cyan' | 'purple';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: PanelVariant;
  /** Padding size */
  padding?: PanelPadding;
  /** Accent color for borders */
  accentColor?: PanelAccentColor;
  /** Edge accent color (top gradient line) */
  edgeAccent?: PanelEdgeAccent;
  /** Header text (renders as uppercase tactical label) */
  header?: string;
  /** Header action element (button, icon, etc) */
  headerAction?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Disable inner shadow */
  noInnerShadow?: boolean;
  /** Hover effect */
  hover?: boolean;
}

const variantStyles: Record<PanelVariant, string> = {
  default: '',
  accent: '',
  elevated: 'shadow-[0_8px_40px_rgba(0,0,0,0.5)]',
  flat: 'bg-[#0A0E1F]',
  outlined: 'border-2',
  minimal: 'bg-transparent border-[#2E3652]',
};

const paddingStyles: Record<PanelPadding, string> = {
  none: 'p-0',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
  '2xl': 'p-8',
};

const accentColorStyles: Record<PanelAccentColor, string> = {
  none: '',
  red: 'border-l-2 border-l-[#F43F5E]',
  cyan: 'border-l-2 border-l-[#22D3EE]',
  purple: 'border-l-2 border-l-[#A855F7]',
  green: 'border-l-2 border-l-[#22C55E]',
};

const edgeAccentStyles: Record<PanelEdgeAccent, string> = {
  none: '',
  red: 'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-[#F43F5E] before:via-[#F43F5E]/50 before:to-transparent',
  cyan: 'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-[#22D3EE] before:via-[#22D3EE]/50 before:to-transparent',
  purple: 'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-[#A855F7] before:via-[#A855F7]/50 before:to-transparent',
};

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      accentColor = 'none',
      edgeAccent = 'none',
      header,
      headerAction,
      footer,
      noInnerShadow = false,
      hover = false,
      children,
      ...props
    },
    ref
  ) => {
    // Compound variant logic
    const getCompoundStyles = () => {
      const styles: string[] = [];
      
      if (variant === 'accent') {
        if (accentColor === 'red') styles.push('border-[#F43F5E]/50');
        if (accentColor === 'cyan') styles.push('border-[#22D3EE]/50');
        if (accentColor === 'purple') styles.push('border-[#A855F7]/50');
        if (accentColor === 'green') styles.push('border-[#22C55E]/50');
      }
      
      if (variant === 'outlined') {
        if (accentColor === 'red') styles.push('border-[#F43F5E]');
        if (accentColor === 'cyan') styles.push('border-[#22D3EE]');
      }
      
      return styles.join(' ');
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'relative overflow-hidden',
          'bg-gradient-to-br from-[#0A0E1F] to-[#050817]',
          'border border-[#1E2642]',
          'rounded-sm',
          'transition-all duration-200',
          // Variant, padding, accent styles
          variantStyles[variant],
          paddingStyles[padding],
          accentColorStyles[accentColor],
          edgeAccentStyles[edgeAccent],
          getCompoundStyles(),
          !noInnerShadow && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
          hover && 'hover:border-[#2E3652] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]',
          className
        )}
        {...props}
      >
        {/* Header */}
        {header && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2642]">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#8A8E9E]">
              {header}
            </span>
            {headerAction && (
              <div className="flex-shrink-0">{headerAction}</div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-4 pt-3 border-t border-[#1E2642]">{footer}</div>
        )}

        {/* Corner accent decoration */}
        {accentColor !== 'none' && (
          <span 
            className={cn(
              "absolute bottom-0 right-0 w-3 h-3 border-b border-r",
              accentColor === 'red' && "border-[#F43F5E]/30",
              accentColor === 'cyan' && "border-[#22D3EE]/30",
              accentColor === 'purple' && "border-[#A855F7]/30",
              accentColor === 'green' && "border-[#22C55E]/30",
            )}
          />
        )}
      </div>
    );
  }
);

Panel.displayName = 'Panel';

/**
 * Panel Grid - For creating grid layouts with consistent spacing
 */
interface PanelGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const PanelGrid = React.forwardRef<HTMLDivElement, PanelGridProps>(
  ({ className, columns = 2, gap = 'md', children, ...props }, ref) => {
    const gapClasses = {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-5',
      xl: 'gap-6',
    };

    const colClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
    };

    return (
      <div
        ref={ref}
        className={cn('grid', colClasses[columns], gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PanelGrid.displayName = 'PanelGrid';

/**
 * Panel Section - For grouping related content within a panel
 */
interface PanelSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  divider?: boolean;
}

const PanelSection = React.forwardRef<HTMLDivElement, PanelSectionProps>(
  ({ className, title, divider = true, children, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn(divider && 'py-3 first:pt-0 last:pb-0 border-b border-[#1E2642] last:border-0', className)}
        {...props}
      >
        {title && (
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C6278] mb-2">
            {title}
          </h4>
        )}
        {children}
      </div>
    );
  }
);

PanelSection.displayName = 'PanelSection';

export { Panel, PanelGrid, PanelSection };
export default Panel;
