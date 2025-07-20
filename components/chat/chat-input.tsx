"use client"

import { useState, useRef, useEffect } from "react"
import { PaperclipIcon, ArrowUp, StopCircle, X, Brain, Files } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChatStore } from "@/lib/gemini/store"
import { useChat } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import { FileUpload } from "@/components/chat/file-upload"
import { ModelSelector } from "@/components/chat/model-selector"
import { FileMetadata } from "@/lib/gemini/files-api"
import { FileContext, FileContextSummary } from "@/components/chat/file-context"
import { useFileContextStore } from "@/lib/files/context-store"
import { createChatAttachments, convertFileToContext, generateFileContextInstruction } from "@/lib/gemini/file-context-adapter"
import { detectFileCreationIntent } from "@/lib/ai/file-intent"
import { detectFileEditIntent } from "@/lib/ai/edit-intent"
import { detectCalendarIntent } from "@/lib/ai/calendar-intent"
import { calendarFunctions } from "@/lib/calendar/functions"
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const currentChat = useChatStore((state) => state.chats.find(
    (chat) => chat.id === state.activeChat
  ))
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showFileContext, setShowFileContext] = useState(false)
  const { getSelectedFiles } = useFileContextStore()

  // Auto-resize the textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height - important to shrink on delete
    textarea.style.height = "inherit"
    
    // Set height based on scroll height
    const computed = window.getComputedStyle(textarea)
    const height = parseInt(computed.paddingTop) + 
                  textarea.scrollHeight + 
                  parseInt(computed.paddingBottom)

    // Set the height with a maximum of 200px
    textarea.style.height = `${Math.min(height, 200)}px`
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && attachedFiles.length === 0) || !currentChat || isStreaming) return

    const messageToSend = message.trim()
    setMessage("")

    // Detect file edit intent first (takes priority over file creation)
    const editIntent = detectFileEditIntent(messageToSend)
    if (editIntent) {
      try {
        const filesStore = useFilesStore.getState()
        
        // Find the file to edit
        const fileToEdit = Object.values(filesStore.files).find(
          node => node.type === 'file' && 
          (node.name.toLowerCase() === editIntent.fileName.toLowerCase() ||
           node.path.toLowerCase().includes(editIntent.fileName.toLowerCase()))
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
              content: `FILE_EDIT_PROCESSING:${fileToEdit.name}:${editIntent.editPrompt}`,
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
              
              const editPrompt = `Please edit the following content according to this request: "${editIntent.editPrompt}"

Original content:
${fileToEdit.content || ''}

Provide only the edited content without any explanations.`

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
              filesStore.setEditedContent(fileToEdit.id, editedContent, editIntent.editPrompt)
              
              // Update the processing message with success
              chatStore.updateMessage(chat.id, processingMessageId, 
                `FILE_EDIT_SUCCESS:${fileToEdit.name}:${editIntent.editPrompt}`
              )
              
              // Open the file in the editor to show the diff - only if not already open
              if (!filesStore.editorOpen || filesStore.activeFileId !== fileToEdit.id) {
                filesStore.openEditor(fileToEdit.id)
              }
              
            } catch (error) {
              console.error("Error editing file:", error)
              chatStore.updateMessage(chat.id, processingMessageId,
                `FILE_EDIT_ERROR:${fileToEdit.name}:${editIntent.editPrompt}`
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
              content: `I couldn't find a file named "${editIntent.fileName}" in your file tree. Please check the filename or create the file first. You can also select files from the file tree and use the Smart Edit feature in the file editor.`,
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

    // Detect calendar intent
    const calendarIntent = detectCalendarIntent(messageToSend)
    if (calendarIntent) {
      try {
        const chatStore = useChatStore.getState()
        const chat = chatStore.chats.find(c => c.id === chatStore.activeChat)
        
        if (chat) {
          const userTurnId = crypto.randomUUID()
          chatStore.addMessage(chat.id, {
            role: "user",
            content: messageToSend,
            turnId: userTurnId
          })
          
          // Add processing message
          const processingMessageId = chatStore.addMessage(chat.id, {
            role: "model",
            content: `CALENDAR_PROCESSING:${calendarIntent.action}`,
            turnId: userTurnId
          })
          
          try {
            let result
            
            // Execute the appropriate calendar function
            switch (calendarIntent.action) {
              case 'create':
                result = await calendarFunctions.create_calendar_event({
                  title: calendarIntent.title || 'New Event',
                  description: calendarIntent.description,
                  startDate: calendarIntent.startDate || new Date().toISOString(),
                  endDate: calendarIntent.endDate || new Date(Date.now() + 3600000).toISOString(),
                  allDay: calendarIntent.allDay || false
                })
                break
                
              case 'update':
                if (calendarIntent.eventId) {
                  result = await calendarFunctions.update_calendar_event({
                    eventId: calendarIntent.eventId,
                    title: calendarIntent.title,
                    description: calendarIntent.description,
                    startDate: calendarIntent.startDate,
                    endDate: calendarIntent.endDate,
                    allDay: calendarIntent.allDay
                  })
                } else {
                  result = { success: false, message: 'Event ID required for update' }
                }
                break
                
              case 'delete':
                if (calendarIntent.eventId) {
                  result = await calendarFunctions.delete_calendar_event({
                    eventId: calendarIntent.eventId
                  })
                } else {
                  result = { success: false, message: 'Event ID required for deletion' }
                }
                break
                
              case 'list':
                result = await calendarFunctions.list_calendar_events({
                  startDate: calendarIntent.dateRange?.start || new Date().toISOString(),
                  endDate: calendarIntent.dateRange?.end || new Date(Date.now() + 86400000).toISOString()
                })
                break
                
              case 'search':
                result = await calendarFunctions.search_calendar_events({
                  query: calendarIntent.query || messageToSend
                })
                break
                
              default:
                result = { success: false, message: 'Unknown calendar action' }
            }
            
            // Update the processing message with the result
            const resultMessage = result.success 
              ? `CALENDAR_SUCCESS:${calendarIntent.action}:${result.message}`
              : `CALENDAR_ERROR:${calendarIntent.action}:${result.message}`
              
            chatStore.updateMessage(chat.id, processingMessageId, resultMessage)
            
          } catch (error) {
            console.error("Error executing calendar action:", error)
            chatStore.updateMessage(chat.id, processingMessageId,
              `CALENDAR_ERROR:${calendarIntent.action}:Failed to execute calendar action`
            )
          }
        }
        
        // Clear form
        setAttachedFiles([])
        setShowFileUpload(false)
        return
      } catch (error) {
        console.error("Error handling calendar intent:", error)
        // Continue with normal chat flow if calendar intent handling fails
      }
    }

    // Detect file creation intent with enhanced NLP capabilities
    const fileIntent = detectFileCreationIntent(messageToSend)
    if (fileIntent) {
      try {
        // Create the file in the file tree (root level for now)
        const filesStore = useFilesStore.getState()
        
        // Check if the file already exists to provide better feedback
        const existingFiles = filesStore.files
        const fileExists = Object.values(existingFiles).some(
          node => node.type === 'file' && node.name.toLowerCase() === fileIntent.fileName.toLowerCase()
        )
        
        // Create the file with a unique name if needed
        let fileName = fileIntent.fileName
        let fileId: string
        
        if (fileExists) {
          // Add timestamp to make unique
          const nameParts = fileName.split('.')
          const ext = nameParts.pop() || ''
          const baseName = nameParts.join('.')
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
          fileName = `${baseName}-${timestamp}.${ext}`
          fileId = filesStore.createFile(null, fileName)
          
          // Let the user know we had to rename
          console.info(`File '${fileIntent.fileName}' already exists, creating as '${fileName}' instead`)
        } else {
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
        let contentPrompt = fileIntent.contentPrompt
        
        // If no explicit content prompt or it's very short, make a better one
        if (!contentPrompt || contentPrompt.length < 10) {
          const fileExt = fileName.split('.').pop()?.toLowerCase() || ''
          
          if (fileExt === 'md') {
            contentPrompt = `Create professional markdown content for a business document named "${fileName}". Extract any relevant topic information from the filename and expand on it with appropriate business structure and formatting.`
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
        // Create a more natural confirmation message based on the user's original phrasing
        let confirmationMessage = `FILE_CREATION_SUCCESS:${fileName}`
        
        // If the file was renamed, add rename info
        if (fileName !== fileIntent.fileName) {
          confirmationMessage = `FILE_CREATION_SUCCESS:${fileName}:RENAMED:${fileIntent.fileName}`
        }
        
        // Since we saved the processing message ID earlier, we can directly update it
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
            content: `I encountered an error while trying to create the file "${fileIntent?.fileName || 'requested file'}". Please try again or use a different filename.`,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className="w-full"
    >
      <div className="relative rounded-xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-primary">
        <Textarea
          ref={textareaRef}
          placeholder={isStreaming ? "Type your next message..." : "Ask me anything..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-h-[60px] w-full resize-none border-0 bg-transparent py-4 pl-3 pr-14 sm:py-4 sm:px-5 focus-visible:ring-0",
            "placeholder:text-muted-foreground/70 text-base"
          )}
          disabled={!currentChat}
          rows={1}
        />

        <div className="absolute left-1 sm:left-2 bottom-1 sm:bottom-2 flex items-center gap-1 sm:gap-2">
          {currentChat && <ModelSelector chatId={currentChat.id} />}
          {/* File upload button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            disabled={!currentChat}
            onClick={() => setShowFileUpload(!showFileUpload)}
          >
            <PaperclipIcon className="h-5 w-5" />
          </Button>
          
          {/* File context button - only show if files are selected */}
          {getSelectedFiles().length > 0 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground relative"
              disabled={!currentChat}
              onClick={() => setShowFileContext(!showFileContext)}
            >
              <Files className="h-5 w-5" />
              <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </Button>
          )}

          <div className="flex items-center gap-4 border-l pl-4">
            <Label htmlFor="thinking-mode" className="cursor-pointer">
              <Brain className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </Label>
            <Switch
              id="thinking-mode"
              checked={generationParams.thinkingEnabled}
              onCheckedChange={(checked) =>
                setGenerationParams({ thinkingEnabled: checked })
              }
              disabled={isStreaming}
              className="h-5 w-9 data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="absolute right-2 bottom-2 flex items-center gap-2">

          <Button 
            size="icon" 
            type="button"
            onClick={isStreaming ? stopGenerating : (e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={!currentChat || (isStreaming === false && message.trim() === "")}
            className={cn(
              "h-10 w-10 rounded-full transition-colors send-button",
              isStreaming ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
            )}
          >
            {isStreaming ? (
              <StopCircle className="h-5 w-5" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
            <span className="sr-only">
              {isStreaming ? "Stop generating" : "Send message"}
            </span>
          </Button>
        </div>
      </div>
      
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
    </form>
  )
}
