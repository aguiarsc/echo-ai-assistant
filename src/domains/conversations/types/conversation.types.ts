import { GoogleGenAI } from "@google/genai";

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

export const createGeminiClient = (apiKey: string) => {
  if (!apiKey) throw new Error("Gemini API key is required");
  return new GoogleGenAI({ apiKey });
};

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Adaptive thinking, cost efficiency" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Next generation features, speed, and realtime streaming" },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]["id"];

export type SafetySetting = {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
};

export interface GenerationParams {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
  includeSummaries?: boolean;
  safetySettings?: SafetySetting[];
  workMode?: 'standard' | 'concise';
  streamingSpeed?: number;
  groundingEnabled?: boolean;
  autoPresetEnabled?: boolean;
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

export interface FileMetadata {
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
  uploadTime?: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  turnId?: string;
  role: 'user' | 'model' | 'system' | 'thinking';
  content: string;
  timestamp: number;
  files?: FileMetadata[];
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
  pinned?: boolean;
  titleGenerated?: boolean;
  lastTitleMessageCount?: number;
  tokenCount?: {
    total: number;
    prompt: number;
    completion: number;
    thinking?: number;
  };
}
