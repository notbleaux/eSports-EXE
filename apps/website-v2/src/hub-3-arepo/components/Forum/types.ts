/**
 * AREPO Forum Type Definitions
 * TypeScript interfaces for the forum system
 * 
 * [Ver001.000] - Initial Forum Types
 */

// ============================================================================
// USER TYPES
// ============================================================================

/** User profile for forum authors */
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  joinDate: string;
  reputation: number;
  role: 'user' | 'moderator' | 'admin';
  postCount: number;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

/** Forum category definition */
export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  threadCount: number;
  color?: string;
}

// ============================================================================
// THREAD TYPES
// ============================================================================

/** Forum thread structure */
export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  author: UserProfile;
  content: string;
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
  lastReplyBy?: UserProfile;
  tags?: string[];
}

/** Thread list item (simplified for listings) */
export interface ThreadListItem {
  id: string;
  title: string;
  authorName: string;
  authorAvatar: string;
  replies: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lastActivityAt: string;
  lastActivityBy: string;
}

// ============================================================================
// POST TYPES
// ============================================================================

/** Individual forum post/reply */
export interface ForumPost {
  id: string;
  threadId: string;
  author: UserProfile;
  content: string;
  likes: number;
  isLikedByMe: boolean;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  replyTo?: string; // Post ID being replied to
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/** Data for creating a new thread */
export interface CreateThreadData {
  categoryId: string;
  title: string;
  content: string;
  tags?: string[];
}

/** Data for creating a reply */
export interface CreateReplyData {
  threadId: string;
  content: string;
  replyTo?: string;
}

// ============================================================================
// FILTER/PAGINATION TYPES
// ============================================================================

/** Thread filter options */
export interface ThreadFilters {
  categoryId?: string;
  search?: string;
  sortBy: 'newest' | 'oldest' | 'most-replies' | 'most-views' | 'last-activity';
  showPinned: boolean;
}

/** Pagination state */
export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/** ForumCategoryList component props */
export interface ForumCategoryListProps {
  categories: ForumCategory[];
  onSelectCategory: (category: ForumCategory) => void;
  selectedCategoryId?: string;
  loading?: boolean;
}

/** ForumThreadList component props */
export interface ForumThreadListProps {
  threads: ForumThread[];
  category: ForumCategory | null;
  filters: ThreadFilters;
  pagination: PaginationState;
  onFilterChange: (filters: Partial<ThreadFilters>) => void;
  onPageChange: (page: number) => void;
  onSelectThread: (thread: ForumThread) => void;
  onNewThread: () => void;
  loading?: boolean;
}

/** ForumThreadView component props */
export interface ForumThreadViewProps {
  thread: ForumThread;
  posts: ForumPost[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onReply: () => void;
  onBack: () => void;
  loading?: boolean;
}

/** ForumPost component props */
export interface ForumPostProps {
  post: ForumPost;
  isOriginalPost: boolean;
  onQuote: (post: ForumPost) => void;
  onLike: (postId: string) => void;
  onEdit?: (post: ForumPost) => void;
}

/** ForumReply component props */
export interface ForumReplyProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  replyingTo?: ForumPost | null;
  placeholder?: string;
  maxLength?: number;
}

/** ForumEditor component props */
export interface ForumEditorProps {
  categories: ForumCategory[];
  initialCategoryId?: string;
  onSubmit: (data: CreateThreadData) => void;
  onCancel: () => void;
  loading?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/** Generic API response wrapper */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationState;
}

// ============================================================================
// THEME TYPES
// ============================================================================

/** AREPO blue theme colors */
export interface ArepoTheme {
  base: string;
  glow: string;
  muted: string;
  gradient: string;
}
