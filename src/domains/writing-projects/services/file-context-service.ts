import { FileNode } from "../storage/project-store";
import { FileContextContent, convertFileToContext } from "@/infrastructure/ai-integration/file-context-adapter";

export function collectFilesRecursively(
  selectedFiles: FileNode[],
  getNodeById: (id: string) => FileNode | undefined
): FileNode[] {
  const result: FileNode[] = [];
  
  const processNode = (node: FileNode) => {
    if (node.type === "file") {
      result.push(node);
    } else if (node.type === "folder" && node.children) {
      result.push(node);
      
      node.children.forEach(childId => {
        const childNode = getNodeById(childId);
        if (childNode) {
          processNode(childNode);
        }
      });
    }
  };
  
  selectedFiles.forEach(processNode);
  
  return result;
}

export function prepareFileContext(
  selectedFiles: FileNode[],
  getNodeById: (id: string) => FileNode | undefined
): FileContextContent[] {
  const allFiles = collectFilesRecursively(selectedFiles, getNodeById);
  
  return allFiles.map(convertFileToContext);
}

export function enhanceMessageWithContext(
  message: string,
  fileContexts: FileContextContent[]
): string {
  if (fileContexts.length === 0) {
    return message;
  }

  const fileNames = fileContexts
    .filter(file => file.type === "file")
    .map(file => file.name);
  
  if (fileNames.length > 0) {
    const contextMarker = `CONTEXT_FILES_PROVIDED:${JSON.stringify(fileNames)}`;
    return `${contextMarker}\n\n${message}`;
  }

  return message;
}

export function generateFileContextSummary(fileContexts: FileContextContent[]): string {
  if (fileContexts.length === 0) {
    return "";
  }

  let summary = "=== FILE CONTEXT SUMMARY ===\n\n";
  
  for (const file of fileContexts) {
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

export function getFileContextDescription(fileContexts: FileContextContent[]): string {
  const fileCount = fileContexts.filter(f => f.type === "file").length;
  const folderCount = fileContexts.filter(f => f.type === "folder").length;
  
  const parts: string[] = [];
  if (fileCount > 0) parts.push(`${fileCount} file${fileCount !== 1 ? 's' : ''}`);
  if (folderCount > 0) parts.push(`${folderCount} folder${folderCount !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

export function generateThinkingContentWithContext(fileContexts: FileContextContent[]): string {
  if (fileContexts.length === 0) {
    return "Thinking about your query...";
  }
  
  return `Processing file context (${fileContexts.length} file${fileContexts.length > 1 ? 's' : ''})...\n\nAnalyzing the provided files and thinking about your query...`;
}
