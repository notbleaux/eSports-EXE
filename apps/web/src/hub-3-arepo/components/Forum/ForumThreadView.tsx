// @ts-nocheck
/**
 * ForumThreadView Component
 * Displays a full thread with original post and replies
 * 
 * [Ver001.000] - Initial implementation
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MessageSquare,
  Eye,
  Lock,
  Pin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DataErrorBoundary } from '@/components/error';
import ForumPost from './ForumPost';
import type { ForumThreadViewProps, ForumPost as ForumPostType } from './types';

// AREPO theme colors
const AREPO_THEME = {
  base: '#0066ff',
  glow: 'rgba(0, 102, 255, 0.4)',
  muted: '#0044cc',
};

/**
 * Thread header component
 */
interface ThreadHeaderProps {
  thread: ForumThreadViewProps['thread'];
  onBack: () => void;
}

function ThreadHeader({ thread, onBack }: ThreadHeaderProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mb-6">
      {/* Back button */}
      <motion.button
        whileHover={{ x: -4 }}
        onClick={onBack}
        className="flex items-center gap-2 text-slate hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to threads</span>
      </motion.button>

      {/* Thread title */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex flex-col gap-1">
          {thread.isPinned && (
            <Pin className="w-5 h-5 text-[#0066ff]" />
          )}
          {thread.isLocked && (
            <Lock className="w-5 h-5 text-slate" />
          )}
        </div>
        <h1 className="font-display font-bold text-2xl text-white leading-tight">
          {thread.title}
        </h1>
      </div>

      {/* Thread metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate">
        <div className="flex items-center gap-2">
          <img 
            src={thread.author.avatar} 
            alt={thread.author.name}
            className="w-6 h-6 rounded-full"
          />
          <span className="font-medium text-white">{thread.author.name}</span>
          <span 
            className="px-2 py-0.5 rounded text-xs capitalize"
            style={{ 
              backgroundColor: thread.author.role === 'admin' ? 'rgba(255, 0, 0, 0.2)' :
                              thread.author.role === 'moderator' ? 'rgba(0, 255, 136, 0.2)' :
                              'rgba(255, 255, 255, 0.1)',
              color: thread.author.role === 'admin' ? '#ff4655' :
                     thread.author.role === 'moderator' ? '#00ff88' :
                     '#a0a0b0'
            }}
          >
            {thread.author.role}
          </span>
        </div>
        
        <span className="hidden sm:inline">•</span>
        
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{formatDate(thread.createdAt)}</span>
        </div>
        
        <span className="hidden sm:inline">•</span>
        
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {thread.replies} replies
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {thread.views.toLocaleString()} views
          </span>
        </div>
      </div>

      {/* Tags */}
      {thread.tags && thread.tags.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          {thread.tags.map(tag => (
            <span 
              key={tag}
              className="px-3 py-1 rounded-full text-xs bg-white/10 text-slate"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Pagination component for posts
 */
interface PostsPaginationProps {
  pagination: ForumThreadViewProps['pagination'];
  onPageChange: (page: number) => void;
}

function PostsPagination({ pagination, onPageChange }: PostsPaginationProps) {
  const { page, totalPages, total } = pagination;
  
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
      <div className="text-sm text-slate">
        Page {page} of {totalPages} ({total} posts)
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
                   hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
                   hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for thread view
 */
function ThreadViewSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="w-32 h-4 rounded bg-white/5 animate-pulse mb-4" />
        <div className="w-3/4 h-8 rounded bg-white/5 animate-pulse mb-4" />
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded-full bg-white/5 animate-pulse" />
          <div className="w-32 h-4 rounded bg-white/5 animate-pulse" />
          <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
      
      {/* Posts skeleton */}
      {Array.from({ length: 3 }, (_, i) => (
        <GlassCard key={i} className="p-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="w-32 h-4 rounded bg-white/5 animate-pulse" />
              <div className="w-full h-20 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

/**
 * Reply button component
 */
function ReplyButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-xl font-medium
               bg-[#0066ff] text-white hover:bg-[#0066ff]/90 
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-colors flex items-center justify-center gap-2"
    >
      <MessageSquare className="w-5 h-5" />
      Post a Reply
    </motion.button>
  );
}

/**
 * Main ForumThreadView component
 */
function ForumThreadView({
  thread,
  posts,
  pagination,
  onPageChange,
  onReply,
  onBack,
  loading = false,
}: ForumThreadViewProps) {
  // Separate original post from replies
  const { originalPost, replies } = useMemo(() => {
    if (posts.length === 0) return { originalPost: null, replies: [] };
    return {
      originalPost: posts[0],
      replies: posts.slice(1),
    };
  }, [posts]);

  // Handle post actions
  const handleQuote = (post: ForumPostType) => {
    console.log('Quote post:', post.id);
  };

  const handleLike = (postId: string) => {
    console.log('Like post:', postId);
  };

  const handleEdit = (post: ForumPostType) => {
    console.log('Edit post:', post.id);
  };

  if (loading) {
    return <ThreadViewSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Thread header */}
      <ThreadHeader thread={thread} onBack={onBack} />

      {/* Original post */}
      {originalPost && (
        <ForumPost
          post={originalPost}
          isOriginalPost={true}
          onQuote={handleQuote}
          onLike={handleLike}
          onEdit={originalPost.author.id === thread.author.id ? handleEdit : undefined}
        />
      )}

      {/* Reply button */}
      {!thread.isLocked && (
        <div className="py-2">
          <ReplyButton onClick={onReply} disabled={thread.isLocked} />
        </div>
      )}

      {/* Locked notice */}
      {thread.isLocked && (
        <GlassCard className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-3 text-yellow-500">
            <Lock className="w-5 h-5" />
            <span className="font-medium">This thread is locked</span>
          </div>
          <p className="text-sm text-slate mt-1 ml-8">
            No new replies can be added to this thread.
          </p>
        </GlassCard>
      )}

      {/* Replies section */}
      {replies.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-slate font-medium">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {replies.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              <ForumPost
                post={post}
                isOriginalPost={false}
                onQuote={handleQuote}
                onLike={handleLike}
                onEdit={post.author.id === thread.author.id ? handleEdit : undefined}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <PostsPagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}

/**
 * Wrapped component with error boundary
 */
export function ForumThreadViewWithErrorBoundary(props: ForumThreadViewProps) {
  return (
    <DataErrorBoundary
      hubName="arepo"
      componentName="ForumThreadView"
      compact
    >
      <ForumThreadView {...props} />
    </DataErrorBoundary>
  );
}

export default ForumThreadViewWithErrorBoundary;
