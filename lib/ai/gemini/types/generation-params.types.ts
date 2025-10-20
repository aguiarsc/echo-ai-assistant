/**
 * Generation parameters types for Gemini API
 */

import { SafetySetting, HarmCategory, HarmBlockThreshold } from "./safety.types";

// Generation parameters interface
export interface GenerationParams {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
  includeSummaries?: boolean;
  safetySettings?: SafetySetting[];
  workMode?: 'standard' | 'concise'; // Track the current work style mode
  streamingSpeed?: number; // Delay in milliseconds between characters (5-15ms)
  groundingEnabled?: boolean; // Enable Google Search grounding for real-time information
  autoPresetEnabled?: boolean; // Let AI choose the best writing preset automatically
}

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  temperature: 0.5,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 4096,
  thinkingEnabled: false,
  thinkingBudget: -1,
  includeSummaries: true,
  workMode: 'standard',
  streamingSpeed: 5,
  groundingEnabled: false,
  autoPresetEnabled: false,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
};
