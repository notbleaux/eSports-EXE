/**
 * Logger Utility
 * Simple logging utility for the application
 * [Ver001.002] - Fixed for production
 */

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  child: (subNamespace: string) => Logger;
}

export function createLogger(namespace: string): Logger {
  const prefix = `[${namespace}]`;
  
  return {
    debug: (...args: unknown[]) => {
      // Only log in development
      try {
        if (import.meta.env.DEV) {
          console.debug(prefix, ...args);
        }
      } catch {
        // ignore
      }
    },
    info: (...args: unknown[]) => console.info(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
    child: (subNamespace: string) => createLogger(`${namespace}:${subNamespace}`),
  };
}

export const logger = createLogger('app');
export const mlLogger = createLogger('ml');
export const streamingLogger = createLogger('streaming');

export default { createLogger, logger, mlLogger, streamingLogger };
