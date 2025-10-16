"use client"

import { useState, useRef, useEffect } from "react"
import { PaperclipIcon, Brain, Files, Globe, ChevronDown, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/lib/gemini/store"
import { useChat } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
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
import { FileUpload } from "@/components/chat/file-upload"
import { ModelSelector } from "@/components/chat/model-selector"
import { FileMetadata } from "@/lib/gemini/files-api"
import { FileContext, FileContextSummary } from "@/components/chat/file-context"
import { useFileContextStore } from "@/lib/files/context-store"
import { createChatAttachments, convertFileToContext, generateFileContextInstruction } from "@/lib/gemini/file-context-adapter"
import { parseFileIntent } from "@/lib/ai/intent-parser"
import { generateGeminiResponse } from "@/lib/gemini/api"
import { useFilesStore } from "@/lib/files/store"

// Helper function to clean AI-generated content from unwanted introductions
function cleanFileContent(content: string): string {
  if (!content) return content
  
  // Remove common AI introduction patterns
  const introPatterns = [
    /^Here\s+(is|are)\s+.+?[.!:]\s*/i,
    /^I've\s+created\s+.+?[.!:]\s*/i,
    /^This\s+(is|contains)\s+.+?[.!:]\s*/i,
    /^Below\s+(is|are)\s+.+?[.!:]\s*/i,
    /^The\s+following\s+.+?[.!:]\s*/i,
    /^Let\s+me\s+.+?[.!:]\s*/i,
    /^I'll\s+.+?[.!:]\s*/i,
    /^.*ranging\s+from\s+.+?[.!:]\s*/i,
    /^.*few\s+.+?recipes?\s+.+?[.!:]\s*/i,
    /^Here\s+are\s+a\s+few\s+very\s+short\s+recipes\s+.+?[.!:]\s*/i,
    /^Here\s+are\s+some\s+.+?recipes\s+.+?[.!:]\s*/i,
    /^I've\s+prepared\s+.+?[.!:]\s*/i,
    /^I've\s+generated\s+.+?[.!:]\s*/i,
    /^.*ranging\s+from\s+a\s+.+?to\s+a\s+.+?[.!:]\s*/i
  ]
  
  let cleanedContent = content
  
  // Apply each pattern to remove introductions
  for (const pattern of introPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '')
  }
  
  // Remove any leading whitespace or newlines after cleaning
  cleanedContent = cleanedContent.replace(/^\s+/, '')
  
  // If we removed too much and the content is now empty or very short, return original
  if (cleanedContent.trim().length < 10) {
    return content
  }
  
  return cleanedContent
}

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
    const recentMessages = currentChat.messages
      .slice(-5)
      .filter(m => m.role !== 'thinking')
      .map(m => ({ 
        role: m.role === 'user' ? 'user' as const : 'model' as const, 
        content: m.content 
      }))
    
    const intent = await parseFileIntent(messageToSend, chatStore.apiKey, currentChat.model, recentMessages)
    
    // Handle file edit intent
    if (intent && intent.type === 'edit') {
      try {
        const filesStore = useFilesStore.getState()
        
        // Find the file to edit
        const fileToEdit = Object.values(filesStore.files).find(
          node => node.type === 'file' && 
          (node.name.toLowerCase() === intent.fileName.toLowerCase() ||
           node.path.toLowerCase().includes(intent.fileName.toLowerCase()))
        )
        
        if (fileToEdit) {
          // Generate the edited content directly
          const chatStore = useChatStore.getState()
          const chat = chatStore.chats.find(c => c.id === chatStore.activeChat)
          
          if (chat) {
            const userTurnId = crypto.randomUUID()
            chatStore.addMessage(chat.id, {
              role: "user",
              content: messageToSend,
              turnId: userTurnId
            })
            
            // Add processing message with special format
            const processingMessageId = chatStore.addMessage(chat.id, {
              role: "model",
              content: `FILE_EDIT_PROCESSING:${fileToEdit.name}:${intent.editPrompt}`,
              turnId: userTurnId
            })
            
            try {
              // Generate the edited content using AI
              const editSystemInstruction = `You are a file content editor. Your task is to edit the provided content according to the user's request. 

Rules:
- Make only the changes requested
- Preserve the original formatting and structure unless specifically asked to change it
- Return ONLY the edited content, no explanations or commentary
- Do not add introductory text or meta-commentary
- The output should be the complete edited file content`
              
              const editPrompt = `Edit the following content: "${intent.editPrompt}"

Original content:
${fileToEdit.content || ''}

Edited content (no explanations):`

              const response = await generateGeminiResponse({
                apiKey: chatStore.apiKey,
                model: "gemini-2.5-flash",
                messages: [{
                  role: "user",
                  content: editPrompt,
                  id: crypto.randomUUID(),
                  timestamp: Date.now()
                }],
                systemInstruction: editSystemInstruction,
                params: {
                  ...chatStore.generationParams,
                  temperature: 0.7,
                  maxOutputTokens: 4096
                }
              })

              const editedContent = response.text.trim()
              
              // Store the edited content for diff view (don't apply yet)
              filesStore.setEditedContent(fileToEdit.id, editedContent, intent.editPrompt)
              
              // Update the processing message with success
              chatStore.updateMessage(chat.id, processingMessageId, 
                `FILE_EDIT_SUCCESS:${fileToEdit.name}:${intent.editPrompt}`
              )
              
              // Open the file in the editor to show the diff - only if not already open
              if (!filesStore.editorOpen || filesStore.activeFileId !== fileToEdit.id) {
                filesStore.openEditor(fileToEdit.id)
              }
              
            } catch (error) {
              console.error("Error editing file:", error)
              chatStore.updateMessage(chat.id, processingMessageId,
                `FILE_EDIT_ERROR:${fileToEdit.name}:${intent.editPrompt}`
              )
            }
          }
          
          // Clear form
          setAttachedFiles([])
          setShowFileUpload(false)
          return
        } else {
          // File not found - add message to chat
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
              content: `I couldn't find a file named "${intent.fileName}" in your file tree. Please check the filename or create the file first. You can also select files from the file tree and use the Smart Edit feature in the file editor.`,
              turnId: userTurnId
            })
          }
          return
        }
      } catch (error) {
        console.error("Error handling edit intent:", error)
        // Continue with normal chat flow if edit intent handling fails
      }
    }

    // Handle file creation intent
    if (intent && intent.type === 'create') {
      try {
        // Create the file in the file tree (root level for now)
        const filesStore = useFilesStore.getState()
        
        // Check if the file already exists
        const existingFile = Object.values(filesStore.files).find(
          node => node.type === 'file' && node.name.toLowerCase() === intent.fileName.toLowerCase()
        )
        
        let fileName = intent.fileName
        let fileId: string
        
        if (existingFile) {
          // File exists - just use the existing one and update its content
          fileId = existingFile.id
          console.info(`File '${intent.fileName}' already exists, updating content...`)
        } else {
          // Create new file
          fileId = filesStore.createFile(null, fileName)
        }
        
        // First, get the necessary pieces from the chat store
        const chatStore = useChatStore.getState()
        const chat = chatStore.chats.find(c => c.id === chatStore.activeChat)
        
        if (!chat || !chatStore.apiKey) {
          throw new Error("Chat not found or API key not set")
        }
        
        // Show visual feedback in the chat that we're processing
        const userTurnId = crypto.randomUUID()
        chatStore.addMessage(chat.id, {
          role: "user",
          content: messageToSend,
          turnId: userTurnId
        })
        
        // Add temporary processing message with thinking-style visual feedback
        const processingMessageId = chatStore.addMessage(chat.id, {
          role: "model",
          content: `FILE_CREATION_PROCESSING:${fileName}`,
          turnId: userTurnId
        })
        
        // Import the required API function
        const { generateGeminiResponse } = await import("@/lib/gemini/api")
        
        // Enhance the content prompt based on file type and available context
        let contentPrompt = intent.contentPrompt
        
        // If no explicit content prompt or it's very short, make a better one
        if (!contentPrompt || contentPrompt.length < 10) {
          const fileExt = fileName.split('.').pop()?.toLowerCase() || ''
          
          if (fileExt === 'md') {
            contentPrompt = `Create professional markdown content for a document named "${fileName}". Extract any relevant topic information from the filename and expand on it with appropriate structure and formatting.`
          } else if (['txt', 'text'].includes(fileExt)) {
            contentPrompt = `Create text content for "${fileName}". If the filename suggests a specific topic, please focus on that.`
          } else {
            contentPrompt = `Create appropriate content for a file named "${fileName}". Infer the desired content from the filename.`
          }
        }
        
        // Create a system instruction for clean file content generation
        const fileContentSystemInstruction = `You are a file content generator. Your task is to create clean, direct content for files without any conversational elements, introductions, or explanations.

IMPORTANT RULES:
- Generate ONLY the actual file content that should be saved
- Do NOT include any introductory text like "Here is..." or "I've created..."
- Do NOT include any explanatory text or commentary
- Do NOT add conversational elements or meta-commentary
- Start directly with the actual content
- The content should be complete and ready to use
- Format appropriately for the file type (markdown, text, etc.)

The user wants the raw content only, as if they were writing the file themselves.`
        
        // Get selected files from file tree for context
        const selectedFiles = getSelectedFiles()
        
        // Prepare enhanced system instruction with file context if needed
        let enhancedSystemInstruction = fileContentSystemInstruction;
        if (selectedFiles.length > 0) {
          // Convert file nodes to context format
          const fileContexts = selectedFiles
            .filter(file => file.type === "file")
            .map(file => convertFileToContext(file))
          
          // Add file context to system instruction
          if (fileContexts.length > 0) {
            const contextInstruction = generateFileContextInstruction(fileContexts)
            enhancedSystemInstruction = `${fileContentSystemInstruction}\n\n${contextInstruction}`
          }
        }
        
        // Generate content directly using the API with clean content instructions
        const response = await generateGeminiResponse({
          apiKey: chatStore.apiKey,
          model: chat.model,
          messages: [{
            role: "user",
            content: contentPrompt,
            id: crypto.randomUUID(),
            timestamp: Date.now()
          }],
          systemInstruction: enhancedSystemInstruction,
          params: chatStore.generationParams
        })
        
        // Clean and update the file with the generated content
        let generatedContent = response.text || ""
        
        // Clean up any unwanted AI introductions or explanations
        generatedContent = cleanFileContent(generatedContent)
        
        filesStore.updateFileContent(fileId, generatedContent)
        
        // Add a small delay before opening the editor to ensure state is updated
        setTimeout(() => {
          // Force refresh the file node to ensure it has the latest content
          const updatedNode = filesStore.getNodeById(fileId)
          if (updatedNode && updatedNode.type === 'file') {
            // Re-update with same content to trigger subscribers
            filesStore.updateFileContent(fileId, updatedNode.content || "")
          }
          // Open the editor to show the file
          filesStore.openEditor(fileId)
        }, 100)
        
        // Update the temporary message with confirmation
        const confirmationMessage = `FILE_CREATION_SUCCESS:${fileName}`
        chatStore.updateMessage(chat.id, processingMessageId, confirmationMessage)
        
        // Clean up
        setAttachedFiles([])
        setShowFileUpload(false)
        return
      } catch (error) {
        console.error("Error creating file:", error)
        
        // Add error message to chat
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
