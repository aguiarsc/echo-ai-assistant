import { FileEditIntent, FileCreationIntent } from "./intent-parser-service";
import { generateGeminiResponse } from "@/infrastructure/ai-integration/gemini-client";
import { cleanAIContent } from "@/shared/utilities/content-cleaner";
import { createFileEditInstruction, createFileCreationInstruction, buildSystemInstruction } from "@/infrastructure/ai-integration/system-instruction-builder";
import { FileNode } from "../storage/project-store";
import { FileContextContent, convertFileToContext } from "@/infrastructure/ai-integration/file-context-adapter";

export interface FileOperationResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
  messageType?: 'FILE_EDIT_SUCCESS' | 'FILE_EDIT_ERROR' | 'FILE_EDIT_PROCESSING' | 'FILE_CREATION_SUCCESS' | 'FILE_CREATION_PROCESSING';
}

export async function handleFileEdit(
  intent: FileEditIntent,
  apiKey: string,
  model: "gemini-2.5-flash" | "gemini-2.0-flash" | string,
  generationParams: any,
  findFile: (fileName: string) => FileNode | undefined,
  setEditedContent: (fileId: string, content: string, prompt: string) => void
): Promise<FileOperationResult> {
  try {
    const fileToEdit = findFile(intent.fileName);
    
    if (!fileToEdit) {
      return {
        success: false,
        fileName: intent.fileName,
        error: `I couldn't find a file named "${intent.fileName}" in your file tree. Please check the filename or create the file first.`
      };
    }

    const editSystemInstruction = createFileEditInstruction(intent.editType);
    
    const editPrompt = `Edit the following content: "${intent.editPrompt}"

Original content:
${fileToEdit.content || ''}

Edited content (no explanations):`;

    const response = await generateGeminiResponse({
      apiKey,
      model: "gemini-2.5-flash" as any,
      messages: [{
        role: "user",
        content: editPrompt,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      }],
      systemInstruction: editSystemInstruction,
      params: {
        ...generationParams,
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    });

    const editedContent = response.text.trim();
    
    setEditedContent(fileToEdit.id, editedContent, intent.editPrompt);
    
    return {
      success: true,
      fileId: fileToEdit.id,
      fileName: fileToEdit.name,
      messageType: 'FILE_EDIT_SUCCESS'
    };
  } catch (error) {
    console.error("Error editing file:", error);
    return {
      success: false,
      fileName: intent.fileName,
      error: "An error occurred while editing the file",
      messageType: 'FILE_EDIT_ERROR'
    };
  }
}

export async function handleFileCreation(
  intent: FileCreationIntent,
  apiKey: string,
  model: string | any,
  generationParams: any,
  createOrGetFile: (fileName: string) => { fileId: string; existed: boolean },
  updateFileContent: (fileId: string, content: string) => void,
  selectedFiles: FileNode[]
): Promise<FileOperationResult> {
  try {
    const { fileId, existed } = createOrGetFile(intent.fileName);
    
    if (existed) {
      console.info(`File '${intent.fileName}' already exists, updating content...`);
    }

    let contentPrompt = enhanceContentPrompt(intent.fileName, intent.contentPrompt);
    
    const fileContentSystemInstruction = createFileCreationInstruction();
    
    let enhancedSystemInstruction = fileContentSystemInstruction;
    if (selectedFiles.length > 0) {
      const fileContexts = selectedFiles
        .filter(file => file.type === "file")
        .map(file => convertFileToContext(file));
      
      if (fileContexts.length > 0) {
        enhancedSystemInstruction = buildSystemInstruction(
          fileContentSystemInstruction,
          fileContexts
        );
      }
    }
    
    const response = await generateGeminiResponse({
      apiKey,
      model,
      messages: [{
        role: "user",
        content: contentPrompt,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      }],
      systemInstruction: enhancedSystemInstruction,
      params: generationParams
    });
    
    let generatedContent = response.text || "";
    generatedContent = cleanAIContent(generatedContent);
    
    updateFileContent(fileId, generatedContent);
    
    return {
      success: true,
      fileId,
      fileName: intent.fileName,
      messageType: 'FILE_CREATION_SUCCESS'
    };
  } catch (error) {
    console.error("Error creating file:", error);
    return {
      success: false,
      fileName: intent.fileName,
      error: "An error occurred while creating the file",
      messageType: 'FILE_CREATION_PROCESSING'
    };
  }
}

function enhanceContentPrompt(fileName: string, contentPrompt: string): string {
  if (contentPrompt && contentPrompt.length >= 10) {
    return contentPrompt;
  }
  
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (fileExt === 'md') {
    return `Create professional markdown content for a document named "${fileName}". Extract any relevant topic information from the filename and expand on it with appropriate structure and formatting.`;
  } else if (['txt', 'text'].includes(fileExt)) {
    return `Create text content for "${fileName}". If the filename suggests a specific topic, please focus on that.`;
  } else {
    return `Create appropriate content for a file named "${fileName}". Infer the desired content from the filename.`;
  }
}

export function generateFileOperationMessage(
  result: FileOperationResult,
  editPrompt?: string
): string {
  if (!result.success && result.error) {
    return result.error;
  }
  
  const fileName = result.fileName || 'file';
  const prompt = editPrompt || '';
  
  switch (result.messageType) {
    case 'FILE_EDIT_SUCCESS':
      return `FILE_EDIT_SUCCESS:${fileName}:${prompt}`;
    case 'FILE_EDIT_ERROR':
      return `FILE_EDIT_ERROR:${fileName}:${prompt}`;
    case 'FILE_EDIT_PROCESSING':
      return `FILE_EDIT_PROCESSING:${fileName}:${prompt}`;
    case 'FILE_CREATION_SUCCESS':
      return `FILE_CREATION_SUCCESS:${fileName}`;
    case 'FILE_CREATION_PROCESSING':
      return `FILE_CREATION_PROCESSING:${fileName}`;
    default:
      return `Operation completed for ${fileName}`;
  }
}
