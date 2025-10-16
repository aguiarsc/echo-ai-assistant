"use client"

import React, { useState, useMemo } from "react"
import { diffWords, diffChars } from 'diff'
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DiffViewerProps {
  originalText: string
  modifiedText: string
  onAcceptAll?: () => void
  onRejectAll?: () => void
  className?: string
}

export function DiffViewer({
  originalText,
  modifiedText,
  onAcceptAll,
  onRejectAll,
  className
}: DiffViewerProps) {
  // Use word-level diff for prose
  const changes = useMemo(() => {
    return diffWords(originalText, modifiedText)
  }, [originalText, modifiedText])

  // Calculate statistics
  const stats = useMemo(() => {
    let addedWords = 0
    let removedWords = 0
    
    changes.forEach(change => {
      const wordCount = change.value.trim().split(/\s+/).filter(w => w.length > 0).length
      if (change.added) addedWords += wordCount
      if (change.removed) removedWords += wordCount
    })
    
    return { addedWords, removedWords }
  }, [changes])

  // Render word-level diff optimized for prose
  const renderDiff = () => {
    return changes.map((change, index) => {
      if (!change.added && !change.removed) {
        // Unchanged text
        return (
          <span key={index} className="text-foreground">
            {change.value}
          </span>
        )
      }

      if (change.removed) {
        // Deleted text - subtle red with strikethrough
        return (
          <span
            key={index}
            className="bg-red-100/60 dark:bg-red-950/30 text-red-800 dark:text-red-200 line-through decoration-red-500/50 px-0.5 rounded-sm"
          >
            {change.value}
          </span>
        )
      }

      if (change.added) {
        // Added text - subtle green highlight
        return (
          <span
            key={index}
            className="bg-green-100/60 dark:bg-green-950/30 text-green-800 dark:text-green-200 px-0.5 rounded-sm"
          >
            {change.value}
          </span>
        )
      }

      return null
    })
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-green-600 dark:text-green-400">+{stats.addedWords}</span>
            <span className="text-xs">added</span>
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-red-600 dark:text-red-400">-{stats.removedWords}</span>
            <span className="text-xs">removed</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAcceptAll}
            className="h-8 gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20"
          >
            <Check className="h-3.5 w-3.5" />
            Accept Changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRejectAll}
            className="h-8 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <X className="h-3.5 w-3.5" />
            Reject Changes
          </Button>
        </div>
      </div>

      {/* Readable Text Container */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div className="p-6 rounded-lg border bg-card leading-relaxed text-[15px] whitespace-pre-wrap break-words">
          {renderDiff()}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-100/60 dark:bg-green-950/30 rounded"></div>
          <span>Added</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-100/60 dark:bg-red-950/30 rounded"></div>
          <span>Removed</span>
        </div>
      </div>
    </div>
  )
}
