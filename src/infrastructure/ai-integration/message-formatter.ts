import { ChatMessage } from "@/domains/conversations/types/conversation.types";

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface SimpleMessage {
  role: 'user' | 'model';
  content: string;
}

export function formatMessagesForAPI(messages: ChatMessage[]): GeminiMessage[] {
  return messages
    .filter(m => m.role !== 'thinking')
    .map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
}

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

export function getLastUserMessage(messages: GeminiMessage[]): string {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.parts?.[0]?.text || "";
}

export function getHistoryExceptLast(messages: GeminiMessage[]): GeminiMessage[] {
  return messages.slice(0, -1);
}
