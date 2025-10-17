import { GenerationParams } from "@/domains/conversations/types/conversation.types";

export function buildThinkingConfig(params: GenerationParams) {
  return params.thinkingEnabled
    ? { 
        includeThoughts: params.includeSummaries ?? true,
        thinkingBudget: params.thinkingBudget ?? -1
      }
    : { thinkingBudget: 0 };
}

export function buildToolsConfig(params: GenerationParams): any[] | undefined {
  if (params.groundingEnabled) {
    return [{ googleSearch: {} }];
  }
  return undefined;
}

export function buildGenerationConfig(params: GenerationParams): any {
  const config: any = {
    temperature: params.temperature,
    topP: params.topP,
    topK: params.topK,
    maxOutputTokens: params.maxOutputTokens,
    safetySettings: params.safetySettings,
    thinkingConfig: buildThinkingConfig(params)
  };

  const tools = buildToolsConfig(params);
  if (tools) {
    config.tools = tools;
  }

  return config;
}

export function buildChatConfig(params: GenerationParams): any {
  return buildGenerationConfig(params);
}

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
