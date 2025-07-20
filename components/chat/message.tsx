"use client"

import { cn } from "@/lib/utils"
import { ChatMessage } from "@/lib/gemini"
import { ThemeAvatar } from "@/components/ui/theme-avatar"
import ReactMarkdown from "react-markdown"
import { CodeBlock } from "@/components/chat/code-block"
import { ScrollArea } from "../ui/scroll-area"
import { Check, Copy, ChevronDown, ChevronUp, Paperclip, X } from "lucide-react"
import { AIReasoning, AIReasoningTrigger, AIReasoningContent } from "@/components/ui/ai-reasoning"
import { useState } from "react"
import { toast } from "sonner"
import { useChatStore } from "@/lib/gemini/store"

interface MessageProps {
  message: ChatMessage & {
    // Optional token count info that might be added by our application
    tokenCount?: number;
    thoughtSummary?: string; // Add thought summary support
  }
  isLast?: boolean;
  relatedThinking?: ChatMessage | null; // Link to thinking message if available
}

export function Message({ message, isLast, relatedThinking }: MessageProps) {
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
            alt={isUser ? "User" : "altIA"} 
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
              {isUser ? "You" : "altIA"}
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
              <AIReasoning 
                isStreaming={isThinkingStreaming}
                defaultOpen={true}
                duration={actualThinkingDuration}
                className="mb-4"
              >
                <AIReasoningTrigger />
                <AIReasoningContent>
                  {renderMessageContent() || "Thinking..."}
                </AIReasoningContent>
              </AIReasoning>
            ) : (
              <div>
                {/* Show related thinking with new AI Reasoning component */}
                {!isUser && relatedThinking && relatedThinking.content && (
                  <AIReasoning 
                    defaultOpen={showThoughts}
                    onOpenChange={setShowThoughts}
                    isStreaming={false}
                    duration={actualThinkingDuration}
                    className="mb-4"
                  >
                    <AIReasoningTrigger />
                    <AIReasoningContent>
                      {relatedThinking.content}
                    </AIReasoningContent>
                  </AIReasoning>
                )}
                
                <div className="relative w-full">
                  {!isUser && (
                    <div className="absolute right-0 top-0 z-50">
                      <button 
                        onClick={copyToClipboard}
                        className="bg-secondary/70 text-primary hover:bg-secondary p-1.5 rounded-md opacity-80 group-hover:opacity-100 transition-all hover:shadow-sm border border-primary/10"
                        aria-label="Copy message"
                        title="Copy message"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
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
                      <div className={cn(
                        "mb-4 rounded-lg p-4 border transition-all duration-300",
                        fileCreationData.type === 'processing' 
                          ? "bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/30 border-blue-200/30 dark:border-blue-800/30"
                          : "bg-gradient-to-r from-green-50/50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/30 border-green-200/30 dark:border-green-800/30"
                      )}>
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                            fileCreationData.type === 'processing'
                              ? "bg-blue-500/20 dark:bg-blue-400/20"
                              : "bg-green-500/20 dark:bg-green-400/20"
                          )}>
                            {fileCreationData.type === 'processing' ? (
                              <div className={cn(
                                "w-3 h-3 rounded-full animate-pulse",
                                "bg-blue-500 dark:bg-blue-400"
                              )} />
                            ) : (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {fileCreationData.type === 'processing' ? (
                              <div>
                                <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                                  Creating file: <code className="text-sm bg-blue-100/50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{fileCreationData.fileName}</code>
                                </div>
                                <div className="text-sm text-blue-600/80 dark:text-blue-400/80 italic">
                                  Generating content...
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-green-700 dark:text-green-300 mb-2">
                                  File created successfully!
                                </div>
                                <div className="space-y-1 text-sm text-green-600/90 dark:text-green-400/90">
                                  {fileCreationData.isRenamed && fileCreationData.originalName && (
                                    <div className="flex items-center gap-2">
                                      <span>🔄</span>
                                      <span><strong>Renamed from:</strong> <code className="bg-green-100/50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">{fileCreationData.originalName}</code></span>
                                    </div>
                                  )}
                                  <div className="mt-2 pt-2 border-t border-green-200/30 dark:border-green-800/30">
                                    <span className="text-green-700 dark:text-green-300">The file is ready for you to review and edit.</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* File Edit UI */}
                    {isFileEditMessage && fileEditData && (
                      <div className={cn(
                        "mb-4 rounded-lg p-4 border transition-all duration-300",
                        fileEditData.type === 'processing' 
                          ? "bg-gradient-to-r from-purple-50/50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/30 border-purple-200/30 dark:border-purple-800/30"
                          : fileEditData.type === 'success'
                          ? "bg-gradient-to-r from-green-50/50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/30 border-green-200/30 dark:border-green-800/30"
                          : "bg-gradient-to-r from-red-50/50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/30 border-red-200/30 dark:border-red-800/30"
                      )}>
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                            fileEditData.type === 'processing'
                              ? "bg-purple-500/20 dark:bg-purple-400/20"
                              : fileEditData.type === 'success'
                              ? "bg-green-500/20 dark:bg-green-400/20"
                              : "bg-red-500/20 dark:bg-red-400/20"
                          )}>
                            {fileEditData.type === 'processing' ? (
                              <div className={cn(
                                "w-3 h-3 rounded-full animate-pulse",
                                "bg-purple-500 dark:bg-purple-400"
                              )} />
                            ) : fileEditData.type === 'success' ? (
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {fileEditData.type === 'processing' ? (
                              <div>
                                <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                                  Editing file: <code className="text-sm bg-purple-100/50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">{fileEditData.fileName}</code>
                                </div>
                                <div className="text-sm text-purple-600/80 dark:text-purple-400/80 italic">
                                  Generating edits for: "{fileEditData.editPrompt}"...
                                </div>
                              </div>
                            ) : fileEditData.type === 'success' ? (
                              <div>
                                <div className="font-medium text-green-700 dark:text-green-300 mb-2">
                                File edited successfully!
                                </div>
                                <div className="space-y-1 text-sm text-green-600/90 dark:text-green-400/90">
                                  <div className="mt-2 pt-2 border-t border-green-200/30 dark:border-green-800/30">
                                    <span className="text-green-700 dark:text-green-300">Review the changes in the file editor and accept or reject them.</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-red-700 dark:text-red-300 mb-2">
                                  ❌ Failed to generate edits
                                </div>
                                <div className="space-y-1 text-sm text-red-600/90 dark:text-red-400/90">
                                  <div className="flex items-center gap-2">
                                    <span>📝</span>
                                    <span><strong>File:</strong> <code className="bg-red-100/50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">{fileEditData.fileName}</code></span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>🎯</span>
                                    <span><strong>Request:</strong> "{fileEditData.editPrompt}"</span>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-red-200/30 dark:border-red-800/30">
                                    <span className="text-red-700 dark:text-red-300">Please try again or edit the file manually.</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <ReactMarkdown
                      components={{
                        pre: ({ node, ...props }: any) => {
                          return <CodeBlock {...props} />;
                        },
                        p: ({ node, children, ...props }: any) => {
                          return <p className="mb-4 leading-relaxed" {...props}>{children}</p>;
                        },
                        ul: ({ node, ordered, ...props }: any) => {
                          return <ul className="my-4 list-disc list-outside pl-6" {...props} />;
                        },
                        ol: ({ node, ordered, ...props }: any) => {
                          return <ol className="my-4 list-decimal list-outside pl-6" {...props} />;
                        },
                        li: ({ node, checked, ...props }: any) => {
                          return <li className="mb-2" {...props} />;
                        },
                        h1: ({ node, ...props }: any) => {
                          return <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />;
                        },
                        h2: ({ node, ...props }: any) => {
                          return <h2 className="text-xl font-semibold mt-6 mb-3" {...props} />;
                        },
                        h3: ({ node, ...props }: any) => {
                          return <h3 className="text-lg font-semibold mt-6 mb-3" {...props} />;
                        },
                        h4: ({ node, ...props }: any) => {
                          return <h4 className="text-base font-medium mt-5 mb-2" {...props} />;
                        },
                        h5: ({ node, ...props }: any) => {
                          return <h5 className="text-sm font-medium mt-4 mb-2" {...props} />;
                        },
                        h6: ({ node, ...props }: any) => {
                          return <h6 className="text-sm font-medium mt-4 mb-2" {...props} />;
                        },
                        blockquote: ({ node, ...props }: any) => {
                          return <blockquote className="border-l-4 border-primary/30 pl-4 my-4 text-muted-foreground italic" {...props} />;
                        },
                        hr: ({ node, ...props }: any) => {
                          return <hr className="my-6 border-t border-border" {...props} />;
                        },
                        table: ({ node, ...props }: any) => {
                          return (
                            <div className="flex-1 overflow-auto" 
                  style={{
                    WebkitUserSelect: 'text',
                    userSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'rgba(0,0,0,0.2)',
                  }}
                  data-mobile-selectable="true">
                              <table className="w-full border-collapse text-left" {...props} />
                            </div>
                          );
                        },
                        thead: ({ node, ...props }: any) => {
                          return <thead className="bg-muted/50" {...props} />;
                        },
                        tbody: ({ node, ...props }: any) => {
                          return <tbody {...props} />;
                        },
                        tr: ({ node, ...props }: any) => {
                          return <tr className="border-b border-border" {...props} />;
                        },
                        th: ({ node, ...props }: any) => {
                          return <th className="px-4 py-2 text-left font-semibold" {...props} />;
                        },
                        td: ({ node, ...props }: any) => {
                          return <td className="px-4 py-2" {...props} />;
                        },
                        a: ({ node, href, ...props }: any) => {
                          return <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />;
                        },
                        img: ({ node, src, alt, ...props }: any) => {
                          return <img src={src} alt={alt} className="max-w-full my-4 rounded-md" {...props} />;
                        },
                        strong: ({ node, ...props }: any) => {
                          return <strong className="font-bold" {...props} />;
                        },
                        em: ({ node, ...props }: any) => {
                          return <em className="italic" {...props} />;
                        },
                        del: ({ node, ...props }: any) => {
                          return <del className="line-through" {...props} />;
                        },
                      }}
                    >
                      {renderMessageContent()}
                    </ReactMarkdown>
                    
                    {/* Grounding metadata display */}
                    {message.groundingMetadata && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">Sources</span>
                        </div>
                        {message.groundingMetadata.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
                          <div className="space-y-1">
                            {message.groundingMetadata.groundingChunks.slice(0, 3).map((chunk: any, index: number) => {
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
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></div>
                                  <a 
                                    href={chunk.web?.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:underline transition-colors"
                                    title={chunk.web?.title || chunk.web?.uri}
                                  >
                                    {chunk.web?.title || (chunk.web?.uri ? getDomainFromUrl(chunk.web.uri) : 'Unknown source')}
                                  </a>
                                </div>
                              );
                            })}
                            {message.groundingMetadata.groundingChunks.length > 3 && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 bg-red-300 rounded-full flex-shrink-0"></div>
                                <span className="text-xs text-red-500 dark:text-red-400">
                                  +{message.groundingMetadata.groundingChunks.length - 3} more sources
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {message.groundingMetadata.webSearchQueries && message.groundingMetadata.webSearchQueries.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                            <div className="text-xs text-red-600 dark:text-red-400">
                              <span className="font-medium">Search queries:</span> {message.groundingMetadata.webSearchQueries.join(', ')}
                            </div>
                          </div>
                        )}
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
