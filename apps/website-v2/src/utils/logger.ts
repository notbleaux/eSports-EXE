/**
 * logger.ts - Structured logging utility
 * Compatible with browser console and server-side logging
 *
 * [Ver001.000]
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const CURRENT_LEVEL: LogLevel = (import.meta.env?.VITE_LOG_LEVEL as LogLevel) || 'info'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[CURRENT_LEVEL]
}

function formatLog(level: LogLevel, ...args: any[]): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp.slice(11, 23)} ${level.toUpperCase()}]`
  return `${prefix} ${args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(' ')}`
}

export const logger = {
  debug: (...args: any[]) => shouldLog('debug') && console.debug(formatLog('debug', ...args)),
  info: (...args: any[]) => shouldLog('info') && console.info(formatLog('info', ...args)),
  warn: (...args: any[]) => shouldLog('warn') && console.warn(formatLog('warn', ...args)),
  error: (...args: any[]) => shouldLog('error') && console.error(formatLog('error', ...args))
}

export default logger
