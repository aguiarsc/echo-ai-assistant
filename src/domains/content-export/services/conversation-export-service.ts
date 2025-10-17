import { Chat, ChatMessage } from '@/domains/conversations/types/conversation.types'
import { exportMarkdownToPdf, exportAsText, ExportPdfOptions } from './markdown-export-service'

export interface ChatExportOptions {
  format: 'pdf' | 'md' | 'txt' | 'json'
  filename?: string
  includeThinking?: boolean
  includeTimestamps?: boolean
  includeTokenCounts?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  pdfOptions?: ExportPdfOptions
}

export interface ChatExportData {
  chat: Chat
  exportedAt: string
  options: ChatExportOptions
}

export function chatToMarkdown(
  chat: Chat, 
  options: ChatExportOptions = { format: 'md' }
): string {
  const { includeThinking = false, includeTimestamps = true, includeTokenCounts = false } = options
  
  let markdown = `# ${chat.title}\n\n`
  
  markdown += `**Created:** ${new Date(chat.createdAt).toLocaleString()}\n`
  markdown += `**Model:** ${chat.model}\n`
  
  if (includeTokenCounts && chat.tokenCount) {
    markdown += `**Token Usage:** ${chat.tokenCount.total} total`
    if (chat.tokenCount.thinking) {
      markdown += ` (${chat.tokenCount.thinking} thinking)`
    }
    markdown += `\n`
  }
  
  markdown += `\n---\n\n`
  
  let messages = chat.messages
  if (options.dateRange) {
    messages = messages.filter(msg => {
      const msgDate = new Date(msg.timestamp)
      return msgDate >= options.dateRange!.start && msgDate <= options.dateRange!.end
    })
  }
  
  const messageGroups = new Map<string, ChatMessage[]>()
  
  messages.forEach(msg => {
    const turnId = msg.turnId || 'no-turn'
    if (!messageGroups.has(turnId)) {
      messageGroups.set(turnId, [])
    }
    messageGroups.get(turnId)!.push(msg)
  })
  
  for (const [turnId, groupMessages] of messageGroups) {
    const sortedMessages = groupMessages.sort((a, b) => {
      const order: Record<string, number> = { user: 0, thinking: 1, model: 2, system: 3 }
      return (order[a.role] || 999) - (order[b.role] || 999)
    })
    
    for (const message of sortedMessages) {
      if (message.role === 'thinking' && !includeThinking) {
        continue
      }
      
      const roleHeader = message.role === 'user' ? '## User' : 
                        message.role === 'thinking' ? '### 🧠 AI Thinking Process' : 
                        '## Assistant'
      
      markdown += `${roleHeader}\n\n`
      
      if (includeTimestamps) {
        markdown += `*${new Date(message.timestamp).toLocaleString()}*\n\n`
      }
      
      if (message.content) {
        if (message.role === 'thinking') {
          markdown += '```\n'
          markdown += message.content
          markdown += '\n```\n\n'
        } else {
          markdown += `${message.content}\n\n`
        }
      }
      
      if (message.files && message.files.length > 0) {
        markdown += `**Attached Files:** ${message.files.map(f => f.name).join(', ')}\n\n`
      }
      
      markdown += `---\n\n`
    }
  }
  
  return markdown
}

export async function exportChat(
  chat: Chat, 
  options: ChatExportOptions
): Promise<void> {
  const filename = options.filename || `chat-${chat.title.replace(/[^a-zA-Z0-9]/g, '-')}`
  
  try {
    switch (options.format) {
      case 'pdf':
        const markdown = chatToMarkdown(chat, options)
        await exportMarkdownToPdf(markdown, {
          filename,
          headerText: `Chat: ${chat.title}`,
          footerText: `Exported from Echo`,
          ...options.pdfOptions
        })
        break
        
      case 'md':
        const mdContent = chatToMarkdown(chat, options)
        exportAsText(mdContent, `${filename}.md`)
        break
        
      case 'txt':
        const txtContent = chatToMarkdown(chat, options)
          .replace(/#{1,6}\s+/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, ''))
          .replace(/^---$/gm, '─'.repeat(50))
        exportAsText(txtContent, `${filename}.txt`)
        break
        
      case 'json':
        const exportData: ChatExportData = {
          chat,
          exportedAt: new Date().toISOString(),
          options
        }
        exportAsText(JSON.stringify(exportData, null, 2), `${filename}.json`)
        break
        
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  } catch (error) {
    console.error('Chat export failed:', error)
    throw error
  }
}

export async function exportMultipleChats(
  chats: Chat[],
  options: ChatExportOptions
): Promise<void> {
  const filename = options.filename || `chats-export-${new Date().toISOString().split('T')[0]}`
  
  if (options.format === 'json') {
    const exportData = {
      chats,
      exportedAt: new Date().toISOString(),
      options,
      totalChats: chats.length
    }
    exportAsText(JSON.stringify(exportData, null, 2), `${filename}.json`)
    return
  }
  
  let combinedContent = ''
  
  if (options.format === 'md' || options.format === 'pdf') {
    combinedContent = `# Chat Export\n\n`
    combinedContent += `**Exported:** ${new Date().toLocaleString()}\n`
    combinedContent += `**Total Chats:** ${chats.length}\n\n`
    combinedContent += `---\n\n`
    
    chats.forEach((chat, index) => {
      combinedContent += chatToMarkdown(chat, options)
      if (index < chats.length - 1) {
        combinedContent += `\n\n# ═══════════════════════════════════════\n\n`
      }
    })
  }
  
  switch (options.format) {
    case 'pdf':
      await exportMarkdownToPdf(combinedContent, {
        filename,
        headerText: `Chat Export - ${chats.length} conversations`,
        footerText: `Exported from Echo Novel Assistant`,
        ...options.pdfOptions
      })
      break
      
    case 'md':
      exportAsText(combinedContent, `${filename}.md`)
      break
      
    case 'txt':
      const txtContent = combinedContent
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, ''))
        .replace(/^---$/gm, '─'.repeat(50))
      exportAsText(txtContent, `${filename}.txt`)
      break
  }
}

export function importChatFromJson(jsonContent: string): Chat[] {
  try {
    const data = JSON.parse(jsonContent)
    
    if (data.chat && data.exportedAt) {
      return [data.chat]
    }
    
    if (data.chats && Array.isArray(data.chats)) {
      return data.chats
    }
    
    if (Array.isArray(data)) {
      return data
    }
    
    throw new Error('Invalid chat export format')
  } catch (error) {
    console.error('Chat import failed:', error)
    throw new Error('Failed to import chat data. Please check the file format.')
  }
}
