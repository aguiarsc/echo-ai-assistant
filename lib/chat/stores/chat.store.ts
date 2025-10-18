/**
 * Chat store - manages chat state and operations
 */

import { create } from "zustand";
import { nanoid } from "nanoid";
import { Chat, ChatMessage, TokenCount } from "@/lib/chat/types";
import { GeminiModel, GenerationParams, DEFAULT_GENERATION_PARAMS } from "@/lib/ai/gemini/types";
import { dexieMiddleware } from "@/lib/storage/dexie/middleware";
import { migrateFromLocalStorage, deleteChat as deleteChatFromDB } from "@/lib/storage/dexie/database.service";

interface ChatStore {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  chats: Chat[];
  activeChat: string | null;
  generationParams: GenerationParams;
  isStreaming: boolean;
  userAvatar: string;
  geminiAvatar: string;
  globalSystemInstruction: string;
  autoGenerateTitles: boolean;
  setUserAvatar: (avatar: string) => void;
  setGeminiAvatar: (avatar: string) => void;
  setGlobalSystemInstruction: (instruction: string) => void;
  setAutoGenerateTitles: (enabled: boolean) => void;
  
  // Chat management
  setActiveChat: (id: string | null) => void;
  createChat: (model: GeminiModel) => string;
  deleteChat: (id: string) => void;
  clearChats: () => void;
  updateChatTitle: (id: string, title: string) => void;
  renameChat: (id: string, title: string) => void;
  setModel: (id: string, model: GeminiModel) => void;
  setSystemInstruction: (id: string, instruction: string) => void;
  
  // Chat pinning and autodeletion
  pinChat: (id: string) => void;
  unpinChat: (id: string) => void;
  cleanupOldChats: () => void; // Delete chats older than 48h that aren't pinned
  
  // Message management
  addMessage: (chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (chatId: string, messageId: string, content: string, append?: boolean, groundingMetadata?: any) => void;
  setTokenCount: (chatId: string, counts: TokenCount) => void;
  
  // Generation settings
  setGenerationParams: (params: Partial<GenerationParams>) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  
  // For importing/exporting
  setChatData: (chats: Chat[]) => void;
}

// Add type for the store with Dexie extension methods
type WithDexie = ChatStore & {
  initializeDexie: () => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
  dexieMiddleware<ChatStore>({
    name: 'gemini-chatbox-store',
    debounceInterval: 500,
    partialize: (state) => ({
      chats: state.chats
    }),
    onInitialize: async () => {
      // Try to migrate data from localStorage to IndexedDB if not done already
      const migrationFlag = localStorage.getItem('migrated-to-indexeddb');
      if (!migrationFlag) {
        const migrated = await migrateFromLocalStorage();
        if (migrated) {
          console.log('Successfully migrated data from localStorage to IndexedDB');
          localStorage.setItem('migrated-to-indexeddb', 'true');
        }
      }
    }
  })(
    (set, get) => ({
      apiKey: "",
      chats: [],
      activeChat: null,
      generationParams: DEFAULT_GENERATION_PARAMS,
      isStreaming: false,
      userAvatar: "/avatars/03.svg",
      geminiAvatar: "/avatars/20.svg",
      globalSystemInstruction: "",
      autoGenerateTitles: true,
      
      setApiKey: (apiKey) => set({ apiKey }),
      setUserAvatar: (avatar) => set({ userAvatar: avatar }),
      setGeminiAvatar: (avatar) => set({ geminiAvatar: avatar }),
      setGlobalSystemInstruction: (instruction) => set({ globalSystemInstruction: instruction }),
      setAutoGenerateTitles: (enabled) => set({ autoGenerateTitles: enabled }),
      
      setActiveChat: (id) => set({ activeChat: id }),
      
      createChat: (model) => {
        const newChatId = nanoid();
        const newChat: Chat = {
          id: newChatId,
          title: "New Chat",
          messages: [],
          model,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          titleGenerated: undefined, // Will auto-generate after 3+ messages
        };
        
        set(state => ({
          chats: [newChat, ...state.chats],
          activeChat: newChatId
        }));
        
        return newChatId;
      },
      
      deleteChat: (id) => {
        const { chats, activeChat } = get();
        const filteredChats = chats.filter(chat => chat.id !== id);
        
        // Delete from IndexedDB directly
        deleteChatFromDB(id).catch(error => {
          console.error('Error deleting chat from IndexedDB:', error);
        });
        
        set(state => ({
          chats: filteredChats,
          // If we're deleting the active chat, select the first available chat, or null if none
          activeChat: activeChat === id
            ? filteredChats.length > 0 ? filteredChats[0].id : null
            : activeChat
        }));
      },
      
      clearChats: () => set({ chats: [], activeChat: null }),
      
      updateChatTitle: (id, title) => set(state => ({
        chats: state.chats.map(chat => 
          chat.id === id
            ? { ...chat, title, titleGenerated: true, lastTitleMessageCount: chat.messages.length, updatedAt: Date.now() }
            : chat
        )
      })),
      
      // Alias for manual renaming - does not set titleGenerated flag
      renameChat: (id, title) => {
        set(state => ({
          chats: state.chats.map(chat => 
            chat.id === id ? { ...chat, title, titleGenerated: false, lastTitleMessageCount: undefined } : chat
          )
        }));
      },
      
      setModel: (id, model: GeminiModel) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === id ? { ...chat, model } : chat
          )
        }));
      },

      setSystemInstruction: (id, instruction) => set(state => ({
        chats: state.chats.map(chat => 
          chat.id === id
            ? { ...chat, systemInstruction: instruction, updatedAt: Date.now() }
            : chat
        )
      })),
      
      addMessage: (chatId, message) => {
        const messageId = nanoid();
        
        set(state => {
          // Find the chat to get the latest message timestamp
          const targetChat = state.chats.find(chat => chat.id === chatId);
          const lastMessageTimestamp = targetChat?.messages && targetChat.messages.length > 0 
            ? Math.max(...targetChat.messages.map(m => m.timestamp))
            : 0;
          
          // Ensure timestamp is always greater than the last message
          const timestamp = Math.max(Date.now(), lastMessageTimestamp + 1);
          
          return {
            chats: state.chats.map(chat => 
              chat.id === chatId
                ? {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { ...message, id: messageId, timestamp }
                    ],
                    updatedAt: timestamp
                  }
                : chat
            )
          };
        });
        
        return messageId;
      },
      
      updateMessage: (chatId, messageId, content, append = false, groundingMetadata) => set(state => ({
        chats: state.chats.map(chat => 
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map(msg =>
                  msg.id === messageId
                    ? { 
                        ...msg, 
                        content: append ? msg.content + content : content,
                        ...(groundingMetadata && { groundingMetadata })
                      }
                    : msg
                ),
                updatedAt: Date.now()
              }
            : chat
        )
      })),
      
      setTokenCount: (chatId, counts) => set(state => ({
        chats: state.chats.map(chat => 
          chat.id === chatId
            ? { ...chat, tokenCount: counts }
            : chat
        )
      })),
      
      setGenerationParams: (params) => set(state => ({
        generationParams: { ...state.generationParams, ...params }
      })),
      
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      
      pinChat: (id) => set(state => ({
        chats: state.chats.map(chat => 
          chat.id === id 
            ? { ...chat, pinned: true } 
            : chat
        )
      })),
      
      unpinChat: (id) => set(state => ({
        chats: state.chats.map(chat => 
          chat.id === id 
            ? { ...chat, pinned: false } 
            : chat
        )
      })),
      
      cleanupOldChats: () => {
        // Get the cutoff time for 48 hours ago
        const cutoffTime = Date.now() - (48 * 60 * 60 * 1000);
        
        set(state => {
          const oldChats = state.chats.filter(chat => 
            // Keep chats that are either pinned or newer than the cutoff
            chat.pinned || chat.updatedAt > cutoffTime
          );
          
          // If we removed any chats, we might need to update the active chat
          let newActiveChat = state.activeChat;
          if (state.activeChat && !oldChats.some(chat => chat.id === state.activeChat)) {
            newActiveChat = oldChats.length > 0 ? oldChats[0].id : null;
          }
          
          return {
            chats: oldChats,
            activeChat: newActiveChat
          };
        });
      },
      
      setChatData: (chats) => set({ chats })
    })
));

// Initialize the Dexie store when the app loads
// This should be called once during app initialization
export const initializeDexieStore = () => {
  const store = useChatStore.getState() as WithDexie;
  if (store.initializeDexie) {
    return store.initializeDexie().catch((err: Error) => {
      console.error('Failed to initialize Dexie store:', err);
    });
  }
  return Promise.resolve();
};
