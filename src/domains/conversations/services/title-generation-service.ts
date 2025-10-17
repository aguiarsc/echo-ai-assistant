import { ChatMessage, GeminiModel } from "@/domains/conversations/types/conversation.types";
import { generateGeminiResponse } from "@/infrastructure/ai-integration/gemini-client";
import { useChatStore } from "@/domains/conversations/storage/conversation-store";

const generatingTitles = new Set<string>();

export async function generateChatTitle(
  messages: ChatMessage[], 
  model: GeminiModel,
  apiKey: string
): Promise<string> {
  if (messages.length < 2) {
    return "New Chat";
  }

  const conversationMessages = messages
    .filter(msg => msg.role !== "thinking")
    .slice(-6);
    
  const conversationSummary = conversationMessages
    .map(msg => `${msg.role === "user" ? "Human" : "AI"}: ${msg.content}`)
    .join("\n\n");

  try {
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
        maxOutputTokens: 15,
        safetySettings: []
      }
    });

    let title = response.text || "New Chat";
    title = title.replace(/^["']|["']$/g, "").trim();
    
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }
    
    return title;
  } catch (error) {
    console.error("Failed to generate chat title:", error);
    return "New Chat";
  }
}

export function useAutomaticTitleGeneration() {
  const { chats, updateChatTitle, apiKey, autoGenerateTitles } = useChatStore();
  
  const generateAndUpdateTitle = async (chatId: string): Promise<boolean> => {
    if (!autoGenerateTitles) return false;
    
    if (generatingTitles.has(chatId)) return false;
    
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return false;
    
    if (chat.titleGenerated === false) return false;
    
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
