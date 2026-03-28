/**
 * MinimapFrameGrid Component
 *
 * Main component for displaying extracted VOD frames in a paginated grid.
 * Supports pagination, loading states, error handling, and responsive layout.
 * Includes admin pinning functionality via TeNET (MF-9).
 *
 * Tasks: MF-5, MF-8, MF-9
 *
 * [Ver002.000] - Phase 2: Admin pinning support (MF-9)
 * [Ver001.000] - Initial component implementation (MF-5)
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ImageOff,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { colors } from '@/theme/colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { FrameThumbnail } from './FrameThumbnail';
import { useMinimapFrames, useFramePinning } from '@/hooks/useMinimapFrames';
import { useAuthStore } from '@/stores/authStore';
import type { MinimapFrameGridProps } from './types';

/**
 * Pagination Controls Component
 */
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  onNext: () => void;
  onPrev: () => void;
  totalItems: number;
  pageSize: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  hasMore,
  onNext,
  onPrev,
  totalItems,
  pageSize,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/10">
      {/* Page Info */}
      <div className="text-sm" style={{ color: colors.text.muted }}>
        {totalItems > 0 ? (
          <span>
            Showing <span className="text-white">{startItem}</span> -{' '}
            <span className="text-white">{endItem}</span> of{' '}
            <span className="text-white">{totalItems}</span> frames
          </span>
        ) : (
          <span>No frames</span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage <= 1}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium',
            'transition-all duration-200',
            'border border-white/10',
            currentPage <= 1
              ? 'opacity-40 cursor-not-allowed bg-white/5'
              : 'hover:bg-white/10 hover:border-white/20'
          )}
          style={{ color: colors.text.secondary }}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Indicator */}
        <div
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white/5 border border-white/10 min-w-[80px] text-center"
          style={{ color: colors.text.primary }}
          aria-label={`Page ${currentPage} of ${totalPages}`}
        >
          {currentPage} / {totalPages || 1}
        </div>

        <button
          onClick={onNext}
          disabled={!hasMore}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium',
            'transition-all duration-200',
            'border border-white/10',
            !hasMore
              ? 'opacity-40 cursor-not-allowed bg-white/5'
              : 'hover:bg-white/10 hover:border-white/20'
          )}
          style={{ color: colors.text.secondary }}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Loading State Component
 */
const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2
      className="w-10 h-10 mb-4 animate-spin"
      style={{ color: colors.hub.rotas }}
    />
    <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
      Loading frames...
    </p>
    <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
      Fetching VOD frames from archive
    </p>
  </div>
);

/**
 * Error State Component
 */
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style={{ backgroundColor: `${colors.status.error}20` }}
    >
      <AlertCircle
        className="w-8 h-8"
        style={{ color: colors.status.error }}
      />
    </div>
    <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
      Failed to load frames
    </p>
    <p
      className="text-sm mt-1 text-center max-w-md"
      style={{ color: colors.text.muted }}
    >
      {error.message || 'An unexpected error occurred while fetching frames.'}
    </p>
    <button
      onClick={onRetry}
      className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-80"
      style={{
        backgroundColor: colors.hub.rotas,
        color: '#fff',
      }}
    >
      Try Again
    </button>
  </div>
);

/**
 * Empty State Component
 */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style={{ backgroundColor: `${colors.status.info}15` }}
    >
      <ImageOff
        className="w-8 h-8"
        style={{ color: colors.status.info }}
      />
    </div>
    <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
      No frames found
    </p>
    <p
      className="text-sm mt-1 text-center max-w-md"
      style={{ color: colors.text.muted }}
    >
      This match doesn&apos;t have any extracted frames yet. Frames will appear here once the VOD processing is complete.
    </p>
  </div>
);

/**
 * MinimapFrameGrid - Main component for frame grid display
 *
 * @example
 * ```tsx
 * <MinimapFrameGrid matchId="match-123" pageSize={50} />
 * <MinimapFrameGrid
 *   matchId="match-456"
 *   pageSize={50}
 *   onFrameClick={(frame) => console.log(frame)}
 * />
 * ```
 */
export const MinimapFrameGrid: React.FC<MinimapFrameGridProps> = ({
  matchId,
  pageSize = 50,
  className,
  onFrameClick,
}) => {
  const {
    frames,
    isLoading,
    isError,
    error,
    hasMore,
    currentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    refetch,
  } = useMinimapFrames({
    matchId,
    pageSize,
  });

  // Admin pinning functionality (MF-9)
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.username === 'admin' || user?.role === 'admin';
  const { handlePinToggle, isPinning, pinError } = useFramePinning(matchId);

  return (
    <GlassCard
      className={cn('overflow-hidden', className)}
      hubTheme="rotas"
      glowIntensity="subtle"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            Minimap Frames
          </h3>
          <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
            Extracted frames from VOD analysis
          </p>
        </div>
        {isLoading && (
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: colors.text.muted }}
          />
        )}
      </div>

      {/* Pin Error Toast */}
      {pinError && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg bg-red-500/90 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{pinError.message}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState error={error!} onRetry={refetch} />
        ) : frames.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {/* Responsive Grid */}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: 'repeat(2, 1fr)',
              }}
            >
              {/* Mobile: 2 cols, Tablet: 4 cols, Desktop: 6 cols */}
              {frames.map((frame) => (
                <FrameThumbnail
                  key={frame.frameId}
                  frame={frame}
                  onClick={onFrameClick ? () => onFrameClick(frame) : undefined}
                  onPinToggle={handlePinToggle}
                  isAdmin={isAdmin}
                  isPinning={isPinning}
                  className="sm:col-span-1 md:col-span-1 lg:col-span-1"
                />
              ))}
            </div>

            {/* CSS for responsive grid breakpoints */}
            <style>{`
              @media (min-width: 640px) {
                .grid { grid-template-columns: repeat(4, 1fr) !important; }
              }
              @media (min-width: 1024px) {
                .grid { grid-template-columns: repeat(6, 1fr) !important; }
              }
            `}</style>
          </motion.div>
        )}
      </div>

      {/* Pagination - Only show when we have frames */}
      {!isLoading && !isError && frames.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasMore={hasMore}
          onNext={nextPage}
          onPrev={prevPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}
    </GlassCard>
  );
};

export default MinimapFrameGrid;
