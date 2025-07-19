# AI Integration

## Overview

ECHO Novel Assistant leverages Google's Gemini API to provide powerful AI capabilities specifically designed for creative writing workflows. The integration focuses on providing natural, context-aware responses while supporting advanced features like intelligent file creation, streaming responses, thinking mode, and comprehensive file context awareness.

## Core Components

### Gemini API Integration

Located in `lib/gemini/api.ts`, this module:
- Handles direct communication with Google's Gemini API
- Supports both streaming and non-streaming response generation
- Manages token counting for message budgeting
- Converts application message formats to Gemini API format

```typescript
// Example API call
const response = await generateGeminiResponse({
  systemInstruction: enhancedSystemInstruction,
  apiKey,
  model: "gemini-2.5-flash",
  messages: chatMessages,
  params: generationParams,
  onStream: (chunk, thinking) => {
    // Process streaming response
  },
  signal: abortController.signal,
});
```

### Chat Store

The `useChatStore` Zustand store (`lib/gemini/store.ts`) manages:
- Chat sessions and messages
- API key storage (non-persistent for security)
- Generation parameters
- System instructions
- Token counting statistics

### File Context Adapter

The file context adapter (`lib/gemini/file-context-adapter.ts`) handles:
- Converting file nodes to a format suitable for AI context
- Generating system instructions that include file content
- Supporting different file types
- Limiting context size to prevent token overruns

## Key Features

### Intelligent File Creation System

The application includes a sophisticated AI file creation system that:
- **Detects File Creation Intent**: Automatically recognizes when users want to create files
- **Context-Aware Generation**: Uses selected files as context for new file content
- **Clean Content Generation**: Produces clean, direct content without AI introductions
- **Visual Feedback**: Provides styled feedback during file creation process
- **Smart Naming**: Handles duplicate filenames automatically

### Multiple Gemini Models

The application supports:
- **Gemini 2.5 Flash**: Fastest model, recommended for most writing tasks
- **Gemini 2.0 Flash Experimental**: Advanced model for complex reasoning and analysis

### Thinking Mode

Thinking mode provides:
- Visibility into the AI's reasoning process
- More detailed explanations
- Better transparency for complex responses
- File context summaries when files are included

### Streaming Responses

The application implements:
- Real-time streaming of AI responses
- Character-by-character typing effect
- User-configurable typing speed
- Ability to cancel generation mid-stream

### System Instructions

The application uses system instructions to:
- Set consistent AI behavior and personality
- Provide context about files and their content
- Establish parameters for responses
- Guide the AI in specific tasks like file creation

### Token Management

The application includes:
- Automatic token counting for conversations
- Display of token usage statistics
- Management of context limits to prevent overruns

## Technical Implementation

### Message Processing Flow

1. User sends a message via the chat interface
2. The application adds context from selected files (if any)
3. The message is sent to the Gemini API with appropriate parameters
4. Responses are streamed back to the UI
5. Token counts are calculated and stored

### API Key Management

- API keys are stored in memory only (not persisted to storage)
- Keys must be re-entered after page refresh
- Clear error handling for invalid or missing keys

### Error Handling

The application provides:
- Graceful degradation when API calls fail
- User-friendly error messages
- Automatic retry capabilities for certain error types
- Console logging for debugging issues

## Best Practices

### Optimizing AI Responses

1. **Use specific prompts**: Clear, concise questions yield better results
2. **Select relevant file context**: Include only files relevant to your question
3. **Use thinking mode**: Enable for complex questions or when you need to see reasoning
4. **Balance token usage**: Be aware that lengthy conversations consume more tokens

### Working with System Instructions

System instructions can be customized to:
- Change the AI's personality or tone
- Provide specific domains of expertise
- Enforce particular response formats
- Guide the AI toward desired behaviors

### Security Considerations

- Never share your API key
- The application stores API keys in memory only
- No API requests are sent to third-party servers (direct to Google)

## Next Steps

Explore other aspects of the application in the following documentation sections:

- [Project Overview](01-project-overview.md) - High-level introduction and features
- [File Management System](02-file-management.md) - How the in-browser file system works
- [User Interface Components](04-user-interface.md) - UI architecture and components
- [Technical Architecture](05-technical-architecture.md) - Overall technical design
- [State Management](06-state-management.md) - Zustand stores and state handling
- [API Integration](07-api-integration.md) - Details of API communication
- [Chat Features](08-chat-features.md) - Advanced chat capabilities
- [Theming System](09-theming-system.md) - Theme implementation and customization
