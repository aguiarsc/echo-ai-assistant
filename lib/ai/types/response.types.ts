/**
 * Response types for Gemini API
 */

/**
 * Metadata returned from stream/response processing
 */
export interface ResponseMetadata {
  text: string;
  thinking: string | null;
  usageMetadata: unknown;
  groundingMetadata: unknown;
}
