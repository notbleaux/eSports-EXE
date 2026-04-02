// @ts-nocheck
/**
 * ForumThreadList Component
 * Displays list of threads in a category with sorting and filtering
 * 
 * [Ver001.000] - Initial implementation
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Eye, 
  Pin, 
  Lock,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Clock,
  Flame,
  User,
  Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DataErrorBoundary } from '@/components/error';
import type { ForumThreadListProps, ThreadFilters } from './types';

// AREPO theme colors
const AREPO_THEME = {
  base: '#0066ff',
  glow: 'rgba(0, 102, 255, 0.4)',
  muted: '#0044cc',
};

// Sort options
const SORT_OPTIONS: { value: ThreadFilters['sortBy']; label: string; icon: React.ElementType }[] = [
  { value: 'last-activity', label: 'Last Activity', icon: Clock },
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'most-replies', label: 'Most Replies', icon: MessageSquare },
  { value: 'most-views', label: 'Most Views', icon: Eye },
];

/**
 * Thread row component
 */
interface ThreadRowProps {
  thread: ForumThreadListProps['threads'][0];
  onClick: () => void;
  index: number;
}

function ThreadRow({ thread, onClick, index }: ThreadRowProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      onClick={onClick}
      className={`
        group cursor-pointer
        flex items-center gap-4 p-4 
        border-b border-white/5 last:border-b-0
        hover:bg-white/5 transition-colors duration-150
        ${thread.isPinned ? 'bg-[#0066ff]/5' : ''}
      `}
    >
      {/* Status icons */}
      <div className="flex flex-col items-center gap-1 w-6">
        {thread.isPinned && (
          <Pin className="w-4 h-4 text-[#0066ff]" />
        )}
        {thread.isLocked && (
          <Lock className="w-4 h-4 text-slate" />
        )}
      </div>

      {/* Thread info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-white truncate group-hover:text-[#0066ff] transition-colors">
            {thread.title}
          </h4>
          {thread.tags?.map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 rounded text-xs bg-white/10 text-slate hidden sm:inline-block"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {thread.author.name}
          </span>
          <span>•</span>
          <span>{formatDate(thread.createdAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-slate min-w-[80px] justify-end">
          <MessageSquare className="w-4 h-4" />
          <span>{thread.replies.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-slate min-w-[80px] justify-end">
          <Eye className="w-4 h-4" />
          <span>{thread.views.toLocaleString()}</span>
        </div>
      </div>

      {/* Last activity - Mobile hidden */}
      <div className="hidden lg:block min-w-[140px] text-right">
        <div className="text-xs text-slate">
          {thread.lastReplyAt ? formatDate(thread.lastReplyAt) : formatDate(thread.updatedAt)}
        </div>
        {thread.lastReplyBy && (
          <div className="text-xs text-slate/70 truncate">
            by {thread.lastReplyBy.name}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Pagination component
 */
interface PaginationProps {
  pagination: ForumThreadListProps['pagination'];
  onPageChange: (page: number) => void;
}

function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = pagination;
  
  const pages = useMemo(() => {
    const result: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) result.push(i);
        result.push('...');
        result.push(totalPages);
      } else if (page >= totalPages - 2) {
        result.push(1);
        result.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) result.push(i);
      } else {
        result.push(1);
        result.push('...');
        for (let i = page - 1; i <= page + 1; i++) result.push(i);
        result.push('...');
        result.push(totalPages);
      }
    }
    return result;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
      <div className="text-sm text-slate">
        Showing {((page - 1) * 10) + 1} - {Math.min(page * 10, total)} of {total}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {pages.map((p, i) => (
          p === '...' ? (
            <span key={i} className="px-2 text-slate">...</span>
          ) : (
            <button
              key={i}
              onClick={() => onPageChange(p as number)}
              className={`
                min-w-[36px] h-9 px-3 rounded-lg font-medium text-sm transition-colors
                ${page === p 
                  ? 'bg-[#0066ff] text-white' 
                  : 'hover:bg-white/5 text-slate'
                }
              `}
            >
              {p}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for thread rows
 */
function ThreadRowSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 border-b border-white/5"
    >
      <div className="w-6 h-6 rounded bg-white/5 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="w-3/4 h-5 rounded bg-white/5 animate-pulse" />
        <div className="w-1/2 h-3 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="hidden md:flex items-center gap-6">
        <div className="w-16 h-4 rounded bg-white/5 animate-pulse" />
        <div className="w-16 h-4 rounded bg-white/5 animate-pulse" />
      </div>
    </motion.div>
  );
}

/**
 * Main ForumThreadList component
 */
function ForumThreadList({
  threads,
  category,
  filters,
  pagination,
  onFilterChange,
  onPageChange,
  onSelectThread,
  onNewThread,
  loading = false,
}: ForumThreadListProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ search: e.target.value });
  };

  const handleSortChange = (sortBy: ThreadFilters['sortBy']) => {
    onFilterChange({ sortBy });
  };

  // Separate pinned and regular threads
  const { pinnedThreads, regularThreads } = useMemo(() => {
    if (!filters.showPinned) return { pinnedThreads: [], regularThreads: threads };
    return {
      pinnedThreads: threads.filter(t => t.isPinned),
      regularThreads: threads.filter(t => !t.isPinned),
    };
  }, [threads, filters.showPinned]);

  return (
    <div className="space-y-4">
      {/* Header with category info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-white">
            {category ? category.name : 'All Threads'}
          </h2>
          <p className="text-sm text-slate">
            {category ? category.description : 'Browse all forum discussions'}
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewThread}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                   bg-[#0066ff] text-white hover:bg-[#0066ff]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Thread</span>
        </motion.button>
      </div>

      {/* Filters bar */}
      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
            <input
              type="text"
              placeholder="Search threads..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-void-mid rounded-lg border border-mist 
                       focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                       text-white placeholder-slate text-sm transition-colors"
            />
          </div>
          
          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate hidden sm:inline">Sort by:</span>
            <div className="flex gap-1">
              {SORT_OPTIONS.map(option => {
                const Icon = option.icon;
                const isActive = filters.sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${isActive 
                        ? 'bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/50' 
                        : 'text-slate hover:bg-white/5 hover:text-white'
                      }
                    `}
                    title={option.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Thread list */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }, (_, i) => (
            <ThreadRowSkeleton key={i} index={i} />
          ))
        ) : threads.length === 0 ? (
          // Empty state
          <div className="py-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate/50" />
            <h3 className="font-display font-semibold text-lg text-white mb-2">
              No Threads Found
            </h3>
            <p className="text-slate max-w-md mx-auto">
              {filters.search 
                ? 'No threads match your search criteria.' 
                : 'Be the first to start a discussion in this category!'}
            </p>
          </div>
        ) : (
          <>
            {/* Pinned threads */}
            {pinnedThreads.length > 0 && (
              <div className="border-b border-[#0066ff]/30">
                <div className="px-4 py-2 bg-[#0066ff]/10 text-xs font-medium text-[#0066ff] uppercase tracking-wider">
                  Pinned Threads
                </div>
                {pinnedThreads.map((thread, index) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    onClick={() => onSelectThread(thread)}
                    index={index}
                  />
                ))}
              </div>
            )}
            
            {/* Regular threads */}
            {regularThreads.map((thread, index) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                onClick={() => onSelectThread(thread)}
                index={index + pinnedThreads.length}
              />
            ))}
          </>
        )}
        
        {/* Pagination */}
        {!loading && threads.length > 0 && (
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        )}
      </GlassCard>
    </div>
  );
}

/**
 * Wrapped component with error boundary
 */
export function ForumThreadListWithErrorBoundary(props: ForumThreadListProps) {
  return (
    <DataErrorBoundary
      hubName="arepo"
      componentName="ForumThreadList"
      compact
    >
      <ForumThreadList {...props} />
    </DataErrorBoundary>
  );
}

export default ForumThreadListWithErrorBoundary;
