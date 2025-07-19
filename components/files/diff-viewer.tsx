"use client"

import React, { useState, useMemo } from "react"
import { diffWords, diffLines, Change } from 'diff'
import { Button } from "@/components/ui/button"
import { Check, X, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DiffViewerProps {
  originalText: string
  modifiedText: string
  onAcceptChange?: (changeIndex: number) => void
  onRejectChange?: (changeIndex: number) => void
  onAcceptAll?: () => void
  onRejectAll?: () => void
  className?: string
}

interface ProcessedChange extends Change {
  id: string
  accepted?: boolean
  rejected?: boolean
  lineNumber?: number
}

export function DiffViewer({
  originalText,
  modifiedText,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onRejectAll,
  className
}: DiffViewerProps) {
  const [showDiff, setShowDiff] = useState(true)
  const [changeStates, setChangeStates] = useState<Record<string, 'accepted' | 'rejected'>>({})

  // Calculate diff with word-level granularity for better markdown handling
  const changes = useMemo(() => {
    const wordDiff = diffWords(originalText, modifiedText)
    
    return wordDiff.map((change, index) => ({
      ...change,
      id: `change-${index}`,
      lineNumber: index
    })) as ProcessedChange[]
  }, [originalText, modifiedText])

  // Calculate statistics
  const stats = useMemo(() => {
    const additions = changes.filter(c => c.added).length
    const deletions = changes.filter(c => c.removed).length
    const total = changes.length
    
    return { additions, deletions, total }
  }, [changes])

  const handleAcceptChange = (changeId: string, index: number) => {
    setChangeStates(prev => ({ ...prev, [changeId]: 'accepted' }))
    onAcceptChange?.(index)
  }

  const handleRejectChange = (changeId: string, index: number) => {
    setChangeStates(prev => ({ ...prev, [changeId]: 'rejected' }))
    onRejectChange?.(index)
  }

  const handleAcceptAll = () => {
    const newStates: Record<string, 'accepted' | 'rejected'> = {}
    changes.forEach(change => {
      if (change.added || change.removed) {
        newStates[change.id] = 'accepted'
      }
    })
    setChangeStates(newStates)
    onAcceptAll?.()
  }

  const handleRejectAll = () => {
    const newStates: Record<string, 'accepted' | 'rejected'> = {}
    changes.forEach(change => {
      if (change.added || change.removed) {
        newStates[change.id] = 'rejected'
      }
    })
    setChangeStates(newStates)
    onRejectAll?.()
  }

  const renderChange = (change: ProcessedChange, index: number) => {
    const changeState = changeStates[change.id]
    const isModified = change.added || change.removed
    
    if (!showDiff && !isModified) {
      return (
        <span key={change.id} className="whitespace-pre-wrap">
          {change.value}
        </span>
      )
    }

    if (!isModified) {
      return (
        <span key={change.id} className="whitespace-pre-wrap">
          {change.value}
        </span>
      )
    }

    const baseClasses = "relative inline-block whitespace-pre-wrap"
    
    let changeClasses = ""
    if (change.removed) {
      changeClasses = changeState === 'accepted' 
        ? "bg-red-100 dark:bg-red-900/30 line-through opacity-50"
        : changeState === 'rejected'
        ? "bg-gray-100 dark:bg-gray-800"
        : "bg-red-100 dark:bg-red-900/30 line-through"
    } else if (change.added) {
      changeClasses = changeState === 'accepted'
        ? "bg-green-100 dark:bg-green-900/30"
        : changeState === 'rejected'
        ? "bg-gray-100 dark:bg-gray-800 line-through opacity-50"
        : "bg-green-100 dark:bg-green-900/30"
    }

    return (
      <span key={change.id} className={cn(baseClasses, changeClasses, "group")}>
        {change.value}

      </span>
    )
  }

  const getPreviewText = () => {
    return changes.map(change => {
      const changeState = changeStates[change.id]
      
      if (change.removed) {
        return changeState === 'rejected' ? change.value : ''
      } else if (change.added) {
        return changeState === 'accepted' ? change.value : ''
      } else {
        return change.value
      }
    }).join('')
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="text-green-600 dark:text-green-400">+{stats.additions}</span>
            {" "}
            <span className="text-red-600 dark:text-red-400">-{stats.deletions}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDiff(!showDiff)}
            className="h-8 px-2"
          >
            {showDiff ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Changes
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Changes
              </>
            )}
          </Button>
        </div>
        
        {showDiff && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptAll}
              className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <X className="h-3 w-3 mr-1" />
              Reject All
            </Button>
          </div>
        )}
      </div>

      {/* Diff content */}
      <div className="relative">
        <div className="font-mono text-sm leading-relaxed p-4 border rounded-lg bg-muted/30 min-h-[200px] whitespace-pre-wrap overflow-auto max-h-[600px]">
          {showDiff ? (
            changes.map((change, index) => renderChange(change, index))
          ) : (
            <div className="whitespace-pre-wrap">{getPreviewText() || modifiedText}</div>
          )}
        </div>
      </div>

      {/* Legend */}
      {showDiff && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded"></div>
            <span>Added</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded"></div>
            <span>Removed</span>
          </div>
          <span>Use Accept All or Reject All buttons above</span>
        </div>
      )}
    </div>
  )
}
