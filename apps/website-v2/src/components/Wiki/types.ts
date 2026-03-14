[Ver001.000]
/**
 * Wiki System Types
 * =================
 * TypeScript interfaces for wiki/knowledge base components.
 */

export interface WikiCategory {
  id: number;
  slug: string;
  name: string;
  description?: string;
  icon: string;
  sort_order: number;
  parent_id?: number;
  is_help_category: boolean;
  article_count: number;
}

export interface WikiArticleSummary {
  id: number;
  slug: string;
  title: string;
  category_id?: number;
  category_name?: string;
  excerpt?: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  published_at?: string;
  updated_at: string;
}

export interface WikiArticle {
  id: number;
  slug: string;
  title: string;
  category_id?: number;
  category?: WikiCategory;
  author_id: string;
  content: string;
  content_html?: string;
  excerpt?: string;
  tags: string[];
  is_published: boolean;
  is_help_article: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  version: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WikiNavigationItem {
  id: number;
  menu_key: string;
  parent_id?: number;
  title: string;
  article_slug?: string;
  external_url?: string;
  sort_order: number;
  icon?: string;
  is_visible: boolean;
  children: WikiNavigationItem[];
}

export interface ArticleFeedback {
  is_helpful: boolean;
  feedback?: string;
}

// Component Props

export interface WikiArticleViewerProps {
  article: WikiArticle;
  onFeedback?: (feedback: ArticleFeedback) => void;
  showNavigation?: boolean;
}

export interface WikiEditorProps {
  article?: Partial<WikiArticle>;
  categories: WikiCategory[];
  onSave: (article: Partial<WikiArticle>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface WikiSearchProps {
  onSearch: (query: string, results: WikiArticleSummary[]) => void;
  placeholder?: string;
  isHelpOnly?: boolean;
}

export interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentArticleSlug?: string;
}

export interface WikiNavigationProps {
  menuKey: string;
  activeSlug?: string;
  onNavigate: (slug: string) => void;
}
