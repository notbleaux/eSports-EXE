/** [Ver001.000]
 * Adaptive UI System Tests
 * ========================
 * Comprehensive test suite for adaptive UI components.
 * 
 * Tests:
 * - Layout engine
 * - Smart defaults
 * - Content simplification
 * - Preference learning
 * - Integration scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CognitiveLoadLevel } from '../../types';

// Import modules directly
import {
  FULL_LAYOUT,
  SIMPLIFIED_LAYOUT,
  MINIMAL_LAYOUT,
  FOCUSED_LAYOUT,
  LAYOUT_MODES,
  DEFAULT_PROGRESSIVE_DISCLOSURE,
  LOAD_TO_LAYOUT_MAP,
  SIMPLIFICATION_TO_LAYOUT_MAP,
  DEFAULT_BREAKPOINTS,
  getLayoutModeForLoad,
  getLayoutModeForSimplification,
  getLayoutConfig,
  getLayoutConfigForLoad,
  calculateEffectiveLayoutMode,
  loadToDisclosureLevel,
  shouldDisclose,
  getDisclosureDecision,
  sortSectionsByPriority,
  generateLayoutCSS,
  getLayoutModeClass,
  getLayoutClasses,
  adjustLayoutForViewport,
  createLayoutState,
  updateLayoutForLoad,
  toggleSectionCollapse,
  setUserLayoutPreference,
} from '../layout';

import {
  LocalPreferenceStorage,
  registerDefaultProvider,
  unregisterDefaultProvider,
  setProviderEnabled,
  getProvidersForFieldType,
  evaluateRule,
  findMatchingRules,
  setGlobalPreferenceStorage,
  getGlobalPreferenceStorage,
  getSmartDefault,
  autoFillForm,
  recordDefaultUsed,
} from '../defaults';

import {
  VERY_EASY_CONFIG,
  EASY_CONFIG,
  STANDARD_CONFIG,
  COMPLEX_CONFIG,
  LOAD_TO_COMPLEXITY_CONFIG,
  countSyllables,
  splitSentences,
  splitWords,
  calculateFleschScore,
  calculateGradeLevel,
  getComplexityLevel,
  analyzeReadability,
  simplifySentence,
  simplifyVocabulary,
  removeRedundancy,
  simplifyText,
  extractKeywords,
  scoreSentences,
  generateTLDR,
  generateBulletSummary,
  flattenHierarchy,
  filterByImportance,
  simplifyHierarchy,
  processAdaptiveContent,
} from '../content';

import {
  DEFAULT_LEARNING_CONFIG,
  PreferenceStore,
  setGlobalStore,
  getGlobalStore,
  getTimeOfDay,
  getDeviceType,
  getScreenSize,
  buildContext,
  ABTestManager,
  getABTestManager,
  predictOptimal,
} from '../learning';

// ============================================================================
// Layout Engine Tests
// ============================================================================

describe('Adaptive Layout Engine', () => {
  describe('Layout Mode Selection', () => {
    it('should return full layout for low load', () => {
      expect(getLayoutModeForLoad('low')).toBe('full');
    });

    it('should return simplified layout for medium load', () => {
      expect(getLayoutModeForLoad('medium')).toBe('simplified');
    });

    it('should return minimal layout for high load', () => {
      expect(getLayoutModeForLoad('high')).toBe('minimal');
    });

    it('should return focused layout for critical load', () => {
      expect(getLayoutModeForLoad('critical')).toBe('focused');
    });
  });

  describe('Layout Configuration', () => {
    it('should return correct config for full mode', () => {
      expect(getLayoutConfig('full')).toEqual(FULL_LAYOUT);
    });

    it('should return correct config for simplified mode', () => {
      expect(getLayoutConfig('simplified')).toEqual(SIMPLIFIED_LAYOUT);
    });

    it('should return correct config for minimal mode', () => {
      expect(getLayoutConfig('minimal')).toEqual(MINIMAL_LAYOUT);
    });

    it('should return correct config for focused mode', () => {
      expect(getLayoutConfig('focused')).toEqual(FOCUSED_LAYOUT);
    });
  });

  describe('Effective Layout Calculation', () => {
    it('should use user preference when provided', () => {
      expect(calculateEffectiveLayoutMode('low', 'simplified')).toBe('simplified');
    });

    it('should override full mode when load is critical', () => {
      expect(calculateEffectiveLayoutMode('critical', 'full')).toBe('simplified');
    });

    it('should use load-based mode when no preference', () => {
      expect(calculateEffectiveLayoutMode('high', null)).toBe('minimal');
    });

    it('should respect forceSimple flag', () => {
      expect(calculateEffectiveLayoutMode('low', 'full', true)).toBe('minimal');
    });
  });

  describe('CSS Generation', () => {
    it('should generate correct CSS properties', () => {
      const css = generateLayoutCSS(FULL_LAYOUT);
      
      expect(css['--adaptive-columns']).toBe('3');
      expect(css['--adaptive-gap']).toBe('1.5rem');
      expect(css['--adaptive-font-scale']).toBe('1');
    });

    it('should generate correct layout classes', () => {
      const classes = getLayoutClasses(MINIMAL_LAYOUT);
      
      expect(classes).toContain('adaptive-layout-minimal');
      expect(classes).toContain('adaptive-columns-1');
      expect(classes).toContain('adaptive-no-sidebars');
    });
  });

  describe('Viewport Adjustment', () => {
    it('should reduce columns on mobile viewport', () => {
      const adjusted = adjustLayoutForViewport(
        FULL_LAYOUT,
        400,
        DEFAULT_BREAKPOINTS
      );
      expect(adjusted.grid.columns).toBe(1);
    });

    it('should reduce spacing on mobile viewport', () => {
      const adjusted = adjustLayoutForViewport(
        FULL_LAYOUT,
        400,
        DEFAULT_BREAKPOINTS
      );
      expect(adjusted.spacing.sectionPadding).toBeLessThan(FULL_LAYOUT.spacing.sectionPadding);
    });

    it('should maintain columns on desktop viewport', () => {
      const adjusted = adjustLayoutForViewport(
        FULL_LAYOUT,
        1200,
        DEFAULT_BREAKPOINTS
      );
      expect(adjusted.grid.columns).toBe(FULL_LAYOUT.grid.columns);
    });
  });

  describe('Layout State Management', () => {
    it('should create initial state correctly', () => {
      const state = createLayoutState('full', 1024);
      
      expect(state.currentMode).toBe('full');
      expect(state.userOverride).toBeNull();
      expect(state.collapsedSections.size).toBe(0);
    });

    it('should update state for load', () => {
      const initial = createLayoutState('full', 1024);
      const updated = updateLayoutForLoad(initial, 'high');
      
      expect(updated.currentMode).toBe('minimal');
    });

    it('should toggle section collapse', () => {
      const initial = createLayoutState('full', 1024);
      const updated = toggleSectionCollapse(initial, 'section1');
      
      expect(updated.collapsedSections.has('section1')).toBe(true);
    });

    it('should set user preference', () => {
      const initial = createLayoutState('full', 1024);
      const updated = setUserLayoutPreference(initial, 'simplified');
      
      expect(updated.userOverride).toBe('simplified');
      expect(updated.currentMode).toBe('simplified');
    });
  });
});

// ============================================================================
// Progressive Disclosure Tests
// ============================================================================

describe('Progressive Disclosure', () => {
  describe('Disclosure Level Mapping', () => {
    it('should map low load to low-load disclosure', () => {
      expect(loadToDisclosureLevel('low')).toBe('low-load');
    });

    it('should map critical load to never disclosure', () => {
      expect(loadToDisclosureLevel('critical')).toBe('never');
    });
  });

  describe('Disclosure Decision', () => {
    it('should always show elements with always level', () => {
      expect(shouldDisclose('always', 'critical')).toBe(true);
    });

    it('should never show elements with never level', () => {
      expect(shouldDisclose('never', 'low')).toBe(false);
    });

    it('should show low-load elements at low load', () => {
      expect(shouldDisclose('low-load', 'low')).toBe(true);
    });

    it('should show low-load elements at high load', () => {
      expect(shouldDisclose('low-load', 'high')).toBe(true);
    });

    it('should hide high-load elements at low load', () => {
      expect(shouldDisclose('high-load', 'low')).toBe(false);
    });
  });

  describe('Section Sorting', () => {
    it('should sort visible sections first', () => {
      const sections = [
        { sectionId: '1', showAt: 'always' as const, collapsible: false, defaultCollapsed: false, priority: 1 },
        { sectionId: '2', showAt: 'never' as const, collapsible: false, defaultCollapsed: false, priority: 10 },
      ];
      const sorted = sortSectionsByPriority(sections, 'low');
      
      expect(sorted[0].section.sectionId).toBe('1');
      expect(sorted[0].decision.visible).toBe(true);
    });
  });
});

// ============================================================================
// Smart Defaults Tests
// ============================================================================

describe('Smart Defaults System', () => {
  describe('Provider Registry', () => {
    it('should register a provider', () => {
      registerDefaultProvider({
        id: 'test-provider',
        fieldTypes: ['text'],
        provider: () => null,
        priority: 10,
      });

      const providers = getProvidersForFieldType('text');
      expect(providers.some(p => p.id === 'test-provider')).toBe(true);
    });

    it('should unregister a provider', () => {
      registerDefaultProvider({
        id: 'test-unregister',
        fieldTypes: ['text'],
        provider: () => null,
        priority: 10,
      });
      
      unregisterDefaultProvider('test-unregister');
      const providers = getProvidersForFieldType('text');
      expect(providers.some(p => p.id === 'test-unregister')).toBe(false);
    });

    it('should sort providers by priority', () => {
      registerDefaultProvider({
        id: 'low-priority',
        fieldTypes: ['radio'],
        provider: () => null,
        priority: 1,
      });
      
      registerDefaultProvider({
        id: 'high-priority',
        fieldTypes: ['radio'],
        provider: () => null,
        priority: 100,
      });

      const providers = getProvidersForFieldType('radio');
      expect(providers[0].id).toBe('high-priority');
    });
  });

  describe('Inference Rules', () => {
    it('should evaluate eq condition correctly', () => {
      const rule = {
        id: 'test',
        conditions: [{ key: 'type', operator: 'eq' as const, value: 'admin' }],
        defaultValue: 'full-access',
        confidence: 0.9,
        priority: 1,
      };
      
      const result = evaluateRule(rule, { type: 'admin' });
      expect(result.matches).toBe(true);
    });

    it('should evaluate neq condition correctly', () => {
      const rule = {
        id: 'test',
        conditions: [{ key: 'type', operator: 'neq' as const, value: 'guest' }],
        defaultValue: 'standard',
        confidence: 0.8,
        priority: 1,
      };
      
      const result = evaluateRule(rule, { type: 'user' });
      expect(result.matches).toBe(true);
    });

    it('should evaluate gt condition correctly', () => {
      const rule = {
        id: 'test',
        conditions: [{ key: 'age', operator: 'gt' as const, value: 18 }],
        defaultValue: 'adult',
        confidence: 1,
        priority: 1,
      };
      
      const result = evaluateRule(rule, { age: 25 });
      expect(result.matches).toBe(true);
    });

    it('should return no match for failing condition', () => {
      const rule = {
        id: 'test',
        conditions: [{ key: 'type', operator: 'eq' as const, value: 'admin' }],
        defaultValue: 'full-access',
        confidence: 0.9,
        priority: 1,
      };
      
      const result = evaluateRule(rule, { type: 'user' });
      expect(result.matches).toBe(false);
    });
  });

  describe('Auto-fill', () => {
    it('should fill fields with high confidence defaults', () => {
      // Register a provider that returns high confidence
      registerDefaultProvider({
        id: 'autofill-test',
        fieldTypes: ['text'],
        provider: () => ({
          value: 'auto-filled',
          meta: {
            source: 'smart-suggestion' as const,
            confidence: 0.95,
            lastUsed: Date.now(),
            useCount: 0,
            userConfirmed: false,
            contextKeys: [],
          },
          alternatives: [],
        }),
        priority: 1000,
      });

      const result = autoFillForm({
        fields: [{ fieldId: 'name', fieldType: 'text' }],
        formContext: 'test',
        pageContext: 'test',
        minConfidence: 0.5,
        requireConfirmation: false,
      });

      expect(result.filledFields['name']).toBe('auto-filled');
      expect(result.overallConfidence).toBeGreaterThan(0.5);
    });

    it('should leave fields unfilled when confidence is low', () => {
      const result = autoFillForm({
        fields: [{ fieldId: 'unknown', fieldType: 'custom' }],
        formContext: 'test',
        pageContext: 'test',
        minConfidence: 0.9,
        requireConfirmation: false,
      });

      expect(result.unfilledFields).toContain('unknown');
    });
  });
});

// ============================================================================
// Content Simplification Tests
// ============================================================================

describe('Content Simplification', () => {
  describe('Readability Analysis', () => {
    it('should calculate Flesch score for simple text', () => {
      // "The cat sat." - 3 words, 1 sentence, 3 syllables
      const score = calculateFleschScore(1, 3, 3);
      expect(score).toBeGreaterThan(100);
    });

    it('should count syllables correctly', () => {
      expect(countSyllables('cat')).toBe(1);
      expect(countSyllables('hello')).toBe(2);
      expect(countSyllables('beautiful')).toBe(3);
    });

    it('should split sentences correctly', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      const sentences = splitSentences(text);
      expect(sentences).toHaveLength(3);
    });
  });

  describe('Text Simplification', () => {
    it('should simplify vocabulary', () => {
      const text = 'We need to utilize this implementation.';
      const simplified = simplifyVocabulary(text);
      expect(simplified).toContain('use');
      expect(simplified).not.toContain('utilize');
    });

    it('should remove redundant phrases', () => {
      const text = 'This is a free gift for you.';
      const cleaned = removeRedundancy(text);
      expect(cleaned).not.toContain('free gift');
    });

    it('should calculate grade level', () => {
      const grade = calculateGradeLevel(1, 10, 15);
      expect(grade).toBeGreaterThan(0);
    });
  });

  describe('Summarization', () => {
    it('should extract keywords from text', () => {
      const text = 'The quick brown fox jumps over the lazy dog. The fox is quick and brown.';
      const keywords = extractKeywords(text, 3);
      expect(keywords).toContain('fox');
      expect(keywords).toContain('quick');
      expect(keywords).toContain('brown');
    });

    it('should generate TLDR summary', () => {
      const text = 'First sentence about topic. Second important point. Third detail. Fourth conclusion.';
      const tldr = generateTLDR(text, 2);
      expect(tldr.split('.').length).toBeLessThanOrEqual(3);
    });

    it('should generate bullet point summary', () => {
      const text = 'Point one. Point two. Point three. Point four.';
      const bullets = generateBulletSummary(text, 3);
      expect(bullets.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Adaptive Content Processing', () => {
    it('should simplify content based on load level', () => {
      const text = 'The implementation of this complex system requires substantial consideration of various factors.';
      
      const result = processAdaptiveContent({
        originalText: text,
        loadLevel: 'critical',
        showTLDR: false,
        useBulletPoints: false,
        maxReadingTime: 30,
      });

      expect(result.readability.simplified.fleschScore).toBeGreaterThan(
        result.readability.original.fleschScore
      );
    });
  });
});

// ============================================================================
// Preference Learning Tests
// ============================================================================

describe('Preference Learning', () => {
  describe('Context Building', () => {
    it('should determine time of day', () => {
      // Just verify function returns expected format
      const timeOfDay = getTimeOfDay();
      expect(['morning', 'afternoon', 'evening', 'night']).toContain(timeOfDay);
    });

    it('should detect mobile device', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      
      expect(getDeviceType()).toBe('mobile');
    });

    it('should detect desktop device', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      
      expect(getDeviceType()).toBe('desktop');
    });
  });

  describe('Preference Store', () => {
    it('should record new preference', () => {
      const store = new PreferenceStore();
      
      const pref = store.record('theme', 'ui', 'dark', {
        timestamp: Date.now(),
        timeOfDay: 'evening',
        dayOfWeek: 1,
        deviceType: 'desktop',
        screenSize: 'large',
        cognitiveLoad: 'low',
        pageContext: 'settings',
        metadata: {},
      });

      expect(pref.value).toBe('dark');
      expect(pref.frequency).toBe(1);
    });

    it('should update existing preference', () => {
      const store = new PreferenceStore();
      
      const context = {
        timestamp: Date.now(),
        timeOfDay: 'evening',
        dayOfWeek: 1,
        deviceType: 'desktop',
        screenSize: 'large',
        cognitiveLoad: 'low',
        pageContext: 'settings',
        metadata: {},
      };

      store.record('theme', 'ui', 'dark', context);
      const updated = store.record('theme', 'ui', 'dark', context);

      expect(updated.frequency).toBe(2);
    });

    it('should predict based on temporal pattern', () => {
      const store = new PreferenceStore({ minObservations: 2, confidenceThreshold: 0.3 });
      
      const context = {
        timestamp: Date.now(),
        timeOfDay: 'evening',
        dayOfWeek: 1,
        deviceType: 'desktop',
        screenSize: 'large',
        cognitiveLoad: 'low',
        pageContext: 'settings',
        metadata: {},
      };

      // Record multiple times to build strong pattern
      store.record('theme', 'ui', 'dark', context);
      store.record('theme', 'ui', 'dark', context);
      store.record('theme', 'ui', 'dark', context);

      const prediction = store.predict('theme', context);
      // With temporal pattern detected and high frequency, should predict value
      expect(prediction.value).toBe('dark');
      expect(prediction.confidence).toBeGreaterThan(0);
    });
  });

  describe('A/B Testing', () => {
    it('should create test with variants', () => {
      const manager = new ABTestManager();
      
      const test = manager.createTest({
        testId: 'button-color',
        description: 'Test button colors',
        variants: [
          { id: 'blue', value: '#00d4ff', weight: 1 },
          { id: 'green', value: '#00ff88', weight: 1 },
        ],
        trafficAllocation: 1,
        minSampleSize: 100,
        duration: 7 * 24 * 60 * 60 * 1000,
        successMetric: 'clicks',
      });

      expect(test.variants).toHaveLength(2);
      expect(test.startTime).toBeGreaterThan(0);
    });

    it('should assign user to variant deterministically', () => {
      const manager = new ABTestManager();
      
      manager.createTest({
        testId: 'test-1',
        description: 'Test',
        variants: [
          { id: 'a', value: 'A', weight: 1 },
          { id: 'b', value: 'B', weight: 1 },
        ],
        trafficAllocation: 1,
        minSampleSize: 10,
        duration: 7 * 24 * 60 * 60 * 1000,
        successMetric: 'conversion',
      });

      const variant1 = manager.getVariant('test-1', 'user-123');
      const variant2 = manager.getVariant('test-1', 'user-123');
      
      expect(variant1).toEqual(variant2);
    });

    it('should record impressions and conversions', () => {
      const manager = new ABTestManager();
      
      manager.createTest({
        testId: 'test-2',
        description: 'Test',
        variants: [{ id: 'control', value: 'control', weight: 1 }],
        trafficAllocation: 1,
        minSampleSize: 1,
        duration: 7 * 24 * 60 * 60 * 1000,
        successMetric: 'conversion',
      });

      manager.getVariant('test-2', 'user-1');
      manager.recordImpression('test-2', 'user-1');
      manager.recordConversion('test-2', 'user-1');

      const results = manager.getResults('test-2');
      expect(results?.variantStats[0].impressions).toBe(1);
      expect(results?.variantStats[0].conversions).toBe(1);
    });
  });

  describe('Prediction', () => {
    it('should predict optimal setting with high confidence', () => {
      const store = new PreferenceStore({ minObservations: 1, confidenceThreshold: 0.1 });
      setGlobalStore(store);
      
      const context = {
        timestamp: Date.now(),
        timeOfDay: 'evening',
        dayOfWeek: 1,
        deviceType: 'desktop',
        screenSize: 'large',
        cognitiveLoad: 'low',
        pageContext: 'test',
        metadata: {},
      };

      // Record many observations to build strong preference
      for (let i = 0; i < 10; i++) {
        store.record('ui:theme:preference', 'ui', 'dark', context);
      }

      const prediction = predictOptimal('ui:theme:preference', 'test', 'low', 'light');
      // With enough observations, should predict the learned preference
      expect(prediction.value).toBe('dark');
      expect(prediction.basis).toBe('preference');
    });

    it('should fall back to default with low confidence', () => {
      const store = new PreferenceStore();
      setGlobalStore(store);

      const prediction = predictOptimal('unknown:preference', 'test', 'low', 'default-value');
      expect(prediction.value).toBe('default-value');
      expect(prediction.basis).toBe('default');
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration', () => {
  it('should coordinate layout with cognitive load', () => {
    // Low load should get full layout and complex content
    const lowLayout = getLayoutConfigForLoad('low');
    const lowComplexity = LOAD_TO_COMPLEXITY_CONFIG['low'];
    
    expect(lowLayout.mode).toBe('full');
    expect(lowComplexity.strategies).toContain('add-headings');

    // Critical load should get focused layout and simple content
    const criticalLayout = getLayoutConfigForLoad('critical');
    const criticalComplexity = LOAD_TO_COMPLEXITY_CONFIG['critical'];
    
    expect(criticalLayout.mode).toBe('focused');
    expect(criticalComplexity.strategies).toContain('highlight-key-points');
  });

  it('should provide consistent complexity mappings', () => {
    const loadLevels: CognitiveLoadLevel[] = ['low', 'medium', 'high', 'critical'];
    
    for (const level of loadLevels) {
      const layoutMode = LOAD_TO_LAYOUT_MAP[level];
      const complexityConfig = LOAD_TO_COMPLEXITY_CONFIG[level];
      
      // Verify each load level has valid configs
      expect(layoutMode).toBeDefined();
      expect(complexityConfig).toBeDefined();
      expect(complexityConfig.strategies.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty text in readability analysis', () => {
    const result = analyzeReadability('');
    expect(result.wordCount).toBe(0);
    expect(result.fleschScore).toBe(100);
  });

  it('should handle single word sentences', () => {
    const sentences = splitSentences('Hello.');
    expect(sentences).toHaveLength(1);
    
    const result = analyzeReadability('Hello.');
    expect(result.wordCount).toBe(1);
  });

  it('should handle undefined values in rule evaluation', () => {
    const rule = {
      id: 'test',
      conditions: [{ key: 'missing', operator: 'eq' as const, value: 'value' }],
      defaultValue: 'default',
      confidence: 1,
      priority: 1,
    };
    
    const result = evaluateRule(rule, {});
    expect(result.matches).toBe(false);
  });

  it('should handle provider errors gracefully', () => {
    registerDefaultProvider({
      id: 'error-provider',
      fieldTypes: ['text'],
      provider: () => {
        throw new Error('Provider error');
      },
      priority: 1,
    });

    const context = {
      fieldId: 'test',
      fieldType: 'text',
      pageContext: 'test',
      data: {},
    };

    // Should not throw
    expect(() => getSmartDefault(context)).not.toThrow();
  });

  it('should handle very long text in summarization', () => {
    const longText = 'Sentence one. '.repeat(100);
    
    const tldr = generateTLDR(longText, 3);
    expect(tldr.length).toBeLessThan(longText.length);
    
    const keywords = extractKeywords(longText, 10);
    expect(keywords.length).toBeLessThanOrEqual(10);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  it('should analyze readability quickly', () => {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(100);
    
    const start = performance.now();
    analyzeReadability(text);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
  });

  it('should process layout config quickly', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const config = getLayoutConfigForLoad('medium');
      adjustLayoutForViewport(config, 800);
    }
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
