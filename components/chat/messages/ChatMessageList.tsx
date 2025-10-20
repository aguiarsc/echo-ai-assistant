"use client"

import { useEffect } from "react"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "@/components/chat/input/ChatInput"
import { useChatStore } from "@/lib/chat/stores/chat.store"
import { useChat } from "@/hooks/chat/use-chat.hook"
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ui/shadcn-io/ai/conversation"

export function ChatMessageList() {
  const { 
    chats, 
    activeChat
  } = useChatStore()
  
  // Get access to the getRelatedThinking function from useChat
  const { getRelatedThinking } = useChat()
  const currentChat = chats.find((chat) => chat.id === activeChat);

  // Update last active time when interacting with chat
  useEffect(() => {
    if (currentChat) {
      localStorage.setItem('lastActiveChatTime', Date.now().toString());
    }
  }, [currentChat?.messages]);

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
              <Conversation className="flex-1">
                <ConversationContent className="px-2 sm:px-4 pt-4 sm:pt-6 pb-2 sm:pb-4">
                  <div className="flex flex-col gap-4 sm:gap-6">
                    {currentChat.messages
                      .filter((msg) => msg.role !== "thinking")
                      .map((message, index) => {
                        const relatedThinking = getRelatedThinking(message.turnId);
                        const filteredLength = currentChat.messages.filter(
                          (m) => m.role !== "thinking"
                        ).length;

                        return (
                          <ChatMessage
                            key={message.id}
                            message={message}
                            relatedThinking={relatedThinking}
                            isLast={index === filteredLength - 1}
                          />
                        );
                      })}
                  </div>
                </ConversationContent>
                <ConversationScrollButton className="shadow-md" />
              </Conversation>
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
