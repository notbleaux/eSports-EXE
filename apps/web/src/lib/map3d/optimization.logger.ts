// @ts-nocheck
/**
 * Optimization Logger Interface
 * 
 * [Ver001.000] - CRIT-3 Resolution: Injectable logger interface
 */

// ============================================
// Logger Interface
// ============================================

export interface ILogger {
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

// ============================================
// Default Logger (Console)
// ============================================

export class ConsoleLogger implements ILogger {
  private prefix: string;
  private enabled: boolean;

  constructor(prefix: string = 'Optimization', enabled: boolean = true) {
    this.prefix = prefix;
    this.enabled = enabled;
  }

  private log(level: string, message: string, meta?: Record<string, unknown>) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage, meta || '');
        break;
      case 'WARN':
        console.warn(logMessage, meta || '');
        break;
      case 'INFO':
        console.info(logMessage, meta || '');
        break;
      case 'DEBUG':
        console.debug(logMessage, meta || '');
        break;
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('ERROR', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('WARN', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('INFO', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('DEBUG', message, meta);
  }
}

// ============================================
// Null Logger (for testing)
// ============================================

export class NullLogger implements ILogger {
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

// ============================================
// Aggregated Logger (multiple targets)
// ============================================

export class AggregatedLogger implements ILogger {
  private loggers: ILogger[];

  constructor(loggers: ILogger[]) {
    this.loggers = loggers;
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.loggers.forEach(logger => logger.error(message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.loggers.forEach(logger => logger.warn(message, meta));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.loggers.forEach(logger => logger.info(message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.loggers.forEach(logger => logger.debug(message, meta));
  }
}

// ============================================
// Performance Logger
// ============================================

export interface PerformanceLogEntry {
  operation: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export class PerformanceLogger implements ILogger {
  private baseLogger: ILogger;
  private metrics: PerformanceLogEntry[] = [];

  constructor(baseLogger: ILogger) {
    this.baseLogger = baseLogger;
  }

  time(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.metrics.push({ operation, durationMs: duration });
    };
  }

  getMetrics(): PerformanceLogEntry[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // ILogger implementation
  error(message: string, meta?: Record<string, unknown>): void {
    this.baseLogger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.baseLogger.warn(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.baseLogger.info(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.baseLogger.debug(message, meta);
  }
}

// ============================================
// Logger Factory
// ============================================

export interface LoggerOptions {
  type: 'console' | 'null' | 'aggregated' | 'performance';
  prefix?: string;
  enabled?: boolean;
  loggers?: ILogger[];
  baseLogger?: ILogger;
}

export function createLogger(options: LoggerOptions): ILogger {
  switch (options.type) {
    case 'console':
      return new ConsoleLogger(options.prefix, options.enabled ?? true);
    case 'null':
      return new NullLogger();
    case 'aggregated':
      if (!options.loggers) {
        throw new Error('Aggregated logger requires loggers array');
      }
      return new AggregatedLogger(options.loggers);
    case 'performance':
      if (!options.baseLogger) {
        throw new Error('Performance logger requires baseLogger');
      }
      return new PerformanceLogger(options.baseLogger);
    default:
      return new ConsoleLogger();
  }
}

// ============================================
// Default Export
// ============================================

export default {
  ConsoleLogger,
  NullLogger,
  AggregatedLogger,
  PerformanceLogger,
  createLogger,
};
