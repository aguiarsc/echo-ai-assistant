/**
 * Intent parsing types for AI operations
 */

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
