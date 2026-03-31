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

export default HubWrapper;
