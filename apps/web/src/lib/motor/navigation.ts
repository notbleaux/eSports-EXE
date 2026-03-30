/**
 * [Ver001.000]
 * Navigation Schemes for Motor Accessibility
 * Linear, directional, and hierarchical navigation patterns
 */

// ScanTarget type available in switchControl if needed

export type NavigationMode = 'linear' | 'directional' | 'hierarchical' | 'spatial';

export interface NavigationConfig {
  mode: NavigationMode;
  /** Allow wrapping from last to first */
  wrapAround: boolean;
  /** Skip hidden elements */
  skipHidden: boolean;
  /** Skip disabled elements */
  skipDisabled: boolean;
  /** Group by container */
  groupByContainer: boolean;
  /** Custom sort function */
  sortFunction?: (a: HTMLElement, b: HTMLElement) => number;
}

export interface NavigationNode {
  element: HTMLElement;
  id: string;
  parent: NavigationNode | null;
  children: NavigationNode[];
  siblings: NavigationNode[];
  level: number;
  bounds: DOMRect;
  enabled: boolean;
  metadata: {
    role?: string;
    label?: string;
    group?: string;
    priority?: number;
  };
}

export interface SpatialPosition {
  x: number;
  y: number;
  element: HTMLElement;
}

export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = {
  mode: 'linear',
  wrapAround: true,
  skipHidden: true,
  skipDisabled: true,
  groupByContainer: false,
};

// ============================================
// Linear Navigation
// ============================================

export class LinearNavigation {
  private nodes: NavigationNode[] = [];
  private currentIndex: number = -1;
  private config: NavigationConfig;

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config, mode: 'linear' };
  }

  /**
   * Build linear navigation from root element
   */
  build(root: HTMLElement): void {
    const interactiveElements = this.getInteractiveElements(root);
    
    this.nodes = interactiveElements.map((el, index) => ({
      element: el,
      id: el.id || `nav-node-${index}`,
      parent: null,
      children: [],
      siblings: [],
      level: 0,
      bounds: el.getBoundingClientRect(),
      enabled: this.isEnabled(el),
      metadata: {
        role: el.getAttribute('role') || undefined,
        label: el.getAttribute('aria-label') || el.textContent?.trim() || undefined,
        group: el.dataset.navGroup || undefined,
        priority: parseInt(el.dataset.navPriority || '0', 10),
      },
    }));

    // Build sibling relationships
    this.nodes.forEach((node, i) => {
      node.siblings = this.nodes.filter((_, idx) => idx !== i);
    });

    // Sort by DOM order or custom function
    if (this.config.sortFunction) {
      this.nodes.sort((a, b) => this.config.sortFunction!(a.element, b.element));
    } else {
      // Sort by visual position (top-to-bottom, left-to-right)
      this.nodes.sort((a, b) => {
        const verticalDiff = a.bounds.top - b.bounds.top;
        if (Math.abs(verticalDiff) > 10) return verticalDiff;
        return a.bounds.left - b.bounds.left;
      });
    }
  }

  /**
   * Navigate to next element
   */
  next(): NavigationNode | null {
    if (this.nodes.length === 0) return null;

    let nextIndex = this.currentIndex + 1;

    if (nextIndex >= this.nodes.length) {
      if (this.config.wrapAround) {
        nextIndex = 0;
      } else {
        return null;
      }
    }

    // Skip disabled/hidden if configured
    if (this.config.skipDisabled || this.config.skipHidden) {
      const startIndex = nextIndex;
      while (
        (this.config.skipDisabled && !this.nodes[nextIndex].enabled) ||
        (this.config.skipHidden && !this.isVisible(this.nodes[nextIndex].element))
      ) {
        nextIndex++;
        if (nextIndex >= this.nodes.length) {
          if (this.config.wrapAround) {
            nextIndex = 0;
          } else {
            return null;
          }
        }
        if (nextIndex === startIndex) {
          return null; // No valid target found
        }
      }
    }

    this.currentIndex = nextIndex;
    return this.nodes[this.currentIndex];
  }

  /**
   * Navigate to previous element
   */
  previous(): NavigationNode | null {
    if (this.nodes.length === 0) return null;

    let prevIndex = this.currentIndex - 1;

    if (prevIndex < 0) {
      if (this.config.wrapAround) {
        prevIndex = this.nodes.length - 1;
      } else {
        return null;
      }
    }

    // Skip disabled/hidden if configured
    if (this.config.skipDisabled || this.config.skipHidden) {
      const startIndex = prevIndex;
      while (
        (this.config.skipDisabled && !this.nodes[prevIndex].enabled) ||
        (this.config.skipHidden && !this.isVisible(this.nodes[prevIndex].element))
      ) {
        prevIndex--;
        if (prevIndex < 0) {
          if (this.config.wrapAround) {
            prevIndex = this.nodes.length - 1;
          } else {
            return null;
          }
        }
        if (prevIndex === startIndex) {
          return null;
        }
      }
    }

    this.currentIndex = prevIndex;
    return this.nodes[this.currentIndex];
  }

  /**
   * Navigate to specific element
   */
  goTo(id: string): NavigationNode | null {
    const index = this.nodes.findIndex((n) => n.id === id);
    if (index >= 0) {
      this.currentIndex = index;
      return this.nodes[index];
    }
    return null;
  }

  /**
   * Get current node
   */
  getCurrent(): NavigationNode | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.nodes.length) {
      return this.nodes[this.currentIndex];
    }
    return null;
  }

  /**
   * Get all nodes
   */
  getNodes(): NavigationNode[] {
    return [...this.nodes];
  }

  private getInteractiveElements(root: HTMLElement): HTMLElement[] {
    const selector = `
      button:not([disabled]):not([aria-hidden="true"]),
      a[href]:not([aria-hidden="true"]),
      input:not([disabled]):not([type="hidden"]),
      select:not([disabled]),
      textarea:not([disabled]),
      [role="button"]:not([aria-disabled="true"]),
      [role="link"]:not([aria-disabled="true"]),
      [tabindex]:not([tabindex="-1"]):not([disabled]),
      [data-nav-focus="true"]
    `;

    return Array.from(root.querySelectorAll(selector));
  }

  private isEnabled(element: HTMLElement): boolean {
    return (
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-disabled') !== 'true'
    );
  }

  private isVisible(element: HTMLElement): boolean {
    if (element.hasAttribute('hidden')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    
    let style: CSSStyleDeclaration;
    try {
      style = window.getComputedStyle(element);
    } catch {
      return true;
    }
    
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;
    
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
}

// ============================================
// Directional Navigation
// ============================================

export class DirectionalNavigation {
  private nodes: NavigationNode[] = [];
  private currentNode: NavigationNode | null = null;
  private config: NavigationConfig;

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config, mode: 'directional' };
  }

  /**
   * Build directional navigation
   */
  build(root: HTMLElement): void {
    const interactiveElements = this.getInteractiveElements(root);
    
    this.nodes = interactiveElements.map((el, index) => ({
      element: el,
      id: el.id || `nav-node-${index}`,
      parent: null,
      children: [],
      siblings: [],
      level: 0,
      bounds: el.getBoundingClientRect(),
      enabled: this.isEnabled(el),
      metadata: {
        role: el.getAttribute('role') || undefined,
        label: el.getAttribute('aria-label') || el.textContent?.trim() || undefined,
      },
    }));
  }

  /**
   * Navigate in a direction
   */
  navigate(direction: 'up' | 'down' | 'left' | 'right'): NavigationNode | null {
    if (!this.currentNode) {
      // Start at first visible node
      this.currentNode = this.nodes.find((n) => this.isVisible(n.element)) || null;
      return this.currentNode;
    }

    const currentCenter = {
      x: this.currentNode.bounds.left + this.currentNode.bounds.width / 2,
      y: this.currentNode.bounds.top + this.currentNode.bounds.height / 2,
    };

    // Find best candidate in direction
    let bestNode: NavigationNode | null = null;
    let bestScore = -Infinity;

    this.nodes.forEach((node) => {
      if (node === this.currentNode) return;
      if (this.config.skipDisabled && !node.enabled) return;
      if (this.config.skipHidden && !this.isVisible(node.element)) return;

      const nodeCenter = {
        x: node.bounds.left + node.bounds.width / 2,
        y: node.bounds.top + node.bounds.height / 2,
      };

      const dx = nodeCenter.x - currentCenter.x;
      const dy = nodeCenter.y - currentCenter.y;

      // Check if in correct direction
      let inDirection = false;
      let distance = 0;

      switch (direction) {
        case 'up':
          inDirection = dy < -20;
          distance = Math.sqrt(dx * dx + dy * dy);
          break;
        case 'down':
          inDirection = dy > 20;
          distance = Math.sqrt(dx * dx + dy * dy);
          break;
        case 'left':
          inDirection = dx < -20;
          distance = Math.sqrt(dx * dx + dy * dy);
          break;
        case 'right':
          inDirection = dx > 20;
          distance = Math.sqrt(dx * dx + dy * dy);
          break;
      }

      if (inDirection && distance > 0) {
        // Score based on alignment and distance
        // Prefer elements that are more directly in the direction
        const alignment = direction === 'left' || direction === 'right'
          ? 1 - Math.abs(dy) / distance
          : 1 - Math.abs(dx) / distance;
        
        const score = alignment * 1000 - distance;

        if (score > bestScore) {
          bestScore = score;
          bestNode = node;
        }
      }
    });

    if (bestNode) {
      this.currentNode = bestNode;
    }

    return this.currentNode;
  }

  /**
   * Set current node
   */
  setCurrent(nodeId: string): NavigationNode | null {
    const findNode = (node: NavigationNode): NavigationNode | null => {
      if (node.id === nodeId) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };

    if (this.root) {
      const node = findNode(this.root);
      if (node) {
        this.currentNode = node;
      }
    }
    return this.currentNode;
  }

  /**
   * Get current node
   */
  getCurrent(): NavigationNode | null {
    return this.currentNode;
  }

  private getInteractiveElements(root: HTMLElement): HTMLElement[] {
    const selector = `
      button:not([disabled]):not([aria-hidden="true"]),
      a[href]:not([aria-hidden="true"]),
      input:not([disabled]):not([type="hidden"]),
      select:not([disabled]),
      textarea:not([disabled]),
      [role="button"]:not([aria-disabled="true"]),
      [role="link"]:not([aria-disabled="true"]),
      [tabindex]:not([tabindex="-1"]):not([disabled]),
      [data-nav-focus="true"]
    `;

    return Array.from(root.querySelectorAll(selector));
  }

  private isEnabled(element: HTMLElement): boolean {
    return (
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-disabled') !== 'true'
    );
  }

  private isVisible(element: HTMLElement): boolean {
    if (element.hasAttribute('hidden')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    
    let style: CSSStyleDeclaration;
    try {
      style = window.getComputedStyle(element);
    } catch {
      return true;
    }
    
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;
    
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
}

// ============================================
// Hierarchical Navigation
// ============================================

export class HierarchicalNavigation {
  private root: NavigationNode | null = null;
  private currentNode: NavigationNode | null = null;
  private nodeMap: Map<string, NavigationNode> = new Map();
  private config: NavigationConfig;

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config, mode: 'hierarchical' };
  }

  /**
   * Build hierarchical navigation tree
   */
  build(root: HTMLElement): void {
    this.root = this.buildNode(root, null, 0);
    if (this.root) {
      this.currentNode = this.findFirstEnabled(this.root);
    }
  }

  private buildNode(element: HTMLElement, parent: NavigationNode | null, level: number): NavigationNode | null {
    // Check if element is interactive
    const isInteractive = this.isInteractive(element);
    
    const node: NavigationNode = {
      element,
      id: element.id || `nav-node-${this.nodeMap.size}`,
      parent,
      children: [],
      siblings: [],
      level,
      bounds: element.getBoundingClientRect(),
      enabled: this.isEnabled(element),
      metadata: {
        role: element.getAttribute('role') || undefined,
        label: element.getAttribute('aria-label') || element.textContent?.trim() || undefined,
      },
    };

    // Assign ID if missing
    if (!element.id) {
      element.id = node.id;
    }

    this.nodeMap.set(node.id, node);

    // Build children
    const childElements = Array.from(element.children) as HTMLElement[];
    for (const childEl of childElements) {
      const childNode = this.buildNode(childEl, node, level + 1);
      if (childNode) {
        node.children.push(childNode);
      }
    }

    // Build sibling relationships among children
    node.children.forEach((child, i) => {
      child.siblings = node.children.filter((_, idx) => idx !== i);
    });

    return isInteractive || node.children.length > 0 ? node : null;
  }

  /**
   * Navigate into current node's children
   */
  drillIn(): NavigationNode | null {
    if (!this.currentNode) return null;

    const firstChild = this.currentNode.children.find((c) => c.enabled);
    if (firstChild) {
      this.currentNode = firstChild;
    }

    return this.currentNode;
  }

  /**
   * Navigate to parent
   */
  drillOut(): NavigationNode | null {
    if (!this.currentNode?.parent) return null;

    this.currentNode = this.currentNode.parent;
    return this.currentNode;
  }

  /**
   * Navigate to next sibling
   */
  nextSibling(): NavigationNode | null {
    if (!this.currentNode?.parent) {
      // Root level - treat as linear
      return null;
    }

    const siblings = this.currentNode.parent.children;
    const currentIndex = siblings.indexOf(this.currentNode);
    
    for (let i = currentIndex + 1; i < siblings.length; i++) {
      if (siblings[i].enabled) {
        this.currentNode = siblings[i];
        return this.currentNode;
      }
    }

    // Wrap around
    if (this.config.wrapAround) {
      for (let i = 0; i < currentIndex; i++) {
        if (siblings[i].enabled) {
          this.currentNode = siblings[i];
          return this.currentNode;
        }
      }
    }

    return this.currentNode;
  }

  /**
   * Navigate to previous sibling
   */
  previousSibling(): NavigationNode | null {
    if (!this.currentNode?.parent) return null;

    const siblings = this.currentNode.parent.children;
    const currentIndex = siblings.indexOf(this.currentNode);
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (siblings[i].enabled) {
        this.currentNode = siblings[i];
        return this.currentNode;
      }
    }

    // Wrap around
    if (this.config.wrapAround) {
      for (let i = siblings.length - 1; i > currentIndex; i--) {
        if (siblings[i].enabled) {
          this.currentNode = siblings[i];
          return this.currentNode;
        }
      }
    }

    return this.currentNode;
  }

  /**
   * Get current node
   */
  getCurrent(): NavigationNode | null {
    return this.currentNode;
  }

  /**
   * Get breadcrumb path to current node
   */
  getBreadcrumb(): NavigationNode[] {
    const path: NavigationNode[] = [];
    let node = this.currentNode;

    while (node) {
      path.unshift(node);
      node = node.parent;
    }

    return path;
  }

  private isInteractive(element: HTMLElement): boolean {
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];
    const role = element.getAttribute('role');
    const tabIndex = element.getAttribute('tabindex');

    return (
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.tagName === 'INPUT' ||
      element.tagName === 'SELECT' ||
      element.tagName === 'TEXTAREA' ||
      interactiveRoles.includes(role || '') ||
      (tabIndex !== null && tabIndex !== '-1')
    );
  }

  private isEnabled(element: HTMLElement): boolean {
    return (
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-disabled') !== 'true'
    );
  }

  private findFirstEnabled(node: NavigationNode): NavigationNode | null {
    if (node.enabled) return node;
    
    for (const child of node.children) {
      const found = this.findFirstEnabled(child);
      if (found) return found;
    }

    return null;
  }
}

// ============================================
// Navigation Controller
// ============================================

export class NavigationController {
  private linear: LinearNavigation;
  private directional: DirectionalNavigation;
  private hierarchical: HierarchicalNavigation;
  private currentMode: NavigationMode = 'linear';
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(config: Partial<NavigationConfig> = {}) {
    this.linear = new LinearNavigation(config);
    this.directional = new DirectionalNavigation(config);
    this.hierarchical = new HierarchicalNavigation(config);
  }

  /**
   * Initialize navigation on root element
   */
  initialize(root: HTMLElement, mode: NavigationMode = 'linear'): void {
    this.currentMode = mode;
    this.linear.build(root);
    this.directional.build(root);
    this.hierarchical.build(root);
  }

  /**
   * Navigate based on current mode
   */
  navigate(action: 'next' | 'previous' | 'up' | 'down' | 'left' | 'right' | 'in' | 'out'): NavigationNode | null {
    let result: NavigationNode | null = null;

    switch (this.currentMode) {
      case 'linear':
        if (action === 'next') result = this.linear.next();
        else if (action === 'previous') result = this.linear.previous();
        break;
      case 'directional':
        if (['up', 'down', 'left', 'right'].includes(action)) {
          result = this.directional.navigate(action as 'up' | 'down' | 'left' | 'right');
        }
        break;
      case 'hierarchical':
        if (action === 'next') result = this.hierarchical.nextSibling();
        else if (action === 'previous') result = this.hierarchical.previousSibling();
        else if (action === 'in') result = this.hierarchical.drillIn();
        else if (action === 'out') result = this.hierarchical.drillOut();
        break;
    }

    if (result) {
      this.emit('navigate', { node: result, action, mode: this.currentMode });
    }

    return result;
  }

  /**
   * Set navigation mode
   */
  setMode(mode: NavigationMode): void {
    this.currentMode = mode;
    this.emit('modeChange', mode);
  }

  /**
   * Get current mode
   */
  getMode(): NavigationMode {
    return this.currentMode;
  }

  /**
   * Get current node
   */
  getCurrent(): NavigationNode | null {
    switch (this.currentMode) {
      case 'linear':
        return this.linear.getCurrent();
      case 'directional':
        return this.directional.getCurrent();
      case 'hierarchical':
        return this.hierarchical.getCurrent();
      default:
        return null;
    }
  }

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((callback) => callback(...args));
  }
}

// Export
export const navigation = new NavigationController();

export function useNavigation(config?: Partial<NavigationConfig>) {
  return {
    navigation: new NavigationController(config),
    LinearNavigation,
    DirectionalNavigation,
    HierarchicalNavigation,
    defaultConfig: DEFAULT_NAVIGATION_CONFIG,
  };
}

export default NavigationController;
