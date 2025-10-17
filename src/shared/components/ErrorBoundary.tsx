"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/shared/ui-components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui-components/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.logErrorToService(error, errorInfo)

    toast.error('Something went wrong', {
      description: 'An unexpected error occurred. Please try refreshing the page.',
      duration: 5000
    })
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    console.group('🚨 Error Boundary Report')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Error Stack:', error.stack)
    console.error('User Agent:', navigator.userAgent)
    console.error('URL:', window.location.href)
    console.error('Timestamp:', new Date().toISOString())
    console.groupEnd()
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private handleRefresh = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private copyErrorDetails = () => {
    const errorDetails = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        toast.success('Error details copied to clipboard')
      })
      .catch(() => {
        toast.error('Failed to copy error details')
      })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="text-lg">
                An unexpected error occurred in the application. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Error Details
                </h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleRefresh}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="border-t pt-4">
                <Button 
                  onClick={this.copyErrorDetails}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Copy Error Details for Support
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="bg-muted p-4 rounded-lg">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Development Details
                  </summary>
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                        {this.state.error?.stack}
                      </pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Manual error report:', error, errorInfo)
    
    toast.error('An error occurred', {
      description: error.message,
      duration: 5000
    })
  }, [])
}
