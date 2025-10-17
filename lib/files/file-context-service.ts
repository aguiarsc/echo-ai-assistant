/**
 * File context service
 * Centralizes logic for preparing and managing file context for AI interactions
 */

import { FileNode } from "./store";
import { FileContextContent, convertFileToContext } from "../gemini/file-context-adapter";

/**
 * Recursively collect all files from a folder structure
 * Expands folders to include all their children
 */
export function collectFilesRecursively(
  selectedFiles: FileNode[],
  getNodeById: (id: string) => FileNode | undefined
): FileNode[] {
  const result: FileNode[] = [];
  
  const processNode = (node: FileNode) => {
    if (node.type === "file") {
      // If it's a file, simply add it
      result.push(node);
    } else if (node.type === "folder" && node.children) {
      // If it's a folder, add it and recursively process all children
      result.push(node);
      
      // Process all children
      node.children.forEach(childId => {
        const childNode = getNodeById(childId);
        if (childNode) {
          processNode(childNode);
        }
      });
    }
  };
  
  // Process all initially selected files/folders
  selectedFiles.forEach(processNode);
  
  return result;
}

/**
 * Prepare file context from selected file nodes
 * Converts file nodes to context format suitable for AI
 */
export function prepareFileContext(
  selectedFiles: FileNode[],
  getNodeById: (id: string) => FileNode | undefined
): FileContextContent[] {
  // Recursively collect all files from the selected folders
  const allFiles = collectFilesRecursively(selectedFiles, getNodeById);
  
  // Convert file nodes to context content
  return allFiles.map(convertFileToContext);
}

/**
 * Enhance a user message with file context markers
 * Adds metadata about attached files to the message
 */
export function enhanceMessageWithContext(
  message: string,
  fileContexts: FileContextContent[]
): string {
  if (fileContexts.length === 0) {
    return message;
  }

  // Format the file names in a cleaner way
  const fileNames = fileContexts
    .filter(file => file.type === "file") // Only include files, not folders
    .map(file => file.name);
  
  // Add context marker for the message component to detect and style
  if (fileNames.length > 0) {
    const contextMarker = `CONTEXT_FILES_PROVIDED:${JSON.stringify(fileNames)}`;
    return `${contextMarker}\n\n${message}`;
  }

  return message;
}

/**
 * Generate a summary text of file context for thinking/processing messages
 */
export function generateFileContextSummary(fileContexts: FileContextContent[]): string {
  if (fileContexts.length === 0) {
    return "";
  }

  let summary = "=== FILE CONTEXT SUMMARY ===\n\n";
  
  for (const file of fileContexts) {
    // Skip directory entries since we're already including their children separately
    if (file.type === "folder") {
      continue;
    }
    
    summary += `FILE: ${file.path}\n`;
    summary += `TYPE: ${file.type}\n`;
    summary += `CONTENT:\n\`\`\`\n${file.content || "[Empty file]"}\n\`\`\`\n\n`;
  }
  
  summary += "=== END OF FILE CONTEXT ===\n\n";
  
  return summary;
}

/**
 * Get a concise description of file context for UI display
 */
export function getFileContextDescription(fileContexts: FileContextContent[]): string {
  const fileCount = fileContexts.filter(f => f.type === "file").length;
  const folderCount = fileContexts.filter(f => f.type === "folder").length;
  
  const parts: string[] = [];
  if (fileCount > 0) parts.push(`${fileCount} file${fileCount !== 1 ? 's' : ''}`);
  if (folderCount > 0) parts.push(`${folderCount} folder${folderCount !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

/**
 * Generate thinking content with file context information
 */
export function generateThinkingContentWithContext(fileContexts: FileContextContent[]): string {
  if (fileContexts.length === 0) {
    return "Thinking about your query...";
  }
  
  return `Processing file context (${fileContexts.length} file${fileContexts.length > 1 ? 's' : ''})...\n\nAnalyzing the provided files and thinking about your query...`;
}
