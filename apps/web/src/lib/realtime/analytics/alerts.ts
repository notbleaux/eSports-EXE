// @ts-nocheck
/**
 * Real-time Analytics Alert System
 * 
 * Threshold-based alerts, significant event alerts,
 * prediction confidence alerts, and notification system.
 * 
 * [Ver001.000] - Real-time alert system
 * 
 * Agent: TL-S4-3-C
 * Team: Real-time Analytics (TL-S4)
 */

import type { 
  LiveMatchState, 
  LiveEvent, 
  LiveEventType,
  LivePlayerState 
} from '../types';
import type { 
  WinProbability, 
  MomentumIndicator, 
  EconomyMetrics,
  LiveAnalytics 
} from './metrics';

// =============================================================================
// Types
// =============================================================================

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export type AlertCategory = 'probability' | 'momentum' | 'economy' | 'performance' | 'event' | 'prediction';

export interface Alert {
  id: string;
  matchId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  round?: number;
  metadata: AlertMetadata;
  acknowledged: boolean;
  dismissed: boolean;
}

export interface AlertMetadata {
  threshold?: number;
  actualValue?: number;
  previousValue?: number;
  change?: number;
  players?: string[];
  teams?: string[];
  eventType?: LiveEventType;
  prediction?: string;
  confidence?: number;
}

export interface AlertThreshold {
  id: string;
  category: AlertCategory;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change_gt' | 'change_lt';
  value: number;
  severity: AlertSeverity;
  message: string;
  enabled: boolean;
  cooldown: number; // milliseconds
  lastTriggered?: number;
}

export interface AlertConfig {
  thresholds: AlertThreshold[];
  globalCooldown: number;
  maxAlerts: number;
  autoDismiss: boolean;
  dismissAfter: number; // milliseconds
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

export interface AlertFilter {
  categories?: AlertCategory[];
  severities?: AlertSeverity[];
  matchIds?: string[];
  acknowledged?: boolean;
  dismissed?: boolean;
  since?: string;
  until?: string;
}

export interface AlertStats {
  total: number;
  byCategory: Record<AlertCategory, number>;
  bySeverity: Record<AlertSeverity, number>;
  unacknowledged: number;
  criticalUnacknowledged: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type AlertHandler = (alert: Alert) => void;
export type NotificationHandler = (payload: NotificationPayload) => void;

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  thresholds: [
    // Probability alerts
    {
      id: 'prob_major_shift',
      category: 'probability',
      metric: 'winProbability',
      operator: 'change_gt',
      value: 0.15,
      severity: 'warning',
      message: 'Significant win probability shift detected',
      enabled: true,
      cooldown: 30000,
    },
    {
      id: 'prob_extreme',
      category: 'probability',
      metric: 'winProbability',
      operator: 'gt',
      value: 0.85,
      severity: 'info',
      message: 'Match outcome becoming clear',
      enabled: true,
      cooldown: 60000,
    },
    // Momentum alerts
    {
      id: 'momentum_shift',
      category: 'momentum',
      metric: 'momentum.direction',
      operator: 'change_gt',
      value: 1,
      severity: 'warning',
      message: 'Momentum has shifted',
      enabled: true,
      cooldown: 45000,
    },
    {
      id: 'momentum_strong',
      category: 'momentum',
      metric: 'momentum.strength',
      operator: 'gt',
      value: 0.8,
      severity: 'info',
      message: 'Strong momentum detected',
      enabled: true,
      cooldown: 60000,
    },
    // Economy alerts
    {
      id: 'eco_critical',
      category: 'economy',
      metric: 'economy.fullBuysRemaining',
      operator: 'lte',
      value: 1,
      severity: 'warning',
      message: 'Team approaching economic crisis',
      enabled: true,
      cooldown: 90000,
    },
    {
      id: 'eco_break',
      category: 'economy',
      metric: 'economy.team.totalCredits',
      operator: 'gt',
      value: 25000,
      severity: 'success',
      message: 'Team economy looking strong',
      enabled: true,
      cooldown: 60000,
    },
    // Performance alerts
    {
      id: 'perf_breakout',
      category: 'performance',
      metric: 'player.rating',
      operator: 'gt',
      value: 90,
      severity: 'info',
      message: 'Player having exceptional performance',
      enabled: true,
      cooldown: 60000,
    },
    {
      id: 'perf_struggle',
      category: 'performance',
      metric: 'player.rating',
      operator: 'lt',
      value: 30,
      severity: 'warning',
      message: 'Player struggling significantly',
      enabled: true,
      cooldown: 60000,
    },
    // Event alerts (always on)
    {
      id: 'event_clutch',
      category: 'event',
      metric: 'event.type',
      operator: 'eq',
      value: 1,
      severity: 'info',
      message: 'Clutch situation detected',
      enabled: true,
      cooldown: 0,
    },
    // Prediction alerts
    {
      id: 'pred_confidence_drop',
      category: 'prediction',
      metric: 'prediction.confidence',
      operator: 'change_gt',
      value: -0.2,
      severity: 'warning',
      message: 'Prediction confidence dropping',
      enabled: true,
      cooldown: 30000,
    },
    {
      id: 'pred_high_confidence',
      category: 'prediction',
      metric: 'prediction.confidence',
      operator: 'gt',
      value: 0.9,
      severity: 'success',
      message: 'High confidence prediction available',
      enabled: true,
      cooldown: 60000,
    },
  ],
  globalCooldown: 5000,
  maxAlerts: 50,
  autoDismiss: false,
  dismissAfter: 300000, // 5 minutes
  soundEnabled: true,
  notificationEnabled: true,
};

// =============================================================================
// Alert Manager Class
// =============================================================================

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private config: AlertConfig;
  private handlers: Set<AlertHandler> = new Set();
  private notificationHandler?: NotificationHandler;
  private lastGlobalTrigger = 0;
  private analyticsHistory: Map<string, LiveAnalytics[]> = new Map();
  private readonly maxHistorySize = 10;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  // ===========================================================================
  // Configuration
  // ===========================================================================

  /**
   * Update alert configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  /**
   * Add a custom threshold
   */
  addThreshold(threshold: Omit<AlertThreshold, 'lastTriggered'>): void {
    this.config.thresholds.push({ ...threshold, lastTriggered: 0 });
  }

  /**
   * Remove a threshold
   */
  removeThreshold(thresholdId: string): void {
    this.config.thresholds = this.config.thresholds.filter(t => t.id !== thresholdId);
  }

  /**
   * Enable/disable a threshold
   */
  setThresholdEnabled(thresholdId: string, enabled: boolean): void {
    const threshold = this.config.thresholds.find(t => t.id === thresholdId);
    if (threshold) {
      threshold.enabled = enabled;
    }
  }

  // ===========================================================================
  // Alert Processing
  // ===========================================================================

  /**
   * Process live analytics and generate alerts
   */
  processAnalytics(matchId: string, analytics: LiveAnalytics): Alert[] {
    const newAlerts: Alert[] = [];
    const now = Date.now();

    // Store analytics history for change detection
    this.updateHistory(matchId, analytics);
    const previousAnalytics = this.getPreviousAnalytics(matchId);

    // Check each threshold
    for (const threshold of this.config.thresholds) {
      if (!threshold.enabled) continue;
      if (!this.isCooldownExpired(threshold, now)) continue;

      const triggered = this.checkThreshold(threshold, analytics, previousAnalytics);
      
      if (triggered) {
        const alert = this.createAlert(matchId, threshold, analytics, previousAnalytics);
        this.alerts.set(alert.id, alert);
        newAlerts.push(alert);
        
        threshold.lastTriggered = now;
        this.lastGlobalTrigger = now;

        // Notify handlers
        this.notifyHandlers(alert);
        
        // Send notification if enabled
        if (this.config.notificationEnabled && threshold.severity !== 'info') {
          this.sendNotification(alert);
        }
      }
    }

    // Clean up old alerts
    this.cleanupAlerts();

    return newAlerts;
  }

  /**
   * Process a live event for alerts
   */
  processEvent(matchId: string, event: LiveEvent): Alert | null {
    const alert = this.createEventAlert(matchId, event);
    
    if (alert) {
      this.alerts.set(alert.id, alert);
      this.notifyHandlers(alert);
      
      if (this.config.notificationEnabled && alert.severity === 'critical') {
        this.sendNotification(alert);
      }
    }
    
    return alert;
  }

  // ===========================================================================
  // Alert Queries
  // ===========================================================================

  /**
   * Get all alerts
   */
  getAlerts(filter?: AlertFilter): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filter) {
      alerts = alerts.filter(a => this.matchesFilter(a, filter));
    }

    return alerts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const alerts = Array.from(this.alerts.values());
    
    const byCategory: Record<AlertCategory, number> = {
      probability: 0, momentum: 0, economy: 0, 
      performance: 0, event: 0, prediction: 0
    };
    
    const bySeverity: Record<AlertSeverity, number> = {
      critical: 0, warning: 0, info: 0, success: 0
    };

    alerts.forEach(a => {
      byCategory[a.category]++;
      bySeverity[a.severity]++;
    });

    return {
      total: alerts.length,
      byCategory,
      bySeverity,
      unacknowledged: alerts.filter(a => !a.acknowledged).length,
      criticalUnacknowledged: alerts.filter(a => !a.acknowledged && a.severity === 'critical').length,
    };
  }

  // ===========================================================================
  // Alert Actions
  // ===========================================================================

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.dismissed = true;
      return true;
    }
    return false;
  }

  /**
   * Remove an alert
   */
  removeAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts.clear();
  }

  /**
   * Acknowledge all alerts
   */
  acknowledgeAll(): void {
    this.alerts.forEach(a => a.acknowledged = true);
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Subscribe to alerts
   */
  onAlert(handler: AlertHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Set notification handler
   */
  setNotificationHandler(handler: NotificationHandler): void {
    this.notificationHandler = handler;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private updateHistory(matchId: string, analytics: LiveAnalytics): void {
    if (!this.analyticsHistory.has(matchId)) {
      this.analyticsHistory.set(matchId, []);
    }
    
    const history = this.analyticsHistory.get(matchId)!;
    history.push(analytics);
    
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  private getPreviousAnalytics(matchId: string): LiveAnalytics | undefined {
    const history = this.analyticsHistory.get(matchId);
    if (!history || history.length < 2) return undefined;
    return history[history.length - 2];
  }

  private isCooldownExpired(threshold: AlertThreshold, now: number): boolean {
    // Check global cooldown
    if (now - this.lastGlobalTrigger < this.config.globalCooldown) {
      return false;
    }
    
    // Check threshold cooldown
    if (threshold.lastTriggered && now - threshold.lastTriggered < threshold.cooldown) {
      return false;
    }
    
    return true;
  }

  private checkThreshold(
    threshold: AlertThreshold, 
    current: LiveAnalytics, 
    previous?: LiveAnalytics
  ): boolean {
    const value = this.extractMetric(current, threshold.metric);
    const previousValue = previous ? this.extractMetric(previous, threshold.metric) : undefined;

    switch (threshold.operator) {
      case 'gt':
        return value > threshold.value;
      case 'lt':
        return value < threshold.value;
      case 'gte':
        return value >= threshold.value;
      case 'lte':
        return value <= threshold.value;
      case 'eq':
        return value === threshold.value;
      case 'change_gt':
        if (previousValue === undefined) return false;
        return Math.abs(value - previousValue) > threshold.value;
      case 'change_lt':
        if (previousValue === undefined) return false;
        return (value - previousValue) < threshold.value;
      default:
        return false;
    }
  }

  private extractMetric(analytics: LiveAnalytics, metric: string): number {
    const parts = metric.split('.');
    let value: unknown = analytics;
    
    for (const part of parts) {
      if (value === null || value === undefined) return 0;
      value = (value as Record<string, unknown>)[part];
    }
    
    return typeof value === 'number' ? value : 0;
  }

  private createAlert(
    matchId: string,
    threshold: AlertThreshold,
    current: LiveAnalytics,
    previous?: LiveAnalytics
  ): Alert {
    const currentValue = this.extractMetric(current, threshold.metric);
    const previousValue = previous ? this.extractMetric(previous, threshold.metric) : undefined;
    
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId,
      category: threshold.category,
      severity: threshold.severity,
      title: this.formatAlertTitle(threshold),
      message: threshold.message,
      timestamp: new Date().toISOString(),
      metadata: {
        threshold: threshold.value,
        actualValue: currentValue,
        previousValue,
        change: previousValue !== undefined ? currentValue - previousValue : undefined,
      },
      acknowledged: false,
      dismissed: false,
    };
  }

  private createEventAlert(matchId: string, event: LiveEvent): Alert | null {
    let alert: Alert | null = null;

    switch (event.type) {
      case 'kill':
        // Check for ace or multi-kill
        // Simplified - would need round kill tracking
        break;
        
      case 'spike_plant':
        alert = {
          id: `alert_${event.id}`,
          matchId,
          category: 'event',
          severity: 'info',
          title: 'Spike Planted',
          message: 'Attackers have planted the spike',
          timestamp: event.timestamp,
          round: event.round,
          metadata: { eventType: event.type },
          acknowledged: false,
          dismissed: false,
        };
        break;
        
      case 'spike_defuse':
        alert = {
          id: `alert_${event.id}`,
          matchId,
          category: 'event',
          severity: 'success',
          title: 'Spike Defused',
          message: 'Defenders successfully defused the spike',
          timestamp: event.timestamp,
          round: event.round,
          metadata: { eventType: event.type },
          acknowledged: false,
          dismissed: false,
        };
        break;
    }

    return alert;
  }

  private formatAlertTitle(threshold: AlertThreshold): string {
    switch (threshold.severity) {
      case 'critical':
        return `Critical: ${threshold.category}`;
      case 'warning':
        return `Warning: ${threshold.category}`;
      case 'success':
        return `${threshold.category} Update`;
      default:
        return `${threshold.category} Info`;
    }
  }

  private matchesFilter(alert: Alert, filter: AlertFilter): boolean {
    if (filter.categories && !filter.categories.includes(alert.category)) return false;
    if (filter.severities && !filter.severities.includes(alert.severity)) return false;
    if (filter.matchIds && !filter.matchIds.includes(alert.matchId)) return false;
    if (filter.acknowledged !== undefined && alert.acknowledged !== filter.acknowledged) return false;
    if (filter.dismissed !== undefined && alert.dismissed !== filter.dismissed) return false;
    if (filter.since && new Date(alert.timestamp) < new Date(filter.since)) return false;
    if (filter.until && new Date(alert.timestamp) > new Date(filter.until)) return false;
    return true;
  }

  private cleanupAlerts(): void {
    if (this.alerts.size <= this.config.maxAlerts) return;

    // Remove dismissed alerts first
    for (const [id, alert] of this.alerts) {
      if (alert.dismissed) {
        this.alerts.delete(id);
      }
    }

    // If still over limit, remove oldest acknowledged alerts
    if (this.alerts.size > this.config.maxAlerts) {
      const sorted = Array.from(this.alerts.values())
        .filter(a => a.acknowledged)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const toRemove = sorted.slice(0, this.alerts.size - this.config.maxAlerts);
      toRemove.forEach(a => this.alerts.delete(a.id));
    }
  }

  private notifyHandlers(alert: Alert): void {
    this.handlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler error:', error);
      }
    });
  }

  private sendNotification(alert: Alert): void {
    if (!this.notificationHandler) return;

    const payload: NotificationPayload = {
      title: alert.title,
      body: alert.message,
      tag: alert.id,
      requireInteraction: alert.severity === 'critical',
      actions: alert.severity === 'critical' ? [
        { action: 'view', title: 'View Match' },
        { action: 'dismiss', title: 'Dismiss' },
      ] : undefined,
    };

    this.notificationHandler(payload);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultAlertManager: AlertManager | null = null;

/**
 * Get or create the default alert manager
 */
export function getAlertManager(config?: Partial<AlertConfig>): AlertManager {
  if (!defaultAlertManager) {
    defaultAlertManager = new AlertManager(config);
  }
  return defaultAlertManager;
}

/**
 * Reset the default alert manager
 */
export function resetAlertManager(): void {
  defaultAlertManager = null;
}

/**
 * Create a custom alert manager
 */
export function createAlertManager(config?: Partial<AlertConfig>): AlertManager {
  return new AlertManager(config);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get color for alert severity
 */
export function getAlertColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'warning': return '#f59e0b';
    case 'info': return '#3b82f6';
    case 'success': return '#22c55e';
    default: return '#6b7280';
  }
}

/**
 * Get icon for alert category
 */
export function getAlertIcon(category: AlertCategory): string {
  switch (category) {
    case 'probability': return 'percent';
    case 'momentum': return 'trending-up';
    case 'economy': return 'wallet';
    case 'performance': return 'activity';
    case 'event': return 'zap';
    case 'prediction': return 'target';
    default: return 'bell';
  }
}

/**
 * Format alert timestamp
 */
export function formatAlertTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

// =============================================================================
// Browser Notifications
// =============================================================================

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Check if notifications are supported and permitted
 */
export function canSendNotifications(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Show a browser notification
 */
export function showNotification(payload: NotificationPayload): void {
  if (!canSendNotifications()) return;
  
  new Notification(payload.title, {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    requireInteraction: payload.requireInteraction,
  });
}

// =============================================================================
// Exports
// =============================================================================

export default {
  AlertManager,
  getAlertManager,
  createAlertManager,
  requestNotificationPermission,
  canSendNotifications,
  showNotification,
  getAlertColor,
  getAlertIcon,
  formatAlertTime,
};
