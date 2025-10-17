"use client"

import { create } from "zustand"
import { dexieMiddleware, WithDexie } from "@/infrastructure/database/database-middleware"
import { FileNode } from "./project-store"

export interface FileContextState {
  selectedFileIds: string[]
  
  selectFile: (id: string) => void
  unselectFile: (id: string) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
  toggleSelection: (id: string) => void
  
  getSelectedFiles: () => FileNode[]
  getFileContent: (id: string) => string | null
}

type FileContextStoreWithDexie = FileContextState & WithDexie<FileContextState>;

export const useFileContextStore = create<FileContextStoreWithDexie>()(
  dexieMiddleware<FileContextState>({
    name: 'file-context-storage',
    debounceInterval: 500,
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
        const filesStore = require('./project-store').useFilesStore.getState()
        
        return selectedIds
          .map(id => filesStore.getNodeById(id))
          .filter(file => file !== undefined) as FileNode[]
      },
      
      getFileContent: (id: string) => {
        const filesStore = require('./project-store').useFilesStore.getState()
        const file = filesStore.getNodeById(id)
        
        if (file && file.type === "file") {
          return file.content || null
        }
        
        return null
      }
    })
  )
)
