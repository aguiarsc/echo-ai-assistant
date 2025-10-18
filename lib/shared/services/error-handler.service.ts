import { toast } from 'sonner'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, unknown>
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

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)

    // Handle uncaught errors
    window.addEventListener('error', this.handleUncaughtError)

    // Handle resource loading errors
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

    // Show user-friendly message
    toast.error('Something went wrong', {
      description: 'An unexpected error occurred. The application will continue to work.',
      duration: 5000
    })

    // Prevent the default browser behavior (logging to console)
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

    // Show user-friendly message
    toast.error('Application Error', {
      description: 'An unexpected error occurred. Please refresh the page if issues persist.',
      duration: 5000
    })
  }

  private handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement | null
    
    // Only handle resource loading errors (img, script, link, etc.)
    if (target && target !== (window as unknown) && 'src' in target) {
      console.error('🚨 Resource Loading Error:', target)
      
      const targetElement = target as HTMLImageElement | HTMLScriptElement | HTMLLinkElement
      const resourceUrl = 'src' in targetElement && targetElement.src 
        ? targetElement.src 
        : 'href' in targetElement ? targetElement.href : 'unknown';
      const error = new Error(`Failed to load resource: ${resourceUrl}`)
      
      this.reportError(error, {
        component: 'Resource',
        action: 'load_error',
        metadata: {
          type: 'resource_error',
          tagName: target.tagName,
          src: 'src' in targetElement ? targetElement.src : undefined,
          href: 'href' in targetElement ? targetElement.href : undefined
        }
      })

      // Don't show toast for resource errors as they're usually not critical
      // and can be noisy (missing images, etc.)
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

    // Log to console with structured data
    console.group('🚨 Error Report')
    console.error('Error:', error)
    console.error('Context:', context)
    console.error('Report:', report)
    console.groupEnd()

    // Send to external error tracking service
    this.sendToErrorService(report)
  }

  private sendToErrorService(report: ErrorReport) {
    // Here you would send to your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    // Example for Sentry:
    // Sentry.captureException(report.error, {
    //   contexts: {
    //     error_report: report
    //   },
    //   tags: {
    //     component: report.context.component,
    //     action: report.context.action
    //   }
    // })

    // For now, we'll just log it
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Would send error report to service:', report)
    }
  }

  // Utility method for manual error reporting
  public captureError(error: Error, context?: ErrorContext) {
    this.reportError(error, context)
  }

  // Utility method for capturing messages as errors
  public captureMessage(message: string, context?: ErrorContext) {
    const error = new Error(message)
    this.reportError(error, context)
  }

  // Utility method for error reporting with any type
  public captureException(error: unknown, context?: ErrorContext) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    this.reportError(errorObj, context)
  }
}

// Export singleton instance
export const errorHandler = GlobalErrorHandler.getInstance()

// Utility functions for easier usage
export function captureError(error: Error, context?: ErrorContext) {
  errorHandler.captureError(error, context)
}

export function captureMessage(message: string, context?: ErrorContext) {
  errorHandler.captureMessage(message, context)
}

// Hook for React components
export function useErrorReporting() {
  return {
    captureError,
    captureMessage
  }
}

// Initialize on import (for client-side)
if (typeof window !== 'undefined') {
  errorHandler.initialize()
}
