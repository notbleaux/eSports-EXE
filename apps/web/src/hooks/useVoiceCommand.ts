// @ts-nocheck
/** [Ver001.000]
 * useVoiceCommand Hook
 * 
 * React hook for voice command navigation using Web Speech API.
 * Features multi-language support, confidence thresholds, and comprehensive error handling.
 * 
 * @example
 * ```tsx
 * const { 
 *   state, 
 *   transcript, 
 *   startListening, 
 *   stopListening,
 *   lastCommand 
 * } = useVoiceCommand({
 *   language: 'en',
 *   onCommand: (match) => console.log('Command:', match),
 * });
 * ```
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { createLogger } from '@/utils/logger';
import type {
  VoiceState,
  SupportedLanguage,
  VoiceCommandOptions,
  CommandMatch,
  RecognitionResult,
  VoiceError,
  VoiceErrorCode,
  VoiceFeedbackState,
} from '@/lib/voice/types';
import { 
  voiceCommandRegistry, 
  matchVoiceCommand,
  SUPPORTED_LANGUAGES,
} from '@/lib/voice/commands';

// ============================================================================
// Types
// ============================================================================

export interface UseVoiceCommandOptions extends VoiceCommandOptions {
  /** Whether voice is enabled (can be disabled for testing/accessibility) */
  enabled?: boolean;
  /** Announce to screen readers on state change */
  announceToScreenReader?: boolean;
}

export interface UseVoiceCommandReturn {
  /** Current voice state */
  state: VoiceState;
  /** Current transcript (interim or final) */
  transcript: string;
  /** Confidence score of last recognition (0-1) */
  confidence: number;
  /** Last successfully executed command */
  lastCommand: CommandMatch | null;
  /** Whether microphone permission is granted */
  hasPermission: boolean | null;
  /** Whether speech recognition is supported */
  isSupported: boolean;
  /** Current language setting */
  language: SupportedLanguage;
  /** Available languages */
  availableLanguages: typeof SUPPORTED_LANGUAGES;
  /** Start listening for voice commands */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Toggle listening state */
  toggleListening: () => void;
  /** Change language */
  setLanguage: (lang: SupportedLanguage) => void;
  /** Reset state */
  reset: () => void;
  /** Current error if any */
  error: VoiceError | null;
  /** Whether voice is currently processing */
  isProcessing: boolean;
  /** Suggested commands based on partial input */
  suggestions: CommandMatch[];
  /** Full feedback state for UI components */
  feedbackState: VoiceFeedbackState;
  /** Manually process a command (for keyboard fallback) */
  processCommand: (transcript: string) => CommandMatch | null;
}

// ============================================================================
// Web Speech API Types
// ============================================================================

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Speech Recognition is supported
 */
function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition) !== undefined;
}

/**
 * Create Speech Recognition instance
 */
function createSpeechRecognition(): SpeechRecognition | null {
  if (!isSpeechRecognitionSupported()) return null;
  
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  return new SpeechRecognitionAPI();
}

/**
 * Get language code for speech recognition
 */
function getSpeechRecognitionCode(lang: SupportedLanguage): string {
  const config = SUPPORTED_LANGUAGES.find(l => l.code === lang);
  return config?.speechRecognitionCode || 'en-US';
}

/**
 * Create voice error from speech recognition error
 */
function createVoiceError(errorCode: string): VoiceError {
  const errorMap: Record<string, { code: VoiceErrorCode; message: string; recoverable: boolean }> = {
    'no-speech': {
      code: 'no-speech',
      message: 'No speech was detected. Please try again.',
      recoverable: true,
    },
    'audio-capture': {
      code: 'audio-capture',
      message: 'No microphone was found or microphone is not working.',
      recoverable: false,
    },
    'not-allowed': {
      code: 'permission-denied',
      message: 'Microphone permission was denied. Please allow microphone access.',
      recoverable: true,
    },
    'network': {
      code: 'network',
      message: 'Network error occurred. Please check your connection.',
      recoverable: true,
    },
    'aborted': {
      code: 'aborted',
      message: 'Speech recognition was aborted.',
      recoverable: true,
    },
  };

  const mapped = errorMap[errorCode];
  if (mapped) return mapped;

  return {
    code: 'unknown',
    message: `An unknown error occurred: ${errorCode}`,
    recoverable: false,
  };
}

/**
 * Announce to screen reader
 */
function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return;

  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

// ============================================================================
// Hook Implementation
// ============================================================================

const DEFAULT_OPTIONS: Required<UseVoiceCommandOptions> = {
  language: 'en',
  confidenceThreshold: 0.6,
  continuous: false,
  interimResults: true,
  maxListeningDuration: 30000,
  autoRestart: false,
  enabled: true,
  announceToScreenReader: true,
  onCommand: () => {},
  onStateChange: () => {},
  onError: () => {},
};

export function useVoiceCommand(
  options: UseVoiceCommandOptions = {}
): UseVoiceCommandReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State
  const [state, setState] = useState<VoiceState>('inactive');
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState<CommandMatch | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [language, setLanguageState] = useState<SupportedLanguage>(opts.language);
  const [error, setError] = useState<VoiceError | null>(null);
  const [suggestions, setSuggestions] = useState<CommandMatch[]>([]);
  const [isSupported, setIsSupported] = useState(true);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);

  // Check support on mount
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setIsSupported(supported);
    if (!supported) {
      setState('unsupported');
      opts.onStateChange?.('unsupported');
    }
  }, []);

  // Update language when prop changes
  useEffect(() => {
    if (options.language && options.language !== language) {
      setLanguageState(options.language);
    }
  }, [options.language]);

  // Update recognition instance when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getSpeechRecognitionCode(language);
    }
  }, [language]);

  /**
   * Create and configure speech recognition
   */
  const createRecognition = useCallback((): SpeechRecognition | null => {
    const recognition = createSpeechRecognition();
    if (!recognition) return null;

    recognition.continuous = opts.continuous;
    recognition.interimResults = opts.interimResults;
    recognition.lang = getSpeechRecognitionCode(language);
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('listening');
      setError(null);
      isListeningRef.current = true;
      opts.onStateChange?.('listening');
      
      if (opts.announceToScreenReader) {
        announceToScreenReader('Voice listening started. Speak now.', 'polite');
      }

      // Set timeout for max listening duration
      if (opts.maxListeningDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, opts.maxListeningDuration);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      
      for (let i = event.resultIndex; i < results.length; i++) {
        const result = results[i];
        const alternative = result[0];
        
        const recognitionResult: RecognitionResult = {
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          isFinal: result.isFinal,
          timestamp: Date.now(),
          language,
        };

        setTranscript(recognitionResult.transcript);
        setConfidence(recognitionResult.confidence);

        if (result.isFinal) {
          setState('processing');
          opts.onStateChange?.('processing');
          
          // Match command
          const matchResult = matchVoiceCommand(recognitionResult.transcript, language);
          
          if (matchResult.candidates) {
            setSuggestions(matchResult.candidates);
          }

          if (matchResult.matched && matchResult.match) {
            const matchedCommand = matchResult.match;
            
            // Check confidence threshold
            if (matchedCommand.confidence >= opts.confidenceThreshold) {
              setLastCommand(matchedCommand);
              setState('success');
              opts.onStateChange?.('success');
              opts.onCommand?.(matchedCommand);
              
              if (opts.announceToScreenReader) {
                announceToScreenReader(
                  `Command recognized: ${matchedCommand.command.description}`,
                  'polite'
                );
              }
            } else {
              setState('error');
              setError({
                code: 'unknown',
                message: 'Command confidence too low. Please try again.',
                recoverable: true,
              });
              opts.onStateChange?.('error');
            }
          } else {
            setState('error');
            setError({
              code: 'unknown',
              message: 'Command not recognized. Say "help" for available commands.',
              recoverable: true,
            });
            opts.onStateChange?.('error');
          }

          // Clear timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          // Stop listening if not continuous
          if (!opts.continuous) {
            stopListening();
          }
        } else {
          // Show suggestions for interim results
          const matchResult = matchVoiceCommand(recognitionResult.transcript, language);
          if (matchResult.candidates && matchResult.candidates.length > 0) {
            setSuggestions(matchResult.candidates.slice(0, 3));
          }
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const voiceError = createVoiceError(event.error);
      setError(voiceError);
      setState('error');
      opts.onStateChange?.('error');
      opts.onError?.(voiceError);

      if (event.error === 'not-allowed') {
        setHasPermission(false);
      }

      if (opts.announceToScreenReader) {
        announceToScreenReader(`Voice error: ${voiceError.message}`, 'assertive');
      }

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      isListeningRef.current = false;
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      
      // Auto-restart if configured and no error
      if (opts.autoRestart && state !== 'error' && opts.enabled) {
        setTimeout(() => {
          if (!isListeningRef.current) {
            recognition.start();
          }
        }, 100);
      } else if (state !== 'success' && state !== 'error') {
        setState('inactive');
        opts.onStateChange?.('inactive');
      }
    };

    return recognition;
  }, [language, opts.confidenceThreshold, opts.continuous, opts.interimResults, opts.maxListeningDuration, opts.autoRestart, opts.enabled, opts.announceToScreenReader]);

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(() => {
    if (!opts.enabled || !isSupported) return;

    // Reset state
    setTranscript('');
    setConfidence(0);
    setError(null);
    setSuggestions([]);

    // Create new recognition instance
    recognitionRef.current = createRecognition();
    
    if (!recognitionRef.current) {
      setState('unsupported');
      opts.onStateChange?.('unsupported');
      return;
    }

    try {
      recognitionRef.current.start();
      setHasPermission(true);
    } catch (err) {
      logger.error('Failed to start recognition', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError({
        code: 'unknown',
        message: 'Failed to start voice recognition.',
        recoverable: true,
      });
      setState('error');
      opts.onStateChange?.('error');
    }
  }, [opts.enabled, isSupported, createRecognition]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
    }

    isListeningRef.current = false;
    
    if (state === 'listening' || state === 'processing') {
      setState('inactive');
      opts.onStateChange?.('inactive');
    }
  }, [state]);

  /**
   * Toggle listening state
   */
  const toggleListening = useCallback(() => {
    if (isListeningRef.current || state === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [state, startListening, stopListening]);

  /**
   * Set language
   */
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    
    // Restart recognition if active
    if (isListeningRef.current) {
      stopListening();
      setTimeout(() => startListening(), 100);
    }
  }, [startListening, stopListening]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    stopListening();
    setTranscript('');
    setConfidence(0);
    setLastCommand(null);
    setError(null);
    setSuggestions([]);
    setState('inactive');
    opts.onStateChange?.('inactive');
  }, [stopListening]);

  /**
   * Process command manually (for keyboard fallback)
   */
  const processCommand = useCallback((text: string): CommandMatch | null => {
    const matchResult = matchVoiceCommand(text, language);
    
    if (matchResult.matched && matchResult.match) {
      const match = matchResult.match;
      setLastCommand(match);
      opts.onCommand?.(match);
      return match;
    }
    
    return null;
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stopListening]);

  // Compute derived state
  const isProcessing = state === 'processing';

  const feedbackState: VoiceFeedbackState = useMemo(() => ({
    state,
    transcript,
    confidence,
    error: error?.message,
    suggestions: suggestions.map(s => s.command),
    hasPermission,
    language,
  }), [state, transcript, confidence, error, suggestions, hasPermission, language]);

  return {
    state,
    transcript,
    confidence,
    lastCommand,
    hasPermission,
    isSupported,
    language,
    availableLanguages: SUPPORTED_LANGUAGES,
    startListening,
    stopListening,
    toggleListening,
    setLanguage,
    reset,
    error,
    isProcessing,
    suggestions,
    feedbackState,
    processCommand,
  };
}

export default useVoiceCommand;

// Types are already exported above with 'export interface'
