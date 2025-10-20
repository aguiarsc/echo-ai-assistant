"use client"

import React, { useState, useEffect, useRef } from "react"
import { useFilesStore } from "@/lib/files/stores"
import { FileNode } from "@/lib/files/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, FileText, Save, Copy, CheckCheck } from "lucide-react"
import { cn } from "@/lib/shared/utils/cn.utils"
import { FileExport } from "./FileExport"
import { DiffViewer } from "../diff/DiffViewer"
import { toast } from "sonner"

export function FileEditor() {
  const { 
    activeFileId, 
    editorOpen, 
    closeEditor, 
    getNodeById, 
    updateFileContent,
    clearEditedContent,
    files 
  } = useFilesStore()
  
  const [content, setContent] = useState("")
  const [file, setFile] = useState<FileNode | null>(null)
  const [isModified, setIsModified] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Load file content when activeFileId changes or file content updates
  useEffect(() => {
    if (activeFileId) {
      const currentFile = getNodeById(activeFileId)
      if (currentFile && currentFile.type === 'file') {
        setFile(currentFile)
        setContent(currentFile.content || "")
        setIsModified(false)
        
        // Check if there's edited content to show diff
        if (currentFile.editedContent) {
          setShowDiff(true)
        } else {
          setShowDiff(false)
          // Focus the textarea when content is loaded (only if not showing diff)
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus()
            }
          }, 100)
        }
      }
    } else {
      setFile(null)
      setContent("")
      setIsModified(false)
      setShowDiff(false)
    }
  }, [activeFileId, getNodeById, files])
  
  // Watch for changes in the specific file to update UI immediately
  useEffect(() => {
    if (activeFileId && files[activeFileId]) {
      const currentFile = files[activeFileId]
      if (currentFile && currentFile.type === 'file') {
        // Update file reference and content if they changed
        if (!file || currentFile.content !== file.content || currentFile.editedContent !== file.editedContent) {
          setFile(currentFile)
          setContent(currentFile.content || "")
          setIsModified(false)
          
          // Update diff state
          if (currentFile.editedContent) {
            setShowDiff(true)
          } else {
            setShowDiff(false)
          }
        }
      }
    }
  }, [activeFileId, files, file])
  
  // Calculate word and character count
  useEffect(() => {
    setCharCount(content.length)
    setWordCount(
      content.trim() === "" ? 0 : content.trim().split(/\s+/).length
    )
    
    if (file?.content !== content) {
      setIsModified(true)
    }
  }, [content, file])
  
  const handleSave = () => {
    if (activeFileId) {
      updateFileContent(activeFileId, content)
      setIsModified(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+S or Cmd+S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }
  
  const handleCopyText = () => {
    if (textareaRef.current) {
      // Select all text
      textareaRef.current.select()
      
      // Use the clipboard API to copy text
      navigator.clipboard.writeText(content)
        .then(() => {
          setCopySuccess(true)
          toast.success("Text copied to clipboard")
          
          // Reset copy success icon after 2 seconds
          setTimeout(() => setCopySuccess(false), 2000)
          
          // Deselect text after a brief delay
          setTimeout(() => {
            if (document.getSelection) {
              document.getSelection()?.removeAllRanges()
            }
          }, 500)
        })
        .catch(err => {
          toast.error("Failed to copy text")
          console.error('Failed to copy text: ', err)
        })
    }
  }
  
  // Handle accepting all changes from diff
  const handleAcceptAll = () => {
    if (activeFileId && file?.editedContent) {
      updateFileContent(activeFileId, file.editedContent)
      clearEditedContent(activeFileId)
      // Force immediate state update
      setContent(file.editedContent)
      setShowDiff(false)
      setIsModified(false)
      toast.success("All changes accepted")
    }
  }
  
  // Handle rejecting all changes from diff
  const handleRejectAll = () => {
    if (activeFileId && file) {
      clearEditedContent(activeFileId)
      // Force immediate state update to original content
      setContent(file.content || "")
      setShowDiff(false)
      toast.success("All changes rejected")
    }
  }
  


  if (!file || !editorOpen) return null

  return (
    <Dialog 
      open={editorOpen} 
      onOpenChange={(open) => {
        if (!open) {
          if (isModified) {
            handleSave()
          }
          closeEditor()
        }
      }}
    >
      <DialogContent 
        className="flex flex-col p-0 sm:max-w-[85vw] md:max-w-[75vw] min-h-[80vh] max-h-[80vh]"
      >
        <DialogHeader className="border-b px-4 py-2 flex flex-row items-center justify-between sticky top-0 bg-background z-10">
          <DialogTitle className="m-0 p-0 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {file?.name}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[60vw]">
                {file.path}
              </span>
            </div>
          </DialogTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-4">{charCount} characters</span>
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSave}
                disabled={!isModified}
                title="Save"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyText}
                title="Copy All Text"
              >
                {copySuccess ? (
                  <CheckCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <FileExport file={file} content={content} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={closeEditor}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto flex flex-col" style={{ height: 'calc(80vh - 57px)' }}>
          {showDiff && file?.editedContent ? (
            <div className="p-4">
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  AI Edit Suggestion
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {file.editPrompt}
                </p>
              </div>
              <DiffViewer
                originalText={file.content || ""}
                modifiedText={file.editedContent}
                onAcceptAll={handleAcceptAll}
                onRejectAll={handleRejectAll}
                className="border rounded-lg"
              />
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              className="min-h-full w-full h-full border-0 resize-none focus-visible:ring-0 p-4 text-sm font-mono flex-grow"
              placeholder="Start typing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: '1 1 auto',
                display: 'block',
                WebkitUserSelect: 'text', /* Safari */
                userSelect: 'text',
                MozUserSelect: 'text', /* Firefox */
                msUserSelect: 'text', /* IE/Edge */
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'rgba(0,0,0,0)',
              }}
              data-mobile-selectable="true"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
