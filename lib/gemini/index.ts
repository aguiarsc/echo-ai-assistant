import { GoogleGenAI } from "@google/genai";

// Define the harm categories and thresholds based on Gemini documentation
export enum HarmCategory {
  HARM_CATEGORY_HARASSMENT = "HARM_CATEGORY_HARASSMENT",
  HARM_CATEGORY_HATE_SPEECH = "HARM_CATEGORY_HATE_SPEECH",
  HARM_CATEGORY_SEXUALLY_EXPLICIT = "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  HARM_CATEGORY_DANGEROUS_CONTENT = "HARM_CATEGORY_DANGEROUS_CONTENT",
  HARM_CATEGORY_CIVIC_INTEGRITY = "HARM_CATEGORY_CIVIC_INTEGRITY",
}

export enum HarmBlockThreshold {
  BLOCK_NONE = "BLOCK_NONE",
  BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH",
  BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE",
  BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE",
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = "HARM_BLOCK_THRESHOLD_UNSPECIFIED",
}

// Initialize Google Gemini client
export const createGeminiClient = (apiKey: string) => {
  if (!apiKey) throw new Error("Gemini API key is required");
  return new GoogleGenAI({ apiKey });
};

// Available Gemini models
export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Adaptive thinking, cost efficiency" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Next generation features, speed, and realtime streaming" },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]["id"];

// Safety category and threshold enums for type safety
export type SafetySetting = {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
};

// Default generation parameters
export interface GenerationParams {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
  includeSummaries?: boolean;
  safetySettings?: SafetySetting[];
  writingMode?: 'standard' | 'novel' | 'concise'; // Track the current writing style mode
}

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  // Higher temperature (0.9) for more creative, diverse outputs in novel writing
  temperature: 0.9,
  // Higher top_p for more diverse word selection
  topP: 0.98,
  // Higher top_k to allow consideration of more creative options
  topK: 60,
  // Maximum output tokens for longer, more detailed novel content
  maxOutputTokens: 8192,
  // Enable thinking for better narrative planning and character development
  thinkingEnabled: true,
  // Dynamic thinking budget - let the model decide based on complexity (-1)
  // For manual control: 1024-8192 for Flash, 128-32768 for Pro
  thinkingBudget: -1,
  // Show summaries of thinking process for narrative structure insights
  includeSummaries: true,
  // Novel writing mode enabled by default
  writingMode: 'novel',
  safetySettings: [
    // Default to BLOCK_NONE as specified for the newer models
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

// Types for our chat history
import { FileMetadata } from "./files-api";

// ... (keep existing enums and interfaces)

export interface ChatMessage {
  id: string;
  turnId?: string; // Unique ID for a single user-model turn
  role: 'user' | 'model' | 'system' | 'thinking';
  content: string;
  timestamp: number;
  files?: FileMetadata[]; // Add support for file attachments
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: GeminiModel;
  createdAt: number;
  updatedAt: number;
  systemInstruction?: string;
  pinned?: boolean; // Flag to prevent auto-deletion
  tokenCount?: {
    total: number;
    prompt: number;
    completion: number;
    thinking?: number;
  };
}
