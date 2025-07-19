// file-intent.ts
// Utility for detecting file creation intent in user prompts

export interface FileIntentResult {
  fileName: string;
  contentPrompt: string;
}

/**
 * Detects if the user prompt requests file creation with enhanced natural language support
 * Returns file name and content prompt if detected, or null otherwise.
 */
export function detectFileCreationIntent(prompt: string): FileIntentResult | null {
  // First attempt: explicit file creation patterns with filename extensions
  const creationVerbs = '(?:create|make|start|begin|write|draft|compose|prepare|produce|generate|open|save)';
  const fileTypes = '(?:file|document|note|report|memo|policy|contract|proposal|plan|analysis|summary|template|checklist|agenda|minutes)';
  const nameIndicators = '(?:called|named|titled|with name|with title|with filename)?';

  // More flexible regex with multiple patterns
  const patterns = [
    // Pattern 1: "create a file called example.md with..."
    new RegExp(`${creationVerbs}\s+(?:a|new|the)?\s+${fileTypes}\s+${nameIndicators}\s*["'\s]?([\w\s_.-]+\.[\w]+)["'\s]?(?:\s+(?:and|with|about|that|which|where|containing|that has|that contains|with content|with text)?\s*(.*))?`, 'i'),

    // Pattern 2: "example.md with content about..."
    new RegExp(`["'\s]?([\w\s_.-]+\.[\w]+)["'\s]?\s+(?:with|about|containing|that has|that contains|with content|with text|to write about)\s+(.*)`, 'i'),

    // Pattern 3: "save as example.md"  
    new RegExp(`(?:save|store|write|create)\s+(?:this|it|content|text)?\s+(?:as|in|to|into)\s+["'\s]?([\w\s_.-]+\.[\w]+)["'\s]?(?:\s+(.*))?`, 'i'),

    // Pattern 4: "I want a file called example.md that..."
    new RegExp(`(?:I want|I need|I'd like|can you|could you|please)\s+(?:create|make|write|prepare)\s+(?:a|new|the)?\s+${fileTypes}\s+${nameIndicators}\s*["'\s]?([\w\s_.-]+\.[\w]+)["'\s]?(?:\s+(.*))?`, 'i')
  ];

  // Helper function to extract just the actual filename (no leading verbs or indicators)
  const extractActualFilename = (fullMatch: string): string => {
    // Look for a string that has a file extension pattern
    const filenameExtraction = /([\w_.-]+\.[\w]{1,6})/.exec(fullMatch);
    return filenameExtraction ? filenameExtraction[1] : fullMatch;
  };

  // Try each pattern
  for (const regex of patterns) {
    const match = prompt.match(regex);
    if (match) {
      // Get the raw filename match and clean it up
      const rawFileName = match[1].trim();
      // Extract just the actual filename part
      const fileName = extractActualFilename(rawFileName);
      const contentPrompt = match[2]?.trim() || '';
      return { fileName, contentPrompt };
    }
  }

  // Fallback: look for standalone file patterns (with extension)
  const standaloneFilePattern = /(?:^|\s)([\w\s_.-]+\.[\w]{2,4})(?:$|\s)/;
  const standaloneMatch = prompt.match(standaloneFilePattern);
  if (standaloneMatch) {
    const rawFileName = standaloneMatch[1].trim();
    // Extract just the actual filename
    const fileName = extractActualFilename(rawFileName);
    // Extract everything after the filename as the content prompt
    const afterFileName = prompt.substring(prompt.indexOf(rawFileName) + rawFileName.length).trim();
    return { fileName, contentPrompt: afterFileName };
  }

  return null;
}
