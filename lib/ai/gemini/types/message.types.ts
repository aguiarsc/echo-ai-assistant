/**
 * Message types for Gemini chat
 */

import { FileMetadata } from "./file.types";

export interface ChatMessage {
  id: string;
  turnId?: string; // Unique ID for a single user-model turn
  role: 'user' | 'model' | 'system' | 'thinking';
  content: string;
  timestamp: number;
  files?: FileMetadata[]; // Add support for file attachments
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
    groundingSupports?: Array<{
      segment?: {
        startIndex: number;
        endIndex: number;
        text: string;
      };
      groundingChunkIndices?: number[];
    }>;
  };
}

/**
 * Gemini API message format
 */
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Simple message format for context building
 */
export interface SimpleMessage {
  role: 'user' | 'model';
  content: string;
}
