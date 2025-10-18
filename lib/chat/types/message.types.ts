/**
 * Message types for chat
 */

import { FileMetadata } from "@/lib/ai/gemini/types";

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

export type MessageRole = 'user' | 'model' | 'system' | 'thinking';
