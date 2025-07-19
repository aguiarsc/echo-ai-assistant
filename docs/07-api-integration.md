# API Integration

## Overview

ECHO integrates with Google's Gemini API to provide AI capabilities. This document details how the application communicates with the Gemini API, how authentication is managed through secure storage, and how data is formatted and processed.

## API Integration Architecture

### Core API Module

The primary API integration is handled in `lib/gemini/api.ts`, which provides:

- Functions to communicate with Google's Gemini API
- Message format conversion between the application and API
- Streaming response handling
- Token counting and management
- Error handling and retry logic

### Key Functions

#### `generateGeminiResponse`

This core function handles sending messages to the Gemini API and receiving responses:

```typescript
export async function generateGeminiResponse({
  systemInstruction,
  apiKey,
  model,
  messages,
  params,
  fileUris,
  onStream,
  signal,
}: GenerateParams): Promise<GenerateResponse> {
  // Implementation that connects to Google's Gemini API
  // Handles streaming, parameter configuration, etc.
}
```

#### `countTokens`

This function estimates token usage for messages:

```typescript
export async function countTokens({
  apiKey,
  model,
  messages,
}: CountTokensParams): Promise<TokenCountResponse> {
  // Implementation that calculates token usage for messages
}
```

## Authentication

### Secure API Key Management

ECHO uses HTTP-only cookies to securely store the Gemini API key, eliminating the need for users to re-enter their API key after each page refresh or browser session.

#### Key Features

- **HTTP-only Cookie Storage**: API keys are stored in HTTP-only cookies that cannot be accessed by JavaScript, protecting against XSS attacks
- **Secure Flag**: In production environments, cookies are only sent over HTTPS connections
- **Automatic Key Retrieval**: API key is automatically retrieved on application startup
- **Persistence Between Sessions**: Users only need to enter their API key once
- **Visual Indicators**: The UI clearly shows when an API key is securely stored

#### Implementation Details

##### API Routes

The secure API key storage system is implemented using Next.js API routes:

- `/api/apikey` - Handles checking, setting, and deleting the API key cookie
- `/api/apikey/fetch` - Securely retrieves the API key for server-side operations

##### HTTP-Only Cookie Configuration

```typescript
// Set HTTP-only cookie with the API key
response.cookies.set({
  name: COOKIE_NAME,
  value: apiKey,
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict',
  path: '/',
  maxAge: COOKIE_MAX_AGE, // 30 days
});
```

##### React Hook for API Key Operations

A custom React hook (`useSecureApiKey`) provides an interface for working with secure API keys:

```typescript
// Example usage in a component
const { saveApiKey, clearApiKey, isLoading, hasStoredKey } = useSecureApiKey();

// Save API key securely
await saveApiKey('your-api-key');

// Check if a key is stored
if (hasStoredKey) {
  // Key is available
}

// Clear stored API key
await clearApiKey();
```

### Security Considerations

- **XSS Protection**: The API key is never exposed to client-side JavaScript due to HTTP-only cookies
- **Security Headers**: Cookies are configured with appropriate security flags:
  - `httpOnly`: Prevents JavaScript access
  - `secure`: In production, ensures cookie is only sent over HTTPS
  - `sameSite: 'strict'`: Prevents CSRF attacks
- **No Client Storage**: API key is never stored in localStorage or sessionStorage
- **Direct API Calls**: Requests are made directly from client to Google (no proxy server)
- **No Persistent Storage**: The server never logs or persists the API key beyond the cookie storage

### User Experience

1. **First Visit**: User enters their Gemini API key in the settings panel
2. **Key Storage**: Key is securely stored in an HTTP-only cookie
3. **Subsequent Visits**: API key is automatically retrieved, and the user can immediately start using the application
4. **Visual Feedback**: A "Secured" indicator appears next to the API key field when a key is stored

### Troubleshooting

If users experience issues with API key persistence:

1. Check browser cookie settings - cookies must be enabled
2. In incognito/private browsing, cookies may be cleared between sessions
3. If using browser extensions that clear cookies, the API key may need to be re-entered

## API Communication

### Request Format

Messages are converted to the Gemini API format before sending:

```typescript
// Convert our message format to Google's format
const googleMessages = messages.map(message => ({
  role: message.role === 'user' ? 'user' : 'model',
  parts: [{ text: message.content }]
}));
```

### Streaming Implementation

The application implements streaming for a responsive user experience:

1. A streaming request is initiated with the Gemini API
2. The API returns chunks of text as they're generated
3. The application processes these chunks with a character-by-character typing effect
4. The UI updates in real-time as text arrives
5. Users can cancel streaming at any point

```typescript
// Streaming implementation example
const result = await genAI.getGenerativeModel({ model }).generateContentStream({
  contents: [...convertedMessages],
  generationConfig: generationConfig,
  safetySettings: safetySettings,
  systemInstruction: { text: systemInstruction },
});

for await (const chunk of result.stream) {
  const chunkText = chunk.text() || '';
  onStream(chunkText, chunk.candidates?.[0]?.thought?.text);
}
```

## Parameter Configuration

### Generation Parameters

The application allows configuration of various generation parameters:

- `temperature`: Controls randomness (0.0 to 1.0)
- `topK`: Limits token selection to top K most likely
- `topP`: Uses nucleus sampling for more diverse outputs
- `maxOutputTokens`: Limits response length
- `thinkingEnabled`: Enables thinking mode to show reasoning
- `includeSummaries`: Includes additional context summaries

```typescript
interface GenerationParams {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
  thinkingEnabled: boolean;
  includeSummaries: boolean;
}
```

### Safety Settings

The application uses Google's safety settings for content moderation:

```typescript
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  // Additional safety settings...
];
```

## File Context Integration

### File Context Formatting

Files are provided as context through enhanced system instructions:

1. File content is extracted from the file system
2. Content is formatted with file metadata (path, name, type)
3. This context is appended to the system instructions
4. The enhanced instructions guide the AI to understand file contents

```typescript
// Example of file context in system instructions
const fileContextInstruction = `
The user has the following files in their workspace:

FILE: /example.js
TYPE: file
CONTENT:
\`\`\`
function hello() {
  console.log("Hello, world!");
}
\`\`\`

Please reference these files when responding to the user's questions.
`;
```

## Error Handling

### API Errors

The application handles various API error scenarios:

- Invalid API key errors with clear user feedback
- Rate limiting with exponential backoff
- Network failures with appropriate error messages
- Timeout handling with the ability to retry
- Graceful degradation when the API is unavailable

### Error Feedback

Errors are communicated to the user through:

- Toast notifications for transient errors
- Inline error messages in the chat UI
- Console logging for detailed debugging information

## Best Practices

### Optimizing API Usage

1. **Token Efficiency**: Structure prompts concisely to minimize token usage
2. **Appropriate Temperature**: Use lower temperature for factual responses, higher for creative content
3. **Context Management**: Only include relevant files in context to save tokens
4. **Streaming**: Use streaming for better user experience with longer responses
5. **Caching**: Implement caching for token counting and other repetitive operations

### Rate Limiting Considerations

- Be mindful of API rate limits (queries per minute)
- Implement graceful backoff strategies for rate limit errors
- Provide user feedback when approaching rate limits

### API Updates

The Gemini API evolves over time. The application's integration is designed to be adaptable to API changes with:

- Modular API interaction code
- Version-aware request formatting
- Fallback mechanisms for deprecated features

## Next Steps

Explore other aspects of the application in the following documentation sections:

- [Project Overview](01-project-overview.md) - High-level introduction and features
- [File Management System](02-file-management.md) - How the in-browser file system works
- [AI Integration](03-ai-integration.md) - How the Gemini API is integrated
- [User Interface Components](04-user-interface.md) - UI architecture and components
- [Technical Architecture](05-technical-architecture.md) - Overall technical design
- [State Management](06-state-management.md) - Zustand stores and state handling
- [Chat Features](08-chat-features.md) - Advanced chat capabilities
- [Theming System](09-theming-system.md) - Theme implementation and customization
