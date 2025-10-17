/**
 * Message formatting utilities for Gemini API
 * Handles conversion between internal message format and Gemini API format
 */

import { ChatMessage } from "./index";

/**
 * Gemini API message format
 */
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Simple message format for context building
 */
export interface SimpleMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Convert internal ChatMessage format to Gemini API format
 * Filters out thinking messages as they are not part of the conversation
 */
export function formatMessagesForAPI(messages: ChatMessage[]): GeminiMessage[] {
  return messages
    .filter(m => m.role !== 'thinking')
    .map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
}

/**
 * Get the N most recent messages from a chat, excluding thinking messages
 * Useful for providing conversation context to AI models
 */
export function getRecentMessages(
  messages: ChatMessage[], 
  count: number = 5
): SimpleMessage[] {
  return messages
    .slice(-count)
    .filter(m => m.role !== 'thinking')
    .map(m => ({ 
      role: m.role === 'user' ? 'user' as const : 'model' as const, 
      content: m.content 
    }));
}

/**
 * Build conversation context summary from recent messages
 * Formats messages in a human-readable format for AI context
 */
export function buildConversationContext(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return '';
  }

  let contextSummary = '\n\nRECENT CONVERSATION:\n';
  contextSummary += messages.map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');

  return contextSummary;
}

/**
 * Extract the last user message from a message history
 */
export function getLastUserMessage(messages: GeminiMessage[]): string {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.parts?.[0]?.text || "";
}

/**
 * Get message history excluding the last message
 * Useful for chat sessions where the last message is sent separately
 */
export function getHistoryExceptLast(messages: GeminiMessage[]): GeminiMessage[] {
  return messages.slice(0, -1);
}
