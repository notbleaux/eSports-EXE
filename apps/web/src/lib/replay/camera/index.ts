/**
 * Camera Director System Exports
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-C
 * Team: Replay 2.0 Core (TL-S2)
 */

// Action Detection
export {
  ActionDetectionEngine,
  createActionDetectionEngine,
  DETECTION_CONFIG,
  calculateActionPriority,
  mergeOverlappingActions,
} from './actionDetection';
export type {
  ActionType,
  ActionImportance,
  DetectedAction,
  KillChain,
  ClutchSituation,
} from './actionDetection';

// Camera Modes
export {
  BaseCamera,
  FreeCamera,
  FollowCamera,
  OrbitCamera,
  CinematicCamera,
  createCameraFactory,
  CAMERA_SETTINGS,
  DEFAULT_FOLLOW_CONFIG,
  DEFAULT_ORBIT_CONFIG,
} from './modes';
export type {
  CameraMode,
  CameraState,
  CameraBounds,
  CameraTransition,
  EasingFunction,
  CameraConfig,
  FreeCameraInput,
  FollowCameraConfig,
  OrbitCameraConfig,
  CinematicShot,
  CinematicSequence,
  CameraModeFactory,
} from './modes';

// Camera Director
export {
  CameraDirector,
  createCameraDirector,
  generateHighlightSchedule,
  analyzeCameraCoverage,
  DEFAULT_DIRECTOR_CONFIG,
} from './director';
export type {
  DirectorMode,
  DirectorConfig,
  SceneComposition,
  CameraDecision,
  DramaScore,
} from './director';

// Path Recording
export {
  PathRecorder,
  PathBuilder,
  PathPlayer,
  PathStorage,
  interpolatePathState,
  DEFAULT_OPTIMIZATION_OPTIONS,
} from './pathRecording';
export type {
  PathKeyframe,
  CameraPath,
  PathRecordingSession,
  PathSample,
  PathPlaybackState,
  PathOptimizationOptions,
} from './pathRecording';

// Default export
export { default } from './director';
