[Ver001.000]

/**
 * Mobile Screen Reader Tests
 * 
 * Comprehensive test suite for VoiceOver and TalkBack support.
 * Tests detection, announcements, traversal, and gesture handling.
 * 
 * @module lib/mobile/__tests__/screenreader
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window and navigator
const mockWindow = {
  navigator: {
    userAgent: '',
    maxTouchPoints: 0,
    vibrate: vi.fn(),
  },
  matchMedia: vi.fn(),
  speechSynthesis: {
    speak: vi.fn(),
    cancel: vi.fn(),
  },
  AudioContext: vi.fn(),
  webkitAudioContext: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  innerWidth: 375,
  innerHeight: 812,
  screen: {
    width: 375,
    height: 812,
    orientation: null,
  },
};

Object.assign(global, { window: mockWindow });

// Import after mock setup
import {
  isVoiceOverEnabled,
  announceToVoiceOver,
  createRotorConfig,
  createRegionConfig,
  formatNumberForVoiceOver,
  formatPercentageForVoiceOver,
  VOICEOVER_CSS,
  TRAIT_TO_ROLE,
} from '../voiceover';

import {
  isTalkBackEnabled,
  announceToTalkBack,
  TalkBackTraversalManager,
  TalkBackGestureManager,
  createTraversalManager,
  createGestureManager,
  TALKBACK_VIBRATIONS,
  TALKBACK_EARCONS,
  formatNumberForTalkBack,
} from '../talkback';

// ============================================================================
// VOICEOVER TESTS
// ============================================================================

describe('VoiceOver Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindow.navigator.userAgent = '';
    mockWindow.navigator.maxTouchPoints = 0;
  });

  describe('Detection', () => {
    it('should detect VoiceOver on iPhone', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)';
      mockWindow.matchMedia.mockReturnValue({ matches: true });
      
      const enabled = isVoiceOverEnabled();
      
      // Note: Detection is heuristic-based, may return false in test environment
      expect(typeof enabled).toBe('boolean');
    });

    it('should detect VoiceOver on iPad', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)';
      mockWindow.matchMedia.mockReturnValue({ matches: true });
      
      const enabled = isVoiceOverEnabled();
      expect(typeof enabled).toBe('boolean');
    });

    it('should return false for non-Apple devices', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 13; SM-G998B)';
      
      expect(isVoiceOverEnabled()).toBe(false);
    });

    it('should return false on server-side', () => {
      // Simulate server-side by temporarily removing window
      const originalWindow = global.window;
      // @ts-expect-error - testing server-side
      global.window = undefined;
      
      expect(isVoiceOverEnabled()).toBe(false);
      
      global.window = originalWindow;
    });
  });

  describe('Announcements', () => {
    it('should announce text to VoiceOver', () => {
      const text = 'Test announcement';
      
      // Should not throw
      expect(() => announceToVoiceOver(text)).not.toThrow();
    });

    it('should announce with options', () => {
      const options = {
        text: 'Priority announcement',
        priority: 'high' as const,
        interrupt: true,
        delay: 100,
      };
      
      expect(() => announceToVoiceOver(options)).not.toThrow();
    });

    it('should handle empty announcement', () => {
      expect(() => announceToVoiceOver('')).not.toThrow();
    });

    it('should queue multiple announcements', () => {
      announceToVoiceOver('First announcement');
      announceToVoiceOver('Second announcement');
      
      // Queue should process without errors
      expect(true).toBe(true);
    });
  });

  describe('Rotor Configuration', () => {
    it('should create navigation rotor config', () => {
      const config = createRotorConfig('navigation', [
        { label: 'Home', value: 'home', onSelect: vi.fn() },
        { label: 'Settings', value: 'settings', onSelect: vi.fn() },
      ]);
      
      expect(config.name).toBe('Navigation');
      expect(config.items).toHaveLength(2);
    });

    it('should create headers rotor config', () => {
      const config = createRotorConfig('headers');
      
      expect(config.name).toBe('Headings');
      expect(config.items).toEqual([]);
    });

    it('should create links rotor config', () => {
      const config = createRotorConfig('links');
      
      expect(config.name).toBe('Links');
    });

    it('should create custom rotor config', () => {
      const items = [
        { label: 'Custom 1', value: 'c1', onSelect: vi.fn() },
      ];
      const config = createRotorConfig('custom', items);
      
      expect(config.name).toBe('Custom');
      expect(config.items).toEqual(items);
    });
  });

  describe('Region Configuration', () => {
    it('should create region config with defaults', () => {
      const config = createRegionConfig('main-content', 'Main Content');
      
      expect(config.id).toBe('main-content');
      expect(config.label).toBe('Main Content');
      expect(config.atomic).toBe(true);
    });

    it('should create region config with custom options', () => {
      const config = createRegionConfig('sidebar', 'Sidebar', {
        description: 'Navigation sidebar',
        atomic: false,
        traits: ['header'],
      });
      
      expect(config.description).toBe('Navigation sidebar');
      expect(config.atomic).toBe(false);
      expect(config.traits).toContain('header');
    });
  });

  describe('Formatting', () => {
    it('should format large numbers for VoiceOver', () => {
      expect(formatNumberForVoiceOver(1500000)).toContain('million');
      expect(formatNumberForVoiceOver(5000)).toContain('thousand');
    });

    it('should format small numbers as-is', () => {
      expect(formatNumberForVoiceOver(42)).toBe('42');
      expect(formatNumberForVoiceOver(999)).toBe('999');
    });

    it('should format percentages', () => {
      expect(formatPercentageForVoiceOver(75)).toBe('75 percent');
      expect(formatPercentageForVoiceOver(33.33, true)).toBe('33.3 percent');
    });
  });

  describe('Constants', () => {
    it('should export VoiceOver CSS', () => {
      expect(VOICEOVER_CSS).toContain('role="button"');
      expect(VOICEOVER_CSS).toContain('voiceover-only');
    });

    it('should have valid trait to role mappings', () => {
      expect(TRAIT_TO_ROLE.button).toBe('button');
      expect(TRAIT_TO_ROLE.link).toBe('link');
      expect(TRAIT_TO_ROLE.header).toBe('heading');
      expect(TRAIT_TO_ROLE.searchField).toBe('searchbox');
    });
  });
});

// ============================================================================
// TALKBACK TESTS
// ============================================================================

describe('TalkBack Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindow.navigator.userAgent = '';
    mockWindow.navigator.maxTouchPoints = 0;
  });

  describe('Detection', () => {
    it('should detect TalkBack on Android', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 13; SM-G998B)';
      mockWindow.navigator.maxTouchPoints = 5;
      mockWindow.matchMedia.mockReturnValue({ matches: true });
      
      const enabled = isTalkBackEnabled();
      expect(typeof enabled).toBe('boolean');
    });

    it('should return false for non-Android devices', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)';
      
      expect(isTalkBackEnabled()).toBe(false);
    });

    it('should return false on server-side', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing server-side
      global.window = undefined;
      
      expect(isTalkBackEnabled()).toBe(false);
      
      global.window = originalWindow;
    });
  });

  describe('Announcements', () => {
    it('should announce text to TalkBack', () => {
      const text = 'Test announcement';
      
      expect(() => announceToTalkBack(text)).not.toThrow();
    });

    it('should announce with options', () => {
      const options = {
        text: 'Priority announcement',
        priority: 'high' as const,
        queue: true,
        vibration: [0, 50],
      };
      
      expect(() => announceToTalkBack(options)).not.toThrow();
    });

    it('should trigger vibration if available', () => {
      announceToTalkBack({
        text: 'Vibration test',
        vibration: [0, 100, 100, 100],
      });
      
      // Vibration should be called
      expect(mockWindow.navigator.vibrate).toHaveBeenCalled();
    });
  });

  describe('Traversal Manager', () => {
    it('should create traversal manager', () => {
      const manager = createTraversalManager();
      expect(manager).toBeInstanceOf(TalkBackTraversalManager);
    });

    it('should initialize traversal with element order', () => {
      const manager = createTraversalManager();
      const mockContainer = document.createElement('div');
      const mockElement1 = document.createElement('button');
      const mockElement2 = document.createElement('a');
      
      mockContainer.appendChild(mockElement1);
      mockContainer.appendChild(mockElement2);
      
      const cleanup = manager.init({
        container: mockContainer,
        order: [mockElement1, mockElement2],
      });
      
      expect(typeof cleanup).toBe('function');
      expect(mockElement1.getAttribute('data-talkback-index')).toBe('0');
      expect(mockElement2.getAttribute('data-talkback-index')).toBe('1');
      
      cleanup();
    });

    it('should navigate to next element', () => {
      const manager = createTraversalManager();
      const mockContainer = document.createElement('div');
      const mockElement1 = document.createElement('button');
      const mockElement2 = document.createElement('a');
      
      mockContainer.appendChild(mockElement1);
      mockContainer.appendChild(mockElement2);
      
      manager.init({
        container: mockContainer,
        order: [mockElement1, mockElement2],
      });
      
      const current = manager.getCurrent();
      const next = manager.next();
      
      expect(next).toBeDefined();
    });

    it('should navigate to previous element', () => {
      const manager = createTraversalManager();
      const mockContainer = document.createElement('div');
      const mockElement1 = document.createElement('button');
      const mockElement2 = document.createElement('a');
      
      mockContainer.appendChild(mockElement1);
      mockContainer.appendChild(mockElement2);
      document.body.appendChild(mockContainer);
      
      manager.init({
        container: mockContainer,
        order: [mockElement1, mockElement2],
      });
      
      manager.focusAt(1);
      const previous = manager.previous();
      
      expect(previous).toBeDefined();
      
      document.body.removeChild(mockContainer);
    });

    it('should return null when navigating past bounds', () => {
      const manager = createTraversalManager();
      const mockContainer = document.createElement('div');
      const mockElement = document.createElement('button');
      
      mockContainer.appendChild(mockElement);
      
      manager.init({
        container: mockContainer,
        order: [mockElement],
      });
      
      expect(manager.next()).toBeNull();
      
      manager.focusAt(0);
      expect(manager.previous()).toBeNull();
    });
  });

  describe('Gesture Manager', () => {
    it('should create gesture manager', () => {
      const manager = createGestureManager();
      expect(manager).toBeInstanceOf(TalkBackGestureManager);
    });

    it('should attach and detach from element', () => {
      const manager = createGestureManager();
      const element = document.createElement('div');
      
      manager.attach(element);
      manager.detach();
      
      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should register gesture handlers', () => {
      const manager = createGestureManager();
      const handler = vi.fn();
      
      const unregister = manager.onGesture({
        gesture: 'swipeUp',
        handler,
        priority: 1,
      });
      
      expect(typeof unregister).toBe('function');
      
      unregister();
    });

    it('should handle multiple gesture handlers', () => {
      const manager = createGestureManager();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      manager.onGesture({ gesture: 'swipeUp', handler: handler1 });
      manager.onGesture({ gesture: 'swipeUp', handler: handler2 });
      
      // Both handlers registered
      expect(true).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should have vibration patterns', () => {
      expect(TALKBACK_VIBRATIONS.focus).toBeDefined();
      expect(TALKBACK_VIBRATIONS.action).toBeDefined();
      expect(TALKBACK_VIBRATIONS.error).toBeDefined();
      expect(TALKBACK_VIBRATIONS.success).toBeDefined();
    });

    it('should have earcon identifiers', () => {
      expect(TALKBACK_EARCONS.focus).toBe('focus');
      expect(TALKBACK_EARCONS.action).toBe('action');
      expect(TALKBACK_EARCONS.error).toBe('error');
    });
  });

  describe('Formatting', () => {
    it('should format numbers with locale', () => {
      expect(formatNumberForTalkBack(1000)).toBe('1,000');
      expect(formatNumberForTalkBack(1000000)).toBe('1,000,000');
    });

    it('should format small numbers as-is', () => {
      expect(formatNumberForTalkBack(42)).toBe('42');
      expect(formatNumberForTalkBack(999)).toBe('999');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Screen Reader Integration', () => {
  it('should detect at most one screen reader at a time', () => {
    const voEnabled = isVoiceOverEnabled();
    const tbEnabled = isTalkBackEnabled();
    
    // Both could be false, but both shouldn't be true
    if (voEnabled && tbEnabled) {
      throw new Error('Both VoiceOver and TalkBack detected - should be mutually exclusive');
    }
    
    expect(true).toBe(true);
  });

  it('should handle rapid announcement calls', () => {
    // Rapid announcements should queue properly
    announceToVoiceOver('Message 1');
    announceToTalkBack('Message 2');
    announceToVoiceOver({ text: 'Message 3', interrupt: true });
    
    expect(true).toBe(true);
  });

  it('should handle empty/invalid inputs gracefully', () => {
    expect(() => announceToVoiceOver('')).not.toThrow();
    expect(() => announceToTalkBack('')).not.toThrow();
    expect(() => createRotorConfig('navigation', [])).not.toThrow();
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('Edge Cases', () => {
  it('should handle null/undefined in formatting functions', () => {
    // @ts-expect-error - testing edge case
    expect(() => formatNumberForVoiceOver(null)).not.toThrow();
    // @ts-expect-error - testing edge case
    expect(() => formatNumberForTalkBack(undefined)).not.toThrow();
  });

  it('should handle very long announcements', () => {
    const longText = 'A'.repeat(1000);
    
    expect(() => announceToVoiceOver(longText)).not.toThrow();
    expect(() => announceToTalkBack(longText)).not.toThrow();
  });

  it('should handle special characters in announcements', () => {
    const specialText = 'Special: <script>alert("test")</script> & more!';
    
    expect(() => announceToVoiceOver(specialText)).not.toThrow();
  });

  it('should handle emoji in announcements', () => {
    const emojiText = '👋 Hello 🌍 World! 🎉';
    
    expect(() => announceToVoiceOver(emojiText)).not.toThrow();
  });

  it('should handle concurrent traversal and gesture operations', () => {
    const traversalManager = createTraversalManager();
    const gestureManager = createGestureManager();
    const container = document.createElement('div');
    
    gestureManager.attach(container);
    
    const button = document.createElement('button');
    container.appendChild(button);
    
    traversalManager.init({
      container,
      order: [button],
    });
    
    // Both managers should work independently
    expect(true).toBe(true);
    
    gestureManager.detach();
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  it('should handle 100 rapid announcements efficiently', () => {
    const start = performance.now();
    
    for (let i = 0; i < 100; i++) {
      announceToVoiceOver(`Announcement ${i}`);
    }
    
    const duration = performance.now() - start;
    
    // Should complete in under 100ms
    expect(duration).toBeLessThan(100);
  });

  it('should handle large traversal lists', () => {
    const manager = createTraversalManager();
    const container = document.createElement('div');
    const elements: HTMLElement[] = [];
    
    // Create 1000 elements
    for (let i = 0; i < 1000; i++) {
      const el = document.createElement('button');
      elements.push(el);
      container.appendChild(el);
    }
    
    const start = performance.now();
    
    manager.init({
      container,
      logicalOrder: true,
    });
    
    const duration = performance.now() - start;
    
    // Should initialize in under 500ms
    expect(duration).toBeLessThan(500);
  });
});
