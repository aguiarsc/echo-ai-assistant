"use client"

import { useEffect } from 'react'
import { errorHandler } from '@/lib/shared/services/error-handler.service'

/**
 * Client-side error handler component that initializes global error handling
 * This component should be mounted once at the root level
 */
export function ClientErrorHandler() {
  useEffect(() => {
    // Initialize global error handler
    errorHandler.initialize()

    // Cleanup on unmount
    return () => {
      errorHandler.cleanup()
    }
  }, [])

  // This component doesn't render anything
  return null
}
