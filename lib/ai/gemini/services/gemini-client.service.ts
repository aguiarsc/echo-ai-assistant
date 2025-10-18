/**
 * Gemini client service
 * Handles all communication with Google Gemini API
 */

import { GoogleGenAI } from "@google/genai";
import { 
  GeminiModel, 
  DEFAULT_GENERATION_PARAMS, 
  GenerationParams, 
  ChatMessage
} from "../types";
import { buildGenerationConfig, buildContentWithFiles } from "../utils";
import { formatMessagesForAPI, getLastUserMessage, getHistoryExceptLast } from "../utils";
import { processStreamResponse, extractThinkingAndAnswer } from "../utils";

/**
 * Initialize Google Gemini client
 */
export const createGeminiClient = (apiKey: string) => {
  if (!apiKey) throw new Error("Gemini API key is required");
  return new GoogleGenAI({ apiKey });
};

/**
 * Generate a response from Gemini
 */
export async function generateGeminiResponse({
  apiKey,
  model,
  messages,
  systemInstruction,
  params = DEFAULT_GENERATION_PARAMS,
  fileUris,
  onStream,
  signal
}: {
  apiKey: string;
  model: GeminiModel;
  messages: ChatMessage[];
  systemInstruction?: string;
  params?: GenerationParams;
  fileUris?: string[];
  onStream?: (chunk: string, thinking?: string | null) => void;
  signal?: AbortSignal;
}) {
  try {
    const genAI = new GoogleGenAI({ apiKey });
    
    // Convert our message format to Google GenAI format
    const history = formatMessagesForAPI(messages);

    // The 'systemInstruction' parameter is not consistently reliable.
    // To ensure the instruction is followed, we prepend it to the latest user message.
    if (systemInstruction && history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (lastMessage.role === 'user') {
        const originalContent = lastMessage.parts[0].text;
        // Format the instruction and user message for the model.
        lastMessage.parts[0].text = `${systemInstruction}\n\n${originalContent}`;
      }
    }

    // If there's only one message, make a generateContent call directly
    if (history.length <= 1) {
      const lastMessage = getLastUserMessage(history);
      
      if (onStream) {
        const config = buildGenerationConfig(params);
        
        const result = await genAI.models.generateContentStream({
          model,
          contents: buildContentWithFiles(lastMessage, fileUris),
          config,
        });

        return await processStreamResponse(result, onStream);
      } else {
        const config = buildGenerationConfig(params);
        
        const response = await genAI.models.generateContent({
          model,
          contents: buildContentWithFiles(lastMessage, fileUris),
          config,
        });

        const { thinking, answer, groundingMetadata } = extractThinkingAndAnswer(response, params);

        return { text: answer, thinking, usageMetadata: response.usageMetadata, groundingMetadata };
      }
    } else {
      const chatConfig = buildGenerationConfig(params);
      
      const chat = genAI.chats.create({
        model,
        history: getHistoryExceptLast(history),
        config: chatConfig
      });

      const lastMessage = getLastUserMessage(history);
      const messageParts = buildContentWithFiles(lastMessage, fileUris);

      if (onStream) {
        const result = await chat.sendMessageStream({ message: messageParts });
        return await processStreamResponse(result, onStream);
      } else {
        const response = await chat.sendMessage({ message: messageParts });
        const { thinking, answer, groundingMetadata } = extractThinkingAndAnswer(response, params);

        return { text: answer, thinking, usageMetadata: response.usageMetadata, groundingMetadata };
      }
    }
  } catch (error: any) {
    console.error("Error generating response:", error);
    throw new Error(error.message || "Failed to generate response");
  }
}

/**
 * Count tokens for messages
 */
export async function countTokens({
  apiKey,
  model,
  messages
}: {
  apiKey: string;
  model: GeminiModel;
  messages: ChatMessage[];
}) {
  try {
    const genAI = new GoogleGenAI({ apiKey });
    
    // Convert our message format to Google GenAI format
    const contents = formatMessagesForAPI(messages);

    const response = await genAI.models.countTokens({
      model,
      contents
    });

    return {
      totalTokens: response.totalTokens
    };
  } catch (error: any) {
    console.error("Error counting tokens:", error);
    throw new Error(error.message || "Failed to count tokens");
  }
}
