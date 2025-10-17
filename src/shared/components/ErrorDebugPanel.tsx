"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/ui-components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui-components/card'
import { Badge } from '@/shared/ui-components/badge'
import { ScrollArea } from '@/shared/ui-components/scroll-area'
import { Bug, Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { useErrorReporting } from '@/shared/utilities/error-handler'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui-components/dialog'

interface ErrorDebugPanelProps {
  className?: string
}

export function ErrorDebugPanel({ className }: ErrorDebugPanelProps) {
  const { getStoredErrors, clearStoredErrors } = useErrorReporting()
  const [errors, setErrors] = useState<any[]>([])
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set())
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    try {
      setErrors(getStoredErrors())
    } catch (error) {
      console.error('Failed to load stored errors:', error)
    }
  }, [])

  const refreshErrors = () => {
    setErrors(getStoredErrors())
  }

  const handleClearErrors = () => {
    clearStoredErrors()
    setErrors([])
    toast.success('Error history cleared')
  }

  const copyErrorDetails = (error: any, index: number) => {
    const details = {
      timestamp: error.timestamp,
      message: error.error.message,
      stack: error.error.stack,
      context: error.context,
      url: error.url,
      userAgent: error.userAgent
    }

    navigator.clipboard.writeText(JSON.stringify(details, null, 2))
      .then(() => {
        toast.success('Error details copied to clipboard')
      })
      .catch(() => {
        toast.error('Failed to copy error details')
      })
  }

  const toggleErrorExpansion = (index: number) => {
    const newExpanded = new Set(expandedErrors)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedErrors(newExpanded)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getErrorSeverity = (error: any) => {
    if (error.context?.metadata?.type === 'resource_error') return 'low'
    if (error.context?.metadata?.type === 'unhandled_promise_rejection') return 'high'
    if (error.context?.metadata?.type === 'uncaught_error') return 'critical'
    return 'medium'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  if (process.env.NODE_ENV !== 'development' || !isClient) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`fixed bottom-4 right-4 z-50 ${className}`}
          onClick={refreshErrors}
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ({errors.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Error Debug Panel
          </DialogTitle>
          <DialogDescription>
            View and manage application errors for debugging purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline">
              {errors.length} error{errors.length !== 1 ? 's' : ''} logged
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshErrors}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearErrors}
                disabled={errors.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px] w-full">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No errors logged yet. That's good! 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {errors.map((error, index) => {
                  const severity = getErrorSeverity(error)
                  const isExpanded = expandedErrors.has(index)
                  
                  return (
                    <Card key={index} className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={getSeverityColor(severity) as any}>
                                {severity}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatTimestamp(error.timestamp)}
                              </span>
                            </div>
                            <CardTitle className="text-sm font-medium">
                              {error.error.message || 'Unknown error'}
                            </CardTitle>
                            {error.context?.component && (
                              <CardDescription className="text-xs">
                                Component: {error.context.component}
                                {error.context.action && ` • Action: ${error.context.action}`}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyErrorDetails(error, index)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleErrorExpansion(index)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="space-y-3 text-xs">
                            {error.stackTrace && (
                              <div>
                                <strong>Stack Trace:</strong>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                                  {error.stackTrace}
                                </pre>
                              </div>
                            )}
                            
                            {error.context?.metadata && (
                              <div>
                                <strong>Context:</strong>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                  {JSON.stringify(error.context.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            <div>
                              <strong>URL:</strong>
                              <code className="ml-2 text-muted-foreground">
                                {error.url}
                              </code>
                            </div>
                            
                            <div>
                              <strong>User Agent:</strong>
                              <code className="ml-2 text-muted-foreground text-xs">
                                {error.userAgent}
                              </code>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
