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
  workMode?: 'standard' | 'business' | 'technical' | 'concise'; // Track the current work style mode
  streamingSpeed?: number; // Delay in milliseconds between characters (5-15ms)
  groundingEnabled?: boolean; // Enable Google Search grounding for real-time information
}

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  temperature: 0.5,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 4096,
  thinkingEnabled: true,
  thinkingBudget: -1,
  includeSummaries: true,
  workMode: 'business',
  streamingSpeed: 5,
  groundingEnabled: false,
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
