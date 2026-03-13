/**
 * Logger Utility - Environment-aware logging
 * 
 * [Ver001.000]
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  level: LogLevel
  prefix?: string
  enabled: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

class Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
      prefix: config.prefix,
      enabled: config.enabled ?? true
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level]
  }

  private formatMessage(level: LogLevel, message: string): string {
    const prefix = this.config.prefix ? `[${this.config.prefix}] ` : ''
    return `${prefix}${message}`
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args)
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args)
    }
  }

  // Create a child logger with a specific prefix
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix
    })
  }
}

// Default logger instance
export const logger = new Logger()

// ML-specific logger
export const mlLogger = logger.child('ML')

// Streaming-specific logger
export const streamingLogger = logger.child('Streaming')

// Deployment-specific logger
export const deployLogger = logger.child('Deploy')

export default logger
