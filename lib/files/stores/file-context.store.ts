"use client"

import { create } from "zustand"
import { dexieMiddleware, WithDexie } from "@/lib/storage/dexie/middleware"
import { FileNode } from "../types"

export interface FileContextState {
  // Selected files and folders to be used as context
  selectedFileIds: string[]
  
  // Operations
  selectFile: (id: string) => void
  unselectFile: (id: string) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
  toggleSelection: (id: string) => void
  
  // Context preparation
  getSelectedFiles: () => FileNode[]
  getFileContent: (id: string) => string | null
}

// Create a type for the store with Dexie functionality
type FileContextStoreWithDexie = FileContextState & WithDexie<FileContextState>;

// Create a store to manage file selection for chat context
export const useFileContextStore = create<FileContextStoreWithDexie>()(
  dexieMiddleware<FileContextState>({
    name: 'file-context-storage',
    debounceInterval: 500,
    // Specify which parts of the state should be persisted
    partialize: (state: FileContextState) => ({ selectedFileIds: state.selectedFileIds })
  })(
    (set, get) => ({
      selectedFileIds: [],
      
      selectFile: (id: string) => {
        set((state: FileContextState) => ({
          selectedFileIds: state.selectedFileIds.includes(id)
            ? state.selectedFileIds
            : [...state.selectedFileIds, id]
        }))
      },
      
      unselectFile: (id: string) => {
        set((state: FileContextState) => ({
          selectedFileIds: state.selectedFileIds.filter(fileId => fileId !== id)
        }))
      },
      
      clearSelection: () => {
        set({ selectedFileIds: [] })
      },
      
      isSelected: (id: string) => {
        return get().selectedFileIds.includes(id)
      },
      
      toggleSelection: (id: string) => {
        if (get().isSelected(id)) {
          get().unselectFile(id)
        } else {
          get().selectFile(id)
        }
      },
      
      getSelectedFiles: () => {
        const selectedIds = get().selectedFileIds
        // This requires access to the files store
        const filesStore = require('./file-tree.store').useFilesStore.getState()
        
        return selectedIds
          .map(id => filesStore.getNodeById(id))
          .filter(file => file !== undefined) as FileNode[]
      },
      
      getFileContent: (id: string) => {
        const filesStore = require('./file-tree.store').useFilesStore.getState()
        const file = filesStore.getNodeById(id)
        
        if (file && file.type === "file") {
          return file.content || null
        }
        
        return null
      }
    })
  )
)
