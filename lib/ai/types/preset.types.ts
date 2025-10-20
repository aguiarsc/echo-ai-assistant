/**
 * Preset types for AI writing styles
 */

export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export interface PresetSelectionResult {
  presetId: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}
