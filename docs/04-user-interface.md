# User Interface Components

## Overview

The ECHO UI is built using a component-based architecture with React 19 and styled using TailwindCSS 4. The interface is designed to be responsive, accessible, and provide a seamless user experience across devices. This document outlines the key UI components and their relationships.

## Component Structure

### Layout Components

#### ChatLayout (`components/chat/chat-layout.tsx`)

The main container component that:
- Initializes the chat session
- Manages API key presence and displays alerts if missing
- Renders the main application structure (sidebar, chat window, toaster)
- Handles error states and notifications
- Wraps the UI in the ToastProvider for notifications

```typescript
// Core layout rendering
return (
  <ToastProvider>
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <ChatWindow />
      <Toaster />
    </div>
  </ToastProvider>
);
```

### Chat Interface Components

#### ChatWindow (`components/chat/chat-window.tsx`)

Displays the active chat conversation:
- Renders messages with appropriate styling based on role
- Handles auto-scrolling with awareness of streaming state
- Displays chat title and metadata
- Contains the ChatInput component
- Manages user scroll state to prevent disruptive auto-scrolling

#### ChatInput (`components/chat/chat-input.tsx`)

Manages message input and submission:
- Provides text input area with auto-resizing
- Handles keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Displays model selector, file attachment, and thinking mode toggles
- Integrates with the file system for attachments and context
- Detects and handles file creation commands
- Shows token count and streaming indicators

#### MessageDisplay (`components/chat/message.tsx`)

Renders individual messages with:
- Role-based styling (user vs AI)
- Markdown formatting support
- Code syntax highlighting
- File attachments display
- Thinking mode content (when enabled)

### File System Components

#### FileTree (`components/files/file-tree.tsx`)

Provides the file browser interface:
- Renders hierarchical file structure with expand/collapse
- Handles context menus for file operations
- Supports file selection for chat context
- Shows visual indicators for selected files
- Includes FAQ dialog for file system usage

#### FileEditor (`components/files/file-editor.tsx`)

A simple text editor for file contents:
- Syntax highlighting based on file type
- Auto-save functionality
- Resize handles for adjusting editor size
- Integration with the file store

#### FileUpload (`components/files/file-upload.tsx`)

Handles file uploads from the user's device:
- Drag-and-drop support
- Multi-file upload capability
- Progress indicators
- File type validation

### UI Components

The application uses a set of reusable UI components for consistent design:

#### Buttons and Inputs

- Button: Standard button with multiple variants (primary, secondary, ghost)
- Input: Text input fields with consistent styling
- Textarea: Multi-line text input with auto-resize
- Switch: Toggle component for binary settings

#### Dialogs and Overlays

- Dialog: Modal dialog for confirmations and settings
- Dropdown: Menu for selections and options
- Toaster: Notification system for user feedback
- Tooltip: Contextual information display

#### Navigation Elements

- Sidebar: Collapsible navigation sidebar
- Tabs: Content organization for settings
- Breadcrumb: Path navigation for files

## Theming System

The application implements a theme system with:

- Dark and light mode support
- Theme switching via system preference or manual toggle
- Consistent color variables for easy customization
- CSS variables for dynamic theme application

## Responsive Design

The UI is built to be responsive across devices:

- Mobile-first approach using TailwindCSS breakpoints
- Collapsible sidebar for small screens
- Adapted layouts for different viewport sizes
- Touch-friendly controls on mobile

## Accessibility Features

The application prioritizes accessibility with:

- Proper ARIA attributes on interactive elements
- Keyboard navigation support
- Sufficient color contrast for readability
- Screen reader friendly markup
- Focus management for dialogs and overlays

## Best Practices for UI Extension

When extending the UI:

1. Follow the established component patterns
2. Use TailwindCSS utility classes for styling
3. Maintain responsive design principles
4. Ensure accessibility compliance
5. Keep components modular and reusable

## Next Steps

Explore other aspects of the application in the following documentation sections:

- [Project Overview](01-project-overview.md) - High-level introduction and features
- [File Management System](02-file-management.md) - How the in-browser file system works
- [AI Integration](03-ai-integration.md) - How the Gemini API is integrated
- [Technical Architecture](05-technical-architecture.md) - Overall technical design
- [State Management](06-state-management.md) - Zustand stores and state handling
- [API Integration](07-api-integration.md) - Details of API communication
- [Chat Features](08-chat-features.md) - Advanced chat capabilities
- [Theming System](09-theming-system.md) - Theme implementation and customization
