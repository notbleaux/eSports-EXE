// @ts-nocheck
/**
 * Real-time System - Live Match Data Streaming
 * 
 * Comprehensive real-time data system for live match streaming.
 * 
 * [Ver001.000] - Real-time system exports
 */

// Connection
export { LiveConnectionManager, getConnectionManager, destroyConnectionManager, resetConnectionManagers } from './connection';
export type {
  ConnectionState,
  ConnectionQuality,
  ConnectionMetrics,
  ConnectionConfig,
  ConnectionEventMap,
} from './connection';

// Message Handler
export { LiveMessageHandler, createTopic, parseTopic, isSignificantEvent, getEventPriority } from './messageHandler';
export type {
  ParsedMessage,
  RouteResult,
  ValidationResult,
  MessageHandlerCallback,
  HandlerRegistry,
} from './messageHandler';

// Store
export {
  useRealtimeStore,
  selectMatch,
  selectSelectedMatch,
  selectActiveMatchIds,
  selectMatchEvents,
  selectLatestEvents,
  selectSubscriptionsForTopic,
  selectConnectionStatus,
  resetRealtimeStore,
  exportStoreState,
  importStoreState,
} from './store';

// Subscriptions
export {
  SubscriptionManager,
  getSubscriptionManager,
  resetSubscriptionManager,
  createFilter,
  createTopic as createSubscriptionTopic,
  combineFilters,
  mergeFilters,
} from './subscriptions';
export type {
  SubscriptionCallback,
  SubscriptionRegistration,
  SubscriptionStats,
  SubscriptionOptions,
} from './subscriptions';

// Types
export type {
  LiveEventType,
  LiveEvent,
  LiveEventData,
  KillEventData,
  RoundEventData,
  EconomyEventData,
  ScoreEventData,
  MatchEventData,
  AbilityEventData,
  DamageEventData,
  PlayerEventData,
  LiveMatchState,
  LiveTeamState,
  LivePlayerState,
  AbilityState,
  SubscriptionTopic,
  SubscriptionFilter,
  Subscription,
  LiveMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  RealtimeStoreState,
  RealtimeStoreActions,
  RealtimeStore,
  UseLiveMatchOptions,
  UseLiveMatchReturn,
  EventHandler,
  EventHandlers,
  HistoricalBuffer,
  RealtimeErrorCode,
  RealtimeError,
} from './types';

// Analytics
export {
  calculateWinProbability,
  calculateEconomyMetrics,
  calculatePerformanceRatings,
  calculateMomentum,
  calculateLiveAnalytics,
  formatProbability,
  formatEconomy,
  getProbabilityColor,
  getMomentumColor,
  AlertManager,
  getAlertManager,
  createAlertManager,
  detectPatterns,
  detectAnomalies,
  enrichContext,
  generateProjections,
  performHistoricalComparison,
} from './analytics';

export type {
  WinProbability,
  ProbabilityFactor,
  EconomyMetrics,
  TeamEconomyMetrics,
  PerformanceRating,
  TeamPerformance,
  MomentumIndicator,
  LiveAnalytics,
  KeyMoment,
  AnalyticsPrediction,
  Alert,
  AlertSeverity,
  AlertCategory,
  HistoricalMatch,
  PatternMatch,
  AnomalyDetection,
  HistoricalComparison,
} from './analytics';

// Re-export from hooks
export {
  useLiveMatch,
  useLiveEvents,
  useLiveScore,
  useLiveConnectionStatus,
  useLiveMatches,
} from '../../hooks/useLiveMatch';
