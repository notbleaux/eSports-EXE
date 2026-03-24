/**
 * [Ver001.000]
 * Motor Accessibility Module - Main Export
 * Switch control, eye tracking, alternative input, and navigation
 */

// Switch Control
export {
  SwitchControlManager,
  switchControl,
  useSwitchControl,
  TIMING_PRESETS,
  DEFAULT_SWITCH_CONFIG,
} from './switchControl';
export type {
  ScanningMode,
  SwitchType,
  SwitchTiming,
  SwitchConfig,
  ScanTarget,
  ScanState,
} from './switchControl';

// Eye Tracking
export {
  EyeTrackingManager,
  eyeTracking,
  useEyeTracking,
  DEFAULT_CALIBRATION_POINTS,
  DEFAULT_EYE_TRACKING_CONFIG,
} from './eyeTracking';
export type {
  GazePoint,
  CalibrationPoint,
  EyeTrackingConfig,
  DwellTarget,
  CalibrationStatus,
  EyeTrackingStatus,
} from './eyeTracking';

// Alternative Input
export {
  HeadTrackingManager,
  SipPuffManager,
  GamepadManager,
  headTracking,
  sipPuff,
  gamepad,
  useAlternativeInput,
  DEFAULT_HEAD_TRACKING_CONFIG,
  DEFAULT_SIP_PUFF_CONFIG,
  DEFAULT_GAMEPAD_CONFIG,
} from './alternativeInput';
export type {
  HeadTrackingConfig,
  HeadPosition,
  SipPuffAction,
  SipPuffPattern,
  SipPuffConfig,
  SipPuffEvent,
  GamepadConfig,
  GamepadState,
} from './alternativeInput';

// Navigation
export {
  NavigationController,
  LinearNavigation,
  DirectionalNavigation,
  HierarchicalNavigation,
  navigation,
  useNavigation,
  DEFAULT_NAVIGATION_CONFIG,
} from './navigation';
export type {
  NavigationMode,
  NavigationConfig,
  NavigationNode,
  SpatialPosition,
} from './navigation';
