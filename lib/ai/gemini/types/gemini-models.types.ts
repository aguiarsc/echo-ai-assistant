/**
 * Gemini model types and definitions
 */

// Available Gemini models
export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Adaptive thinking, cost efficiency" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Next generation features, speed, and realtime streaming" },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]["id"];
