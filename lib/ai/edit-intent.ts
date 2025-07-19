// edit-intent.ts
// Utility for detecting file edit intent in user prompts

export interface EditIntentResult {
  fileName: string;
  editPrompt: string;
  editType: 'modify' | 'improve' | 'rewrite' | 'fix' | 'expand' | 'summarize';
}

/**
 * Detects if the user prompt requests file editing with enhanced natural language support
 * Returns file name and edit prompt if detected, or null otherwise.
 */
export function detectFileEditIntent(prompt: string): EditIntentResult | null {
  // First check if this is a file creation intent - if so, don't treat as edit
  const creationKeywords = /\b(create|make|start|begin|write|draft|compose|prepare|produce|generate|new)\s+(?:a|the)?\s*(?:file|document|note|story|chapter)/i;
  if (creationKeywords.test(prompt)) {
    return null;
  }
  
  // Edit action verbs - specifically exclude creation verbs
  const editVerbs = '(?:edit|modify|change|update|improve|rewrite|fix|correct|enhance|revise|refactor|polish|expand|summarize|shorten|adjust|alter|refine)';
  const targetIndicators = '(?:in|of|for|the)';
  
  // Patterns for detecting edit intent - more specific to avoid file creation overlap
  const patterns = [
    // Pattern 1: "edit filename.md to..." - must start with edit verb
    new RegExp(`^${editVerbs}\\s+(?:the\\s+)?([\\w\\s_.-]+\\.\\w+)\\s+(?:to|by|and|so that|in order to)\\s+(.+)`, 'i'),
    
    // Pattern 2: "edit filename.md adding/removing/etc..." - direct action without connector
    new RegExp(`^${editVerbs}\\s+(?:the\\s+)?([\\w\\s_.-]+\\.\\w+)\\s+(.+)`, 'i'),
    
    // Pattern 3: "modify the content in filename.md..." - must start with edit verb
    new RegExp(`^${editVerbs}\\s+(?:the\\s+)?(?:content|text)\\s+${targetIndicators}\\s+([\\w\\s_.-]+\\.\\w+)\\s+(?:to|by|and|so that)?\\s*(.+)`, 'i'),
    
    // Pattern 4: "improve filename.md by..." - must start with edit verb
    new RegExp(`^${editVerbs}\\s+([\\w\\s_.-]+\\.\\w+)\\s+(?:by|to|and|so that)\\s+(.+)`, 'i'),
    
    // Pattern 5: "in filename.md, change..." - location first, then edit verb
    new RegExp(`^(?:in|for)\\s+([\\w\\s_.-]+\\.\\w+),?\\s+${editVerbs}\\s+(.+)`, 'i'),
    
    // Pattern 6: "filename.md needs to be..." - requirement pattern
    new RegExp(`^([\\w\\s_.-]+\\.\\w+)\\s+(?:needs to be|should be|must be)\\s+(.+)`, 'i'),
    
    // Pattern 7: "can you edit filename.md to..." - polite request with edit verb
    new RegExp(`^(?:can you|could you|please)\\s+${editVerbs}\\s+([\\w\\s_.-]+\\.\\w+)\\s+(?:to|by|and|so that)?\\s*(.+)`, 'i')
  ];

  // Helper function to determine edit type based on prompt
  const determineEditType = (editPrompt: string): EditIntentResult['editType'] => {
    const prompt = editPrompt.toLowerCase();
    
    if (prompt.includes('fix') || prompt.includes('correct') || prompt.includes('error')) {
      return 'fix';
    }
    if (prompt.includes('improve') || prompt.includes('enhance') || prompt.includes('polish') || prompt.includes('better')) {
      return 'improve';
    }
    if (prompt.includes('rewrite') || prompt.includes('completely') || prompt.includes('from scratch')) {
      return 'rewrite';
    }
    if (prompt.includes('expand') || prompt.includes('add more') || prompt.includes('elaborate') || prompt.includes('detail')) {
      return 'expand';
    }
    if (prompt.includes('summarize') || prompt.includes('shorten') || prompt.includes('condense') || prompt.includes('brief')) {
      return 'summarize';
    }
    
    return 'modify'; // Default
  };

  // Helper function to extract just the actual filename
  const extractActualFilename = (fullMatch: string): string => {
    const filenameExtraction = /([\\w_.-]+\\.\\w{1,6})/.exec(fullMatch);
    return filenameExtraction ? filenameExtraction[1] : fullMatch;
  };

  // Try each pattern
  for (const regex of patterns) {
    const match = prompt.match(regex);
    if (match) {
      const rawFileName = match[1].trim();
      const fileName = extractActualFilename(rawFileName);
      const editPrompt = match[2]?.trim() || '';
      const editType = determineEditType(editPrompt);
      
      return { fileName, editPrompt, editType };
    }
  }

  return null;
}

/**
 * Generate a system instruction for AI file editing
 */
export function generateEditSystemInstruction(editType: EditIntentResult['editType']): string {
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
