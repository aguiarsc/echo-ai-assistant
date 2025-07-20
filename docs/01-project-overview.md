# Project Overview: altIA Business Assistant

## Introduction

altIA Business Assistant is an advanced AI-powered business companion that revolutionizes business productivity workflows. Built specifically for project managers, HR professionals, legal teams, and business analysts, it combines Google's Gemini AI models with an integrated document management system to provide context-aware AI assistance throughout the entire business process.

## Key Features

### AI-Powered Business Assistant
- **Smart Document Editing**: Natural language document editing with visual diff review and accept/reject controls
- **Advanced AI Analysis**: Real-time AI reasoning display with accurate duration tracking
- **Context-Aware AI**: Add documents as context to enhance AI conversations with your business details
- **Intelligent Document Creation**: AI creates new documents based on your existing business context and natural language requests
- **Clean Content Generation**: AI generates clean, direct content without unwanted introductions or explanations
- **Sequential AI Flow**: Thinking process displays first, then response streams naturally
- **Multiple Gemini Models**: Support for Gemini 2.5 Flash and Gemini 2.0 Flash with proper thinking mode integration

### Integrated Document Management
- **Built-in Document System**: Create, edit, and organize your business projects directly in the browser
- **Hierarchical Organization**: Organize reports, policies, contracts, and meeting notes in folders
- **Real-time Editing**: Edit documents with auto-save functionality
- **Document Context Selection**: Choose which documents to include as AI context
- **Drag & Drop**: Intuitive document organization with drag-and-drop support

### Advanced Chat Features
- **Fluid Chat Experience**: Type while AI responds - no waiting required
- **Streaming Responses**: Real-time AI responses with typing effects and sequential thinking display
- **Enhanced UX**: Dynamic placeholder text and visual feedback during AI generation
- **Token Tracking**: Monitor AI usage, conversation complexity, and thinking token consumption
- **Chat Management**: Auto-deletion of old chats with pin system for important conversations
- **File Upload Support**: Upload images and documents for AI analysis
- **Copy & Share**: Easy copying of AI responses and conversations
- **Smart Controls**: All file and context controls remain available during AI responses

### Calendar System
- **AI-Powered Scheduling**: Create and manage events through natural language commands
- **Visual Calendar Interface**: Interactive calendar with visual event indicators
- **Smart Event Management**: Update and search events via chat or calendar UI
- **Safety-First Design**: Manual-only deletion policy prevents accidental data loss
- **Business Integration**: Seamlessly integrates with document workflows and project management
- **Persistent Storage**: Reliable event storage with automatic synchronization

### Professional Business Tools
- **Project Organization**: Manage multiple business projects with ease
- **Team Management**: Maintain team roles and responsibility documentation
- **Process Documentation**: Organize procedures, policies, and compliance materials
- **Project Tracking**: Track milestones, deliverables, and project elements
- **Research Integration**: Include research notes and references in your workflow

### User Experience
- **Theme Support**: Dark and light modes optimized for long business sessions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Robust Storage**: IndexedDB-based persistence ensures your work is never lost
- **Offline Capability**: Core document management works without internet connection

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
