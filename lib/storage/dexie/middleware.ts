import { StateCreator } from 'zustand';
import { getAllChats, saveChat, getAllFiles, saveFile } from './database.service';
import { Chat } from '@/lib/chat/types';
import { FileNode } from '@/lib/files/types';
import { debounce } from '@/lib/shared/utils/debounce.utils';

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
  partialize?: (state: T) => unknown;
  /**
   * Function called on initialization to load data from IndexedDB
   */
  onInitialize?: () => Promise<void>;
  /**
   * Function called after each sync to IndexedDB
   */
  onSync?: (state: unknown) => void;
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
export const dexieMiddleware = <T extends object>(options: DexieOptions<T>) =>
  (f: StateCreator<T>) =>
    (set: Parameters<StateCreator<T>>[0], get: Parameters<StateCreator<T>>[1], store: Parameters<StateCreator<T>>[2]): T & { dexieInitialized: boolean; initializeDexie: () => Promise<void> } => {
      const {
        name = 'dexie-store',
        debounceInterval = 1000,
        partialize = (state: T) => state,
        onInitialize,
        onSync
      } = options;

      // Create a sync function
      const syncToDexieImpl = async (state: T) => {
        try {
          const partialState = partialize(state) as Record<string, unknown>;

          // Handle chat data persistence
          if (partialState && typeof partialState === 'object' && 'chats' in partialState && Array.isArray(partialState.chats)) {
            // Process each chat separately
            for (const chat of partialState.chats) {
              await saveChat(chat);
            }
          }

          // Handle file data persistence
          if (partialState && typeof partialState === 'object' && 'files' in partialState && partialState.files) {
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
      };

      // Create a debounced version - cast to bypass type checking since debounce uses unknown
      const syncToDexie = debounce(syncToDexieImpl as (...args: unknown[]) => unknown, debounceInterval) as unknown as (state: T) => void;

      // Create a wrapped set function that syncs to Dexie
      const dexieSet: typeof set = (partial, replace?) => {
        // Call the original set function
        if (replace === true) {
          set(partial as T, replace);
        } else {
          set(partial, replace);
        }

        // Get current state
        const state = get();

        // Only sync if initialized
        if ('dexieInitialized' in state && (state as { dexieInitialized: boolean }).dexieInitialized) {
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
