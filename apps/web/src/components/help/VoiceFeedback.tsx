/** [Ver001.000]
 * VoiceFeedback Component
 * 
 * Visual feedback component for voice command system.
 * Provides accessible UI for voice state, transcript display, and suggested commands.
 * Includes full keyboard alternatives and screen reader support.
 * 
 * Features:
 * - Visual state indicators (listening, processing, success, error)
 * - Transcript display with confidence visualization
 * - Suggested commands
 * - Microphone permission UI
 * - Keyboard-only fallback
 * - Screen reader announcements
 * - Reduced motion support
 * 
 * @example
 * ```tsx
 * <VoiceFeedback 
 *   state={feedbackState}
 *   onStartListening={startListening}
 *   onStopListening={stopListening}
 *   onCommandSelect={handleCommand}
 * />
 * ```
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { 
  VoiceState, 
  VoiceFeedbackState, 
  VoiceCommand,
  SupportedLanguage,
} from '@/lib/voice/types';
import { SUPPORTED_LANGUAGES, getVoiceCommands } from '@/lib/voice/commands';

// ============================================================================
// Types
// ============================================================================

export interface VoiceFeedbackProps {
  /** Voice feedback state from useVoiceCommand hook */
  state: VoiceFeedbackState;
  /** Callback to start listening */
  onStartListening: () => void;
  /** Callback to stop listening */
  onStopListening: () => void;
  /** Callback when a command is selected (from suggestions) */
  onCommandSelect?: (command: VoiceCommand) => void;
  /** Callback when language changes */
  onLanguageChange?: (lang: SupportedLanguage) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the help panel */
  showHelp?: boolean;
  /** Whether reduced motion is preferred */
  reducedMotion?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
}

export interface VoiceMicButtonProps {
  /** Current voice state */
  state: VoiceState;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Reduced motion preference */
  reducedMotion?: boolean;
}

export interface VoiceTranscriptProps {
  /** Current transcript text */
  transcript: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether this is an interim result */
  isInterim?: boolean;
  /** Reduced motion preference */
  reducedMotion?: boolean;
}

export interface VoiceSuggestionsProps {
  /** Suggested commands */
  suggestions: VoiceCommand[];
  /** Callback when a suggestion is selected */
  onSelect: (command: VoiceCommand) => void;
  /** Reduced motion preference */
  reducedMotion?: boolean;
}

export interface VoicePermissionPromptProps {
  /** Whether permission is currently denied */
  permissionDenied?: boolean;
  /** Callback to request permission */
  onRequestPermission: () => void;
  /** Callback to dismiss */
  onDismiss: () => void;
}

// ============================================================================
// Utility Components
// ============================================================================

/**
 * Microphone Icon SVG
 */
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

/**
 * Stop Icon SVG
 */
const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

/**
 * Error Icon SVG
 */
const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

/**
 * Check Icon SVG
 */
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Keyboard Icon SVG
 */
const KeyboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01" />
    <path d="M10 8h.01" />
    <path d="M14 8h.01" />
    <path d="M18 8h.01" />
    <path d="M8 12h.01" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
    <path d="M7 16h10" />
  </svg>
);

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * VoiceMicButton - Microphone button with state-based styling
 */
export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  state,
  disabled = false,
  onClick,
  className,
  reducedMotion = false,
}) => {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const isInactive = state === 'inactive' || state === 'unsupported';

  const getAriaLabel = () => {
    if (isListening) return 'Stop voice listening. Press to stop.';
    if (isProcessing) return 'Processing voice command. Please wait.';
    if (isSuccess) return 'Voice command successful. Press to start listening again.';
    if (isError) return 'Voice command error. Press to try again.';
    if (state === 'unsupported') return 'Voice commands not supported in this browser.';
    return 'Start voice listening. Press Space or Enter to activate.';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isProcessing || state === 'unsupported'}
      className={cn(
        'relative flex items-center justify-center',
        'w-14 h-14 rounded-full',
        'transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // State-based styling
        isInactive && [
          'bg-gray-100 dark:bg-gray-800',
          'text-gray-600 dark:text-gray-400',
          'hover:bg-gray-200 dark:hover:bg-gray-700',
          'focus:ring-gray-400',
        ],
        isListening && [
          'bg-red-500 text-white',
          'hover:bg-red-600',
          'focus:ring-red-400',
          !reducedMotion && 'animate-pulse',
        ],
        isProcessing && [
          'bg-yellow-500 text-white',
          'focus:ring-yellow-400',
        ],
        isSuccess && [
          'bg-green-500 text-white',
          'hover:bg-green-600',
          'focus:ring-green-400',
        ],
        isError && [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'focus:ring-red-500',
        ],
        className
      )}
      aria-label={getAriaLabel()}
      aria-pressed={isListening}
    >
      {isListening ? (
        <StopIcon className="w-6 h-6" />
      ) : isSuccess ? (
        <CheckIcon className="w-6 h-6" />
      ) : isError ? (
        <ErrorIcon className="w-6 h-6" />
      ) : (
        <MicIcon className="w-6 h-6" />
      )}
      
      {/* Listening indicator ring */}
      {isListening && !reducedMotion && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30" />
      )}
    </button>
  );
};

/**
 * VoiceTranscript - Display transcript with confidence indicator
 */
export const VoiceTranscript: React.FC<VoiceTranscriptProps> = ({
  transcript,
  confidence,
  isInterim = false,
  reducedMotion = false,
}) => {
  if (!transcript) return null;

  const confidencePercent = Math.round(confidence * 100);
  const confidenceColor = confidence >= 0.8 
    ? 'bg-green-500' 
    : confidence >= 0.6 
      ? 'bg-yellow-500' 
      : 'bg-red-500';

  return (
    <div 
      className={cn(
        'p-3 rounded-lg border',
        'bg-white dark:bg-gray-800',
        'border-gray-200 dark:border-gray-700',
        isInterim && 'opacity-70'
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {isInterim ? 'Listening...' : 'Recognized'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {confidencePercent}% confidence
        </span>
      </div>
      
      <p className="text-lg font-medium text-gray-900 dark:text-white">
        &ldquo;{transcript}&rdquo;
      </p>
      
      {/* Confidence bar */}
      <div 
        className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={confidencePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence: ${confidencePercent}%`}
      >
        <div 
          className={cn(
            'h-full transition-all duration-300',
            confidenceColor,
            !reducedMotion && 'transition-all'
          )}
          style={{ width: `${confidencePercent}%` }}
        />
      </div>
    </div>
  );
};

/**
 * VoiceSuggestions - Display suggested commands
 */
export const VoiceSuggestions: React.FC<VoiceSuggestionsProps> = ({
  suggestions,
  onSelect,
  reducedMotion = false,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Suggested Commands
      </h4>
      <ul 
        className="space-y-1"
        role="listbox"
        aria-label="Suggested voice commands"
      >
        {suggestions.map((command, index) => (
          <li key={command.id}>
            <button
              type="button"
              onClick={() => onSelect(command)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md',
                'text-sm text-gray-700 dark:text-gray-300',
                'bg-gray-50 dark:bg-gray-700/50',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'transition-colors duration-150',
                !reducedMotion && 'transition-all'
              )}
              role="option"
              aria-selected={index === 0}
            >
              <span className="font-medium">{command.phrase}</span>
              <span className="text-gray-400 dark:text-gray-500 ml-2">
                — {command.description}
              </span>
              {command.keyboardShortcut && (
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                  {command.keyboardShortcut}
                </kbd>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * VoicePermissionPrompt - Request microphone permission
 */
export const VoicePermissionPrompt: React.FC<VoicePermissionPromptProps> = ({
  permissionDenied = false,
  onRequestPermission,
  onDismiss,
}) => (
  <div 
    className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
    role="alert"
    aria-live="polite"
  >
    <div className="flex items-start gap-3">
      <ErrorIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
          {permissionDenied ? 'Microphone Access Denied' : 'Microphone Access Needed'}
        </h4>
        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
          {permissionDenied 
            ? 'Voice commands require microphone access. Please enable it in your browser settings and try again.'
            : 'To use voice commands, please allow microphone access when prompted.'
          }
        </p>
        <div className="mt-3 flex gap-2">
          {!permissionDenied && (
            <button
              type="button"
              onClick={onRequestPermission}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium',
                'bg-yellow-600 text-white',
                'hover:bg-yellow-700',
                'focus:outline-none focus:ring-2 focus:ring-yellow-500'
              )}
            >
              Allow Microphone
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium',
              'text-yellow-700 dark:text-yellow-300',
              'hover:bg-yellow-100 dark:hover:bg-yellow-800',
              'focus:outline-none focus:ring-2 focus:ring-yellow-500'
            )}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * VoiceHelpPanel - Display available commands
 */
export const VoiceHelpPanel: React.FC<{
  onClose: () => void;
  reducedMotion?: boolean;
}> = ({ onClose, reducedMotion: _reducedMotion }) => {
  const commands = getVoiceCommands();
  const categories = ['navigation', 'action', 'lens', 'system'] as const;
  
  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    action: 'Actions',
    lens: 'Visualization',
    system: 'System',
  };

  return (
    <div 
      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      role="dialog"
      aria-label="Voice Commands Help"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Voice Commands
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close help panel"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto">
        {categories.map(category => {
          const categoryCommands = commands.filter(cmd => cmd.category === category);
          if (categoryCommands.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {categoryLabels[category]}
              </h4>
              <ul className="space-y-1.5">
                {categoryCommands.slice(0, 6).map(command => (
                  <li 
                    key={command.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      &ldquo;{command.phrase}&rdquo;
                    </span>
                    {command.keyboardShortcut && (
                      <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                        {command.keyboardShortcut}
                      </kbd>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">?</kbd> to show this help
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({
  state,
  onStartListening,
  onStopListening,
  onCommandSelect,
  onLanguageChange,
  className,
  showHelp = true,
  reducedMotion = false,
  'data-testid': testId,
}) => {
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space to toggle listening (when not typing in input)
      if (e.code === 'Space' && !e.repeat && !isTypingElement(e.target)) {
        e.preventDefault();
        if (state.state === 'listening') {
          onStopListening();
        } else {
          onStartListening();
        }
      }

      // ? to toggle help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !isTypingElement(e.target)) {
        setShowHelpPanel(prev => !prev);
      }

      // Escape to stop listening or close help
      if (e.key === 'Escape') {
        if (state.state === 'listening') {
          onStopListening();
        }
        setShowHelpPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.state, onStartListening, onStopListening]);

  // Check if target is a typing element
  const isTypingElement = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return target.tagName === 'INPUT' || 
           target.tagName === 'TEXTAREA' || 
           target.isContentEditable;
  };

  // Handle mic button click
  const handleMicClick = useCallback(() => {
    if (state.state === 'listening') {
      onStopListening();
    } else if (state.hasPermission === false) {
      setShowPermissionPrompt(true);
    } else {
      onStartListening();
    }
  }, [state.state, state.hasPermission, onStartListening, onStopListening]);

  // Handle command selection from suggestions
  const handleCommandSelect = useCallback((command: VoiceCommand) => {
    onCommandSelect?.(command);
    onStopListening();
  }, [onCommandSelect, onStopListening]);

  // Handle language change
  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as SupportedLanguage;
    onLanguageChange?.(lang);
  }, [onLanguageChange]);

  const isListening = state.state === 'listening';

  return (
    <div 
      ref={containerRef}
      className={cn(
        'w-full max-w-md',
        'bg-gray-50 dark:bg-gray-900',
        'rounded-xl border border-gray-200 dark:border-gray-700',
        'p-4 space-y-4',
        className
      )}
      data-testid={testId}
      role="region"
      aria-label="Voice Command Interface"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VoiceMicButton
            state={state.state}
            onClick={handleMicClick}
            reducedMotion={reducedMotion}
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Voice Commands
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {state.state === 'listening' 
                ? 'Listening... Press Space to stop'
                : state.state === 'unsupported'
                  ? 'Not supported in this browser'
                  : 'Press Space to start'
              }
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <select
          value={state.language}
          onChange={handleLanguageChange}
          className={cn(
            'text-sm rounded-md border',
            'border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800',
            'text-gray-700 dark:text-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'py-1 px-2'
          )}
          aria-label="Select voice recognition language"
        >
          {SUPPORTED_LANGUAGES.map((lang: typeof SUPPORTED_LANGUAGES[0]) => (
            <option key={lang.code} value={lang.code}>
              {lang.localName}
            </option>
          ))}
        </select>
      </div>

      {/* Permission Prompt */}
      {showPermissionPrompt && (
        <VoicePermissionPrompt
          permissionDenied={state.hasPermission === false}
          onRequestPermission={() => {
            setShowPermissionPrompt(false);
            onStartListening();
          }}
          onDismiss={() => setShowPermissionPrompt(false)}
        />
      )}

      {/* Error Message */}
      {state.error && !showPermissionPrompt && (
        <div 
          className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      )}

      {/* Transcript */}
      {(state.transcript || state.state === 'listening') && (
        <VoiceTranscript
          transcript={state.transcript}
          confidence={state.confidence}
          isInterim={state.state === 'listening' || state.state === 'processing'}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Suggestions */}
      {state.suggestions.length > 0 && isListening && (
        <VoiceSuggestions
          suggestions={state.suggestions}
          onSelect={handleCommandSelect}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Help Panel */}
      {showHelp && showHelpPanel && (
        <VoiceHelpPanel 
          onClose={() => setShowHelpPanel(false)}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Keyboard Fallback Notice */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <KeyboardIcon className="w-4 h-4" />
        <span>
          Keyboard shortcuts available. Press <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">?</kbd> for help
        </span>
      </div>

      {/* Screen reader only status */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Voice command state: {state.state}
        {state.transcript && `. Transcript: ${state.transcript}`}
        {state.error && `. Error: ${state.error}`}
      </div>
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default VoiceFeedback;
