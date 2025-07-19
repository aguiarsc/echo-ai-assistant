"use client"

import { FileNode } from "@/lib/files/store"
import { FileMetadata } from "@/lib/gemini/files-api"

/**
 * Interface for file content that will be sent as context to Gemini
 */
export interface FileContextContent {
  name: string
  path: string
  content: string
  type: string
  lastModified?: number
}

/**
 * Convert a file node from the file system to a content representation
 * that can be sent to Gemini as context
 */
export function convertFileToContext(file: FileNode): FileContextContent {
  // Ensure content is properly extracted and non-null
  const content = file.content !== undefined ? file.content : ""
  
  return {
    name: file.name,
    path: file.path || `/${file.name}`,
    content: content,
    type: file.type,
    lastModified: file.lastModified
  }
}

/**
 * Generate a text representation of a file for inclusion in the prompt
 */
export function generateFileContentText(file: FileContextContent): string {
  if (file.type === "folder") {
    return `## Folder: ${file.path}\n(directory structure)\n`
  }
  
  return `## File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`
}

/**
 * Generate a system instruction to inform Gemini about the files being provided as context
 */
export function generateFileContextInstruction(files: FileContextContent[]): string {
  if (files.length === 0) return ""
  
  // Create a comprehensive instruction with explicit file content
  let instruction = `
=== START OF FILE CONTEXT ===

`
  
  // Add each file with clear boundaries
  for (const file of files) {
    // Skip directory entries since we're already including their children separately
    if (file.type === "folder") {
      continue;
    }
    
    // Include only file contents with clear boundaries
    instruction += `FILE PATH: ${file.path}\n`
    instruction += `FILE TYPE: ${file.type}\n`
    instruction += `CONTENT:\n\`\`\`\n${file.content || "[Empty File]"}\n\`\`\`\n\n`
    
    instruction += `=== END OF FILE: ${file.path} ===\n\n`
  }
  
  instruction += `=== END OF FILE CONTEXT ===\n\n`
  
  // Add balanced instructions that allow reasonable inference while maintaining accuracy
  instruction += `
IMPORTANT INSTRUCTIONS:
1. Base your responses primarily on the provided file content above.
2. You may make reasonable inferences and draw logical conclusions based on the context.
3. When asked for opinions, assessments, or prioritization not explicitly stated, use your judgment to provide helpful responses.
4. When information is clearly not in the files, state that it isn't available in the context.
5. Do NOT include file paths or source citations in your responses.
6. Be helpful and direct in your responses without repeatedly mentioning limitations.
`
  
  return instruction
}

/**
 * Create chat-compatible file attachments from file nodes
 * 
 * IMPORTANT: We don't actually use the FileMetadata directly for local files.
 * Instead, we're using a different approach by enhancing the system prompt with file content.
 * 
 * This function returns an empty array since we handle local files differently than uploaded files.
 */
export function createChatAttachments(fileNodes: FileNode[]): FileMetadata[] {
  // We don't create actual FileMetadata objects for local files since they won't work with Gemini API
  // Local files are handled through system instructions and context enhancement
  return []
}

/**
 * Simple MIME type determination based on file extension
 */
function determineMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  
  const mimeTypes: Record<string, string> = {
    js: 'application/javascript',
    jsx: 'application/javascript',
    ts: 'application/typescript',
    tsx: 'application/typescript',
    html: 'text/html',
    css: 'text/css',
    json: 'application/json',
    md: 'text/markdown',
    txt: 'text/plain',
    py: 'text/x-python',
    rb: 'text/ruby',
    java: 'text/x-java',
    c: 'text/x-c',
    cpp: 'text/x-c++',
    go: 'text/x-go',
    rs: 'text/x-rust',
    php: 'application/x-php',
  }
  
  return mimeTypes[extension] || 'text/plain'
}
