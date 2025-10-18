/**
 * File context types for AI operations
 */

/**
 * Interface for file content that will be sent as context to Gemini
 */
export interface FileContextContent {
  name: string;
  path: string;
  content: string;
  type: string;
  lastModified?: number;
}
