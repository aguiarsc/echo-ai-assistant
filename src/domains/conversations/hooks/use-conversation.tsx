"use client"

import { useState, useCallback, useRef } from "react";
import { useChatStore } from "@/domains/conversations/storage/conversation-store";
import { generateGeminiResponse, countTokens } from "@/infrastructure/ai-integration/gemini-client";
import { useAutomaticTitleGeneration } from "@/domains/conversations/services/title-generation-service";
import { FileMetadata } from "@/domains/conversations/types/conversation.types";
import { useFileContextStore } from "@/domains/writing-projects/storage/file-context-store";
import { useFilesStore } from "@/domains/writing-projects/storage/project-store";
import { prepareFileContext, enhanceMessageWithContext, generateThinkingContentWithContext } from "@/domains/writing-projects/services/file-context-service";
import { buildSystemInstruction } from "@/infrastructure/ai-integration/system-instruction-builder";

const DEFAULT_TYPING_SPEED = 25;

export function useConversation() {
  const {
    apiKey,
    chats,
    activeChat,
    generationParams,
    isStreaming,
    setIsStreaming,
    addMessage,
    updateMessage,
    setTokenCount,
    globalSystemInstruction
  } = useChatStore();

  const { generateAndUpdateTitle } = useAutomaticTitleGeneration();
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamBufferRef = useRef({ text: "", thinking: "" });
  const isStreamFinishedRef = useRef(false);
  const thinkingCompleteRef = useRef(false);

  const currentChat = chats.find(chat => chat.id === activeChat);

  const stopTypingInterval = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (content: string, attachedFiles: FileMetadata[] = []) => {
    if (!activeChat || !apiKey || !content.trim()) {
      setError("Cannot send message: chat not active, API key not set, or empty message");
      return;
    }

    const chat = chats.find(c => c.id === activeChat);
    if (!chat) {
      setError("Chat not found");
      return;
    }

    stopTypingInterval();
    isStreamFinishedRef.current = false;
    thinkingCompleteRef.current = false;
    streamBufferRef.current = { text: "", thinking: "" };

    const turnId = crypto.randomUUID();

    try {
      const fileStore = useFileContextStore.getState();
      const selectedFiles = fileStore.getSelectedFiles();
      const filesStore = useFilesStore.getState();
      
      const fileContexts = prepareFileContext(selectedFiles, filesStore.getNodeById);
      
      const enhancedContent = enhanceMessageWithContext(content, fileContexts);

      addMessage(chat.id, { 
        role: "user", 
        content: enhancedContent, 
        files: attachedFiles,
        turnId 
      });
      const modelMessageId = addMessage(chat.id, { role: "model", content: "", turnId });
      let thinkingMessageId: string | null = null;
      if (generationParams.thinkingEnabled && generationParams.includeSummaries) {
        const thinkingContent = generateThinkingContentWithContext(fileContexts);
        thinkingMessageId = addMessage(chat.id, { role: "thinking", content: thinkingContent, turnId });
      }

      abortControllerRef.current = new AbortController();
      setIsStreaming(true);

      const updatedChat = useChatStore.getState().chats.find(c => c.id === chat.id);
      if (!updatedChat) throw new Error("Chat not found");

      typingIntervalRef.current = setInterval(() => {
        const buffer = streamBufferRef.current;
        let processedCharacter = false;

        if (thinkingMessageId && buffer.thinking.length > 0 && !thinkingCompleteRef.current) {
          const char = buffer.thinking.slice(0, 1);
          buffer.thinking = buffer.thinking.slice(1);
          updateMessage(chat.id, thinkingMessageId, char, true);
          processedCharacter = true;
          
          if (buffer.thinking.length === 0 && isStreamFinishedRef.current) {
            thinkingCompleteRef.current = true;
          }
        }
        else if (buffer.text.length > 0 && (thinkingCompleteRef.current || !thinkingMessageId)) {
          const char = buffer.text.slice(0, 1);
          buffer.text = buffer.text.slice(1);
          updateMessage(chat.id, modelMessageId, char, true);
          processedCharacter = true;
        }

        if (!processedCharacter && isStreamFinishedRef.current && 
            (thinkingCompleteRef.current || !thinkingMessageId) && 
            buffer.text.length === 0 && buffer.thinking.length === 0) {
          stopTypingInterval();
          setIsStreaming(false);
          abortControllerRef.current = null;
        }
      }, generationParams.streamingSpeed || DEFAULT_TYPING_SPEED);

      const enhancedSystemInstruction = buildSystemInstruction(
        globalSystemInstruction || "",
        fileContexts.length > 0 ? fileContexts : undefined
      );

      const response = await generateGeminiResponse({
        systemInstruction: enhancedSystemInstruction,
        apiKey,
        model: chat.model,
        messages: updatedChat.messages.filter(m => m.id !== modelMessageId),
        params: generationParams,
        fileUris: attachedFiles.length > 0 && attachedFiles.some(f => f.uri) 
          ? attachedFiles.filter(f => f.uri).map(file => file.uri) 
          : undefined,
        onStream: (chunk, thinking) => {
          streamBufferRef.current.text += chunk;
          if (thinking) {
            streamBufferRef.current.thinking += thinking;
          }
        },
        signal: abortControllerRef.current.signal,
      });

      if (response.usageMetadata) {
        setTokenCount(chat.id, {
          total: response.usageMetadata.totalTokenCount || 0,
          prompt: response.usageMetadata.promptTokenCount || 0,
          completion: response.usageMetadata.candidatesTokenCount || 0,
          thinking: response.usageMetadata.thoughtsTokenCount,
        });
        generateAndUpdateTitle(chat.id);
      } else {
        const updatedChatWithResponse = useChatStore.getState().chats.find(c => c.id === chat.id);
        if (updatedChatWithResponse) {
          countTokens({ apiKey, model: chat.model, messages: updatedChatWithResponse.messages })
            .then(tokenCountResponse => {
              setTokenCount(chat.id, {
                total: tokenCountResponse.totalTokens || 0, prompt: 0, completion: 0,
              });
              generateAndUpdateTitle(chat.id);
            })
            .catch(tokenError => console.error("Error counting tokens:", tokenError));
        }
      }

      if (response.groundingMetadata) {
        const currentChat = useChatStore.getState().chats.find(c => c.id === chat.id);
        if (currentChat) {
          const modelMessage = currentChat.messages.find(m => m.id === modelMessageId);
          if (modelMessage) {
            updateMessage(chat.id, modelMessageId, '', false, response.groundingMetadata);
          }
        }
      }

      setError(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error sending message:", err);
        setError(err.message || "Failed to send message");
      }
    } finally {
      isStreamFinishedRef.current = true;
    }
  }, [
    activeChat, apiKey, chats, generationParams, addMessage, updateMessage, 
    setIsStreaming, setTokenCount, generateAndUpdateTitle, stopTypingInterval
  ]);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopTypingInterval();
    isStreamFinishedRef.current = true;
    thinkingCompleteRef.current = false;
    streamBufferRef.current = { text: "", thinking: "" };
    setIsStreaming(false);
  }, [stopTypingInterval, setIsStreaming]);

  const getRelatedThinking = useCallback((messageTurnId?: string) => {
    if (!currentChat || !messageTurnId) return null;
    return currentChat.messages.find(m => m.role === 'thinking' && m.turnId === messageTurnId) || null;
  }, [currentChat]);

  return {
    sendMessage,
    stopGenerating,
    isStreaming,
    error,
    currentChat,
    getRelatedThinking,
    generateTitle: activeChat ? () => generateAndUpdateTitle(activeChat) : undefined
  };
}
