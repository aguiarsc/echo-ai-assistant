# Chat Features

## Overview

altIA provides a rich chat experience with several advanced features designed to enhance AI interactions for business productivity. These features include thinking mode, streaming responses, token tracking, document context, and more.

## Core Chat Features

### Conversation Management

The application supports multiple independent chat sessions:

- **Chat Creation**: Create new chat sessions with unique IDs
- **Chat Selection**: Switch between active chats
- **Chat Deletion**: Remove unwanted conversations
- **Chat Renaming**: Automatic or manual naming of conversations
- **Chat Pinning**: Pin important chats to prevent auto-deletion
- **Auto-Deletion**: Chats older than 48 hours are automatically removed unless pinned

```typescript
// Example of chat creation
const newChatId = useChatStore.getState().createChat();
useChatStore.getState().setActiveChat(newChatId);

// Example of chat pinning and auto-deletion
const { pinChat, unpinChat, cleanupOldChats } = useChatStore.getState();
pinChat(chatId); // Prevent auto-deletion
unpinChat(chatId); // Allow auto-deletion
cleanupOldChats(); // Remove chats older than 48h that aren't pinned
```

### Message Handling

Messages are managed through the chat store with support for:

- **Multiple Message Types**: User, model, and thinking messages
- **Message Grouping**: Messages are grouped by conversation turns
- **Message Formatting**: Markdown support with code syntax highlighting
- **Message Editing**: Incremental updates during streaming

### Thinking Mode

Thinking mode provides insight into the AI's reasoning process:

- **Toggle Control**: Enable/disable via the chat input UI
- **Reasoning Display**: Shows the AI's step-by-step thinking process
- **File Context Summary**: Displays file content provided as context
- **Separate Rendering**: Thinking content is visually distinct from responses

```typescript
// Thinking message creation
if (generationParams.thinkingEnabled && generationParams.includeSummaries) {
  const thinkingContent = fileContexts.length > 0 
    ? `File context provided:\n${fileContentText}\n\nThinking about the query...` 
    : "";
  thinkingMessageId = addMessage(chat.id, { 
    role: "thinking", 
    content: thinkingContent, 
    turnId 
  });
}
```

### Streaming Responses

The application implements streaming for a responsive experience:

- **Character-by-Character Display**: Text appears progressively
- **Configurable Typing Speed**: Control how quickly text appears
- **Cancellation Support**: Stop generation mid-stream
- **Buffer Management**: Efficient handling of incoming text chunks

```typescript
// Typing effect implementation
typingIntervalRef.current = setInterval(() => {
  const buffer = streamBufferRef.current;
  
  if (buffer.text.length > 0) {
    const char = buffer.text.slice(0, 1);
    buffer.text = buffer.text.slice(1);
    updateMessage(chat.id, modelMessageId, char, true);
  }
  
  // Additional buffer processing logic...
}, TYPING_SPEED);
```

### Token Tracking

The application tracks token usage for conversations:

- **Token Counting**: Counts tokens for both prompts and completions
- **Display**: Shows token count in the chat UI
- **API Integration**: Uses Gemini's token counting capabilities
- **Budget Management**: Helps users stay within API limits

## File Integration

### File Context for AI

Files can be included as context for AI conversations:

- **File Selection**: Select files from the file tree to include as context
- **Context Indicator**: Visual indicators show which files are in context
- **Content Processing**: File content is formatted for AI understanding
- **Context Summary**: View selected files in the chat input area

### AI File Creation System

The application features an advanced AI file creation system with significant recent improvements:

#### Core Features
- **Natural Language Detection**: Recognizes various file creation patterns in user messages
- **Context-Aware Generation**: Uses selected files as context for new file content
- **Clean Content Generation**: Produces clean, direct content without AI introductions
- **Smart Naming**: Handles duplicate filenames with automatic timestamping
- **Visual Feedback**: Styled feedback boxes during creation process

#### Visual Feedback System
The file creation process now includes a sophisticated visual feedback system:

- **Processing State**: Blue gradient box with pulsing indicator during generation
- **Success State**: Green gradient box with checkmark when completed
- **Rename Notifications**: Shows when files are renamed due to conflicts
- **Status Messages**: Clear, professional status updates

#### File Creation Patterns
The system recognizes various natural language patterns:

```typescript
// Examples of recognized patterns:
"Create a character sheet for Jake"           // → character-sheet.md
"Make a new chapter called Chapter 1"         // → chapter-1.md
"Generate story.md with a short story"        // → story.md
"I need a file named outline.md"              // → outline.md
```

#### Context Integration
The file creation system properly integrates with the file context system:

- **Context Inheritance**: New files use selected files as context
- **Character Consistency**: Maintains character details from existing files
- **Setting Continuity**: Preserves world-building elements
- **Plot Coherence**: Ensures new content fits existing story structure

### File Attachments

The chat supports file attachments:

- **Multiple File Upload**: Attach multiple files to a message
- **Attachment Display**: Visual indicators for attached files
- **Context Integration**: Attached files are included in AI context
- **Removal Support**: Remove attachments before sending

## Advanced Features

### Chat Auto-Deletion & Pinning

The application includes an automatic chat cleanup system:

- **48-Hour Threshold**: Chats older than 48 hours are automatically deleted
- **Pin Protection**: Important chats can be pinned to exempt them from deletion
- **Visual Indicators**: Pinned chats display a pin icon in the sidebar
- **Tooltips**: UI elements explain the auto-deletion behavior
- **On-Startup Cleanup**: The cleanup routine runs when the app initializes

```typescript
// Auto-deletion implementation
const cleanupOldChats = () => {
  const cutoffTime = Date.now() - (48 * 60 * 60 * 1000); // 48 hours ago
  set(state => {
    // Keep chats that are either pinned or recent
    const remainingChats = state.chats.filter(chat => 
      chat.pinned || chat.updatedAt > cutoffTime
    );
    
    // Update active chat if current one was deleted
    let newActiveChat = state.activeChat;
    if (state.activeChat && !remainingChats.some(chat => chat.id === state.activeChat)) {
      newActiveChat = remainingChats.length > 0 ? remainingChats[0].id : null;
    }
    
    return { 
      chats: remainingChats,
      activeChat: newActiveChat 
    };
  });
};
```

### Automatic Title Generation

Conversations are automatically titled based on content:

- **AI-Generated**: Uses the conversation content to create a relevant title
- **Customizable**: Users can manually rename conversations
- **Contextual**: Titles reflect the main topic discussed

```typescript
// Title generation
export function useAutomaticTitleGeneration() {
  const generateAndUpdateTitle = useCallback(async (chatId: string) => {
    // Implementation that uses AI to generate a title based on messages
  }, []);
  
  return { generateAndUpdateTitle };
}
```

### Model Selection

Users can choose between different Gemini models:

- **Gemini 2.5 Flash**: Fast, efficient model for most tasks
- **Gemini 2.0**: More comprehensive model for complex reasoning
- **Per-Chat Selection**: Each chat can use a different model
- **Visual Indicator**: The active model is shown in the UI

### System Instructions

The application supports configurable system instructions:

- **Global Instructions**: Set behavior guidelines for all conversations
- **Context-Enhanced**: Automatically enhanced with file context
- **Customizable**: Users can modify system instructions in settings
- **Preservation**: Instructions persist between sessions

## UI Features

### Responsive Design

The chat UI adapts to different screen sizes:

- **Mobile Optimization**: Adjusted layout for small screens
- **Sidebar Collapse**: Hide the sidebar on smaller viewports
- **Touch-Friendly**: Controls sized appropriately for touch input
- **Readable Text**: Font sizes adjusted for device types

### Accessibility

The chat interface prioritizes accessibility:

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: ARIA attributes and semantic HTML
- **Focus Management**: Proper focus handling for UI elements
- **Color Contrast**: Sufficient contrast for readability

## Best Practices

### Effective Communication

For the best chat experience:

1. **Be Specific**: Clear questions yield better responses
2. **Use Context Wisely**: Include only relevant files as context
3. **Enable Thinking Mode**: For complex questions requiring reasoning
4. **Leverage File Creation**: Use natural language for file generation
5. **Manage Long Conversations**: Start new chats for new topics to avoid context limits

## Next Steps

Explore other aspects of the application in the following documentation sections:

- [Project Overview](01-project-overview.md) - High-level introduction and features
- [File Management System](02-file-management.md) - How the in-browser file system works
- [AI Integration](03-ai-integration.md) - How the Gemini API is integrated
- [User Interface Components](04-user-interface.md) - UI architecture and components
- [Technical Architecture](05-technical-architecture.md) - Overall technical design
- [State Management](06-state-management.md) - Zustand stores and state handling
- [API Integration](07-api-integration.md) - Details of API communication
- [Theming System](09-theming-system.md) - Theme implementation and customization
