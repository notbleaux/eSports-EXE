/** [Ver001.000] */
/**
 * Unified Help System Types
 * =========================
 * Shared type definitions for the help and accessibility system.
 * Used across web (React) and game (Godot) platforms.
 */

// ============================================================================
// Core Content Types
// ============================================================================

export type HelpLevel = 'summary' | 'detail' | 'interactive';
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type Platform = 'web' | 'game' | 'mobile';
export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'ko' | 'zh';

export interface HelpContent {
  id: string;
  version: string;
  
  // Multi-platform delivery
  platforms: {
    web?: WebHelpConfig;
    game?: GameHelpConfig;
    mobile?: MobileHelpConfig;
  };
  
  // Progressive disclosure levels
  levels: {
    beginner: HelpLevelContent;
    intermediate: HelpLevelContent;
    advanced: HelpLevelContent;
  };
  
  // Contextual triggers
  triggers: HelpTrigger[];
  
  // Localization
  i18n: Record<Locale, LocalizedContent>;
  
  // Analytics
  metrics: HelpMetrics;
}

export interface HelpLevelContent {
  summary: string;           // 1 sentence
  detail: string;            // 1 paragraph
  interactive?: string;      // Guided tour/walkthrough ID
  video?: string;            // Tutorial video ID
  shortcut?: string;         // Keyboard shortcut
}

export interface WebHelpConfig {
  component: string;         // React component name
  anchorSelector?: string;   // CSS selector for positioning
  overlayPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface GameHelpConfig {
  gdscriptClass: string;     // Godot class name
  uiPath: string;            // Node path in scene
  inputAction?: string;      // Associated input action
}

export interface MobileHelpConfig {
  gesture?: string;          // Swipe, tap, long-press
  screenPosition?: 'top' | 'bottom' | 'center';
}

export interface LocalizedContent {
  title: string;
  summary: string;
  detail: string;
}

export interface HelpMetrics {
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  avgReadTime: number;
  lastUpdated: Date;
}

// ============================================================================
// Trigger Types
// ============================================================================

export type TriggerType = 
  | 'first_visit'
  | 'error_count'
  | 'time_spent'
  | 'action_stuck'
  | 'rapid_clicks'
  | 'scroll_confusion'
  | 'manual_request';

export interface HelpTrigger {
  id: string;
  type: TriggerType;
  conditions: TriggerCondition[];
  cooldownMs: number;
  priority: 1 | 2 | 3 | 4 | 5;
  contentId: string;
  suggestedLevel: HelpLevel;
}

export interface TriggerCondition {
  metric: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: number | string | boolean;
}

// ============================================================================
// Expertise Types
// ============================================================================

export type FeatureId = string;
export type InteractionType = 
  | 'view' 
  | 'click' 
  | 'complete' 
  | 'error' 
  | 'help_request';

export interface UserExpertiseProfile {
  userId: string;
  overall: ExpertiseLevel;
  lastUpdated: Date;
  
  perFeature: Record<FeatureId, FeatureExpertise>;
  
  promotionCriteria: {
    sessionsCompleted: number;
    featuresUsed: Set<FeatureId>;
    helpRequestTrend: 'declining' | 'stable' | 'increasing';
    errorRate: number;
  };
}

export interface FeatureExpertise {
  level: ExpertiseLevel;
  confidence: number;        // 0-1 based on data volume
  lastInteraction: Date;
  helpRequests: number;      // Declining = learning
  errors: number;            // Spikes indicate confusion
  successfulActions: number;
  timeSpentSeconds: number;
}

export interface ExpertisePromotionRule {
  fromLevel: ExpertiseLevel;
  toLevel: ExpertiseLevel;
  minSessions: number;
  minFeaturesUsed: number;
  maxHelpRequestsPerSession: number;
  maxErrorRate: number;
}

// ============================================================================
// Knowledge Graph Types
// ============================================================================

export type NodeType = 'topic' | 'feature' | 'concept' | 'tutorial' | 'faq';
export type EdgeType = 'prerequisite' | 'related' | 'next' | 'parent' | 'seealso';

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  title: string;
  contentIds: string[];      // Links to HelpContent
  keywords: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedReadTime: number; // minutes
}

export interface KnowledgeEdge {
  source: string;            // node id
  target: string;            // node id
  type: EdgeType;
  weight: number;            // 0-1 relevance
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  version: string;
  lastUpdated: Date;
}

export interface Recommendation {
  node: KnowledgeNode;
  score: number;             // 0-1 relevance
  reason: 'prerequisite' | 'next_in_series' | 'related' | 'popular' | 'trending';
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchQuery {
  query: string;
  filters?: {
    type?: NodeType[];
    difficulty?: number[];
    feature?: string[];
  };
  userLevel?: ExpertiseLevel;
  limit?: number;
}

export interface SearchResult {
  node: KnowledgeNode;
  score: number;
  highlights: string[];      // Matched keywords
  snippet: string;
}

export interface SearchEntry {
  term: string;
  nodes: string[];           // node ids
  frequency: number;
}

// ============================================================================
// Context Types
// ============================================================================

export interface HelpContext {
  userId: string;
  currentPage: string;
  currentFeature?: FeatureId;
  timestamp: Date;
  recentActions: UserAction[];
  recentErrors: ErrorEvent[];
}

export interface UserAction {
  type: InteractionType;
  featureId: FeatureId;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ErrorEvent {
  code: string;
  message: string;
  featureId: FeatureId;
  timestamp: Date;
  recoverable: boolean;
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface HelpOverlayProps {
  trigger?: 'auto' | 'error' | 'stuck' | 'manual';
  initialLevel?: HelpLevel;
  allowLevelChange?: boolean;
  anchor?: 'cursor' | 'element' | 'center' | 'sidebar';
  targetElement?: string;
  dismissible?: boolean;
  rememberDismissal?: boolean;
  errorCode?: string;
  contentId?: string;
  onDismiss?: () => void;
  onLevelChange?: (level: HelpLevel) => void;
  onHelpful?: (wasHelpful: boolean) => void;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

// Re-export all types from expertise
export * from './expertise';

// Re-export UserExpertiseProfile class explicitly
export { UserExpertiseProfile } from './expertise';

// Re-export all from knowledgeGraph
export * from './knowledgeGraph';
