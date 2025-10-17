"use client"

import { useState, useRef, useEffect } from "react"
import { PaperclipIcon, Brain, Files, Globe, ChevronDown, Settings, Sparkles } from "lucide-react"
import { Switch } from "@/shared/ui-components/switch"
import { Label } from "@/shared/ui-components/label"
import { Button } from "@/shared/ui-components/button"
import { useChatStore } from "@/domains/conversations/storage/conversation-store"
import { useConversation } from "@/domains/conversations/hooks/use-conversation"
import { cn } from "@/shared/utilities/class-name-merger"
import { 
  PromptInput, 
  PromptInputTextarea, 
  PromptInputToolbar, 
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit 
} from "@/shared/ui-components/shadcn-io/ai/prompt-input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui-components/dropdown-menu"
import { FileAttachment } from "@/domains/conversations/components/FileAttachment"
import { ModelSelector } from "@/domains/conversations/components/ModelSelector"
import { FileMetadata } from "@/domains/conversations/types/conversation.types"
import { FileContext, FileContextSummary } from "@/domains/conversations/components/FileContextIndicator"
import { useFileContextStore } from "@/domains/writing-projects/storage/file-context-store"
import { createChatAttachments } from "@/infrastructure/ai-integration/file-context-adapter"
import { parseFileIntent } from "@/domains/writing-projects/services/intent-parser-service"
import { useFilesStore } from "@/domains/writing-projects/storage/project-store"
import { selectBestPreset } from "@/domains/writing-projects/services/preset-selector-service"
import { PROMPT_PRESETS } from "@/domains/writing-projects/services/presets"
import { handleFileEdit, handleFileCreation, generateFileOperationMessage } from "@/domains/writing-projects/services/file-operations-service"
import { getRecentMessages } from "@/infrastructure/ai-integration/message-formatter"

export function MessageInput() {
  const [message, setMessage] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<FileMetadata[]>([])
  const { isStreaming, sendMessage, stopGenerating } = useConversation()
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

    const chatStore = useChatStore.getState()
    
    const recentMessages = getRecentMessages(currentChat.messages, 5)
    
    const intent = await parseFileIntent(messageToSend, chatStore.apiKey, currentChat.model, recentMessages)
    
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
        
        const processingMessageId = chatStore.addMessage(chat.id, {
          role: "model",
          content: `FILE_EDIT_PROCESSING:${intent.fileName}:${intent.editPrompt}`,
          turnId: userTurnId
        })
        
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
        
        const statusMessage = generateFileOperationMessage(result, intent.editPrompt)
        chatStore.updateMessage(chat.id, processingMessageId, statusMessage)
        
        if (result.success && result.fileId) {
          if (!filesStore.editorOpen || filesStore.activeFileId !== result.fileId) {
            filesStore.openEditor(result.fileId)
          }
        }
        
        setAttachedFiles([])
        setShowFileUpload(false)
        return
      } catch (error) {
        console.error("Error handling edit intent:", error)
      }
    }

    if (intent && intent.type === 'create') {
      try {
        const filesStore = useFilesStore.getState()
        const chatStore = useChatStore.getState()
        const chat = chatStore.chats.find(c => c.id === chatStore.activeChat)
        
        if (!chat || !chatStore.apiKey) {
          throw new Error("Chat not found or API key not set")
        }
        
        const userTurnId = crypto.randomUUID()
        chatStore.addMessage(chat.id, {
          role: "user",
          content: messageToSend,
          turnId: userTurnId
        })
        
        const processingMessageId = chatStore.addMessage(chat.id, {
          role: "model",
          content: `FILE_CREATION_PROCESSING:${intent.fileName}`,
          turnId: userTurnId
        })
        
        const selectedFiles = getSelectedFiles()
        
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
        
        const statusMessage = generateFileOperationMessage(result)
        chatStore.updateMessage(chat.id, processingMessageId, statusMessage)
        
        if (result.success && result.fileId) {
          setTimeout(() => {
            const updatedNode = filesStore.getNodeById(result.fileId!)
            if (updatedNode && updatedNode.type === 'file') {
              filesStore.updateFileContent(result.fileId!, updatedNode.content || "")
            }
            filesStore.openEditor(result.fileId!)
          }, 100)
        }
        
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

    if (generationParams.autoPresetEnabled) {
      try {
        const chatStore = useChatStore.getState()
        
        const recentMessages = getRecentMessages(currentChat.messages, 3)
        
        const presetSelection = await selectBestPreset(
          messageToSend, 
          chatStore.apiKey, 
          currentChat.model,
          recentMessages
        )
        
        if (presetSelection.presetId && presetSelection.confidence !== 'low') {
          const selectedPreset = PROMPT_PRESETS.find(p => p.id === presetSelection.presetId)
          
          if (selectedPreset) {
            chatStore.setGlobalSystemInstruction(selectedPreset.prompt)
            
            console.log(`Auto-selected preset: ${selectedPreset.name} (${presetSelection.confidence} confidence)`)
          }
        }
      } catch (error) {
        console.error("Error selecting preset:", error)
      }
    }

    const selectedFiles = getSelectedFiles()
    const fileAttachments = selectedFiles.length > 0 
      ? [...attachedFiles, ...createChatAttachments(selectedFiles)] 
      : attachedFiles

    await sendMessage(messageToSend, fileAttachments)

    setAttachedFiles([])
    setShowFileUpload(false)
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
        {showFileUpload && (
          <div className="flex-1">
            <FileAttachment 
              onFileUploaded={(file) => setAttachedFiles(prev => [...prev, file])}
              onRemoveFile={(uri) => setAttachedFiles(prev => prev.filter(file => file.uri !== uri))}
              disabled={!currentChat}
              className="mt-2"
            />
          </div>
        )}
        
        {showFileContext && getSelectedFiles().length > 0 && (
          <div className="flex-1">
            <FileContext 
              className="mt-2"
              maxHeight="200px"
            />
          </div>
        )}
        
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
