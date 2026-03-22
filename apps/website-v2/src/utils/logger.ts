/** [Ver002.000] */
/**
 * Logger Utility
 * Simple logging utility for production and development.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL: LogLevel = ((import.meta as unknown as { env: Record<string, string> }).env.VITE_LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function formatMessage(level: LogLevel, context: string, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  const argsStr = args.length > 0 ? ' ' + args.map(a => 
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ') : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${contextStr}${message}${argsStr}`;
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  child(context: string): Logger;
}

function createLogger(context: string = ''): Logger {
  return {
    debug(message: string, ...args: unknown[]) {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', context, message, ...args));
      }
    },

    info(message: string, ...args: unknown[]) {
      if (shouldLog('info')) {
        console.info(formatMessage('info', context, message, ...args));
      }
    },

    warn(message: string, ...args: unknown[]) {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', context, message, ...args));
      }
    },

    error(message: string, ...args: unknown[]) {
      if (shouldLog('error')) {
        console.error(formatMessage('error', context, message, ...args));
      }
    },

    child(childContext: string): Logger {
      const newContext = context ? `${context}:${childContext}` : childContext;
      return createLogger(newContext);
    }
  };
}

export const logger: Logger = createLogger();

/**
 * ML-specific logger instance
 * Used for machine learning inference and model loading logs
 */
export const mlLogger = logger.child('ML');

/**
 * Streaming-specific logger instance
 * Used for WebSocket and streaming inference logs
 */
export const streamingLogger = logger.child('Streaming');

export default logger;
