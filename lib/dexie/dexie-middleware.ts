import { StateCreator } from 'zustand';
import { getAllChats, saveChat, getAllFiles, saveFile } from './db';
import { Chat } from '../gemini';
import { FileNode } from '../files/store';
import { debounce } from '../utils/debounce';

/**
 * Options for the Dexie middleware
 */
export interface DexieOptions<T> {
  /**
   * Name for the store (for logging purposes)
   */
  name: string;
  /**
   * Debounce interval in milliseconds for IndexedDB writes
   */
  debounceInterval?: number;
  /**
   * Function to extract a subset of the store state for persistence
   */
  partialize?: (state: T) => any;
  /**
   * Function called on initialization to load data from IndexedDB
   */
  onInitialize?: () => Promise<void>;
  /**
   * Function called after each sync to IndexedDB
   */
  onSync?: (state: any) => void;
}

/**
 * Interface for a state that has been enhanced with Dexie properties
 */
export type WithDexie<T> = T & {
  dexieInitialized: boolean;
  initializeDexie: () => Promise<void>;
}

/**
 * Dexie middleware for Zustand that synchronizes state with IndexedDB
 */
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
    
    // Create a debounced sync function
    const syncToDexie = debounce(async (state: T) => {
      try {
        const partialState = partialize(state);
        
        // Handle chat data persistence
        if (partialState && 'chats' in partialState && Array.isArray(partialState.chats)) {
          // Process each chat separately
          for (const chat of partialState.chats) {
            await saveChat(chat);
          }
        }
        
        // Handle file data persistence
        if (partialState && 'files' in partialState && partialState.files) {
          const files = partialState.files as Record<string, FileNode>;
          // Save each file separately
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
    
    // Create a wrapped set function that syncs to Dexie
    const dexieSet = (partial: any, replace?: boolean) => {
      // Call the original set function
      set(partial, replace);
      
      // Get current state
      const state = get();
      
      // Only sync if initialized
      if (state.dexieInitialized) {
        syncToDexie(state);
      }
    };
    
    // Initialize the base state with our custom set function
    const initialState = f(dexieSet, get, store);
    
    // Create a function to initialize Dexie
    const initializeDexie = async (): Promise<void> => {
      try {
        // Run optional initialization
        if (onInitialize) {
          await onInitialize();
        }
        
        // Load initial state from IndexedDB
        const chats = await getAllChats();
        const files = await getAllFiles();
        
        // Update the store with data from IndexedDB
        set((state: T) => ({ 
          ...state, 
          chats,
          files, 
          dexieInitialized: true 
        }));
      } catch (error) {
        console.error(`Error initializing ${name} from IndexedDB:`, error);
        // Still mark as initialized to allow writes
        set((state: T) => ({ ...state, dexieInitialized: true }));
      }
    };
    
    // Return the initial state with our Dexie extensions
    return {
      ...initialState,
      dexieInitialized: false,
      initializeDexie
    };
  };
