/** [Ver001.000] */
/**
 * Context Detection Engine Tests
 * ==============================
 * Tests for ContextDetector, TriggerEvaluator, and HelpEngine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextDetector } from '../ContextDetector';
import { TriggerEvaluator } from '../TriggerEngine';
import { HelpEngine } from '../HelpEngine';
import { UserExpertiseProfile } from '@sator/types/help';
import type { HelpTrigger, UserAction, ErrorEvent } from '@sator/types/help';

describe('ContextDetector', () => {
  let detector: ContextDetector;

  beforeEach(() => {
    detector = new ContextDetector();
  });

  it('should detect stuck user due to inactivity', () => {
    // Record an action first, then wait
    detector.recordAction({
      type: 'view',
      featureId: 'test-feature',
      timestamp: new Date(Date.now() - 1000), // 1 second ago
    });
    const stuck = detector.isUserStuck(100); // 100ms threshold
    expect(stuck.isStuck).toBe(true);
    expect(stuck.reason).toBe('no_action');
  });

  it('should not detect stuck user with recent activity', () => {
    detector.recordAction({
      type: 'click',
      featureId: 'test-feature',
      timestamp: new Date(),
    });
    
    const stuck = detector.isUserStuck(30000);
    expect(stuck.isStuck).toBe(false);
  });

  it('should detect rapid clicking', () => {
    const now = Date.now();
    for (let i = 0; i < 6; i++) {
      detector.recordAction({
        type: 'click',
        featureId: 'test-feature',
        timestamp: new Date(now - i * 100),
      });
    }
    
    const stuck = detector.isUserStuck();
    expect(stuck.isStuck).toBe(true);
    expect(stuck.reason).toBe('rapid_clicks');
  });

  it('should detect error spike', () => {
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      detector.recordError({
        code: 'TEST_ERROR',
        message: 'Test error',
        featureId: 'test-feature',
        timestamp: new Date(now.getTime() - i * 1000),
        recoverable: true,
      });
    }
    
    const spike = detector.detectErrorSpike();
    expect(spike.hasSpike).toBe(true);
    expect(spike.errorCount).toBeGreaterThanOrEqual(3);
  });

  it('should detect repeated errors', () => {
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      detector.recordError({
        code: 'SAME_ERROR',
        message: 'Repeated error',
        featureId: 'test-feature',
        timestamp: new Date(now.getTime() - i * 1000),
        recoverable: true,
      });
    }
    
    const repeated = detector.hasRepeatedErrors(3, 60000);
    expect(repeated.hasRepeatedErrors).toBe(true);
    expect(repeated.errorCode).toBe('SAME_ERROR');
  });
});

describe('TriggerEvaluator', () => {
  let evaluator: TriggerEvaluator;

  beforeEach(() => {
    evaluator = new TriggerEvaluator();
  });

  it('should evaluate trigger conditions correctly', () => {
    const trigger: HelpTrigger = {
      id: 'test-trigger',
      type: 'first_visit',
      conditions: [{ metric: 'visitCount', operator: 'eq', value: 1 }],
      cooldownMs: 60000,
      priority: 4,
      contentId: 'welcome',
      suggestedLevel: 'interactive',
    };

    const result = evaluator.evaluate(trigger);
    expect(result.shouldTrigger).toBe(true);
    expect(result.trigger).toEqual(trigger);
  });

  it('should respect cooldown period', () => {
    const trigger: HelpTrigger = {
      id: 'test-trigger',
      type: 'first_visit',
      conditions: [{ metric: 'visitCount', operator: 'eq', value: 1 }],
      cooldownMs: 60000,
      priority: 4,
      contentId: 'welcome',
      suggestedLevel: 'interactive',
    };

    // First evaluation
    evaluator.markTriggered(trigger.id, {
      userId: 'test',
      currentPage: '/test',
      timestamp: new Date(),
      recentActions: [],
      recentErrors: [],
    });

    // Second evaluation should be on cooldown
    const result = evaluator.evaluate(trigger);
    expect(result.shouldTrigger).toBe(false);
    expect(result.suppressed).toBe(true);
  });

  it('should filter by priority threshold', () => {
    const trigger: HelpTrigger = {
      id: 'low-priority',
      type: 'manual_request',
      conditions: [],
      cooldownMs: 0,
      priority: 1,
      contentId: 'help',
      suggestedLevel: 'summary',
    };

    const result = evaluator.evaluate(trigger);
    expect(result.shouldTrigger).toBe(false);
    expect(result.reason).toContain('Priority');
  });
});

describe('UserExpertiseProfile', () => {
  it('should determine help level for new users', () => {
    const profile = new UserExpertiseProfile({
      userId: 'test-user',
      overallLevel: 'beginner',
      features: {},
      lastUpdated: new Date(),
    });

    const helpLevel = profile.getHelpLevel('new-feature');
    expect(helpLevel.level).toBe('summary');
    expect(helpLevel.confidence).toBe(0.5);
  });

  it('should recommend detailed help for struggling beginners', () => {
    const profile = new UserExpertiseProfile({
      userId: 'test-user',
      overallLevel: 'beginner',
      features: {
        'struggling-feature': {
          level: 'beginner',
          confidence: 0.2,
          lastInteraction: new Date(),
          helpRequests: 3,
          errors: 5,
          successfulActions: 2,
          timeSpentSeconds: 300,
        },
      },
      lastUpdated: new Date(),
    });

    const helpLevel = profile.getHelpLevel('struggling-feature');
    expect(helpLevel.level).toBe('interactive');
    expect(helpLevel.confidence).toBeGreaterThan(0.5);
  });

  it('should auto-trigger for beginners with errors', () => {
    const profile = new UserExpertiseProfile({
      userId: 'test-user',
      overallLevel: 'beginner',
      features: {
        'error-feature': {
          level: 'beginner',
          confidence: 0.3,
          lastInteraction: new Date(),
          helpRequests: 0,
          errors: 2,
          successfulActions: 1,
          timeSpentSeconds: 60,
        },
      },
      lastUpdated: new Date(),
    });

    expect(profile.shouldAutoTrigger('error-feature')).toBe(true);
  });

  it('should calculate promotions based on criteria', () => {
    const profile = new UserExpertiseProfile({
      userId: 'test-user',
      overallLevel: 'intermediate',
      features: {
        'ready-feature': {
          level: 'beginner',
          confidence: 0.7,
          lastInteraction: new Date(),
          helpRequests: 0,
          errors: 1,
          successfulActions: 9,
          timeSpentSeconds: 600,
        },
        'not-ready': {
          level: 'beginner',
          confidence: 0.3,
          lastInteraction: new Date(),
          helpRequests: 5,
          errors: 4,
          successfulActions: 2,
          timeSpentSeconds: 300,
        },
      },
      lastUpdated: new Date(),
    });

    const promotions = profile.calculatePromotion({
      minInteractions: 5,
      minSuccessRate: 0.8,
      decliningHelpUsage: true,
      timeWindowDays: 30,
    });

    expect(promotions.length).toBe(1);
    expect(promotions[0].level).toBe('intermediate');
  });
});

describe('HelpEngine', () => {
  let engine: HelpEngine;

  beforeEach(() => {
    engine = new HelpEngine();
  });

  it('should detect when help is needed', () => {
    // Record multiple errors to trigger help
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      engine.recordError({
        code: 'ERROR',
        message: 'Test error',
        featureId: 'test-feature',
        timestamp: new Date(now.getTime() - i * 1000),
        recoverable: true,
      });
    }

    const result = engine.checkForHelp('test-feature');
    expect(result.shouldShowHelp).toBe(true);
    expect(result.reason).toContain('Error spike');
  });

  it('should respect user profile for help level', () => {
    const profileData = {
      userId: 'test-user',
      overallLevel: 'expert' as const,
      features: {
        'expert-feature': {
          level: 'expert' as const,
          confidence: 0.9,
          lastInteraction: new Date(),
          helpRequests: 0,
          errors: 0,
          successfulActions: 50,
          timeSpentSeconds: 3600,
        },
      },
      lastUpdated: new Date(),
    };

    engine.setUserProfile(profileData);
    const result = engine.checkForHelp('expert-feature');
    
    // Experts should get summary level
    expect(result.helpLevel).toBe('summary');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should identify promotion-ready features', () => {
    const profileData = {
      userId: 'test-user',
      overallLevel: 'intermediate' as const,
      features: {
        'promotion-ready': {
          level: 'beginner' as const,
          confidence: 0.7,
          lastInteraction: new Date(),
          helpRequests: 0,
          errors: 1,
          successfulActions: 9,
          timeSpentSeconds: 600,
        },
      },
      lastUpdated: new Date(),
    };

    engine.setUserProfile(profileData);
    const promotions = engine.checkPromotions();
    
    expect(promotions.length).toBe(1);
    expect(promotions[0].level).toBe('intermediate');
  });
});
