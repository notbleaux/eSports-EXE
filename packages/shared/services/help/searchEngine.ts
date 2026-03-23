/** [Ver001.000] */
/**
 * Help Search Engine
 * ==================
 * Full-text search engine for help content using MiniSearch.
 * Provides fuzzy matching, relevance scoring, and expertise-based ranking.
 */

import MiniSearch from 'minisearch';
import type {
  KnowledgeNode,
  SearchResult,
  SearchQuery,
  SearchEngineConfig,
  DEFAULT_SEARCH_CONFIG,
  AutocompleteSuggestion,
} from '../../types/help/knowledgeGraph';
import type { UserExpertiseProfileData } from '../../types/help/expertise';

// ============================================================================
// Search Document Type
// ============================================================================

interface SearchDocument {
  id: string;
  title: string;
  description: string;
  keywords: string;
  type: string;
  difficulty: number;
  contentIds: string[];
  estimatedReadTime: number;
}

// ============================================================================
// User Expertise Profile (simplified for search)
// ============================================================================

export interface UserExpertiseProfile {
  userId: string;
  overallLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  features: Record<string, {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    confidence: number;
    helpRequests: number;
    errors: number;
    successfulActions: number;
  }>;
}

// ============================================================================
// Help Search Engine Class
// ============================================================================

export class HelpSearchEngine {
  private index: MiniSearch<SearchDocument>;
  private config: SearchEngineConfig;
  private documents: Map<string, SearchDocument> = new Map();
  private searchHistory: Map<string, number> = new Map(); // term -> frequency

  constructor(config: Partial<SearchEngineConfig> = {}) {
    this.config = { ...DEFAULT_SEARCH_CONFIG, ...config };
    
    this.index = new MiniSearch<SearchDocument>({
      fields: ['title', 'description', 'keywords'],
      storeFields: ['title', 'description', 'type', 'difficulty', 'contentIds', 'estimatedReadTime', 'keywords'],
      searchOptions: {
        boost: { title: 3, keywords: 2, description: 1 },
        fuzzy: this.config.fuzzyThreshold,
        prefix: true,
      },
    });
  }

  // ==========================================================================
  // Index Management
  // ==========================================================================

  /**
   * Add a document to the search index
   */
  addDocument(node: KnowledgeNode, description: string = ''): void {
    const doc: SearchDocument = {
      id: node.id,
      title: node.title,
      description: description || node.title,
      keywords: node.keywords.join(' '),
      type: node.type,
      difficulty: node.difficulty,
      contentIds: node.contentIds,
      estimatedReadTime: node.estimatedReadTime,
    };

    this.documents.set(node.id, doc);
    this.index.add(doc);
  }

  /**
   * Add multiple documents to the search index
   */
  addDocuments(nodes: KnowledgeNode[], descriptions: Map<string, string> = new Map()): void {
    const docs: SearchDocument[] = nodes.map(node => {
      const doc: SearchDocument = {
        id: node.id,
        title: node.title,
        description: descriptions.get(node.id) || node.title,
        keywords: node.keywords.join(' '),
        type: node.type,
        difficulty: node.difficulty,
        contentIds: node.contentIds,
        estimatedReadTime: node.estimatedReadTime,
      };
      this.documents.set(node.id, doc);
      return doc;
    });

    this.index.addAll(docs);
  }

  /**
   * Remove a document from the search index
   */
  removeDocument(nodeId: string): void {
    this.index.remove(nodeId);
    this.documents.delete(nodeId);
  }

  /**
   * Update an existing document
   */
  updateDocument(node: KnowledgeNode, description?: string): void {
    this.removeDocument(node.id);
    this.addDocument(node, description);
  }

  /**
   * Clear all documents from the index
   */
  clear(): void {
    this.index.removeAll();
    this.documents.clear();
  }

  // ==========================================================================
  // Search Methods
  // ==========================================================================

  /**
   * Search the help index with optional user profile for personalization
   */
  search(query: string, userProfile?: UserExpertiseProfile): SearchResult[] {
    // Check minimum query length
    if (query.length < this.config.minQueryLength) {
      return [];
    }

    // Perform the search
    const rawResults = this.index.search(query);
    
    // Track search term for autocomplete
    this.trackSearchTerm(query);

    // Convert to SearchResult format with relevance calculation
    const results: SearchResult[] = rawResults
      .slice(0, this.config.maxResults)
      .map(result => {
        const doc = this.documents.get(result.id);
        if (!doc) return null;

        const node: KnowledgeNode = {
          id: doc.id,
          type: doc.type as KnowledgeNode['type'],
          title: doc.title,
          contentIds: doc.contentIds,
          keywords: doc.keywords.split(' ').filter(k => k.length > 0),
          difficulty: doc.difficulty as 1 | 2 | 3 | 4 | 5,
          estimatedReadTime: doc.estimatedReadTime,
        };

        // Calculate final relevance score
        const baseScore = result.score;
        const relevanceScore = this.calculateRelevance(result, node, userProfile);
        const finalScore = baseScore * relevanceScore;

        // Extract highlights (matched terms)
        const highlights = this.extractHighlights(result, doc);

        return {
          node,
          score: finalScore,
          highlights,
          snippet: this.generateSnippet(doc.description, highlights),
        };
      })
      .filter((r): r is SearchResult => r !== null);

    // Sort by final score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Advanced search with filters
   */
  searchWithFilters(
    query: string,
    filters: SearchQuery['filters'],
    userProfile?: UserExpertiseProfile
  ): SearchResult[] {
    let results = this.search(query, userProfile);

    if (filters) {
      // Filter by type
      if (filters.type && filters.type.length > 0) {
        results = results.filter(r => filters.type!.includes(r.node.type));
      }

      // Filter by difficulty
      if (filters.difficulty && filters.difficulty.length > 0) {
        results = results.filter(r => filters.difficulty!.includes(r.node.difficulty));
      }
    }

    return results;
  }

  /**
   * Get autocomplete suggestions
   */
  getSuggestions(partial: string, limit: number = 5): AutocompleteSuggestion[] {
    if (partial.length < 2) return [];

    const suggestions: AutocompleteSuggestion[] = [];
    const partialLower = partial.toLowerCase();

    // Get matching terms from search history (popular searches)
    for (const [term, frequency] of this.searchHistory.entries()) {
      if (term.toLowerCase().startsWith(partialLower)) {
        suggestions.push({
          text: term,
          type: 'popular',
          score: frequency,
        });
      }
    }

    // Get matching document titles
    for (const doc of this.documents.values()) {
      if (doc.title.toLowerCase().includes(partialLower)) {
        const isExact = doc.title.toLowerCase().startsWith(partialLower);
        suggestions.push({
          text: doc.title,
          type: isExact ? 'exact' : 'fuzzy',
          score: isExact ? 2 : 1,
        });
      }
    }

    // Get matching keywords
    for (const doc of this.documents.values()) {
      for (const keyword of doc.keywords.split(' ')) {
        if (keyword.toLowerCase().startsWith(partialLower)) {
          suggestions.push({
            text: keyword,
            type: 'fuzzy',
            score: 0.5,
          });
        }
      }
    }

    // Remove duplicates and sort by score
    const uniqueSuggestions = new Map<string, AutocompleteSuggestion>();
    for (const sug of suggestions) {
      const existing = uniqueSuggestions.get(sug.text.toLowerCase());
      if (!existing || existing.score < sug.score) {
        uniqueSuggestions.set(sug.text.toLowerCase(), sug);
      }
    }

    return Array.from(uniqueSuggestions.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Auto-suggest with query expansion (synonyms)
   */
  autoSuggest(query: string, limit: number = 5): string[] {
    const suggestions: string[] = [];
    
    // Get raw suggestions
    const rawSuggestions = this.getSuggestions(query, limit * 2);
    
    // If synonym expansion is enabled, add related terms
    if (this.config.synonymExpansion) {
      const synonyms = this.getSynonyms(query);
      for (const syn of synonyms) {
        const synSuggestions = this.getSuggestions(syn, 3);
        rawSuggestions.push(...synSuggestions);
      }
    }

    // Deduplicate and return
    const seen = new Set<string>();
    for (const sug of rawSuggestions) {
      const key = sug.text.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        suggestions.push(sug.text);
        if (suggestions.length >= limit) break;
      }
    }

    return suggestions;
  }

  // ==========================================================================
  // Relevance Calculation
  // ==========================================================================

  /**
   * Calculate relevance score based on user expertise and document attributes
   */
  private calculateRelevance(
    result: MiniSearch.Result,
    node: KnowledgeNode,
    userProfile?: UserExpertiseProfile
  ): number {
    if (!userProfile) return 1;

    let relevance = 1;

    // Difficulty alignment (prefer content at user's level)
    const difficultyMap = { beginner: 1, intermediate: 3, advanced: 4, expert: 5 };
    const userDifficulty = difficultyMap[userProfile.overallLevel];
    const difficultyDiff = Math.abs(node.difficulty - userDifficulty);
    
    // Boost content at the right level, penalize content too easy or too hard
    if (difficultyDiff === 0) {
      relevance *= 1.3;
    } else if (difficultyDiff === 1) {
      relevance *= 1.1;
    } else if (difficultyDiff >= 3) {
      relevance *= 0.7;
    }

    // Check if user has struggled with related features
    for (const contentId of node.contentIds) {
      const featureData = userProfile.features[contentId];
      if (featureData) {
        // Boost if user has requested help for this feature
        if (featureData.helpRequests > 0) {
          relevance *= 1.2;
        }

        // Penalize if user has high error rate
        const totalActions = featureData.successfulActions + featureData.errors;
        if (totalActions > 0) {
          const errorRate = featureData.errors / totalActions;
          if (errorRate > 0.3) {
            relevance *= 1.3; // Boost help content for struggling features
          }
        }
      }
    }

    // Boost tutorials for beginners, concepts for experts
    if (userProfile.overallLevel === 'beginner' && node.type === 'tutorial') {
      relevance *= 1.2;
    }
    if (userProfile.overallLevel === 'expert' && node.type === 'concept') {
      relevance *= 1.15;
    }

    return Math.min(relevance, 2); // Cap at 2x boost
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private trackSearchTerm(term: string): void {
    const normalized = term.toLowerCase().trim();
    const current = this.searchHistory.get(normalized) || 0;
    this.searchHistory.set(normalized, current + 1);
  }

  private extractHighlights(result: MiniSearch.Result, doc: SearchDocument): string[] {
    const highlights: string[] = [];
    
    // Extract matched terms from result
    if (result.match) {
      for (const [field, terms] of Object.entries(result.match)) {
        if (Array.isArray(terms)) {
          highlights.push(...terms.map(String));
        }
      }
    }

    // Add keywords that matched
    for (const keyword of doc.keywords.split(' ')) {
      if (keyword.length > 0) {
        highlights.push(keyword);
      }
    }

    return [...new Set(highlights)].slice(0, 5);
  }

  private generateSnippet(description: string, highlights: string[]): string {
    if (!description) return '';

    // Try to find a sentence containing a highlight
    const sentences = description.split(/[.!?]+/);
    
    for (const highlight of highlights) {
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(highlight.toLowerCase())) {
          return sentence.trim().substring(0, 150);
        }
      }
    }

    // Fallback to first sentence or truncated description
    return (sentences[0] || description).trim().substring(0, 150);
  }

  private getSynonyms(term: string): string[] {
    // Simple synonym mapping - could be expanded
    const synonymMap: Record<string, string[]> = {
      'search': ['find', 'lookup', 'query'],
      'create': ['make', 'add', 'new'],
      'delete': ['remove', 'destroy', 'eliminate'],
      'update': ['edit', 'modify', 'change'],
      'view': ['see', 'show', 'display', 'open'],
      'help': ['support', 'assist', 'guide'],
      'settings': ['preferences', 'options', 'config'],
      'account': ['profile', 'user', 'login'],
    };

    return synonymMap[term.toLowerCase()] || [];
  }

  /**
   * Get search statistics
   */
  getStats(): {
    documentCount: number;
    termCount: number;
    topTerms: { term: string; frequency: number }[];
  } {
    const topTerms = Array.from(this.searchHistory.entries())
      .map(([term, frequency]) => ({ term, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      documentCount: this.documents.size,
      termCount: this.searchHistory.size,
      topTerms,
    };
  }

  /**
   * Check if the index has documents
   */
  hasDocuments(): boolean {
    return this.documents.size > 0;
  }

  /**
   * Get total number of indexed documents
   */
  getDocumentCount(): number {
    return this.documents.size;
  }
}

export default HelpSearchEngine;
