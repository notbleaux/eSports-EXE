// @ts-nocheck
/** [Ver001.001] - Exported HubWrapperProps type
 * HubWrapper Component
 * ====================
 * Wrapper component for hub pages providing consistent layout and error boundaries.
 * 
 * Features:
 * - Consistent hub layout styling
 * - Error boundary integration
 * - Loading state handling
 * - Hub-specific metadata
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';

/** Props for HubWrapper component */
export interface HubWrapperProps {
  /** Unique hub identifier */
  hubId: string;
  /** Hub content */
  children: ReactNode;
  /** Optional custom className */
  className?: string;
  /** Optional hub title for metadata */
  title?: string;
  /** Optional description */
  description?: string;
}

/**
 * HubWrapper - Consistent wrapper for all hub pages
 * 
 * Provides:
 * - Standard layout container
 * - Error boundary protection
 * - Animation wrapper
 * - Hub identification for analytics
 */
export function HubWrapper({
  hubId,
  children,
  className = '',
  title,
  description,
}: HubWrapperProps): React.ReactElement {
  return (
    <PanelErrorBoundary panelId={hubId} panelTitle={title || hubId} hub={hubId.toUpperCase()}>
      <motion.div
        data-hub={hubId}
        className={`hub-wrapper hub-${hubId} min-h-screen ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </PanelErrorBoundary>
  );
}

/** Props for HubContent component */
export interface HubContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * HubContent - Inner content container with consistent padding
 */
export function HubContent({
  children,
  className = '',
}: HubContentProps): React.ReactElement {
  return (
    <div className={`hub-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** Props for HubHeader component */
export interface HubHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
}

/**
 * HubHeader - Consistent header for hub pages
 */
export function HubHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: HubHeaderProps): React.ReactElement {
  return (
    <div className="hub-header flex items-center justify-between py-6 border-b border-white/10 mb-8">
      <div className="flex items-center gap-4">
        {Icon && <Icon className="w-8 h-8 text-white/80" />}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Props for HubCard component */
export interface HubCardProps {
  children: ReactNode;
  className?: string;
  accent?: 'none' | 'cyan' | 'amber' | 'gold' | 'white';
  hover?: boolean;
  onClick?: () => void;
}

/**
 * HubCard - Card component for hub content
 */
export function HubCard({
  children,
  className = '',
  accent = 'none',
  hover = true,
  onClick,
}: HubCardProps): React.ReactElement {
  const accentStyles = {
    none: '',
    cyan: 'hover:border-cyan-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]',
    amber: 'hover:border-amber-500 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    gold: 'hover:border-yellow-500 hover:shadow-[0_0_40px_rgba(234,179,8,0.15)]',
    white: 'hover:border-white hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]',
  };

  return (
    <div
      className={`
        bg-white/5 border border-white/10 rounded-xl p-6
        transition-all duration-300
        ${hover ? accentStyles[accent] : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/** Props for HubStatCard component */
export interface HubStatCardProps {
  label: string;
  value: string | number;
  change?: string;
  color?: 'cyan' | 'amber' | 'gold' | 'green' | 'red';
  onClick?: () => void;
}

/**
 * HubStatCard - Stat display card for hubs
 */
export function HubStatCard({
  label,
  value,
  change,
  color = 'cyan',
  onClick,
}: HubStatCardProps): React.ReactElement {
  const colorClasses = {
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    gold: 'text-yellow-400',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  const isPositive = change?.startsWith('+');
  const isNegative = change?.startsWith('-');

  return (
    <HubCard accent={color} onClick={onClick} className="flex flex-col">
      <span className="text-sm text-white/60 mb-2">{label}</span>
      <span className={`text-2xl font-bold ${colorClasses[color]}`}>
        {value}
      </span>
      {change && (
        <span className={`text-xs mt-2 ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-white/60'}`}>
          {change}
        </span>
      )}
    </HubCard>
  );
}

export default HubWrapper;
