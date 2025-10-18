/**
 * Title generator service - generates chat titles based on conversation content
 */

import { ChatMessage } from "@/lib/chat/types";
import { GeminiModel } from "@/lib/ai/gemini/types";
import { generateGeminiResponse } from "@/lib/ai/gemini/services";
import { useChatStore } from "@/lib/chat/stores/chat.store";

// Track chats currently generating titles to prevent race conditions
const generatingTitles = new Set<string>();

/**
 * Generates a chat title based on the conversation content
 * @param messages Chat messages to analyze
 * @param model Gemini model to use for title generation
 * @returns A promise resolving to the generated title
 */
export async function generateChatTitle(
  messages: ChatMessage[], 
  model: GeminiModel,
  apiKey: string
): Promise<string> {
  // Don't generate a title if there aren't enough messages for context
  if (messages.length < 2) {
    return "New Chat";
  }

  // Filter out thinking messages and include only a limited number of messages
  const conversationMessages = messages
    .filter(msg => msg.role !== "thinking")
    .slice(-6); // Use the last 6 messages for context
    
  // Create a condensed conversation summary for the prompt
  const conversationSummary = conversationMessages
    .map(msg => `${msg.role === "user" ? "Human" : "AI"}: ${msg.content}`)
    .join("\n\n");

  try {
    // Create a prompt that asks for a concise, relevant title
    const response = await generateGeminiResponse({
      apiKey,
      model,
      messages: [
        {
          id: "system-1",
          role: "system",
          content: "Generate a clear, descriptive title (under 50 characters) that captures the main topic of this conversation. Be direct and specific - avoid vague titles like 'Interesting Discussion' or 'Helpful Chat'. Just respond with the title, nothing else.",
          timestamp: Date.now()
        },
        {
          id: "user-1",
          role: "user",
          content: `Based on this conversation, what would be a clear, descriptive title that summarizes the main topic?\n\n${conversationSummary}`,
          timestamp: Date.now()
        }
      ],
      params: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 15, // ~60 chars at ~4 chars/token
        safetySettings: []
      }
    });

    // Clean up the title - remove quotes and trim
    let title = response.text || "New Chat";
    title = title.replace(/^["']|["']$/g, "").trim();
    
    // Limit length if it's somehow still too long
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }
    
    return title;
  } catch (error) {
    console.error("Failed to generate chat title:", error);
    return "New Chat"; // Fallback to default title
  }
}

/**
 * Hook to manage automatic title generation for chats
 */
export function useAutomaticTitleGeneration() {
  const { chats, updateChatTitle, apiKey, autoGenerateTitles } = useChatStore();
  
  /**
   * Automatically generate and update a chat title if conditions are met
   * @param chatId The chat ID to update
   * @returns A promise resolving to true if title was updated, false otherwise
   */
  const generateAndUpdateTitle = async (chatId: string): Promise<boolean> => {
    // Check user preference first
    if (!autoGenerateTitles) return false;
    
    // Prevent race conditions - skip if already generating for this chat
    if (generatingTitles.has(chatId)) return false;
    
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return false;
    
    // Don't generate if title was manually set
    if (chat.titleGenerated === false) return false;
    
    // Generate if:
    // 1. Never generated before (titleGenerated is undefined) and we have 3+ messages
    // 2. Auto-generated before, and we've added 10+ messages since last generation
    const neverGenerated = chat.titleGenerated === undefined && chat.messages.length >= 3;
    const needsRegeneration = chat.titleGenerated === true && 
      chat.messages.length >= (chat.lastTitleMessageCount || 0) + 10;
    
    const shouldGenerateTitle = neverGenerated || needsRegeneration;
      
    if (shouldGenerateTitle) {
      generatingTitles.add(chatId);
      
      try {
        const newTitle = await generateChatTitle(
          chat.messages,
          chat.model,
          apiKey
        );
        
        // Update the title if we got something meaningful
        if (newTitle && newTitle !== "New Chat") {
          updateChatTitle(chatId, newTitle);
          return true;
        }
      } catch (error) {
        console.error("Failed to update chat title:", error);
      } finally {
        generatingTitles.delete(chatId);
      }
    }
    
    return false;
  };
  
  return { generateAndUpdateTitle };
}
