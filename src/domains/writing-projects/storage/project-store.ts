"use client"

import { create } from "zustand"
import { dexieMiddleware, WithDexie } from "@/infrastructure/database/database-middleware"
import { deleteFile as deleteFileFromDB } from "@/infrastructure/database/database-client"

export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  parentId: string | null
  path: string
  lastModified: number
  size?: number
  children?: string[]
  editedContent?: string
  editPrompt?: string
}

export interface FilesState {
  files: Record<string, FileNode>
  activeFileId: string | null
  editorOpen: boolean

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
  
  setActiveFileId: (id: string | null) => void
  openEditor: (id: string) => void
  closeEditor: () => void
}

type FilesStoreWithDexie = FilesState & WithDexie<FilesState>;

export const useFilesStore = create<FilesStoreWithDexie>()(
  dexieMiddleware<FilesState>({
    name: 'files-store',
    debounceInterval: 500,
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
          
          if (node.parentId && newFiles[node.parentId]) {
            const parent = newFiles[node.parentId]
            newFiles[node.parentId] = {
              ...parent,
              children: parent.children?.filter(cid => cid !== id) || []
            }
          }
          
          const deleteNodeAndChildren = (nodeId: string) => {
            const nodeToDelete = newFiles[nodeId]
            if (!nodeToDelete) return
            
            if (nodeToDelete.type === 'folder' && nodeToDelete.children) {
              for (const childId of nodeToDelete.children) {
                deleteNodeAndChildren(childId)
              }
            }
            
            deleteFileFromDB(nodeId).catch(error => {
              console.error('Error deleting file from IndexedDB:', error);
            });
            
            delete newFiles[nodeId]
          }
          
          deleteNodeAndChildren(id)
          
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
          
          newFiles[id] = {
            ...node,
            name: newName,
            path: newPath,
            lastModified: Date.now()
          }
          
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
      
      moveNode: (id: string, newParentId: string | null) => {
        set((state: FilesState) => {
          const node = state.files[id]
          if (!node) return state
          
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
          
          if (node.parentId === newParentId) return state
          
          const newFiles = { ...state.files }
          
          if (node.parentId) {
            const oldParent = newFiles[node.parentId]
            if (oldParent && oldParent.children) {
              newFiles[node.parentId] = {
                ...oldParent,
                children: oldParent.children.filter(childId => childId !== id)
              }
            }
          }
          
          if (newParentId) {
            const newParent = newFiles[newParentId]
            if (newParent && newParent.type === 'folder') {
              newFiles[newParentId] = {
                ...newParent,
                children: [...(newParent.children || []), id]
              }
            }
          }
          
          const newParentPath = get().getFolderPath(newParentId)
          const newPath = `${newParentPath}${node.name}${node.type === 'folder' ? '/' : ''}`
          
          newFiles[id] = {
            ...node,
            parentId: newParentId,
            path: newPath,
            lastModified: Date.now()
          }
          
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
        
        if (parentId === null) {
          return Object.values(files).filter(file => file.parentId === null)
        }
        
        return (parent?.children || [])
          .map(id => files[id])
          .filter(Boolean)
          .sort((a: FileNode, b: FileNode) => {
            if (a.type === 'folder' && b.type === 'file') return -1
            if (a.type === 'file' && b.type === 'folder') return 1
            return a.name.localeCompare(b.name)
          })
      },
      
      getFolderPath: (id: string | null) => {
        if (id === null) return '/'
        
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
