/**
 * API Layer - Centralized API exports
 * 
 * [Ver005.000] - Fixed duplicate exports with explicit re-exports
 * [Ver004.000] - Added Cross-Reference API for AREPO hub
 * [Ver003.000] - Added ML Model Registry API
 */

export * from './types'
export * from './client'
export * from './streaming'
export * from './health'
export * from './search'
export * from './riot'
export * from './crossReference'

// ML Service API - re-export with namespace to avoid conflicts
export {
  getModels as getMLServiceModels,
  getModel as getMLServiceModel,
  downloadModel as downloadMLModel,
  predict,
  predictBatch,
  checkHealth,
  checkReady,
  mlService
} from './ml'

// ML Model Registry API - re-export with namespace to avoid conflicts
export {
  getModels as getMLRegistryModels,
  getModel as getMLRegistryModel,
  createModel as createMLRegistryModel,
  updateModel as updateMLRegistryModel,
  deleteModel as deleteMLRegistryModel,
  deployModel,
  rollbackDeployment,
  recordMetric,
  getModelMetrics,
  createABTest,
  getABTests,
  getABTest,
  startABTest,
  completeABTest,
  compareModels,
  getActiveDeployments,
  mlRegistry
} from './mlRegistry'

// Pandascore API - re-export cache functions with unique names to avoid conflicts
export {
  isPandascoreAvailable,
  fetchPlayers,
  fetchTeams,
  fetchMatches,
  fetchMatchDetails,
  fetchPlayerStats,
  transformPlayerToSator,
  getPlatformStats,
  fetchSatorPlayers,
  clearCache as clearPandascoreCache,
  clearCacheByType as clearPandascoreCacheByType,
  pandascoreApi,
  // Types
  type PandascorePlayer,
  type PandascoreTeam,
  type PandascoreMatch,
  type PandascoreStats,
  type SatorPlayer,
  type SatorStats
} from './pandascore'
