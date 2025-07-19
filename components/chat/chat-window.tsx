"use client"

import { useRef, useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Message } from "@/components/chat/message"
import { ChatInput } from "@/components/chat/chat-input"
import { useChatStore } from "@/lib/gemini/store"
import { useChat } from "@/hooks/use-chat"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GEMINI_MODELS } from "@/lib/gemini"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ChatWindow() {
  const { 
    chats, 
    activeChat, 
    generationParams,
    setGenerationParams,
    createChat,
    isStreaming,
    setActiveChat
  } = useChatStore()
  
  // Get access to the getRelatedThinking function from useChat
  const { getRelatedThinking } = useChat()
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentChat = chats.find((chat) => chat.id === activeChat);
  
  // Track if user has manually scrolled up during streaming
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  
  // Track the scroll position and scroll height to determine user scroll actions
  const [scrollData, setScrollData] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0
  });
  
  // Update last active time when interacting with chat
  useEffect(() => {
    if (currentChat) {
      localStorage.setItem('lastActiveChatTime', Date.now().toString());
    }
  }, [currentChat?.messages]);

  // Handle user scroll events
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // Allow small margin
    
    // Save current scroll data
    setScrollData({ scrollTop, scrollHeight, clientHeight });
    
    // If user scrolls away from bottom during streaming, note it
    if (isStreaming && !isAtBottom) {
      setUserHasScrolled(true);
    }
    
    // If user scrolls back to bottom, reset the flag
    if (isAtBottom) {
      setUserHasScrolled(false);
    }
  };
  
  // Set up scroll event listener
  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [isStreaming]);
  
  // Auto-scroll to bottom on new messages or streaming (unless user has scrolled)
  useEffect(() => {
    // Don't auto-scroll if user is reading earlier content
    if (scrollAreaRef.current && !userHasScrolled) {
      if (isStreaming) {
        // For streaming, a direct scroll is better to keep up with content
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      } else {
        // For new messages, smooth scroll into view
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        // Reset user scroll flag when a new message is sent
        setUserHasScrolled(false);
      }
    }
  }, [currentChat?.messages, isStreaming, userHasScrolled]);

  return (
    <div className="flex flex-col h-full bg-background">
      {currentChat && (
        <>
          <div className="flex items-center justify-end px-3 sm:px-5 py-3 bg-background/80 backdrop-blur-sm shrink-0 h-14">
            <div className="flex-1 text-right pr-2 sm:pr-4 overflow-hidden">
              <h2 className="text-base sm:text-lg font-semibold truncate inline-block max-w-[calc(100%-40px)] ml-10">
                {currentChat.title === "New Chat" ? "" : currentChat.title}
              </h2>
            </div>
          </div>

          {currentChat.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4 text-center px-4">How can I assist you today?</h2>
              <div className="w-full max-w-3xl px-2 sm:px-0">
                <ChatInput />
              </div>
            </div>
          ) : (
            <>
              <div 
                ref={scrollAreaRef} 
                className="flex-1 overflow-y-auto"
              >
                <div className="px-2 sm:px-4 pt-4 sm:pt-6 pb-2 sm:pb-4">
                  <div className="flex flex-col gap-4 sm:gap-6">
                    {currentChat.messages
                      .filter((msg) => msg.role !== "thinking")
                      .map((message, index) => {
                        const relatedThinking = getRelatedThinking(message.turnId);
                        const filteredLength = currentChat.messages.filter(
                          (m) => m.role !== "thinking"
                        ).length;

                        return (
                          <Message
                            key={message.id}
                            message={message}
                            relatedThinking={relatedThinking}
                            isLast={index === filteredLength - 1}
                          />
                        );
                      })}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-background/80 backdrop-blur-sm shrink-0">
                <div className="max-w-3xl mx-auto">
                  <ChatInput />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
