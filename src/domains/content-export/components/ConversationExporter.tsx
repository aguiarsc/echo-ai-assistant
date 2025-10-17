"use client"

import React, { useState } from 'react'
import { Button } from "@/shared/ui-components/button"
import { Download, Upload, FileDown, Settings, Brain, Clock, Hash } from "lucide-react"
import { Chat } from "@/domains/conversations/types/conversation.types"
import { useChatStore } from "@/domains/conversations/storage/conversation-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/shared/ui-components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/select"
import { Input } from "@/shared/ui-components/input"
import { Label } from "@/shared/ui-components/label"
import { Checkbox } from "@/shared/ui-components/checkbox"
import { useToast } from "@/shared/ui-components/use-toast"
import { Separator } from "@/shared/ui-components/separator"
import { Badge } from "@/shared/ui-components/badge"
import { exportChat, exportMultipleChats, importChatFromJson, ChatExportOptions } from "@/domains/content-export/services/conversation-export-service"

interface ChatExportProps {
  chat?: Chat
  variant?: 'button' | 'icon'
  className?: string
}

export function ConversationExporter({ chat, variant = 'button', className }: ChatExportProps) {
  const { toast } = useToast()
  const { chats, setChatData } = useChatStore()
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'md' | 'txt' | 'json'>('pdf')
  const [filename, setFilename] = useState(() => {
    if (chat) {
      return chat.title.replace(/[^a-zA-Z0-9]/g, '-')
    }
    return `chats-export-${new Date().toISOString().split('T')[0]}`
  })
  
  const [includeThinking, setIncludeThinking] = useState(false)
  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [includeTokenCounts, setIncludeTokenCounts] = useState(false)
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([])
  
  const [useDateRange, setUseDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)
      
      const options: ChatExportOptions = {
        format: exportFormat,
        filename,
        includeThinking,
        includeTimestamps,
        includeTokenCounts,
        dateRange: useDateRange && startDate && endDate ? {
          start: new Date(startDate),
          end: new Date(endDate)
        } : undefined,
        pdfOptions: {
          orientation: pdfOrientation,
          headerText: chat ? `Chat: ${chat.title}` : 'Chat Export',
          footerText: 'Exported from Echo'
        }
      }
      
      if (chat) {
        await exportChat(chat, options)
        toast({
          title: "Chat exported successfully",
          description: `Exported "${chat.title}" as ${exportFormat.toUpperCase()}`,
        })
      } else {
        const chatsToExport = selectedChatIds.length > 0 
          ? chats.filter(c => selectedChatIds.includes(c.id))
          : chats
          
        if (chatsToExport.length === 0) {
          toast({
            title: "No chats selected",
            description: "Please select at least one chat to export.",
            variant: "destructive"
          })
          return
        }
        
        await exportMultipleChats(chatsToExport, options)
        toast({
          title: "Chats exported successfully",
          description: `Exported ${chatsToExport.length} chat${chatsToExport.length > 1 ? 's' : ''} as ${exportFormat.toUpperCase()}`,
        })
      }
      
      setOpen(false)
    } catch (error) {
      console.error("Export failed", error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "There was an error exporting your chat(s). Please try again.",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      setImporting(true)
      const content = await file.text()
      const importedChats = importChatFromJson(content)
      
      setChatData([...chats, ...importedChats])
      
      toast({
        title: "Chats imported successfully",
        description: `Imported ${importedChats.length} chat${importedChats.length > 1 ? 's' : ''}`,
      })
      
      setOpen(false)
    } catch (error) {
      console.error("Import failed", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "There was an error importing your chats. Please check the file format.",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  const toggleChatSelection = (chatId: string) => {
    setSelectedChatIds(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    )
  }

  const selectAllChats = () => {
    setSelectedChatIds(chats.map(c => c.id))
  }

  const clearSelection = () => {
    setSelectedChatIds([])
  }

  const triggerButton = variant === 'icon' ? (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      title={chat ? "Export chat" : "Export/Import chats"}
    >
      <FileDown className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="outline" className={className}>
      <Download className="h-4 w-4 mr-2" />
      {chat ? "Export Chat" : "Export/Import"}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {chat ? `Export "${chat.title}"` : "Export/Import Chats"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <h3 className="text-sm font-medium">Export Options</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter filename"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value) => setExportFormat(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="md">Markdown</SelectItem>
                    <SelectItem value="txt">Plain Text</SelectItem>
                    <SelectItem value="json">JSON (with metadata)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {!chat && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select Chats to Export</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllChats}
                      disabled={chats.length === 0}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      disabled={selectedChatIds.length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                  {chats.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No chats available to export
                    </p>
                  ) : (
                    chats.map((chatItem) => (
                      <div key={chatItem.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={chatItem.id}
                          checked={selectedChatIds.includes(chatItem.id)}
                          onCheckedChange={() => toggleChatSelection(chatItem.id)}
                        />
                        <Label
                          htmlFor={chatItem.id}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {chatItem.title}
                        </Label>
                        <Badge variant="secondary" className="text-xs">
                          {chatItem.messages.length} msgs
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                
                {selectedChatIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedChatIds.length} chat{selectedChatIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Export Settings
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeThinking"
                    checked={includeThinking}
                    onCheckedChange={(checked) => setIncludeThinking(checked === true)}
                  />
                  <Label htmlFor="includeThinking" className="text-sm flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Include thinking process
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTimestamps"
                    checked={includeTimestamps}
                    onCheckedChange={(checked) => setIncludeTimestamps(checked === true)}
                  />
                  <Label htmlFor="includeTimestamps" className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Include timestamps
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTokenCounts"
                    checked={includeTokenCounts}
                    onCheckedChange={(checked) => setIncludeTokenCounts(checked === true)}
                  />
                  <Label htmlFor="includeTokenCounts" className="text-sm flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Include token counts
                  </Label>
                </div>
                
                {exportFormat === 'pdf' && (
                  <div className="space-y-2">
                    <Label htmlFor="orientation">PDF Orientation</Label>
                    <Select
                      value={pdfOrientation}
                      onValueChange={(value) => setPdfOrientation(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useDateRange"
                  checked={useDateRange}
                  onCheckedChange={(checked) => setUseDateRange(checked === true)}
                />
              </div>
              
              {useDateRange && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {!chat && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Import Chats</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="import-file">Import from JSON file</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={importing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select a JSON file exported from Echo
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleExport} 
            disabled={exporting || !filename.trim() || (!chat && selectedChatIds.length === 0 && chats.length > 0)}
          >
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
