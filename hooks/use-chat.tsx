import { useState, useCallback, useRef } from "react";
import { useChatStore } from "@/lib/gemini/store";
import { generateGeminiResponse, countTokens } from "@/lib/gemini/api";
import { useAutomaticTitleGeneration } from "@/lib/gemini/title-generator";
import { FileMetadata } from "@/lib/gemini/files-api";
import { useFileContextStore } from "@/lib/files/context-store";
import { useFilesStore, FileNode } from "@/lib/files/store";
import { generateFileContextInstruction, convertFileToContext, generateFileContentText } from "@/lib/gemini/file-context-adapter";
import { calendarFunctionDeclarations, calendarFunctions } from "@/lib/calendar/functions";

// Default typing speed fallback (will be overridden by generationParams.streamingSpeed)
const DEFAULT_TYPING_SPEED = 25;

export function useChat() {
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

  // Helper function to recursively collect all files from a folder structure
  const collectFilesFromFolders = useCallback((selectedFiles: FileNode[]): FileNode[] => {
    const filesStore = useFilesStore.getState();
    const result: FileNode[] = [];
    
    // Process each selected node (file or folder)
    const processNode = (node: FileNode) => {
      if (node.type === "file") {
        // If it's a file, simply add it
        result.push(node);
      } else if (node.type === "folder" && node.children) {
        // If it's a folder, add it and recursively process all children
        result.push(node);
        
        // Process all children
        node.children.forEach(childId => {
          const childNode = filesStore.getNodeById(childId);
          if (childNode) {
            processNode(childNode);
          }
        });
      }
    };
    
    // Process all initially selected files/folders
    selectedFiles.forEach(processNode);
    
    return result;
  }, []);

  // Handle function calls from Gemini
  const handleFunctionCall = useCallback(async (functionCall: any, chatId: string, messageId: string) => {
    try {
      let result;
      
      switch (functionCall.name) {
        case 'create_calendar_event':
          result = await calendarFunctions.create_calendar_event(functionCall.args);
          break;
        case 'update_calendar_event':
          result = await calendarFunctions.update_calendar_event(functionCall.args);
          break;
        case 'list_calendar_events':
          result = await calendarFunctions.list_calendar_events(functionCall.args);
          break;
        case 'search_calendar_events':
          result = await calendarFunctions.search_calendar_events(functionCall.args);
          break;
        default:
          result = { success: false, message: `Unknown function: ${functionCall.name}` };
      }
      
      // Add the function result to the stream buffer
      const resultText = result.success 
        ? `✅ ${result.message}`
        : `❌ ${result.message}`;
      
      streamBufferRef.current.text += `\n\n${resultText}`;
      
    } catch (error) {
      console.error('Function call error:', error);
      streamBufferRef.current.text += `\n\n❌ Error executing ${functionCall.name}: ${error}`;
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

    // Reset state for the new message
    stopTypingInterval();
    isStreamFinishedRef.current = false;
    thinkingCompleteRef.current = false;
    streamBufferRef.current = { text: "", thinking: "" };

    const turnId = crypto.randomUUID();

    try {
      // Get selected files for context directly from the file context store
      const fileStore = useFileContextStore.getState();
      const selectedFiles = fileStore.getSelectedFiles();
      
      // Recursively collect all files from the selected folders
      const allFiles = collectFilesFromFolders(selectedFiles);
      
      // Convert file nodes to context content
      const fileContexts = allFiles.map(convertFileToContext);
      
      // Generate file context instruction if needed
      let enhancedContent = content;
      if (fileContexts.length > 0) {
        // Format the file names in a cleaner way
        const fileNames = fileContexts
          .filter(file => file.type === "file") // Only include files, not folders
          .map(file => file.name);
        
        // Add context marker for the message component to detect and style
        if (fileNames.length > 0) {
          const contextMarker = `CONTEXT_FILES_PROVIDED:${JSON.stringify(fileNames)}`;
          enhancedContent = contextMarker + "\n\n" + enhancedContent;
        }
      }
      
      // Add file contents as context in the thinking section if enabled
      let fileContentText = "";
      if (fileContexts.length > 0) {
        // Create a detailed thinking section that shows actual file content
        fileContentText = "=== FILE CONTEXT SUMMARY ===\n\n";
        
        for (const file of fileContexts) {
          // Skip directory entries since we're already including their children separately
          if (file.type === "folder") {
            continue;
          }
          
          fileContentText += `FILE: ${file.path}\n`;
          fileContentText += `TYPE: ${file.type}\n`;
          fileContentText += `CONTENT:\n\`\`\`\n${file.content || "[Empty file]"}\n\`\`\`\n\n`;
        }
        
        fileContentText += "=== END OF FILE CONTEXT ===\n\n";
      }

      addMessage(chat.id, { 
        role: "user", 
        content: enhancedContent, 
        files: attachedFiles, // Attach the files here
        turnId 
      });
      const modelMessageId = addMessage(chat.id, { role: "model", content: "", turnId });
      let thinkingMessageId: string | null = null;
      if (generationParams.thinkingEnabled && generationParams.includeSummaries) {
        const thinkingContent = fileContexts.length > 0 
          ? `Processing file context (${fileContexts.length} file${fileContexts.length > 1 ? 's' : ''})...\n\nAnalyzing the provided files and thinking about your query...` 
          : "Thinking about your query... ";
        thinkingMessageId = addMessage(chat.id, { role: "thinking", content: thinkingContent, turnId });
      }

      abortControllerRef.current = new AbortController();
      setIsStreaming(true);

      const updatedChat = useChatStore.getState().chats.find(c => c.id === chat.id);
      if (!updatedChat) throw new Error("Chat not found");

      // Start the character-by-character typing effect with sequencing
      typingIntervalRef.current = setInterval(() => {
        const buffer = streamBufferRef.current;
        let processedCharacter = false;

        // First priority: Process thinking content if it exists and thinking isn't complete
        if (thinkingMessageId && buffer.thinking.length > 0 && !thinkingCompleteRef.current) {
          const char = buffer.thinking.slice(0, 1);
          buffer.thinking = buffer.thinking.slice(1);
          updateMessage(chat.id, thinkingMessageId, char, true);
          processedCharacter = true;
          
          // Check if thinking is complete
          if (buffer.thinking.length === 0 && isStreamFinishedRef.current) {
            thinkingCompleteRef.current = true;
          }
        }
        // Second priority: Process response content only after thinking is complete (or no thinking)
        else if (buffer.text.length > 0 && (thinkingCompleteRef.current || !thinkingMessageId)) {
          const char = buffer.text.slice(0, 1);
          buffer.text = buffer.text.slice(1);
          updateMessage(chat.id, modelMessageId, char, true);
          processedCharacter = true;
        }

        // Clean up when everything is done
        if (!processedCharacter && isStreamFinishedRef.current && 
            (thinkingCompleteRef.current || !thinkingMessageId) && 
            buffer.text.length === 0 && buffer.thinking.length === 0) {
          stopTypingInterval();
          setIsStreaming(false);
          abortControllerRef.current = null;
        }
      }, generationParams.streamingSpeed || DEFAULT_TYPING_SPEED);

      // Prepare enhanced system instruction with file context and current date/time
      let enhancedSystemInstruction = globalSystemInstruction || "";
      
      // Add current date and time information for calendar operations
      const now = new Date();
      const currentDateTime = now.toISOString();
      const currentDateString = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const currentTimeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      const dateTimeContext = `\n\n🗓️ IMPORTANT - CURRENT DATE AND TIME CONTEXT:\n⚠️  IGNORE ANY PREVIOUS DATE KNOWLEDGE - USE ONLY THIS CURRENT INFORMATION:\n- RIGHT NOW it is: ${currentDateTime}\n- TODAY is: ${currentDateString}\n- Current time: ${currentTimeString}\n- For calendar operations, calculate relative dates from TODAY (${currentDateString})\n- Tomorrow = ${new Date(now.getTime() + 24*60*60*1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n- Always use ISO format for dates in function calls (YYYY-MM-DDTHH:MM:SS)\n- When listing events for "tomorrow", use the date range for the day after TODAY`;
      
      enhancedSystemInstruction = enhancedSystemInstruction 
        ? `${enhancedSystemInstruction}${dateTimeContext}`
        : dateTimeContext;
      
      if (fileContexts && fileContexts.length > 0) {
        const fileContextInstruction = generateFileContextInstruction(fileContexts);
        enhancedSystemInstruction = `${enhancedSystemInstruction}\n\n${fileContextInstruction}`;
      }

      const response = await generateGeminiResponse({
        systemInstruction: enhancedSystemInstruction,
        apiKey,
        model: chat.model,
        messages: updatedChat.messages.filter(m => m.id !== modelMessageId),
        params: generationParams,
        // Only use fileUris for actual uploaded files, not local file context
        fileUris: attachedFiles.length > 0 && attachedFiles.some(f => f.uri) 
          ? attachedFiles.filter(f => f.uri).map(file => file.uri) 
          : undefined,
        // Add calendar function declarations
        tools: [{ functionDeclarations: calendarFunctionDeclarations }],
        onStream: async (chunk, thinking, functionCalls) => {
          streamBufferRef.current.text += chunk;
          if (thinking) {
            streamBufferRef.current.thinking += thinking;
          }
          // Handle function calls immediately when they arrive
          if (functionCalls && functionCalls.length > 0) {
            for (const functionCall of functionCalls) {
              await handleFunctionCall(functionCall, chat.id, modelMessageId);
            }
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

      // Handle grounding metadata if present
      if (response.groundingMetadata) {
        // Update the model message with grounding metadata
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
