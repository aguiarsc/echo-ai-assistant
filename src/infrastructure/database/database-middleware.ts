import { StateCreator } from 'zustand';
import { getAllChats, saveChat, getAllFiles, saveFile } from './database-client';
import { Chat } from '@/domains/conversations/types/conversation.types';
import { FileNode } from '@/domains/writing-projects/storage/project-store';
import { debounce } from '@/shared/utilities/debounce';

export interface DexieOptions<T> {
  name: string;
  debounceInterval?: number;
  partialize?: (state: T) => any;
  onInitialize?: () => Promise<void>;
  onSync?: (state: any) => void;
}

export type WithDexie<T> = T & {
  dexieInitialized: boolean;
  initializeDexie: () => Promise<void>;
}

export const dexieMiddleware = <T>(options: DexieOptions<T>) => 
  (f: StateCreator<T>) => 
  (set: any, get: any, store: any): T & { dexieInitialized: boolean; initializeDexie: () => Promise<void> } => {
    const {
      name = 'dexie-store',
      debounceInterval = 1000,
      partialize = (state: T) => state,
      onInitialize,
      onSync
    } = options;
    
    const syncToDexie = debounce(async (state: T) => {
      try {
        const partialState = partialize(state);
        
        if (partialState && 'chats' in partialState && Array.isArray(partialState.chats)) {
          for (const chat of partialState.chats) {
            await saveChat(chat);
          }
        }
        
        if (partialState && 'files' in partialState && partialState.files) {
          const files = partialState.files as Record<string, FileNode>;
          for (const fileId in files) {
            await saveFile(files[fileId]);
          }
        }
        
        if (onSync) {
          onSync(partialState);
        }
      } catch (error) {
        console.error(`Error syncing ${name} to IndexedDB:`, error);
      }
    }, debounceInterval);
    
    const dexieSet = (partial: any, replace?: boolean) => {
      set(partial, replace);
      
      const state = get();
      
      if (state.dexieInitialized) {
        syncToDexie(state);
      }
    };
    
    const initialState = f(dexieSet, get, store);
    
    const initializeDexie = async (): Promise<void> => {
      try {
        if (onInitialize) {
          await onInitialize();
        }
        
        const chats = await getAllChats();
        const files = await getAllFiles();
        
        set((state: T) => ({ 
          ...state, 
          chats,
          files, 
          dexieInitialized: true 
        }));
      } catch (error) {
        console.error(`Error initializing ${name} from IndexedDB:`, error);
        set((state: T) => ({ ...state, dexieInitialized: true }));
      }
    };
    
    return {
      ...initialState,
      dexieInitialized: false,
      initializeDexie
    };
  };
