"use client"

import { useChatStore } from "@/lib/gemini/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { GEMINI_MODELS } from "@/lib/gemini"
import { Edit, MessageCircle, Plus, Settings, Trash, Folder, Pin, PinOff, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SettingsPanel } from "@/components/chat/settings-panel"
import Image from "next/image"
import { FilesTab } from "@/components/files/files-tab"
import { useThemeStore } from "@/lib/themes/store"

export function Sidebar() {
  const [open, setOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [newChatName, setNewChatName] = useState("")
  const [activeTab, setActiveTab] = useState<"chats" | "files">("chats")
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  
  const { 
    chats, 
    activeChat, 
    createChat, 
    deleteChat, 
    renameChat, 
    setActiveChat,
    pinChat,
    unpinChat
  } = useChatStore()

  const handleCreateChat = () => {
    createChat(GEMINI_MODELS[0].id)
  }

  const handleDeleteChat = (id: string) => {
    deleteChat(id)
  }

  const handleRename = (id: string) => {
    if (newChatName.trim()) {
      renameChat(id, newChatName.trim())
      setRenameId(null)
      setNewChatName("")
    }
  }

  return (
    <>
      {/* Mobile overlay background */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Fixed position toggle button - always in the same position */}
      <div className="fixed top-3 left-3 z-50">
        <button 
          onClick={() => setOpen(!open)} 
          className="transition-transform"
          aria-label={open ? "Close sidebar" : "Open sidebar"}
        >
          <Image src="/images/gemini.png" alt="Gemini" width={32} height={32} className="dark:invert" />
        </button>
      </div>

      {/* Expanded sidebar */}
      <aside className={cn(
        "h-full bg-background border-r transition-all duration-300 flex flex-col shadow-sm",
        "fixed md:relative z-40 md:z-auto", // Make sidebar fixed on mobile, relative on desktop (z-40 to be below the button)
        open ? "w-[85vw] max-w-[280px] md:w-72" : "w-0 -ml-6 opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center p-4 border-b h-14 shrink-0 justify-start pl-12"> 
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button 
            className={cn(
              "flex items-center justify-center flex-1 py-2 px-3 border-b-2 transition-colors",
              activeTab === "chats" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("chats")}
          >
            <MessageCircle className={cn("h-4 w-4", !open && "mx-auto")} />
            {open && <span className="ml-2 text-sm">Chats</span>}
          </button>
          
          <button 
            className={cn(
              "flex items-center justify-center flex-1 py-2 px-3 border-b-2 transition-colors",
              activeTab === "files" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("files")}
          >
            <Folder className={cn("h-4 w-4", !open && "mx-auto")} />
            {open && <span className="ml-2 text-sm">Files</span>}
          </button>

        </div>
        
        {/* Chat Tab Content */}
        {activeTab === "chats" && (
          <>
            <div className="p-3">
              <Button 
                onClick={handleCreateChat} 
                variant="outline"
                className={cn(
                  "w-full gap-2 py-6 border-dashed",
                  !open ? "justify-center px-2" : "px-4",
                  "hover:border-primary hover:text-primary transition-colors"
                )}
              >
                <Plus className={cn("h-5 w-5", open && "mr-1")} />
                {open && "New Chat"}
              </Button>
            </div>
            
            <ScrollArea className="flex-1 px-2">
              <div className="py-2 space-y-1">
                {chats.length === 0 && open && (
                  <div className="text-center text-xs text-muted-foreground py-8 px-2">
                    No chats yet. Create your first chat to get started.
                  </div>
                )}
                {chats.map(chat => (
                  <div 
                    key={chat.id}
                    className={cn(
                      "group flex items-center justify-between rounded-md py-2 px-3",
                      "hover:bg-accent/50 transition-colors",
                      activeChat === chat.id ? "bg-accent/60 text-accent-foreground shadow-sm" : "text-foreground/80"
                    )}
                  >
                    {/* Chat title area */}
                    <div 
                      className={cn(
                        "flex items-center gap-2 cursor-pointer overflow-hidden",
                        open ? "max-w-[160px]" : "w-full justify-center"
                      )}
                      onClick={() => setActiveChat(chat.id)}
                    >
                      <MessageCircle className={cn("h-4 w-4 shrink-0", 
                        activeChat === chat.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      
                      {open && (
                        <div className="flex items-center flex-1 truncate">
                          {chat.pinned && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Pin className="h-3 w-3 mr-1 text-amber-500 fill-current" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="text-xs max-w-52">Pinned chat - protected from auto-deletion</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <div className={cn(
                            "truncate text-sm",
                            activeChat !== chat.id && "text-muted-foreground"
                          )}>
                            {renameId === chat.id ? (
                              <Input
                                className="h-6 text-xs py-1"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRename(chat.id);
                                  if (e.key === "Escape") setRenameId(null);
                                }}
                                onBlur={() => handleRename(chat.id)}
                                autoFocus
                              />
                            ) : (
                              chat.title
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    {open && activeChat === chat.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-6 w-6 group-hover:opacity-100 rounded-full",
                                  chat.pinned && "text-amber-500 hover:text-amber-600"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  chat.pinned ? unpinChat(chat.id) : pinChat(chat.id);
                                }}
                                aria-label={chat.pinned ? "Unpin chat" : "Pin chat to prevent 48-hour auto-deletion"}
                              >
                                {chat.pinned ? 
                                  <Pin className="h-3 w-3 fill-current" /> : 
                                  <PinOff className="h-3 w-3" />}
                                <span className="sr-only">{chat.pinned ? "Unpin chat" : "Pin chat"}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {chat.pinned 
                                ? "Unpin chat (will be auto-deleted after 48 hours)" 
                                : "Pin chat to prevent auto-deletion after 48 hours"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 group-hover:opacity-100 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameId(chat.id);
                            setNewChatName(chat.title);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                          <span className="sr-only">Rename chat</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 group-hover:opacity-100 hover:text-destructive rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                        >
                          <Trash className="h-3 w-3" />
                          <span className="sr-only">Delete chat</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
        
        {/* Files Tab Content */}
        {activeTab === "files" && (
          <div className="flex-1 overflow-hidden">
            <FilesTab open={open} />
          </div>
        )}
        
        <div className="flex items-center p-4 shrink-0 h-24 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="shrink-0"
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle {isDarkMode ? 'Light' : 'Dark'} Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="ghost" 
            className={cn(
              "w-auto justify-start flex-1",
              !open && "justify-center p-2 flex-none"
            )}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className={cn("h-4 w-4", open && "mr-2")} />
            {open && "Settings"}
          </Button>
        </div>
      </aside>
      
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}