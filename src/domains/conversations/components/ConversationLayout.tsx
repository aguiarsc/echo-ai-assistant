"use client"

import { ConversationSidebar } from "@/domains/conversations/components/ConversationSidebar"
import { ConversationWindow } from "@/domains/conversations/components/ConversationWindow"
import { Toaster } from "@/shared/ui-components/toaster"
import { ToastProvider } from "@/shared/ui-components/use-toast"
import { ErrorBoundary } from "@/shared/components/ErrorBoundary"
import { useChatStore, initializeDexieStore } from "@/domains/conversations/storage/conversation-store"
import { useFilesStore } from "@/domains/writing-projects/storage/project-store"
import { useFileContextStore } from "@/domains/writing-projects/storage/file-context-store"
import { useToast } from "@/shared/ui-components/use-toast"
import { useSecureApiKey } from "@/infrastructure/storage/api-key-manager"
import { useEffect, useRef, useState } from "react"
import { useConversation } from "@/domains/conversations/hooks/use-conversation"
import { Alert, AlertDescription } from "@/shared/ui-components/alert"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Settings } from "lucide-react"
import { Button } from "@/shared/ui-components/button"

export function ConversationLayout() {
  const { apiKey, chats, activeChat, createChat, setActiveChat, cleanupOldChats } = useChatStore()
  const { isLoading: isLoadingApiKey, hasStoredKey, loadApiKey } = useSecureApiKey()
  const { error } = useConversation()
  
  const hasInitializedRef = useRef(false);
  const chatInitializedRef = useRef(false);
  const apiKeyLoadedRef = useRef(false);
  
  useEffect(() => {
    const loadKey = async () => {
      if (!apiKeyLoadedRef.current && hasStoredKey) {
        console.log('Loading stored API key...');
        await loadApiKey();
        apiKeyLoadedRef.current = true;
      }
    };
    
    loadKey().catch(error => {
      console.error("Failed to load API key:", error);
    });
  }, [hasStoredKey, loadApiKey]);
  
  useEffect(() => {
    const initStore = async () => {
      if (!hasInitializedRef.current) {
        console.log('Initializing Dexie stores...');
        await initializeDexieStore();
        await useFilesStore.getState().initializeDexie();
        await useFileContextStore.getState().initializeDexie();
        
        console.log('Cleaning up old chats...');
        cleanupOldChats();
        
        hasInitializedRef.current = true;
        console.log('Dexie stores initialized');
      }
    };
    
    initStore().catch(error => {
      console.error("Failed to initialize stores:", error);
    });
  }, []);
  
  useEffect(() => {
    if (hasInitializedRef.current && !chatInitializedRef.current && chats.length >= 0) {
      console.log('Initializing chat session...');
      chatInitializedRef.current = true;
      
      if (chats.length > 0) {
        console.log(`Found ${chats.length} existing chats`);
        
        if (!activeChat) {
          const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
          setActiveChat(sortedChats[0].id);
          console.log('Set active chat to most recent:', sortedChats[0].id);
        }
      } else {
        console.log('No chats found, creating a new one');
        createChat("gemini-2.5-flash");
      }
      
      localStorage.setItem('lastActiveChatTime', Date.now().toString());
    }
  }, [chats, activeChat, createChat, setActiveChat, hasInitializedRef])

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex h-screen max-h-screen overflow-hidden">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Sidebar Error:', error, errorInfo)
          }}
        >
          <ConversationSidebar />
        </ErrorBoundary>
        
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {error && (
            <Alert variant="destructive" className="mb-4 mx-4 mt-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!apiKey && !isLoadingApiKey && (
            <div className="w-full flex justify-center mt-4 mb-2 px-4 z-10">
              <div className="bg-destructive/10 border border-destructive rounded-lg py-2 px-4 flex items-center gap-2 text-sm text-destructive shadow-sm">
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                <span>Please set your API key in the</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1 p-0 text-destructive hover:text-destructive/80 font-medium"
                  onClick={() => {
                    const settingsButton = document.querySelector('[data-settings-trigger="true"]') as HTMLButtonElement;
                    if (settingsButton) {
                      settingsButton.click();
                    }
                  }}
                >
                  <Settings className="h-3.5 w-3.5" />Settings panel
                </Button>
                {hasStoredKey && <span>Loading your API key...</span>}
              </div>
            </div>
          )}
          
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('ChatWindow Error:', error, errorInfo)
            }}
          >
            <ConversationWindow />
          </ErrorBoundary>
        </main>
        
        <Toaster />
      </div>
    </ToastProvider>
  )
}
