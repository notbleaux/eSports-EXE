/**
 * ForumCategoryList Component
 * Displays grid of forum categories with icons and thread counts
 * 
 * [Ver001.000] - Initial implementation
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Trophy, 
  Brain, 
  MessageSquare,
  ChevronRight,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DataErrorBoundary } from '@/components/error';
import type { ForumCategoryListProps } from './types';

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Trophy,
  Brain,
  MessageSquare,
};

// AREPO theme colors
const AREPO_THEME = {
  base: '#0066ff',
  glow: 'rgba(0, 102, 255, 0.4)',
  muted: '#0044cc',
};

/**
 * Individual category card component
 */
interface CategoryCardProps {
  category: ForumCategoryListProps['categories'][0];
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

function CategoryCard({ category, isSelected, onClick, index }: CategoryCardProps) {
  const Icon = ICON_MAP[category.icon] || MessageCircle;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <GlassCard
        onClick={onClick}
        hoverGlow={AREPO_THEME.glow}
        className={`
          h-full cursor-pointer group
          ${isSelected ? 'border-[#0066ff] bg-[#0066ff]/10' : ''}
        `}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header with icon */}
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-200"
              style={{ 
                backgroundColor: isSelected 
                  ? `${AREPO_THEME.base}30` 
                  : 'rgba(255,255,255,0.05)',
              }}
            >
              <Icon 
                className="w-7 h-7 transition-colors duration-200"
                style={{ color: isSelected ? AREPO_THEME.base : '#a0a0b0' }}
              />
            </div>
            
            {/* Thread count badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs">
              <MessageCircle className="w-3.5 h-3.5 text-slate" />
              <span className="text-slate font-medium">
                {category.threadCount.toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* Category info */}
          <div className="flex-1">
            <h3 
              className="font-display font-semibold text-lg mb-2 transition-colors duration-200"
              style={{ color: isSelected ? AREPO_THEME.base : '#ffffff' }}
            >
              {category.name}
            </h3>
            <p className="text-sm text-slate leading-relaxed">
              {category.description}
            </p>
          </div>
          
          {/* Footer with arrow */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <span 
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: isSelected ? AREPO_THEME.base : '#a0a0b0' }}
            >
              Browse threads
            </span>
            <ChevronRight 
              className={`
                w-4 h-4 transition-all duration-200
                ${isSelected ? 'translate-x-1' : 'group-hover:translate-x-1'}
              `}
              style={{ color: isSelected ? AREPO_THEME.base : '#a0a0b0' }}
            />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/**
 * Loading skeleton for category cards
 */
function CategoryCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard className="h-full">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-white/5 animate-pulse" />
            <div className="w-16 h-7 rounded-full bg-white/5 animate-pulse" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="w-3/4 h-6 rounded bg-white/5 animate-pulse" />
            <div className="w-full h-4 rounded bg-white/5 animate-pulse" />
            <div className="w-2/3 h-4 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/**
 * Empty state when no categories available
 */
function EmptyState() {
  return (
    <div className="col-span-full py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-slate" />
      </div>
      <h3 className="font-display font-semibold text-lg text-white mb-2">
        No Categories Found
      </h3>
      <p className="text-slate max-w-md mx-auto">
        There are no forum categories available at the moment. Please check back later.
      </p>
    </div>
  );
}

/**
 * Main ForumCategoryList component
 */
function ForumCategoryList({
  categories,
  onSelectCategory,
  selectedCategoryId,
  loading = false,
}: ForumCategoryListProps) {
  // Header animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    },
  };

  // Memoized grid class
  const gridClass = useMemo(() => {
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-display font-bold text-2xl text-white mb-1">
            Forum Categories
          </h2>
          <p className="text-slate text-sm">
            Select a category to browse discussions
          </p>
        </div>
        
        {/* Category count */}
        {!loading && categories.length > 0 && (
          <div className="px-4 py-2 rounded-lg bg-white/5 text-sm">
            <span className="text-slate">Categories: </span>
            <span className="font-medium" style={{ color: AREPO_THEME.base }}>
              {categories.length}
            </span>
          </div>
        )}
      </motion.div>

      {/* Categories Grid */}
      <div className={gridClass}>
        {loading ? (
          // Loading skeletons
          Array.from({ length: 4 }, (_, i) => (
            <CategoryCardSkeleton key={i} index={i} />
          ))
        ) : categories.length === 0 ? (
          <EmptyState />
        ) : (
          categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={category.id === selectedCategoryId}
              onClick={() => onSelectCategory(category)}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Wrapped component with error boundary
 */
export function ForumCategoryListWithErrorBoundary(props: ForumCategoryListProps) {
  return (
    <DataErrorBoundary
      hubName="arepo"
      componentName="ForumCategoryList"
      compact
    >
      <ForumCategoryList {...props} />
    </DataErrorBoundary>
  );
}

export default ForumCategoryListWithErrorBoundary;
