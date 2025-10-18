/**
 * Response types for Gemini API
 */

/**
 * Metadata returned from stream/response processing
 */
export interface UsageMetadata {
  totalTokenCount?: number;
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
}

export interface ResponseMetadata {
  text: string;
  thinking: string | null;
  usageMetadata: UsageMetadata | null;
  groundingMetadata: unknown;
}
