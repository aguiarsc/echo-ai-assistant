# Project Overview: ECHO Novel Assistant

## Introduction

ECHO Novel Assistant is an advanced AI-powered writing companion that revolutionizes creative writing workflows. Built specifically for novelists, writers, and creative professionals, it combines Google's Gemini AI models with an integrated file management system to provide context-aware AI assistance throughout the entire writing process.

## Key Features

### AI-Powered Writing Assistant
- **Smart File Editing**: Natural language file editing with visual diff review and accept/reject controls
- **Advanced AI Thinking**: Real-time AI reasoning display with accurate duration tracking
- **Context-Aware AI**: Add files as context to enhance AI conversations with your story details
- **Intelligent File Creation**: AI creates new files based on your existing story context and natural language requests
- **Clean Content Generation**: AI generates clean, direct content without unwanted introductions or explanations
- **Sequential AI Flow**: Thinking process displays first, then response streams naturally
- **Multiple Gemini Models**: Support for Gemini 2.5 Flash and Gemini 2.0 Flash with proper thinking mode integration

### Integrated File Management
- **Built-in File System**: Create, edit, and organize your writing projects directly in the browser
- **Hierarchical Organization**: Organize chapters, character sheets, world-building notes in folders
- **Real-time Editing**: Edit files with auto-save functionality
- **File Context Selection**: Choose which files to include as AI context
- **Drag & Drop**: Intuitive file organization with drag-and-drop support

### Advanced Chat Features
- **Fluid Chat Experience**: Type while AI responds - no waiting required
- **Streaming Responses**: Real-time AI responses with typing effects and sequential thinking display
- **Enhanced UX**: Dynamic placeholder text and visual feedback during AI generation
- **Token Tracking**: Monitor AI usage, conversation complexity, and thinking token consumption
- **Chat Management**: Auto-deletion of old chats with pin system for important conversations
- **File Upload Support**: Upload images and documents for AI analysis
- **Copy & Share**: Easy copying of AI responses and conversations
- **Smart Controls**: All file and context controls remain available during AI responses

### Professional Writing Tools
- **Project Organization**: Manage multiple writing projects with ease
- **Character Development**: Maintain character sheets and development notes
- **World Building**: Organize settings, locations, and story elements
- **Plot Management**: Track story arcs, chapters, and narrative elements
- **Research Integration**: Include research notes and references in your workflow

### User Experience
- **Theme Support**: Dark and light modes optimized for long writing sessions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Robust Storage**: IndexedDB-based persistence ensures your work is never lost
- **Offline Capability**: Core file management works without internet connection

## Technology Stack

The application is built using modern web technologies:

- **Frontend Framework**: Next.js 15
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **Type Safety**: TypeScript
- **State Management**: Zustand with IndexedDB via Dexie.js
- **AI Integration**: Google Gemini API

## Application Structure

The codebase follows a structured organization:

- `/app`: Next.js app directory containing the main layout and page components
- `/components`: React components organized by feature
  - `/chat`: Chat-related components (input, messages, sidebar)
  - `/files`: File system components (tree, editor)
  - `/ui`: Reusable UI components
- `/hooks`: Custom React hooks for shared functionality
- `/lib`: Core business logic and utilities
  - `/ai`: AI-related functionality
  - `/files`: File system implementation
  - `/gemini`: Gemini API integration with chat management features
  - `/db`: Database configuration and middleware

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Navigate to `http://localhost:3000`
5. Add your Gemini API key in the settings from ai.dev ([Google AI Studio](https://aistudio.google.com/apikey))

## Next Steps

The following documentation sections provide detailed information about specific aspects of the application:

- [File Management System](02-file-management.md)
- [AI Integration](03-ai-integration.md)
- [User Interface Components](04-user-interface.md)
- [Technical Architecture](05-technical-architecture.md)
- [State Management](06-state-management.md)
- [API Integration](07-api-integration.md)
- [Chat Features](08-chat-features.md)
- [Theming System](09-theming-system.md)
