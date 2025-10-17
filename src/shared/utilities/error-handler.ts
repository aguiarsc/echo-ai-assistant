import { toast } from 'sonner'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, any>
}

export interface ErrorReport {
  error: Error
  context: ErrorContext
  timestamp: string
  userAgent: string
  url: string
  stackTrace?: string
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private isInitialized = false

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  public initialize() {
    if (this.isInitialized) return

    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    window.addEventListener('error', this.handleUncaughtError)
    window.addEventListener('error', this.handleResourceError, true)

    this.isInitialized = true
    console.log('🛡️ Global error handler initialized')
  }

  public cleanup() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
    window.removeEventListener('error', this.handleUncaughtError)
    window.removeEventListener('error', this.handleResourceError, true)
    this.isInitialized = false
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason)
    
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    
    this.reportError(error, {
      component: 'Promise',
      action: 'unhandled_rejection',
      metadata: {
        type: 'unhandled_promise_rejection',
        reason: event.reason
      }
    })

    toast.error('Something went wrong', {
      description: 'An unexpected error occurred. The application will continue to work.',
      duration: 5000
    })

    event.preventDefault()
  }

  private handleUncaughtError = (event: ErrorEvent) => {
    console.error('🚨 Uncaught Error:', event.error)
    
    const error = event.error || new Error(event.message)
    
    this.reportError(error, {
      component: 'Global',
      action: 'uncaught_error',
      metadata: {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })

    toast.error('Application Error', {
      description: 'An unexpected error occurred. Please refresh the page if issues persist.',
      duration: 5000
    })
  }

  private handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement | null
    
    if (target && target !== (window as any) && 'src' in target) {
      console.error('🚨 Resource Loading Error:', target)
      
      const error = new Error(`Failed to load resource: ${(target as any).src}`)
      
      this.reportError(error, {
        component: 'Resource',
        action: 'load_error',
        metadata: {
          type: 'resource_error',
          tagName: target.tagName,
          src: (target as any).src,
          href: (target as any).href
        }
      })
    }
  }

  public reportError(error: Error, context: ErrorContext = {}) {
    const report: ErrorReport = {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error.stack
    }

    console.group('🚨 Error Report')
    console.error('Error:', error)
    console.error('Context:', context)
    console.error('Report:', report)
    console.groupEnd()

    this.sendToErrorService(report)
    this.storeErrorLocally(report)
  }

  private sendToErrorService(report: ErrorReport) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Would send error report to service:', report)
    }
  }

  private storeErrorLocally(report: ErrorReport) {
    try {
      if (typeof window === 'undefined') return
      const key = 'echo_error_reports'
      const stored = localStorage.getItem(key)
      const reports: ErrorReport[] = stored ? JSON.parse(stored) : []
      
      reports.unshift(report)
      
      const trimmedReports = reports.slice(0, 10)
      
      localStorage.setItem(key, JSON.stringify(trimmedReports))
    } catch (error) {
      console.error('Failed to store error report locally:', error)
    }
  }

  public getStoredErrors(): ErrorReport[] {
    try {
      if (typeof window === 'undefined') return []
      const stored = localStorage.getItem('echo_error_reports')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to retrieve stored errors:', error)
      return []
    }
  }

  public clearStoredErrors() {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem('echo_error_reports')
    } catch (error) {
      console.error('Failed to clear stored errors:', error)
    }
  }

  public captureError(error: Error, context?: ErrorContext) {
    this.reportError(error, context)
  }

  public captureMessage(message: string, context?: ErrorContext) {
    const error = new Error(message)
    this.reportError(error, context)
  }
}

export const errorHandler = GlobalErrorHandler.getInstance()

export function captureError(error: Error, context?: ErrorContext) {
  errorHandler.captureError(error, context)
}

export function captureMessage(message: string, context?: ErrorContext) {
  errorHandler.captureMessage(message, context)
}

export function useErrorReporting() {
  return {
    captureError,
    captureMessage,
    getStoredErrors: () => errorHandler.getStoredErrors(),
    clearStoredErrors: () => errorHandler.clearStoredErrors()
  }
}

if (typeof window !== 'undefined') {
  errorHandler.initialize()
}
