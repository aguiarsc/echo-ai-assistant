"use client"

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { captureError } from '@/lib/utils/error-handler'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our error reporting system
    captureError(error, {
      component: 'Global Error Handler',
      action: 'global_error',
      metadata: {
        digest: error.digest,
        type: 'global_error_boundary'
      }
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Critical Application Error</CardTitle>
              <CardDescription className="text-lg">
                A critical error occurred that prevented the application from loading properly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Error Details</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {error.message || 'A critical error occurred'}
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
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* What to do */}
              <div className="bg-muted/50 p-4 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">What happened?</h4>
                <p className="text-muted-foreground mb-3">
                  A critical error occurred that prevented the application from loading. 
                  This is usually caused by a JavaScript error or network issue.
                </p>
                <h4 className="font-semibold mb-2">What can you do?</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Try refreshing the page</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache</li>
                  <li>• Try again in a few minutes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
