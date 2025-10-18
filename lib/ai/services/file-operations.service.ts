/**
 * File operations service
 * Handles file creation and editing operations with AI assistance
 */

import { FileEditIntent, FileCreationIntent, FileOperationResult } from "@/lib/ai/types";
import { generateGeminiResponse } from "@/lib/ai/gemini/services/gemini-client.service";
import { cleanAIContent } from "@/lib/shared/utils/content-cleaner.utils";
import { createFileEditInstruction, createFileCreationInstruction, buildSystemInstruction } from "@/lib/ai/gemini/utils/system-instruction-builder.utils";
import { FileNode } from "@/lib/files/types";
import { convertFileToContext } from "@/lib/ai/gemini/utils/file-context-adapter.utils";

/**
 * Handle file edit intent
 */
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

    // Generate the edited content using AI
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
    
    // Store the edited content for diff view
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

/**
 * Handle file creation intent
 */
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

    // Enhance the content prompt based on file type
    let contentPrompt = enhanceContentPrompt(intent.fileName, intent.contentPrompt);
    
    // Create system instruction for clean file content generation
    const fileContentSystemInstruction = createFileCreationInstruction();
    
    // Prepare enhanced system instruction with file context if needed
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
    
    // Generate content directly using the API
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
    
    // Clean and update the file with the generated content
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

/**
 * Enhance content prompt based on file type and context
 */
function enhanceContentPrompt(fileName: string, contentPrompt: string): string {
  // If prompt is already substantial, use it as-is
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

/**
 * Generate status message for file operation
 */
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
