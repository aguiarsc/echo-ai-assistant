export { ConversationLayout } from "./components/ConversationLayout";
export { ConversationWindow } from "./components/ConversationWindow";
export { MessageInput } from "./components/MessageInput";
export { MessageDisplay } from "./components/MessageDisplay";
export { CodeBlock } from "./components/CodeBlock";
export { ModelSelector } from "./components/ModelSelector";
export { ConversationSidebar } from "./components/ConversationSidebar";
export { ConversationSettings } from "./components/ConversationSettings";
export { FileAttachment } from "./components/FileAttachment";
export { FileContext, FileContextSummary } from "./components/FileContextIndicator";

export { useConversation } from "./hooks/use-conversation";

export { generateChatTitle, useAutomaticTitleGeneration } from "./services/title-generation-service";

export { useChatStore, initializeDexieStore } from "./storage/conversation-store";

export type {
  Chat,
  ChatMessage,
  GeminiModel,
  GenerationParams,
  SafetySetting,
  HarmCategory,
  HarmBlockThreshold
} from "./types/conversation.types";

export {
  GEMINI_MODELS,
  DEFAULT_GENERATION_PARAMS,
  createGeminiClient
} from "./types/conversation.types";
