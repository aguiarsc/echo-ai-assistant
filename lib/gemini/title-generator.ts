import { ChatMessage, GeminiModel } from "./index";
import { generateGeminiResponse } from "./api";
import { useChatStore } from "./store";

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
          content: "You are a practical assistant specializing in creating concise, descriptive titles for conversations. Generate a straightforward title that summarizes the main topic or purpose of the conversation. Use clear, descriptive language rather than creative or poetic expressions. Keep titles under 50 characters, and aim for something informative that accurately reflects the content. Only respond with the title text, nothing else.",
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
        temperature: 0.7, // Lower temperature for more focused, practical titles
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 25,
        safetySettings: [] // Use default safety settings
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
  const { chats, updateChatTitle, apiKey } = useChatStore();
  
  /**
   * Automatically generate and update a chat title if conditions are met
   * @param chatId The chat ID to update
   * @returns A promise resolving when title generation is complete
   */
  const generateAndUpdateTitle = async (chatId: string): Promise<void> => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    
    // Only generate a title if it's still the default or if specifically requested
    const shouldGenerateTitle = 
      chat.title === "New Chat" && 
      chat.messages.length >= 3;
      
    if (shouldGenerateTitle) {
      try {
        const newTitle = await generateChatTitle(
          chat.messages,
          chat.model,
          apiKey
        );
        
        // Update the title if we got something meaningful
        if (newTitle && newTitle !== "New Chat") {
          updateChatTitle(chatId, newTitle);
        }
      } catch (error) {
        console.error("Failed to update chat title:", error);
      }
    }
  };
  
  return { generateAndUpdateTitle };
}
