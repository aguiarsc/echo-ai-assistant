"use client"

import { cn } from "@/lib/shared/utils/cn.utils"
import { ChatMessage as ChatMessageType } from "@/lib/chat/types"
import { ThemeAvatar } from "@/components/themes"
import { Response } from "@/components/ui/shadcn-io/ai/response"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ui/shadcn-io/ai/reasoning"
import { Actions, Action } from "@/components/ui/shadcn-io/ai/actions"
import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ui/shadcn-io/ai/source"
import { Task, TaskTrigger, TaskContent, TaskItem, TaskItemFile } from "@/components/ui/shadcn-io/ai/task"
import { Check, Copy, Paperclip, X, FileEdit, FilePlus, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useChatStore } from "@/lib/chat/stores/chat.store"

interface MessageProps {
  message: ChatMessageType & {
    // Optional token count info that might be added by our application
    tokenCount?: number;
    thoughtSummary?: string; // Add thought summary support
  }
  isLast?: boolean;
  relatedThinking?: ChatMessageType | null; // Link to thinking message if available
}

export function ChatMessage({ message, isLast, relatedThinking }: MessageProps) {
  const isUser = message.role === "user"
  const isThinking = message.role === "thinking"
  const [copied, setCopied] = useState(false)
  const [showThoughts, setShowThoughts] = useState(false)
  const { userAvatar, geminiAvatar, chats, activeChat } = useChatStore()
  
  // Determine if thinking is currently streaming
  const isThinkingStreaming = isThinking && isLast && !message.content
  
  // Calculate actual thinking duration from timestamps
  const actualThinkingDuration = (() => {
    if (!relatedThinking) return 0
    
    const currentChat = chats.find(chat => chat.id === activeChat)
    if (!currentChat?.messages) {
      console.log('No current chat or messages found')
      return 0
    }
    
    const thinkingIndex = currentChat.messages.findIndex((m: any) => m.id === relatedThinking.id)
    if (thinkingIndex === -1) {
      console.log('Thinking message not found in chat')
      return 0
    }
    
    // Find the next assistant message after the thinking
    const nextAssistantMessage = currentChat.messages
      .slice(thinkingIndex + 1)
      .find((m: any) => m.role === 'model' && m.turnId === relatedThinking.turnId)
    
    if (!nextAssistantMessage) {
      console.log('No next assistant message found, using content-based estimate')
      // Fallback: estimate based on content length (1 second per 100 characters, min 2, max 60)
      const contentLength = relatedThinking.content?.length || 0
      return Math.max(2, Math.min(60, Math.ceil(contentLength / 100)))
    }
    
    // Calculate duration in seconds
    const durationMs = nextAssistantMessage.timestamp - relatedThinking.timestamp
    const durationSeconds = Math.max(1, Math.round(durationMs / 1000))
    
    console.log('Thinking duration calculated:', {
      thinkingTimestamp: relatedThinking.timestamp,
      assistantTimestamp: nextAssistantMessage.timestamp,
      durationMs,
      durationSeconds
    })
    
    return durationSeconds
  })()

  const copyToClipboard = () => {
    if (!message.content) return;
    
    try {
      // Try to use modern clipboard API first
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(message.content)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Copied to clipboard");
          })
          .catch((err) => {
            console.error("Modern clipboard API failed:", err);
            // Fall back to legacy approach
            useLegacyClipboard();
          });
          
        return; // Early return if modern API is available
      }
      
      // Fall back to legacy approach if modern API isn't available
      useLegacyClipboard();
      
    } catch (err) {
      console.error("Failed to copy message:", err);
      toast.error("Failed to copy message");
    }
  }
  
  // Helper function to use legacy clipboard approach 
  const useLegacyClipboard = () => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = message.content;
      
      // Make the element part of the document but minimally visible
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.opacity = "0";
      textArea.style.zIndex = "-1";
      
      document.body.appendChild(textArea);
      
      // Save current selection if any
      const selection = document.getSelection();
      const selectedRange = selection && selection.rangeCount > 0 ? 
        selection.getRangeAt(0) : null;
      
      // Select and copy
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      
      // Restore previous selection if any
      if (selection && selectedRange) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
      }
      
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
      } else {
        console.warn("execCommand('copy') failed");
        toast.error("Copy failed. Try selecting the text manually.");
      }
    } catch (error) {
      console.error("Legacy clipboard approach failed:", error);
      toast.error("Unable to copy message");
    }
  }



  // Check if this is a file creation message
  const isFileCreationMessage = message.content?.startsWith('FILE_CREATION_')
  const isFileProcessing = message.content?.startsWith('FILE_CREATION_PROCESSING:')
  const isFileSuccess = message.content?.startsWith('FILE_CREATION_SUCCESS:')
  
  // Check if this is a file edit message
  const isFileEditMessage = message.content?.startsWith('FILE_EDIT_')
  const isFileEditProcessing = message.content?.startsWith('FILE_EDIT_PROCESSING:')
  const isFileEditSuccess = message.content?.startsWith('FILE_EDIT_SUCCESS:')
  const isFileEditError = message.content?.startsWith('FILE_EDIT_ERROR:')
  
  // Check if this message has context files
  const hasContextFiles = message.content?.startsWith('CONTEXT_FILES_PROVIDED:')
  
  // Parse file creation message data
  const parseFileCreationMessage = () => {
    if (!isFileCreationMessage) return null
    
    if (isFileProcessing) {
      const fileName = message.content.replace('FILE_CREATION_PROCESSING:', '')
      return { type: 'processing', fileName }
    }
    
    if (isFileSuccess) {
      const parts = message.content.replace('FILE_CREATION_SUCCESS:', '').split(':')
      const fileName = parts[0]
      const isRenamed = parts[1] === 'RENAMED'
      const originalName = isRenamed ? parts[2] : null
      return { type: 'success', fileName, isRenamed, originalName }
    }
    
    return null
  }
  
  const fileCreationData = parseFileCreationMessage()
  
  // Parse file edit message data
  const parseFileEditMessage = () => {
    if (!isFileEditMessage) return null
    
    if (isFileEditProcessing) {
      const parts = message.content.replace('FILE_EDIT_PROCESSING:', '').split(':')
      const fileName = parts[0]
      const editPrompt = parts[1] || ''
      return { type: 'processing', fileName, editPrompt }
    }
    
    if (isFileEditSuccess) {
      const parts = message.content.replace('FILE_EDIT_SUCCESS:', '').split(':')
      const fileName = parts[0]
      const editPrompt = parts[1] || ''
      return { type: 'success', fileName, editPrompt }
    }
    
    if (isFileEditError) {
      const parts = message.content.replace('FILE_EDIT_ERROR:', '').split(':')
      const fileName = parts[0]
      const editPrompt = parts[1] || ''
      return { type: 'error', fileName, editPrompt }
    }
    
    return null
  }
  
  const fileEditData = parseFileEditMessage()
  
  // Parse context files data
  const parseContextFiles = () => {
    if (!hasContextFiles || !message.content) return null
    
    try {
      const contextLine = message.content.split('\n')[0]
      const jsonData = contextLine.replace('CONTEXT_FILES_PROVIDED:', '')
      const fileNames = JSON.parse(jsonData)
      return { fileNames }
    } catch (error) {
      console.error('Failed to parse context files:', error)
      return null
    }
  }
  
  const contextData = parseContextFiles()

  // Get the content to render for the message
  const renderMessageContent = () => {
    if (!message.content) {
      return isThinking ? "Thinking..." : ""
    }
    
    // Handle file creation messages specially
    if (isFileCreationMessage) {
      return null // We'll render these with special UI
    }
    
    // Handle file edit messages specially
    if (isFileEditMessage) {
      return null // We'll render these with special UI
    }
    
    // Handle context files - remove the marker and return the actual content
    if (hasContextFiles) {
      const lines = message.content.split('\n')
      return lines.slice(2).join('\n') // Skip the marker line and empty line
    }
    
    // Process mixed content with markdown code blocks
    let content = message.content;
    
    // Replace all markdown code blocks with their inner content
    // This will handle code blocks with ```markdown ... ``` format
    content = content.replace(/```markdown\s*\n([\s\S]*?)\n```/g, function(match, codeContent) {
      return codeContent;
    });
    
    // Remove any leftover introduction text like "Here's a markdown-formatted message:"
    // These typically appear before the actual markdown content
    content = content.replace(/^(Okay|Here|Sure|Alright)[^\n]*?\s*\n+/, '');
    
    // This ensures bullet points and lists render properly in markdown
    content = content.replace(/\n/g, '\n\n').replace(/\n\n\n+/g, '\n\n');
    
    return content;
  }

  return (
    <div 
      className={cn(
        "py-6 px-4 w-full",
        isUser ? "bg-background" : "bg-secondary/10",
        isThinking && "bg-muted/40 italic text-muted-foreground text-sm"
      )}
      id={isLast ? "last-message" : undefined}
    >
      <div className="max-w-3xl mx-auto flex gap-4 relative group">
        {!isThinking && (
          <ThemeAvatar 
            src={isUser ? userAvatar : geminiAvatar} 
            alt={isUser ? "User" : "Echo"} 
            fallback={isUser ? "U" : "AI"}
            className={cn(
              "h-8 w-8 ring-2 shrink-0",
              isUser ? "ring-primary/10" : "ring-primary/20"
            )}
          />
        )}

        <div className="flex flex-col flex-1 min-w-0">
          {!isThinking && (
            <div className="text-sm font-medium mb-1 text-foreground">
              {isUser ? "You" : "Echo"}
              {message.tokenCount && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({message.tokenCount} tokens)
                </span>
              )}
            </div>
          )}
          
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-none break-words relative",
            isUser ? "text-foreground" : "text-foreground"
          )}
          style={{
            WebkitUserSelect: 'text',
            userSelect: 'text',
            MozUserSelect: 'text',
            msUserSelect: 'text',
            touchAction: 'manipulation',
          }}>
            {isThinking ? (
              <Reasoning 
                isStreaming={isThinkingStreaming}
                defaultOpen={true}
                duration={actualThinkingDuration}
                className="mb-4"
              >
                <ReasoningTrigger />
                <ReasoningContent>
                  {renderMessageContent() || "Thinking..."}
                </ReasoningContent>
              </Reasoning>
            ) : (
              <div>
                {/* Show related thinking with shadcn Reasoning component */}
                {!isUser && relatedThinking && relatedThinking.content && (
                  <Reasoning 
                    defaultOpen={showThoughts}
                    onOpenChange={setShowThoughts}
                    isStreaming={false}
                    duration={actualThinkingDuration}
                    className="mb-4"
                  >
                    <ReasoningTrigger />
                    <ReasoningContent>
                      {relatedThinking.content}
                    </ReasoningContent>
                  </Reasoning>
                )}
                
                <div className="relative w-full">
                  {!isUser && (
                    <Actions className="absolute right-0 top-0 z-50">
                      <Action 
                        tooltip="Copy message"
                        onClick={copyToClipboard}
                        className="opacity-80 group-hover:opacity-100"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Action>
                    </Actions>
                  )}
                  <div className="pr-8"> {/* Add padding for copy button */}
                    {isUser && message.files && message.files.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {message.files.map((file) =>
                          file.mimeType.startsWith("image/") && file.previewUrl ? (
                            <div
                              key={file.uri || file.previewUrl}
                              className="relative group w-24 h-24"
                            >
                              <img
                                src={file.previewUrl}
                                alt={file.name}
                                className="w-full h-full object-cover rounded-lg border border-border"
                              />
                            </div>
                          ) : (
                            <div
                              key={file.uri || file.previewUrl}
                              className="flex items-center gap-2 p-2 rounded-lg border bg-muted text-muted-foreground text-sm"
                            >
                              <Paperclip className="h-4 w-4" />
                              <span className="truncate max-w-[200px]">{file.name}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                    
                    {/* Context Files UI */}
                    {hasContextFiles && contextData && (
                      <div className="mb-4 rounded-lg p-4 border transition-all duration-300 bg-gradient-to-r from-amber-50/50 to-orange-100/50 dark:from-amber-950/20 dark:to-orange-900/30 border-amber-200/30 dark:border-amber-800/30">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-amber-500/20 dark:bg-amber-400/20">
                            <div className="w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-400" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-amber-700 dark:text-amber-300 mb-2">
                              Context Files Provided
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {contextData.fileNames.map((fileName: string, index: number) => (
                                <code key={index} className="text-sm bg-amber-100/50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300">
                                  {fileName}
                                </code>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* File Creation UI */}
                    {isFileCreationMessage && fileCreationData && (
                      <Task defaultOpen={true} className="mb-4">
                        <TaskTrigger title={fileCreationData.type === 'processing' ? 'Creating file...' : 'File created'}>
                          <div className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
                            <FilePlus className="size-4" />
                            <p className="text-sm">
                              {fileCreationData.type === 'processing' ? 'Creating file...' : 'File created successfully'}
                            </p>
                          </div>
                        </TaskTrigger>
                        <TaskContent>
                          <TaskItem>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">File:</span>
                              <TaskItemFile>{fileCreationData.fileName}</TaskItemFile>
                            </div>
                          </TaskItem>
                          {fileCreationData.type === 'processing' ? (
                            <TaskItem>
                              <span className="italic">Generating content...</span>
                            </TaskItem>
                          ) : (
                            <>
                              {fileCreationData.isRenamed && fileCreationData.originalName && (
                                <TaskItem>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Renamed from:</span>
                                    <TaskItemFile>{fileCreationData.originalName}</TaskItemFile>
                                  </div>
                                </TaskItem>
                              )}
                              <TaskItem>
                                <span className="text-foreground">✓ The file is ready for you to review and edit.</span>
                              </TaskItem>
                            </>
                          )}
                        </TaskContent>
                      </Task>
                    )}
                    
                    {/* File Edit UI */}
                    {isFileEditMessage && fileEditData && (
                      <Task defaultOpen={true} className="mb-4">
                        <TaskTrigger title={fileEditData.type === 'processing' ? 'Editing file...' : fileEditData.type === 'success' ? 'File edited' : 'Edit failed'}>
                          <div className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
                            <FileEdit className="size-4" />
                            <p className="text-sm">
                              {fileEditData.type === 'processing' ? 'Editing file...' : fileEditData.type === 'success' ? 'File edited successfully' : 'Failed to edit file'}
                            </p>
                          </div>
                        </TaskTrigger>
                        <TaskContent>
                          <TaskItem>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">File:</span>
                              <TaskItemFile>{fileEditData.fileName}</TaskItemFile>
                            </div>
                          </TaskItem>
                          <TaskItem>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Request:</span>
                              <span className="italic">"{fileEditData.editPrompt}"</span>
                            </div>
                          </TaskItem>
                          {fileEditData.type === 'processing' ? (
                            <TaskItem>
                              <span className="italic">Generating edits...</span>
                            </TaskItem>
                          ) : fileEditData.type === 'success' ? (
                            <TaskItem>
                              <span className="text-foreground">✓ Review the changes in the file editor and accept or reject them.</span>
                            </TaskItem>
                          ) : (
                            <TaskItem>
                              <span className="text-destructive">❌ Please try again or edit the file manually.</span>
                            </TaskItem>
                          )}
                        </TaskContent>
                      </Task>
                    )}
                                    
                    <Response className="prose prose-sm dark:prose-invert max-w-none">
                      {renderMessageContent()}
                    </Response>
                    
                    {/* Grounding metadata display */}
                    {message.groundingMetadata && message.groundingMetadata.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
                      <div className="mt-4">
                        <Task defaultOpen={false} className="mb-4">
                          <TaskTrigger title="Web search performed">
                            <div className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
                              <Search className="size-4" />
                              <p className="text-sm">Searched the web</p>
                            </div>
                          </TaskTrigger>
                          <TaskContent>
                            {message.groundingMetadata.webSearchQueries && message.groundingMetadata.webSearchQueries.length > 0 && (
                              <TaskItem>
                                <div className="flex flex-col gap-1">
                                  <span className="text-muted-foreground">Queries:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {message.groundingMetadata.webSearchQueries.map((query: string, idx: number) => (
                                      <TaskItemFile key={idx}>{query}</TaskItemFile>
                                    ))}
                                  </div>
                                </div>
                              </TaskItem>
                            )}
                            <TaskItem>
                              <span className="text-foreground">✓ Found {message.groundingMetadata.groundingChunks.length} {message.groundingMetadata.groundingChunks.length === 1 ? 'source' : 'sources'}</span>
                            </TaskItem>
                          </TaskContent>
                        </Task>
                        <Sources>
                          <SourcesTrigger count={message.groundingMetadata.groundingChunks.length} />
                          <SourcesContent>
                            {message.groundingMetadata.groundingChunks.map((chunk: any, index: number) => {
                              // Extract clean domain from URL
                              const getDomainFromUrl = (url: string) => {
                                try {
                                  const domain = new URL(url).hostname;
                                  return domain.startsWith('www.') ? domain.slice(4) : domain;
                                } catch {
                                  return url;
                                }
                              };
                              
                              return (
                                <Source
                                  key={index}
                                  href={chunk.web?.uri}
                                  title={chunk.web?.title || (chunk.web?.uri ? getDomainFromUrl(chunk.web.uri) : 'Unknown source')}
                                />
                              );
                            })}
                          </SourcesContent>
                        </Sources>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
