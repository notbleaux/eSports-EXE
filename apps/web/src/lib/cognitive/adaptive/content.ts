/** [Ver001.000]
 * Content Simplification
 * ======================
 * Text complexity reduction and information hierarchy adjustment.
 * 
 * Features:
 * - Text complexity reduction
 * - Information hierarchy adjustment
 * - TL;DR generation
 * - Readability scoring
 * - Smart summarization
 * 
 * Integration:
 * - Uses TL-A3-3-A cognitive load detector
 * - Works with all content components
 * - Applies to documentation and help text
 */

import type { CognitiveLoadLevel } from '../types';

// ============================================================================
// Readability Types
// ============================================================================

/**
 * Readability score result
 */
export interface ReadabilityScore {
  /** Flesch Reading Ease score */
  fleschScore: number;
  /** Flesch-Kincaid Grade Level */
  gradeLevel: number;
  /** Estimated reading time in seconds */
  readingTime: number;
  /** Complexity level */
  complexity: 'very-easy' | 'easy' | 'fairly-easy' | 'standard' | 'fairly-difficult' | 'difficult' | 'very-difficult';
  /** Word count */
  wordCount: number;
  /** Sentence count */
  sentenceCount: number;
  /** Average words per sentence */
  avgWordsPerSentence: number;
  /** Average syllables per word */
  avgSyllablesPerWord: number;
}

/**
 * Content complexity configuration
 */
export interface ComplexityConfig {
  /** Maximum Flesch score for this level (higher = easier) */
  maxFleschScore: number;
  /** Maximum grade level */
  maxGradeLevel: number;
  /** Target words per sentence */
  targetWordsPerSentence: number;
  /** Whether to use contractions */
  useContractions: boolean;
  /** Whether to use active voice preference */
  preferActiveVoice: boolean;
  /** Simplification strategies to apply */
  strategies: SimplificationStrategy[];
}

/**
 * Available simplification strategies
 */
export type SimplificationStrategy =
  | 'shorten-sentences'
  | 'simplify-vocabulary'
  | 'remove-redundancy'
  | 'use-bullet-points'
  | 'add-headings'
  | 'highlight-key-points'
  | 'break-paragraphs';

// ============================================================================
// Complexity Levels
// ============================================================================

/**
 * Very easy - elementary level
 */
export const VERY_EASY_CONFIG: ComplexityConfig = {
  maxFleschScore: 100,
  maxGradeLevel: 4,
  targetWordsPerSentence: 8,
  useContractions: true,
  preferActiveVoice: true,
  strategies: ['shorten-sentences', 'simplify-vocabulary', 'use-bullet-points', 'highlight-key-points'],
};

/**
 * Easy - middle school level
 */
export const EASY_CONFIG: ComplexityConfig = {
  maxFleschScore: 80,
  maxGradeLevel: 8,
  targetWordsPerSentence: 12,
  useContractions: true,
  preferActiveVoice: true,
  strategies: ['shorten-sentences', 'remove-redundancy', 'use-bullet-points'],
};

/**
 * Standard - high school level
 */
export const STANDARD_CONFIG: ComplexityConfig = {
  maxFleschScore: 60,
  maxGradeLevel: 12,
  targetWordsPerSentence: 15,
  useContractions: true,
  preferActiveVoice: true,
  strategies: ['remove-redundancy', 'break-paragraphs'],
};

/**
 * Complex - college/professional level
 */
export const COMPLEX_CONFIG: ComplexityConfig = {
  maxFleschScore: 30,
  maxGradeLevel: 16,
  targetWordsPerSentence: 20,
  useContractions: false,
  preferActiveVoice: false,
  strategies: ['add-headings'],
};

/**
 * Configuration by cognitive load level
 */
export const LOAD_TO_COMPLEXITY_CONFIG: Record<CognitiveLoadLevel, ComplexityConfig> = {
  low: COMPLEX_CONFIG,
  medium: STANDARD_CONFIG,
  high: EASY_CONFIG,
  critical: VERY_EASY_CONFIG,
};

// ============================================================================
// Readability Analysis
// ============================================================================

/**
 * Count syllables in a word (approximation)
 */
export function countSyllables(word: string): number {
  const lower = word.toLowerCase().trim();
  if (lower.length <= 3) return 1;

  // Remove non-alphabetic characters
  const clean = lower.replace(/[^a-z]/g, '');
  if (clean.length === 0) return 1;

  // Count vowel groups
  const vowels = clean.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 0;

  // Silent e handling
  if (clean.endsWith('e') && !clean.endsWith('le')) {
    count--;
  }

  // Ensure at least 1 syllable
  return Math.max(1, count);
}

/**
 * Split text into sentences
 */
export function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space and capital
  return text
    .replace(/([.!?])\s+(?=[A-Z])/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Split text into words
 */
export function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/**
 * Calculate Flesch Reading Ease score
 * Higher = easier to read
 * 90-100: Very Easy
 * 80-89: Easy
 * 70-79: Fairly Easy
 * 60-69: Standard
 * 50-59: Fairly Difficult
 * 30-49: Difficult
 * 0-29: Very Difficult
 */
export function calculateFleschScore(
  totalSentences: number,
  totalWords: number,
  totalSyllables: number
): number {
  if (totalSentences === 0 || totalWords === 0) return 100;

  const avgSentenceLength = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;

  // Flesch Reading Ease formula
  return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
}

/**
 * Calculate Flesch-Kincaid Grade Level
 */
export function calculateGradeLevel(
  totalSentences: number,
  totalWords: number,
  totalSyllables: number
): number {
  if (totalSentences === 0 || totalWords === 0) return 0;

  const avgSentenceLength = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;

  // Flesch-Kincaid formula
  return (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
}

/**
 * Get complexity level from Flesch score
 */
export function getComplexityLevel(fleschScore: number): ReadabilityScore['complexity'] {
  if (fleschScore >= 90) return 'very-easy';
  if (fleschScore >= 80) return 'easy';
  if (fleschScore >= 70) return 'fairly-easy';
  if (fleschScore >= 60) return 'standard';
  if (fleschScore >= 50) return 'fairly-difficult';
  if (fleschScore >= 30) return 'difficult';
  return 'very-difficult';
}

/**
 * Calculate readability score for text
 */
export function analyzeReadability(text: string): ReadabilityScore {
  const sentences = splitSentences(text);
  const words = splitWords(text);
  
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const wordCount = words.length;
  const sentenceCount = sentences.length;

  const fleschScore = calculateFleschScore(sentenceCount, wordCount, totalSyllables);
  const gradeLevel = calculateGradeLevel(sentenceCount, wordCount, totalSyllables);

  // Estimate reading time (average 200 WPM)
  const readingTime = (wordCount / 200) * 60;

  return {
    fleschScore,
    gradeLevel,
    readingTime,
    complexity: getComplexityLevel(fleschScore),
    wordCount,
    sentenceCount,
    avgWordsPerSentence: sentenceCount > 0 ? wordCount / sentenceCount : 0,
    avgSyllablesPerWord: wordCount > 0 ? totalSyllables / wordCount : 0,
  };
}

// ============================================================================
// Text Simplification
// ============================================================================

/**
 * Simplify a sentence by breaking it up
 */
export function simplifySentence(sentence: string, targetWords: number): string[] {
  const words = sentence.split(' ');
  
  if (words.length <= targetWords) {
    return [sentence];
  }

  // Look for conjunctions to split on
  const conjunctions = [' and ', ' but ', ' or ', ' because ', ' since ', ' although ', ' while '];
  let bestSplit = -1;
  let bestScore = 0;

  for (const conj of conjunctions) {
    const index = sentence.toLowerCase().indexOf(conj);
    if (index > 0) {
      const firstPart = sentence.slice(0, index).split(' ').length;
      const score = Math.abs(targetWords - firstPart);
      if (bestSplit === -1 || score < bestScore) {
        bestSplit = index + conj.trim().length;
        bestScore = score;
      }
    }
  }

  if (bestSplit > 0) {
    return [
      sentence.slice(0, bestSplit).trim(),
      sentence.slice(bestSplit).trim(),
    ];
  }

  // Just split in half
  const mid = Math.floor(words.length / 2);
  return [
    words.slice(0, mid).join(' ') + '.',
    words.slice(mid).join(' '),
  ];
}

/**
 * Simplify vocabulary by replacing complex words
 */
const VOCABULARY_SIMPLIFICATIONS: Record<string, string> = {
  'utilize': 'use',
  'utilizing': 'using',
  'implementation': 'use',
  'implementing': 'using',
  'demonstrate': 'show',
  'demonstrating': 'showing',
  'subsequently': 'then',
  'additional': 'more',
  'additionally': 'also',
  'approximately': 'about',
  'sufficient': 'enough',
  'necessary': 'needed',
  'require': 'need',
  'requirements': 'needs',
  'regarding': 'about',
  'concerning': 'about',
  'however': 'but',
  'nevertheless': 'but',
  'therefore': 'so',
  'consequently': 'so',
  'furthermore': 'also',
  'moreover': 'also',
  'assistance': 'help',
  'assist': 'help',
  'obtain': 'get',
  'acquire': 'get',
  'purchase': 'buy',
  'attempt': 'try',
  'endeavor': 'try',
  'commence': 'start',
  'initiate': 'start',
  'terminate': 'end',
  'finalize': 'finish',
  'modification': 'change',
  'alteration': 'change',
  'comprehend': 'understand',
  'understand': 'get',
  'comprehensive': 'complete',
  'substantial': 'large',
  'considerable': 'large',
  'numerous': 'many',
  'various': 'many',
  'frequently': 'often',
  'occasionally': 'sometimes',
  'immediately': 'now',
  'simultaneously': 'at the same time',
  'preceding': 'before',
  'subsequent': 'after',
  'subsequent to': 'after',
  'prior to': 'before',
  'in order to': 'to',
  'in the event that': 'if',
  'at this point in time': 'now',
  'due to the fact that': 'because',
  'for the purpose of': 'for',
  'in close proximity to': 'near',
  'with regard to': 'about',
  'in accordance with': 'with',
  'until such time as': 'until',
};

/**
 * Simplify vocabulary in text
 */
export function simplifyVocabulary(text: string): string {
  let simplified = text;
  
  for (const [complex, simple] of Object.entries(VOCABULARY_SIMPLIFICATIONS)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  }

  return simplified;
}

/**
 * Remove redundant phrases
 */
const REDUNDANT_PATTERNS = [
  { pattern: /\b(basic|fundamental) (essentials?|necessities?)\b/gi, replacement: 'basics' },
  { pattern: /\b(advance|prior) (planning|plan)\b/gi, replacement: 'planning' },
  { pattern: /\b(collaborate) (together)\b/gi, replacement: 'collaborate' },
  { pattern: /\b(combine) (together)\b/gi, replacement: 'combine' },
  { pattern: /\b(connect) (together)\b/gi, replacement: 'connect' },
  { pattern: /\b(cooperate) (together)\b/gi, replacement: 'cooperate' },
  { pattern: /\b(current) (status)\b/gi, replacement: 'status' },
  { pattern: /\b(end) (result)\b/gi, replacement: 'result' },
  { pattern: /\b(false) (pretenses?)\b/gi, replacement: 'pretenses' },
  { pattern: /\b(free) (gift)\b/gi, replacement: 'gift' },
  { pattern: /\b(new) (innovation)\b/gi, replacement: 'innovation' },
  { pattern: /\b(past) (history)\b/gi, replacement: 'history' },
  { pattern: /\b(visible) (to the eye)\b/gi, replacement: 'visible' },
];

/**
 * Remove redundancy from text
 */
export function removeRedundancy(text: string): string {
  let cleaned = text;
  
  for (const { pattern, replacement } of REDUNDANT_PATTERNS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  return cleaned;
}

/**
 * Main text simplification function
 */
export function simplifyText(
  text: string,
  config: ComplexityConfig
): string {
  let simplified = text;

  // Apply strategies in order
  if (config.strategies.includes('remove-redundancy')) {
    simplified = removeRedundancy(simplified);
  }

  if (config.strategies.includes('simplify-vocabulary')) {
    simplified = simplifyVocabulary(simplified);
  }

  if (config.strategies.includes('shorten-sentences')) {
    const sentences = splitSentences(simplified);
    const shortened: string[] = [];
    
    for (const sentence of sentences) {
      const wordCount = sentence.split(' ').length;
      if (wordCount > config.targetWordsPerSentence * 1.5) {
        shortened.push(...simplifySentence(sentence, config.targetWordsPerSentence));
      } else {
        shortened.push(sentence);
      }
    }
    
    simplified = shortened.join(' ');
  }

  return simplified;
}

// ============================================================================
// TL;DR Generation
// ============================================================================

/**
 * Key sentence with importance score
 */
interface KeySentence {
  sentence: string;
  score: number;
  index: number;
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, count: number = 10): string[] {
  const words = splitWords(text);
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if',
    'because', 'although', 'though', 'while', 'where', 'when', 'that',
    'which', 'who', 'whom', 'whose', 'what', 'this', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
  ]);

  const frequency: Record<string, number> = {};
  
  for (const word of words) {
    if (!stopWords.has(word) && word.length > 2) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

/**
 * Score sentences for importance
 */
export function scoreSentences(text: string): KeySentence[] {
  const sentences = splitSentences(text);
  const keywords = new Set(extractKeywords(text, 15));
  const scored: KeySentence[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const words = splitWords(sentence);
    
    // Base score from keyword presence
    let score = 0;
    for (const word of words) {
      if (keywords.has(word)) {
        score += 1;
      }
    }

    // Position bonuses
    if (i === 0) score *= 1.5; // First sentence
    if (i === sentences.length - 1) score *= 1.3; // Last sentence
    if (i < sentences.length * 0.2) score *= 1.2; // Early sentences

    // Length penalty (prefer medium-length sentences)
    const wordCount = words.length;
    if (wordCount < 5) score *= 0.5;
    if (wordCount > 30) score *= 0.7;

    scored.push({ sentence, score, index: i });
  }

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Generate TL;DR summary
 */
export function generateTLDR(
  text: string,
  maxSentences: number = 3
): string {
  const scored = scoreSentences(text);
  const topSentences = scored
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index); // Restore original order

  return topSentences.map(s => s.sentence).join(' ');
}

/**
 * Generate bullet point summary
 */
export function generateBulletSummary(
  text: string,
  maxPoints: number = 5
): string[] {
  const scored = scoreSentences(text);
  const topSentences = scored.slice(0, maxPoints);

  return topSentences.map(s => {
    // Clean up and format as bullet point
    let point = s.sentence.trim();
    if (point.endsWith('.')) {
      point = point.slice(0, -1);
    }
    return point;
  });
}

// ============================================================================
// Information Hierarchy
// ============================================================================

/**
 * Content section with hierarchy info
 */
export interface ContentSection {
  /** Section heading */
  heading: string;
  /** Section level (1-6) */
  level: number;
  /** Section content */
  content: string;
  /** Section importance score */
  importance: number;
  /** Child sections */
  children: ContentSection[];
}

/**
 * Flatten content hierarchy for simplified view
 */
export function flattenHierarchy(
  sections: ContentSection[],
  maxDepth: number = 2
): ContentSection[] {
  const flattened: ContentSection[] = [];

  for (const section of sections) {
    if (section.level <= maxDepth) {
      flattened.push(section);
    }
    
    if (section.children.length > 0 && section.level < maxDepth) {
      flattened.push(...flattenHierarchy(section.children, maxDepth));
    }
  }

  return flattened;
}

/**
 * Filter sections by importance
 */
export function filterByImportance(
  sections: ContentSection[],
  threshold: number = 0.5
): ContentSection[] {
  return sections.filter(s => s.importance >= threshold);
}

/**
 * Simplify content hierarchy based on cognitive load
 */
export function simplifyHierarchy(
  sections: ContentSection[],
  loadLevel: CognitiveLoadLevel
): ContentSection[] {
  const configs = {
    low: { maxDepth: 6, threshold: 0 },
    medium: { maxDepth: 3, threshold: 0.3 },
    high: { maxDepth: 2, threshold: 0.5 },
    critical: { maxDepth: 1, threshold: 0.7 },
  };

  const config = configs[loadLevel];
  const flattened = flattenHierarchy(sections, config.maxDepth);
  return filterByImportance(flattened, config.threshold);
}

// ============================================================================
// Adaptive Content Wrapper
// ============================================================================

/**
 * Adaptive content configuration
 */
export interface AdaptiveContentConfig {
  /** Original text */
  originalText: string;
  /** Current cognitive load */
  loadLevel: CognitiveLoadLevel;
  /** Whether to show TL;DR */
  showTLDR: boolean;
  /** Whether to use bullet points */
  useBulletPoints: boolean;
  /** Maximum reading time (seconds) */
  maxReadingTime: number;
}

/**
 * Adaptive content result
 */
export interface AdaptiveContentResult {
  /** Original text */
  original: string;
  /** Simplified text */
  simplified: string;
  /** TL;DR summary */
  tldr: string;
  /** Bullet point summary */
  bullets: string[];
  /** Readability scores */
  readability: {
    original: ReadabilityScore;
    simplified: ReadabilityScore;
  };
  /** Whether simplification occurred */
  wasSimplified: boolean;
}

/**
 * Process content adaptively based on cognitive load
 */
export function processAdaptiveContent(
  config: AdaptiveContentConfig
): AdaptiveContentResult {
  const complexityConfig = LOAD_TO_COMPLEXITY_CONFIG[config.loadLevel];
  
  // Analyze original
  const originalReadability = analyzeReadability(config.originalText);
  
  // Simplify text
  const simplified = simplifyText(config.originalText, complexityConfig);
  const simplifiedReadability = analyzeReadability(simplified);
  
  // Generate summaries
  const tldr = generateTLDR(config.originalText);
  const bullets = generateBulletSummary(config.originalText);

  return {
    original: config.originalText,
    simplified,
    tldr,
    bullets,
    readability: {
      original: originalReadability,
      simplified: simplifiedReadability,
    },
    wasSimplified: originalReadability.fleschScore < simplifiedReadability.fleschScore - 5,
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  // Readability
  countSyllables,
  splitSentences,
  splitWords,
  calculateFleschScore,
  calculateGradeLevel,
  getComplexityLevel,
  analyzeReadability,
  
  // Simplification
  simplifySentence,
  simplifyVocabulary,
  removeRedundancy,
  simplifyText,
  
  // Summarization
  extractKeywords,
  scoreSentences,
  generateTLDR,
  generateBulletSummary,
  
  // Hierarchy
  flattenHierarchy,
  filterByImportance,
  simplifyHierarchy,
  
  // Adaptive
  processAdaptiveContent,
  
  // Configs
  VERY_EASY_CONFIG,
  EASY_CONFIG,
  STANDARD_CONFIG,
  COMPLEX_CONFIG,
  LOAD_TO_COMPLEXITY_CONFIG,
};
