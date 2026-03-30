/**
 * AnalyticsSection Component for SATOR Hub
 * 
 * Integrates PredictionAccuracyDashboard into the SATOR hub
 * with responsive layout and SATOR-themed styling.
 * 
 * [Ver001.000]
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ChevronRight, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PredictionAccuracyDashboard } from '@/components/analytics/PredictionAccuracyDashboard';
import { colors } from '@/theme/colors';

// ============================================================================
// Types
// ============================================================================

interface AnalyticsSectionProps {
  className?: string;
  compact?: boolean;
}

// ============================================================================
// Compact Analytics Card (for overview grids)
// ============================================================================

interface CompactAnalyticsCardProps {
  onExpand?: () => void;
}

export function CompactAnalyticsCard({ onExpand }: CompactAnalyticsCardProps) {
  return (
    <GlassCard
      hoverGlow={colors.hub.sator.base}
      className="p-4 cursor-pointer group"
      onClick={onExpand}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${colors.hub.sator.base}20` }}
          >
            <BarChart3 className="w-5 h-5" style={{ color: colors.hub.sator.base }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Analytics</h3>
            <p className="text-xs text-white/50">ML Prediction Accuracy</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
      </div>
      
      {/* Mini stats preview */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-lg font-bold" style={{ color: colors.hub.sator.base }}>
            78.5%
          </div>
          <div className="text-[10px] text-white/40 uppercase">Accuracy</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-lg font-bold text-green-400">
            4
          </div>
          <div className="text-[10px] text-white/40 uppercase">Models</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-lg font-bold text-white">
            1.2k
          </div>
          <div className="text-[10px] text-white/40 uppercase">Predictions</div>
        </div>
      </div>
      
      {/* Beta badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
          <Sparkles className="w-3 h-3" />
          Beta
        </span>
        <span className="text-[10px] text-white/30">Real-time updates</span>
      </div>
    </GlassCard>
  );
}

// ============================================================================
// Full Analytics Section
// ============================================================================

export function AnalyticsSection({ className = '', compact = false }: AnalyticsSectionProps) {
  if (compact) {
    return (
      <CompactAnalyticsCard />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${colors.hub.sator.base}20` }}
          >
            <BarChart3 className="w-5 h-5" style={{ color: colors.hub.sator.base }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Analytics</h2>
            <p className="text-sm text-white/50">
              Machine Learning prediction accuracy and performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <PredictionAccuracyDashboard />
    </motion.div>
  );
}

// ============================================================================
// Analytics Tab Content (for tabbed interfaces)
// ============================================================================

export function AnalyticsTabContent() {
  return (
    <div className="p-4 sm:p-6">
      <PredictionAccuracyDashboard />
    </div>
  );
}

export default AnalyticsSection;
