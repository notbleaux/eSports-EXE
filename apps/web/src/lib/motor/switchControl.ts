// @ts-nocheck
/**
 * [Ver001.000]
 * Switch Control Support for Motor Accessibility
 * Provides single/dual switch navigation with scanning modes
 */

export type ScanningMode = 'auto' | 'step' | 'row-column' | 'group';
export type SwitchType = 'single' | 'dual' | 'adaptive';

export interface SwitchTiming {
  /** Auto-scan interval in milliseconds */
  scanInterval: number;
  /** Delay before accepting next input */
  debounceDelay: number;
  /** Hold time required for activation */
  holdTime: number;
  /** Delay before auto-scan resumes after manual step */
  resumeDelay: number;
  /** Number of scan cycles before highlighting */
  cyclesBeforeHighlight: number;
}

export interface SwitchConfig {
  type: SwitchType;
  mode: ScanningMode;
  timing: SwitchTiming;
  audioFeedback: boolean;
  visualFeedback: boolean;
  hapticFeedback: boolean;
  wrapAround: boolean;
  skipDisabled: boolean;
}

export interface ScanTarget {
  id: string;
  element: HTMLElement;
  bounds: DOMRect;
  enabled: boolean;
  group?: string;
  priority?: number;
}

export interface ScanState {
  currentIndex: number;
  isScanning: boolean;
  lastScanTime: number;
  targets: ScanTarget[];
  activeGroup?: string;
  cycleCount: number;
}

// Default timing configurations for different user needs
export const TIMING_PRESETS = {
  beginner: {
    scanInterval: 2000,
    debounceDelay: 300,
    holdTime: 0,
    resumeDelay: 1000,
    cyclesBeforeHighlight: 1,
  },
  intermediate: {
    scanInterval: 1200,
    debounceDelay: 150,
    holdTime: 0,
    resumeDelay: 800,
    cyclesBeforeHighlight: 1,
  },
  advanced: {
    scanInterval: 600,
    debounceDelay: 100,
    holdTime: 0,
    resumeDelay: 500,
    cyclesBeforeHighlight: 2,
  },
  expert: {
    scanInterval: 300,
    debounceDelay: 50,
    holdTime: 0,
    resumeDelay: 300,
    cyclesBeforeHighlight: 3,
  },
} as const;

// Default configuration
export const DEFAULT_SWITCH_CONFIG: SwitchConfig = {
  type: 'single',
  mode: 'auto',
  timing: TIMING_PRESETS.intermediate,
  audioFeedback: true,
  visualFeedback: true,
  hapticFeedback: false,
  wrapAround: true,
  skipDisabled: true,
};

class SwitchControlManager {
  private config: SwitchConfig;
  private state: ScanState;
  private scanTimer: number | null = null;
  private listeners: Map<string, Set<(target: ScanTarget) => void>> = new Map();
  private observer: MutationObserver | null = null;
  private rootElement: HTMLElement | null = null;
  private switchPressStart: number = 0;
  private isDebouncing: boolean = false;

  constructor(config: Partial<SwitchConfig> = {}) {
    this.config = { ...DEFAULT_SWITCH_CONFIG, ...config };
    this.state = {
      currentIndex: -1,
      isScanning: false,
      lastScanTime: 0,
      targets: [],
      cycleCount: 0,
    };
  }

  /**
   * Initialize switch control on a root element
   */
  initialize(rootElement: HTMLElement): void {
    this.rootElement = rootElement;
    this.discoverTargets();
    this.setupMutationObserver();
    this.setupKeyboardListeners();
    this.setupTouchListeners();

    if (this.config.mode === 'auto') {
      this.startScanning();
    }

    this.announce('Switch control activated');
  }

  /**
   * Discover all interactive elements within the root
   */
  private discoverTargets(): void {
    if (!this.rootElement) return;

    const selector = `
      button:not([disabled]):not([aria-hidden="true"]),
      a[href]:not([aria-hidden="true"]),
      input:not([disabled]):not([type="hidden"]),
      select:not([disabled]),
      textarea:not([disabled]),
      [role="button"]:not([aria-disabled="true"]),
      [role="link"]:not([aria-disabled="true"]),
      [tabindex]:not([tabindex="-1"]):not([disabled])
    `;

    const elements = Array.from(
      this.rootElement.querySelectorAll(selector)
    ) as HTMLElement[];

    this.state.targets = elements
      .filter(el => this.isVisible(el))
      .map((el, index) => ({
        id: el.id || `switch-target-${index}`,
        element: el,
        bounds: el.getBoundingClientRect(),
        enabled: !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
        group: el.dataset.switchGroup,
        priority: parseInt(el.dataset.switchPriority || '0', 10),
      }))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Assign IDs to elements without them
    this.state.targets.forEach((target, index) => {
      if (!target.element.id) {
        target.element.id = `switch-target-${index}`;
        target.id = target.element.id;
      }
    });
  }

  /**
   * Check if an element is visible
   */
  private isVisible(element: HTMLElement): boolean {
    // Check for hidden attribute first
    if (element.hasAttribute('hidden')) return false;
    
    // Check aria-hidden
    if (element.getAttribute('aria-hidden') === 'true') return false;
    
    // Try to get computed style
    let style: CSSStyleDeclaration;
    try {
      style = window.getComputedStyle(element);
    } catch {
      // In test environments, computed style might fail
      return true;
    }

    // Check display and visibility
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check opacity
    if (style.opacity === '0') return false;

    // Check dimensions
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Setup mutation observer to detect DOM changes
   */
  private setupMutationObserver(): void {
    this.observer = new MutationObserver(() => {
      this.discoverTargets();
      if (this.state.currentIndex >= this.state.targets.length) {
        this.state.currentIndex = this.state.targets.length > 0 ? 0 : -1;
        this.highlightCurrent();
      }
    });

    if (this.rootElement) {
      this.observer.observe(this.rootElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled', 'hidden'],
      });
    }
  }

  /**
   * Setup keyboard listeners for switch input
   */
  private setupKeyboardListeners(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space or Enter acts as switch press
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.handleSwitchPress();
      }

      // Arrow keys for step mode
      if (this.config.mode === 'step') {
        if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
          e.preventDefault();
          this.stepForward();
        } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
          e.preventDefault();
          this.stepBackward();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.handleSwitchRelease();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  }

  /**
   * Setup touch/click listeners for switch input
   */
  private setupTouchListeners(): void {
    const handleTouch = (e: TouchEvent | MouseEvent) => {
      // Prevent default to avoid double-firing with click
      if (e.type === 'touchstart') {
        e.preventDefault();
      }
      this.handleSwitchPress();
    };

    const handleRelease = () => {
      this.handleSwitchRelease();
    };

    // Full-screen touch areas for switch input
    const touchArea = document.createElement('div');
    touchArea.className = 'switch-touch-area';
    touchArea.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 50%;
      height: 100%;
      z-index: 9999;
      background: transparent;
      touch-action: none;
    `;

    // Second touch area for dual switch
    if (this.config.type === 'dual') {
      const touchArea2 = touchArea.cloneNode() as HTMLDivElement;
      touchArea2.style.left = '50%';
      touchArea2.style.width = '50%';
      touchArea2.dataset.switch = 'secondary';
      document.body.appendChild(touchArea2);

      touchArea2.addEventListener('touchstart', handleTouch);
      touchArea2.addEventListener('touchend', handleRelease);
      touchArea2.addEventListener('mousedown', handleTouch);
      touchArea2.addEventListener('mouseup', handleRelease);
    }

    touchArea.dataset.switch = 'primary';
    document.body.appendChild(touchArea);

    touchArea.addEventListener('touchstart', handleTouch);
    touchArea.addEventListener('touchend', handleRelease);
    touchArea.addEventListener('mousedown', handleTouch);
    touchArea.addEventListener('mouseup', handleRelease);
  }

  /**
   * Handle switch press event
   */
  private handleSwitchPress(): void {
    if (this.isDebouncing) return;

    this.switchPressStart = Date.now();
    this.isDebouncing = true;

    // For step mode, advance to next target
    if (this.config.mode === 'step') {
      this.stepForward();
      this.scheduleDebounceReset();
      return;
    }

    // For hold-based activation
    if (this.config.timing.holdTime > 0) {
      this.scheduleHoldActivation();
    } else {
      // Immediate activation
      this.activateCurrent();
      this.scheduleDebounceReset();
    }
  }

  /**
   * Handle switch release event
   */
  private handleSwitchRelease(): void {
    if (this.config.timing.holdTime > 0) {
      const holdDuration = Date.now() - this.switchPressStart;
      if (holdDuration >= this.config.timing.holdTime) {
        this.activateCurrent();
      }
    }
    this.scheduleDebounceReset();
  }

  /**
   * Schedule debounce reset
   */
  private scheduleDebounceReset(): void {
    setTimeout(() => {
      this.isDebouncing = false;
    }, this.config.timing.debounceDelay);
  }

  /**
   * Schedule hold-based activation
   */
  private scheduleHoldActivation(): void {
    setTimeout(() => {
      if (Date.now() - this.switchPressStart >= this.config.timing.holdTime) {
        this.activateCurrent();
      }
    }, this.config.timing.holdTime);
  }

  /**
   * Start auto-scanning
   */
  startScanning(): void {
    if (this.scanTimer) return;

    this.state.isScanning = true;
    this.scanTimer = window.setInterval(() => {
      this.scanNext();
    }, this.config.timing.scanInterval);
  }

  /**
   * Stop auto-scanning
   */
  stopScanning(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    this.state.isScanning = false;
  }

  /**
   * Scan to next target
   */
  private scanNext(): void {
    if (this.state.targets.length === 0) return;

    let nextIndex = this.state.currentIndex + 1;

    // Wrap around if enabled
    if (nextIndex >= this.state.targets.length) {
      if (this.config.wrapAround) {
        nextIndex = 0;
        this.state.cycleCount++;
      } else {
        this.stopScanning();
        return;
      }
    }

    // Skip disabled targets if configured
    if (this.config.skipDisabled) {
      while (
        nextIndex < this.state.targets.length &&
        !this.state.targets[nextIndex].enabled
      ) {
        nextIndex++;
        if (nextIndex >= this.state.targets.length) {
          if (this.config.wrapAround) {
            nextIndex = 0;
          } else {
            this.stopScanning();
            return;
          }
        }
      }
    }

    this.state.currentIndex = nextIndex;
    this.state.lastScanTime = Date.now();
    this.highlightCurrent();
  }

  /**
   * Step forward one target
   */
  stepForward(): void {
    this.stopScanning();
    this.scanNext();

    // Resume auto-scan after delay if in auto mode
    if (this.config.mode === 'auto') {
      setTimeout(() => {
        this.startScanning();
      }, this.config.timing.resumeDelay);
    }
  }

  /**
   * Step backward one target
   */
  stepBackward(): void {
    this.stopScanning();

    if (this.state.targets.length === 0) return;

    let prevIndex = this.state.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.config.wrapAround ? this.state.targets.length - 1 : 0;
    }

    this.state.currentIndex = prevIndex;
    this.highlightCurrent();
  }

  /**
   * Highlight current target
   */
  private highlightCurrent(): void {
    // Remove previous highlights
    this.state.targets.forEach(target => {
      target.element.classList.remove('switch-highlight');
      target.element.removeAttribute('data-switch-active');
    });

    const current = this.state.targets[this.state.currentIndex];
    if (current && current.enabled) {
      current.element.classList.add('switch-highlight');
      current.element.setAttribute('data-switch-active', 'true');

      // Scroll into view
      current.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      // Provide feedback
      this.provideFeedback('scan', current);

      // Emit event
      this.emit('highlight', current);
    }
  }

  /**
   * Activate current target
   */
  private activateCurrent(): void {
    const current = this.state.targets[this.state.currentIndex];
    if (current && current.enabled) {
      this.provideFeedback('activate', current);
      this.emit('activate', current);

      // Simulate click or focus
      if (
        current.element.tagName === 'BUTTON' ||
        current.element.tagName === 'A' ||
        current.element.getAttribute('role') === 'button'
      ) {
        current.element.click();
      } else {
        current.element.focus();
      }
    }
  }

  /**
   * Provide multi-modal feedback
   */
  private provideFeedback(type: 'scan' | 'activate', target: ScanTarget): void {
    // Visual feedback
    if (this.config.visualFeedback) {
      const event = new CustomEvent('switchFeedback', {
        detail: { type, target },
      });
      document.dispatchEvent(event);
    }

    // Audio feedback
    if (this.config.audioFeedback) {
      const utterance = new SpeechSynthesisUtterance(
        type === 'scan'
          ? this.getElementLabel(target.element)
          : 'Activated'
      );
      utterance.rate = 1.5;
      speechSynthesis.speak(utterance);
    }

    // Haptic feedback
    if (this.config.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(type === 'activate' ? [50, 100, 50] : 30);
    }
  }

  /**
   * Get accessible label for element
   */
  private getElementLabel(element: HTMLElement): string {
    return (
      element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      element.textContent?.trim() ||
      'Interactive element'
    );
  }

  /**
   * Announce message to screen reader
   */
  private announce(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (target: ScanTarget) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, target: ScanTarget): void {
    this.listeners.get(event)?.forEach(callback => callback(target));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SwitchConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart scanning with new timing
    if (this.state.isScanning) {
      this.stopScanning();
      this.startScanning();
    }
  }

  /**
   * Get current state
   */
  getState(): ScanState {
    return { ...this.state };
  }

  /**
   * Get current configuration
   */
  getConfig(): SwitchConfig {
    return { ...this.config };
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.stopScanning();
    this.observer?.disconnect();

    // Remove touch areas
    document.querySelectorAll('.switch-touch-area').forEach(el => el.remove());

    // Remove highlights
    this.state.targets.forEach(target => {
      target.element.classList.remove('switch-highlight');
      target.element.removeAttribute('data-switch-active');
    });

    this.listeners.clear();
  }
}

// Export singleton instance
export const switchControl = new SwitchControlManager();

// React hook for switch control
export function useSwitchControl(config?: Partial<SwitchConfig>) {
  return {
    initialize: (root: HTMLElement) => {
      const manager = new SwitchControlManager(config);
      manager.initialize(root);
      return manager;
    },
    presets: TIMING_PRESETS,
    defaultConfig: DEFAULT_SWITCH_CONFIG,
  };
}

export default SwitchControlManager;
