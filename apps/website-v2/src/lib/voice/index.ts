/** [Ver001.000]
 * Voice Command Library
 * 
 * Central export point for voice command functionality.
 * Includes types, command registry, and utilities.
 */

// Types
export type {
  SupportedLanguage,
  LanguageConfig,
  VoiceState,
  CommandCategory,
  VoiceCommand,
  CommandMatch,
  CommandMatchResult,
  CommandConflict,
  RecognitionResult,
  VoiceFeedbackState,
  CommandRegistry,
  VoiceCommandOptions,
  VoiceError,
  VoiceErrorCode,
  A11yAnnouncement,
  KeyboardAlternative,
  NavigationTarget,
  LensCommandConfig,
} from './types';

// Constants and registry
export {
  SUPPORTED_LANGUAGES,
  NAVIGATION_TARGETS,
  LENS_COMMANDS,
  ACTION_COMMANDS,
  SYSTEM_COMMANDS,
  voiceCommandRegistry,
  registerVoiceCommand,
  unregisterVoiceCommand,
  matchVoiceCommand,
  getVoiceCommands,
  checkCommandConflicts,
  getNavigationTargets,
  getLensCommandConfigs,
} from './commands';
