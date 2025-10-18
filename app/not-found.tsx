"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState('/unknown')
  
  useEffect(() => {
    // Set the current path after hydration to avoid hydration mismatch
    setCurrentPath(window.location.pathname)
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription className="text-lg">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What happened */}
          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">What happened?</h4>
            <p className="text-muted-foreground mb-3">
              The URL you entered doesn&apos;t match any pages in Echo Novel Assistant. 
              This could happen if:
            </p>
            <ul className="text-muted-foreground space-y-1">
              <li>• The page was moved or deleted</li>
              <li>• You typed the URL incorrectly</li>
              <li>• You followed an outdated link</li>
              <li>• The page is temporarily unavailable</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => router.back()}
              className="flex-1"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Link href="/" className="flex-1">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">What can you do?</h4>
            <div className="grid gap-2">
              <Link href="/">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Echo Novel Assistant
                </Button>
              </Link>
            </div>
          </div>

          {/* Current URL for debugging */}
          <div className="bg-muted p-3 rounded-lg text-xs">
            <strong>Requested URL:</strong>
            <code className="ml-2 text-muted-foreground">
              {currentPath}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
