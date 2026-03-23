/**
 * Real-time Analytics Module
 * 
 * Comprehensive real-time analytics for live match data including:
 * - Win probability calculations
 * - Economy tracking and projections
 * - Performance ratings
 * - Momentum indicators
 * - Historical comparisons
 * - Pattern matching
 * - Anomaly detection
 * - Alert system
 * 
 * [Ver001.000] - Analytics module exports
 * 
 * Agent: TL-S4-3-C
 * Team: Real-time Analytics (TL-S4)
 */

// Metrics
export {
  calculateWinProbability,
  calculateEconomyMetrics,
  calculatePerformanceRatings,
  calculateMomentum,
  calculateLiveAnalytics,
  detectKeyMoments,
  generatePredictions,
  formatProbability,
  formatEconomy,
  getProbabilityColor,
  getMomentumColor,
  DEFAULT_METRICS_CONFIG,
} from './metrics';

export type {
  WinProbability,
  ProbabilityFactor,
  EconomyMetrics,
  TeamEconomyMetrics,
  PerformanceRating,
  TeamPerformance,
  MomentumIndicator,
  RoundTrend,
  MomentumFactor,
  LiveAnalytics,
  KeyMoment,
  AnalyticsPrediction,
  RealtimeMetricsConfig,
} from './metrics';

// Alerts
export {
  AlertManager,
  getAlertManager,
  createAlertManager,
  resetAlertManager,
  requestNotificationPermission,
  canSendNotifications,
  showNotification,
  getAlertColor,
  getAlertIcon,
  formatAlertTime,
  DEFAULT_ALERT_CONFIG,
} from './alerts';

export type {
  Alert,
  AlertSeverity,
  AlertCategory,
  AlertMetadata,
  AlertThreshold,
  AlertConfig,
  AlertFilter,
  AlertStats,
  NotificationPayload,
  NotificationAction,
  AlertHandler,
  NotificationHandler,
} from './alerts';

// Historical
export {
  detectPatterns,
  detectAnomalies,
  enrichContext,
  generateProjections,
  performHistoricalComparison,
} from './historical';

export type {
  HistoricalMatch,
  HistoricalRound,
  PatternMatch,
  MatchPattern,
  PatternCriteria,
  PatternPrediction,
  AnomalyDetection,
  Anomaly,
  ContextEnrichment,
  SimilarMatch,
  TeamHistory,
  TeamHistoricalStats,
  HeadToHeadStats,
  PlayerContext,
  PlayerHistoricalStats,
  StatComparison,
  MapContext,
  TournamentContext,
  HistoricalComparison,
  MatchProjection,
  HistoricalInsight,
} from './historical';

// Default export
export { default } from './metrics';
