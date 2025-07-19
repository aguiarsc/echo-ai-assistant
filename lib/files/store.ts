"use client"

import { create } from "zustand"
// Remove localStorage persistence in favor of Dexie
// import { persist } from "zustand/middleware"
import { dexieMiddleware, WithDexie } from "../dexie/dexie-middleware"
import { deleteFile as deleteFileFromDB } from "../dexie/db"

export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  parentId: string | null
  path: string
  lastModified: number
  size?: number
  children?: string[] // IDs of child nodes
  editedContent?: string // AI-generated edited content for diff view
  editPrompt?: string // The edit prompt used to generate the edited content
}

export interface FilesState {
  files: Record<string, FileNode>
  activeFileId: string | null
  editorOpen: boolean

  // File operations
  createFile: (parentId: string | null, name: string) => string
  createFolder: (parentId: string | null, name: string) => string
  deleteNode: (id: string) => void
  renameNode: (id: string, newName: string) => void
  moveNode: (id: string, newParentId: string | null) => void
  updateFileContent: (id: string, content: string) => void
  setEditedContent: (id: string, editedContent: string, editPrompt: string) => void
  clearEditedContent: (id: string) => void
  getNodeById: (id: string) => FileNode | undefined
  getNodeChildren: (parentId: string | null) => FileNode[]
  getFolderPath: (id: string | null) => string
  getRootNodes: () => FileNode[]
  
  // UI states
  setActiveFileId: (id: string | null) => void
  openEditor: (id: string) => void
  closeEditor: () => void
}

// Create a type for the store with Dexie functionality
type FilesStoreWithDexie = FilesState & WithDexie<FilesState>;

// Create the store
export const useFilesStore = create<FilesStoreWithDexie>()(
  dexieMiddleware<FilesState>({
    name: 'files-store',
    debounceInterval: 500,
    // Specify which parts of the state should be persisted
    partialize: (state: FilesState) => ({ files: state.files }),
  })(
    (set, get) => ({
      files: {},
      activeFileId: null,
      editorOpen: false,

      createFile: (parentId: string | null, name: string) => {
        const id = crypto.randomUUID()
        const parentPath = get().getFolderPath(parentId)
        const path = `${parentPath}${name}`
        
        set((state) => {
          // Update parent if exists
          const newFiles = { ...state.files }
          if (parentId) {
            const parent = newFiles[parentId]
            if (parent) {
              newFiles[parentId] = {
                ...parent,
                children: [...(parent.children || []), id]
              }
            }
          }
          
          // Add new file
          newFiles[id] = {
            id,
            name,
            type: "file",
            parentId,
            path,
            content: "",
            lastModified: Date.now(),
            size: 0
          }
          
          return { files: newFiles }
        })
        
        return id
      },
      
      createFolder: (parentId: string | null, name: string) => {
        const id = crypto.randomUUID()
        const parentPath = get().getFolderPath(parentId)
        const path = `${parentPath}${name}/`
        
        set((state: FilesState) => {
          // Update parent if exists
          const newFiles = { ...state.files }
          if (parentId) {
            const parent = newFiles[parentId]
            if (parent) {
              newFiles[parentId] = {
                ...parent,
                children: [...(parent.children || []), id]
              }
            }
          }
          
          // Add new folder
          newFiles[id] = {
            id,
            name,
            type: "folder",
            parentId,
            path,
            children: [],
            lastModified: Date.now()
          }
          
          return { files: newFiles }
        })
        
        return id
      },
      
      deleteNode: (id: string) => {
        set((state: FilesState) => {
          const node = state.files[id]
          if (!node) return state
          
          const newFiles = { ...state.files }
          
          // Remove from parent's children array
          if (node.parentId && newFiles[node.parentId]) {
            const parent = newFiles[node.parentId]
            newFiles[node.parentId] = {
              ...parent,
              children: parent.children?.filter(cid => cid !== id) || []
            }
          }
          
          // Recursive function to delete a node and all its children
          const deleteNodeAndChildren = (nodeId: string) => {
            const nodeToDelete = newFiles[nodeId]
            if (!nodeToDelete) return
            
            // Delete children first if it's a folder
            if (nodeToDelete.type === 'folder' && nodeToDelete.children) {
              for (const childId of nodeToDelete.children) {
                deleteNodeAndChildren(childId)
              }
            }
            
            // Delete the node from IndexedDB
            deleteFileFromDB(nodeId).catch(error => {
              console.error('Error deleting file from IndexedDB:', error);
            });
            
            // Delete the node itself from state
            delete newFiles[nodeId]
          }
          
          // Start deletion process
          deleteNodeAndChildren(id)
          
          // Reset activeFileId if it was deleted
          const activeFileId = state.activeFileId === id ? null : state.activeFileId
          const editorOpen = state.activeFileId === id ? false : state.editorOpen
          
          return { files: newFiles, activeFileId, editorOpen }
        })
      },
      
      renameNode: (id: string, newName: string) => {
        set((state: FilesState) => {
          const node = state.files[id]
          if (!node) return state
          
          const newFiles = { ...state.files }
          const parentPath = get().getFolderPath(node.parentId)
          const newPath = `${parentPath}${newName}${node.type === 'folder' ? '/' : ''}`
          
          // Update the node with new name and path
          newFiles[id] = {
            ...node,
            name: newName,
            path: newPath,
            lastModified: Date.now()
          }
          
          // If it's a folder, update all its children paths as well
          if (node.type === 'folder') {
            const updateChildrenPaths = (nodeId: string, oldPath: string, newParentPath: string) => {
              const nodeToUpdate = newFiles[nodeId]
              if (!nodeToUpdate) return
              
              // Create new path by replacing the old parent path with the new one
              const childNewPath = nodeToUpdate.path.replace(oldPath, newParentPath)
              newFiles[nodeId] = { ...nodeToUpdate, path: childNewPath }
              
              // Recursively update all children
              if (nodeToUpdate.children) {
                for (const childId of nodeToUpdate.children) {
                  updateChildrenPaths(childId, oldPath, newParentPath)
                }
              }
            }
            
            // Start the update process for all children if there are any
            if (node.children && node.children.length > 0) {
              for (const childId of node.children) {
                updateChildrenPaths(childId, node.path, newPath)
              }
            }
          }
          
          return { files: newFiles }
        })
      },
      
      moveNode: (id: string, newParentId: string | null) => {
        set((state: FilesState) => {
          const node = state.files[id]
          if (!node) return state
          
          // Prevent moving a folder into itself or its descendants
          if (node.type === 'folder' && newParentId) {
            const isDescendant = (parentId: string | null, targetId: string): boolean => {
              if (parentId === targetId) return true
              const parent = state.files[parentId || '']
              if (!parent || parent.type !== 'folder') return false
              return parent.children?.some(childId => isDescendant(childId, targetId)) || false
            }
            
            if (isDescendant(newParentId, id)) {
              console.warn('Cannot move folder into itself or its descendants')
              return state
            }
          }
          
          // Don't move if already in the target location
          if (node.parentId === newParentId) return state
          
          const newFiles = { ...state.files }
          
          // Remove from old parent
          if (node.parentId) {
            const oldParent = newFiles[node.parentId]
            if (oldParent && oldParent.children) {
              newFiles[node.parentId] = {
                ...oldParent,
                children: oldParent.children.filter(childId => childId !== id)
              }
            }
          }
          
          // Add to new parent
          if (newParentId) {
            const newParent = newFiles[newParentId]
            if (newParent && newParent.type === 'folder') {
              newFiles[newParentId] = {
                ...newParent,
                children: [...(newParent.children || []), id]
              }
            }
          }
          
          // Update node's parent and path
          const newParentPath = get().getFolderPath(newParentId)
          const newPath = `${newParentPath}${node.name}${node.type === 'folder' ? '/' : ''}`
          
          newFiles[id] = {
            ...node,
            parentId: newParentId,
            path: newPath,
            lastModified: Date.now()
          }
          
          // If it's a folder, update all children paths recursively
          if (node.type === 'folder') {
            const updateChildrenPaths = (nodeId: string, oldPath: string, newParentPath: string) => {
              const nodeToUpdate = newFiles[nodeId]
              if (!nodeToUpdate) return
              
              const childNewPath = nodeToUpdate.path.replace(oldPath, newParentPath)
              newFiles[nodeId] = { ...nodeToUpdate, path: childNewPath }
              
              if (nodeToUpdate.children) {
                for (const childId of nodeToUpdate.children) {
                  updateChildrenPaths(childId, oldPath, newParentPath)
                }
              }
            }
            
            if (node.children && node.children.length > 0) {
              for (const childId of node.children) {
                updateChildrenPaths(childId, node.path, newPath)
              }
            }
          }
          
          return { files: newFiles }
        })
      },
      
      updateFileContent: (id: string, content: string) => {
        set((state: FilesState) => {
          const node = state.files[id]
          if (!node || node.type !== 'file') return state
          
          return {
            files: {
              ...state.files,
              [id]: {
                ...node,
                content,
                lastModified: Date.now(),
                size: new Blob([content]).size
              }
            }
          }
        })
      },
      
      setEditedContent: (id: string, editedContent: string, editPrompt: string) => {
        set((state: FilesState) => {
          const node = state.files[id]
          if (!node || node.type !== 'file') return state
          
          return {
            files: {
              ...state.files,
              [id]: {
                ...node,
                editedContent,
                editPrompt
              }
            }
          }
        })
      },
      
      clearEditedContent: (id: string) => {
        set((state: FilesState) => {
          const node = state.files[id]
          if (!node || node.type !== 'file') return state
          
          return {
            files: {
              ...state.files,
              [id]: {
                ...node,
                editedContent: undefined,
                editPrompt: undefined
              }
            }
          }
        })
      },
      
      getNodeById: (id: string) => {
        return get().files[id]
      },
      
      getNodeChildren: (parentId: string | null) => {
        const { files } = get()
        const parent = parentId ? files[parentId] : null
        
        if (!parent && parentId !== null) return []
        
        // If parent is null, return root nodes
        if (parentId === null) {
          return Object.values(files).filter(file => file.parentId === null)
        }
        
        // Return children of specified parent
        return (parent?.children || [])
          .map(id => files[id])
          .filter(Boolean)
          .sort((a: FileNode, b: FileNode) => {
            // Sort folders first, then files
            if (a.type === 'folder' && b.type === 'file') return -1
            if (a.type === 'file' && b.type === 'folder') return 1
            // Sort alphabetically within same type
            return a.name.localeCompare(b.name)
          })
      },
      
      getFolderPath: (id: string | null) => {
        if (id === null) return '/' // Root path
        
        const node = get().files[id]
        if (!node) return '/'
        
        return node.type === 'folder' ? node.path : node.path.substring(0, node.path.lastIndexOf('/') + 1)
      },
      
      getRootNodes: () => {
        return get().getNodeChildren(null)
      },
      
      setActiveFileId: (id: string | null) => {
        set({ activeFileId: id })
      },
      
      openEditor: (id: string) => {
        set({ activeFileId: id, editorOpen: true })
      },
      
      closeEditor: () => {
        set({ editorOpen: false })
      }
    })
  )
)
