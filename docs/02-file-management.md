# Document Management

## Overview

altIA Business Assistant provides a comprehensive document management system specifically designed for business productivity projects. Business professionals can create, edit, and organize their reports, policies, contracts, meeting notes, and project materials directly within the browser. The system integrates seamlessly with AI features to provide context-aware assistance throughout the business process.
1. Operates entirely client-side using browser storage
2. Provides a familiar tree-based interface for file navigation
3. Integrates directly with the AI chat functionality
4. Persists between browser sessions

## Core Components

### File Store

The file system is built on a Zustand-based store (`useFilesStore`) that manages the state and operations for all files. Located in `lib/files/store.ts`, this store:

- Maintains a record of all files and folders
- Provides methods for file operations (create, delete, rename, etc.)
- Tracks the currently active/open file
- Persists data to browser storage

### File Tree Component

The `FileTree` component (`components/files/file-tree.tsx`) provides the visual interface for file management:

- Displays the hierarchical file structure
- Supports context menus for file operations
- Enables drag-and-drop organization
- Allows folder expansion/collapse
- Shows visual indicators for files included in chat context

### File Editor

The `FileEditor` component (`components/files/file-editor.tsx`) provides a simple text editor for file contents with:

- Syntax highlighting for different file types
- Content editing capabilities
- Auto-save functionality
- Integration with the file store

## File Operations

### Creating Files

Files can be created through:

1. The file tree UI using "New File" buttons
2. Context menus within folders
3. Natural language commands in the chat (e.g., "Create a file named story.md about dragons")

### File Context for AI

Files can be included as context for AI conversations:

1. Select files in the file tree (marked with a "Context" badge)
2. The selected files are automatically included in the conversation context
3. The AI can reference and understand the content of these files

## Technical Implementation

### File Node Structure

Each file or folder is represented as a `FileNode` with the following structure:

```typescript
interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  parentId: string | null
  path: string
  lastModified: number
  size?: number
  children?: string[] // IDs of child nodes
}
```

### Path Management

The file system maintains proper path structures:

- Root files have paths like `/filename.ext`
- Nested files include the full path: `/folder/subfolder/file.ext`
- Paths are automatically updated when files or folders are moved or renamed

### Storage and Persistence

Files are persisted using:

- Zustand's persist middleware
- Browser's IndexedDB (via the `idb` library)
- Automatic synchronization between memory and storage

## Integration with AI

The file system integrates with the AI through:

1. **Context Selection**: Files can be selected to provide context for AI conversations
2. **File Content Adaptation**: Selected file content is transformed into a format suitable for the AI model
3. **AI File Creation**: The AI can generate and create new files based on user requests

## Best Practices

When working with the file system:

1. Keep related files together in folders for better organization
2. Use descriptive file names to help the AI understand content
3. Select only relevant files as context for more focused AI responses
4. Utilize markdown (.md) files for better structured content

## Next Steps

Explore other aspects of the application in the following documentation sections:

- [Project Overview](01-project-overview.md) - High-level introduction and features
- [AI Integration](03-ai-integration.md) - How the Gemini API is integrated
- [User Interface Components](04-user-interface.md) - UI architecture and components
- [Technical Architecture](05-technical-architecture.md) - Overall technical design
- [State Management](06-state-management.md) - Zustand stores and state handling
- [API Integration](07-api-integration.md) - Details of API communication
- [Chat Features](08-chat-features.md) - Advanced chat capabilities
- [Theming System](09-theming-system.md) - Theme implementation and customization
