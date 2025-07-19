"use client"

import React from "react"
import { X, File, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFileContextStore } from "@/lib/files/context-store"

interface FileContextProps {
  onClear?: () => void
  className?: string
  maxHeight?: string
}

export function FileContext({ onClear, className, maxHeight = "150px" }: FileContextProps) {
  const { getSelectedFiles, unselectFile, clearSelection } = useFileContextStore()
  const selectedFiles = getSelectedFiles()
  
  if (selectedFiles.length === 0) {
    return null
  }
  
  return (
    <div className={`rounded-md border bg-background p-2 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Files as Context</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => {
            clearSelection()
            if (onClear) onClear()
          }}
        >
          Clear All
        </Button>
      </div>
      
      <ScrollArea className="pr-3" style={{ maxHeight }}>
        <div className="space-y-1">
          {selectedFiles.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-1 rounded-md hover:bg-accent/50"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {file.type === "folder" ? (
                  <Folder className="h-4 w-4 shrink-0 text-blue-500" />
                ) : (
                  <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="truncate text-sm flex-1">
                        {file.name}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{file.path}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => unselectFile(file.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export function FileContextSummary({ className }: { className?: string }) {
  const { getSelectedFiles } = useFileContextStore()
  const selectedFiles = getSelectedFiles()
  
  if (selectedFiles.length === 0) {
    return null
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={className}>
            <File className="h-3 w-3 mr-1" />
            <span>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} as context</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs max-w-xs">
            <p className="font-medium mb-1">Files attached as context:</p>
            <ul className="list-disc list-inside">
              {selectedFiles.slice(0, 5).map(file => (
                <li key={file.id} className="truncate">{file.path}</li>
              ))}
              {selectedFiles.length > 5 && (
                <li>...and {selectedFiles.length - 5} more</li>
              )}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
