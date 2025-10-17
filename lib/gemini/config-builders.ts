/**
 * Configuration builders for Gemini API requests
 * Centralizes the logic for building generation configs, tools, and thinking configs
 */

import { GenerationParams } from "./index";

/**
 * Build thinking configuration based on generation parameters
 */
export function buildThinkingConfig(params: GenerationParams) {
  return params.thinkingEnabled
    ? { 
        includeThoughts: params.includeSummaries ?? true,
        thinkingBudget: params.thinkingBudget ?? -1
      }
    : { thinkingBudget: 0 };
}

/**
 * Build tools configuration (e.g., grounding/web search)
 */
export function buildToolsConfig(params: GenerationParams): any[] | undefined {
  if (params.groundingEnabled) {
    return [{ googleSearch: {} }];
  }
  return undefined;
}

/**
 * Build complete generation configuration
 */
export function buildGenerationConfig(params: GenerationParams): any {
  const config: any = {
    temperature: params.temperature,
    topP: params.topP,
    topK: params.topK,
    maxOutputTokens: params.maxOutputTokens,
    safetySettings: params.safetySettings,
    thinkingConfig: buildThinkingConfig(params)
  };

  // Add tools if enabled
  const tools = buildToolsConfig(params);
  if (tools) {
    config.tools = tools;
  }

  return config;
}

/**
 * Build chat-specific configuration
 */
export function buildChatConfig(params: GenerationParams): any {
  return buildGenerationConfig(params);
}

/**
 * Prepare content with file URIs if available
 */
export function buildContentWithFiles(
  message: string, 
  fileUris?: string[]
): any {
  if (fileUris && fileUris.length > 0) {
    return [
      { text: message }, 
      ...fileUris.map(uri => ({ fileData: { fileUri: uri } }))
    ];
  }
  return message;
}
