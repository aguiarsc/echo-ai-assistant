"use client"

import React, { useState, useRef } from "react"
import { useFilesStore } from "@/lib/files/stores"
import { useFileContextStore } from "@/lib/files/stores"
import { FileNode } from "@/lib/files/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  Plus, 
  Trash, 
  Edit,
  FileCode,
  FileText,
  MessageSquare,
  Check,
  HelpCircle,
  Command,
  Move
} from "lucide-react"
import { cn } from "@/lib/shared/utils/cn.utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileTreeProps {
  parentId?: string | null
  level?: number
  className?: string
}

interface ExpandedState {
  [key: string]: boolean
}

// Get file icon based on file extension
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch(extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className="h-4 w-4 shrink-0 text-yellow-500 mr-2" />
    case 'md':
    case 'txt':
      return <FileText className="h-4 w-4 shrink-0 text-blue-500 mr-2" />
    default:
      return <File className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
  }
}

export function FileTree({ parentId = null, level = 0, className }: FileTreeProps) {
  const { 
    getNodeChildren, 
    createFile, 
    createFolder, 
    deleteNode, 
    renameNode,
    moveNode,
    openEditor
  } = useFilesStore()
  
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [newItemType, setNewItemType] = useState<null | 'file' | 'folder'>(null)
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [pendingOperation, setPendingOperation] = useState<{
    type: 'create' | 'rename',
    nodeId?: string,
    itemType?: 'file' | 'folder'
  } | null>(null)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null)
  
  const nodes = getNodeChildren(parentId)
  const inputRef = useRef<HTMLInputElement>(null)
  const operationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }
  
  const handleCreateClick = (type: 'file' | 'folder', parentId: string | null) => {
    // Clear any pending operations first
    if (operationTimeoutRef.current) {
      clearTimeout(operationTimeoutRef.current)
      operationTimeoutRef.current = null
    }
    
    // Set the state for creation
    setNewItemType(type)
    setNewItemParentId(parentId)
    setInputValue("")
    
    // Expand the parent folder if it's not already expanded
    if (parentId) {
      setExpanded(prev => ({
        ...prev,
        [parentId]: true
      }))
    }
    
    // Focus the input after state update with a more reliable approach
    operationTimeoutRef.current = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
      operationTimeoutRef.current = null
    }, 150) // Longer timeout for more reliable focus
  }
  
  const handleCreateSubmit = () => {
    if (inputValue.trim() === "" || !newItemType || newItemParentId === undefined) {
      cancelCreation()
      return
    }
    
    try {
      if (newItemType === 'file') {
        createFile(newItemParentId, inputValue.trim())
      } else {
        createFolder(newItemParentId, inputValue.trim())
        // Auto-expand the parent folder
        if (newItemParentId) {
          setExpanded(prev => ({ ...prev, [newItemParentId]: true }))
        }
      }
    } catch (error) {
      console.error("Error creating item:", error)
    } finally {
      cancelCreation()
    }
  }
  
  const handleRenameClick = (node: FileNode) => {
    // Clear any pending operations first
    if (operationTimeoutRef.current) {
      clearTimeout(operationTimeoutRef.current)
      operationTimeoutRef.current = null
    }
    
    // Set the state for renaming
    setEditingNodeId(node.id)
    setInputValue(node.name)
    
    // Make sure parent folder is expanded if this is inside a folder
    if (node.parentId) {
      setExpanded(prev => ({
        ...prev,
        [node.parentId as string]: true
      }))
    }
    
    // Focus the input after state updates with a more reliable approach
    operationTimeoutRef.current = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
      operationTimeoutRef.current = null
    }, 150) // Longer timeout for more reliable focus
  }
  
  const handleRenameSubmit = () => {
    if (inputValue.trim() === "" || !editingNodeId) {
      cancelRenaming()
      return
    }
    
    renameNode(editingNodeId, inputValue.trim())
    cancelRenaming()
  }
  
  const cancelCreation = () => {
    // Clear pending operation timeout if exists
    if (operationTimeoutRef.current) {
      clearTimeout(operationTimeoutRef.current)
      operationTimeoutRef.current = null
    }
    
    setNewItemType(null)
    setNewItemParentId(null)
    setInputValue("")
  }
  
  const cancelRenaming = () => {
    // Clear pending operation timeout if exists
    if (operationTimeoutRef.current) {
      clearTimeout(operationTimeoutRef.current)
      operationTimeoutRef.current = null
    }
    
    setEditingNodeId(null)
    setInputValue("")
  }
  
  const confirmDelete = (nodeId: string) => {
    setNodeToDelete(nodeId)
    setDeleteConfirmOpen(true)
  }
  
  const handleDelete = () => {
    if (nodeToDelete) {
      deleteNode(nodeToDelete)
      setNodeToDelete(null)
      setDeleteConfirmOpen(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent, action: 'create' | 'rename') => {
    if (e.key === 'Enter') {
      action === 'create' ? handleCreateSubmit() : handleRenameSubmit()
    } else if (e.key === 'Escape') {
      action === 'create' ? cancelCreation() : cancelRenaming()
    }
  }

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNodeId(nodeId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', nodeId)
  }

  const handleDragEnd = () => {
    // Clear all drag states
    setDraggedNodeId(null)
    setDragOverNodeId(null)
  }

  // Global drag end handler to ensure cleanup
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedNodeId(null)
      setDragOverNodeId(null)
    }

    const handleGlobalMouseUp = () => {
      // Clear drag states on mouse up as a fallback
      if (draggedNodeId) {
        setDraggedNodeId(null)
        setDragOverNodeId(null)
      }
    }

    // Add global event listeners
    document.addEventListener('dragend', handleGlobalDragEnd)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mouseleave', handleGlobalDragEnd)

    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mouseleave', handleGlobalDragEnd)
    }
  }, [draggedNodeId])

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Don't allow dropping on itself
    if (draggedNodeId === nodeId) return
    
    // Allow dropping on any node (files will use their parent folder)
    setDragOverNodeId(nodeId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverNodeId(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const draggedId = e.dataTransfer.getData('text/plain')
    
    if (!draggedId || draggedId === targetNodeId) {
      setDraggedNodeId(null)
      setDragOverNodeId(null)
      return
    }
    
    // Determine the new parent ID based on the target
    let newParentId: string | null
    
    if (targetNodeId === 'root') {
      newParentId = null
    } else {
      const targetNode = useFilesStore.getState().getNodeById(targetNodeId)
      if (!targetNode) {
        setDraggedNodeId(null)
        setDragOverNodeId(null)
        return
      }
      
      // If dropping on a folder, use the folder as parent
      // If dropping on a file, use the file's parent as parent
      newParentId = targetNode.type === 'folder' ? targetNodeId : targetNode.parentId
    }
    
    // Get the dragged node to check for invalid moves
    const draggedNode = useFilesStore.getState().getNodeById(draggedId)
    if (!draggedNode) {
      setDraggedNodeId(null)
      setDragOverNodeId(null)
      return
    }
    
    // Don't move if already in the target location
    if (draggedNode.parentId === newParentId) {
      setDraggedNodeId(null)
      setDragOverNodeId(null)
      return
    }
    
    // Prevent moving a folder into itself or its descendants
    if (draggedNode.type === 'folder' && newParentId) {
      const isDescendant = (parentId: string | null, targetId: string): boolean => {
        if (parentId === targetId) return true
        const parent = useFilesStore.getState().getNodeById(parentId || '')
        if (!parent || parent.type !== 'folder') return false
        return parent.children?.some(childId => isDescendant(childId, targetId)) || false
      }
      
      if (isDescendant(newParentId, draggedId)) {
        console.warn('Cannot move folder into itself or its descendants')
        setDraggedNodeId(null)
        setDragOverNodeId(null)
        return
      }
    }
    
    // Perform the move
    moveNode(draggedId, newParentId)
    
    // Expand the target folder if it's not already expanded
    if (newParentId) {
      setExpanded(prev => ({
        ...prev,
        [newParentId]: true
      }))
    }
    
    setDraggedNodeId(null)
    setDragOverNodeId(null)
  }

  // New item creation form at the current level
  const renderNewItemInput = () => {
    if (newItemType !== null && newItemParentId === parentId) {
      return (
        <div className="flex items-center pl-6 py-1">
          {newItemType === 'folder' 
            ? <Folder className="h-4 w-4 shrink-0 text-blue-500 mr-2" /> 
            : <File className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
          }
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'create')}
            onBlur={handleCreateSubmit}
            placeholder={`New ${newItemType} name`}
            className="h-6 py-1 text-xs"
            autoFocus
          />
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div 
        className={cn("min-h-0", className)}
        onDragOver={(e) => {
          if (parentId === null && draggedNodeId) {
            handleDragOver(e, 'root')
          }
        }}
        onDragLeave={(e) => {
          if (parentId === null) {
            handleDragLeave(e)
          }
        }}
        onDrop={(e) => {
          if (parentId === null) {
            handleDrop(e, 'root')
          }
        }}
      >
        <div className={cn(
          "space-y-1",
          parentId === null && dragOverNodeId === 'root' ? "bg-primary/10 border-2 border-dashed border-primary/50 rounded-md p-2" : ""
        )}>
          {nodes.map((node) => (
            <div key={node.id}>
              <ContextMenu onOpenChange={setContextMenuOpen}>
                <ContextMenuTrigger>
                  <div
                    draggable={editingNodeId !== node.id}
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, node.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, node.id)}
                    className={cn(
                      "flex items-center py-1 px-2 rounded-md hover:bg-accent/50 select-none transition-colors",
                      editingNodeId === node.id ? "bg-accent/70" : "",
                      draggedNodeId === node.id ? "opacity-50 cursor-grabbing" : "cursor-pointer",
                      draggedNodeId && draggedNodeId !== node.id ? "cursor-grab" : "",
                      dragOverNodeId === node.id ? (
                        node.type === 'folder' 
                          ? "bg-primary/20 border-2 border-primary/50" 
                          : "bg-secondary/50 border-l-4 border-primary"
                      ) : ""
                    )}
                    onClick={() => node.type === 'folder' ? toggleExpand(node.id) : openEditor(node.id)}
                  >
                    <div className="w-4 mr-1 flex justify-center">
                      {node.type === 'folder' && (
                        expanded[node.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )
                      )}
                    </div>

                    {node.type === 'folder' ? (
                      <Folder className="h-4 w-4 shrink-0 text-blue-500 mr-2" />
                    ) : (
                      getFileIcon(node.name)
                    )}

                    {editingNodeId === node.id ? (
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'rename')}
                        onBlur={handleRenameSubmit}
                        className="h-6 py-1 text-xs"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="text-sm truncate">{node.name}</span>
                        {useFileContextStore.getState().isSelected(node.id) && (
                          <Badge variant="outline" className="ml-2 px-1 py-0 h-5 bg-primary/10">
                            <Check className="h-3 w-3 text-primary mr-1" />
                            <span className="text-xs">Context</span>
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-48">
                  {/* Add to Chat Context option */}
                  <ContextMenuItem 
                    onSelect={() => {
                      // Toggle file selection for chat context
                      useFileContextStore.getState().toggleSelection(node.id)
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {useFileContextStore.getState().isSelected(node.id) 
                      ? "Remove from Chat Context" 
                      : "Add to Chat Context"}
                  </ContextMenuItem>
                  <ContextMenuSeparator />

                  {node.type === 'folder' && (
                    <>
                      <ContextMenuItem 
                        onSelect={() => {
                          // Set pending operation and clear any existing timeouts
                          if (operationTimeoutRef.current) {
                            clearTimeout(operationTimeoutRef.current)
                          }
                          
                          // Use requestAnimationFrame for better timing with UI updates
                          requestAnimationFrame(() => {
                            // Delay to let the menu close and UI update
                            operationTimeoutRef.current = setTimeout(() => {
                              handleCreateClick('file', node.id)
                            }, 100)
                          })
                        }}
                      >
                        <File className="h-4 w-4 mr-2" />
                        New File
                      </ContextMenuItem>
                      <ContextMenuItem 
                        onSelect={() => {
                          // Set pending operation and clear any existing timeouts
                          if (operationTimeoutRef.current) {
                            clearTimeout(operationTimeoutRef.current)
                          }
                          
                          // Use requestAnimationFrame for better timing with UI updates
                          requestAnimationFrame(() => {
                            // Delay to let the menu close and UI update
                            operationTimeoutRef.current = setTimeout(() => {
                              handleCreateClick('folder', node.id)
                            }, 100)
                          })
                        }}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        New Folder
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                    </>
                  )}
                  <ContextMenuItem 
                    onSelect={() => {
                      // Set pending operation and clear any existing timeouts
                      if (operationTimeoutRef.current) {
                        clearTimeout(operationTimeoutRef.current)
                      }
                      
                      // Use requestAnimationFrame for better timing with UI updates
                      requestAnimationFrame(() => {
                        // Delay to let the menu close and UI update
                        operationTimeoutRef.current = setTimeout(() => {
                          handleRenameClick(node)
                        }, 100)
                      })
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onSelect={() => confirmDelete(node.id)}
                    className="text-red-500 hover:text-red-500 focus:text-red-500"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              {/* Render children if this is a folder and it's expanded */}
              {node.type === 'folder' && expanded[node.id] && (
                <>
                  <FileTree 
                    parentId={node.id} 
                    level={level + 1} 
                    className="ml-4 pl-2 border-l border-border/50"
                  />
                  
                  {/* New item creation within an expanded folder */}
                  {newItemType !== null && newItemParentId === node.id && (
                    <div className="ml-4 pl-2 border-l border-border/50">
                      <div className="flex items-center pl-6 py-1">
                        {newItemType === 'folder' 
                          ? <Folder className="h-4 w-4 shrink-0 text-blue-500 mr-2" /> 
                          : <File className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
                        }
                        <Input
                          ref={inputRef}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, 'create')}
                          onBlur={handleCreateSubmit}
                          placeholder={`New ${newItemType} name`}
                          className="h-6 py-1 text-xs"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          
          {/* Render new item input at root level */}
          {renderNewItemInput()}
          
          {/* Add new file/folder buttons only at root level */}
          {parentId === null && (
            <>
              {nodes.length === 0 && newItemType === null && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No files yet. Create your first file or folder to get started.
                </div>
              )}
              
              <div className="flex flex-col gap-2 pt-2 px-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs flex-1"
                    onClick={() => handleCreateClick('file', parentId)}
                  >
                    <File className="h-3 w-3 mr-1" />
                    New File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs flex-1"
                    onClick={() => handleCreateClick('folder', parentId)}
                  >
                    <Folder className="h-3 w-3 mr-1" />
                    New Folder
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item
              {nodeToDelete && useFilesStore.getState().getNodeById(nodeToDelete)?.type === 'folder' && 
                ' and all its contents'}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNodeToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Clean up function to handle component unmounting
const useCleanup = (ref: React.MutableRefObject<NodeJS.Timeout | null>) => {
  React.useEffect(() => {
    // Cleanup function to clear any pending timeouts on unmount
    return () => {
      if (ref.current) {
        clearTimeout(ref.current)
        ref.current = null
      }
    }
  }, [])
}

export function FileTreeContainer() {
  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <FileTree />
      </div>
    </ScrollArea>
  )
}
