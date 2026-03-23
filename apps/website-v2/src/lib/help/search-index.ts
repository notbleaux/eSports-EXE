/** [Ver001.000] */
/**
 * Search Index
 * ============
 * MiniSearch-based search indexing for knowledge graph.
 * 
 * Features:
 * - Full-text search with fuzzy matching
 * - Relevance scoring
 * - Category filtering
 * - "Did you mean?" suggestions
 * - Recent searches persistence
 */

import type {
  KnowledgeNode,
  KnowledgeGraph,
  SearchResult,
  SearchFilters,
  SearchCategory,
  KnowledgeNodeType,
} from './knowledge-types';

// ============================================================================
// Types
// ============================================================================

interface SearchIndexDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  keywords: string;
  type: KnowledgeNodeType;
  hub?: string;
  difficulty: string;
}

interface MiniSearchResult {
  id: string;
  score: number;
  match: Record<string, string[]>;
}

interface SearchIndex {
  documents: Map<string, SearchIndexDocument>;
  index: Map<string, Map<string, number>>; // field -> term -> docId[] with tf
  docCount: number;
  termFreq: Map<string, Map<string, number>>; // docId -> term -> freq
  docLength: Map<string, number>; // docId -> total terms
  avgDocLength: number;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'sator:help:recent-searches';
const MAX_RECENT_SEARCHES = 10;
const DEFAULT_PAGE_SIZE = 10;

// BM25 parameters
const K1 = 1.2;
const B = 0.75;

// Fuzzy match threshold
const FUZZY_THRESHOLD = 0.6;

// ============================================================================
// Index Builder
// ============================================================================

export function buildSearchIndex(graph: KnowledgeGraph): SearchIndex {
  const index: SearchIndex = {
    documents: new Map(),
    index: new Map(),
    docCount: 0,
    termFreq: new Map(),
    docLength: new Map(),
    avgDocLength: 0,
  };

  let totalLength = 0;

  graph.nodes.forEach(node => {
    if (node.status === 'archived' || node.status === 'deprecated') {
      return;
    }

    const doc = nodeToDocument(node);
    index.documents.set(node.id, doc);

    // Index each field
    const fields: (keyof SearchIndexDocument)[] = ['title', 'description', 'content', 'keywords'];
    
    for (const field of fields) {
      const text = doc[field] || '';
      const terms = tokenize(text);
      
      if (!index.index.has(field)) {
        index.index.set(field, new Map());
      }
      const fieldIndex = index.index.get(field)!;

      // Track term frequency for this document
      const termFreq = new Map<string, number>();
      
      for (const term of terms) {
        // Update field index
        if (!fieldIndex.has(term)) {
          fieldIndex.set(term, 0);
        }
        fieldIndex.set(term, fieldIndex.get(term)! + 1);

        // Update term frequency
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      }

      index.termFreq.set(node.id, termFreq);
      index.docLength.set(node.id, terms.length);
      totalLength += terms.length;
    }

    index.docCount++;
  });

  index.avgDocLength = index.docCount > 0 ? totalLength / index.docCount : 0;

  return index;
}

function nodeToDocument(node: KnowledgeNode): SearchIndexDocument {
  return {
    id: node.id,
    title: node.title.toLowerCase(),
    description: node.description.toLowerCase(),
    content: (node.content || '').toLowerCase(),
    keywords: node.keywords.join(' ').toLowerCase(),
    type: node.type,
    hub: node.hub,
    difficulty: node.difficulty,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)
    .map(t => stem(t));
}

// Simple Porter stemmer implementation
function stem(word: string): string {
  // Simplified stemming - remove common suffixes
  const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'ness', 'ment'];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

// Calculate BM25 score
function calculateBM25(
  index: SearchIndex,
  docId: string,
  term: string,
  field: string,
  boost: number = 1
): number {
  const fieldIndex = index.index.get(field);
  if (!fieldIndex) return 0;

  const docFreq = fieldIndex.get(term) || 0;
  if (docFreq === 0) return 0;

  const idf = Math.log(
    (index.docCount - docFreq + 0.5) / (docFreq + 0.5) + 1
  );

  const termFreq = index.termFreq.get(docId)?.get(term) || 0;
  const docLen = index.docLength.get(docId) || 0;
  const avgLen = index.avgDocLength || 1;

  const tf =
    (termFreq * (K1 + 1)) /
    (termFreq + K1 * (1 - B + B * (docLen / avgLen)));

  return idf * tf * boost;
}

// ============================================================================
// Search
// ============================================================================

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  page?: number;
  pageSize?: number;
}

export function search(
  index: SearchIndex,
  options: SearchOptions
): { results: SearchResult[]; total: number; suggestions: string[] } {
  const { query, filters = {}, page = 1, pageSize = DEFAULT_PAGE_SIZE } = options;
  const terms = tokenize(query);

  if (terms.length === 0) {
    return { results: [], total: 0, suggestions: [] };
  }

  // Score all documents
  const scores = new Map<string, { score: number; matchedFields: Set<string> }>();

  index.documents.forEach((doc, docId) => {
    // Apply filters first
    if (filters.category && filters.category !== 'all') {
      const typeMap: Record<SearchCategory, KnowledgeNodeType[]> = {
        all: [],
        feature: ['feature'],
        concept: ['concept'],
        tutorial: ['tutorial'],
        guide: ['guide'],
        reference: ['reference'],
      };
      const allowedTypes = typeMap[filters.category];
      if (allowedTypes.length > 0 && !allowedTypes.includes(doc.type)) {
        return;
      }
    }

    if (filters.difficulty && doc.difficulty !== filters.difficulty) {
      return;
    }

    if (filters.hub && doc.hub !== filters.hub) {
      return;
    }

    let totalScore = 0;
    const matchedFields = new Set<string>();

    // Field boosts
    const fieldBoosts: Record<string, number> = {
      title: 3,
      keywords: 2,
      description: 1.5,
      content: 1,
    };

    for (const term of terms) {
      for (const [field, boost] of Object.entries(fieldBoosts)) {
        const score = calculateBM25(index, docId, term, field, boost);
        if (score > 0) {
          totalScore += score;
          matchedFields.add(field);
        }

        // Fuzzy matching for misspellings
        if (score === 0) {
          const fuzzyScore = fuzzyMatch(index, docId, term, field, boost);
          if (fuzzyScore > 0) {
            totalScore += fuzzyScore * 0.5; // Penalty for fuzzy match
            matchedFields.add(field);
          }
        }
      }
    }

    if (totalScore > 0 && (!filters.minRelevance || totalScore >= filters.minRelevance)) {
      scores.set(docId, { score: totalScore, matchedFields });
    }
  });

  // Sort by score
  const sortedResults = Array.from(scores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .map(([docId, data]) => {
      const doc = index.documents.get(docId)!;
      return {
        node: documentToNode(doc),
        score: Math.min(data.score / 10, 1), // Normalize to 0-1
        matchedFields: Array.from(data.matchedFields) as Array<
          'title' | 'description' | 'content' | 'keywords'
        >,
        highlights: generateHighlights(doc, terms),
      };
    });

  // Generate suggestions
  const suggestions = generateSuggestions(index, terms);

  // Paginate
  const start = (page - 1) * pageSize;
  const paginatedResults = sortedResults.slice(start, start + pageSize);

  return {
    results: paginatedResults,
    total: sortedResults.length,
    suggestions,
  };
}

function fuzzyMatch(
  index: SearchIndex,
  docId: string,
  queryTerm: string,
  field: string,
  boost: number
): number {
  const fieldIndex = index.index.get(field);
  if (!fieldIndex) return 0;

  let bestScore = 0;

  for (const [term, freq] of fieldIndex.entries()) {
    const similarity = calculateSimilarity(queryTerm, term);
    if (similarity >= FUZZY_THRESHOLD) {
      const score = calculateBM25(index, docId, term, field, boost);
      bestScore = Math.max(bestScore, score * similarity);
    }
  }

  return bestScore;
}

function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function generateHighlights(
  doc: SearchIndexDocument,
  terms: string[]
): { title?: string; description?: string; excerpt?: string } {
  const highlights: { title?: string; description?: string; excerpt?: string } = {};

  // Highlight matches in title
  if (terms.some(t => doc.title.includes(t))) {
    highlights.title = highlightText(doc.title, terms);
  }

  // Highlight matches in description
  if (terms.some(t => doc.description.includes(t))) {
    highlights.description = highlightText(doc.description, terms);
  }

  // Generate excerpt from content
  if (doc.content) {
    const excerpt = extractExcerpt(doc.content, terms, 150);
    if (excerpt) {
      highlights.excerpt = highlightText(excerpt, terms);
    }
  }

  return highlights;
}

function highlightText(text: string, terms: string[]): string {
  let highlighted = text;
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }
  return highlighted;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractExcerpt(content: string, terms: string[], maxLength: number): string {
  const contentLower = content.toLowerCase();
  
  for (const term of terms) {
    const index = contentLower.indexOf(term);
    if (index !== -1) {
      const start = Math.max(0, index - 40);
      const end = Math.min(content.length, index + maxLength);
      let excerpt = content.slice(start, end);
      
      if (start > 0) excerpt = '...' + excerpt;
      if (end < content.length) excerpt = excerpt + '...';
      
      return excerpt;
    }
  }

  // Return first sentence if no match found
  const firstSentence = content.split(/[.!?]/)[0];
  return firstSentence.length > maxLength 
    ? firstSentence.slice(0, maxLength) + '...'
    : firstSentence;
}

function documentToNode(doc: SearchIndexDocument): KnowledgeNode {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    content: doc.content,
    type: doc.type,
    status: 'published',
    difficulty: doc.difficulty as KnowledgeNode['difficulty'],
    hub: doc.hub,
    keywords: doc.keywords.split(' ').filter(k => k),
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Suggestions
// ============================================================================

function generateSuggestions(index: SearchIndex, terms: string[]): string[] {
  const suggestions: string[] = [];
  const allTerms = new Set<string>();

  // Collect all indexed terms
  index.index.forEach(fieldIndex => {
    fieldIndex.forEach((_, term) => allTerms.add(term));
  });

  for (const term of terms) {
    // Find similar terms
    const similar: Array<{ term: string; score: number }> = [];
    
    for (const indexedTerm of allTerms) {
      if (indexedTerm === term) continue;
      
      const similarity = calculateSimilarity(term, indexedTerm);
      if (similarity >= FUZZY_THRESHOLD) {
        similar.push({ term: indexedTerm, score: similarity });
      }
    }

    similar.sort((a, b) => b.score - a.score);
    suggestions.push(...similar.slice(0, 3).map(s => s.term));
  }

  return [...new Set(suggestions)].slice(0, 5);
}

export function getAutocompleteSuggestions(
  index: SearchIndex,
  prefix: string,
  maxResults: number = 8
): string[] {
  if (prefix.length < 2) return [];

  const prefixLower = prefix.toLowerCase();
  const matches = new Set<string>();

  // Check titles first
  index.documents.forEach(doc => {
    if (doc.title.toLowerCase().startsWith(prefixLower)) {
      matches.add(doc.title);
    }
  });

  // Then keywords
  index.documents.forEach(doc => {
    doc.keywords.split(' ').forEach(keyword => {
      if (keyword.toLowerCase().startsWith(prefixLower)) {
        matches.add(keyword);
      }
    });
  });

  return Array.from(matches).slice(0, maxResults);
}

// ============================================================================
// Recent Searches
// ============================================================================

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore storage errors
  }
  return [];
}

export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    filtered.unshift(query.trim());
    
    const limited = filtered.slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch {
    // Ignore storage errors
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Faceted Search
// ============================================================================

export interface FacetCounts {
  byType: Record<string, number>;
  byHub: Record<string, number>;
  byDifficulty: Record<string, number>;
}

export function getFacetCounts(
  index: SearchIndex,
  query?: string
): FacetCounts {
  const byType: Record<string, number> = {};
  const byHub: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};

  const terms = query ? tokenize(query) : [];

  index.documents.forEach(doc => {
    // If query provided, only count matching docs
    if (terms.length > 0) {
      const docText = `${doc.title} ${doc.description} ${doc.keywords}`;
      const hasMatch = terms.some(t => docText.includes(t));
      if (!hasMatch) return;
    }

    byType[doc.type] = (byType[doc.type] || 0) + 1;
    byDifficulty[doc.difficulty] = (byDifficulty[doc.difficulty] || 0) + 1;
    if (doc.hub) {
      byHub[doc.hub] = (byHub[doc.hub] || 0) + 1;
    }
  });

  return { byType, byHub, byDifficulty };
}
