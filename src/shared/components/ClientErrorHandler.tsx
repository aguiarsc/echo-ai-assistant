"use client"

import { useEffect } from 'react'
import { errorHandler } from '@/shared/utilities/error-handler'

export function ClientErrorHandler() {
  useEffect(() => {
    errorHandler.initialize()

    return () => {
      errorHandler.cleanup()
    }
  }, [])

  return null
}
