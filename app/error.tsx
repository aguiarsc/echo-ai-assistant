"use client"

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { captureError } from '@/lib/utils/error-handler'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our error reporting system
    captureError(error, {
      component: 'NextJS Error Page',
      action: 'page_error',
      metadata: {
        digest: error.digest,
        type: 'nextjs_error_boundary'
      }
    })
  }, [error])

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const copyErrorDetails = () => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Could show a toast here, but we're in an error state
        console.log('Error details copied to clipboard')
      })
      .catch(() => {
        console.error('Failed to copy error details')
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Application Error</CardTitle>
          <CardDescription className="text-lg">
            Something went wrong with the application. Don't worry, your data is safe and we're working to fix this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Error Details
            </h4>
            <p className="text-sm text-muted-foreground font-mono">
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={reset}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button 
              onClick={handleGoHome}
              className="flex-1"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Support Actions */}
          <div className="border-t pt-4">
            <Button 
              onClick={copyErrorDetails}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Copy Error Details for Support
            </Button>
          </div>

          {/* What happened and what to do */}
          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">What happened?</h4>
            <p className="text-muted-foreground mb-3">
              The application encountered an unexpected error. This could be due to a temporary issue, 
              network problem, or a bug in the application.
            </p>
            <h4 className="font-semibold mb-2">What can you do?</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Try the "Try Again" button to retry the operation</li>
              <li>• Refresh the page to restart the application</li>
              <li>• Check your internet connection</li>
              <li>• If the problem persists, copy the error details and contact support</li>
            </ul>
          </div>

          {/* Development Mode Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-muted p-4 rounded-lg">
              <summary className="cursor-pointer font-semibold mb-2">
                Development Details
              </summary>
              <div className="space-y-2 text-xs">
                <div>
                  <strong>Error Message:</strong>
                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                    {error.message}
                  </pre>
                </div>
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                    {error.stack}
                  </pre>
                </div>
                {error.digest && (
                  <div>
                    <strong>Error Digest:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                      {error.digest}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
