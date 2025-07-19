import { GoogleGenAI } from "@google/genai";
import { 
  GeminiModel, 
  DEFAULT_GENERATION_PARAMS, 
  GenerationParams, 
  ChatMessage
} from "./index";

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
    const history = messages.filter(m => m.role !== 'thinking').map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

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
      const lastMessage = history[0]?.parts?.[0]?.text || "";
      
      if (onStream) {
        const thinkingConfig = params.thinkingEnabled
          ? { 
              includeThoughts: params.includeSummaries ?? true,
              thinkingBudget: params.thinkingBudget ?? -1
            }
          : { thinkingBudget: 0 };
        
        const result = await genAI.models.generateContentStream({
          model,
          contents: fileUris && fileUris.length > 0
            ? [{ text: lastMessage }, ...fileUris.map(uri => ({ fileData: { fileUri: uri } }))]
            : lastMessage,
          config: { 
            temperature: params.temperature,
            topP: params.topP,
            topK: params.topK,
            maxOutputTokens: params.maxOutputTokens,
            safetySettings: params.safetySettings,
            thinkingConfig 
          },
        });

        let responseText = "";
        let thinkingText = "";
        let finalUsageMetadata = null;

        for await (const chunk of result) {
          if (chunk.usageMetadata) finalUsageMetadata = chunk.usageMetadata;
          if (!chunk.candidates?.[0]?.content?.parts) continue;
          
          for (const part of chunk.candidates[0].content.parts) {
            if (!part.text) continue;
            if (part.thought) {
              thinkingText += part.text;
              // Send only the new thinking chunk, not the accumulated text
              onStream("", part.text);
            } else {
              // Send only the new response chunk, not the accumulated text
              onStream(part.text, null);
              responseText += part.text;
            }
          }
        }

        return { text: responseText, thinking: thinkingText || null, usageMetadata: finalUsageMetadata };
      } else {
        const thinkingConfig = params.thinkingEnabled
          ? { 
              includeThoughts: params.includeSummaries ?? true,
              thinkingBudget: params.thinkingBudget ?? -1
            }
          : { thinkingBudget: 0 };

        const response = await genAI.models.generateContent({
          model,
          contents: fileUris && fileUris.length > 0
            ? [{ text: lastMessage }, ...fileUris.map(uri => ({ fileData: { fileUri: uri } }))]
            : lastMessage,
          config: { 
            temperature: params.temperature,
            topP: params.topP,
            topK: params.topK,
            maxOutputTokens: params.maxOutputTokens,
            safetySettings: params.safetySettings,
            thinkingConfig 
          },
        });

        let thinking = null;
        let answer = null;

        if (params.thinkingEnabled && params.includeSummaries && response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (!part.text) continue;
            if (part.thought) thinking = part.text;
            else answer = part.text;
          }
        } else {
          answer = response.text || "";
        }

        return { text: answer || response.text || "", thinking, usageMetadata: response.usageMetadata };
      }
    } else {
      const chat = genAI.chats.create({
        model,
        history: history.slice(0, -1),
        config: {
          temperature: params.temperature,
          topP: params.topP,
          topK: params.topK,
          maxOutputTokens: params.maxOutputTokens,
          safetySettings: params.safetySettings,
          thinkingConfig: params.thinkingEnabled
            ? { 
                includeThoughts: params.includeSummaries ?? true,
                thinkingBudget: params.thinkingBudget ?? -1
              }
            : { thinkingBudget: 0 }
        }
      });

      const lastMessage = history[history.length - 1]?.parts?.[0]?.text || "";
      const messageParts = fileUris && fileUris.length > 0
        ? [{ text: lastMessage }, ...fileUris.map(uri => ({ fileData: { fileUri: uri } }))]
        : { text: lastMessage };

      if (onStream) {
        const result = await chat.sendMessageStream({ message: messageParts });
        let responseText = "";
        let thinkingText = "";
        let finalUsageMetadata = null;

        for await (const chunk of result) {
          if (chunk.usageMetadata) finalUsageMetadata = chunk.usageMetadata;
          if (!chunk.candidates?.[0]?.content?.parts) continue;
          
          for (const part of chunk.candidates[0].content.parts) {
            if (!part.text) continue;
            if (part.thought) {
              thinkingText += part.text;
              // Send only the new thinking chunk, not the accumulated text
              onStream("", part.text);
            } else {
              // Send only the new response chunk, not the accumulated text
              onStream(part.text, null);
              responseText += part.text;
            }
          }
        }

        return { text: responseText, thinking: thinkingText || null, usageMetadata: finalUsageMetadata };
      } else {
        const response = await chat.sendMessage({ message: messageParts });
        let thinking = null;
        let answer = response.text || "";

        if (params.thinkingEnabled && params.includeSummaries && response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (!part.text) continue;
            if (part.thought) thinking = part.text;
            else answer = part.text;
          }
        }

        return { text: answer, thinking, usageMetadata: response.usageMetadata };
      }
    }
  } catch (error: any) {
    console.error("Error generating response:", error);
    throw new Error(error.message || "Failed to generate response");
  }
}

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
    const contents = messages.filter(m => m.role !== 'thinking').map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

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
