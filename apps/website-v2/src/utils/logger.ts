/** [Ver001.000] */
/**
 * Logger Utility
 * Simple logging utility for production and development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const argsStr = args.length > 0 ? ' ' + args.map(a => 
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ') : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${argsStr}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, ...args));
    }
  },

  info(message: string, ...args: unknown[]) {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, ...args));
    }
  },

  warn(message: string, ...args: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, ...args));
    }
  },

  error(message: string, ...args: unknown[]) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, ...args));
    }
  },
};

/**
 * ML-specific logger instance
 * Used for machine learning inference and model loading logs
 */
export const mlLogger = logger;

/**
 * Streaming-specific logger instance
 * Used for WebSocket and streaming inference logs
 */
export const streamingLogger = logger;

export default logger;
