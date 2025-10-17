import { GenerationParams } from "@/domains/conversations/types/conversation.types";

export interface ResponseMetadata {
  text: string;
  thinking: string | null;
  usageMetadata: any;
  groundingMetadata: any;
}

export function handleStreamChunk(
  chunk: any,
  onStream?: (responseChunk: string, thinkingChunk: string | null) => void
): { responseText: string; thinkingText: string; usageMetadata: any; groundingMetadata: any } {
  let responseText = "";
  let thinkingText = "";
  let usageMetadata = null;
  let groundingMetadata = null;

  if (chunk.usageMetadata) {
    usageMetadata = chunk.usageMetadata;
  }
  
  if (chunk.candidates?.[0]?.groundingMetadata) {
    groundingMetadata = chunk.candidates[0].groundingMetadata;
  }
  
  if (chunk.candidates?.[0]?.content?.parts) {
    for (const part of chunk.candidates[0].content.parts) {
      if (!part.text) continue;
      
      if (part.thought) {
        thinkingText += part.text;
        if (onStream) onStream("", part.text);
      } else {
        responseText += part.text;
        if (onStream) onStream(part.text, null);
      }
    }
  }

  return { responseText, thinkingText, usageMetadata, groundingMetadata };
}

export async function processStreamResponse(
  stream: AsyncIterable<any>,
  onStream?: (responseChunk: string, thinkingChunk: string | null) => void
): Promise<ResponseMetadata> {
  let responseText = "";
  let thinkingText = "";
  let finalUsageMetadata = null;
  let groundingMetadata = null;

  for await (const chunk of stream) {
    const result = handleStreamChunk(chunk, onStream);
    responseText += result.responseText;
    thinkingText += result.thinkingText;
    
    if (result.usageMetadata) finalUsageMetadata = result.usageMetadata;
    if (result.groundingMetadata) groundingMetadata = result.groundingMetadata;
  }

  return {
    text: responseText,
    thinking: thinkingText || null,
    usageMetadata: finalUsageMetadata,
    groundingMetadata
  };
}

export function extractThinkingAndAnswer(
  response: any,
  params: GenerationParams
): { thinking: string | null; answer: string; groundingMetadata: any } {
  let thinking = null;
  let answer = response.text || "";
  let groundingMetadata = null;

  if (params.thinkingEnabled && params.includeSummaries && response.candidates?.[0]?.content?.parts) {
    if (response.candidates?.[0]?.groundingMetadata) {
      groundingMetadata = response.candidates[0].groundingMetadata;
    }
    
    for (const part of response.candidates[0].content.parts) {
      if (!part.text) continue;
      
      if (part.thought) {
        thinking = part.text;
      } else {
        answer = part.text;
      }
    }
  }

  return { thinking, answer: answer || response.text || "", groundingMetadata };
}

export function extractGroundingMetadata(candidate: any): any {
  return candidate?.groundingMetadata || null;
}

export function normalizeResponseMetadata(metadata: Partial<ResponseMetadata>): ResponseMetadata {
  return {
    text: metadata.text || "",
    thinking: metadata.thinking || null,
    usageMetadata: metadata.usageMetadata || null,
    groundingMetadata: metadata.groundingMetadata || null
  };
}
