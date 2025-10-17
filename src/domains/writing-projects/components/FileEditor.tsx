"use client"

import React, { useState, useEffect, useRef } from "react"
import { useFilesStore, FileNode } from "@/domains/writing-projects/storage/project-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui-components/dialog"
import { Button } from "@/shared/ui-components/button"
import { Textarea } from "@/shared/ui-components/textarea"
import { X, FileText, Save, Copy, CheckCheck } from "lucide-react"
import { cn } from "@/shared/utilities/class-name-merger"
import { FileExport } from "./file-export"
import { DiffViewer } from "./DiffViewer"
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
  
  useEffect(() => {
    if (activeFileId) {
      const currentFile = getNodeById(activeFileId)
      if (currentFile && currentFile.type === 'file') {
        setFile(currentFile)
        setContent(currentFile.content || "")
        setIsModified(false)
        
        if (currentFile.editedContent) {
          setShowDiff(true)
        } else {
          setShowDiff(false)
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
  
  useEffect(() => {
    if (activeFileId && files[activeFileId]) {
      const currentFile = files[activeFileId]
      if (currentFile && currentFile.type === 'file') {
        if (!file || currentFile.content !== file.content || currentFile.editedContent !== file.editedContent) {
          setFile(currentFile)
          setContent(currentFile.content || "")
          setIsModified(false)
          
          if (currentFile.editedContent) {
            setShowDiff(true)
          } else {
            setShowDiff(false)
          }
        }
      }
    }
  }, [activeFileId, files, file])
  
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
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }
  
  const handleCopyText = () => {
    if (textareaRef.current) {
      textareaRef.current.select()
      
      navigator.clipboard.writeText(content)
        .then(() => {
          setCopySuccess(true)
          toast.success("Text copied to clipboard")
          
          setTimeout(() => setCopySuccess(false), 2000)
          
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
  
  const handleAcceptAll = () => {
    if (activeFileId && file?.editedContent) {
      updateFileContent(activeFileId, file.editedContent)
      clearEditedContent(activeFileId)
      setContent(file.editedContent)
      setShowDiff(false)
      setIsModified(false)
      toast.success("All changes accepted")
    }
  }
  
  const handleRejectAll = () => {
    if (activeFileId && file) {
      clearEditedContent(activeFileId)
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
                WebkitUserSelect: 'text',
                userSelect: 'text',
                MozUserSelect: 'text',
                msUserSelect: 'text',
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
