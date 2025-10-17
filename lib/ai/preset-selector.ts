// preset-selector.ts
// Use Gemini to intelligently select the best writing preset for a given task

import { generateGeminiResponse } from "@/lib/gemini/api";
import { GeminiModel } from "@/lib/gemini";
import { PROMPT_PRESETS } from "@/lib/ai/presets";

export interface PresetSelectionResult {
  presetId: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

/**
 * Use Gemini to analyze the task and select the most appropriate writing preset
 * Returns null if no specific preset is strongly recommended
 */
export async function selectBestPreset(
  task: string,
  apiKey: string,
  model: GeminiModel = 'gemini-2.0-flash',
  conversationHistory: Array<{ role: 'user' | 'model', content: string }> = []
): Promise<PresetSelectionResult> {
  try {
    // Build conversation context summary
    let contextSummary = '';
    if (conversationHistory.length > 0) {
      contextSummary = '\n\nRECENT CONVERSATION CONTEXT:\n';
      contextSummary += conversationHistory
        .slice(-3) // Last 3 messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.slice(0, 200)}`)
        .join('\n');
    }

    // Build preset descriptions for the AI
    const presetDescriptions = PROMPT_PRESETS.map(preset => 
      `- "${preset.id}": ${preset.name} - ${preset.description}`
    ).join('\n');

    const response = await generateGeminiResponse({
      apiKey,
      model,
      messages: [
        {
          id: 'system',
          role: 'system',
          content: `You are an expert at analyzing creative writing tasks and matching them to the optimal writing style preset.

AVAILABLE PRESETS:
${presetDescriptions}

Analyze the user's request and select the single most appropriate preset. Consider:
- Primary focus of the task (scene-building, dialogue, action, emotion, etc.)
- Level of detail requested
- Specific writing goals mentioned
- Context from recent conversation

Respond with ONLY a JSON object (no markdown, no explanations):

{
  "presetId": "preset-id-here",
  "confidence": "high|medium|low",
  "reasoning": "brief explanation why this preset fits best"
}

Selection guidelines:
- "novel-master": Balanced general writing, no specific focus area
- "scene-builder": Dense scenes with sensory detail and spatial awareness
- "character-voice": Dialogue-heavy or character personality focus
- "prose-maximalist": Literary, rich language, metaphorical writing
- "world-immersion": Setting/worldbuilding, culture, environment focus
- "natural-dialogue": Conversation-focused, authentic speech patterns
- "action-dynamics": Action scenes, movement, kinetic sequences
- "emotional-depth": Internal states, psychological complexity
- "pacing-control": Rhythm manipulation, tempo changes, varied pacing

Use "high" confidence when task clearly matches one preset.
Use "medium" when multiple presets could work but one is slightly better.
Use "low" when task is too general or multiple presets are equally valid.
Set presetId to null only if absolutely no preset fits.${contextSummary}`,
          timestamp: Date.now()
        },
        {
          id: 'user',
          role: 'user',
          content: task,
          timestamp: Date.now()
        }
      ],
      params: {
        temperature: 0.2, // Low temperature for consistent selections
        topP: 0.9,
        topK: 20,
        maxOutputTokens: 200,
        safetySettings: []
      }
    });

    // Parse the JSON response
    const cleanText = response.text.trim().replace(/```json\n?|\n?```/g, '');
    const parsed = JSON.parse(cleanText);

    // Validate the preset exists
    if (parsed.presetId) {
      const presetExists = PROMPT_PRESETS.some(p => p.id === parsed.presetId);
      if (!presetExists) {
        console.warn(`AI selected invalid preset: ${parsed.presetId}`);
        return { presetId: null, confidence: 'low' };
      }
    }

    return {
      presetId: parsed.presetId || null,
      confidence: parsed.confidence || 'medium',
      reasoning: parsed.reasoning
    };
  } catch (error) {
    console.error('Failed to select preset with Gemini:', error);
    return { presetId: null, confidence: 'low' };
  }
}

/**
 * Get a human-readable description of why a preset was selected
 */
export function getPresetSelectionMessage(result: PresetSelectionResult): string {
  if (!result.presetId) {
    return 'Using default settings';
  }

  const preset = PROMPT_PRESETS.find(p => p.id === result.presetId);
  if (!preset) {
    return 'Using default settings';
  }

  const confidenceEmoji = {
    high: '🎯',
    medium: '👍',
    low: '💭'
  }[result.confidence];

  return `${confidenceEmoji} Selected **${preset.name}** preset${result.reasoning ? `: ${result.reasoning}` : ''}`;
}
