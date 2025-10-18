/**
 * Response handler utilities for Gemini API
 * Centralizes the logic for parsing and extracting data from Gemini responses
 */

import { GenerationParams } from "../types";
import { ResponseMetadata, UsageMetadata } from "@/lib/ai/types";

/**
 * Handle a streaming chunk from Gemini
 * Processes both thinking and regular response content
 * 
 * @param chunk - The streaming chunk from Gemini
 * @param onStream - Callback for streaming content
 * @returns Accumulated text and metadata
 */
export function handleStreamChunk(
  chunk: {
    usageMetadata?: UsageMetadata;
    candidates?: Array<{
      groundingMetadata?: unknown;
      content?: {
        parts?: Array<{
          text?: string;
          thought?: boolean;
        }>;
      };
    }>;
  },
  onStream?: (responseChunk: string, thinkingChunk: string | null) => void
): { responseText: string; thinkingText: string; usageMetadata: UsageMetadata | null; groundingMetadata: unknown } {
  let responseText = "";
  let thinkingText = "";
  let usageMetadata: UsageMetadata | null = null;
  let groundingMetadata: unknown = null;

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

/**
 * Process a complete stream response
 * Accumulates all chunks and returns final metadata
 */
export async function processStreamResponse(
  stream: AsyncIterable<{
    usageMetadata?: UsageMetadata;
    candidates?: Array<{
      groundingMetadata?: unknown;
      content?: {
        parts?: Array<{
          text?: string;
          thought?: boolean;
        }>;
      };
    }>;
  }>,
  onStream?: (responseChunk: string, thinkingChunk: string | null) => void
): Promise<ResponseMetadata> {
  let responseText = "";
  let thinkingText = "";
  let finalUsageMetadata: UsageMetadata | null = null;
  let groundingMetadata: unknown = null;

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

/**
 * Extract thinking and answer from a non-streaming response
 * Separates thought parts from regular content
 */
export function extractThinkingAndAnswer(
  response: {
    text?: string;
    candidates?: Array<{
      groundingMetadata?: unknown;
      content?: {
        parts?: Array<{
          text?: string;
          thought?: boolean;
        }>;
      };
    }>;
  },
  params: GenerationParams
): { thinking: string | null; answer: string; groundingMetadata: unknown } {
  let thinking = null;
  let answer = (response.text as string) || "";
  let groundingMetadata: unknown = null;

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

  return { thinking, answer: answer || (response.text as string) || "", groundingMetadata };
}

/**
 * Extract grounding metadata from response candidate
 */
export function extractGroundingMetadata(candidate: { groundingMetadata?: unknown }): unknown {
  return candidate?.groundingMetadata || null;
}

/**
 * Validate and normalize response metadata
 */
export function normalizeResponseMetadata(metadata: Partial<ResponseMetadata>): ResponseMetadata {
  return {
    text: metadata.text || "",
    thinking: metadata.thinking || null,
    usageMetadata: metadata.usageMetadata || null,
    groundingMetadata: metadata.groundingMetadata || null
  };
}
