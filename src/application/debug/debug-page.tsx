"use client"

import { ErrorDebugPanel } from '@/shared/components/ErrorDebugPanel'
import { Button } from '@/shared/ui-components/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DebugPage() {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
          <p className="text-muted-foreground mb-4">
            This page is only available in development mode.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>
        
        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Error Reports</h2>
            <ErrorDebugPanel className="relative" />
          </div>
        </div>
      </div>
    </div>
  )
}
