/**
 * AdCreative Studio - Debug & Logging System
 * 
 * Centrální systém pro logování všech operací.
 * Umožňuje:
 * - Sledovat API calls
 * - Měřit časy operací
 * - Debugovat problémy
 * - Exportovat logy pro support
 * 
 * POUŽITÍ:
 * import { debug, perfStart, perfEnd, exportLogs } from '@/lib/debug'
 * 
 * debug.api('OpenAI', 'generateImage', { prompt: '...' })
 * debug.success('OpenAI', 'Image generated', { cost: 0.02 })
 * debug.error('OpenAI', 'Rate limit exceeded', error)
 * 
 * const timerId = perfStart('outpaint')
 * // ... operace
 * perfEnd(timerId) // loguje čas
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

interface DebugConfig {
  enabled: boolean
  logToConsole: boolean
  maxLogs: number
  includeTimestamp: boolean
  includeStack: boolean
}

const DEFAULT_CONFIG: DebugConfig = {
  enabled: true,
  logToConsole: true,
  maxLogs: 1000,
  includeTimestamp: true,
  includeStack: false,
}

let config: DebugConfig = { ...DEFAULT_CONFIG }

// ============================================================================
// LOG STORAGE
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'api' | 'perf'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  data?: any
  duration?: number
  stack?: string
}

const logs: LogEntry[] = []
let logIdCounter = 0

// Performance timers
const perfTimers: Map<string, { start: number; label: string }> = new Map()

// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

function createLog(level: LogLevel, category: string, message: string, data?: any): LogEntry {
  const entry: LogEntry = {
    id: `log-${++logIdCounter}`,
    timestamp: new Date(),
    level,
    category,
    message,
    data: data ? sanitizeData(data) : undefined,
  }
  
  if (config.includeStack && level === 'error') {
    entry.stack = new Error().stack
  }
  
  // Store log
  logs.push(entry)
  
  // Trim old logs
  if (logs.length > config.maxLogs) {
    logs.splice(0, logs.length - config.maxLogs)
  }
  
  // Console output
  if (config.logToConsole && config.enabled) {
    logToConsole(entry)
  }
  
  return entry
}

function sanitizeData(data: any): any {
  // Remove sensitive data from logs
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data }
    
    // Remove API keys
    if (sanitized.apiKey) sanitized.apiKey = '[REDACTED]'
    if (sanitized.openaiKey) sanitized.openaiKey = '[REDACTED]'
    if (sanitized.Authorization) sanitized.Authorization = '[REDACTED]'
    
    // Truncate base64 images
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'string' && sanitized[key].startsWith('data:image')) {
        sanitized[key] = `[BASE64 IMAGE ${Math.round(sanitized[key].length / 1024)}KB]`
      }
    }
    
    return sanitized
  }
  return data
}

function logToConsole(entry: LogEntry) {
  const prefix = config.includeTimestamp 
    ? `[${entry.timestamp.toISOString().slice(11, 23)}]`
    : ''
  
  const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    api: '🌐',
    perf: '⏱️',
  }[entry.level]
  
  const style = {
    debug: 'color: gray',
    info: 'color: blue',
    warn: 'color: orange',
    error: 'color: red; font-weight: bold',
    api: 'color: purple',
    perf: 'color: green',
  }[entry.level]
  
  const msg = `${prefix} ${emoji} [${entry.category}] ${entry.message}`
  
  if (entry.data !== undefined) {
    console.groupCollapsed(`%c${msg}`, style)
    console.log('Data:', entry.data)
    if (entry.duration) console.log('Duration:', `${entry.duration}ms`)
    if (entry.stack) console.log('Stack:', entry.stack)
    console.groupEnd()
  } else {
    console.log(`%c${msg}`, style)
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const debug = {
  // Basic levels
  log: (category: string, message: string, data?: any) => createLog('debug', category, message, data),
  info: (category: string, message: string, data?: any) => createLog('info', category, message, data),
  warn: (category: string, message: string, data?: any) => createLog('warn', category, message, data),
  error: (category: string, message: string, data?: any) => createLog('error', category, message, data),
  
  // API specific
  api: (service: string, operation: string, params?: any) => 
    createLog('api', service, `→ ${operation}`, params),
  
  apiResponse: (service: string, operation: string, result?: any) => 
    createLog('api', service, `← ${operation}`, result),
  
  apiError: (service: string, operation: string, error: any) => 
    createLog('error', service, `✗ ${operation} failed`, { 
      error: error?.message || error,
      status: error?.status,
    }),
  
  // Success
  success: (category: string, message: string, data?: any) => 
    createLog('info', category, `✓ ${message}`, data),
    
  // Performance
  perf: (label: string, duration: number, data?: any) => {
    const entry = createLog('perf', 'Performance', `${label}: ${duration.toFixed(1)}ms`, data)
    entry.duration = duration
    return entry
  },
}

// ============================================================================
// PERFORMANCE MEASUREMENT
// ============================================================================

/**
 * Start performance timer
 * Returns timer ID to use with perfEnd
 */
export function perfStart(label: string): string {
  const id = `perf-${++logIdCounter}`
  perfTimers.set(id, { start: performance.now(), label })
  debug.log('Performance', `⏱️ Start: ${label}`)
  return id
}

/**
 * End performance timer and log duration
 */
export function perfEnd(timerId: string, data?: any): number {
  const timer = perfTimers.get(timerId)
  if (!timer) {
    debug.warn('Performance', `Timer ${timerId} not found`)
    return 0
  }
  
  const duration = performance.now() - timer.start
  perfTimers.delete(timerId)
  
  debug.perf(timer.label, duration, data)
  return duration
}

// ============================================================================
// LOG MANAGEMENT
// ============================================================================

/**
 * Get all logs
 */
export function getLogs(filter?: { level?: LogLevel; category?: string; since?: Date }): LogEntry[] {
  let result = [...logs]
  
  if (filter?.level) {
    result = result.filter(l => l.level === filter.level)
  }
  if (filter?.category) {
    result = result.filter(l => l.category.toLowerCase().includes(filter.category!.toLowerCase()))
  }
  if (filter?.since) {
    result = result.filter(l => l.timestamp >= filter.since!)
  }
  
  return result
}

/**
 * Export logs as JSON for debugging
 */
export function exportLogs(): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    config,
    logs: logs.map(l => ({
      ...l,
      timestamp: l.timestamp.toISOString(),
    })),
  }, null, 2)
}

/**
 * Download logs as file
 */
export function downloadLogs() {
  const json = exportLogs()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `adcreative-logs-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

/**
 * Clear all logs
 */
export function clearLogs() {
  logs.length = 0
  logIdCounter = 0
  debug.info('Debug', 'Logs cleared')
}

/**
 * Configure debug system
 */
export function configureDebug(newConfig: Partial<DebugConfig>) {
  config = { ...config, ...newConfig }
  debug.info('Debug', 'Configuration updated', config)
}

/**
 * Get debug configuration
 */
export function getDebugConfig(): DebugConfig {
  return { ...config }
}

// ============================================================================
// API CALL WRAPPER
// ============================================================================

/**
 * Wrapper for API calls with automatic logging
 * 
 * Usage:
 * const result = await apiCall('OpenAI', 'generateImage', async () => {
 *   return await fetch(...)
 * }, { prompt: '...' })
 */
export async function apiCall<T>(
  service: string,
  operation: string,
  fn: () => Promise<T>,
  params?: any
): Promise<T> {
  const timerId = perfStart(`${service}.${operation}`)
  debug.api(service, operation, params)
  
  try {
    const result = await fn()
    const duration = perfEnd(timerId)
    
    debug.apiResponse(service, operation, { 
      success: true, 
      duration: `${duration.toFixed(0)}ms`,
    })
    
    return result
  } catch (error: any) {
    perfEnd(timerId)
    debug.apiError(service, operation, error)
    throw error
  }
}

// ============================================================================
// HELPER: API Request with retry
// ============================================================================

export interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: any) => void
}

/**
 * Fetch with automatic retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const { 
    maxRetries = 3, 
    delayMs = 1000, 
    backoff = true,
    onRetry,
  } = retryOptions
  
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      // Retry on rate limit
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5')
        debug.warn('API', `Rate limited, waiting ${retryAfter}s...`)
        await sleep(retryAfter * 1000)
        continue
      }
      
      return response
    } catch (error: any) {
      lastError = error
      
      if (attempt < maxRetries) {
        const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs
        debug.warn('API', `Request failed, retry ${attempt + 1}/${maxRetries} in ${delay}ms`, error.message)
        onRetry?.(attempt + 1, error)
        await sleep(delay)
      }
    }
  }
  
  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// EXPOSE TO WINDOW FOR DEBUGGING
// ============================================================================

if (typeof window !== 'undefined') {
  (window as any).__adcreative_debug = {
    getLogs,
    exportLogs,
    downloadLogs,
    clearLogs,
    configureDebug,
    getDebugConfig,
    logs,
  }
  
  debug.info('Debug', 'Debug system initialized. Access via window.__adcreative_debug')
}

export default debug
