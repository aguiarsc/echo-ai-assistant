import { generateGeminiResponse } from "@/infrastructure/ai-integration/gemini-client";
import { GeminiModel } from "@/domains/conversations/types/conversation.types";
import { buildConversationContext } from "@/infrastructure/ai-integration/message-formatter";

export interface FileCreationIntent {
  type: 'create';
  fileName: string;
  contentPrompt: string;
}

export interface FileEditIntent {
  type: 'edit';
  fileName: string;
  editPrompt: string;
  editType: 'modify' | 'improve' | 'rewrite' | 'fix' | 'expand' | 'summarize';
}

export type IntentResult = FileCreationIntent | FileEditIntent | null;

export async function parseFileIntent(
  prompt: string,
  apiKey: string,
  model: GeminiModel = 'gemini-2.0-flash',
  conversationHistory: Array<{ role: 'user' | 'model', content: string }> = []
): Promise<IntentResult> {
  try {
    const contextSummary = buildConversationContext(
      conversationHistory as any
    );

    const response = await generateGeminiResponse({
      apiKey,
      model,
      messages: [
        {
          id: 'system',
          role: 'system',
          content: `Analyze the user's request and determine if they want to create or edit a file.

Use the conversation context to resolve references like "it", "the file", "that word", etc.

Respond with ONLY a JSON object (no markdown, no explanations):

For file creation:
{
  "type": "create",
  "fileName": "example.md",
  "contentPrompt": "what content they want (can be 'random word' or specific instructions)"
}

For file editing:
{
  "type": "edit",
  "fileName": "example.md",
  "editPrompt": "what changes they want (resolve 'it', 'that', references using context)",
  "editType": "modify|improve|rewrite|fix|expand|summarize"
}

If not a file operation:
{
  "type": null
}

Rules:
- Use conversation context to identify which file is being referenced
- Look for recently created/mentioned files in the context
- Resolve pronouns: "it" = last file, "the file" = last file mentioned
- "create", "make", "write", "new" = creation
- "edit", "modify", "change", "update", "fix", "improve", "replace" = editing
- If user says "random word" or similar, set contentPrompt to "generate a random word"
- Be smart about implicit references${contextSummary}`,
          timestamp: Date.now()
        },
        {
          id: 'user',
          role: 'user',
          content: prompt,
          timestamp: Date.now()
        }
      ],
      params: {
        temperature: 0.1,
        topP: 0.9,
        topK: 20,
        maxOutputTokens: 150,
        safetySettings: []
      }
    });

    const cleanText = response.text.trim().replace(/```json\n?|\n?```/g, '');
    const parsed = JSON.parse(cleanText);

    if (parsed.type === 'create') {
      return {
        type: 'create',
        fileName: parsed.fileName,
        contentPrompt: parsed.contentPrompt || ''
      };
    }

    if (parsed.type === 'edit') {
      return {
        type: 'edit',
        fileName: parsed.fileName,
        editPrompt: parsed.editPrompt || '',
        editType: parsed.editType || 'modify'
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse intent with Gemini:', error);
    return null;
  }
}

export function generateEditSystemInstruction(editType: FileEditIntent['editType']): string {
  const baseInstruction = `You are an expert editor helping to improve written content. Your task is to edit the provided text according to the user's request.

IMPORTANT EDITING GUIDELINES:
1. Make precise, targeted changes that address the specific request
2. Preserve the original tone and style unless explicitly asked to change it
3. Maintain the markdown formatting structure
4. Only make necessary changes - don't over-edit
5. Ensure the edited version flows naturally
6. Keep the same general length unless asked to expand or summarize

`;

  const typeSpecificInstructions = {
    modify: 'Focus on making the specific changes requested while maintaining the overall structure and style.',
    improve: 'Enhance clarity, flow, and readability. Fix any grammatical issues and improve word choice.',
    rewrite: 'Completely rewrite the content with the same core message but better structure and expression.',
    fix: 'Identify and correct errors, inconsistencies, or issues in the text.',
    expand: 'Add more detail, examples, or elaboration while maintaining the original message.',
    summarize: 'Condense the content while preserving the key points and essential information.'
  };

  return baseInstruction + typeSpecificInstructions[editType] + '\n\nProvide only the edited text without any explanations or comments.';
}
