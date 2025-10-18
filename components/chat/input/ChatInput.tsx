"use client"

import { useState, useRef, useEffect } from "react"
import { PaperclipIcon, Brain, Files, Globe, ChevronDown, Settings, Sparkles } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/lib/chat/stores/chat.store"
import { useChat } from "@/hooks/chat/use-chat.hook"
import { cn } from "@/lib/shared/utils/cn.utils"
import { 
  PromptInput, 
  PromptInputTextarea, 
  PromptInputToolbar, 
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit 
} from "@/components/ui/shadcn-io/ai/prompt-input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { FileUpload } from "@/components/chat/input/FileUpload"
import { ModelSelector } from "@/components/chat/input/ModelSelector"
import { FileMetadata } from "@/lib/ai/gemini/types"
import { FileContext, FileContextSummary } from "@/components/chat/input/FileContext"
import { useFileContextStore, useFilesStore } from "@/lib/files/stores"
import { createChatAttachments } from "@/lib/ai/gemini/utils/file-context-adapter.utils"
import { parseFileIntent } from "@/lib/ai/services/intent-parser.service"
import { selectBestPreset } from "@/lib/ai/services/preset-selector.service"
import { PROMPT_PRESETS } from "@/lib/ai/constants/presets.constants"
import { handleFileEdit, handleFileCreation, generateFileOperationMessage } from "@/lib/ai/services/file-operations.service"
import { getRecentMessages } from "@/lib/ai/gemini/utils/message-formatter.utils"

// Content cleaning helper has been moved to lib/utils/content-cleaner.ts

export function ChatInput() {
  const [message, setMessage] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<FileMetadata[]>([])
  const { isStreaming, sendMessage, stopGenerating } = useChat()
  const { generationParams, setGenerationParams } = useChatStore()
  const currentChat = useChatStore((state) => state.chats.find(
    (chat) => chat.id === state.activeChat
  ))
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showFileContext, setShowFileContext] = useState(false)
  const { getSelectedFiles } = useFileContextStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && attachedFiles.length === 0) || !currentChat || isStreaming) return

    const messageToSend = message.trim()
    setMessage("")

    // Use Gemini to parse intent for file operations (more robust than regex)
    const chatStore = useChatStore.getState()
    
    // Get last 5 messages for context (helps resolve "it", "the file", etc.)
    const recentMessages = getRecentMessages(currentChat.messages, 5)
    
    const intent = await parseFileIntent(messageToSend, chatStore.apiKey, currentChat.model, recentMessages)
    
    // Handle file edit intent using the file-operations service
    if (intent && intent.type === 'edit') {
      try {
        const filesStore = useFilesStore.getState()
        const chatStore = useChatStore.getState()
        const chat = chatStore.chats.find(c => c.id === chatStore.activeChat)
        
        if (!chat) return
        
        const userTurnId = crypto.randomUUID()
        chatStore.addMessage(chat.id, {
          role: "user",
          content: messageToSend,
          turnId: userTurnId
        })
        
        // Add processing message
        const processingMessageId = chatStore.addMessage(chat.id, {
          role: "model",
          content: `FILE_EDIT_PROCESSING:${intent.fileName}:${intent.editPrompt}`,
          turnId: userTurnId
        })
        
        // Use the file-operations service to handle the edit
        const result = await handleFileEdit(
          intent,
          chatStore.apiKey,
          chat.model,
          chatStore.generationParams,
          (fileName) => Object.values(filesStore.files).find(
            node => node.type === 'file' && 
            (node.name.toLowerCase() === fileName.toLowerCase() ||
             node.path.toLowerCase().includes(fileName.toLowerCase()))
          ),
          filesStore.setEditedContent
        )
        
        // Update message based on result
        const statusMessage = generateFileOperationMessage(result, intent.editPrompt)
        chatStore.updateMessage(chat.id, processingMessageId, statusMessage)
        
        // Open editor if successful
        if (result.success && result.fileId) {
          if (!filesStore.editorOpen || filesStore.activeFileId !== result.fileId) {
            filesStore.openEditor(result.fileId)
          }
        }
        
        // Clear form
        setAttachedFiles([])
        setShowFileUpload(false)
        return
      } catch (error) {
        console.error("Error handling edit intent:", error)
        // Continue with normal chat flow if edit intent handling fails
      }
    }

    // Handle file creation intent using the file-operations service
    if (intent && intent.type === 'create') {
      try {
        const filesStore = useFilesStore.getState()
        const chatStore = useChatStore.getState()
        const chat = chatStore.chats.find(c => c.id === chatStore.activeChat)
        
        if (!chat || !chatStore.apiKey) {
          throw new Error("Chat not found or API key not set")
        }
        
        // Show visual feedback in the chat
        const userTurnId = crypto.randomUUID()
        chatStore.addMessage(chat.id, {
          role: "user",
          content: messageToSend,
          turnId: userTurnId
        })
        
        // Add processing message
        const processingMessageId = chatStore.addMessage(chat.id, {
          role: "model",
          content: `FILE_CREATION_PROCESSING:${intent.fileName}`,
          turnId: userTurnId
        })
        
        // Get selected files for context
        const selectedFiles = getSelectedFiles()
        
        // Use the file-operations service to handle the creation
        const result = await handleFileCreation(
          intent,
          chatStore.apiKey,
          chat.model,
          chatStore.generationParams,
          (fileName) => {
            const existingFile = Object.values(filesStore.files).find(
              node => node.type === 'file' && node.name.toLowerCase() === fileName.toLowerCase()
            )
            if (existingFile) {
              return { fileId: existingFile.id, existed: true }
            }
            return { fileId: filesStore.createFile(null, fileName), existed: false }
          },
          filesStore.updateFileContent,
          selectedFiles
        )
        
        // Update message based on result
        const statusMessage = generateFileOperationMessage(result)
        chatStore.updateMessage(chat.id, processingMessageId, statusMessage)
        
        // Open editor if successful
        if (result.success && result.fileId) {
          setTimeout(() => {
            const updatedNode = filesStore.getNodeById(result.fileId!)
            if (updatedNode && updatedNode.type === 'file') {
              filesStore.updateFileContent(result.fileId!, updatedNode.content || "")
            }
            filesStore.openEditor(result.fileId!)
          }, 100)
        }
        
        // Clean up
        setAttachedFiles([])
        setShowFileUpload(false)
        return
      } catch (error) {
        console.error("Error creating file:", error)
        
        const chatStore = useChatStore.getState()
        const chat = chatStore.chats.find(c => c.id === chatStore.activeChat)
        
        if (chat) {
          const userTurnId = crypto.randomUUID()
          chatStore.addMessage(chat.id, {
            role: "user",
            content: messageToSend,
            turnId: userTurnId
          })
          
          chatStore.addMessage(chat.id, {
            role: "model",
            content: `I encountered an error while trying to create the file "${intent.fileName || 'requested file'}". Please try again or use a different filename.`,
            turnId: userTurnId
          })
          return
        }
      }
    }

    // Auto-select preset if enabled
    if (generationParams.autoPresetEnabled) {
      try {
        const chatStore = useChatStore.getState()
        
        // Get conversation history for context using the message-formatters utility
        const recentMessages = getRecentMessages(currentChat.messages, 3)
        
        // Select the best preset for this task
        const presetSelection = await selectBestPreset(
          messageToSend, 
          chatStore.apiKey, 
          currentChat.model,
          recentMessages
        )
        
        // If a preset was selected with medium or high confidence, apply it
        if (presetSelection.presetId && presetSelection.confidence !== 'low') {
          const selectedPreset = PROMPT_PRESETS.find(p => p.id === presetSelection.presetId)
          
          if (selectedPreset) {
            // Set the preset as the global system instruction
            chatStore.setGlobalSystemInstruction(selectedPreset.prompt)
            
            // Log the selection for debugging
            console.log(`Auto-selected preset: ${selectedPreset.name} (${presetSelection.confidence} confidence)`)
          }
        }
      } catch (error) {
        console.error("Error selecting preset:", error)
        // Continue with normal flow if preset selection fails
      }
    }

    // Get selected files from file tree
    const selectedFiles = getSelectedFiles()
    const fileAttachments = selectedFiles.length > 0 
      ? [...attachedFiles, ...createChatAttachments(selectedFiles)] 
      : attachedFiles

    // Send message with attached files
    await sendMessage(messageToSend, fileAttachments)

    // Clear attached files after sending
    setAttachedFiles([])
    setShowFileUpload(false)
    // Keep file context selection after sending
  }

  return (
    <div className="w-full">
      <PromptInput 
        onSubmit={handleSubmit} 
        className="w-full"
      >
        <PromptInputTextarea
          placeholder={isStreaming ? "Type your next message..." : "Ask me anything..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!currentChat}
          minHeight={60}
          maxHeight={200}
        />

        <PromptInputToolbar>
          <PromptInputTools>
            {currentChat && <ModelSelector chatId={currentChat.id} />}
            
            <PromptInputButton
              disabled={!currentChat}
              onClick={() => setShowFileUpload(!showFileUpload)}
            >
              <PaperclipIcon className="h-5 w-5" />
            </PromptInputButton>
            
            {/* File context button - only show if files are selected */}
            {getSelectedFiles().length > 0 && (
              <PromptInputButton
                disabled={!currentChat}
                onClick={() => setShowFileContext(!showFileContext)}
                className="relative"
              >
                <Files className="h-5 w-5" />
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </PromptInputButton>
            )}

            <div className="flex items-center border-l pl-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <PromptInputButton
                    disabled={isStreaming}
                    size="default"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Tools</span>
                    <ChevronDown className="h-3 w-3" />
                  </PromptInputButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setGenerationParams({ thinkingEnabled: !generationParams.thinkingEnabled })}
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <span>Think longer</span>
                    </div>
                    <Switch
                      checked={generationParams.thinkingEnabled}
                      onCheckedChange={() => {}}
                      className="h-4 w-7 pointer-events-none data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/20 border border-muted-foreground/30 data-[state=checked]:border-primary"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setGenerationParams({ groundingEnabled: !generationParams.groundingEnabled })}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Web search</span>
                    </div>
                    <Switch
                      checked={generationParams.groundingEnabled || false}
                      onCheckedChange={() => {}}
                      className="h-4 w-7 pointer-events-none data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/20 border border-muted-foreground/30 data-[state=checked]:border-primary"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setGenerationParams({ autoPresetEnabled: !generationParams.autoPresetEnabled })}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Auto-select preset</span>
                    </div>
                    <Switch
                      checked={generationParams.autoPresetEnabled || false}
                      onCheckedChange={() => {}}
                      className="h-4 w-7 pointer-events-none data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/20 border border-muted-foreground/30 data-[state=checked]:border-primary"
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </PromptInputTools>

          <PromptInputSubmit
            disabled={!currentChat || (isStreaming === false && message.trim() === "")}
            status={isStreaming ? "streaming" : undefined}
            onClick={isStreaming ? (e) => {
              e.preventDefault();
              stopGenerating();
            } : undefined}
          />
        </PromptInputToolbar>
      </PromptInput>
      
      <div className="flex justify-between items-center mt-2">
        {/* File Upload component */}
        {showFileUpload && (
          <div className="flex-1">
            <FileUpload 
              onFileUploaded={(file) => setAttachedFiles(prev => [...prev, file])}
              onRemoveFile={(uri) => setAttachedFiles(prev => prev.filter(file => file.uri !== uri))}
              disabled={!currentChat}
              className="mt-2"
            />
          </div>
        )}
        
        {/* File Context component */}
        {showFileContext && getSelectedFiles().length > 0 && (
          <div className="flex-1">
            <FileContext 
              className="mt-2"
              maxHeight="200px"
            />
          </div>
        )}
        
        {/* Uploaded Files Label */}
        {attachedFiles.length > 0 && !showFileUpload && (
          <div className="flex items-center mr-2">
            <span className="text-xs text-muted-foreground mr-2">
              {attachedFiles.length} file{attachedFiles.length !== 1 ? 's' : ''} attached
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setShowFileUpload(true)}
            >
              View
            </Button>
          </div>
        )}
        
        {/* File Context Label */}
        {getSelectedFiles().length > 0 && !showFileContext && (
          <div className="flex items-center mr-2">
            <FileContextSummary className="mr-2" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setShowFileContext(true)}
            >
              View
            </Button>
          </div>
        )}
        
        {currentChat?.tokenCount && (
          <div className="text-xs text-muted-foreground/70 text-right pr-2 ml-auto">
            <span>Tokens: {currentChat.tokenCount.total || 0}</span>
          </div>
        )}
      </div>
    </div>
  )
}
