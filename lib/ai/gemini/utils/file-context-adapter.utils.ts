/**
 * File context adapter utilities
 * Converts file nodes to context format for Gemini
 */

"use client"

import { FileNode } from "@/lib/files/types"
import { FileContextContent } from "@/lib/ai/types"
import { FileMetadata } from "../types"

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
 * @deprecated This functionality has been moved to system-instruction-builder.utils.ts
 * Use buildSystemInstruction() instead for better modularity
 */
export function generateFileContextInstruction(files: FileContextContent[]): string {
  // Re-export from the new location for backward compatibility
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { buildSystemInstruction } = require("./system-instruction-builder.utils")
  return buildSystemInstruction("", files).trim()
}

/**
 * Create chat-compatible file attachments from file nodes
 * This function returns an empty array since we handle local files differently than uploaded files.
 */
export function createChatAttachments(fileNodes: FileNode[]): FileMetadata[] {
  return []
}
