/**
 * AREPO Forum Components - Index
 * Export all forum components and types
 * 
 * [Ver001.000] - Initial exports
 */

// Components
export { default as ForumCategoryList } from './ForumCategoryList';
export { default as ForumThreadList } from './ForumThreadList';
export { default as ForumThreadView } from './ForumThreadView';
export { default as ForumPost } from './ForumPost';
export { default as ForumReply } from './ForumReply';
export { default as ForumEditor } from './ForumEditor';

// Hooks
export { default as useForumData, useForumData as useForum } from './hooks/useForumData';

// Types
export type {
  // User types
  UserProfile,
  
  // Category types
  ForumCategory,
  
  // Thread types
  ForumThread,
  ThreadListItem,
  
  // Post types
  type ForumPost,
  
  // Form data types
  CreateThreadData,
  CreateReplyData,
  
  // Filter/Pagination types
  ThreadFilters,
  PaginationState,
  
  // Component prop types
  ForumCategoryListProps,
  ForumThreadListProps,
  ForumThreadViewProps,
  ForumPostProps,
  ForumReplyProps,
  ForumEditorProps,
  
  // API response types
  ApiResponse,
  PaginatedResponse,
  
  // Theme types
  ArepoTheme,
} from './types';

// Default export for the Forum module
export { default } from './ForumContainer';
