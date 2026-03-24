/** [Ver001.000] */
/**
 * Panel Component
 * ===============
 * Card container component for organizing content sections.
 * 
 * Features:
 * - Header with title and actions
 * - Hover animation with lift effect
 * - KPI row support with trend indicators
 * - Accessible with proper ARIA attributes
 * 
 * Ported from: ui/components/panel.html
 */

import React from 'react';

export interface PanelProps {
  /** Panel title text */
  title: string;
  /** Optional ID for aria-labelledby */
  titleId?: string;
  /** Action buttons or elements for header */
  actions?: React.ReactNode;
  /** Enable hover lift animation */
  hoverable?: boolean;
  /** Panel content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for the panel section */
  ariaLabel?: string;
}

export interface KpiCardProps {
  /** KPI value display */
  value: string | number;
  /** KPI label */
  label: string;
  /** Optional trend indicator */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  /** Additional CSS classes */
  className?: string;
}

export interface MatchItemProps {
  /** Match title */
  title: string;
  /** Match metadata (e.g., "Ascent • 2 hours ago") */
  meta: string;
  /** Score display (e.g., "13-11") */
  score: string;
  /** Optional thumbnail/map indicator */
  thumbnail?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Panel Component - Card container with header and body
 */
export const Panel = React.forwardRef<HTMLElement, PanelProps>(
  (
    {
      title,
      titleId,
      actions,
      hoverable = false,
      children,
      className = '',
      ariaLabel,
    },
    ref
  ) => {
    const generatedTitleId = titleId || `panel-title-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <section
        ref={ref}
        className={`
          bg-white dark:bg-gray-800 
          rounded-lg 
          shadow-md 
          p-6 
          mb-6 
          overflow-hidden
          transition-all duration-200 ease-out
          ${hoverable ? 'hover:-translate-y-1.5 hover:shadow-lg' : ''}
          ${className}
        `}
        aria-label={ariaLabel}
        aria-labelledby={generatedTitleId}
      >
        <header className="flex justify-between items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 
            id={generatedTitleId}
            className="font-semibold text-gray-900 dark:text-white text-lg m-0"
          >
            {title}
          </h3>
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </header>
        <div className="text-gray-600 dark:text-gray-300">
          {children}
        </div>
      </section>
    );
  }
);

Panel.displayName = 'Panel';

/**
 * KpiCard Component - Individual KPI display card
 */
export const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ value, label, trend, className = '' }, ref) => {
    const trendColor = trend?.direction === 'up' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
    
    const trendIcon = trend?.direction === 'up' ? '↑' : '↓';
    
    return (
      <div
        ref={ref}
        className={`
          bg-gray-50 dark:bg-gray-700 
          p-4 
          rounded-md 
          text-center
          transition-colors duration-200 ease-out
          hover:bg-gray-100 dark:hover:bg-gray-600
          ${className}
        `}
      >
        <div className="font-bold text-2xl text-gray-900 dark:text-white leading-none">
          {value}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {label}
        </div>
        {trend && (
          <div className={`text-xs mt-1 ${trendColor}`}>
            {trendIcon} {Math.abs(trend.value)}% vs last week
          </div>
        )}
      </div>
    );
  }
);

KpiCard.displayName = 'KpiCard';

/**
 * KpiRow Component - Row of KPI cards
 */
export interface KpiRowProps {
  children: React.ReactNode;
  className?: string;
}

export const KpiRow = React.forwardRef<HTMLDivElement, KpiRowProps>(
  ({ children, className = '' }, ref) => (
    <div
      ref={ref}
      className={`
        grid 
        grid-cols-2 
        sm:grid-cols-4 
        gap-4 
        mb-6
        ${className}
      `}
    >
      {children}
    </div>
  )
);

KpiRow.displayName = 'KpiRow';

/**
 * MatchItem Component - Individual match list item
 */
export const MatchItem = React.forwardRef<HTMLDivElement, MatchItemProps>(
  ({ title, meta, score, thumbnail, onClick, className = '' }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        flex 
        items-center 
        gap-4 
        p-3 
        bg-gray-50 dark:bg-gray-700 
        rounded-md
        transition-colors duration-200 ease-out
        ${onClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500' : ''}
        ${className}
      `}
    >
      {thumbnail && (
        <div className="w-15 h-10 bg-gradient-to-br from-primary-100 to-transparent rounded flex items-center justify-center text-xs text-primary-600 dark:text-primary-400 flex-shrink-0">
          {thumbnail}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white truncate">
          {title}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {meta}
        </div>
      </div>
      <div className="font-bold text-xl text-gray-900 dark:text-white flex-shrink-0">
        {score}
      </div>
    </div>
  )
);

MatchItem.displayName = 'MatchItem';

/**
 * MatchList Component - Container for match items
 */
export interface MatchListProps {
  children: React.ReactNode;
  className?: string;
}

export const MatchList = React.forwardRef<HTMLDivElement, MatchListProps>(
  ({ children, className = '' }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col gap-2 ${className}`}
      role="list"
    >
      {children}
    </div>
  )
);

MatchList.displayName = 'MatchList';

/**
 * SparklinePlaceholder Component - Placeholder for future chart integration
 */
export interface SparklinePlaceholderProps {
  className?: string;
}

export const SparklinePlaceholder = React.forwardRef<HTMLDivElement, SparklinePlaceholderProps>(
  ({ className = '' }, ref) => (
    <div
      ref={ref}
      className={`
        h-10 
        bg-gradient-to-r from-primary-100 via-primary-500 to-primary-100 
        rounded 
        opacity-30
        ${className}
      `}
      aria-hidden="true"
    />
  )
);

SparklinePlaceholder.displayName = 'SparklinePlaceholder';

// Default export for convenience
export default Panel;
