// @ts-nocheck
/**
 * ForumContainer Component
 * Main container that integrates all forum components with state management
 * 
 * [Ver001.000] - Initial implementation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DataErrorBoundary, HubErrorBoundary } from '@/components/error';

// Import forum components
import ForumCategoryList from './ForumCategoryList';
import ForumThreadList from './ForumThreadList';
import ForumThreadView from './ForumThreadView';
import ForumReply from './ForumReply';
import ForumEditor from './ForumEditor';

// Import hook
import useForumData from './hooks/useForumData';

// Import types
import type {
  ForumCategory,
  ForumThread,
  CreateThreadData,
  CreateReplyData,
} from './types';

// AREPO theme colors
const AREPO_THEME = {
  base: '#0066ff',
  glow: 'rgba(0, 102, 255, 0.4)',
  muted: '#0044cc',
};

/**
 * View state type
 */
type ViewState = 
  | { type: 'categories' }
  | { type: 'threads'; category: ForumCategory }
  | { type: 'thread'; thread: ForumThread }
  | { type: 'new-thread'; categoryId?: string };

/**
 * Loading overlay component
 */
function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <GlassCard className="p-6 flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#0066ff]" />
        <span className="text-white font-medium">{message}</span>
      </GlassCard>
    </div>
  );
}

/**
 * Forum container content component
 */
function ForumContainerContent() {
  // Forum data hook
  const {
    categories,
    threads,
    currentThread,
    posts,
    loading,
    error,
    filters,
    pagination,
    fetchCategories,
    fetchThreads,
    fetchThread,
    fetchPosts,
    createThread,
    createReply,
    setFilters,
    setPage,
    clearError,
  } = useForumData();

  // View state
  const [view, setView] = useState<ViewState>({ type: 'categories' });
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ForumPost | null>(null);

  // Initialize
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleSelectCategory = useCallback((category: ForumCategory) => {
    setView({ type: 'threads', category });
    fetchThreads(category.id);
  }, [fetchThreads]);

  const handleSelectThread = useCallback(async (thread: ForumThread) => {
    setView({ type: 'thread', thread });
    await fetchThread(thread.id);
    await fetchPosts(thread.id);
  }, [fetchThread, fetchPosts]);

  const handleBackToCategories = useCallback(() => {
    setView({ type: 'categories' });
    setShowReplyForm(false);
  }, []);

  const handleBackToThreads = useCallback(() => {
    if (view.type === 'thread') {
      // Go back to the thread's category
      const category = categories.find(c => c.id === view.thread.categoryId);
      if (category) {
        setView({ type: 'threads', category });
      } else {
        setView({ type: 'categories' });
      }
    }
    setShowReplyForm(false);
  }, [view, categories]);

  const handleNewThread = useCallback(() => {
    const categoryId = view.type === 'threads' ? view.category.id : undefined;
    setView({ type: 'new-thread', categoryId });
  }, [view]);

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleCreateThread = useCallback(async (data: CreateThreadData) => {
    const newThread = await createThread(data);
    if (newThread) {
      // Navigate to the new thread
      await handleSelectThread(newThread);
    }
  }, [createThread, handleSelectThread]);

  const handleCreateReply = useCallback(async (content: string) => {
    if (view.type !== 'thread') return;

    const data: CreateReplyData = {
      threadId: view.thread.id,
      content,
      replyTo: replyingTo?.id,
    };

    const newPost = await createReply(data);
    if (newPost) {
      setShowReplyForm(false);
      setReplyingTo(null);
      // Refresh posts
      await fetchPosts(view.thread.id);
    }
  }, [view, replyingTo, createReply, fetchPosts]);

  const handleReplyClick = useCallback(() => {
    setShowReplyForm(true);
    setReplyingTo(null);
  }, []);

  const handleQuote = useCallback((post: ForumPost) => {
    setShowReplyForm(true);
    setReplyingTo(post);
  }, []);

  // ============================================================================
  // FILTER/PAGINATION HANDLERS
  // ============================================================================

  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
    // Refetch with new filters
    if (view.type === 'threads') {
      fetchThreads(view.category.id);
    }
  }, [setFilters, view, fetchThreads]);

  const handlePageChange = useCallback((page: number) => {
    setPage(page);
    // Refetch with new page
    if (view.type === 'threads') {
      fetchThreads(view.category.id);
    }
  }, [setPage, view, fetchThreads]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderCategoriesView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white mb-2">
          Community Forum
        </h1>
        <p className="text-slate">
          Join the discussion with other esports enthusiasts
        </p>
      </div>

      <ForumCategoryList
        categories={categories}
        onSelectCategory={handleSelectCategory}
        selectedCategoryId={view.type === 'threads' ? view.category.id : undefined}
        loading={loading.categories}
      />

      {/* Forum stats */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-white">
            {categories.reduce((sum, cat) => sum + cat.threadCount, 0).toLocaleString()}
          </div>
          <div className="text-sm text-slate">Total Threads</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-[#0066ff]">
            {categories.length}
          </div>
          <div className="text-sm text-slate">Categories</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-[#00ff88]">
            Active
          </div>
          <div className="text-sm text-slate">Community Status</div>
        </GlassCard>
      </div>
    </motion.div>
  );

  const renderThreadsView = () => {
    if (view.type !== 'threads') return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={handleBackToCategories}
          className="flex items-center gap-2 text-slate hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to categories
        </button>

        <ForumThreadList
          threads={threads}
          category={view.category}
          filters={filters}
          pagination={pagination}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
          loading={loading.threads}
        />
      </motion.div>
    );
  };

  const renderThreadView = () => {
    if (view.type !== 'thread' || !currentThread) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <ForumThreadView
          thread={currentThread}
          posts={posts}
          pagination={{
            page: 1,
            perPage: 20,
            total: posts.length,
            totalPages: 1,
          }}
          onPageChange={() => {}}
          onReply={handleReplyClick}
          onBack={handleBackToThreads}
          loading={loading.thread || loading.posts}
        />

        <AnimatePresence>
          {showReplyForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ForumReply
                onSubmit={handleCreateReply}
                onCancel={() => {
                  setShowReplyForm(false);
                  setReplyingTo(null);
                }}
                replyingTo={replyingTo}
                placeholder="Write your reply... Use markdown for formatting"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderNewThreadView = () => {
    if (view.type !== 'new-thread') return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={handleBackToThreads}
          className="flex items-center gap-2 text-slate hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <ForumEditor
          categories={categories}
          initialCategoryId={view.categoryId}
          onSubmit={handleCreateThread}
          onCancel={handleBackToThreads}
          loading={loading.creating}
        />
      </motion.div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen">
      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 rounded-lg bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655]"
          >
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-sm hover:underline"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {view.type === 'categories' && (
          <motion.div key="categories" exit={{ opacity: 0, y: -20 }}>
            {renderCategoriesView()}
          </motion.div>
        )}
        {view.type === 'threads' && (
          <motion.div key="threads" exit={{ opacity: 0, x: -20 }}>
            {renderThreadsView()}
          </motion.div>
        )}
        {view.type === 'thread' && (
          <motion.div key="thread" exit={{ opacity: 0, x: -20 }}>
            {renderThreadView()}
          </motion.div>
        )}
        {view.type === 'new-thread' && (
          <motion.div key="new-thread" exit={{ opacity: 0, scale: 0.95 }}>
            {renderNewThreadView()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {loading.creating && (
        <LoadingOverlay message="Creating thread..." />
      )}
    </div>
  );
}

/**
 * Wrapped component with error boundary
 */
export function ForumContainer() {
  return (
    <HubErrorBoundary hubName="arepo" componentName="ForumContainer">
      <DataErrorBoundary
        hubName="arepo"
        componentName="ForumContainer"
        fallback={
          <GlassCard className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate" />
            <h2 className="text-xl font-bold text-white mb-2">
              Forum Error
            </h2>
            <p className="text-slate">
              Failed to load the forum. Please try again later.
            </p>
          </GlassCard>
        }
      >
        <ForumContainerContent />
      </DataErrorBoundary>
    </HubErrorBoundary>
  );
}

export default ForumContainer;

// Import ForumPost for the quote functionality
import type { ForumPost } from './types';
