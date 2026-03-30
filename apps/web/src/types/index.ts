/** [Ver001.000]
 * TypeScript Type Definitions Index — NJZiteGeisTe Platform
 * 
 * Comprehensive TypeScript coverage for all API contracts.
 * These types are aligned with FastAPI Pydantic schemas.
 * 
 * @module types
 */

// ============================================================================
// Re-exports from canonical schema source of truth
// ============================================================================

export type {
  // GameNodeID types
  SupportedGame,
  QuarterKey,
  TeZeTRoute,
  QuarterGrid,
  QuarterConfig,
  GameQuarterVariant,
  TeZeTBranch,
  BaseGameNodeID,
  GameNodeIDValorant,
  GameNodeIDCS2,
  GameNodeID,
  WorldPort,
  TeZeT,
  TeZeTContentType,
  ValorantEconomy,
  CS2Economy,
  isValorantNode,
  isCS2Node,
} from '@njz/types';

export type {
  // TeneT Protocol types
  TrustLevel,
  DataSourceType,
  DATA_SOURCE_TRUST,
  ConfidenceScore,
  ConfidenceSourceContribution,
  VerificationStatus,
  TenetVerificationResult,
  ManualReviewRecord,
  PathALiveEvent,
  LiveEventType,
  MatchScorePayload,
  RoundUpdatePayload,
  MatchEndPayload,
  PathBLegacyRecord,
  LegacyRoundRecord,
  LegacyRoundPlayerStat,
  EconomyLogEntry,
  TeamEconomyState,
  MinimapFrame,
  PlayerPositionSnapshot,
  VideoReviewGrade,
  ITenetKeyLinksService,
  TenetVerificationRequest,
  SourceDataPayload,
  TenetDirectoryEntry,
  DataTierRequirement,
} from '@njz/types';

export type {
  // Live data types
  WebSocketStatus,
  WebSocketState,
  LiveMatchView,
  LiveMatchStatus,
  LiveTeamView,
  LivePlayerStats,
  LiveRoundSummary,
  LiveEconomySnapshot,
  LiveTeamEconomy,
  WsMessage,
  WsMessageType,
  WsMatchStartMessage,
  WsScoreUpdateMessage,
  WsRoundEndMessage,
  WsPlayerStatsMessage,
  WsEconomyMessage,
  WsMatchEndMessage,
  WsHeartbeatMessage,
} from '@njz/types';

export type {
  // Legacy data types
  PaginatedResponse,
  ApiResponse,
  VerifiedMatchSummary,
  MatchTeamRef,
  VerifiedMatchDetail,
  VerifiedRoundRecord,
  VerifiedRoundPlayerStat,
  VerifiedEconomyEntry,
  VerifiedTeamEconomy,
  PlayerMatchPerformance,
  PlayerSeasonStats,
  TournamentRecord,
  SimRatingEntry,
} from '@njz/types';

// ============================================================================
// Animation Types
// ============================================================================

export type {
  HubId,
  HubTheme,
  HubThemes,
  CubicBezier,
  EasingFunction,
  EasingPresets,
  EasingName,
  AnimationDuration,
  AnimationConfig,
  SpringConfig,
  ViscousSpringConfig,
  TransitionVariant,
  TransitionConfig,
  StaggerConfig,
  ScrollRevealOptions,
  ScrollRevealState,
  GlassCardProps,
  GlassCardStyleConfig,
  ButtonVariant,
  ButtonSize,
  LoadingState,
  GlowButtonProps,
  RippleEffect,
  SizeState,
  FluidResizeOptions,
  FluidResizeState,
  ReducedMotionState,
  AnimationAccessibility,
  MotionVariants,
  ContainerVariants,
  GPUAcceleratedProperty,
  GPUAccelerationConfig,
  AnimationPhase,
  AnimationEvent,
  AnimationEventHandler,
} from './animation';

// ============================================================================
// ML Types
// ============================================================================

export type {
  PredictionResult,
  StreamData,
  BatchPredictionResult,
  ModelInfo,
  ModelMetadata,
  LoadedModel,
  ModelComparison as MLModelComparison,
  LoadOptions,
  WarmUpOptions,
  UseMLInferenceOptions,
  CircuitBreakerConfig,
  CircuitBreakerState,
  StreamingMetrics,
  UseStreamingInferenceOptions,
  UseStreamingInferenceReturn,
  PredictionEvent,
  ModelLoadEvent,
  MLError,
  LatencyDistribution,
  ModelMetrics,
  AnalyticsReport,
  VariantConfig,
  ABTestConfig,
  ABTestStats,
  DateRange,
  FilterOptions,
  MLValidationError,
  MLTimeoutError,
  MLCircuitBreakerError,
} from './ml';

// ============================================================================
// ML Registry Types
// ============================================================================

export type {
  ModelStatus,
  ModelType,
  ModelFramework,
  QuantizationType,
  MLModel,
  MLModelCreate,
  MLModelUpdate,
  MLModelListResponse,
  MetricName,
  MetricUnit,
  Environment,
  ModelMetric,
  ModelMetricCreate,
  ModelMetricsHistory,
  DeploymentStatus,
  DeploymentType,
  DeploymentEnvironment,
  Deployment,
  DeploymentCreate,
  ActiveDeployment,
  ABTestStatus,
  ABTest,
  ABTestCreate,
  ABTestResult,
  ModelComparison,
  ModelRegistryState,
  ModelRegistryFilters,
  ModelVersionLineage,
  MetricChartData,
  ModelComparisonChartData,
  ModelRegistryApiError,
} from './mlRegistry';

// ============================================================================
// Performance Types
// ============================================================================

export type {
  FPSMetrics,
  MemoryMetrics,
  PerformanceAlert,
  WarningLevel,
  PerformanceConfig,
} from './performance';

export { DEFAULT_PERFORMANCE_CONFIG } from './performance';

// ============================================================================
// Worker Types
// ============================================================================

export type {
  WorkerType,
  WorkerMessage,
  WorkerResponse,
  WorkerStatus,
  WorkerState,
  MLWorkerCommand,
  MLWorkerResponse,
  MLPredictionProgress,
  MLBatchResult,
  MLModelConfig,
  MLInferencePayload,
  MLBatchPayload,
  MLPredictionResult,
  MLWorkerState,
  GridCell,
  GridColumn,
  GridRow,
  GridViewport,
  GridRenderCommand,
  GridRenderResult,
  GridInitPayload,
  GridRenderPayload,
  GridScrollPayload,
  GridResizePayload,
  GridVisibleRange,
  WorkerPoolConfig,
  WorkerTask,
  WorkerInstance,
  WorkerStatusInfo,
  SimRatingComponents,
  SimRatingPayload,
  SimRatingResult as WorkerSimRatingResult,
  RARComponents,
  RARPayload,
  RARResult as WorkerRARResult,
  AggregationPayload,
  BatchSimRatingPayload,
  BatchSimRatingResult,
} from './worker';

// ============================================================================
// API Types (aligned with FastAPI Pydantic schemas)
// ============================================================================

export * from './api';

// ============================================================================
// Type Guards
// ============================================================================

export * from './guards';
