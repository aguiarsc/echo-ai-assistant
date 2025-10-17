import { FileContextContent } from "./file-context-adapter";

export function buildSystemInstruction(
  baseInstruction: string,
  fileContext?: FileContextContent[]
): string {
  if (!fileContext || fileContext.length === 0) {
    return baseInstruction;
  }

  const fileContextInstruction = generateFileContextInstruction(fileContext);
  
  return baseInstruction 
    ? `${baseInstruction}\n\n${fileContextInstruction}`
    : fileContextInstruction;
}

export function prependToUserMessage(instruction: string, message: string): string {
  if (!instruction) return message;
  return `${instruction}\n\n${message}`;
}

export function createFileEditInstruction(editType?: string): string {
  const baseInstruction = `You are a file content editor. Your task is to edit the provided content according to the user's request. 

Rules:
- Make only the changes requested
- Preserve the original formatting and structure unless specifically asked to change it
- Return ONLY the edited content, no explanations or commentary
- Do not add introductory text or meta-commentary
- The output should be the complete edited file content`;

  if (!editType) return baseInstruction;

  const typeSpecificInstructions: Record<string, string> = {
    modify: 'Focus on making the specific changes requested while maintaining the overall structure and style.',
    improve: 'Enhance clarity, flow, and readability. Fix any grammatical issues and improve word choice.',
    rewrite: 'Completely rewrite the content with the same core message but better structure and expression.',
    fix: 'Identify and correct errors, inconsistencies, or issues in the text.',
    expand: 'Add more detail, examples, or elaboration while maintaining the original message.',
    summarize: 'Condense the content while preserving the key points and essential information.'
  };

  const specificInstruction = typeSpecificInstructions[editType] || '';
  
  return specificInstruction 
    ? `${baseInstruction}\n\n${specificInstruction}` 
    : baseInstruction;
}

export function createFileCreationInstruction(): string {
  return `You are a file content generator. Your task is to create clean, direct content for files without any conversational elements, introductions, or explanations.

IMPORTANT RULES:
- Generate ONLY the actual file content that should be saved
- Do NOT include any introductory text like "Here is..." or "I've created..."
- Do NOT include any explanatory text or commentary
- Do NOT add conversational elements or meta-commentary
- Start directly with the actual content
- The content should be complete and ready to use
- Format appropriately for the file type (markdown, text, etc.)

The user wants the raw content only, as if they were writing the file themselves.`;
}

function generateFileContextInstruction(files: FileContextContent[]): string {
  if (files.length === 0) return "";
  
  let instruction = `
=== START OF FILE CONTEXT ===

You have access to the following files from the user's project:

`;
  
  for (const file of files) {
    if (file.type === "folder") {
      continue;
    }
    
    instruction += `FILE PATH: ${file.path}\n`;
    instruction += `FILE TYPE: ${file.type}\n`;
    instruction += `CONTENT:\n\`\`\`\n${file.content || "[Empty File]"}\n\`\`\`\n\n`;
    instruction += `=== END OF FILE: ${file.path} ===\n\n`;
  }
  
  instruction += `=== END OF FILE CONTEXT ===\n\n`;
  
  instruction += `
IMPORTANT INSTRUCTIONS:
1. Use the file content above as your primary reference.
2. Apply your understanding and reasoning to provide helpful, complete responses.
3. When asked for recommendations or assessments, use your judgment based on the context.
4. If specific information isn't in the files and is needed, simply note that briefly.
5. Respond naturally without mentioning file paths or quoting boundaries.
6. Be helpful and direct in your responses without repeatedly mentioning limitations.
`;
  
  return instruction;
}
