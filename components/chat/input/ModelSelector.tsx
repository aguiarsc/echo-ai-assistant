"use client"

import { useChatStore } from "@/lib/chat/stores/chat.store"
import { GEMINI_MODELS, GeminiModel } from "@/lib/ai/gemini/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/shared/utils/cn.utils"

interface ModelSelectorProps {
  chatId: string
  className?: string
}

export function ModelSelector({ chatId, className }: ModelSelectorProps) {
  const { chats, setModel } = useChatStore()
  const chat = chats.find(c => c.id === chatId)

  if (!chat) return null

  return (
    <Select value={chat.model} onValueChange={(value) => setModel(chatId, value as GeminiModel)}>
      <SelectTrigger 
        className={cn(
          "h-auto bg-transparent border-0 text-sm font-semibold truncate w-full p-1.5 focus:ring-0 focus:ring-offset-0",
          className
        )}
        aria-label="Select model"
      >
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {GEMINI_MODELS.map(model => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{model.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
