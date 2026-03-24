/** [Ver001.000]
 * Voice Command Types
 * 
 * Type definitions for the voice command navigation system.
 * Supports multi-language voice commands with accessibility focus.
 */

// ============================================================================
// Supported Languages
// ============================================================================

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'jp';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  localName: string;
  speechRecognitionCode: string;
  isRTL: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', localName: 'English', speechRecognitionCode: 'en-US', isRTL: false },
  { code: 'es', name: 'Spanish', localName: 'Español', speechRecognitionCode: 'es-ES', isRTL: false },
  { code: 'fr', name: 'French', localName: 'Français', speechRecognitionCode: 'fr-FR', isRTL: false },
  { code: 'de', name: 'German', localName: 'Deutsch', speechRecognitionCode: 'de-DE', isRTL: false },
  { code: 'jp', name: 'Japanese', localName: '日本語', speechRecognitionCode: 'ja-JP', isRTL: false },
];

// ============================================================================
// Voice States
// ============================================================================

export type VoiceState = 
  | 'inactive'      // Voice recognition not active
  | 'listening'     // Actively listening for commands
  | 'processing'    // Processing speech input
  | 'success'       // Command successfully executed
  | 'error'         // Error occurred
  | 'unsupported';  // Browser doesn't support speech recognition

// ============================================================================
// Command Types
// ============================================================================

export type CommandCategory = 
  | 'navigation'  // Navigate to different pages/sections
  | 'action'      // Perform actions (search, help, etc.)
  | 'lens'        // Control lens/visualization features
  | 'system';     // System commands (language, settings)

export interface VoiceCommand {
  /** Unique command identifier */
  id: string;
  /** Command category */
  category: CommandCategory;
  /** Primary English phrase */
  phrase: string;
  /** Translations for supported languages */
  translations: Record<SupportedLanguage, string[]>;
  /** Command description for help */
  description: string;
  /** Whether this command requires confirmation */
  requiresConfirmation?: boolean;
  /** Command priority (higher = checked first) */
  priority: number;
  /** Associated keyboard shortcut (for accessibility) */
  keyboardShortcut?: string;
}

// ============================================================================
// Command Match Result
// ============================================================================

export interface CommandMatch {
  /** Matched command */
  command: VoiceCommand;
  /** Confidence score (0-1) */
  confidence: number;
  /** Original transcript */
  transcript: string;
  /** Extracted parameters */
  parameters?: Record<string, string>;
}

export interface CommandMatchResult {
  /** Whether a command was matched */
  matched: boolean;
  /** Match details if found */
  match?: CommandMatch;
  /** All potential matches sorted by confidence */
  candidates?: CommandMatch[];
  /** Error message if matching failed */
  error?: string;
}

// ============================================================================
// Recognition Result
// ============================================================================

export interface RecognitionResult {
  /** Transcribed text */
  transcript: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether this is a final result */
  isFinal: boolean;
  /** Timestamp of recognition */
  timestamp: number;
  /** Language detected/used */
  language: SupportedLanguage;
}

// ============================================================================
// Voice Feedback State
// ============================================================================

export interface VoiceFeedbackState {
  /** Current voice state */
  state: VoiceState;
  /** Last recognition result */
  lastResult?: RecognitionResult;
  /** Current transcript (interim or final) */
  transcript: string;
  /** Current confidence level */
  confidence: number;
  /** Error message if any */
  error?: string;
  /** Suggested commands based on partial input */
  suggestions: VoiceCommand[];
  /** Whether microphone permission is granted */
  hasPermission: boolean | null;
  /** Currently selected language */
  language: SupportedLanguage;
}

// ============================================================================
// Command Registry
// ============================================================================

export interface CommandRegistry {
  /** Register a new command */
  register: (command: VoiceCommand) => void;
  /** Unregister a command by ID */
  unregister: (commandId: string) => void;
  /** Find matching command for transcript */
  match: (transcript: string, language: SupportedLanguage) => CommandMatchResult;
  /** Get all registered commands */
  getCommands: (category?: CommandCategory) => VoiceCommand[];
  /** Check for command conflicts */
  checkConflicts: () => CommandConflict[];
}

export interface CommandConflict {
  /** Conflicting command IDs */
  commandIds: string[];
  /** Shared phrases causing conflict */
  sharedPhrases: string[];
  /** Conflict severity */
  severity: 'low' | 'medium' | 'high';
}

// ============================================================================
// Voice Options
// ============================================================================

export interface VoiceCommandOptions {
  /** Language for recognition */
  language?: SupportedLanguage;
  /** Confidence threshold (0-1) */
  confidenceThreshold?: number;
  /** Whether to enable continuous listening */
  continuous?: boolean;
  /** Whether to show interim results */
  interimResults?: boolean;
  /** Maximum listening duration (ms) */
  maxListeningDuration?: number;
  /** Auto-restart on error */
  autoRestart?: boolean;
  /** Callback when command is recognized */
  onCommand?: (match: CommandMatch) => void;
  /** Callback on state change */
  onStateChange?: (state: VoiceState) => void;
  /** Callback on error */
  onError?: (error: VoiceError) => void;
}

// ============================================================================
// Voice Errors
// ============================================================================

export type VoiceErrorCode = 
  | 'not-supported'
  | 'permission-denied'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'unknown';

export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
  recoverable: boolean;
}

// ============================================================================
// Accessibility
// ============================================================================

export interface A11yAnnouncement {
  /** Announcement message */
  message: string;
  /** Priority level */
  priority: 'polite' | 'assertive';
  /** Unique ID for the announcement */
  id: string;
}

export interface KeyboardAlternative {
  /** Command ID this alternative is for */
  commandId: string;
  /** Keyboard shortcut */
  shortcut: string;
  /** Description of the action */
  description: string;
  /** Whether this requires modifier keys */
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
}

// ============================================================================
// Navigation Targets (from Knowledge Graph)
// ============================================================================

export interface NavigationTarget {
  /** Route path */
  path: string;
  /** Display name */
  name: string;
  /** Voice phrases that navigate here */
  voicePhrases: Record<SupportedLanguage, string[]>;
  /** Associated hub ID */
  hubId?: 'hub-1' | 'hub-2' | 'hub-3' | 'hub-4' | 'hub-5';
}

// ============================================================================
// Lens Commands (from Lens Framework)
// ============================================================================

export interface LensCommandConfig {
  /** Lens ID */
  lensId: string;
  /** Action to perform */
  action: 'toggle' | 'enable' | 'disable' | 'show' | 'hide';
  /** Voice phrases for this lens action */
  phrases: Record<SupportedLanguage, string[]>;
}
