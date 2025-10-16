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

You have access to the following files from the user's project:

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
1. Use the file content above as your primary reference.
2. Apply your understanding and reasoning to provide helpful, complete responses.
3. When asked for recommendations or assessments, use your judgment based on the context.
4. If specific information isn't in the files and is needed, simply note that briefly.
5. Respond naturally without mentioning file paths or quoting boundaries.
6. Be helpful and direct in your responses without repeatedly mentioning limitations.
`
  
  return instruction
}

/**
 * Create chat-compatible file attachments from file nodes
 * This function returns an empty array since we handle local files differently than uploaded files.
 */
export function createChatAttachments(fileNodes: FileNode[]): FileMetadata[] {
  return []
}
