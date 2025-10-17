"use client"

import { FileNode } from "@/domains/writing-projects/storage/project-store"
import { FileMetadata } from "./files-api"

export interface FileContextContent {
  name: string
  path: string
  content: string
  type: string
  lastModified?: number
}

export function convertFileToContext(file: FileNode): FileContextContent {
  const content = file.content !== undefined ? file.content : ""
  
  return {
    name: file.name,
    path: file.path || `/${file.name}`,
    content: content,
    type: file.type,
    lastModified: file.lastModified
  }
}

export function generateFileContentText(file: FileContextContent): string {
  if (file.type === "folder") {
    return `## Folder: ${file.path}\n(directory structure)\n`
  }
  
  return `## File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`
}

export function generateFileContextInstruction(files: FileContextContent[]): string {
  const { buildSystemInstruction } = require("./system-instruction-builder")
  return buildSystemInstruction("", files).trim()
}

export function createChatAttachments(fileNodes: FileNode[]): FileMetadata[] {
  return []
}
