/**
 * Loading State Component
 *
 * Reusable loading indicators for data-heavy sections.
 * Provides skeleton loading and animated spinners.
 *
 * [Ver001.000]
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'pulse';
  text?: string;
  fullHeight?: boolean;
}

export function LoadingState({
  variant = 'spinner',
  text = 'Loading...',
  fullHeight = false,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${fullHeight ? 'min-h-screen' : ''}`}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-12 bg-white/[0.05] rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${fullHeight ? 'min-h-screen' : 'py-12'}`}>
        <div className="space-y-4 w-full max-w-sm">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 mx-auto bg-white/10 rounded-full"
          />
          <p className="text-center text-sm text-white/50">{text}</p>
        </div>
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullHeight ? 'min-h-screen' : 'py-12'}`}>
      <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      {text && <p className="text-sm text-white/50">{text}</p>}
    </div>
  );
}

/**
 * Skeleton loader for individual items
 */
export function SkeletonItem() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="p-4 border border-white/10 rounded-lg space-y-3"
    >
      <div className="h-4 bg-white/[0.05] rounded w-3/4" />
      <div className="h-3 bg-white/[0.05] rounded w-1/2" />
    </motion.div>
  );
}

/**
 * Loading grid with skeleton items
 */
interface SkeletonGridProps {
  count?: number;
  columns?: number;
}

export function SkeletonGrid({ count = 6, columns = 3 }: SkeletonGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1.5rem' }}>
      {[...Array(count)].map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </div>
  );
}
