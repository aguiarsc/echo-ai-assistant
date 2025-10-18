/**
 * Chat types for Gemini
 */

import { ChatMessage } from "./message.types";
import { GeminiModel } from "./gemini-models.types";

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: GeminiModel;
  createdAt: number;
  updatedAt: number;
  systemInstruction?: string;
  pinned?: boolean; // Flag to prevent auto-deletion
  titleGenerated?: boolean; // Track if title was auto-generated to prevent overwriting manual titles
  lastTitleMessageCount?: number; // Message count when title was last generated (for periodic regeneration)
  tokenCount?: {
    total: number;
    prompt: number;
    completion: number;
    thinking?: number;
  };
}
