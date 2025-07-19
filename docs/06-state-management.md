# State Management

## Overview

ECHO uses Zustand as its primary state management solution. This lightweight, hook-based state management library provides a simple yet powerful way to manage application state with TypeScript support and built-in persistence capabilities. For more robust data persistence, ECHO integrates IndexedDB through the Dexie library with a custom Zustand middleware.

## Core State Stores

### Chat Store (`lib/gemini/store.ts`)

The chat store manages all conversation-related state:

```typescript
interface ChatStore {
  // State
  apiKey: string | null;
  chats: Chat[];
  activeChat: string | null;
  generationParams: GenerationParams;
  isStreaming: boolean;
  avatars: {
    user: string;
    model: string;
  };
  globalSystemInstruction: string;
  
  // Actions
  setApiKey: (key: string) => void;
  createChat: () => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  setActiveChat: (id: string) => void;
  addMessage: (chatId: string, message: Partial<Message>) => string;
  updateMessage: (chatId: string, messageId: string, content: string, append?: boolean) => void;
  setGenerationParams: (params: Partial<GenerationParams>) => void;
  setIsStreaming: (streaming: boolean) => void;
  setTokenCount: (chatId: string, counts: Partial<TokenCount>) => void;
  setAvatars: (avatars: Partial<ChatStore['avatars']>) => void;
  setSystemInstruction: (instruction: string) => void;
}
```

Key features:
- API key management (non-persistent for security)
- Chat session management (create, delete, rename)
- Message handling (add, update)
- Generation parameter configuration
- Avatar customization
- System instruction management
- Token count tracking

### Files Store (`lib/files/store.ts`)

The files store manages the virtual file system:

```typescript
interface FilesStore {
  // State
  nodes: Record<string, FileNode>;
  rootNodes: string[];
  activeFile: string | null;
  showEditor: boolean;
  
  // Actions
  createFile: (name: string, parentId?: string | null) => string;
  createFolder: (name: string, parentId?: string | null) => string;
  deleteNode: (id: string) => void;
  renameNode: (id: string, newName: string) => void;
  updateFileContent: (id: string, content: string) => void;
  setActiveFile: (id: string | null) => void;
  setShowEditor: (show: boolean) => void;
  getNodeById: (id: string) => FileNode | undefined;
  getNodeByPath: (path: string) => FileNode | undefined;
}
```

Key features:
- File and folder creation
- Recursive deletion
- Rename with path updates
- Content management
- Active file tracking
- Editor visibility control
- Node retrieval by ID or path

### File Context Store (`lib/files/context-store.ts`)

Manages the selection of files used as context for AI conversations:

```typescript
interface FileContextStore {
  // State
  selectedFileIds: string[];
  
  // Actions
  toggleFileSelection: (id: string) => void;
  clearSelectedFiles: () => void;
  setSelectedFileIds: (ids: string[]) => void;
  getSelectedFiles: () => FileNode[];
  isSelected: (id: string) => boolean;
}
```

Key features:
- File selection toggling
- Selection clearing
- Bulk selection setting
- Selected file retrieval
- Selection status checking

## Persistence Strategy

### IndexedDB Integration

ECHO uses IndexedDB via Dexie.js for robust client-side data storage:

```typescript
// Define Dexie database schema
const db = new Dexie('EchoDatabase') as EchoDexieDatabase;
db.version(1).stores({
  chats: 'id,createdAt,updatedAt',
  files: 'id,name,parentId,createdAt,updatedAt',
  fileContexts: 'id,createdAt'
});

// Custom Zustand-Dexie middleware
const dexieMiddleware = <T extends ChatStore>() => 
  (config: StateCreator<T>): StateCreator<T> => 
  (set, get, api) => config(
    async (partial, replace) => {
      set(partial, replace);
      // Persist state changes to IndexedDB after state updates
      const state = get();
      if ('chats' in partial) {
        await persistChatsToIndexedDB(state.chats);
      }
    },
    get,
    api
  );
```

### Zustand Persistence

Zustand's persist middleware is also used as a lightweight fallback mechanism:

```typescript
export const useChatStore = create<ChatStore>()(
  dexieMiddleware<ChatStore>()(
    persist(
      (set, get) => ({
        // Store implementation
      }),
      {
        name: 'gemini-chat-storage',
        partialize: (state) => ({
          // Only persist non-sensitive data
          chats: state.chats,
          activeChat: state.activeChat,
          generationParams: state.generationParams,
          avatars: state.avatars,
          globalSystemInstruction: state.globalSystemInstruction,
        }),
      }
    )
  )
);
```

Key persistence features:
- IndexedDB storage for robust, high-volume data persistence
- Named storage partitions
- Selective state persistence (excludes sensitive data)
- Automatic hydration on page load
- Type-safe persistence configuration
- Migration support between database versions
- Transaction support for atomic operations

## State Access Patterns

### Direct Store Access

Components can access state directly through hooks:

```typescript
const Component = () => {
  const { apiKey, setApiKey } = useChatStore();
  
  // Component implementation
};
```

### Selector Pattern

For performance optimization, selectors are used to access specific state slices:

```typescript
const apiKey = useChatStore(state => state.apiKey);
const currentChat = useChatStore(state => 
  state.chats.find(chat => chat.id === state.activeChat)
);
```

### Store Getters

For accessing state outside of React components:

```typescript
const getSelectedFiles = () => {
  const fileStore = useFileContextStore.getState();
  const filesStore = useFilesStore.getState();
  
  return fileStore.selectedFileIds.map(id => 
    filesStore.getNodeById(id)
  ).filter(Boolean);
};
```

## Store Interactions

The application's stores are designed to interact with each other:

1. **File Context → Chat Store**: Selected files from the file context store are provided to the chat store for AI context
2. **Files Store → File Context Store**: File deletions trigger removal from the context selection
3. **Chat Store → Files Store**: File creation requests through chat generate new files

## Reactivity Model

Zustand provides a fine-grained reactivity model:
- Components re-render only when their selected state changes
- State updates are batched for performance
- Updates happen synchronously, making them predictable

## Best Practices

When working with the state management system:

1. **Use selectors**: Only select the specific state needed by a component
2. **Keep actions in stores**: Business logic should reside in store actions
3. **Normalize data**: Avoid deeply nested state structures
4. **Be mindful of persistence**: Don't persist sensitive information or large data structures
5. **Use TypeScript**: Leverage TypeScript for type safety and better developer experience

## Next Steps

Explore other aspects of the application in the following documentation sections:

- [Project Overview](01-project-overview.md) - High-level introduction and features
- [File Management System](02-file-management.md) - How the in-browser file system works
- [AI Integration](03-ai-integration.md) - How the Gemini API is integrated
- [User Interface Components](04-user-interface.md) - UI architecture and components
- [Technical Architecture](05-technical-architecture.md) - Overall technical design
- [API Integration](07-api-integration.md) - Details of API communication
- [Chat Features](08-chat-features.md) - Advanced chat capabilities
- [Theming System](09-theming-system.md) - Theme implementation and customization
