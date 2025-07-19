# Technical Architecture

## Overview

ECHO is architected as a modern, client-side web application using Next.js 15, React 19, and TypeScript. The application follows a modular design pattern with clear separation of concerns, making it maintainable, extensible, and performant.

## Architecture Layers

### 1. User Interface Layer

The UI layer consists of React components organized by feature:

- **Chat Components**: Manage the conversation interface
- **File Components**: Handle file system visualization and interaction
- **UI Components**: Provide reusable interface elements

These components interact with the application state through custom hooks and the state management layer.

### 2. State Management Layer

Zustand serves as the primary state management solution:

- **Chat Store**: Manages conversations, messages, and AI interaction
- **Files Store**: Manages the virtual file system
- **File Context Store**: Manages file selection for AI context
- **UI State**: Manages UI-specific state like theme preferences

Each store is designed to be persistent where appropriate, excluding sensitive information like API keys.

### 3. Services Layer

The services layer handles external integrations and complex operations:

- **Gemini API Service**: Interfaces with Google's Gemini AI models
- **File System Service**: Provides higher-level file operations
- **Token Counting Service**: Manages token usage and limits

### 4. Persistence Layer

Data persistence is implemented using:

- **Zustand Persist**: For automatic store persistence
- **Browser Storage**: IndexedDB for larger data structures
- **Local Storage**: For smaller configuration items

## Key Architectural Patterns

### Component Composition

The UI is built using composition patterns:
- Container components manage state and logic
- Presentational components handle rendering
- Higher-order components provide shared functionality

### Custom Hooks

Custom React hooks encapsulate and share complex logic:
- `useChat`: Manages chat message sending and streaming
- `useMobile`: Detects device type for responsive behavior
- `useAutomaticTitleGeneration`: Handles AI-based title creation

### Event-Driven Communication

Components communicate through:
- Direct state access via Zustand stores
- React's prop drilling for closely related components
- Custom events for loosely coupled interactions

## Application Flow

### Chat Message Flow

1. User inputs a message in `ChatInput`
2. The `useChat` hook processes the message
3. If file context is selected, it's included via `file-context-adapter`
4. The `api.ts` module sends the request to Gemini
5. Streaming responses update UI in real-time
6. Token counts are updated in the store

### File System Flow

1. User interacts with the `FileTree` component
2. Actions trigger methods in the files store
3. The store updates the file structure
4. Changes are persisted automatically
5. UI reflects the updated file system

## Technical Decisions

### Why Next.js?

Next.js was chosen for:
- Modern React features with the App Router
- Built-in optimization for static and dynamic content
- Enhanced developer experience
- Simplified deployment options

### Why Zustand over Redux?

Zustand provides:
- Simpler API with less boilerplate
- Built-in persistence capabilities
- Excellent TypeScript integration
- More lightweight bundle size

### Why Client-Side File System?

A client-side file system offers:
- Privacy-first approach (files never leave the browser)
- Offline capability
- No backend dependencies
- Simplified deployment and hosting

### Performance Considerations

The application implements several performance optimizations:
- Virtualized lists for large file trees and chat histories
- Memoization of expensive operations
- Optimistic UI updates for better perceived performance
- Lazy loading of non-critical components

## Extensibility Points

The architecture is designed to be extensible in several key areas:

### Adding New AI Models

To support additional AI models:
1. Extend the model selection options in the store
2. Create a new adapter in the API service layer
3. Update the UI to expose new model-specific settings

### Enhancing File System Capabilities

The file system can be extended to support:
- Additional file types and viewers
- Real-time collaboration
- Integration with external storage services
- Version history and revisions

### Adding New Features

The modular architecture makes it straightforward to add:
- Additional UI themes
- New visualization components
- Enhanced markdown rendering
- Additional AI capabilities like image generation

## Deployment Architecture

The application is designed to be deployed as a static site with:
- No server-side dependencies
- Direct API calls from the client to Google's Gemini API
- All persistence handled client-side
- Minimal hosting requirements (any static file server)

## Next Steps

Explore other aspects of the application in the following documentation sections:

- [Project Overview](01-project-overview.md) - High-level introduction and features
- [File Management System](02-file-management.md) - How the in-browser file system works
- [AI Integration](03-ai-integration.md) - How the Gemini API is integrated
- [User Interface Components](04-user-interface.md) - UI architecture and components
- [State Management](06-state-management.md) - Zustand stores and state handling
- [API Integration](07-api-integration.md) - Details of API communication
- [Chat Features](08-chat-features.md) - Advanced chat capabilities
- [Theming System](09-theming-system.md) - Theme implementation and customization
