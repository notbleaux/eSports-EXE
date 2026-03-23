/** [Ver001.000] */
/**
 * Help Services Index
 * ===================
 * Central export point for help system services.
 */

// Knowledge Graph Service
export { KnowledgeGraph } from './knowledgeGraph';
export type {
  HelpTopic,
  HelpCategory,
  KnowledgeGraphSearchFilters,
  KnowledgeGraphRecommendationContext,
} from './knowledgeGraph';

// Search Engine Service
export { HelpSearchEngine } from './searchEngine';
export type {
  UserExpertiseProfile as SearchUserExpertiseProfile,
} from './searchEngine';
